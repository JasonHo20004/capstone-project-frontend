import { Clock, MessageSquare, PlayCircle } from "lucide-react";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LessonPlayer } from "@/types/student-learning";

type VideoSectionProps = {
  lesson?: LessonPlayer;
  isLoading?: boolean;
  onMarkComplete?: () => void;
  markCompletedLoading?: boolean;
};

const formatDuration = (seconds?: number | null) => {
  if (!seconds) return "--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
};

const getInitials = (name?: string) => {
  if (!name) return "NN";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export const VideoSection = ({
  lesson,
  isLoading,
  onMarkComplete,
  markCompletedLoading,
}: VideoSectionProps) => {
  const videoAsset = lesson?.mediaAssets.find((asset) =>
    asset.assetType.toLowerCase().includes("video")
  );
  const isVideoLesson = Boolean(videoAsset?.assetUrl);

  return (
    <div className="rounded-3xl border bg-background shadow-lg">
      <div className="p-2 sm:p-4">
        {isLoading ? (
          <Skeleton className="aspect-video w-full rounded-2xl" />
        ) : (
          <AspectRatio ratio={16 / 9}>
            {isVideoLesson ? (
              <video
                controls
                className="h-full w-full rounded-2xl bg-black object-cover"
                src={videoAsset?.assetUrl}
                poster="/placeholder.svg"
              >
                <track kind="captions" />
              </video>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-center text-white">
                <PlayCircle className="mb-4 h-12 w-12 opacity-80" />
                <p className="text-lg font-semibold">
                  Nội dung dạng văn bản
                </p>
                <p className="text-sm text-white/70 max-w-md">
                  {lesson?.description ??
                    "Bài học này không có video. Hãy xem phần mô tả chi tiết phía dưới."}
                </p>
              </div>
            )}
          </AspectRatio>
        )}
      </div>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Bài học hiện tại
            </p>
            <h2 className="text-2xl font-bold tracking-tight">
              {lesson?.title ?? "Chọn một bài học để bắt đầu"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {lesson?.description ??
                "Chọn một bài học trong danh sách để xem nội dung chi tiết."}
            </p>
          </div>
          <Button
            onClick={onMarkComplete}
            disabled={!lesson || markCompletedLoading}
            variant="secondary"
            className="self-start rounded-full md:self-center"
          >
            {markCompletedLoading ? "Đang lưu..." : "Đánh dấu hoàn thành"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
            <Clock className="h-3 w-3" />
            {formatDuration(lesson?.durationInSeconds)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
            <MessageSquare className="h-3 w-3" />
            {lesson?.recentComments?.length ?? 0} bình luận mới
          </span>
        </div>

        {lesson?.recentComments?.length ? (
          <div className="rounded-2xl border bg-muted/30 p-4">
            <p className="text-sm font-semibold">Bình luận gần đây</p>
            <div className="mt-3 space-y-3">
              {lesson.recentComments.slice(0, 3).map((comment) => (
                <div
                  key={comment.id}
                  className="flex items-start gap-3 rounded-2xl bg-background/80 p-3"
                >
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback>{getInitials(comment.user.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium leading-none">{comment.user.fullName}</p>
                    <p className="text-muted-foreground">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Chưa có bình luận nào cho bài học này. Hãy trở thành người đầu tiên!
          </div>
        )}

        {!isVideoLesson && lesson?.description && (
          <div className="rounded-2xl border bg-muted/40 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Nội dung bài học
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {lesson.description}
            </p>
          </div>
        )}

        {!lesson && !isLoading && (
          <div className="rounded-2xl border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Vui lòng chọn một bài học ở cột bên phải để bắt đầu học.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

