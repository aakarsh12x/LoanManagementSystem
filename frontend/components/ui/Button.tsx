'use client';

import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
}

const variantClasses = {
  primary: 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-emerald-500/50',
  secondary: 'bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10 disabled:bg-neutral-900 disabled:text-neutral-500',
  danger: 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-500/50',
  ghost: 'bg-transparent hover:bg-white/5 text-neutral-300 hover:text-white border border-white/10 disabled:opacity-50',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({ variant = 'primary', size = 'md', isLoading, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
