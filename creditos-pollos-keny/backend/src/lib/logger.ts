/* eslint-disable no-console */
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Level = keyof typeof LEVELS;

const current: Level = (process.env.LOG_LEVEL as Level) || 'info';

const stamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

function write(level: Level, prefix: string, args: unknown[]): void {
  if (LEVELS[level] < LEVELS[current]) return;
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(`[${stamp()}] ${prefix}`, ...args);
}

export const logger = {
  debug: (...args: unknown[]) => write('debug', '🔍', args),
  info: (...args: unknown[]) => write('info', 'ℹ️ ', args),
  warn: (...args: unknown[]) => write('warn', '⚠️ ', args),
  error: (...args: unknown[]) => write('error', '❌', args),
  ok: (...args: unknown[]) => write('info', '✅', args),
};
