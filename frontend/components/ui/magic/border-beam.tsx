import { cn } from '../../../lib/utils';

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export function BorderBeam({
  className,
  size = 250,
  duration = 14,
  borderWidth = 1.5,
  colorFrom = '#6366f1',
  colorTo = '#a855f7',
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      style={
        {
          '--size': size,
          '--duration': duration,
          '--border-width': borderWidth,
          '--color-from': colorFrom,
          '--color-to': colorTo,
          '--delay': `-${delay}s`,
        } as React.CSSProperties
      }
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit]',
        '[border:calc(var(--border-width)*1px)_solid_transparent]',
        '[background:linear-gradient(transparent,transparent),conic-gradient(from_calc(270deg-(var(--spread,90deg)*0.5)),transparent_0,var(--color-from)_var(--spread,90deg),var(--color-to),transparent_var(--spread,90deg))]',
        '[background-clip:padding-box,border-box] [background-origin:border-box]',
        '[animation:border-beam_calc(var(--duration)*1s)_linear_infinite]',
        '[animation-delay:var(--delay)]',
        className,
      )}
    />
  );
}
