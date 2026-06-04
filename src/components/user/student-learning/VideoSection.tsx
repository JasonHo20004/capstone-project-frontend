import { useEffect, useRef } from "react";
import { Clock, MessageSquare, PlayCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

export const VideoSection = ({
  lesson,
  isLoading,
  onMarkComplete,
  markCompletedLoading,
}: VideoSectionProps) => {
  const { t } = useTranslation("courses");
  const videoAsset = lesson?.mediaAssets.find((asset) =>
    asset.assetType.toLowerCase().includes("video")
  );
  const isVideoLesson = Boolean(videoAsset?.assetUrl);

  // Persist playback position so refresh/tab-close doesn't lose progress.
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lessonId = lesson?.id;
  const storageKey = lessonId ? `lesson_video_pos_${lessonId}` : null;

  useEffect(() => {
    if (!storageKey || !videoRef.current) return;
    const video = videoRef.current;
    const onLoaded = () => {
      try {
        const saved = localStorage.getItem(storageKey);
        const savedTime = saved ? Number(saved) : 0;
        if (savedTime > 0 && savedTime < (video.duration || Infinity) - 1) {
          video.currentTime = savedTime;
        }
      } catch { /* ignore */ }
    };
    const save = () => {
      try {
        if (video.currentTime > 0) {
          localStorage.setItem(storageKey, String(Math.floor(video.currentTime)));
        }
      } catch { /* quota or private mode */ }
    };
    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('pause', save);
    const interval = setInterval(() => { if (!video.paused) save(); }, 5000);
    window.addEventListener('beforeunload', save);
    return () => {
      save();
      clearInterval(interval);
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('pause', save);
      window.removeEventListener('beforeunload', save);
    };
  }, [storageKey, videoAsset?.assetUrl]);

  return (
    <div className="rounded-3xl border bg-background shadow-lg">
      <div className="p-2 sm:p-4">
        {isLoading ? (
          <Skeleton className="aspect-video w-full rounded-2xl" />
        ) : (
          <AspectRatio ratio={16 / 9}>
            {isVideoLesson ? (
              <video
                ref={videoRef}
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
                  {t("studentLearning.videoSection.textContent")}
                </p>
                <p className="text-sm text-white/70 max-w-md">
                  {lesson?.description ??
                    t("studentLearning.videoSection.noVideoFallback")}
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
              {t("studentLearning.videoSection.currentLesson")}
            </p>
            <h2 className="text-2xl font-bold tracking-tight">
              {lesson?.title ?? t("studentLearning.videoSection.selectLessonTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {lesson?.description ??
                t("studentLearning.videoSection.selectLessonDesc")}
            </p>
          </div>
          <Button
            onClick={onMarkComplete}
            disabled={!lesson || markCompletedLoading}
            variant="secondary"
            className="self-start rounded-full md:self-center"
          >
            {markCompletedLoading
              ? t("studentLearning.videoSection.saving")
              : t("studentLearning.videoSection.markComplete")}
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
            <Clock className="h-3 w-3" />
            {formatDuration(lesson?.durationInSeconds)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
            <MessageSquare className="h-3 w-3" />
            {t("studentLearning.videoSection.newCommentsCount", {
              count: lesson?.recentComments?.length ?? 0,
            })}
          </span>
        </div>

        {lesson?.recentComments?.length ? (
          <div className="rounded-2xl border bg-muted/30 p-4">
            <p className="text-sm font-semibold">
              {t("studentLearning.videoSection.recentComments")}
            </p>
            <div className="mt-3 space-y-3">
              {lesson.recentComments.slice(0, 3).map((comment) => (
                <div
                  key={comment.id}
                  className="flex items-start gap-3 rounded-2xl bg-background/80 p-3"
                >
                  <UserAvatar src={undefined} name={comment.user.fullName} className="h-9 w-9 border" />
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
            {t("studentLearning.videoSection.noComments")}
          </div>
        )}

        {!isVideoLesson && lesson?.description && (
          <div className="rounded-2xl border bg-muted/40 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("studentLearning.videoSection.lessonContent")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {lesson.description}
            </p>
          </div>
        )}

        {!lesson && !isLoading && (
          <div className="rounded-2xl border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t("studentLearning.videoSection.pickLessonPrompt")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
