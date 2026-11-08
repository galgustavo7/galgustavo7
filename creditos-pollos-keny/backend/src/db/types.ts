export type Dialect = 'mysql' | 'sqlite' | 'postgres';

export interface RunResult {
  changes: number;
  lastInsertId?: number | string;
}

export interface Database {
  readonly dialect: Dialect;
  init(): Promise<void>;
  all<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  get<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | undefined>;
  run(sql: string, params?: unknown[]): Promise<RunResult>;
  exec(sql: string): Promise<void>;
  transaction<T>(fn: () => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/** Convierte objetos Date y booleanos a valores que entiende el driver. */
export function normalizeParams(params: unknown[] = []): unknown[] {
  return params.map((value) => {
    if (value === undefined) return null;
    if (value instanceof Date) return toDateTime(value);
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'bigint') return Number(value);
    return value;
  });
}

function toDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  );
}

/** Traduce placeholders `?` a `$1, $2...` ( necesario en PostgreSQL ). */
export function postgresPlaceholders(sql: string): string {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}
