import { Link } from "react-router-dom";
import { Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpgradeToProButtonProps {
  className?: string;
}

export function UpgradeToProButton({ className }: UpgradeToProButtonProps) {
  return (
    <Link
      to="/#pricing"
      title="Nâng cấp lên Pro"
      className={cn(
        "group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full",
        "px-3 py-2 sm:px-3.5 sm:py-2",
        "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500",
        "bg-[length:200%_100%] animate-shimmer",
        "text-white text-xs sm:text-sm font-semibold leading-none",
        "shadow-[0_4px_14px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/40",
        "transition-all duration-300 ease-soft",
        "hover:shadow-[0_6px_22px_rgba(245,158,11,0.55)] hover:-translate-y-[1px] hover:scale-[1.02]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2",
        className,
      )}
    >
      {/* Soft pulsing glow halo */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-amber-400/40 blur-md opacity-70 animate-pulse"
      />

      {/* Sweeping shine on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-10 w-10 translate-x-0 skew-x-[-20deg] bg-white/30 opacity-0 transition-all duration-700 ease-out group-hover:translate-x-[260%] group-hover:opacity-100"
      />

      <Crown className="h-4 w-4 drop-shadow-sm" strokeWidth={2.25} />
      <span className="hidden sm:inline">Nâng cấp Pro</span>
      <span className="sm:hidden">Pro</span>
      <Sparkles
        className="h-3.5 w-3.5 opacity-90 transition-transform duration-300 group-hover:rotate-12"
        strokeWidth={2.25}
      />
    </Link>
  );
}
