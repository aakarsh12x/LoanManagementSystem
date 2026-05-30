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
  colorFrom = '#3b82f6', // Indigo / Blue
  colorTo = '#06b6d4',   // Cyan / Emerald
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      style={
        {
          '--size': `${size}px`,
          '--duration': `${duration}s`,
          '--border-width': `${borderWidth}px`,
          '--color-from': colorFrom,
          '--color-to': colorTo,
          '--delay': `-${delay}s`,
        } as React.CSSProperties
      }
      className={cn('border-beam', className)}
    />
  );
}
