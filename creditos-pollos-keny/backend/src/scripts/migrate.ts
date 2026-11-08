import { closeDatabases, connectDatabases } from '../db';
import { logger } from '../lib/logger';
import { env } from '../config/env';

async function main(): Promise<void> {
  logger.info('🔄 Ejecutando migraciones...');
  const { analytics } = await connectDatabases({ migrate: true });

  logger.ok(`Migraciones aplicadas en ${env.db.dialect}`);
  if (analytics) logger.ok('Esquema analítico de PostgreSQL sincronizado');

  await closeDatabases();
  process.exit(0);
}

main().catch((error) => {
  logger.error('Error ejecutando migraciones', error);
  process.exit(1);
});
