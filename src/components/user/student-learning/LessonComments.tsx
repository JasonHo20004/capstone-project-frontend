import { useMemo, useState } from "react";
import { Send, SortAsc, SortDesc } from "lucide-react";
import { useTranslation } from "react-i18next";

import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateLessonComment, useLessonComments } from "@/hooks/api/use-student-learning";
import type { LessonComment } from "@/types/student-learning";

type LessonCommentsProps = {
  courseId?: string;
  lessonId?: string;
};

type SortOrder = "newest" | "oldest";

export const LessonComments = ({ courseId, lessonId }: LessonCommentsProps) => {
  const { t } = useTranslation("courses");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [content, setContent] = useState("");

  const { data, isLoading } = useLessonComments(courseId, lessonId, { page: 1, limit: 50 });
  const createCommentMutation = useCreateLessonComment(courseId, lessonId);

  const comments = useMemo<LessonComment[]>(() => {
    const list = data?.comments ?? [];
    return [...list].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
    });
  }, [data?.comments, sortOrder]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim() || !courseId || !lessonId) return;

    createCommentMutation.mutate(
      {
        content: content.trim(),
      },
      {
        onSuccess: () => {
          setContent("");
        },
      }
    );
  };

  return (
    <div className="space-y-6 rounded-3xl border bg-background p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">
            {t("studentLearning.lessonComments.heading")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("studentLearning.lessonComments.subtitle")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))}
          className="inline-flex items-center gap-1 rounded-full"
        >
          {sortOrder === "newest" ? (
            <>
              <SortDesc className="h-4 w-4" />
              {t("studentLearning.lessonComments.sortNewest")}
            </>
          ) : (
            <>
              <SortAsc className="h-4 w-4" />
              {t("studentLearning.lessonComments.sortOldest")}
            </>
          )}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border bg-muted/40 p-4">
        <Textarea
          placeholder={t("studentLearning.lessonComments.placeholder")}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={3}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {t("studentLearning.lessonComments.hint")}
          </p>
          <Button
            type="submit"
            className="rounded-full"
            disabled={!content.trim() || createCommentMutation.isPending || !lessonId}
          >
            <Send className="mr-1 h-4 w-4" />
            {t("studentLearning.lessonComments.send")}
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            {t("studentLearning.lessonComments.loading")}
          </p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("studentLearning.lessonComments.empty")}
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex items-start gap-3 rounded-2xl border bg-muted/40 p-3"
            >
              <UserAvatar src={undefined} name={comment.user.fullName} className="h-8 w-8 border" />
              <div className="flex-1 space-y-1 text-sm">
                <p className="font-medium leading-none">{comment.user.fullName}</p>
                <p className="text-muted-foreground">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
