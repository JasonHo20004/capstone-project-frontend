import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Menu } from "lucide-react";

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
import { SyllabusSidebar } from "@/components/user/student-learning/SyllabusSidebar";
import { CourseOverview } from "@/components/user/student-learning/CourseOverview";
import { LessonComments } from "@/components/user/student-learning/LessonComments";
import { CourseReviews } from "@/components/user/student-learning/CourseReviews";
import {
  useCourseContext,
  useCourseRatings,
  useLessonPlayer,
  useMarkLessonComplete,
} from "@/hooks/api/use-student-learning";

const DEFAULT_TAB: LearningTabId = "overview";

const StudentLearningPage = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeTab = (searchParams.get("tab") as LearningTabId | null) ?? DEFAULT_TAB;

  const handleForbidden = () => {
    if (!courseId) return;
    navigate(`/courses/${courseId}`, { replace: true });
  };

  const { data: context, isLoading: loadingContext } = useCourseContext(courseId, {
    onForbidden: handleForbidden,
  });

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

  const { data: lesson, isLoading: loadingLesson } = useLessonPlayer(
    courseId,
    effectiveLessonId,
    { onForbidden: handleForbidden }
  );

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
        <section className="bg-gradient-hero py-10 text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="font-['Be Vietnam Pro'] text-3xl font-bold md:text-4xl">
                  Phòng học trực tuyến
                </h1>
                <p className="mt-2 text-primary-foreground/80">
                  Xem video, trao đổi và đánh giá khóa học bạn đã đăng ký.
                </p>
              </div>
              <div className="flex items-center gap-3 md:hidden">
                <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                  <DrawerTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="inline-flex items-center gap-2 rounded-full bg-background/10 text-primary-foreground"
                    >
                      <Menu className="h-4 w-4" />
                      Bài học
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Danh sách bài học</DrawerTitle>
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
                <VideoSection
                  lesson={lesson}
                  isLoading={loadingContext || loadingLesson}
                  onMarkComplete={handleMarkComplete}
                  markCompletedLoading={markCompleteMutation.isPending}
                />

                <LearningTabs activeTab={activeTab} onTabChange={handleTabChange} />

                {activeTab === "overview" && <CourseOverview context={context} />}
                {activeTab === "comments" && (
                  <LessonComments courseId={courseId} lessonId={effectiveLessonId} />
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


