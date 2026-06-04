import { type LucideIcon, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { wrap: "py-8 px-4", icon: "h-10 w-10", title: "text-sm", desc: "text-xs" },
  md: { wrap: "py-12 px-6", icon: "h-12 w-12", title: "text-base", desc: "text-sm" },
  lg: { wrap: "py-16 px-8", icon: "h-16 w-16", title: "text-lg", desc: "text-sm" },
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const s = sizeMap[size];
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-border bg-muted/30",
        s.wrap,
        className,
      )}
    >
      <div className={cn("mb-3 rounded-full bg-muted p-3 text-muted-foreground")}>
        <Icon className={s.icon} aria-hidden="true" />
      </div>
      <h3 className={cn("font-semibold text-foreground", s.title)}>{title}</h3>
      {description && (
        <p className={cn("mt-1 max-w-sm text-muted-foreground", s.desc)}>{description}</p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant ?? "default"}
          size="sm"
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
