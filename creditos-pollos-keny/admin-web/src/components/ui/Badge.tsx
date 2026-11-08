import type { ReactNode } from 'react';
import { cx } from '@/lib/format';
import { ESTADO_CONFIG, TIPO_LABEL, nivelScore } from '@/lib/format';
import type { EstadoCredito, TipoCredito } from '@/types';

export function Badge({
  children,
  className,
  icon,
}: {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span className={cx('chip', className ?? 'bg-ink-100 text-ink-700')}>
      {icon}
      {children}
    </span>
  );
}

export function EstadoBadge({ estado }: { estado: EstadoCredito }) {
  const config = ESTADO_CONFIG[estado] ?? { label: estado, className: 'bg-ink-100 text-ink-700', emoji: '•' };
  return (
    <Badge className={config.className}>
      <span aria-hidden>{config.emoji}</span>
      {config.label}
    </Badge>
  );
}

export function TipoBadge({ tipo }: { tipo: TipoCredito }) {
  const config = TIPO_LABEL[tipo] ?? { label: tipo, emoji: '•', short: '?' };
  return (
    <Badge className={tipo === 'POLLOS' ? 'bg-accent-100 text-accent-700' : 'bg-pink-100 text-pink-700'}>
      <span aria-hidden>{config.emoji}</span>
      {config.label}
    </Badge>
  );
}

export function ScoreBadge({ score }: { score?: number }) {
  const nivel = nivelScore(score);
  return (
    <Badge
      className="text-white"
      // eslint-disable-next-line react/forbid-dom-props
    >
      <span
        className="mr-1 inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: nivel.color }}
        aria-hidden
      />
      <span className="text-ink-700">{Number(score ?? 0)}</span>
      <span className="text-ink-400">· {nivel.etiqueta}</span>
    </Badge>
  );
}
