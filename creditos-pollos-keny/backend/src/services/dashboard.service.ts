import { db } from '../db';
import { addMonths, startOfMonth, toDateString, toDateTimeString } from '../lib/dates';
import { CryptoService } from './crypto.service';
import { registrarEventoCredito, snapshotMetricas } from './analytics.service';
import { totalesCredito } from './credito.service';
import { toNumber, type JwtPayload } from '../types';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Expresión de mes según el motor: MySQL DATE_FORMAT vs SQLite strftime. */
/** GREATEST (MySQL) / MAX escalar (SQLite). */
const mayorCero = (expr: string) =>
  db.dialect === 'mysql' ? `GREATEST(${expr}, 0)` : `MAX(${expr}, 0)`;

const mesExpr = (columna: string) =>
  db.dialect === 'mysql'
    ? `DATE_FORMAT(${columna}, '%Y-%m')`
    : `strftime('%Y-%m', ${columna})`;

const MESES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const DashboardService = {
  async metricas() {
    const [colocado] = await db.all<{
      total_prestado: number;
      cantidad: number;
      intereses: number;
      monto_pagado: number;
    }>(
      `SELECT
         COALESCE(SUM(monto_total), 0) AS total_prestado,
         COUNT(*) AS cantidad,
         COALESCE(SUM(monto_total * tasa_interes / 100), 0) AS intereses,
         COALESCE(SUM(monto_pagado), 0) AS monto_pagado
       FROM creditos
       WHERE estado IN ('APROBADO','ENTREGADO','PAGADO','MORA')`
    );

    const [mora] = await db.all<{ total_mora: number; cantidad: number }>(
      `SELECT
         COALESCE(SUM(${mayorCero('monto_total * (1 + tasa_interes / 100) - monto_pagado')}), 0) AS total_mora,
         COUNT(*) AS cantidad
       FROM creditos WHERE estado = 'MORA'`
    );

    const [activos] = await db.all<{ activos: number }>(
      `SELECT COUNT(*) AS activos FROM creditos WHERE estado IN ('APROBADO','ENTREGADO')`
    );

    const [pendientes] = await db.all<{ pendientes: number }>(
      `SELECT COUNT(*) AS pendientes FROM creditos WHERE estado = 'SOLICITADO'`
    );

    const [emprendedores] = await db.all<{ total: number }>(
      `SELECT COUNT(*) AS total FROM emprendedores WHERE activo = 1`
    );

    const inicioMes = startOfMonth(new Date());
    const [ingresosMes] = await db.all<{ cobrado: number }>(
      `SELECT COALESCE(SUM(monto), 0) AS cobrado FROM pagos WHERE fecha_pago >= ?`,
      [toDateString(inicioMes)]
    );

    const porTipo = await db.all<{ tipo: string; monto: number; intereses: number }>(
      `SELECT tipo,
              COALESCE(SUM(monto_total), 0) AS monto,
              COALESCE(SUM(monto_total * tasa_interes / 100), 0) AS intereses
       FROM creditos WHERE estado NOT IN ('RECHAZADO','CANCELADO') GROUP BY tipo`
    );

    const distribucion = await db.all<{ tipo: string; monto: number; cantidad: number }>(
      `SELECT tipo, COALESCE(SUM(monto_total), 0) AS monto, COUNT(*) AS cantidad
       FROM creditos WHERE estado NOT IN ('RECHAZADO','CANCELADO') GROUP BY tipo`
    );

    const cartera = await CryptoService.cartera();

    const totalPrestado = toNumber(colocado?.total_prestado);
    const totalRecuperado = toNumber(colocado?.monto_pagado);

    return {
      totalPrestado: round2(totalPrestado),
      totalRecuperado: round2(totalRecuperado),
      pendienteCobro: round2(Math.max(0, totalPrestado - totalRecuperado)),
      interesesProyectados: round2(toNumber(colocado?.intereses)),
      creditosActivos: toNumber(activos?.activos),
      creditosEnMora: toNumber(mora?.cantidad),
      solicitudesPendientes: toNumber(pendientes?.pendientes),
      emprendedores: toNumber(emprendedores?.total),
      montoEnMora: round2(toNumber(mora?.total_mora)),
      ingresosMes: round2(toNumber(ingresosMes?.cobrado)),
      ticketPromedio: toNumber(colocado?.cantidad) > 0 ? round2(totalPrestado / toNumber(colocado?.cantidad)) : 0,
      tasaRecuperacion: totalPrestado > 0 ? round2((totalRecuperado / totalPrestado) * 100) : 0,
      ingresosPorTipo: porTipo ?? [],
      distribucion,
      crypto: {
        valor: cartera.resumen.valorTotal,
        ganancia: cartera.resumen.ganancia,
        gananciaPorcentaje: cartera.resumen.gananciaPorcentaje,
        fuente: cartera.fuente,
      },
    };
  },

  /** Serie mensual de los últimos N meses: colocado vs cobrado. */
  async serieMensual(meses = 6) {
    const inicio = startOfMonth(addMonths(new Date(), -(meses - 1)));

    const colocados = await db.all<{ mes: string; total: number }>(
      `SELECT ${mesExpr('fecha_solicitud')} AS mes, COALESCE(SUM(monto_total), 0) AS total
       FROM creditos
       WHERE fecha_solicitud >= ? AND estado NOT IN ('RECHAZADO','CANCELADO')
       GROUP BY mes ORDER BY mes`,
      [toDateString(inicio)]
    );

    const cobrados = await db.all<{ mes: string; total: number }>(
      `SELECT ${mesExpr('fecha_pago')} AS mes, COALESCE(SUM(monto), 0) AS total
       FROM pagos WHERE fecha_pago >= ? GROUP BY mes ORDER BY mes`,
      [toDateString(inicio)]
    );

    const mapaColocado = new Map(colocados.map((r) => [r.mes, toNumber(r.total)]));
    const mapaCobrado = new Map(cobrados.map((r) => [r.mes, toNumber(r.total)]));

    const serie: { mes: string; etiqueta: string; colocado: number; cobrado: number }[] = [];
    for (let i = 0; i < meses; i++) {
      const fecha = addMonths(inicio, i);
      const mes = `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}`;
      serie.push({
        mes,
        etiqueta: `${MESES_ES[fecha.getUTCMonth()]} ${String(fecha.getUTCFullYear()).slice(2)}`,
        colocado: round2(mapaColocado.get(mes) ?? 0),
        cobrado: round2(mapaCobrado.get(mes) ?? 0),
      });
    }

    return serie;
  },

  async ultimosCreditos(limite = 6) {
    const rows = await db.all<Record<string, unknown>>(
      `SELECT c.id, c.tipo, c.cantidad, c.monto_total, c.tasa_interes, c.monto_pagado,
              c.estado, c.factura_numero, c.fecha_solicitud, c.fecha_vencimiento,
              e.nombre AS emprendedor_nombre, e.cedula AS emprendedor_cedula
       FROM creditos c JOIN emprendedores e ON e.id = c.emprendedor_id
       ORDER BY c.fecha_solicitud DESC LIMIT ?`,
      [limite]
    );

    return rows.map((row) => ({ ...row, totales: totalesCredito(row as never) }));
  },

  async ultimosPagos(limite = 6) {
    return db.all(
      `SELECT p.id, p.monto, p.metodo_pago, p.referencia, p.fecha_pago,
              c.factura_numero, c.tipo, e.nombre AS emprendedor_nombre
       FROM pagos p
       JOIN creditos c ON c.id = p.credito_id
       JOIN emprendedores e ON e.id = c.emprendedor_id
       ORDER BY p.fecha_pago DESC LIMIT ?`,
      [limite]
    );
  },

  async morosos(limite = 5) {
    const rows = await db.all<Record<string, unknown>>(
      `SELECT c.id, c.factura_numero, c.monto_total, c.tasa_interes, c.monto_pagado,
              c.fecha_vencimiento, e.nombre AS emprendedor_nombre, e.telefono AS emprendedor_telefono,
              e.score_crediticio
       FROM creditos c JOIN emprendedores e ON e.id = c.emprendedor_id
       WHERE c.estado = 'MORA'
       ORDER BY (c.monto_total * (1 + c.tasa_interes/100) - c.monto_pagado) DESC
       LIMIT ?`,
      [limite]
    );

    return rows.map((row) => ({ ...row, totales: totalesCredito(row as never) }));
  },

  /** Resumen para el panel del emprendedor. */
  async resumenEmprendedor(emprendedorId: string) {
    const rows = await db.all<Record<string, unknown>>(
      `SELECT * FROM creditos WHERE emprendedor_id = ? ORDER BY fecha_solicitud DESC`,
      [emprendedorId]
    );

    const creditos = rows.map(
      (row) => ({ ...row, totales: totalesCredito(row as never) })
    ) as Array<Record<string, unknown> & { totales: import('./credito.service').TotalesCredito }>;

    const emprendedor = await db.get<{ nombre: string; score_crediticio: number; actividad: string }>(
      'SELECT nombre, score_crediticio, actividad FROM emprendedores WHERE id = ?',
      [emprendedorId]
    );

    const totales = {
      creditos: creditos.length,
      activos: creditos.filter((c) => ['APROBADO', 'ENTREGADO'].includes(String(c.estado))).length,
      enMora: creditos.filter((c) => String(c.estado) === 'MORA').length,
      pagados: creditos.filter((c) => String(c.estado) === 'PAGADO').length,
      pendientes: creditos.filter((c) => String(c.estado) === 'SOLICITADO').length,
      montoSolicitado: round2(
        creditos
          .filter((c) => !['RECHAZADO', 'CANCELADO'].includes(String(c.estado)))
          .reduce((sum, c) => sum + (c.totales as { montoTotal: number }).montoTotal, 0)
      ),
      saldoPendiente: round2(
        creditos.reduce((sum, c) => sum + (c.totales as { saldoPendiente: number }).saldoPendiente, 0)
      ),
      totalPagado: round2(
        creditos.reduce((sum, c) => sum + (c.totales as { montoPagado: number }).montoPagado, 0)
      ),
    };

    return {
      emprendedor: emprendedor ?? null,
      totales,
      creditos: creditos.slice(0, 10),
    };
  },

  /** Registra el snapshot diario en PostgreSQL (si está configurado). */
  async sincronizarAnalitica(): Promise<void> {
    const metricas = await this.metricas();
    const porTipo = new Map((metricas.ingresosPorTipo ?? []).map((r) => [r.tipo, toNumber(r.monto)]));

    await snapshotMetricas({
      totalEmprendedores: metricas.emprendedores,
      creditosActivos: metricas.creditosActivos,
      creditosMora: metricas.creditosEnMora,
      totalPrestado: metricas.totalPrestado,
      totalRecuperado: metricas.totalRecuperado,
      totalMora: metricas.montoEnMora,
      ingresosPollos: porTipo.get('POLLOS') ?? 0,
      ingresosCerdos: porTipo.get('CERDOS') ?? 0,
      interesesGanados: metricas.interesesProyectados,
    });

    await CryptoService.guardarSnapshot(metricas.crypto.valor);
    await registrarEventoCredito('sistema', 'SNAPSHOT', null, metricas.totalPrestado, toDateTimeString());
  },
};

export type MetricasDashboard = Awaited<ReturnType<typeof DashboardService.metricas>>;
export type ResumenEmprendedor = Awaited<ReturnType<typeof DashboardService.resumenEmprendedor>>;

export function esAdmin(usuario?: JwtPayload): boolean {
  return usuario?.rol === 'ADMIN' || usuario?.rol === 'SUPER_ADMIN';
}
