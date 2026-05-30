'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, id, options, className = '', ...props }, ref) => {
    const selectId = id || label.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={selectId} className="text-sm font-medium text-neutral-300">
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          className={`rounded-xl bg-neutral-900 border border-white/10 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer
            ${error ? 'border-rose-500 focus:ring-rose-500/20' : ''}
            ${className}`}
          {...props}
        >
          <option value="" className="bg-neutral-900 text-neutral-400">Select...</option>
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-neutral-900 text-white">{o.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
