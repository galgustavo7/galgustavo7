import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cx } from '@/lib/format';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  hint?: string;
  trend?: number;
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  color = 'from-brand-600 to-brand-800',
  hint,
  trend,
  loading,
}: StatCardProps) {
  return (
    <div className="card p-5 transition hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-500">{label}</p>
          {loading ? (
            <div className="mt-3 h-7 w-24 animate-pulse rounded-lg bg-ink-100" />
          ) : (
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-ink-900">{value}</p>
          )}
          {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
          {typeof trend === 'number' && (
            <div
              className={cx(
                'mt-2 inline-flex items-center gap-1 text-xs font-semibold',
                trend >= 0 ? 'text-emerald-600' : 'text-rose-600'
              )}
            >
              {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {trend >= 0 ? '+' : ''}
              {trend.toFixed(1)}%
            </div>
          )}
        </div>
        <div
          className={cx(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-soft',
            color
          )}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}
