import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Clock,
  GraduationCap,
  Sparkles,
  BadgeCheck,
  Video,
  FileDown,
  MessagesSquare,
  Layers,
} from "lucide-react";

import { UserAvatar } from "@/components/ui/user-avatar";
import type { CourseContext } from "@/types/student-learning";

type CourseOverviewProps = {
  context?: CourseContext;
};

/** Animated SVG ring used inside the progress stat card. */
function RadialProgress({ value, reduceMotion }: { value: number; reduceMotion: boolean }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circ - (clamped / 100) * circ;

  return (
    <div className="relative h-[88px] w-[88px] shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} className="fill-none stroke-white/25" strokeWidth="8" />
        <motion.circle
          cx="40"
          cy="40"
          r={r}
          className="fill-none stroke-white"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: reduceMotion ? offset : circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: reduceMotion ? 0 : 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-black tabular-nums text-white">{Math.round(clamped)}%</span>
      </div>
    </div>
  );
}

export const CourseOverview = ({ context }: CourseOverviewProps) => {
  const { t, i18n } = useTranslation("courses");
  const reduceMotion = useReducedMotion() ?? false;
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-GB";

  if (!context) {
    return (
      <div className="rounded-3xl border bg-background p-6 text-sm text-muted-foreground">
        {t("studentLearning.courseOverview.emptyState")}
      </div>
    );
  }

  const { course, progress, syllabus } = context;

  const totalDuration = syllabus.reduce(
    (sum, item) => sum + (item.durationInSeconds ?? 0),
    0
  );
  const totalMinutes = Math.round(totalDuration / 60);

  const levelLabel = course.courseLevel
    ? t(`studentLearning.courseOverview.levels.${course.courseLevel}`, {
        defaultValue: course.courseLevel,
      })
    : null;

  const formattedDate = (() => {
    try {
      return new Date().toLocaleDateString(dateLocale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "";
    }
  })();

  const fadeUp = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-40px" },
          transition: { duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  const features = [
    { icon: Video, label: t("studentLearning.courseOverview.features.video"), tint: "text-primary bg-primary/10" },
    { icon: FileDown, label: t("studentLearning.courseOverview.features.materials"), tint: "text-emerald-500 bg-emerald-50" },
    { icon: MessagesSquare, label: t("studentLearning.courseOverview.features.qa"), tint: "text-secondary bg-secondary/10" },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-surface-lowest p-6 shadow-sm md:p-8">
      {/* decorative blooms */}
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-secondary/5 blur-3xl" />

      <div className="relative z-10 space-y-6">
        {/* ── Title + badges ─────────────────────────────────── */}
        <motion.div {...fadeUp(0)}>
          <h2 className="text-2xl font-black tracking-tight text-foreground">{course.title}</h2>
          {course.description && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{course.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
            {course.category && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-1 text-primary-dark ring-1 ring-primary/15">
                <Layers className="h-3 w-3" /> {course.category}
              </span>
            )}
            {levelLabel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-secondary/15 to-secondary/5 px-3 py-1 text-secondary-foreground ring-1 ring-secondary/20">
                <Sparkles className="h-3 w-3" /> {levelLabel}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-100">
              <BookOpen className="h-3 w-3" />
              {t("studentLearning.courseOverview.lessonsBadge", { count: course.totalLessons })}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1 text-amber-700 ring-1 ring-amber-100">
              <Clock className="h-3 w-3" />
              {t("studentLearning.courseOverview.minutesBadge", { count: totalMinutes || 0 })}
            </span>
          </div>
        </motion.div>

        {/* ── Stat cards ─────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Progress — radial ring */}
          <motion.div
            {...fadeUp(0.05)}
            className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-light to-primary p-4 text-white shadow-lg shadow-primary/20 transition-shadow duration-300 hover:shadow-primary/40"
          >
            <div aria-hidden className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
            <RadialProgress value={progress.progressPercentage} reduceMotion={reduceMotion} />
            <div className="relative z-10">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                {t("studentLearning.courseOverview.stats.progress")}
              </p>
              <p className="mt-0.5 text-sm font-bold leading-tight">
                {t("studentLearning.courseOverview.progressOfTotal", {
                  completed: progress.completedLessons,
                  total: progress.totalLessons,
                })}
              </p>
            </div>
          </motion.div>

          {/* Lessons */}
          <motion.div
            {...fadeUp(0.1)}
            className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 p-4 text-white shadow-lg shadow-emerald-500/20 transition-shadow duration-300 hover:shadow-emerald-500/40"
          >
            <div aria-hidden className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
            <div className="relative z-10 flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <BookOpen className="h-7 w-7" />
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-black leading-none tabular-nums">{course.totalLessons}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-white/70">
                {t("studentLearning.courseOverview.stats.lessons")}
              </p>
            </div>
          </motion.div>

          {/* Duration */}
          <motion.div
            {...fadeUp(0.15)}
            className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-secondary via-secondary-light to-secondary p-4 text-secondary-foreground shadow-lg shadow-secondary/20 transition-shadow duration-300 hover:shadow-secondary/40"
          >
            <div aria-hidden className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
            <div className="relative z-10 flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-2xl bg-white/25 backdrop-blur-sm">
              <Clock className="h-7 w-7" />
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-black leading-none tabular-nums">{totalMinutes || 0}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-secondary-foreground/70">
                {t("studentLearning.courseOverview.stats.duration")} ·{" "}
                {t("studentLearning.courseOverview.stats.minutesUnit")}
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── Instructor + What you'll learn ─────────────────── */}
        <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
          {/* Instructor */}
          <motion.div
            {...fadeUp(0.2)}
            className="flex items-center gap-3 rounded-2xl border border-border/60 bg-gradient-to-br from-surface-low to-surface-lowest p-4"
          >
            <div className="relative shrink-0">
              <UserAvatar
                src={course.instructor.profilePicture}
                name={course.instructor.fullName}
                className="h-14 w-14 ring-2 ring-primary/30 ring-offset-2"
              />
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow">
                <BadgeCheck className="h-4 w-4 text-primary" />
              </span>
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {t("studentLearning.courseOverview.verifiedInstructor")}
              </p>
              <p className="truncate text-sm font-bold text-foreground">{course.instructor.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {t("studentLearning.courseOverview.ratingsFromLearners", { count: course.totalRatings })}
              </p>
            </div>
          </motion.div>

          {/* What you'll learn */}
          <motion.div
            {...fadeUp(0.25)}
            className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-surface-lowest to-primary/5 p-4"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white shadow-sm shadow-primary/30">
                <GraduationCap className="h-4 w-4" />
              </span>
              <p className="text-sm font-bold text-foreground">
                {t("studentLearning.courseOverview.whatYouLearnTitle")}
              </p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("studentLearning.courseOverview.whatYouLearnDesc")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <span
                    key={f.label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-surface-lowest px-2.5 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-border/60"
                  >
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full ${f.tint}`}>
                      <Icon className="h-2.5 w-2.5" />
                    </span>
                    {f.label}
                  </span>
                );
              })}
            </div>
          </motion.div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          {t("studentLearning.courseOverview.lastUpdated", { date: formattedDate })}
        </p>
      </div>
    </div>
  );
};
