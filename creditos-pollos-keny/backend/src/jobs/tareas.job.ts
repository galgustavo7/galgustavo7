import cron from 'node-cron';
import { logger } from '../lib/logger';
import { CreditoService } from '../services/credito.service';
import { actualizarTodosLosScores } from '../services/scoring.service';
import { DashboardService } from '../services/dashboard.service';
import { CryptoService } from '../services/crypto.service';

/** Tareas de mantenimiento: mora, recordatorios, scoring y analítica. */
export async function ejecutarTareasMantenimiento(): Promise<void> {
  try {
    const enMora = await CreditoService.marcarMora();
    const recordatorios = await CreditoService.enviarRecordatorios();
    await actualizarTodosLosScores();

    const { db } = await import('../db');
    if (db.dialect === 'mysql' || (await import('../config/env')).env.postgres.enabled) {
      await DashboardService.sincronizarAnalitica();
      await CryptoService.guardarSnapshot();
    }

    logger.info(
      `🧹 Mantenimiento: ${enMora} crédito(s) en mora, ${recordatorios} recordatorio(s) enviados`
    );
  } catch (error) {
    logger.error('Error en las tareas de mantenimiento', error);
  }
}

/** Programa el cron diario (06:00 America/Caracas aprox). */
export function iniciarTareasProgramadas(): void {
  cron.schedule('0 6 * * *', () => {
    void ejecutarTareasMantenimiento();
  });

  cron.schedule('0 */6 * * *', () => {
    void CryptoService.guardarSnapshot().catch(() => undefined);
  });

  logger.info('⏰ Tareas programadas activas (mora 06:00, snapshots crypto cada 6h)');
}
