import CourseCard from '@/components/user/course/CourseCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Target, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useCourses } from '@/hooks/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { StatPill } from '@/components/ui/stat-pill';
import { Pingo, PingoBubble } from '@/components/pingo';

const Index = () => {
  const reduce = useReducedMotion();
  const {
    data: popularCoursesResponse,
    isLoading: isLoadingCourses,
    isError: isCoursesError,
    error: coursesError,
    refetch: refetchCourses,
  } = useCourses({
    page: 1,
    limit: 6,
    sortBy: 'ratingCount',
    sortOrder: 'desc',
    status: 'ACTIVE',
  });

  const popularCourses = popularCoursesResponse?.data?.slice(0, 3) ?? [];

  const reveal = (i = 0) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <div className="bg-background pb-14">
      <main>
        {/* Greeting hero — gradient + Pingo */}
        <section className="container mx-auto px-4">
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-3xl bg-hero-gradient p-8 text-white md:p-12"
          >
            <div aria-hidden className="absolute -right-20 -top-10 h-72 w-72 rounded-full bg-secondary/30 blur-3xl" />
            <div aria-hidden className="absolute -bottom-20 -left-10 h-80 w-80 rounded-full bg-primary-light/40 blur-3xl" />

            <div className="relative z-10 grid gap-8 md:grid-cols-[1.6fr_1fr] md:items-center">
              <div className="max-w-3xl">
                <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur-glass ring-1 ring-white/15">
                  Learning Workspace
                </p>
                <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
                  Giao diện học tập mới, <span className="text-secondary-light">giữ nguyên trải nghiệm cũ</span>
                </h1>
                <p className="mt-4 text-lg text-white/80">
                  Khám phá khoá học, theo dõi tiến độ và học theo nhịp của bạn với giao diện trực quan hơn.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/courses">
                    <Button variant="pingo" size="lg">
                      Bắt đầu học
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/my-courses">
                    <Button variant="glass" size="lg" className="text-white hover:text-foreground">
                      Khóa học của tôi
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="relative hidden items-center justify-end md:flex">
                <PingoBubble side="right" className="absolute right-32 top-6">
                  Chào cậu! Sẵn sàng học chưa?
                </PingoBubble>
                <Pingo pose="wave" size={180} float />
              </div>
            </div>
          </motion.div>
        </section>

        {/* Quick stats pills */}
        <section className="container mx-auto mt-10 px-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { icon: <Target className="h-5 w-5" />, label: 'Lộ trình cá nhân hóa', value: '08 đang theo học', tone: 'primary' as const },
              { icon: <BookOpen className="h-5 w-5" />, label: 'Nhiệm vụ hôm nay', value: '05 cần hoàn thành', tone: 'secondary' as const },
              { icon: <Layers className="h-5 w-5" />, label: 'Thẻ ghi nhớ cần ôn', value: '12 đến hạn', tone: 'muted' as const },
            ].map((item, i) => (
              <motion.div key={item.label} {...reveal(i)}>
                <StatPill
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                  tone={item.tone}
                  className="w-full"
                />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Popular courses */}
        <section className="container mx-auto mt-16 px-4">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Khoá học nổi bật</h2>
              <p className="mt-1 text-muted-foreground">Danh sách được cập nhật theo xu hướng học viên</p>
            </div>
            <Link to="/courses" className="font-semibold text-primary hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="grid min-h-[220px] gap-8 md:grid-cols-2 lg:grid-cols-3">
            {isLoadingCourses && (
              <LoadingSpinner className="col-span-full py-8" text="Đang tải khoá học nổi bật..." />
            )}
            {isCoursesError && (
              <ErrorMessage
                className="col-span-full"
                message={coursesError instanceof Error ? coursesError.message : 'Không thể tải dữ liệu.'}
                onRetry={refetchCourses}
              />
            )}
            {!isLoadingCourses && !isCoursesError && popularCourses.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground">
                Hiện chưa có khoá học nào phù hợp.
              </p>
            )}
            {!isLoadingCourses &&
              !isCoursesError &&
              popularCourses.map((course, i) => (
                <motion.div key={course.id} {...reveal(i)}>
                  <CourseCard course={course} />
                </motion.div>
              ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
