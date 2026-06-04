import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface StatCounterProps {
  /** Display string such as "50,000+", "98%", "200+" — the numeric part is animated. */
  value: string;
  durationMs?: number;
  className?: string;
}

interface ParsedValue {
  prefix: string;
  target: number;
  suffix: string;
  /** Whether the original number used grouping separators (e.g. 50,000). */
  grouped: boolean;
}

const parseValue = (value: string): ParsedValue => {
  const match = value.match(/([^\d]*)([\d.,]+)(.*)/);
  if (!match) {
    return { prefix: value, target: 0, suffix: '', grouped: false };
  }
  const [, prefix, rawNumber, suffix] = match;
  const grouped = rawNumber.includes(',');
  const target = Number(rawNumber.replace(/,/g, ''));
  return { prefix, target: Number.isFinite(target) ? target : 0, suffix, grouped };
};

const easeOutExpo = (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Counts up from 0 to the numeric portion of `value` when it first scrolls
 * into view. Honors reduced-motion by rendering the final value immediately.
 */
export default function StatCounter({ value, durationMs = 1600, className }: StatCounterProps) {
  const reduce = useReducedMotion();
  const { prefix, target, suffix, grouped } = parseValue(value);
  const [display, setDisplay] = useState(reduce ? target : 0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (reduce) {
      setDisplay(target);
      return;
    }
    const node = ref.current;
    if (!node) return;

    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || hasRun.current) return;
        hasRun.current = true;

        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / durationMs, 1);
          setDisplay(Math.round(easeOutExpo(progress) * target));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduce, target, durationMs]);

  const formatted = grouped ? display.toLocaleString('en-US') : String(display);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
