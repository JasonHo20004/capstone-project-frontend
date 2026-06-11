import CourseCard from '@/components/user/course/CourseCard';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BookOpen,
  Target,
  Layers,
  ClipboardCheck,
  Flame,
  Zap,
  Sparkles,
  GraduationCap,
  Network,
  Headphones,
  Route as RouteIcon,
  Tv,
  X,
  Compass,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCourses, useUnreadNotificationCount } from '@/hooks/api';
import { useEnrolledCourses } from '@/hooks/api/use-courses';
import { useGetDecks } from '@/hooks/api/use-flashcards';
import { useUser } from '@/hooks/api/use-user';
import { useAIAdvisor } from '@/hooks/use-ai-advisor';
import { useCourseContext } from '@/hooks/api/use-student-learning';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { StatPill } from '@/components/ui/stat-pill';
import type { Course } from '@/domain';

// ─── Enrolled Course Progress Card Component ─────────────────────────────
const EnrolledCourseProgressCard = ({ course }: { course: Course }) => {
  const { t } = useTranslation(['dashboard', 'courses']);
  const { data: context, isLoading } = useCourseContext(course.id);

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 rounded-2xl bg-surface-lowest p-4 border border-border/10 shadow-sm animate-pulse h-[132px]">
        <div className="h-16 w-16 rounded-xl bg-surface-container shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-surface-container rounded w-3/4" />
          <div className="h-3 bg-surface-container rounded w-1/2" />
        </div>
      </div>
    );
  }

  const progress = context?.progress?.progressPercentage ?? 0;
  const completed = context?.progress?.completedLessons ?? 0;
  const total = context?.progress?.totalLessons ?? 0;
  const instructorName =
    context?.course?.instructor?.fullName ||
    course.sellerName ||
    t('courseCard.unknownInstructor', { ns: 'courses' });

  return (
    <Link to={`/learning/courses/${course.id}/lessons`} className="block">
      <motion.div
        whileHover={{ y: -2, scale: 1.005 }}
        className="group flex flex-col justify-between h-[142px] rounded-2xl bg-surface-lowest p-5 border border-border/15 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
      >
        <div className="flex gap-4">
          <img
            src={course.thumbnailUrl || '/placeholder-course.jpg'}
            alt={course.title}
            className="h-14 w-14 rounded-xl object-cover ring-1 ring-border/10 shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=200&auto=format&fit=crop';
            }}
          />
          <div className="flex-1 min-w-0">
            <span className="inline-block rounded-full bg-primary/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary ring-1 ring-primary/20 mb-1">
              {course.courseLevel || 'All Levels'}
            </span>
            <h4 className="font-display font-bold text-sm text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
              {course.title}
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {instructorName}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 mt-2">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className="text-muted-foreground">
              {progress === 100
                ? t('enrolled.completed')
                : t('enrolled.lessonsCompleted', { completed, total })}
            </span>
            <span className="text-primary font-bold tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

// ─── AI Coach Card Component ─────────────────────────────────────────────
const AICoachCard = () => {
  const { t } = useTranslation('dashboard');
  const { user } = useUser();
  const { activeAction, dismiss } = useAIAdvisor({
    userId: user?.id,
    enabled: !!user?.id,
  });

  const getActionLink = (action: any) => {
    if (action.courseId) return `/learning/courses/${action.courseId}/lessons`;
    if (action.type === 'SEND_REMINDER') return '/my-progress';
    return '/exam';
  };

  if (!activeAction) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        className="rounded-3xl bg-surface-lowest border border-border/15 p-6 shadow-sm flex flex-col justify-between h-full min-h-[220px] relative overflow-hidden"
      >
        <div
          aria-hidden
          className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/5 blur-xl pointer-events-none"
        />
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Compass className="h-4 w-4" />
            </div>
            <h3 className="font-display font-bold text-xs text-foreground uppercase tracking-wider">
              {t('advisor.evidence')}
            </h3>
          </div>
          <p className="text-sm font-semibold text-foreground leading-snug">
            {user?.englishLevel
              ? t('placement.currentLevel', { level: user.englishLevel })
              : t('placement.noLevelDesc')}
          </p>
          {user?.learningGoals && user.learningGoals.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {user.learningGoals.map((goal) => (
                <span
                  key={goal}
                  className="text-[10px] font-bold bg-surface-low text-muted-foreground border border-border/10 rounded-full px-2.5 py-0.5 uppercase tracking-wider"
                >
                  {goal}
                </span>
              ))}
            </div>
          )}
        </div>
        {!user?.englishLevel && (
          <Link to="/placement-test" className="mt-4 shrink-0">
            <Button size="sm" className="w-full bg-primary text-white font-semibold rounded-xl text-xs h-9">
              {t('placement.cta')}
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl bg-surface-lowest border-2 border-primary/20 p-6 shadow-md flex flex-col justify-between h-full min-h-[220px] relative overflow-hidden"
    >
      <div className="absolute top-2 right-2">
        <button
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground p-1 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 animate-pulse">
            <Sparkles className="h-4 w-4" />
          </div>
          <h3 className="font-display font-bold text-xs text-orange-600 uppercase tracking-wider">
            {t('advisor.title')}
          </h3>
        </div>
        <p className="text-sm font-bold text-foreground leading-snug">
          {activeAction.message}
        </p>
        {activeAction.evidence && (
          <div className="text-xs text-muted-foreground mt-2 leading-relaxed bg-surface-low border border-border/10 p-2.5 rounded-xl">
            <span className="font-semibold text-foreground text-[10px] uppercase tracking-wider block mb-0.5">
              {t('advisor.evidence')}
            </span>
            {activeAction.evidence}
          </div>
        )}
      </div>

      <Link to={getActionLink(activeAction)} className="mt-5 shrink-0">
        <Button size="sm" className="w-full bg-gradient-to-r from-primary to-primary-light text-white font-semibold rounded-xl text-xs h-9 shadow-sm hover:shadow-md">
          {t('advisor.cta')}
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </Link>
    </motion.div>
  );
};

// ─── Continue Learning Section Component ───────────────────────────────
const ContinueLearningSection = () => {
  const { data: enrolled, isLoading: isLoadingEnrolled } = useEnrolledCourses();
  const { t } = useTranslation('dashboard');

  if (isLoadingEnrolled) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 bg-surface-container rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-surface-container rounded-2xl animate-pulse" />
          <div className="h-32 bg-surface-container rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const enrolledCount = enrolled?.length ?? 0;

  if (enrolledCount === 0) {
    return (
      <div className="rounded-3xl bg-surface-lowest border border-border/15 p-8 shadow-sm text-center flex flex-col items-center justify-center py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-display font-bold text-lg text-foreground mb-1">
          {t('enrolled.title')}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {t('enrolled.empty')}
        </p>
        <Link to="/#courses">
          <Button size="lg" className="rounded-2xl font-semibold bg-primary hover:bg-primary/90">
            <Sparkles className="mr-1.5 h-4 w-4" />
            {t('enrolled.explore')}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-extrabold text-xl text-foreground">
            {t('enrolled.title')}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('enrolled.subtitle')}
          </p>
        </div>
        <Link to="/my-courses" className="text-xs font-bold text-primary hover:underline">
          {t('popular.viewAll')}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {enrolled.slice(0, 2).map((course) => (
          <EnrolledCourseProgressCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
};

// ─── Quick Study Hub Component ───────────────────────────────────────────
const QuickStudyHub = () => {
  const { t } = useTranslation('dashboard');

  const hubItems = [
    {
      title: t('hub.exam'),
      desc: t('hub.examDesc'),
      path: '/exam',
      icon: <GraduationCap className="h-5 w-5 text-blue-500" />,
    },
    {
      title: t('hub.skillTree'),
      desc: t('hub.skillTreeDesc'),
      path: '/skill-tree',
      icon: <Network className="h-5 w-5 text-purple-500" />,
    },
    {
      title: t('hub.dictation'),
      desc: t('hub.dictationDesc'),
      path: '/dictation',
      icon: <Headphones className="h-5 w-5 text-emerald-500" />,
    },
    {
      title: t('hub.learningPath'),
      desc: t('hub.learningPathDesc'),
      path: '/learning-path',
      icon: <RouteIcon className="h-5 w-5 text-orange-500" />,
    },
    {
      title: t('hub.live'),
      desc: t('hub.liveDesc'),
      path: '/live',
      icon: <Tv className="h-5 w-5 text-rose-500" />,
    },
    {
      title: t('hub.flashcards'),
      desc: t('hub.flashcardsDesc'),
      path: '/flashcards',
      icon: <Layers className="h-5 w-5 text-amber-500" />,
    },
  ];

  return (
    <div className="rounded-3xl bg-surface-lowest border border-border/15 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="font-display font-extrabold text-lg text-foreground">
          {t('hub.title')}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t('hub.subtitle')}
        </p>
      </div>

      <div className="space-y-2.5">
        {hubItems.map((item) => (
          <Link key={item.path} to={item.path} className="block group">
            <motion.div
              whileHover={{ x: 4 }}
              className="flex items-center gap-3.5 p-3 rounded-2xl bg-surface-low/50 hover:bg-surface-low border border-transparent hover:border-border/10 transition-all duration-300"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-lowest shadow-sm group-hover:scale-105 transition-transform duration-300 shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                  {item.title}
                </h4>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {item.desc}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all duration-300 shrink-0" />
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
};

// ─── Main Index Dashboard Page Component ─────────────────────────────────
const Index = () => {
  const reduce = useReducedMotion();
  const { t } = useTranslation('dashboard');
  const { user } = useUser();
  const {
    data: popularCoursesResponse,
    isLoading: isLoadingCourses,
    isError: isCoursesError,
    error: coursesError,
    refetch: refetchCourses,
  } = useCourses({
    page: 1,
    limit: 12,
    sortBy: 'ratingCount',
    sortOrder: 'desc',
    status: 'ACTIVE',
  });

  const { data: enrolled } = useEnrolledCourses();
  const { data: unreadData } = useUnreadNotificationCount();
  const { data: decks } = useGetDecks();

  const ownedIds = new Set((enrolled ?? []).map((c) => c.id));
  const popularCourses = (popularCoursesResponse?.data ?? [])
    .filter((c) => !ownedIds.has(c.id))
    .slice(0, 3);

  const enrolledCount = enrolled?.length ?? 0;
  const unreadCount = unreadData?.total ?? 0;
  const deckCount = Array.isArray(decks) ? decks.length : 0;

  const pad2 = (n: number) => String(n).padStart(2, '0');

  const reveal = (i = 0) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <div className="bg-background pb-14 space-y-6">
      <main className="space-y-8">
        {/* Bento Grid Header */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Greeting Hero Card */}
          <div className="lg:col-span-2">
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden rounded-3xl bg-hero-gradient p-8 text-white md:p-10 shadow-lg h-full flex flex-col justify-between"
            >
              {/* Slowly-rotating gradient ambient bubbles */}
              <motion.div
                animate={
                  reduce
                    ? undefined
                    : {
                        scale: [1, 1.12, 1],
                        rotate: [0, 90, 0],
                      }
                }
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute -right-20 -top-10 h-72 w-72 rounded-full bg-secondary/25 blur-3xl pointer-events-none"
              />
              <motion.div
                animate={
                  reduce
                    ? undefined
                    : {
                        scale: [1, 1.08, 1],
                        rotate: [0, -90, 0],
                      }
                }
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute -bottom-20 -left-10 h-80 w-80 rounded-full bg-primary-light/35 blur-3xl pointer-events-none"
              />

              <div className="relative z-10">
                <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur-glass ring-1 ring-white/15">
                  <Sparkles className="h-3.5 w-3.5 text-secondary-light" />
                  {t('hero.eyebrow')}
                </p>
                <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
                  {t('hero.welcome')}{' '}
                  <span className="text-secondary-light">{user?.fullName ?? 'Learner'}</span>!
                </h1>
                <p className="mt-3 text-sm md:text-base text-white/80 max-w-xl">
                  {t('hero.subtitle')}
                </p>
              </div>

              {/* Learning stats & streak progress inline */}
              <div className="relative z-10 mt-8 flex flex-wrap items-center gap-6 border-t border-white/10 pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30">
                    <Flame className="h-6 w-6 fill-current animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">
                      {t('streak.days', { count: user?.streak ?? 0 })}
                    </p>
                    <p className="text-[10px] text-white/65 uppercase tracking-wider font-bold">
                      {t('streak.title')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30">
                    <Zap className="h-6 w-6 fill-current" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">
                      {user?.xp ?? 0} XP
                    </p>
                    <p className="text-[10px] text-white/65 uppercase tracking-wider font-bold">
                      Total XP
                    </p>
                  </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <div className="flex justify-between text-xs font-semibold text-white/80 mb-1">
                    <span>
                      {t('streak.dailyGoal', { xp: (user?.xp ?? 0) % 50, target: 50 })}
                    </span>
                    <span>{Math.round((((user?.xp ?? 0) % 50) / 50) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/15 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-secondary to-secondary-light rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((((user?.xp ?? 0) % 50) / 50) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* AI Coach Card */}
          <div>
            <AICoachCard />
          </div>
        </section>

        {/* Quick stats pills */}
        <section className="container mx-auto px-1">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                icon: <Target className="h-5 w-5" />,
                label: t('stats.enrolledLabel'),
                value: t('stats.enrolledValue', { count: pad2(enrolledCount) }),
                tone: 'primary' as const,
              },
              {
                icon: <BookOpen className="h-5 w-5" />,
                label: t('stats.unreadLabel'),
                value:
                  unreadCount > 0
                    ? t('stats.unreadValue', { count: pad2(unreadCount) })
                    : t('stats.unreadAllRead'),
                tone: 'secondary' as const,
              },
              {
                icon: <Layers className="h-5 w-5" />,
                label: t('stats.decksLabel'),
                value:
                  deckCount > 0
                    ? t('stats.decksValue', { count: pad2(deckCount) })
                    : t('stats.decksEmpty'),
                tone: 'muted' as const,
              },
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

        {/* Main Bento Body (Active courses & Hub) */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Enrolled Courses Progress */}
          <div className="lg:col-span-2">
            <ContinueLearningSection />
          </div>

          {/* Quick Study Hub */}
          <div>
            <QuickStudyHub />
          </div>
        </section>

        {/* Placement test CTA */}
        <section className="container mx-auto px-1">
          <motion.div {...reveal(3)}>
            <div className="flex flex-col gap-4 rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-50 to-cyan-50 p-6 dark:from-teal-950/20 dark:to-cyan-950/20 dark:border-teal-900/30 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white shadow">
                  <ClipboardCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                    {t('placement.title')}
                  </h3>
                  <p className="mt-0.5 text-xs md:text-sm text-slate-600 dark:text-slate-400">
                    {t('placement.subtitle')}
                  </p>
                </div>
              </div>
              <Link to="/placement-test" className="shrink-0">
                <Button variant="default" className="w-full bg-teal-500 hover:bg-teal-600 md:w-auto rounded-2xl">
                  {t('placement.cta')}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Popular courses */}
        <section className="container mx-auto px-1">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
                {t('popular.title')}
              </h2>
              <p className="mt-1 text-xs md:text-sm text-muted-foreground">
                {t('popular.subtitle')}
              </p>
            </div>
            <Link to="/courses" className="text-sm font-semibold text-primary hover:underline">
              {t('popular.viewAll')}
            </Link>
          </div>
          <div className="grid min-h-[220px] gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoadingCourses && (
              <LoadingSpinner className="col-span-full py-8" text={t('popular.loading')} />
            )}
            {isCoursesError && (
              <ErrorMessage
                className="col-span-full"
                message={
                  coursesError instanceof Error ? coursesError.message : t('popular.loadError')
                }
                onRetry={refetchCourses}
              />
            )}
            {!isLoadingCourses && !isCoursesError && popularCourses.length === 0 && (
              <p className="col-span-full text-center text-sm text-muted-foreground">
                {t('popular.empty')}
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
