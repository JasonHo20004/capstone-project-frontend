import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Celebration — a one-shot confetti shower for achievement moments
 * (test passed, placement complete, level up). Renders a fixed,
 * pointer-events-none overlay so it can be dropped anywhere without
 * affecting layout. No-ops under prefers-reduced-motion.
 *
 * The burst re-runs whenever `fire` transitions falsy → truthy.
 */

const COLORS = [
  '#0058bc', // primary
  '#0070eb', // primary-light
  '#fe9400', // secondary
  '#ffb874', // secondary-light
  '#10b981', // emerald
  '#ffffff',
  '#f43f5e', // rose
];

interface CelebrationProps {
  /** Run a burst while truthy; re-fires on each falsy→truthy flip. */
  fire?: boolean;
  pieceCount?: number;
  durationMs?: number;
}

export function Celebration({ fire = true, pieceCount = 110, durationMs = 4200 }: CelebrationProps) {
  const reduce = useReducedMotion();
  const [runId, setRunId] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!fire || reduce) return;
    setRunId((id) => id + 1);
    setActive(true);
    const timer = setTimeout(() => setActive(false), durationMs);
    return () => clearTimeout(timer);
  }, [fire, reduce, durationMs]);

  const pieces = useMemo(
    () =>
      Array.from({ length: pieceCount }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 6 + Math.random() * 8,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 0.6,
        duration: 2.6 + Math.random() * 1.6,
        drift: (Math.random() - 0.5) * 180,
        rotate: 180 + Math.random() * 600,
        round: Math.random() > 0.5,
      })),
    // runId forces a fresh random layout per burst
    [pieceCount, runId],
  );

  if (reduce || !active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={`${runId}-${p.id}`}
          initial={{ y: '-12vh', x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: '112vh', x: p.drift, opacity: [1, 1, 0.9, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            left: `${p.left}vw`,
            top: 0,
            width: p.size,
            height: p.size * (p.round ? 1 : 0.5),
            backgroundColor: p.color,
            borderRadius: p.round ? '9999px' : '2px',
          }}
        />
      ))}
    </div>
  );
}

export default Celebration;
