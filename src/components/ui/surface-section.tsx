import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "surface" | "low" | "container" | "high" | "dim" | "hero";

const toneClass: Record<Tone, string> = {
  surface: "bg-surface",
  low: "bg-surface-low",
  container: "bg-surface-container",
  high: "bg-surface-high",
  dim: "bg-surface-dim",
  hero: "bg-hero-gradient text-white",
};

interface SurfaceSectionProps extends React.HTMLAttributes<HTMLElement> {
  tone?: Tone;
  as?: keyof JSX.IntrinsicElements;
}

export const SurfaceSection = React.forwardRef<HTMLElement, SurfaceSectionProps>(
  ({ tone = "surface", as: Tag = "section", className, ...props }, ref) => {
    const Component = Tag as keyof JSX.IntrinsicElements;
    return (
      <Component
        ref={ref as never}
        className={cn(
          toneClass[tone],
          "w-full transition-colors duration-500 ease-soft",
          className,
        )}
        {...props}
      />
    );
  },
);
SurfaceSection.displayName = "SurfaceSection";
