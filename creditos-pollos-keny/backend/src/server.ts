import { createApp } from './app';
import { connectDatabases } from './db';
import { env, ensureStorageDirs } from './config/env';
import { logger } from './lib/logger';
import { iniciarTareasProgramadas, ejecutarTareasMantenimiento } from './jobs/tareas.job';
import { emailHabilitado } from './services/email.service';

async function bootstrap(): Promise<void> {
  ensureStorageDirs();

  await connectDatabases({ migrate: true });

  const app = createApp();
  const server = app.listen(env.port, '0.0.0.0', () => {
    logger.ok(`🚀 API Pollos Keny escuchando en http://0.0.0.0:${env.port}`);
    logger.info(`🌐 Entorno: ${env.nodeEnv} | Base: ${env.db.dialect} | Front: ${env.urls.front}`);
    if (!emailHabilitado()) {
      logger.warn('SMTP no configurado: los correos se guardan en storage/emails (modo simulado).');
    }
  });

  iniciarTareasProgramadas();

  // Primera pasada de mantenimiento 5s después de arrancar
  setTimeout(() => void ejecutarTareasMantenimiento(), 5_000);

  const cerrar = async (signal: string) => {
    logger.info(`Recibida señal ${signal}, cerrando...`);
    server.close(async () => {
      const { closeDatabases } = await import('./db');
      await closeDatabases();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void cerrar('SIGTERM'));
  process.on('SIGINT', () => void cerrar('SIGINT'));
}

bootstrap().catch((error) => {
  logger.error('No se pudo iniciar el servidor', error);
  process.exit(1);
});
