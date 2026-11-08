import type { Database, RunResult } from '../types';
import { normalizeParams, postgresPlaceholders } from '../types';

interface PgPool {
  query(sql: string, params?: unknown[]): Promise<{ rows: unknown[]; rowCount?: number | null }>;
  end(): Promise<void>;
}

/**
 * Driver PostgreSQL. Se usa como almacén de analítica (métricas, snapshots crypto,
 * logs de email); la operación transaccional vive en MySQL o SQLite.
 */
export class PostgresDatabase implements Database {
  readonly dialect = 'postgres' as const;
  private pool!: PgPool;

  constructor(
    private readonly config: {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
      ssl: boolean;
    }
  ) {}

  async init(): Promise<void> {
    const pg = (await import('pg')) as unknown as {
      Pool: new (cfg: Record<string, unknown>) => PgPool;
    };
    this.pool = new pg.Pool({
      ...this.config,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : undefined,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  private prepare(sql: string): string {
    return postgresPlaceholders(sql);
  }

  async all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const { rows } = await this.pool.query(this.prepare(sql), normalizeParams(params));
    return rows as T[];
  }

  async get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    const rows = await this.all<T>(sql, params);
    return rows[0];
  }

  async run(sql: string, params: unknown[] = []): Promise<RunResult> {
    const result = await this.pool.query(this.prepare(sql), normalizeParams(params));
    return { changes: Number(result.rowCount ?? 0) };
  }

  async exec(sql: string): Promise<void> {
    await this.pool.query(sql);
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    await this.pool.query('BEGIN');
    try {
      const result = await fn();
      await this.pool.query('COMMIT');
      return result;
    } catch (error) {
      await this.pool.query('ROLLBACK');
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
