import { useState } from "react";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CourseRatingsResponse } from "@/types/student-learning";

type CourseReviewsProps = {
  ratings?: CourseRatingsResponse;
};

type FilterValue = "all" | "5" | "4" | "3" | "2" | "1";

export const CourseReviews = ({ ratings }: CourseReviewsProps) => {
  const [filter, setFilter] = useState<FilterValue>("all");

  if (!ratings || !Array.isArray(ratings.ratings)) {
    return (
      <div className="rounded-3xl border bg-background p-6 text-sm text-muted-foreground">
        Chưa có dữ liệu đánh giá cho khóa học này.
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
          <h3 className="text-lg font-semibold">Đánh giá khóa học</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-bold">
              {typeof ratings.averageScore === 'number' ? ratings.averageScore.toFixed(1) : '0.0'}
            </span>
            {renderStars(Math.round(ratings.averageScore || 0))}
            <span className="text-xs text-muted-foreground">
              ({ratings.total || 0} đánh giá)
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
              {value === "all" ? "Tất cả" : `${value} sao`}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="h-72 pr-3">
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Không có đánh giá nào phù hợp với bộ lọc hiện tại.
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
                      {new Date(rating.createdAt).toLocaleDateString("vi-VN")}
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
                    <p className="font-semibold">Phản hồi từ giảng viên</p>
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


