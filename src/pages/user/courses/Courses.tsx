import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import CourseCard from '@/components/user/course/CourseCard';
import { Input } from '@/components/ui/input';
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

// Hooks
import { useGetCourses, useEnrolledCourses } from '@/hooks/api/use-courses';
import { useUser } from '@/hooks/api/use-user';
import type { Course } from "@/domain";

const levels = ['all', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const Courses = () => {
  const { t } = useTranslation('courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [page, setPage] = useState(1); // Page cho danh sách "Chưa mua"
  const limit = 9;

  const { user } = useUser(); // Check xem user có login không

  // === FETCH 1: KHÓA HỌC CỦA TÔI (dùng endpoint /courses/enrolled) ===
  const { data: enrolledCourses = [], isLoading: isLoadingMy } = useEnrolledCourses();

  // === FETCH 2: KHÓA HỌC CÓ SẴN (dùng endpoint /courses/published) ===
  const {
    data: availableRes,
    isLoading: isLoadingAvailable,
    isPlaceholderData,
  } = useGetCourses({
    page: page,
    limit: limit,
    search: searchQuery || undefined,
    level: selectedLevel,
    sortBy: 'ratingCount',
    sortOrder: 'desc',
  });

  // Build enrolled IDs set to filter out purchased courses from explore list
  const enrolledIds = useMemo(() => new Set(enrolledCourses.map((c: Course) => c.id)), [enrolledCourses]);

  // Data - Backend trả { success, data: [...], total, page, limit, totalPages } (flat)
  const myCourses = user ? enrolledCourses : [];
  const allCourses = availableRes?.data || [];
  const availableCourses = user ? allCourses.filter((c: Course) => !enrolledIds.has(c.id)) : allCourses;
  const pagination = availableRes
    ? { total: availableRes.total, page: availableRes.page, limit: availableRes.limit, totalPages: availableRes.totalPages }
    : undefined;

  // Loading
  const isLoading = (!!user && isLoadingMy) || isLoadingAvailable;

  // Handlers
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };
  const handleLevel = (val: string) => {
    setSelectedLevel(val);
    setPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 flex-grow">
        <section className="container mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white p-8 md:p-12 min-h-[320px] flex items-center">
            <div className="absolute inset-0 opacity-35">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1920&q=80"
                alt="Courses hero"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/85 to-transparent"></div>
            </div>
            <div className="relative z-10 max-w-2xl">
              <span className="px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary-light text-xs font-bold uppercase tracking-widest">
                {t('coursesPage.heroBadge')}
              </span>
              <h1 className="text-4xl md:text-5xl font-black mt-4 tracking-tight">
                {t('coursesPage.heroTitle')}
              </h1>
              <p className="text-slate-200 mt-4">
                {t('coursesPage.heroSubtitle')}
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 mt-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={t('coursesPage.searchPlaceholder')}
                className="pl-10 border-slate-200 bg-slate-50"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedLevel} onValueChange={handleLevel}>
                <SelectTrigger className="w-[160px] bg-white">
                  <SelectValue placeholder={t('coursesPage.levelPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l === 'all' ? t('coursesPage.allLevels') : l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-slate-500 whitespace-nowrap">
                {t('coursesPage.resultsCount', { count: pagination?.total || 0 })}
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 container mx-auto px-4 space-y-14">
          
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
          ) : (
            <>
              {/* --- PHẦN 1: KHÓA HỌC CỦA BẠN --- */}
              {user && myCourses.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">{t('coursesPage.yourCourses')}</h2>
                  {myCourses.length > 0 && (
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                      {myCourses.length}
                    </span>
                  )}
                </div>

                {myCourses.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {myCourses.map(course => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        purchased
                        hideAddToCart
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                    <p className="text-slate-800 font-medium text-lg">
                      {t('coursesPage.emptyEnrolled')}
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                      {t('coursesPage.emptyEnrolledHint')}
                    </p>
                  </div>
                )}

                <div className="my-2 border-b border-slate-200/50" />
              </div>
            )}

              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {user ? t('coursesPage.exploreMore') : t('coursesPage.coursesList')}
                  </h2>
                  <span className="text-slate-500 text-sm">
                    {t('coursesPage.resultsCount', { count: pagination?.total || 0 })}
                  </span>
                </div>

                {availableCourses.length > 0 ? (
                  <div className="space-y-8">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {availableCourses.map(course => (
                        <CourseCard key={course.id} course={course} />
                      ))}
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                      <div className="flex justify-center items-center gap-4">
                        <Button
                          variant="outline"
                          onClick={() => setPage(old => Math.max(old - 1, 1))}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="w-4 h-4 mr-2" /> {t('coursesPage.prev')}
                        </Button>
                        <span className="text-sm font-medium text-slate-900">{t('coursesPage.pageOf', { page, total: pagination.totalPages })}</span>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (!isPlaceholderData && page < pagination.totalPages) setPage(old => old + 1);
                          }}
                          disabled={isPlaceholderData || page >= pagination.totalPages}
                        >
                          {t('coursesPage.next')} <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-500">{t('coursesPage.noResults')}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Courses;