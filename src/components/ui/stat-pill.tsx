import * as React from "react";
import { cn } from "@/lib/utils";

interface StatPillProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: "primary" | "secondary" | "muted";
}

const toneClass: Record<NonNullable<StatPillProps["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/15 text-secondary-foreground",
  muted: "bg-surface-container text-muted-foreground",
};

export const StatPill = React.forwardRef<HTMLDivElement, StatPillProps>(
  ({ icon, label, value, tone = "muted", className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm",
        "ring-1 ring-border/10 bg-surface-lowest",
        "transition-all duration-300 ease-soft hover:shadow-md",
        className,
      )}
      {...props}
    >
      {icon && (
        <span
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-lg",
            toneClass[tone],
          )}
        >
          {icon}
        </span>
      )}
      <span className="flex flex-col leading-tight">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="font-display text-lg font-bold text-foreground">{value}</span>
      </span>
    </div>
  ),
);
StatPill.displayName = "StatPill";
