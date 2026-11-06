import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { AppError } from '../lib/errors';
import { toDateTimeString } from '../lib/dates';
import { totalesCredito } from './credito.service';
import { actualizarScore } from './scoring.service';
import { enviarEmail } from './email.service';
import { EmailTemplates } from './email.templates';
import { toBool, toNumber, type Actividad, type EmprendedorRow } from '../types';

const SELECT_EMP = `
  SELECT e.*,
    (SELECT COUNT(*) FROM creditos c WHERE c.emprendedor_id = e.id) AS total_creditos,
    (SELECT COUNT(*) FROM creditos c WHERE c.emprendedor_id = e.id AND c.estado IN ('APROBADO','ENTREGADO','MORA')) AS creditos_activos,
    (SELECT COUNT(*) FROM creditos c WHERE c.emprendedor_id = e.id AND c.estado = 'MORA') AS creditos_mora,
    (SELECT COUNT(*) FROM creditos c WHERE c.emprendedor_id = e.id AND c.estado = 'PAGADO') AS creditos_pagados,
    COALESCE((SELECT SUM(c.monto_total) FROM creditos c WHERE c.emprendedor_id = e.id AND c.estado NOT IN ('RECHAZADO','CANCELADO')), 0) AS monto_solicitado,
    COALESCE((SELECT SUM(p.monto) FROM pagos p JOIN creditos c ON c.id = p.credito_id WHERE c.emprendedor_id = e.id), 0) AS monto_pagado
  FROM emprendedores e
`;

export interface CrearEmprendedorInput {
  nombre: string;
  cedula: string;
  telefono?: string;
  email: string;
  ubicacion?: string;
  actividad?: Actividad | string;
  notas?: string;
  password?: string;
}

export const EmprendedorService = {
  async listar(filtros: { q?: string; actividad?: string; soloActivos?: boolean; limite?: number } = {}) {
    const where: string[] = [];
    const params: unknown[] = [];

    if (filtros.q) {
      where.push('(e.nombre LIKE ? OR e.cedula LIKE ? OR e.email LIKE ?)');
      params.push(`%${filtros.q}%`, `%${filtros.q}%`, `%${filtros.q}%`);
    }
    if (filtros.actividad) {
      where.push('e.actividad = ?');
      params.push(filtros.actividad);
    }
    if (filtros.soloActivos !== false) {
      where.push('e.activo = 1');
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limite = Math.min(500, Math.max(1, Number(filtros.limite ?? 100)));

    const rows = await db.all<Record<string, unknown>>(
      `${SELECT_EMP} ${whereSql} ORDER BY e.score_crediticio DESC, e.nombre ASC LIMIT ?`,
      [...params, limite]
    );

    return rows.map((row) => ({
      ...row,
      activo: toBool(row.activo),
      score: toNumber(row.score_crediticio),
      nivel: nivelScore(toNumber(row.score_crediticio)),
    }));
  },

  async obtener(id: string) {
    const row = await db.get<Record<string, unknown>>(`${SELECT_EMP} WHERE e.id = ?`, [id]);
    if (!row) throw AppError.notFound('Emprendedor no encontrado');

    const creditos = await db.all<Record<string, unknown>>(
      `SELECT id, tipo, cantidad, monto_total, tasa_interes, monto_pagado, fecha_vencimiento, estado, factura_numero, fecha_solicitud
       FROM creditos WHERE emprendedor_id = ? ORDER BY fecha_solicitud DESC`,
      [id]
    );

    const usuario = await db.get(
      `SELECT id, nombre, email, rol, activo, email_verificado, ultimo_acceso FROM usuarios WHERE emprendedor_id = ?`,
      [id]
    );

    const pagos = await db.all(
      `SELECT p.id, p.monto, p.metodo_pago, p.referencia, p.fecha_pago, c.factura_numero
       FROM pagos p JOIN creditos c ON c.id = p.credito_id
       WHERE c.emprendedor_id = ? ORDER BY p.fecha_pago DESC LIMIT 20`,
      [id]
    );

    return {
      ...row,
      activo: toBool(row.activo),
      nivel: nivelScore(toNumber(row.score_crediticio)),
      creditos: creditos.map((c) => ({ ...c, totales: totalesCredito(c as never) })),
      usuario: usuario ?? null,
      pagos,
    };
  },

  async crear(data: CrearEmprendedorInput) {
    const email = String(data.email).toLowerCase().trim();

    const existe = await db.get<{ id: string }>(
      'SELECT id FROM emprendedores WHERE email = ? OR cedula = ?',
      [email, data.cedula]
    );
    if (existe) throw AppError.conflict('Ya existe un emprendedor con ese correo o cédula');

    const emprendedorId = crypto.randomUUID();
    const password = data.password ?? generarPasswordTemporal();
    const passwordHash = await bcrypt.hash(password, 10);
    const actividad = String(data.actividad ?? 'AVICOLA').toUpperCase();

    await db.transaction(async () => {
      await db.run(
        `INSERT INTO emprendedores (id, nombre, cedula, telefono, email, ubicacion, actividad, notas)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          emprendedorId,
          data.nombre.trim(),
          data.cedula,
          data.telefono ?? '',
          email,
          data.ubicacion ?? null,
          actividad,
          data.notas ?? null,
        ]
      );

      await db.run(
        `INSERT INTO usuarios (id, emprendedor_id, nombre, email, telefono, password_hash, rol, email_verificado)
         VALUES (?, ?, ?, ?, ?, ?, 'EMPRENDEDOR', 1)`,
        [crypto.randomUUID(), emprendedorId, data.nombre.trim(), email, data.telefono ?? null, passwordHash]
      );
    });

    await enviarEmail({
      to: email,
      subject: '🐔 Bienvenido a Créditos Pollos Keny',
      html: EmailTemplates.bienvenida(data.nombre.trim(), `${process.env.FRONT_URL ?? 'http://localhost:5173'}/login`),
      tipo: 'BIENVENIDA',
      emprendedorId,
    });

    return { id: emprendedorId, email, passwordTemporal: password };
  },

  async actualizar(id: string, data: Partial<CrearEmprendedorInput> & { scoreCrediticio?: number }) {
    const actual = await db.get<EmprendedorRow>('SELECT * FROM emprendedores WHERE id = ?', [id]);
    if (!actual) throw AppError.notFound('Emprendedor no encontrado');

    const campos: string[] = [];
    const params: unknown[] = [];

    const mapa: Record<string, unknown> = {
      nombre: data.nombre?.trim(),
      telefono: data.telefono,
      email: data.email ? String(data.email).toLowerCase().trim() : undefined,
      ubicacion: data.ubicacion,
      actividad: data.actividad ? String(data.actividad).toUpperCase() : undefined,
      notas: data.notas,
      score_crediticio: data.scoreCrediticio,
    };

    for (const [campo, valor] of Object.entries(mapa)) {
      if (valor !== undefined) {
        campos.push(`${campo} = ?`);
        params.push(valor);
      }
    }

    if (campos.length === 0) return { actualizado: false };

    params.push(id);
    await db.run(`UPDATE emprendedores SET ${campos.join(', ')} WHERE id = ?`, params);

    if (data.email) {
      await db.run('UPDATE usuarios SET email = ?, nombre = ? WHERE emprendedor_id = ?', [
        String(data.email).toLowerCase().trim(),
        data.nombre?.trim() ?? actual.nombre,
        id,
      ]);
    }

    return { actualizado: true };
  },

  async cambiarEstado(id: string, activo: boolean) {
    const result = await db.run('UPDATE emprendedores SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);
    if (result.changes === 0) throw AppError.notFound('Emprendedor no encontrado');
    await db.run('UPDATE usuarios SET activo = ? WHERE emprendedor_id = ?', [activo ? 1 : 0, id]);
    return { id, activo };
  },

  async recalcularScore(id: string) {
    const score = await actualizarScore(id);
    return { id, score, nivel: nivelScore(score) };
  },

  async ranking(limite = 5) {
    const rows = await db.all<Record<string, unknown>>(
      `${SELECT_EMP} WHERE e.activo = 1 ORDER BY e.score_crediticio DESC LIMIT ?`,
      [limite]
    );
    return rows.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      score: toNumber(row.score_crediticio),
      nivel: nivelScore(toNumber(row.score_crediticio)),
      creditos_pagados: toNumber(row.creditos_pagados),
      monto_pagado: toNumber(row.monto_pagado),
    }));
  },
};

export function nivelScore(score: number): { etiqueta: string; color: string } {
  if (score >= 750) return { etiqueta: 'Excelente', color: '#10B981' };
  if (score >= 650) return { etiqueta: 'Bueno', color: '#3B82F6' };
  if (score >= 550) return { etiqueta: 'Regular', color: '#F59E0B' };
  if (score >= 450) return { etiqueta: 'Riesgo medio', color: '#F97316' };
  return { etiqueta: 'Riesgo alto', color: '#EF4444' };
}

function generarPasswordTemporal(): string {
  return `Keny${crypto.randomBytes(3).toString('hex').toUpperCase()}!`;
}
