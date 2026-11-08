import fs from 'node:fs';
import { closeDatabases, db, connectDatabases } from '../db';
import { dropSchemaMigrations } from '../db/migrate';
import { env } from '../config/env';
import { logger } from '../lib/logger';

const TABLAS = [
  'pagos',
  'facturas',
  'creditos',
  'sesiones',
  'password_resets',
  'email_verifications',
  'usuarios',
  'emprendedores',
  'email_logs',
  'crypto_portfolio',
  'parametros',
];

/**
 * Borra todos los datos y vuelve a crear el esquema.
 * Uso: npm run reset
 */
async function main(): Promise<void> {
  logger.warn('🧨 Reiniciando la base de datos...');

  await db.init();

  if (db.dialect === 'sqlite') {
    await db.close();
    for (const archivo of [env.db.sqliteFile, `${env.db.sqliteFile}-wal`, `${env.db.sqliteFile}-shm`]) {
      if (fs.existsSync(archivo)) {
        fs.unlinkSync(archivo);
        logger.info(`Eliminado ${archivo}`);
      }
    }
  } else {
    await dropSchemaMigrations(db);
    await db.exec('SET FOREIGN_KEY_CHECKS = 0');
    for (const tabla of TABLAS) {
      await db.exec(`DROP TABLE IF EXISTS ${tabla}`);
    }
    await db.exec('SET FOREIGN_KEY_CHECKS = 1');
    await closeDatabases();
  }

  await connectDatabases({ migrate: true });
  logger.ok('Base reiniciada. Ejecuta "npm run seed" para cargar los datos de demo.');
  await closeDatabases();
  process.exit(0);
}

main().catch((error) => {
  logger.error('Error reiniciando la base de datos', error);
  process.exit(1);
});
