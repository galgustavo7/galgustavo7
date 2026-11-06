import type { Database, RunResult } from '../types';
import { normalizeParams } from '../types';

interface MysqlQueryResult {
  affectedRows?: number;
  insertId?: number;
}

interface MysqlPool {
  query(sql: string, params?: unknown[]): Promise<[unknown[], unknown]>;
  execute(sql: string, params?: unknown[]): Promise<[unknown, unknown]>;
  end(): Promise<void>;
}

/** Driver MySQL / MariaDB vía mysql2 con pool de conexiones. */
export class MySqlDatabase implements Database {
  readonly dialect = 'mysql' as const;
  private pool!: MysqlPool;

  constructor(
    private readonly config: {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
    }
  ) {}

  async init(): Promise<void> {
    const mysql = (await import('mysql2/promise')) as unknown as {
      createPool: (cfg: Record<string, unknown>) => MysqlPool;
    };
    this.pool = mysql.createPool({
      ...this.config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
      multipleStatements: true, // necesario para ejecutar migraciones .sql
    });
  }

  async all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const [rows] = await this.pool.query(sql, normalizeParams(params));
    return rows as T[];
  }

  async get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    const rows = await this.all<T>(sql, params);
    return rows[0];
  }

  async run(sql: string, params: unknown[] = []): Promise<RunResult> {
    const [result] = await this.pool.execute(sql, normalizeParams(params));
    const info = (result ?? {}) as MysqlQueryResult;
    return { changes: Number(info.affectedRows ?? 0), lastInsertId: info.insertId };
  }

  async exec(sql: string): Promise<void> {
    await this.pool.query(sql);
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    const conn = (this.pool as unknown as { getConnection(): Promise<MysqlPool & { beginTransaction(): Promise<void>; commit(): Promise<void>; rollback(): Promise<void>; release(): void }> });
    const connection = await conn.getConnection();
    const originalQuery = this.pool.query.bind(this.pool);
    try {
      await connection.beginTransaction();
      // Redirigimos el pool temporalmente a la conexión transaccional
      (this.pool as { query: unknown }).query = connection.query.bind(connection);
      const result = await fn();
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      (this.pool as { query: unknown }).query = originalQuery;
      connection.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
