'use client';

import { cn } from '../../../lib/utils';
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';

export interface DockItem {
  title: string;
  icon: React.ReactNode;
  href: string;
}

export function FloatingDock({
  items,
  className,
}: {
  items: DockItem[];
  className?: string;
}) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        'flex h-14 items-end gap-2 rounded-2xl',
        'bg-white/5 backdrop-blur-md border border-white/10',
        'px-4 pb-2',
        className,
      )}
    >
      {items.map((item) => (
        <DockIcon mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.div>
  );
}

function DockIcon({
  mouseX,
  title,
  icon,
  href,
}: {
  mouseX: MotionValue<number>;
  title: string;
  icon: React.ReactNode;
  href: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const sizeTransform = useTransform(distance, [-150, 0, 150], [36, 62, 36]);
  const iconSizeTransform = useTransform(distance, [-150, 0, 150], [18, 30, 18]);

  const size = useSpring(sizeTransform, { mass: 0.1, stiffness: 180, damping: 14 });
  const iconSize = useSpring(iconSizeTransform, { mass: 0.1, stiffness: 180, damping: 14 });

  const [hovered, setHovered] = useState(false);

  return (
    <Link href={href}>
      <motion.div
        ref={ref}
        style={{ width: size, height: size }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'relative flex items-center justify-center rounded-xl transition-colors duration-200',
          isActive
            ? 'bg-emerald-500/30 ring-1 ring-emerald-400/50'
            : 'bg-white/10 hover:bg-white/20',
        )}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 6, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 2, x: '-50%' }}
              transition={{ duration: 0.15 }}
              className="absolute -top-9 left-1/2 z-50 whitespace-nowrap rounded-lg border border-white/10 bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white shadow-lg"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active dot */}
        {isActive && (
          <span className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-400" />
        )}

        <motion.div
          style={{ width: iconSize, height: iconSize }}
          className="flex items-center justify-center"
        >
          {icon}
        </motion.div>
      </motion.div>
    </Link>
  );
}
