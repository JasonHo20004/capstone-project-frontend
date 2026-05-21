import { useEffect, useState, useRef } from "react";

interface TimerProps {
  seconds: number;
  onExpire: () => void;
  resetKey?: string | number;
}

export function Timer({ seconds, onExpire, resetKey }: TimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setRemaining(seconds);
    const startTs = Date.now();
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTs) / 1000);
      const next = Math.max(0, seconds - elapsed);
      setRemaining(next);
      if (next <= 0) {
        onExpireRef.current();
      }
    };
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [seconds, resetKey]);

  const ratio = remaining / seconds;
  let color = "text-emerald-600";
  if (ratio < 0.3) color = "text-red-600";
  else if (ratio < 0.6) color = "text-amber-500";

  const pulse = remaining <= 5 && remaining > 0 ? "animate-pulse" : "";

  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");

  return (
    <div
      aria-live="polite"
      className={`flex items-center gap-2 font-mono text-2xl font-bold ${color} ${pulse}`}
    >
      <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2 2M9 2h6" />
      </svg>
      <span>
        {mm}:{ss}
      </span>
    </div>
  );
}
