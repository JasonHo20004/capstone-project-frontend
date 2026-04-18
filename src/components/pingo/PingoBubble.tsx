import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PingoBubbleProps {
  children: React.ReactNode;
  side?: "left" | "right";
  className?: string;
}

export const PingoBubble: React.FC<PingoBubbleProps> = ({ children, side = "right", className }) => {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative max-w-xs rounded-2xl px-4 py-3 text-sm text-foreground",
        "glass shadow-lg",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 glass",
          side === "left" ? "-right-1.5" : "-left-1.5",
        )}
        aria-hidden
      />
      <span className="relative z-10 leading-relaxed">{children}</span>
    </motion.div>
  );
};
