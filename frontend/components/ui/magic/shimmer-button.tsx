'use client';

import React from 'react';
import { cn } from '../../../lib/utils';

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = '#ffffff',
      shimmerSize = '0.05em',
      shimmerDuration = '3s',
      borderRadius = '12px',
      background = 'rgba(79, 70, 229, 1)',
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        style={
          {
            '--spread': '90deg',
            '--shimmer-color': shimmerColor,
            '--radius': borderRadius,
            '--speed': shimmerDuration,
            '--cut': shimmerSize,
            '--bg': background,
          } as React.CSSProperties
        }
        className={cn(
          'group relative z-0 flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden whitespace-nowrap px-6 py-3 text-white font-semibold',
          '[background:var(--bg)] [border-radius:var(--radius)]',
          'border border-white/10',
          'transform-gpu transition-transform duration-300 ease-in-out active:translate-y-[1px]',
          className,
        )}
        ref={ref}
        {...props}
      >
        {/* Shimmer beam */}
        <div
          className={cn(
            '-z-30 blur-[2px]',
            'absolute inset-0 overflow-visible [container-type:size]',
          )}
        >
          <div className="absolute inset-0 h-[100cqh] animate-shimmer-slide [aspect-ratio:1] [border-radius:0] [mask:none]">
            <div className="animate-spin-around absolute inset-[-100%] w-auto rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]" />
          </div>
        </div>

        {children}

        {/* Inset highlight */}
        <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_-6px_10px_rgba(255,255,255,0.15)] transition-shadow group-hover:shadow-[inset_0_-6px_10px_rgba(255,255,255,0.25)]" />

        {/* Background cutout */}
        <div className="absolute -z-20 [background:var(--bg)] [border-radius:var(--radius)] [inset:var(--cut)]" />
      </button>
    );
  },
);

ShimmerButton.displayName = 'ShimmerButton';
