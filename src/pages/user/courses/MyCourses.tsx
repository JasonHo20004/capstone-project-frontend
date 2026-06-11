import { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { usePurchases } from '@/context/PurchasesContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import {
  Search,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Loader2,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useCourseContext } from '@/hooks/api/use-student-learning';
import type { Course } from '@/domain';
import { cn } from '@/lib/utils';


// ─── Custom Card for Purchased Courses (displays progress) ─────────────
const PurchasedCourseCard = ({ course, viewMode = 'grid' }: { course: Course; viewMode?: 'grid' | 'list' }) => {
  const { t } = useTranslation('dashboard');
  const { data: context, isLoading } = useCourseContext(course.id);
  const reduce = useReducedMotion();

  if (isLoading) {
    return (
      <div className={cn(
        "animate-pulse rounded-2xl bg-surface-lowest p-5 border border-border/10 shadow-sm",
        viewMode === 'list' ? "flex gap-5 items-center w-full" : "h-[220px] w-full"
      )}>
        <div className={cn("bg-surface-container rounded-xl shrink-0", viewMode === 'list' ? "h-16 w-16" : "h-32 w-full")} />
        <div className="flex-1 space-y-3 mt-2">
          <div className="h-4 bg-surface-container rounded w-3/4" />
          <div className="h-3 bg-surface-container rounded w-1/2" />
          <div className="h-2 bg-surface-container rounded w-full" />
        </div>
      </div>
    );
  }

  const progress = context?.progress?.progressPercentage ?? 0;
  const completed = context?.progress?.completedLessons ?? 0;
  const total = context?.progress?.totalLessons ?? 0;
  const instructorName = context?.course?.instructor?.fullName || course.sellerName || t('courseCard.unknownInstructor', { ns: 'courses' });

  if (viewMode === 'list') {
    return (
      <Link to={`/learning/courses/${course.id}/lessons`} className="block w-full">
        <motion.div
          whileHover={reduce ? undefined : { x: 4 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-2xl bg-surface-lowest p-5 border border-border/15 shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-500 relative overflow-hidden group w-full"
        >
          {/* Left: Thumbnail */}
          <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-surface-low border border-border/10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] z-10" />
            <img
              src={course.thumbnailUrl || "/placeholder-course.jpg"}
              alt={course.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=200&auto=format&fit=crop";
              }}
            />
          </div>

          {/* Middle: Details */}
          <div className="flex-1 min-w-0 space-y-1 text-left">
            <div className="flex items-center gap-2">
              <span className="inline-block rounded-full bg-primary/5 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary ring-1 ring-primary/20">
                {course.courseLevel || "All Levels"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {instructorName}
              </span>
            </div>
            <h3 className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-snug">
              {course.title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {course.description}
            </p>
          </div>

          {/* Right: Progress & Action */}
          <div className="w-full sm:w-60 flex flex-col gap-3 shrink-0">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">
                  {progress === 100 ? t('enrolled.completed') : t('enrolled.lessonsCompleted', { completed, total })}
                </span>
                <span className="text-primary tabular-nums font-bold">{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs font-semibold group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300">
                {t('enrolled.continue')}
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  // Grid view (Standard card)
  return (
    <Link to={`/learning/courses/${course.id}/lessons`} className="block h-full">
      <motion.div
        whileHover={reduce ? undefined : { y: -6 }}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-surface-lowest p-5 border border-border/15 shadow-sm hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-500 ease-out"
      >
        {/* Top Image */}
        <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-xl bg-surface-low border border-border/10">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
          <img
            src={course.thumbnailUrl || "/placeholder-course.jpg"}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=200&auto=format&fit=crop";
            }}
          />
          <div className="absolute right-2 top-2 z-10">
            <span className="rounded-full bg-surface-lowest/90 backdrop-blur-sm px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary ring-1 ring-primary/20">
              {course.courseLevel || "All Levels"}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between text-left">
          <div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {instructorName}
            </span>
            <h3 className="mt-0.5 mb-1.5 line-clamp-2 font-display text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
              {course.title}
            </h3>
            <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {course.description}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">
                  {progress === 100 ? t('enrolled.completed') : t('enrolled.lessonsCompleted', { completed, total })}
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

            <Button size="sm" variant="outline" className="w-full h-9 rounded-lg text-xs font-semibold group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300">
              {t('enrolled.continue')}
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default function MyCourses() {
  const { items, isLoading, count } = usePurchases();
  const reduce = useReducedMotion();
  const { t } = useTranslation('courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      ({ course }) =>
        course.title.toLowerCase().includes(q) ||
        course.description?.toLowerCase().includes(q),
    );
  }, [items, searchQuery]);

  const totalCourses = count;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="font-medium text-muted-foreground">{t('myCourses.loading')}</p>
      </div>
    );
  }

  const reveal = (i = 0) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.45, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.section
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl bg-hero-gradient p-8 text-white md:p-10"
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div aria-hidden className="absolute -right-16 top-0 h-80 w-80 rounded-full bg-secondary/30 blur-3xl" />
        <div aria-hidden className="absolute -left-16 bottom-0 h-60 w-60 rounded-full bg-primary-light/40 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-glass ring-1 ring-white/20">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-secondary-light">
                {t('myCourses.eyebrow')}
              </span>
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              {t('myCourses.title')}
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-white/80">
              {t('myCourses.subtitle')}
            </p>
          </div>

          <div className="flex gap-3">
            <div className="glass min-w-[120px] rounded-xl px-5 py-4">
              <div className="mb-1 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">{t('myCourses.stats.owned')}</span>
              </div>
              <p className="font-display text-2xl font-extrabold text-foreground">{totalCourses}</p>
            </div>
            <div className="glass min-w-[120px] rounded-xl px-5 py-4">
              <div className="mb-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-secondary" />
                <span className="text-xs font-medium text-muted-foreground">{t('myCourses.stats.status')}</span>
              </div>
              <p className="mt-1 text-sm font-bold text-secondary-foreground">
                {totalCourses > 0 ? t('myCourses.stats.studying') : t('myCourses.stats.notStarted')}
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Action Bar */}
      {totalCourses > 0 && (
        <section className="sticky top-20 z-30 flex flex-col gap-3 rounded-2xl bg-white/80 backdrop-blur-xl p-4 shadow-lg shadow-slate-200/50 ring-1 ring-border/5 sm:flex-row sm:items-center sm:justify-between transition-all duration-300">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('myCourses.search')}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {t('myCourses.filterCount', { filtered: filteredItems.length, total: totalCourses })}
            </span>
            <div className="h-5 w-px bg-border/30" />
            <div className="flex rounded-xl bg-surface-container p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-1.5 transition-all duration-200 ease-soft ${
                  viewMode === 'grid'
                    ? 'bg-surface-lowest text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-lg p-1.5 transition-all duration-200 ease-soft ${
                  viewMode === 'list'
                    ? 'bg-surface-lowest text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Content */}
      {totalCourses === 0 ? (
        <section className="overflow-hidden rounded-2xl bg-surface-lowest shadow-md ring-1 ring-border/10">
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="relative mb-8">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10">
                <BookOpen className="h-12 w-12 text-primary/60" />
              </div>
            </div>

            <h2 className="mb-2 font-display text-2xl font-bold">{t('myCourses.emptyTitle')}</h2>
            <p className="mb-8 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t('myCourses.emptyDesc')}
            </p>

            <Link to="/courses">
              <Button variant="default" size="lg">
                <Sparkles className="mr-1 h-4 w-4" />
                {t('myCourses.exploreBtn')}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>

            <div className="mt-12 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { icon: BookOpen, title: t('myCourses.features.anytime'), desc: t('myCourses.features.anytimeDesc') },
                { icon: TrendingUp, title: t('myCourses.features.progress'), desc: t('myCourses.features.progressDesc') },
                { icon: GraduationCap, title: t('myCourses.features.certificate'), desc: t('myCourses.features.certificateDesc') },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  {...reveal(i)}
                  className="flex flex-col items-center gap-2 rounded-xl bg-surface-low p-4 ring-1 ring-border/10"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-lowest shadow-sm">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{feature.title}</span>
                  <span className="text-xs text-muted-foreground">{feature.desc}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : filteredItems.length === 0 ? (
        <section className="rounded-2xl bg-surface-lowest p-6 shadow-md ring-1 ring-border/10">
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container">
              <Search className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="mb-1 font-display text-lg font-semibold">{t('myCourses.noResults')}</p>
            <p className="text-sm text-muted-foreground">
              {t('myCourses.noResultsHint')}{' '}
              <button onClick={() => setSearchQuery('')} className="font-medium text-primary hover:underline">
                {t('myCourses.clearFilter')}
              </button>
            </p>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl bg-surface-lowest p-6 shadow-md ring-1 ring-border/10">
          <div
            className={
              viewMode === 'grid'
                ? 'grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'flex flex-col gap-4'
            }
          >
            {filteredItems.map(({ id, course }, i) => (
              <motion.div key={id} {...reveal(i)}>
                <PurchasedCourseCard course={course} viewMode={viewMode} />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
