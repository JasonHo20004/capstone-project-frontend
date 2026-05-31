import { useTranslation } from "react-i18next";

import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { CourseContext } from "@/types/student-learning";

type CourseOverviewProps = {
  context?: CourseContext;
};

export const CourseOverview = ({ context }: CourseOverviewProps) => {
  const { t, i18n } = useTranslation("courses");
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

  return (
    <div className="space-y-6 rounded-3xl border bg-background p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{course.title}</h2>
          {course.description && (
            <p className="mt-2 text-sm text-muted-foreground">
              {course.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {course.category && (
              <Badge variant="outline" className="rounded-full">
                {course.category}
              </Badge>
            )}
            {course.courseLevel && (
              <Badge variant="secondary" className="rounded-full">
                {levelLabel}
              </Badge>
            )}
            <Badge variant="outline" className="rounded-full">
              {t("studentLearning.courseOverview.lessonsBadge", {
                count: course.totalLessons,
              })}
            </Badge>
            <Badge variant="outline" className="rounded-full">
              {t("studentLearning.courseOverview.minutesBadge", {
                count: totalMinutes || 0,
              })}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <div className="space-y-3 rounded-2xl border bg-muted/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {t("studentLearning.courseOverview.progressTitle")}
            </p>
            <span className="text-xs text-muted-foreground">
              {t("studentLearning.courseOverview.progressOfTotal", {
                completed: progress.completedLessons,
                total: progress.totalLessons,
              })}
            </span>
          </div>
          <Progress value={progress.progressPercentage} />
          <p className="text-xs text-muted-foreground">
            {t("studentLearning.courseOverview.progressPercentDone", {
              percent: progress.progressPercentage,
            })}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border bg-muted/40 p-4">
          <UserAvatar src={course.instructor.profilePicture} name={course.instructor.fullName} className="h-12 w-12 border" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              {t("studentLearning.courseOverview.instructor")}
            </p>
            <p className="text-sm leading-tight">{course.instructor.fullName}</p>
            <p className="text-xs text-muted-foreground">
              {t("studentLearning.courseOverview.ratingsFromLearners", {
                count: course.totalRatings,
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-muted/30 p-4">
        <p className="text-sm font-semibold">
          {t("studentLearning.courseOverview.whatYouLearnTitle")}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("studentLearning.courseOverview.whatYouLearnDesc")}
        </p>
      </div>

      <p className="text-[11px] text-muted-foreground">
        {t("studentLearning.courseOverview.lastUpdated", { date: formattedDate })}
      </p>
    </div>
  );
};
