import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Carga de variables de entorno.
 * Prioridad: ENV_FILE > backend/.env > .env de la raíz del monorepo.
 */
const candidates = [
  process.env.ENV_FILE,
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(__dirname, '../../.env'),
].filter(Boolean) as string[];

let loadedFrom: string | null = null;
for (const file of candidates) {
  if (fs.existsSync(file)) {
    dotenv.config({ path: file });
    loadedFrom = file;
    break;
  }
}
if (!loadedFrom) dotenv.config();

const str = (key: string, fallback = ''): string => {
  const value = process.env[key];
  return value === undefined || value === '' ? fallback : String(value);
};

const int = (key: string, fallback: number): number => {
  const value = process.env[key];
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const bool = (key: string, fallback = false): boolean => {
  const value = process.env[key];
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on', 'si'].includes(String(value).toLowerCase());
};

/** Directorio raíz del backend (un nivel arriba de src/config). */
export const BACKEND_ROOT = path.resolve(__dirname, '../..');

const storageDir = path.resolve(BACKEND_ROOT, str('STORAGE_DIR', 'storage'));

const dialectRaw = str('DB_DIALECT', 'auto').toLowerCase();
const mysqlHost = str('MYSQL_HOST');
const mysqlDatabase = str('MYSQL_DATABASE', 'keny_credits');

function resolveDialect(): 'mysql' | 'sqlite' {
  if (dialectRaw === 'mysql') return 'mysql';
  if (dialectRaw === 'sqlite') return 'sqlite';
  // auto: MySQL si está configurado, si no SQLite (listo para desarrollo sin Docker)
  return mysqlHost && mysqlDatabase ? 'mysql' : 'sqlite';
}

export const env = {
  nodeEnv: str('NODE_ENV', 'development'),
  port: int('PORT', 3000),
  isProduction: str('NODE_ENV', 'development') === 'production',

  db: {
    dialect: resolveDialect() as 'mysql' | 'sqlite',
    sqliteFile: str('DB_SQLITE_FILE', path.join(storageDir, 'keny.db')),
    mysql: {
      host: mysqlHost,
      port: int('MYSQL_PORT', 3306),
      user: str('MYSQL_USER', 'keny_user'),
      password: str('MYSQL_PASSWORD', 'keny_pass_2026'),
      database: mysqlDatabase,
    },
  },

  postgres: {
    enabled: bool('PG_ENABLED', Boolean(str('PG_HOST'))),
    host: str('PG_HOST', 'localhost'),
    port: int('PG_PORT', 5432),
    user: str('PG_USER', 'keny_pg'),
    password: str('PG_PASSWORD', 'keny_pg_pass'),
    database: str('PG_DATABASE', 'keny_analytics'),
    ssl: bool('PG_SSL', false),
  },

  jwt: {
    secret: str('JWT_SECRET', 'dev-secret-cambiar-en-produccion'),
    refreshSecret: str('JWT_REFRESH_SECRET', str('JWT_SECRET', 'dev-refresh-cambiar')),
    expiresIn: str('JWT_EXPIRES_IN', '1h'),
    refreshExpiresIn: str('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  smtp: {
    host: str('SMTP_HOST'),
    port: int('SMTP_PORT', 587),
    secure: bool('SMTP_SECURE', false),
    user: str('SMTP_USER'),
    pass: str('SMTP_PASS'),
    from: str('SMTP_FROM', 'Créditos Pollos Keny <no-reply@polloskeny.com>'),
  },

  binance: {
    apiKey: str('BINANCE_API_KEY'),
    apiSecret: str('BINANCE_API_SECRET'),
    baseUrl: str('BINANCE_API_URL', 'https://api.binance.com'),
    enabled: bool('BINANCE_ENABLED', true),
  },

  urls: {
    app: str('APP_URL', 'http://localhost:3000'),
    front: str('FRONT_URL', 'http://localhost:5173'),
  },

  corsOrigins: str('CORS_ORIGINS', '*'),

  storage: {
    root: storageDir,
    facturas: path.join(storageDir, 'facturas'),
    emails: path.join(storageDir, 'emails'),
  },
};

export const smtpConfigured = Boolean(
  env.smtp.host && env.smtp.user && env.smtp.pass && !str('SMTP_DISABLE', '')
);

export function ensureStorageDirs(): void {
  for (const dir of [env.storage.root, env.storage.facturas, env.storage.emails]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
