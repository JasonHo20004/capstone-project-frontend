import { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import { BackToTopButton } from '@/components/user/layout/BackToTopButton';
import Hero from '@/components/user/home/Hero';
import Features from '@/components/user/home/Features';
import Pricing from '@/components/user/home/Pricing';
import CourseCard from '@/components/user/course/CourseCard';
import { Input } from '@/components/ui/input';
import { Search, Loader2, ChevronLeft, ChevronRight, Target, Users, Award, Heart, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useGetCourses, useEnrolledCourses } from '@/hooks/api/use-courses';
import { useUser } from '@/hooks/api/use-user';
import type { Course } from "@/domain";

const levels = ['all', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function Landing() {
  const location = useLocation();
  const reduce = useReducedMotion();
  const { t } = useTranslation('landing');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const hash = location.hash?.slice(1);
    if (hash) {
      const el = document.getElementById(hash);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.pathname, location.hash]);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 9;
  const { user } = useUser();

  const stats = [
    { value: '50,000+', label: t('stats.activeLearners') },
    { value: '200+', label: t('stats.deepCourses') },
    { value: '98%', label: t('stats.successRate') },
    { value: '50+', label: t('stats.countries') },
  ];

  const values = [
    { icon: Target, title: t('values.items.mission.title'), description: t('values.items.mission.description') },
    { icon: Users, title: t('values.items.team.title'), description: t('values.items.team.description') },
    { icon: Award, title: t('values.items.quality.title'), description: t('values.items.quality.description') },
    { icon: Heart, title: t('values.items.success.title'), description: t('values.items.success.description') },
  ];

  const team = [
    { name: 'Dr. Sarah Johnson', role: t('team.roles.lead'), image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' },
    { name: 'Michael Chen', role: t('team.roles.business'), image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop' },
    { name: 'Emma Williams', role: t('team.roles.ielts'), image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop' },
    { name: 'David Martinez', role: t('team.roles.speaking'), image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop' },
  ];

  const { data: enrolledCourses = [], isLoading: isLoadingEnrolled } = useEnrolledCourses();
  const { data: availableRes, isLoading: isLoadingAvailable, isPlaceholderData } = useGetCourses({
    page,
    limit,
    search: searchQuery || undefined,
    level: selectedLevel,
    sortBy: 'ratingCount',
    sortOrder: 'desc',
  });

  const enrolledIds = useMemo(() => new Set(enrolledCourses.map((c: Course) => c.id)), [enrolledCourses]);
  const myCourses = user ? enrolledCourses : [];
  const allCourses = availableRes?.data ?? [];
  const availableCourses = user ? allCourses.filter((c: Course) => !enrolledIds.has(c.id)) : allCourses;
  const pagination = availableRes ? { total: availableRes.total, page: availableRes.page, limit: availableRes.limit, totalPages: availableRes.totalPages } : undefined;
  const isLoading = (!!user && isLoadingEnrolled) || isLoadingAvailable;

  const reveal = (i = 0) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-grow">
        <Hero />

        {/* Stats */}
        <section id="about" className="scroll-mt-24 bg-surface-low py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  {...reveal(i)}
                  className="rounded-2xl bg-surface-lowest p-6 text-center shadow-md ring-1 ring-border/10 transition-all duration-300 ease-soft hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <div className="font-display text-4xl font-extrabold text-primary md:text-5xl">{stat.value}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <Features />

        {/* Story — editorial asymmetric split */}
        <section className="bg-surface py-24">
          <div className="container mx-auto px-4">
            <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
              <motion.div {...reveal()} className="space-y-5">
                <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                  {t('story.eyebrow')}
                </span>
                <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                  {t('story.title')} <span className="text-secondary">{t('story.titleAccent')}</span>
                </h2>
                <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
                  <p>{t('story.p1')}</p>
                  <p>{t('story.p2')}</p>
                  <p>{t('story.p3')}</p>
                </div>
              </motion.div>

              <motion.div {...reveal(1)} className="relative">
                <div className="overflow-hidden rounded-[2rem] shadow-lg ring-1 ring-border/10">
                  <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=600&fit=crop" alt={t('story.imgAlt')} className="w-full" />
                </div>
                <div aria-hidden className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
                <div aria-hidden className="absolute -right-6 -top-6 h-40 w-40 rounded-full bg-secondary/25 blur-3xl" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-surface-low py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">{t('values.title')}</h2>
              <p className="mt-3 text-lg text-muted-foreground">{t('values.subtitle')}</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {values.map((value, i) => (
                <motion.div
                  key={value.title}
                  {...reveal(i)}
                  whileHover={reduce ? undefined : { y: -4 }}
                  className="group rounded-2xl bg-surface-lowest p-7 shadow-md ring-1 ring-border/10 transition-shadow duration-300 ease-soft hover:shadow-card-hover"
                >
                  <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-accent transition-transform duration-300 group-hover:rotate-[-6deg]">
                    <value.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-display text-xl font-bold">{value.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Course Catalog */}
        <section id="courses" className="scroll-mt-24 bg-surface py-24">
          <div className="container mx-auto px-4">
            <motion.div {...reveal()} className="relative mb-10 flex min-h-[200px] items-center overflow-hidden rounded-3xl bg-hero-gradient p-8 text-white md:p-12">
              <div aria-hidden className="absolute inset-0 opacity-30">
                <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1920&q=80" alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary-dark via-primary/80 to-transparent" />
              </div>
              <div className="relative z-10 max-w-2xl">
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-glass ring-1 ring-white/20">{t('catalog.eyebrow')}</span>
                <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight md:text-5xl">{t('catalog.title')}</h2>
                <p className="mt-3 text-white/85">{t('catalog.subtitle')}</p>
              </div>
            </motion.div>

            <div className="mb-8 flex flex-col gap-4 rounded-2xl bg-surface-lowest p-5 shadow-md ring-1 ring-border/10 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={t('catalog.searchPlaceholder')} className="pl-10" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} />
              </div>
              <div className="flex items-center gap-3">
                <Select value={selectedLevel} onValueChange={(v) => { setSelectedLevel(v); setPage(1); }}>
                  <SelectTrigger className="w-[160px] rounded-xl"><SelectValue placeholder={t('catalog.levelPlaceholder')} /></SelectTrigger>
                  <SelectContent>
                    {levels.map((l) => <SelectItem key={l} value={l}>{l === 'all' ? t('catalog.levelAll') : l}</SelectItem>)}
                  </SelectContent>
                </Select>
                <span className="whitespace-nowrap text-sm text-muted-foreground">{t('catalog.resultsCount', { count: pagination?.total ?? 0 })}</span>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : (
              <>
                {user && myCourses.length > 0 && (
                  <div className="mb-14">
                    <h3 className="mb-4 font-display text-xl font-bold">{t('catalog.myCourses')}</h3>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {myCourses.slice(0, 4).map((c) => <CourseCard key={c.id} course={c} purchased hideAddToCart />)}
                    </div>
                    <Link to="/dashboard" className="mt-4 inline-flex items-center gap-2 font-medium text-primary hover:underline">
                      {t('catalog.viewAll')} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
                <div>
                  <h3 className="mb-4 font-display text-xl font-bold">{user ? t('catalog.exploreMore') : t('catalog.allCourses')}</h3>
                  {availableCourses.length > 0 ? (
                    <>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {availableCourses.map((c) => <CourseCard key={c.id} course={c} />)}
                      </div>
                      {pagination && pagination.totalPages > 1 && (
                        <div className="mt-10 flex items-center justify-center gap-4">
                          <Button variant="outline" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>
                            <ChevronLeft className="mr-2 h-4 w-4" /> {t('catalog.prev')}
                          </Button>
                          <span className="text-sm font-medium">{t('catalog.page', { current: page, total: pagination.totalPages })}</span>
                          <Button variant="outline" onClick={() => !isPlaceholderData && page < pagination.totalPages && setPage((p) => p + 1)} disabled={isPlaceholderData || page >= pagination.totalPages}>
                            {t('catalog.next')} <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-2xl bg-surface-low py-20 text-center ring-1 ring-border/10">
                      <p className="text-muted-foreground">{t('catalog.empty')}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Pricing */}
        <Pricing />

        {/* Team */}
        <section className="bg-surface-low py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">{t('team.title')}</h2>
              <p className="mt-3 text-lg text-muted-foreground">{t('team.subtitle')}</p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {team.map((m, i) => (
                <motion.div key={m.name} {...reveal(i)} className="group text-center">
                  <div className="relative mb-6 overflow-hidden rounded-2xl ring-1 ring-border/10">
                    <img src={m.image} alt={m.name} className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>
                  <h3 className="font-display text-xl font-bold">{m.name}</h3>
                  <p className="mt-1 text-muted-foreground">{m.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden bg-hero-gradient py-24 text-white">
          <div aria-hidden className="absolute -right-32 top-10 h-80 w-80 rounded-full bg-secondary/40 blur-3xl" />
          <div aria-hidden className="absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="container relative z-10 mx-auto px-4 text-center">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
              <h2 className="font-display text-4xl font-bold md:text-5xl">{t('cta.title')}</h2>
              <p className="text-lg text-white/80 md:text-xl">{t('cta.subtitle')}</p>
              <Link to="/#courses">
                <Button variant="default" size="xl">
                  {t('cta.button')} <ArrowRight className="ml-1 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTopButton />
    </div>
  );
}
