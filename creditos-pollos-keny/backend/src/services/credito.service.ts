import crypto from 'node:crypto';
import { db } from '../db';
import { AppError } from '../lib/errors';
import { addDays, formatFechaEs, toDateString, toDateTimeString } from '../lib/dates';
import { getParametroNumero } from './parametros.service';
import { construirFactura, generarYGuardarFactura } from './factura.service';
import { EmailTemplates } from './email.templates';
import { enviarEmail } from './email.service';
import { actualizarScore } from './scoring.service';
import { registrarEventoCredito } from './analytics.service';
import {
  toNumber,
  type CreditoRow,
  type EmprendedorRow,
  type EstadoCredito,
  type JwtPayload,
  type MetodoPago,
  type TipoCredito,
} from '../types';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface TotalesCredito {
  montoTotal: number;
  tasaInteres: number;
  intereses: number;
  totalPagar: number;
  montoPagado: number;
  saldoPendiente: number;
  porcentajePagado: number;
}

export function totalesCredito(credito: Pick<CreditoRow, 'monto_total' | 'tasa_interes' | 'monto_pagado'>): TotalesCredito {
  const montoTotal = toNumber(credito.monto_total);
  const tasaInteres = toNumber(credito.tasa_interes);
  const intereses = round2(montoTotal * (tasaInteres / 100));
  const totalPagar = round2(montoTotal + intereses);
  const montoPagado = toNumber(credito.monto_pagado);
  const saldoPendiente = Math.max(0, round2(totalPagar - montoPagado));

  return {
    montoTotal,
    tasaInteres,
    intereses,
    totalPagar,
    montoPagado,
    saldoPendiente,
    porcentajePagado: totalPagar > 0 ? round2((montoPagado / totalPagar) * 100) : 0,
  };
}

const SELECT_CREDITO = `
  SELECT c.*, e.nombre AS emprendedor_nombre, e.cedula AS emprendedor_cedula,
         e.email AS emprendedor_email, e.telefono AS emprendedor_telefono,
         e.ubicacion AS emprendedor_ubicacion, e.score_crediticio
  FROM creditos c
  JOIN emprendedores e ON e.id = c.emprendedor_id
`;

function puedeVer(credito: { emprendedor_id: string }, viewer: JwtPayload): boolean {
  if (viewer.rol === 'EMPRENDEDOR') return credito.emprendedor_id === viewer.emprendedorId;
  return true;
}

export const CreditoService = {
  async listar(
    filtros: {
      estado?: EstadoCredito | string;
      tipo?: TipoCredito | string;
      emprendedorId?: string;
      q?: string;
      page?: number;
      limit?: number;
    },
    viewer: JwtPayload
  ) {
    const page = Math.max(1, Number(filtros.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(filtros.limit ?? 20)));
    const offset = (page - 1) * limit;

    const where: string[] = [];
    const params: unknown[] = [];

    if (viewer.rol === 'EMPRENDEDOR') {
      where.push('c.emprendedor_id = ?');
      params.push(viewer.emprendedorId);
    } else if (filtros.emprendedorId) {
      where.push('c.emprendedor_id = ?');
      params.push(filtros.emprendedorId);
    }

    if (filtros.estado) {
      where.push('c.estado = ?');
      params.push(filtros.estado);
    }
    if (filtros.tipo) {
      where.push('c.tipo = ?');
      params.push(filtros.tipo);
    }
    if (filtros.q) {
      where.push('(e.nombre LIKE ? OR e.cedula LIKE ? OR c.factura_numero LIKE ?)');
      params.push(`%${filtros.q}%`, `%${filtros.q}%`, `%${filtros.q}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const totalRow = await db.get<{ total: number }>(
      `SELECT COUNT(*) AS total FROM creditos c JOIN emprendedores e ON e.id = c.emprendedor_id ${whereSql}`,
      params
    );
    const total = toNumber(totalRow?.total);

    const rows = await db.all<Record<string, unknown>>(
      `${SELECT_CREDITO} ${whereSql}
       ORDER BY c.fecha_solicitud DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      data: rows.map((row) => ({ ...row, totales: totalesCredito(row as unknown as CreditoRow) })),
      meta: { total, page, limit, paginas: Math.ceil(total / limit) || 1 },
    };
  },

  async obtener(id: string, viewer: JwtPayload) {
    const credito = await db.get<Record<string, unknown>>(`${SELECT_CREDITO} WHERE c.id = ?`, [id]);
    if (!credito) throw AppError.notFound('Crédito no encontrado');
    if (!puedeVer(credito as { emprendedor_id: string }, viewer)) {
      throw AppError.forbidden('No tienes acceso a este crédito');
    }

    const pagos = await db.all(
      'SELECT id, monto, metodo_pago, referencia, nota, fecha_pago FROM pagos WHERE credito_id = ? ORDER BY fecha_pago DESC',
      [id]
    );

    const factura = await db.get(
      'SELECT id, numero, total, pdf_path, emitida_en FROM facturas WHERE credito_id = ?',
      [id]
    );

    return {
      ...credito,
      totales: totalesCredito(credito as unknown as CreditoRow),
      pagos,
      factura: factura ?? null,
    };
  },

  async solicitar(
    emprendedorId: string,
    data: { tipo: TipoCredito; cantidad: number; notas?: string }
  ) {
    const emprendedor = await db.get<EmprendedorRow>(
      'SELECT * FROM emprendedores WHERE id = ? AND activo = 1',
      [emprendedorId]
    );
    if (!emprendedor) throw AppError.notFound('Emprendedor no encontrado o inactivo');

    const tipo = String(data.tipo).toUpperCase() as TipoCredito;
    if (!['POLLOS', 'CERDOS'].includes(tipo)) throw AppError.badRequest('Tipo de crédito inválido');

    const cantidad = Number(data.cantidad);
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw AppError.badRequest('La cantidad debe ser un número entero mayor a cero');
    }

    const maxCantidad = await getParametroNumero(tipo === 'POLLOS' ? 'CANTIDAD_MAX_POLLOS' : 'CANTIDAD_MAX_CERDOS');
    if (maxCantidad > 0 && cantidad > maxCantidad) {
      throw AppError.badRequest(`La cantidad máxima para ${tipo.toLowerCase()} es ${maxCantidad}`);
    }

    const valorUnitario = await getParametroNumero(tipo === 'POLLOS' ? 'PRECIO_POLLO' : 'PRECIO_CERDO');
    const tasaInteres = await getParametroNumero('TASA_INTERES');
    const plazoDias = await getParametroNumero('PLAZO_DIAS');

    const montoTotal = round2(cantidad * valorUnitario);
    const hoy = new Date();
    const id = crypto.randomUUID();

    await db.run(
      `INSERT INTO creditos
        (id, emprendedor_id, tipo, cantidad, valor_unitario, monto_total, tasa_interes,
         monto_pagado, fecha_entrega, fecha_vencimiento, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'SOLICITADO')`,
      [
        id,
        emprendedorId,
        tipo,
        cantidad,
        valorUnitario,
        montoTotal,
        tasaInteres,
        toDateString(hoy),
        toDateString(addDays(hoy, plazoDias || 45)),
      ]
    );

    const totalPagar = round2(montoTotal * (1 + tasaInteres / 100));
    await enviarEmail({
      to: emprendedor.email,
      subject: '🐔 Solicitud de crédito recibida — Pollos Keny',
      html: EmailTemplates.solicitudRecibida({
        nombre: emprendedor.nombre,
        tipo,
        cantidad,
        montoTotal,
        tasaInteres,
        totalPagar,
        fechaVencimiento: toDateString(addDays(hoy, plazoDias || 45)),
      }),
      tipo: 'SOLICITUD_RECIBIDA',
      creditoId: id,
      emprendedorId,
    });

    await registrarEventoCredito(id, 'SOLICITUD', 'SOLICITADO', montoTotal);

    return { id, montoTotal, tasaInteres, totalPagar, estado: 'SOLICITADO' as EstadoCredito };
  },

  async aprobar(id: string, adminId: string) {
    const credito = await db.get<CreditoRow>('SELECT * FROM creditos WHERE id = ?', [id]);
    if (!credito) throw AppError.notFound('Crédito no encontrado');
    if (credito.estado !== 'SOLICITADO') {
      throw AppError.badRequest(`Solo se pueden aprobar créditos en estado SOLICITADO (actual: ${credito.estado})`);
    }

    const emprendedor = await db.get<EmprendedorRow>('SELECT * FROM emprendedores WHERE id = ?', [
      credito.emprendedor_id,
    ]);
    if (!emprendedor) throw AppError.notFound('Emprendedor no encontrado');

    const impuestosPorcentaje = await getParametroNumero('IMPUESTO_PORCENTAJE');
    const numero = `FK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${id.slice(0, 6).toUpperCase()}`;
    const datosFactura = construirFactura(credito, emprendedor, numero, 0);
    const totalesFactura = totalesCredito(credito);

    const { buffer, filePath, fileName } = await generarYGuardarFactura(datosFactura);

    await db.transaction(async () => {
      await db.run(
        `UPDATE creditos
         SET estado = 'APROBADO', factura_numero = ?, fecha_aprobacion = ?, fecha_actualizacion = ?
         WHERE id = ?`,
        [numero, toDateTimeString(), toDateTimeString(), id]
      );
      await db.run(
        `INSERT INTO facturas (id, numero, credito_id, emprendedor_id, subtotal, impuestos, total, pdf_path)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          numero,
          id,
          credito.emprendedor_id,
          datosFactura.subtotal,
          round2(datosFactura.subtotal * (impuestosPorcentaje / 100)),
          totalesFactura.totalPagar,
          filePath,
        ]
      );
    });

    await enviarEmail({
      to: emprendedor.email,
      subject: `✅ Crédito aprobado — Factura ${numero}`,
      html: EmailTemplates.creditoAprobado({
        nombre: emprendedor.nombre,
        facturaNumero: numero,
        tipo: credito.tipo,
        cantidad: credito.cantidad,
        montoTotal: totalesFactura.montoTotal,
        tasaInteres: totalesFactura.tasaInteres,
        totalPagar: totalesFactura.totalPagar,
        fechaVencimiento: credito.fecha_vencimiento,
      }),
      attachments: [{ filename: fileName, content: buffer, contentType: 'application/pdf' }],
      tipo: 'CREDITO_APROBADO',
      creditoId: id,
      emprendedorId: credito.emprendedor_id,
    });

    await registrarEventoCredito(id, 'APROBACION', 'APROBADO', totalesFactura.montoTotal);
    await actualizarScore(credito.emprendedor_id);

    return {
      id,
      estado: 'APROBADO' as EstadoCredito,
      facturaNumero: numero,
      factura: { numero, total: totalesFactura.totalPagar, pdfPath: filePath },
      aprobadoPor: adminId,
    };
  },

  async rechazar(id: string, motivo: string, adminId: string) {
    const credito = await db.get<CreditoRow>('SELECT * FROM creditos WHERE id = ?', [id]);
    if (!credito) throw AppError.notFound('Crédito no encontrado');
    if (!['SOLICITADO', 'APROBADO'].includes(credito.estado)) {
      throw AppError.badRequest(`No se puede rechazar un crédito en estado ${credito.estado}`);
    }

    await db.run(
      `UPDATE creditos SET estado = 'RECHAZADO', motivo_rechazo = ?, fecha_actualizacion = ? WHERE id = ?`,
      [motivo, toDateTimeString(), id]
    );

    const emprendedor = await db.get<EmprendedorRow>('SELECT * FROM emprendedores WHERE id = ?', [
      credito.emprendedor_id,
    ]);

    if (emprendedor) {
      await enviarEmail({
        to: emprendedor.email,
        subject: '❌ Solicitud de crédito no aprobada — Pollos Keny',
        html: EmailTemplates.creditoRechazado({
          nombre: emprendedor.nombre,
          tipo: credito.tipo,
          montoTotal: toNumber(credito.monto_total),
          motivo,
        }),
        tipo: 'CREDITO_RECHAZADO',
        creditoId: id,
        emprendedorId: credito.emprendedor_id,
      });
    }

    await registrarEventoCredito(id, 'RECHAZO', 'RECHAZADO', toNumber(credito.monto_total), motivo);
    await actualizarScore(credito.emprendedor_id);

    return { id, estado: 'RECHAZADO' as EstadoCredito, motivo };
  },

  async entregar(id: string) {
    const credito = await db.get<CreditoRow>('SELECT * FROM creditos WHERE id = ?', [id]);
    if (!credito) throw AppError.notFound('Crédito no encontrado');
    if (credito.estado !== 'APROBADO') {
      throw AppError.badRequest('Solo se pueden entregar créditos aprobados');
    }

    await db.run(
      `UPDATE creditos SET estado = 'ENTREGADO', fecha_entrega = ?, fecha_actualizacion = ? WHERE id = ?`,
      [toDateString(new Date()), toDateTimeString(), id]
    );

    await registrarEventoCredito(id, 'ENTREGA', 'ENTREGADO', toNumber(credito.monto_total));
    return { id, estado: 'ENTREGADO' as EstadoCredito };
  },

  async cancelar(id: string, motivo: string) {
    const credito = await db.get<CreditoRow>('SELECT * FROM creditos WHERE id = ?', [id]);
    if (!credito) throw AppError.notFound('Crédito no encontrado');
    if (['PAGADO', 'CANCELADO'].includes(credito.estado)) {
      throw AppError.badRequest(`No se puede cancelar un crédito en estado ${credito.estado}`);
    }

    await db.run(
      `UPDATE creditos SET estado = 'CANCELADO', motivo_rechazo = ?, fecha_actualizacion = ? WHERE id = ?`,
      [motivo ?? 'Cancelado por administración', toDateTimeString(), id]
    );

    await registrarEventoCredito(id, 'CANCELACION', 'CANCELADO', toNumber(credito.monto_total), motivo);
    await actualizarScore(credito.emprendedor_id);
    return { id, estado: 'CANCELADO' as EstadoCredito };
  },

  async registrarPago(
    creditoId: string,
    data: { monto: number; metodoPago: MetodoPago; referencia?: string; nota?: string },
    usuario: JwtPayload
  ) {
    const credito = await db.get<CreditoRow>('SELECT * FROM creditos WHERE id = ?', [creditoId]);
    if (!credito) throw AppError.notFound('Crédito no encontrado');

    if (usuario.rol === 'EMPRENDEDOR' && credito.emprendedor_id !== usuario.emprendedorId) {
      throw AppError.forbidden('No puedes registrar pagos de otro emprendedor');
    }
    if (!['APROBADO', 'ENTREGADO', 'MORA'].includes(credito.estado)) {
      throw AppError.badRequest(`No se pueden registrar pagos en estado ${credito.estado}`);
    }

    const monto = round2(Number(data.monto));
    if (!Number.isFinite(monto) || monto <= 0) throw AppError.badRequest('El monto debe ser mayor a cero');

    const totales = totalesCredito(credito);
    if (monto > totales.saldoPendiente + 0.01) {
      throw AppError.badRequest(
        `El monto excede el saldo pendiente (${totales.saldoPendiente.toFixed(2)})`
      );
    }

    const metodoPago = String(data.metodoPago ?? 'EFECTIVO').toUpperCase() as MetodoPago;
    if (!['EFECTIVO', 'TRANSFERENCIA', 'BINANCE', 'OTRO'].includes(metodoPago)) {
      throw AppError.badRequest('Método de pago inválido');
    }

    const pagoId = crypto.randomUUID();
    const nuevoPagado = round2(totales.montoPagado + monto);
    const nuevoSaldo = Math.max(0, round2(totales.totalPagar - nuevoPagado));
    const quedaPagado = nuevoSaldo <= 0.01;

    await db.transaction(async () => {
      await db.run(
        `INSERT INTO pagos (id, credito_id, monto, metodo_pago, referencia, nota, registrado_por)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [pagoId, creditoId, monto, metodoPago, data.referencia ?? null, data.nota ?? null, usuario.userId]
      );
      await db.run(
        `UPDATE creditos
         SET monto_pagado = ?, estado = ?, fecha_actualizacion = ?
         WHERE id = ?`,
        [nuevoPagado, quedaPagado ? 'PAGADO' : credito.estado, toDateTimeString(), creditoId]
      );
    });

    const emprendedor = await db.get<EmprendedorRow>('SELECT * FROM emprendedores WHERE id = ?', [
      credito.emprendedor_id,
    ]);

    if (emprendedor) {
      await enviarEmail({
        to: emprendedor.email,
        subject: '💰 Pago registrado — Pollos Keny',
        html: EmailTemplates.pagoRecibido({
          nombre: emprendedor.nombre,
          monto,
          saldoPendiente: nuevoSaldo,
          metodoPago,
          referencia: data.referencia ?? 'N/A',
          fecha: toDateTimeString(),
        }),
        tipo: 'PAGO_RECIBIDO',
        creditoId,
        emprendedorId: credito.emprendedor_id,
      });

      if (quedaPagado) {
        await enviarEmail({
          to: emprendedor.email,
          subject: '🏆 Crédito saldado — Pollos Keny',
          html: EmailTemplates.creditoPagado(emprendedor.nombre, credito.factura_numero ?? 'sin factura'),
          tipo: 'CREDITO_PAGADO',
          creditoId,
          emprendedorId: credito.emprendedor_id,
        });
      }
    }

    await registrarEventoCredito(creditoId, 'PAGO', quedaPagado ? 'PAGADO' : credito.estado, monto);
    await actualizarScore(credito.emprendedor_id);

    return {
      pago: { id: pagoId, monto, metodoPago, fechaPago: toDateTimeString() },
      saldoPendiente: nuevoSaldo,
      estado: quedaPagado ? ('PAGADO' as EstadoCredito) : credito.estado,
      totalPagado: nuevoPagado,
    };
  },

  async pagos(creditoId: string, viewer: JwtPayload) {
    const credito = await db.get<CreditoRow>('SELECT * FROM creditos WHERE id = ?', [creditoId]);
    if (!credito) throw AppError.notFound('Crédito no encontrado');
    if (!puedeVer(credito, viewer)) throw AppError.forbidden('No tienes acceso a este crédito');

    return db.all('SELECT * FROM pagos WHERE credito_id = ? ORDER BY fecha_pago DESC', [creditoId]);
  },

  async factura(creditoId: string, viewer: JwtPayload) {
    const credito = await db.get<CreditoRow>('SELECT * FROM creditos WHERE id = ?', [creditoId]);
    if (!credito) throw AppError.notFound('Crédito no encontrado');
    if (!puedeVer(credito, viewer)) throw AppError.forbidden('No tienes acceso a esta factura');

    const factura = await db.get<{
      numero: string;
      pdf_path: string | null;
      total: number;
      emitida_en: string;
    }>('SELECT numero, pdf_path, total, emitida_en FROM facturas WHERE credito_id = ?', [creditoId]);

    if (!factura) throw AppError.notFound('Este crédito aún no tiene factura emitida');

    return {
      numero: factura.numero,
      total: toNumber(factura.total),
      emitidaEn: factura.emitida_en,
      filePath: factura.pdf_path,
      fileName: `factura-${factura.numero}.pdf`,
    };
  },

  /** Marca como MORA los créditos vencidos (usado por el cron diario). */
  async marcarMora(): Promise<number> {
    const rows = await db.all<{ id: string; emprendedor_id: string; fecha_vencimiento: string }>(
      `SELECT id, emprendedor_id, fecha_vencimiento FROM creditos
       WHERE estado IN ('APROBADO','ENTREGADO') AND fecha_vencimiento < ?`,
      [toDateString(new Date())]
    );

    for (const row of rows) {
      await db.run(
        `UPDATE creditos SET estado = 'MORA', fecha_actualizacion = ? WHERE id = ?`,
        [toDateTimeString(), row.id]
      );
      await registrarEventoCredito(row.id, 'MORA', 'MORA', null, `Venció el ${formatFechaEs(row.fecha_vencimiento)}`);
      await actualizarScore(row.emprendedor_id);
    }

    return rows.length;
  },

  /** Recordatorios de vencimiento (5, 2 y 0 días). */
  async enviarRecordatorios(): Promise<number> {
    const hoy = new Date();
    const objetivos = [5, 2, 0];
    let enviados = 0;

    for (const dias of objetivos) {
      const fecha = toDateString(addDays(hoy, dias));
      const rows = await db.all<Record<string, unknown>>(
        `${SELECT_CREDITO}
         WHERE c.fecha_vencimiento = ? AND c.estado IN ('APROBADO','ENTREGADO','MORA')`,
        [fecha]
      );

      for (const row of rows) {
        const credito = row as unknown as CreditoRow & { emprendedor_nombre: string; emprendedor_email: string };
        const totales = totalesCredito(credito);
        if (totales.saldoPendiente <= 0) continue;

        await enviarEmail({
          to: credito.emprendedor_email,
          subject:
            dias === 0
              ? '⚠️ Tu crédito vence hoy — Pollos Keny'
              : `⏳ Tu crédito vence en ${dias} días — Pollos Keny`,
          html: EmailTemplates.recordatorioVencimiento({
            nombre: credito.emprendedor_nombre,
            facturaNumero: credito.factura_numero ?? 'sin factura',
            saldoPendiente: totales.saldoPendiente,
            fechaVencimiento: credito.fecha_vencimiento,
            dias,
          }),
          tipo: 'RECORDATORIO',
          creditoId: credito.id,
          emprendedorId: credito.emprendedor_id,
        });
        enviados++;
      }
    }

    return enviados;
  },
};
