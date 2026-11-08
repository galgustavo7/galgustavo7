import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/format';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('rounded-2xl border border-ink-100 bg-white shadow-card', className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('flex items-center justify-between gap-4 border-b border-ink-100 px-6 py-4', className)} {...props} />;
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cx('text-base font-semibold text-ink-900', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardSubtitle({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cx('mt-0.5 text-sm text-ink-500', className)}>{children}</p>;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('p-6', className)} {...props} />;
}
