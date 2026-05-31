import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";

import Navbar from "@/components/user/layout/Navbar";
import Footer from "@/components/user/layout/Footer";
import { Button } from "@/components/ui/button";
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
  isForbiddenError,
} from "@/hooks/api/use-student-learning";
import { studentLearningService } from "@/lib/api/services/user/learning/student-learning.service";

const DEFAULT_TAB: LearningTabId = "overview";

const StudentLearningPage = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useTranslation("courses");

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-12">
        <section className="relative overflow-hidden bg-hero-gradient py-12 text-white">
          <div aria-hidden className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-secondary/25 blur-3xl" />
          <div aria-hidden className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-primary-light/35 blur-3xl" />
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
            <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]">
              <div className="space-y-6">
                {lesson?.testId ? (
                  <LessonTestRunner
                    testId={lesson.testId}
                    lessonTitle={lesson.title}
                    onContinue={() => {
                      if (!context?.syllabus || !effectiveLessonId) return;
                      const idx = context.syllabus.findIndex((l) => l.id === effectiveLessonId);
                      const next = idx >= 0 ? context.syllabus[idx + 1] : undefined;
                      if (next && courseId) {
                        navigate(`/learning/courses/${courseId}/lessons/${next.id}`);
                      }
                    }}
                  />
                ) : (
                  <VideoSection
                    lesson={lesson}
                    isLoading={loadingContext || loadingLesson}
                    onMarkComplete={handleMarkComplete}
                    markCompletedLoading={markCompleteMutation.isPending}
                  />
                )}

                <LearningTabs activeTab={activeTab} onTabChange={handleTabChange} />

                {activeTab === "overview" && <CourseOverview context={context} />}
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

              <div className="hidden lg:block">
                <SyllabusSidebar
                  lessons={context?.syllabus}
                  currentLessonId={effectiveLessonId}
                  onSelectLesson={handleSelectLesson}
                  isLoading={loadingContext}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default StudentLearningPage;
