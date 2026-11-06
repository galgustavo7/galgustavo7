import { db } from '../db';
import { logger } from '../lib/logger';
import { toNumber } from '../types';

export interface DetalleScore {
  score: number;
  base: number;
  creditosPagados: number;
  creditosEnMora: number;
  creditosRechazados: number;
  ratioPago: number;
  bonificacion: number;
  penalizacion: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Scoring crediticio propio (300 - 850):
 *  - Base de 500 puntos.
 *  + Hasta 120 puntos por créditos pagados.
 *  + Hasta 120 puntos por ratio de pago (monto pagado / monto total).
 *  - 70 puntos por cada crédito en mora.
 *  - 25 puntos por cada crédito rechazado.
 */
export async function calcularScore(emprendedorId: string): Promise<DetalleScore> {
  const resumen = await db.get<{
    total: number;
    pagados: number;
    mora: number;
    rechazados: number;
    monto_total: number | string;
    monto_pagado: number | string;
  }>(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN estado = 'PAGADO' THEN 1 ELSE 0 END) AS pagados,
       SUM(CASE WHEN estado = 'MORA' THEN 1 ELSE 0 END) AS mora,
       SUM(CASE WHEN estado = 'RECHAZADO' THEN 1 ELSE 0 END) AS rechazados,
       COALESCE(SUM(monto_total), 0) AS monto_total,
       COALESCE(SUM(monto_pagado), 0) AS monto_pagado
     FROM creditos
     WHERE emprendedor_id = ?`,
    [emprendedorId]
  );

  const total = toNumber(resumen?.total);
  const pagados = toNumber(resumen?.pagados);
  const mora = toNumber(resumen?.mora);
  const rechazados = toNumber(resumen?.rechazados);
  const montoTotal = toNumber(resumen?.monto_total);
  const montoPagado = toNumber(resumen?.monto_pagado);

  const ratioPago = montoTotal > 0 ? clamp(montoPagado / montoTotal, 0, 1) : 0;
  const bonificacion = Math.min(pagados * 15, 120) + Math.round(ratioPago * 120);
  const penalizacion = mora * 70 + rechazados * 25;

  const detalle: DetalleScore = {
    score: clamp(500 + bonificacion - penalizacion, 300, 850),
    base: 500,
    creditosPagados: pagados,
    creditosEnMora: mora,
    creditosRechazados: rechazados,
    ratioPago: Number(ratioPago.toFixed(4)),
    bonificacion,
    penalizacion,
  };

  if (total === 0) detalle.score = 500; // sin historial: score neutro
  return detalle;
}

/** Recalcula y persiste el score de un emprendedor. */
export async function actualizarScore(emprendedorId: string): Promise<number> {
  const detalle = await calcularScore(emprendedorId);
  await db.run('UPDATE emprendedores SET score_crediticio = ? WHERE id = ?', [detalle.score, emprendedorId]);
  return detalle.score;
}

/** Recalcula el score de todos los emprendedores (usado por el cron). */
export async function actualizarTodosLosScores(): Promise<number> {
  const rows = await db.all<{ id: string }>('SELECT id FROM emprendedores');
  for (const row of rows) {
    await actualizarScore(row.id);
  }
  logger.info(`🎯 Scores recalculados: ${rows.length} emprendedores`);
  return rows.length;
}
