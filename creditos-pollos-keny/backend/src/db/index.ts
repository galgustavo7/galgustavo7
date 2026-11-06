import { env } from '../config/env';
import { logger } from '../lib/logger';
import { MySqlDatabase } from './drivers/mysql';
import { PostgresDatabase } from './drivers/postgres';
import { SqliteDatabase } from './drivers/sqlite';
import { runMigrations } from './migrate';
import type { Database } from './types';

/** Base transaccional (MySQL o SQLite según configuración). */
export const db: Database =
  env.db.dialect === 'mysql'
    ? new MySqlDatabase(env.db.mysql)
    : new SqliteDatabase(env.db.sqliteFile);

/** Almacén de analítica opcional (PostgreSQL). */
export let analytics: Database | null = null;

export function getAnalytics(): Database | null {
  return analytics;
}

export interface ConnectionResult {
  db: Database;
  analytics: Database | null;
}

export async function connectDatabases(options: { migrate?: boolean } = {}): Promise<ConnectionResult> {
  const { migrate = true } = options;

  await db.init();
  if (db instanceof SqliteDatabase && env.nodeEnv !== 'test') {
    logger.info(`🗄️  SQLite (${(db as SqliteDatabase).driver}) → ${env.db.sqliteFile}`);
  } else {
    logger.info(`🗄️  MySQL → ${env.db.mysql.host}:${env.db.mysql.port}/${env.db.mysql.database}`);
  }

  if (migrate) await runMigrations(db);

  if (env.postgres.enabled) {
    const pg = new PostgresDatabase(env.postgres);
    try {
      await pg.init();
      if (migrate) await runMigrations(pg);
      analytics = pg;
      logger.info(`📊 PostgreSQL analítico → ${env.postgres.host}:${env.postgres.port}/${env.postgres.database}`);
    } catch (error) {
      logger.warn(`⚠️  PostgreSQL no disponible (${(error as Error).message}). La app sigue con la base principal.`);
      analytics = null;
    }
  }

  return { db, analytics };
}

export async function closeDatabases(): Promise<void> {
  await db.close().catch(() => undefined);
  if (analytics) await analytics.close().catch(() => undefined);
}

export { runMigrations };
export type { Database, Dialect } from './types';
