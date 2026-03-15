'use client';

import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-light mb-2">
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full px-4 py-3 rounded-2xl bg-navy/60 border border-white/15 text-white placeholder-slate-mid',
          'focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber/50',
          'transition-all duration-300',
          'font-[family-name:var(--font-body)]',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
