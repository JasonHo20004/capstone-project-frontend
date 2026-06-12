import { CheckCircle2, Clock, ListChecks, Play, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { motion, useReducedMotion } from "framer-motion";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { SyllabusItem } from "@/types/student-learning";

type SyllabusSidebarProps = {
  lessons?: SyllabusItem[];
  currentLessonId?: string;
  onSelectLesson: (lessonId: string) => void;
  isLoading?: boolean;
};

const formatDuration = (seconds: number | null | undefined, t: TFunction) => {
  if (!seconds) return "--";
  const mins = Math.floor(seconds / 60);
  return t("studentLearning.syllabusSidebar.minutes", { count: mins });
};

export const SyllabusSidebar = ({
  lessons,
  currentLessonId,
  onSelectLesson,
  isLoading,
}: SyllabusSidebarProps) => {
  const { t } = useTranslation("courses");
  const reduceMotion = useReducedMotion() ?? false;

  const total = lessons?.length ?? 0;
  const completed = lessons?.filter((l) => l.isCompleted).length ?? 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-200/70 bg-white p-4 shadow-lg">
      {/* Header with progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">
              {t("studentLearning.syllabusSidebar.lessonsLabel")}
            </p>
            <h3 className="text-xl font-black tracking-tight text-slate-900">
              {t("studentLearning.syllabusSidebar.title")}
            </h3>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/30">
            <ListChecks className="h-5 w-5" />
          </span>
        </div>

        {!isLoading && total > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>{t("studentLearning.syllabusSidebar.completedOfTotal", { completed, total })}</span>
              <span className="tabular-nums text-indigo-600">{pct}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600"
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-2.5">
          {isLoading &&
            Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="animate-pulse rounded-2xl border border-dashed bg-slate-50 p-4"
              >
                <div className="h-4 w-2/3 rounded bg-slate-200" />
                <div className="mt-3 h-3 w-1/3 rounded bg-slate-200" />
              </div>
            ))}

          {!isLoading && lessons?.length === 0 && (
            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("studentLearning.syllabusSidebar.empty")}
            </div>
          )}

          {!isLoading &&
            lessons?.map((lesson, index) => {
              const isActive = lesson.id === currentLessonId;
              const isDone = lesson.isCompleted;
              const isLast = index === (lessons?.length ?? 0) - 1;

              return (
                <motion.button
                  key={lesson.id}
                  type="button"
                  onClick={() => onSelectLesson(lesson.id)}
                  initial={reduceMotion ? false : { opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: reduceMotion ? 0 : index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "group relative w-full rounded-2xl border p-3.5 pl-12 text-left transition-all duration-300",
                    isActive
                      ? "border-transparent bg-gradient-to-br from-indigo-500 via-blue-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                      : "border-slate-200/80 bg-white hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-md"
                  )}
                >
                  {/* Timeline rail + node */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-[22px] top-12 bottom-1 w-0.5",
                      isLast && "hidden",
                      isActive ? "bg-white/30" : isDone ? "bg-emerald-300" : "bg-slate-200"
                    )}
                  />
                  <span
                    className={cn(
                      "absolute left-3 top-3.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-black tabular-nums transition-colors",
                      isDone
                        ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/40"
                        : isActive
                        ? "bg-white/20 text-white backdrop-blur-sm ring-2 ring-white/40"
                        : "bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                    )}
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : lesson.lessonOrder ?? index + 1}
                  </span>

                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={cn("font-bold leading-snug", isActive ? "text-white" : "text-slate-800")}>
                        {lesson.title}
                      </p>
                      <p className={cn("mt-0.5 text-xs line-clamp-1", isActive ? "text-white/75" : "text-slate-400")}>
                        {lesson.description ?? t("studentLearning.syllabusSidebar.noDescription")}
                      </p>
                    </div>
                    {isActive && (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                        <Play className="h-3.5 w-3.5 fill-white text-white" />
                      </span>
                    )}
                  </div>

                  <div
                    className={cn(
                      "mt-2.5 flex flex-wrap gap-2 text-xs",
                      isActive ? "text-white/80" : "text-slate-400"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
                        isActive ? "bg-white/15" : "bg-slate-100/80"
                      )}
                    >
                      <Clock className="h-3 w-3" />
                      {formatDuration(lesson.durationInSeconds, t)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
                        isActive ? "bg-white/15" : "bg-slate-100/80"
                      )}
                    >
                      <MessageCircle className="h-3 w-3" />
                      {t("studentLearning.syllabusSidebar.comments", { count: lesson.commentCount ?? 0 })}
                    </span>
                  </div>
                </motion.button>
              );
            })}
        </div>
      </ScrollArea>
    </div>
  );
};
