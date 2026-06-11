import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Menu, Columns } from "lucide-react";
import { useTranslation } from "react-i18next";

import Navbar from "@/components/user/layout/Navbar";
import Footer from "@/components/user/layout/Footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LearningTabs, type LearningTabId } from "@/components/user/student-learning/LearningTabs";
import { VideoSection } from "@/components/user/student-learning/VideoSection";
import { LessonTestRunner } from "@/components/user/student-learning/LessonTestRunner";
import { SyllabusSidebar } from "@/components/user/student-learning/SyllabusSidebar";
import { CourseOverview } from "@/components/user/student-learning/CourseOverview";
import DiscussionSection from "@/components/DiscussionSection";
import { CourseReviews } from "@/components/user/student-learning/CourseReviews";
import {
  useCourseContext,
  useCourseRatings,
  useLessonPlayer,
  useMarkLessonComplete,
  useCertificate,
  isForbiddenError,
} from "@/hooks/api/use-student-learning";
import { CertificateModal } from "@/components/user/certificate/CertificateModal";
import { Celebration } from "@/components/ui/celebration";
import { studentLearningService } from "@/lib/api/services/user/learning/student-learning.service";

// Lazy so three.js stays out of the initial bundle.
const PenguinHero3D = lazy(() => import("@/components/user/home/PenguinHero3D"));

const DEFAULT_TAB: LearningTabId = "overview";

const StudentLearningPage = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useTranslation("courses");

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("learning_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("learning_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const activeTab = (searchParams.get("tab") as LearningTabId | null) ?? DEFAULT_TAB;

  const handleForbidden = useCallback(() => {
    if (!courseId) return;
    navigate(`/courses/${courseId}`, { replace: true });
  }, [courseId, navigate]);

  const { data: context, isLoading: loadingContext, error: contextError } = useCourseContext(courseId);

  useEffect(() => {
    if (contextError && isForbiddenError(contextError)) {
      handleForbidden();
    }
  }, [contextError, handleForbidden]);

  const effectiveLessonId = useMemo(() => {
    if (lessonId) return lessonId;
    const firstLesson = context?.course ? context.syllabus[0] : undefined;
    return firstLesson?.id;
  }, [lessonId, context?.course, context?.syllabus]);

  useEffect(() => {
    if (courseId && !lessonId && effectiveLessonId) {
      navigate(`/learning/courses/${courseId}/lessons/${effectiveLessonId}?${searchParams.toString()}`, {
        replace: true,
      });
    }
  }, [courseId, lessonId, effectiveLessonId, navigate, searchParams]);

  const { data: lesson, isLoading: loadingLesson, error: lessonError } = useLessonPlayer(
    courseId,
    effectiveLessonId
  );

  useEffect(() => {
    if (lessonError && isForbiddenError(lessonError)) {
      handleForbidden();
    }
  }, [lessonError, handleForbidden]);

  const { data: ratings } = useCourseRatings(courseId, { page: 1, limit: 50 });
  const markCompleteMutation = useMarkLessonComplete(courseId, effectiveLessonId);
  const isLessonCompleted = useMemo(() => {
    if (!context?.syllabus || !effectiveLessonId) return false;
    const currentLesson = context.syllabus.find((item) => item.id === effectiveLessonId);
    return currentLesson?.isCompleted ?? false;
  }, [context?.syllabus, effectiveLessonId]);

  const { data: certificate } = useCertificate(courseId);
  const [showCertificate, setShowCertificate] = useState(false);

  // Celebrate the moment the course hits 100% — but only on the live transition
  // during this session, not on every revisit of an already-finished course.
  const [celebrateCompletion, setCelebrateCompletion] = useState(false);
  const prevProgressRef = useRef<number | null>(null);
  useEffect(() => {
    const pct = context?.progress?.progressPercentage;
    if (pct == null) return;
    if (prevProgressRef.current != null && prevProgressRef.current < 100 && pct === 100) {
      setCelebrateCompletion(true);
    }
    prevProgressRef.current = pct;
  }, [context?.progress?.progressPercentage]);

  const handleTabChange = (tab: LearningTabId) => {
    searchParams.set("tab", tab);
    setSearchParams(searchParams, { replace: true });
  };

  const handleSelectLesson = (newLessonId: string) => {
    if (!courseId) return;
    navigate(`/learning/courses/${courseId}/lessons/${newLessonId}?${searchParams.toString()}`);
    setDrawerOpen(false);
  };

  const handleMarkComplete = () => {
    if (!courseId || !effectiveLessonId) return;
    markCompleteMutation.mutate();
  };

  const nextLessonId = useMemo(() => {
    if (!context?.syllabus || !effectiveLessonId) return undefined;
    const idx = context.syllabus.findIndex((item) => item.id === effectiveLessonId);
    if (idx < 0) return undefined;
    return context.syllabus[idx + 1]?.id;
  }, [context?.syllabus, effectiveLessonId]);

  const goToNextLesson = useCallback(() => {
    if (!courseId || !nextLessonId) return;
    navigate(`/learning/courses/${courseId}/lessons/${nextLessonId}?${searchParams.toString()}`);
  }, [courseId, nextLessonId, navigate, searchParams]);

  // When a video plays to the end: mark this lesson complete (if it isn't
  // already), then advance to the next lesson once the mark-complete request
  // succeeds so the syllabus checkmark is in sync before we move on.
  const handleVideoEnded = useCallback(() => {
    if (!courseId || !effectiveLessonId) return;
    if (isLessonCompleted) {
      goToNextLesson();
      return;
    }
    markCompleteMutation.mutate(undefined, {
      onSuccess: () => goToNextLesson(),
    });
  }, [courseId, effectiveLessonId, isLessonCompleted, markCompleteMutation, goToNextLesson]);

  return (
    <div className="min-h-screen bg-background">
      {/* Course completed — celebrate the milestone */}
      <Celebration fire={celebrateCompletion} pieceCount={140} durationMs={5000} />

      <Navbar />

      <main className="pt-20 pb-12">
        <section className="relative overflow-hidden bg-hero-gradient py-12 text-white">
          <div aria-hidden className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-secondary/25 blur-3xl motion-safe:animate-float-slow" />
          <div aria-hidden className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-primary-light/35 blur-3xl motion-safe:animate-aurora" />
          {/* Brand mascot peeking from the right */}
          <div
            aria-hidden
            className="pointer-events-none absolute right-6 top-1/2 hidden h-44 w-44 -translate-y-1/2 lg:block lg:right-16 xl:h-52 xl:w-52"
          >
            <Suspense fallback={null}>
              <PenguinHero3D className="h-full w-full" />
            </Suspense>
          </div>
          <div className="container relative z-10 mx-auto px-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-secondary-light backdrop-blur-glass ring-1 ring-white/15">
                  {t("studentLearning.hero.badge")}
                </span>
                <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
                  {t("studentLearning.hero.title")}
                </h1>
                <p className="mt-2 text-white/80">
                  {t("studentLearning.hero.subtitle")}
                </p>

                {/* Course progress — visible at a glance */}
                {context && (
                  <div className="mt-5 flex max-w-sm items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-secondary to-secondary-light transition-all duration-700"
                        style={{ width: `${context.progress.progressPercentage}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-white">
                      {Math.round(context.progress.progressPercentage)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 md:hidden">
                <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                  <DrawerTrigger asChild>
                    <Button
                      variant="glass"
                      size="sm"
                      className="inline-flex items-center gap-2 rounded-full text-white hover:text-foreground"
                    >
                      <Menu className="h-4 w-4" />
                      {t("studentLearning.lessonsBtn")}
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>{t("studentLearning.syllabusSidebar.title")}</DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 pb-6">
                      <ScrollArea className="h-[60vh]">
                        <SyllabusSidebar
                          lessons={context?.syllabus}
                          currentLessonId={effectiveLessonId}
                          onSelectLesson={handleSelectLesson}
                        />
                      </ScrollArea>
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4">
            {/* Immersive Controls Bar for Desktop */}
            <div className="mb-4 hidden lg:flex items-center justify-between bg-surface-lowest p-3 border border-border/10 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                  {context?.course?.category || "Course"}
                </span>
                <span className="text-sm font-bold text-foreground truncate max-w-lg">
                  {context?.course?.title}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-low rounded-xl px-4 py-1.5 h-8 border border-border/10 hover:border-border/30 transition-all duration-300"
              >
                <Columns className="h-4 w-4" />
                {isSidebarCollapsed ? t("studentLearning.focusMode.showSyllabus") : t("studentLearning.focusMode.enterFocus")}
              </Button>
            </div>

            <div className={cn(
              "grid gap-6 transition-all duration-500 ease-soft",
              isSidebarCollapsed
                ? "grid-cols-1"
                : "lg:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]"
            )}>
              <div className="space-y-6">
                {lesson?.testId ? (
                  <LessonTestRunner
                    testId={lesson.testId}
                    lessonTitle={lesson.title}
                    onContinue={goToNextLesson}
                  />
                ) : (
                  <VideoSection
                    lesson={lesson}
                    isLoading={loadingContext || loadingLesson}
                    onMarkComplete={handleMarkComplete}
                    markCompletedLoading={markCompleteMutation.isPending}
                    isCompleted={isLessonCompleted}
                    onEnded={handleVideoEnded}
                  />
                )}

                <LearningTabs activeTab={activeTab} onTabChange={handleTabChange} />

                {activeTab === "overview" && (
                  <>
                    <CourseOverview context={context} />
                    {context && context.progress.progressPercentage === 100 && certificate && (
                      <div className="mt-4 px-1">
                        <button
                          onClick={() => setShowCertificate(true)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 shadow-sm shadow-amber-200/60 hover:from-amber-100 hover:to-yellow-100 hover:shadow-md transition-all"
                        >
                          <span className="text-xl motion-safe:animate-bounce">🏅</span>
                          <span className="text-sm font-semibold text-amber-800">{t("studentLearning.certificate.viewButton")}</span>
                          <span className="ml-auto text-amber-400">›</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
                {activeTab === "comments" && courseId && effectiveLessonId && (
                  <DiscussionSection
                    fetchComments={async (page, limit) => {
                      const res = await studentLearningService.getLessonComments(courseId, effectiveLessonId, { page, limit });
                      return { comments: res.data?.comments ?? [], total: res.data?.total ?? 0 };
                    }}
                    postComment={async (content, parentCommentId) => {
                      return studentLearningService.createLessonComment(courseId, effectiveLessonId, { content, parentCommentId });
                    }}
                    editComment={async (commentId, content) => {
                      return studentLearningService.editLessonComment(courseId, effectiveLessonId, commentId, content);
                    }}
                    reportComment={async (commentId, payload) => {
                      return studentLearningService.reportLessonComment(courseId, effectiveLessonId, commentId, payload);
                    }}
                    title={t("studentLearning.lessonComments.heading")}
                    subtitle={t("studentLearning.lessonComments.subtitle")}
                  />
                )}
                {activeTab === "reviews" && <CourseReviews ratings={ratings} />}
              </div>

              {!isSidebarCollapsed && (
                <div className="hidden lg:block animate-in fade-in slide-in-from-right duration-300">
                  <SyllabusSidebar
                    lessons={context?.syllabus}
                    currentLessonId={effectiveLessonId}
                    onSelectLesson={handleSelectLesson}
                    isLoading={loadingContext}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {showCertificate && certificate && (
        <CertificateModal certificate={certificate} onClose={() => setShowCertificate(false)} />
      )}

      <Footer />
    </div>
  );
};

export default StudentLearningPage;
