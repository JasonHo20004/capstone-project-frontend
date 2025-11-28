import { useMemo, useState } from "react";
import { Send, SortAsc, SortDesc } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateLessonComment, useLessonComments } from "@/hooks/api/use-student-learning";
import type { LessonComment } from "@/types/student-learning";

type LessonCommentsProps = {
  courseId?: string;
  lessonId?: string;
};

type SortOrder = "newest" | "oldest";

const getInitials = (name?: string) => {
  if (!name) return "NN";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export const LessonComments = ({ courseId, lessonId }: LessonCommentsProps) => {
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
          <h3 className="text-lg font-semibold">Q&A / Bình luận bài học</h3>
          <p className="text-xs text-muted-foreground">
            Đặt câu hỏi hoặc thảo luận về nội dung bài học này.
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
              Mới nhất
            </>
          ) : (
            <>
              <SortAsc className="h-4 w-4" />
              Cũ nhất
            </>
          )}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border bg-muted/40 p-4">
        <Textarea
          placeholder="Đặt câu hỏi hoặc chia sẻ suy nghĩ của bạn..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={3}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Hãy giữ bình luận lịch sự và tập trung vào nội dung bài học.
          </p>
          <Button
            type="submit"
            className="rounded-full"
            disabled={!content.trim() || createCommentMutation.isPending || !lessonId}
          >
            <Send className="mr-1 h-4 w-4" />
            Gửi
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Đang tải bình luận...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có bình luận nào. Hãy là người đầu tiên đặt câu hỏi!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex items-start gap-3 rounded-2xl border bg-muted/40 p-3"
            >
              <Avatar className="h-8 w-8 border">
                <AvatarFallback>{getInitials(comment.user.fullName)}</AvatarFallback>
              </Avatar>
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


