import { Crown } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";

interface ProAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
}

/**
 * Premium avatar wrapper for Pro subscribers:
 * - Gold gradient ring frame
 * - Crown decoration offset diagonally above the avatar
 */
export function ProAvatar({ src, name, className }: ProAvatarProps) {
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      {/* Outer gold gradient ring (conic gradient for natural metallic feel) */}
      <span
        aria-hidden
        className="absolute inset-0 -m-[3px] rounded-full"
        style={{
          background:
            "conic-gradient(from 140deg, #fde68a 0deg, #f59e0b 90deg, #fbbf24 180deg, #d97706 270deg, #fde68a 360deg)",
        }}
      />
      {/* Inner spacer so the avatar image doesn't bleed into the ring */}
      <span aria-hidden className="absolute inset-0 -m-[1px] rounded-full bg-white" />

      <UserAvatar
        src={src}
        name={name}
        className="relative size-9 ring-0"
      />

      {/* Diagonally offset crown — sits above-left of the avatar at a tilt */}
      <span
        aria-hidden
        className="absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center rounded-full
                   bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600
                   shadow-[0_2px_6px_rgba(180,83,9,0.45)] rotate-[-18deg]"
      >
        <Crown className="h-3 w-3 text-white drop-shadow-sm" strokeWidth={2.5} />
      </span>
    </div>
  );
}

/**
 * Inline "PRO" badge — companion to ProAvatar, sits next to the username.
 * Uses the same gold language as the avatar frame.
 */
export function ProBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-[2px]",
        "text-[10px] font-extrabold tracking-wider uppercase leading-none text-amber-900",
        "bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-300",
        "ring-1 ring-inset ring-amber-500/40 shadow-[0_1px_2px_rgba(180,83,9,0.25)]",
        className,
      )}
    >
      <Crown className="h-2.5 w-2.5 -mt-[1px]" strokeWidth={2.75} />
      Pro
    </span>
  );
}
