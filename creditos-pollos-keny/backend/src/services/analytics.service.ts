import { db, getAnalytics } from '../db';
import { logger } from '../lib/logger';
import { toNumber } from '../types';

/**
 * Espeja eventos y métricas hacia PostgreSQL cuando está configurado.
 * Nunca interrumpe el flujo principal: si el almacén analítico falla, se registra y sigue.
 */
export async function registrarEventoCredito(
  creditoId: string,
  tipoEvento: string,
  estadoNuevo?: string | null,
  monto?: number | null,
  detalle?: string | null
): Promise<void> {
  const analytics = getAnalytics();
  if (!analytics) return;

  try {
    await analytics.run(
      `INSERT INTO credito_eventos (credito_id, tipo_evento, estado_nuevo, monto, detalle)
       VALUES (?, ?, ?, ?, ?)`,
      [creditoId, tipoEvento, estadoNuevo ?? null, monto ?? null, detalle ?? null]
    );
  } catch (error) {
    logger.warn(`Analytics: no se pudo registrar el evento (${(error as Error).message})`);
  }
}

export interface MetricasSnapshot {
  totalEmprendedores: number;
  creditosActivos: number;
  creditosMora: number;
  totalPrestado: number;
  totalRecuperado: number;
  totalMora: number;
  ingresosPollos: number;
  ingresosCerdos: number;
  interesesGanados: number;
}

export async function snapshotMetricas(metricas: MetricasSnapshot): Promise<void> {
  const analytics = getAnalytics();
  if (!analytics) return;

  try {
    await analytics.run(
      `INSERT INTO dashboard_metrics
        (fecha, total_emprendedores, creditos_activos, creditos_mora, total_prestado,
         total_recuperado, total_mora, ingresos_pollos, ingresos_cerdos, intereses_ganados)
       VALUES (CURRENT_DATE, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT DO NOTHING`,
      [
        metricas.totalEmprendedores,
        metricas.creditosActivos,
        metricas.creditosMora,
        toNumber(metricas.totalPrestado),
        toNumber(metricas.totalRecuperado),
        toNumber(metricas.totalMora),
        toNumber(metricas.ingresosPollos),
        toNumber(metricas.ingresosCerdos),
        toNumber(metricas.interesesGanados),
      ]
    );
  } catch (error) {
    logger.warn(`Analytics: no se pudo guardar el snapshot (${(error as Error).message})`);
  }
}
