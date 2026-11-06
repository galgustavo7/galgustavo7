import fs from 'node:fs';
import path from 'node:path';
import type { Database, RunResult } from '../types';
import { normalizeParams } from '../types';

interface SqliteStatement {
  all(...params: unknown[]): unknown[];
  get(...params: unknown[]): unknown;
  run(...params: unknown[]): { changes?: number | bigint; lastInsertRowid?: number | bigint };
}

interface SqliteLike {
  prepare(sql: string): SqliteStatement;
  exec(sql: string): void;
  close(): void;
}

/**
 * Driver SQLite. Funciona con `better-sqlite3` (dependencia opcional) o con el
 * módulo nativo `node:sqlite` disponible desde Node 22.5+. Sin servicios extra:
 * ideal para desarrollo, pruebas y demos.
 */
export class SqliteDatabase implements Database {
  readonly dialect = 'sqlite' as const;
  private db!: SqliteLike;
  private driverName = 'desconocido';

  constructor(private readonly file: string) {}

  async init(): Promise<void> {
    if (this.file !== ':memory:') {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
    }

    try {
      const mod = (await import('better-sqlite3')) as unknown as {
        default?: new (file: string) => SqliteLike & { pragma: (s: string) => void };
      };
      const SqliteCtor = mod.default ?? (mod as unknown as new (f: string) => SqliteLike);
      const instance = new SqliteCtor(this.file) as SqliteLike & { pragma: (s: string) => void };
      instance.pragma('journal_mode = WAL');
      instance.pragma('foreign_keys = ON');
      this.db = instance;
      this.driverName = 'better-sqlite3';
    } catch {
      const { DatabaseSync } = (await import('node:sqlite')) as unknown as {
        DatabaseSync: new (file: string) => SqliteLike;
      };
      const instance = new DatabaseSync(this.file);
      instance.exec('PRAGMA foreign_keys = ON');
      this.db = instance;
      this.driverName = 'node:sqlite';
    }
  }

  get driver(): string {
    return this.driverName;
  }

  async all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this.db.prepare(sql).all(...normalizeParams(params)) as T[];
  }

  async get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    return this.db.prepare(sql).get(...normalizeParams(params)) as T | undefined;
  }

  async run(sql: string, params: unknown[] = []): Promise<RunResult> {
    const result = this.db.prepare(sql).run(...normalizeParams(params));
    return {
      changes: Number(result.changes ?? 0),
      lastInsertId: result.lastInsertRowid !== undefined ? Number(result.lastInsertRowid) : undefined,
    };
  }

  async exec(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    this.db.exec('BEGIN');
    try {
      const result = await fn();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  async close(): Promise<void> {
    this.db.close();
  }
}
