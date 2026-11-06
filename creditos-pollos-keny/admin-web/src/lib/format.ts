import type { EstadoCredito, TipoCredito } from '@/types';

export const formatCurrency = (value?: number | string | null, decimals = 0): string => {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(n) ? n : 0);
};

export const formatNumber = (value?: number | string | null, decimals = 0): string =>
  new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(value ?? 0) || 0);

export const formatPercent = (value?: number | null, decimals = 1): string =>
  `${(Number(value ?? 0) || 0).toFixed(decimals)}%`;

const parseDate = (value: string | Date): Date => {
  if (value instanceof Date) return value;
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  return new Date(normalized);
};

export const formatDate = (value?: string | Date | null): string => {
  if (!value) return '—';
  return parseDate(value).toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

export const formatDateTime = (value?: string | Date | null): string => {
  if (!value) return '—';
  return parseDate(value).toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
};

export const daysUntil = (value: string): number => {
  const target = parseDate(value).getTime();
  return Math.ceil((target - Date.now()) / 86_400_000);
};

export const ESTADO_CONFIG: Record<EstadoCredito, { label: string; className: string; emoji: string }> = {
  SOLICITADO: { label: 'Solicitado', className: 'bg-amber-100 text-amber-700', emoji: '⏳' },
  APROBADO: { label: 'Aprobado', className: 'bg-brand-100 text-brand-800', emoji: '✅' },
  ENTREGADO: { label: 'Entregado', className: 'bg-sky-100 text-sky-700', emoji: '📦' },
  PAGADO: { label: 'Pagado', className: 'bg-emerald-100 text-emerald-700', emoji: '🏆' },
  MORA: { label: 'En mora', className: 'bg-rose-100 text-rose-700', emoji: '⚠️' },
  RECHAZADO: { label: 'Rechazado', className: 'bg-ink-200 text-ink-700', emoji: '❌' },
  CANCELADO: { label: 'Cancelado', className: 'bg-ink-200 text-ink-600', emoji: '🚫' },
};

export const TIPO_LABEL: Record<TipoCredito, { label: string; emoji: string; short: string }> = {
  POLLOS: { label: 'Pollos', emoji: '🐔', short: 'P' },
  CERDOS: { label: 'Cerdos', emoji: '🐷', short: 'C' },
};

export const METODO_LABEL: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  BINANCE: 'Binance',
  OTRO: 'Otro',
};

export const iniciales = (nombre?: string | null): string =>
  (nombre ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

export function nivelScore(score?: number): { etiqueta: string; color: string } {
  const valor = Number(score ?? 0);
  if (valor >= 750) return { etiqueta: 'Excelente', color: '#10B981' };
  if (valor >= 650) return { etiqueta: 'Bueno', color: '#2563EB' };
  if (valor >= 550) return { etiqueta: 'Regular', color: '#F59E0B' };
  if (valor >= 450) return { etiqueta: 'Riesgo medio', color: '#F97316' };
  return { etiqueta: 'Riesgo alto', color: '#EF4444' };
}

export const cx = (...classes: (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(' ');
