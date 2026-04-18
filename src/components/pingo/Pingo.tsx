import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type PingoPose = "wave" | "peek" | "point" | "cheer" | "think";

interface PingoProps {
  pose?: PingoPose;
  size?: number;
  className?: string;
  ariaLabel?: string;
  float?: boolean;
}

const PingoSVG: React.FC<{ pose: PingoPose }> = ({ pose }) => {
  const armLeft =
    pose === "wave"
      ? "M 55 105 Q 30 90 28 60"
      : pose === "point"
      ? "M 55 105 L 20 100"
      : "M 55 105 Q 40 130 45 155";
  const armRight = pose === "cheer" ? "M 105 105 Q 130 90 132 60" : "M 105 105 Q 120 130 115 155";
  const eyeY = pose === "think" ? 72 : 70;
  const mouth =
    pose === "cheer"
      ? "M 72 98 Q 80 112 88 98"
      : pose === "think"
      ? "M 74 100 L 86 100"
      : "M 72 98 Q 80 106 88 98";

  return (
    <svg viewBox="0 0 160 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="pingoBody" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#1a2a4a" />
          <stop offset="100%" stopColor="#0a1428" />
        </radialGradient>
        <radialGradient id="pingoBelly" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e8eef7" />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="100" rx="55" ry="65" fill="url(#pingoBody)" />
      <ellipse cx="80" cy="110" rx="36" ry="48" fill="url(#pingoBelly)" />
      <ellipse cx="62" cy="168" rx="14" ry="6" fill="#fe9400" />
      <ellipse cx="98" cy="168" rx="14" ry="6" fill="#fe9400" />
      <path d={armLeft} stroke="#0a1428" strokeWidth="18" strokeLinecap="round" fill="none" />
      <path d={armRight} stroke="#0a1428" strokeWidth="18" strokeLinecap="round" fill="none" />
      <circle cx="68" cy={eyeY} r="5" fill="#191c1e" />
      <circle cx="92" cy={eyeY} r="5" fill="#191c1e" />
      <circle cx="69.5" cy={eyeY - 1.5} r="1.6" fill="#ffffff" />
      <circle cx="93.5" cy={eyeY - 1.5} r="1.6" fill="#ffffff" />
      <path d="M 74 84 L 86 84 L 80 92 Z" fill="#fe9400" />
      <path d={mouth} stroke="#633700" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {pose === "cheer" && (
        <>
          <circle cx="60" cy="90" r="4" fill="#fe9400" opacity="0.4" />
          <circle cx="100" cy="90" r="4" fill="#fe9400" opacity="0.4" />
        </>
      )}
    </svg>
  );
};

export const Pingo: React.FC<PingoProps> = ({
  pose = "wave",
  size = 160,
  className,
  ariaLabel = "Pingo, the learning mascot",
  float = false,
}) => {
  const reduce = useReducedMotion();

  const floatAnim =
    float && !reduce
      ? {
          animate: { y: [0, -8, 0] },
          transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" as const },
        }
      : {};

  return (
    <motion.div
      role="img"
      aria-label={ariaLabel}
      className={cn("inline-block select-none", className)}
      style={{ width: size, height: (size * 180) / 160 }}
      {...floatAnim}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={pose}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="h-full w-full"
        >
          <PingoSVG pose={pose} />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
