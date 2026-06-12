import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
} from 'framer-motion';
import { cn } from '@/lib/utils';

/** True only when a precise pointer (mouse/trackpad) is available — so the
 *  tilt never fights touch scrolling on phones/tablets. */
function useFinePointer() {
  const [fine, setFine] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)');
    const on = () => setFine(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return fine;
}

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees on each axis. */
  maxTilt?: number;
  /** Hover scale. */
  scale?: number;
  /** Show the moving light glare. */
  glare?: boolean;
  /** Optional click handler (so the whole card can be clickable). */
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

/**
 * Pointer-driven 3D tilt wrapper. Rotates toward the cursor with a springy
 * follow and sweeps a soft light glare across the surface. Falls back to a
 * plain div when the user prefers reduced motion.
 *
 * The wrapper element receives `className`, so pass the full card styling
 * (radius, bg, shadow, `group`, `overflow-hidden`) here — the glare is clipped
 * by the wrapper's own `overflow-hidden`.
 */
export function TiltCard({
  children,
  className,
  maxTilt = 7,
  scale = 1.03,
  glare = true,
  onClick,
}: TiltCardProps) {
  const reduce = useReducedMotion();
  const finePointer = useFinePointer();
  const ref = useRef<HTMLDivElement>(null);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const opacity = useMotionValue(0);

  const sx = useSpring(px, { stiffness: 200, damping: 20 });
  const sy = useSpring(py, { stiffness: 200, damping: 20 });

  const rotateY = useTransform(sx, [0, 1], [-maxTilt, maxTilt]);
  const rotateX = useTransform(sy, [0, 1], [maxTilt, -maxTilt]);
  const glareX = useTransform(sx, [0, 1], ['0%', '100%']);
  const glareY = useTransform(sy, [0, 1], ['0%', '100%']);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.35), transparent 50%)`;

  // No tilt for reduced-motion users or touch devices — just a plain card.
  if (reduce || !finePointer) {
    return (
      <div className={className} onClick={onClick}>
        {children}
      </div>
    );
  }

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };

  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      onPointerMove={handleMove}
      onPointerEnter={() => opacity.set(1)}
      onPointerLeave={() => {
        opacity.set(0);
        px.set(0.5);
        py.set(0.5);
      }}
      style={{ rotateX, rotateY, transformPerspective: 900, transformStyle: 'preserve-3d' }}
      whileHover={{ scale }}
      transition={{ scale: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
      className={cn('relative', className)}
    >
      {children}
      {glare && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: glareBg, opacity }}
        />
      )}
    </motion.div>
  );
}

export default TiltCard;
