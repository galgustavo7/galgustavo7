/** Utilidades de fecha. Todo se persiste en UTC con formato 'YYYY-MM-DD HH:MM:SS'. */

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateTimeString(value: Date | string | number = new Date()): string {
  const d = value instanceof Date ? value : new Date(value);
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  );
}

export function toDateString(value: Date | string | number = new Date()): string {
  const d = value instanceof Date ? value : new Date(value);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

export function startOfMonth(date: Date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/** Convierte 'YYYY-MM-DD' / 'YYYY-MM-DD HH:MM:SS' a Date UTC. */
export function parseUtc(value: string | Date): Date {
  if (value instanceof Date) return value;
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  return new Date(`${normalized}${value.endsWith('Z') ? '' : 'Z'}`);
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function formatFechaEs(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : parseUtc(value);
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatDateTimeEs(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : parseUtc(value);
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}
