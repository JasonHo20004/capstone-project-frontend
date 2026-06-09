import { CheckCircle2, Clock, ListChecks, PlayCircle, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

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
  return (
    <div className="flex h-full flex-col rounded-3xl border bg-background p-4 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("studentLearning.syllabusSidebar.lessonsLabel")}
          </p>
          <h3 className="text-xl font-bold">
            {t("studentLearning.syllabusSidebar.title")}
          </h3>
        </div>
        <ListChecks className="h-6 w-6 text-primary" />
      </div>

      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-3">
          {isLoading &&
            Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="animate-pulse rounded-2xl border border-dashed bg-muted/30 p-4"
              >
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="mt-3 h-3 w-1/3 rounded bg-muted" />
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
              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => onSelectLesson(lesson.id)}
                  className={cn(
                    "w-full rounded-2xl border p-4 text-left transition hover:border-primary hover:bg-primary/5",
                    isActive && "border-primary bg-primary/10 shadow-lg"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted font-semibold">
                      {lesson.lessonOrder ?? index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{lesson.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {lesson.description ?? t("studentLearning.syllabusSidebar.noDescription")}
                      </p>
                    </div>
                    {lesson.isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <PlayCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(lesson.durationInSeconds, t)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-1">
                      <MessageCircle size={14} />{" "}
                      {t("studentLearning.syllabusSidebar.comments", {
                        count: lesson.commentCount ?? 0,
                      })}
                    </span>
                  </div>
                </button>
              );
            })}
        </div>
      </ScrollArea>
    </div>
  );
};
