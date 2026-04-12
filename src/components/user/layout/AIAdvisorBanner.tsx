// =============================================================================
// AIAdvisorBanner — Glassmorphism animated advisor notification
// Appears at the top of the main content area when advisor has an action.
// =============================================================================

import { useEffect, useState } from "react";
import type { AdvisorAction } from "@/lib/api/services/user/advisor/advisor.service";

interface AIAdvisorBannerProps {
  action: AdvisorAction;
  onDismiss: () => void;
  onCourseClick?: (courseId: string) => void;
}

const ACTION_CONFIG = {
  SHOW_BANNER: {
    icon: "auto_awesome",
    gradient: "from-blue-500/15 to-indigo-500/10",
    border: "border-blue-400/30",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    label: "AI Insight",
    labelColor: "text-blue-400",
  },
  SUGGEST_COURSE: {
    icon: "school",
    gradient: "from-violet-500/15 to-purple-500/10",
    border: "border-violet-400/30",
    iconBg: "bg-violet-500/20",
    iconColor: "text-violet-400",
    label: "Course Recommendation",
    labelColor: "text-violet-400",
  },
  UNLOCK_TIP: {
    icon: "lightbulb",
    gradient: "from-amber-500/15 to-yellow-500/10",
    border: "border-amber-400/30",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    label: "Study Tip",
    labelColor: "text-amber-400",
  },
  SEND_REMINDER: {
    icon: "notifications_active",
    gradient: "from-emerald-500/15 to-green-500/10",
    border: "border-emerald-400/30",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    label: "Study Reminder",
    labelColor: "text-emerald-400",
  },
} as const;

export function AIAdvisorBanner({
  action,
  onDismiss,
  onCourseClick,
}: AIAdvisorBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const config = ACTION_CONFIG[action.type] ?? ACTION_CONFIG.SHOW_BANNER;

  // Mount animation
  useEffect(() => {
    const t = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Auto-dismiss after 12 seconds for reminders, keep others until dismissed
  useEffect(() => {
    if (action.type === "SEND_REMINDER") {
      const t = setTimeout(handleDismiss, 12_000);
      return () => clearTimeout(t);
    }
  }, [action.type]);

  function handleDismiss() {
    setIsLeaving(true);
    setTimeout(onDismiss, 350); // wait for exit animation
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        // Layout
        "mx-4 mt-3 rounded-2xl border px-4 py-3",
        // Glassmorphism
        `bg-gradient-to-r ${config.gradient} backdrop-blur-md`,
        config.border,
        // Shadow
        "shadow-lg shadow-black/5",
        // Transition
        "transition-all duration-350 ease-out",
        // Mount / unmount animation
        isVisible && !isLeaving
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-3 pointer-events-none",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start gap-3">
        {/* AI Icon */}
        <div
          className={`flex-shrink-0 size-9 rounded-xl ${config.iconBg} flex items-center justify-center`}
        >
          <span className={`material-symbols-outlined text-[20px] ${config.iconColor}`}>
            {config.icon}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`text-[10px] font-bold uppercase tracking-widest ${config.labelColor}`}
            >
              {config.label}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">· AI Advisor</span>
          </div>

          <p className="text-sm font-medium text-slate-800 leading-snug">{action.message}</p>

          {/* Evidence pill */}
          {action.evidence && (
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              <span className="material-symbols-outlined text-[12px] align-middle mr-0.5 text-slate-400">
                analytics
              </span>
              {action.evidence}
            </p>
          )}

          {/* CTA for course suggestion */}
          {action.type === "SUGGEST_COURSE" && action.courseId && onCourseClick && (
            <button
              type="button"
              onClick={() => {
                onCourseClick(action.courseId!);
                handleDismiss();
              }}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              View Course
            </button>
          )}
        </div>

        {/* Dismiss */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss advisor tip"
          className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100/60 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  );
}
