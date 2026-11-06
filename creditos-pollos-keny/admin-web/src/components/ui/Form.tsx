import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cx } from '@/lib/format';

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({ label, error, hint, required, className, children }: FieldProps) {
  return (
    <div className={cx('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-ink-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cx(
        'w-full rounded-xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-sm text-ink-900',
        'placeholder:text-ink-400 outline-none transition focus:border-brand-500 focus:bg-white',
        'focus:ring-4 focus:ring-brand-500/10 disabled:opacity-60',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cx(
        'w-full rounded-xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-sm text-ink-900',
        'outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cx(
        'w-full rounded-xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-sm text-ink-900',
        'placeholder:text-ink-400 outline-none transition focus:border-brand-500 focus:bg-white',
        'focus:ring-4 focus:ring-brand-500/10',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';
