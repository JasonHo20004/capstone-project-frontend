import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface MotionCardProps extends HTMLMotionProps<"div"> {
  interactive?: boolean;
  revealOnScroll?: boolean;
  delay?: number;
}

export const MotionCard = React.forwardRef<HTMLDivElement, MotionCardProps>(
  ({ className, interactive = true, revealOnScroll = false, delay = 0, children, ...props }, ref) => {
    const reduce = useReducedMotion();

    const hoverProps =
      interactive && !reduce
        ? {
            whileHover: { scale: 1.02, y: -2 },
            whileTap: { scale: 0.99 },
          }
        : {};

    const revealProps = revealOnScroll
      ? {
          initial: reduce ? { opacity: 0 } : { opacity: 0, y: 12 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-80px" },
          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay },
        }
      : {};

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-lg bg-card text-card-foreground shadow-md ring-1 ring-border/10 transition-shadow duration-300 ease-soft",
          interactive && "cursor-pointer hover:shadow-card-hover",
          className,
        )}
        {...hoverProps}
        {...revealProps}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);
MotionCard.displayName = "MotionCard";
