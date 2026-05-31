import { useState } from "react";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CourseRatingsResponse } from "@/types/student-learning";

type CourseReviewsProps = {
  ratings?: CourseRatingsResponse;
};

type FilterValue = "all" | "5" | "4" | "3" | "2" | "1";

export const CourseReviews = ({ ratings }: CourseReviewsProps) => {
  const { t, i18n } = useTranslation("courses");
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-GB";
  const [filter, setFilter] = useState<FilterValue>("all");

  if (!ratings || !Array.isArray(ratings.ratings)) {
    return (
      <div className="rounded-3xl border bg-background p-6 text-sm text-muted-foreground">
        {t("studentLearning.courseReviews.emptyData")}
      </div>
    );
  }

  const filtered = ratings.ratings.filter((rating) =>
    filter === "all" ? true : rating.score === Number(filter)
  );

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={`h-4 w-4 ${
              index < score ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 rounded-3xl border bg-background p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">
            {t("studentLearning.courseReviews.heading")}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-bold">
              {typeof ratings.averageScore === 'number' ? ratings.averageScore.toFixed(1) : '0.0'}
            </span>
            {renderStars(Math.round(ratings.averageScore || 0))}
            <span className="text-xs text-muted-foreground">
              {t("studentLearning.courseReviews.ratingsCount", {
                count: ratings.total || 0,
              })}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", "5", "4", "3", "2", "1"].map((value) => (
            <Button
              key={value}
              type="button"
              variant={filter === value ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setFilter(value as FilterValue)}
            >
              {value === "all"
                ? t("studentLearning.courseReviews.filterAll")
                : t("studentLearning.courseReviews.filterStars", { count: Number(value) })}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="h-72 pr-3">
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("studentLearning.courseReviews.noResults")}
            </p>
          ) : (
            filtered.map((rating) => (
              <div
                key={rating.id}
                className="space-y-2 rounded-2xl border bg-muted/40 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {rating.user.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(rating.createdAt).toLocaleDateString(dateLocale)}
                    </p>
                  </div>
                  {renderStars(rating.score)}
                </div>
                {rating.content && (
                  <p className="text-sm text-muted-foreground">
                    {rating.content}
                  </p>
                )}
                {rating.replyContent && (
                  <div className="mt-2 rounded-xl bg-background/80 p-3 text-xs">
                    <p className="font-semibold">
                      {t("studentLearning.courseReviews.instructorReply")}
                    </p>
                    <p className="mt-1 text-muted-foreground">{rating.replyContent}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
