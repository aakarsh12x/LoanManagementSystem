'use client';

import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useRef, useState, useEffect } from 'react';

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function Explosion({ x, y }: { x: number; y: number }) {
  const sparks = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    dx: randomBetween(-70, 70),
    dy: randomBetween(-120, -40),
  }));

  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{ left: x, top: y, transform: 'translate(-50%,-50%)' }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute -inset-x-8 top-0 mx-auto h-1 w-16 rounded-full bg-gradient-to-r from-transparent via-indigo-400 to-transparent blur-sm"
      />
      {sparks.map((s) => (
        <motion.span
          key={s.id}
          className="absolute h-1 w-1 rounded-full bg-gradient-to-b from-indigo-400 to-purple-500"
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: s.dx, y: s.dy, opacity: 0 }}
          transition={{ duration: randomBetween(8, 16) * 0.1, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

function Beam({
  xOffset,
  duration,
  delay,
  height,
  color,
  containerRef,
  parentRef,
}: {
  xOffset: number;
  duration: number;
  delay: number;
  height: string;
  color: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  parentRef: React.RefObject<HTMLDivElement | null>;
}) {
  const beamRef = useRef<HTMLDivElement>(null);
  const [explosion, setExplosion] = useState<{ x: number; y: number } | null>(null);
  const [beamKey, setBeamKey] = useState(0);
  const hitRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!beamRef.current || !containerRef.current || !parentRef.current || hitRef.current) return;
      const beam = beamRef.current.getBoundingClientRect();
      const container = containerRef.current.getBoundingClientRect();
      const parent = parentRef.current.getBoundingClientRect();

      if (beam.bottom >= container.top) {
        hitRef.current = true;
        setExplosion({
          x: beam.left - parent.left + beam.width / 2,
          y: beam.bottom - parent.top,
        });
        setTimeout(() => setExplosion(null), 1500);
        setTimeout(() => {
          setBeamKey((k) => k + 1);
          hitRef.current = false;
        }, duration * 1000 + delay * 1000);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [containerRef, parentRef, duration, delay]);

  return (
    <>
      <motion.div
        key={beamKey}
        ref={beamRef}
        initial={{ translateY: '-10%', opacity: 0.8 }}
        animate={{ translateY: '110vh', opacity: [0.8, 1, 0.8] }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'linear',
        }}
        style={{ left: xOffset }}
        className={cn('absolute top-0 w-px', height)}
        >
        <div
          className="h-full w-full rounded-full"
          style={{
            background: `linear-gradient(to bottom, transparent, ${color}, transparent)`,
          }}
        />
      </motion.div>
      <AnimatePresence>
        {explosion && (
          <Explosion key={`${explosion.x}-${explosion.y}`} x={explosion.x} y={explosion.y} />
        )}
      </AnimatePresence>
    </>
  );
}

const BEAMS = [
  { xOffset: 80,   duration: 7,  delay: 0,   height: 'h-16', color: '#818cf8' },
  { xOffset: 200,  duration: 5,  delay: 1.5, height: 'h-10', color: '#a78bfa' },
  { xOffset: 380,  duration: 9,  delay: 0.5, height: 'h-20', color: '#6366f1' },
  { xOffset: 550,  duration: 6,  delay: 2,   height: 'h-12', color: '#c084fc' },
  { xOffset: 720,  duration: 8,  delay: 0,   height: 'h-14', color: '#818cf8' },
  { xOffset: 900,  duration: 5,  delay: 3,   height: 'h-8',  color: '#a78bfa' },
  { xOffset: 1050, duration: 10, delay: 1,   height: 'h-20', color: '#6366f1' },
  { xOffset: 1200, duration: 6,  delay: 2.5, height: 'h-12', color: '#c084fc' },
];

export function BackgroundBeamsWithCollision({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={parentRef}
      className={cn(
        'relative min-h-screen w-full overflow-hidden bg-neutral-950',
        className,
      )}
    >
      {/* Radial glow at center */}
      <div className="pointer-events-none absolute inset-0 z-0 [background:radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(99,102,241,0.15),transparent)]" />

      {BEAMS.map((b, i) => (
        <Beam
          key={i}
          containerRef={containerRef}
          parentRef={parentRef}
          {...b}
        />
      ))}

      <div className="relative z-10">{children}</div>

      {/* Collision target — thin line at bottom */}
      <div
        ref={containerRef}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"
      />
    </div>
  );
}
