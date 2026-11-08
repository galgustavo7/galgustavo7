import fs from 'node:fs';
import path from 'node:path';
import type { Database, Dialect } from './types';
import { logger } from '../lib/logger';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

async function ensureControlTable(db: Database): Promise<void> {
  if (db.dialect === 'postgres') {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(190) UNIQUE NOT NULL,
        ejecutada_en TIMESTAMP DEFAULT NOW()
      );
    `);
    return;
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY ${db.dialect === 'sqlite' ? 'AUTOINCREMENT' : 'AUTO_INCREMENT'},
      nombre VARCHAR(190) UNIQUE NOT NULL,
      ejecutada_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function appliedMigrations(db: Database): Promise<string[]> {
  const rows = await db.all<{ nombre: string }>('SELECT nombre FROM schema_migrations');
  return rows.map((r) => r.nombre);
}

/**
 * Aplica las migraciones SQL del dialecto indicado (mysql | sqlite | postgres).
 * Es idempotente: guarda el historial en `schema_migrations`.
 */
export async function runMigrations(db: Database, dialect: Dialect = db.dialect): Promise<string[]> {
  const dir = path.join(MIGRATIONS_DIR, dialect);
  if (!fs.existsSync(dir)) {
    logger.warn(`No hay migraciones para el dialecto "${dialect}" (${dir})`);
    return [];
  }

  await ensureControlTable(db);
  const applied = await appliedMigrations(db);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  const executed: string[] = [];

  for (const file of files) {
    if (applied.includes(file)) continue;
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    logger.info(`📄 Migración ${dialect}/${file}`);
    await db.exec(sql);
    await db.run('INSERT INTO schema_migrations (nombre) VALUES (?)', [file]);
    executed.push(file);
  }

  if (executed.length === 0) logger.info(`✔ Esquema ${dialect} al día`);
  return executed;
}

/** Elimina el historial de migraciones (usado por el script de reset). */
export async function dropSchemaMigrations(db: Database): Promise<void> {
  await db.exec('DROP TABLE IF EXISTS schema_migrations');
}
