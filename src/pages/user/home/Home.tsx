import CourseCard from '@/components/user/course/CourseCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Target, Layers, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCourses, useUnreadNotificationCount } from '@/hooks/api';
import { useEnrolledCourses } from '@/hooks/api/use-courses';
import { useGetDecks } from '@/hooks/api/use-flashcards';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { StatPill } from '@/components/ui/stat-pill';

const Index = () => {
  const reduce = useReducedMotion();
  const { t } = useTranslation('dashboard');
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
                  {t('hero.eyebrow')}
                </p>
                <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
                  {t('hero.title')} <span className="text-secondary-light">{t('hero.titleAccent')}</span>
                </h1>
                <p className="mt-4 text-lg text-white/80">
                  {t('hero.subtitle')}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/#courses">
                    <Button variant="default" size="lg">
                      {t('hero.startLearning')}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/my-courses">
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white hover:text-primary"
                    >
                      {t('hero.myCourses')}
                    </Button>
                  </Link>
                </div>
              </div>

            </div>
          </motion.div>
        </section>

        {/* Quick stats pills */}
        <section className="container mx-auto mt-10 px-4">
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

        {/* Placement test CTA */}
        <section className="container mx-auto mt-10 px-4">
          <motion.div {...reveal(3)}>
            <div className="flex flex-col gap-4 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 to-cyan-50 p-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white shadow">
                  <ClipboardCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900">{t('placement.title')}</h3>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {t('placement.subtitle')}
                  </p>
                </div>
              </div>
              <Link to="/placement-test" className="shrink-0">
                <Button variant="default" className="w-full bg-teal-500 hover:bg-teal-600 md:w-auto">
                  {t('placement.cta')}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Popular courses */}
        <section className="container mx-auto mt-16 px-4">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{t('popular.title')}</h2>
              <p className="mt-1 text-muted-foreground">{t('popular.subtitle')}</p>
            </div>
            <Link to="/courses" className="font-semibold text-primary hover:underline">
              {t('popular.viewAll')}
            </Link>
          </div>
          <div className="grid min-h-[220px] gap-8 md:grid-cols-2 lg:grid-cols-3">
            {isLoadingCourses && (
              <LoadingSpinner className="col-span-full py-8" text={t('popular.loading')} />
            )}
            {isCoursesError && (
              <ErrorMessage
                className="col-span-full"
                message={coursesError instanceof Error ? coursesError.message : t('popular.loadError')}
                onRetry={refetchCourses}
              />
            )}
            {!isLoadingCourses && !isCoursesError && popularCourses.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground">
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
