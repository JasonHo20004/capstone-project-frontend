import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  User,
  Loader2,
  PlayCircle,
  FileText,
  ChevronRight,
  Clock,
  Lock,
  BookOpen,
  ShoppingCart,
  Zap,
  Shield,
  RefreshCw,
  Award,
  AlertTriangle,
  CheckCircle2,
  CheckCheck,
  Users,
  ListChecks,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { formatVND } from '@/lib/utils';
import PaymentDialog from '@/components/user/payment/PaymentDialog';
import CourseReportDialog from '@/components/user/course/CourseReportDialog';
import CourseDetailReviews from '@/components/user/course/CourseDetailReviews';
import AllRatingsModal from '@/components/user/course/AllRatingsModal';
import type { Lesson, Report, CourseLesson, Course } from '@/domain';
import type { Test, Section } from '@/types/type';

import { useGetCourseDetail, useGetMyCourses, useModules, useSellerCourses } from '@/hooks/api/use-courses';
import { useAddToCart, useDirectBuy, useIsInCart } from '@/hooks/api/use-cart';
import { useUser } from '@/hooks/api/use-user';
import { useCourseContext, useCourseRatings } from '@/hooks/api/use-student-learning';

const CourseDetail = () => {
  const { t, i18n } = useTranslation('courses');
  const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-GB';
  const { id } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();

  // ── Core data ─────────────────────────────────────────────────────────────
  const { data: course, isLoading, isError } = useGetCourseDetail(id!);
  const { data: myCoursesData } = useGetMyCourses();

  // ── Purchase hooks ─────────────────────────────────────────────────────────
  const addToCartMutation = useAddToCart();
  const isInCart = useIsInCart(course?.id);
  const directBuyMutation = useDirectBuy();

  // ── Modules / lessons (for content preview) ───────────────────────────────
  const { data: modulesData } = useModules(id);

  // ── Ratings (for hero average display) ────────────────────────────────────
  const { data: ratingsData } = useCourseRatings(id);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [buyOpen, setBuyOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [allRatingsOpen, setAllRatingsOpen] = useState(false);
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [tab, setTab] = useState<'overview' | 'instructor' | 'content'>('overview');
  const [highlightSidebar, setHighlightSidebar] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // ── Enrollment check ───────────────────────────────────────────────────────
  const isEnrolledInApi = useMemo(() => {
    if (!course || !user) return false;
    const myCourses = myCoursesData?.data ?? [];
    return myCourses.some((c) => c.id === course.id);
  }, [course, myCoursesData?.data, user]);

  const isPurchased = isEnrolledInApi || directBuyMutation.isSuccess;

  // ── Redirect owned courses to learning page (skip detail for enrolled) ────
  // Only redirect if the user was ALREADY enrolled before visiting — not when
  // they've just purchased on this page (directBuyMutation.isSuccess).
  useEffect(() => {
    if (isEnrolledInApi && id && !directBuyMutation.isSuccess) {
      navigate(`/learning/courses/${id}/lessons`);
    }
  }, [isEnrolledInApi, id, navigate, directBuyMutation.isSuccess]);

  // ── Course context (syllabus + progress) — only for enrolled ──────────────
  const { data: courseContext } = useCourseContext(isEnrolledInApi ? id : undefined);

  // ── Instructor other courses ───────────────────────────────────────────────
  const { data: sellerCoursesData } = useSellerCourses(course?.courseSellerId);
  const instructorCourses: Course[] = useMemo(() => {
    const list = sellerCoursesData?.data ?? [];
    return list.filter((c) => c.id !== id).slice(0, 3);
  }, [sellerCoursesData, id]);

  // ── Derived data ───────────────────────────────────────────────────────────
  type InstructorInfo = {
    fullName: string;
    id?: string;
    email?: string;
    profilePicture?: string | null;
    phoneNumber?: string;
    englishLevel?: string;
  };

  const instructor = useMemo((): InstructorInfo | null => {
    if (!course) return null;
    const name = course.sellerName ?? (course.user ?? course.courseSeller)?.fullName;
    if (name) {
      const src = course.user ?? course.courseSeller ?? {};
      return { fullName: name, ...(src as Record<string, unknown>) } as InstructorInfo;
    }
    return { fullName: t('courseDetail.instructor'), email: '', profilePicture: null, phoneNumber: '', englishLevel: '' };
  }, [course]);

  const courseLessons: Lesson[] = useMemo(() => {
    if (modulesData && modulesData.length > 0) {
      return (modulesData as { moduleOrder?: number; lessons?: Lesson[] }[])
        .slice()
        .sort((a, b) => (a.moduleOrder ?? 0) - (b.moduleOrder ?? 0))
        .flatMap((m) => m.lessons ?? []);
    }
    const raw = course?.lessons ?? [];
    return raw
      .map((item) => {
        const cl = item as CourseLesson;
        if (cl.lesson) return cl.lesson;
        return 'id' in item && 'title' in item ? (item as unknown as Lesson) : null;
      })
      .filter((l): l is Lesson => l != null);
  }, [modulesData, course]);

  const relatedTests = useMemo(() => {
    const c = course as { test?: Test } | undefined;
    return c?.test ? [c.test] : [];
  }, [course]);

  const averageRating = useMemo(() => {
    if (ratingsData?.averageScore != null) return Number(ratingsData.averageScore.toFixed(1));
    if (course?.averageRating != null) return Number(course.averageRating.toFixed(1));
    return 0;
  }, [ratingsData, course]);

  const totalRatings = course?.ratingCount ?? 0;
  const thumbnailUrl = course?.thumbnailUrl ?? '';

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!user) {
      toast.warning(t('courseDetail.toasts.loginRequiredCart'), {
        action: { label: t('courseDetail.toasts.loginAction'), onClick: () => navigate('/login') },
      });
      return;
    }
    if (addToCartMutation.isPending || !course) return;
    addToCartMutation.mutate({
      id: course.id,
      title: course.title,
      price: course.price,
      thumbnailUrl: course.thumbnailUrl,
    });
  };

  const handleBuyNowClick = () => {
    if (!user) {
      toast.warning(t('courseDetail.toasts.loginRequiredBuy'), {
        action: { label: t('courseDetail.toasts.loginAction'), onClick: () => navigate('/login') },
      });
      return;
    }
    setBuyOpen(true);
  };

  const handleConfirmPayment = () => {
    if (directBuyMutation.isPending || !course) return;
    directBuyMutation.mutate(course.id, {
      onSuccess: () => {
        setBuyOpen(false);
        setTab('content');
      },
    });
  };

  const getNextLessonId = (): string | null => {
    if (!courseContext?.syllabus?.length) return null;
    const sorted = [...courseContext.syllabus].sort(
      (a, b) => (a.lessonOrder ?? 999) - (b.lessonOrder ?? 999)
    );
    const firstIncomplete = sorted.find((l) => !l.isCompleted);
    if (firstIncomplete) return firstIncomplete.id;
    return sorted[sorted.length - 1]?.id ?? sorted[0]?.id ?? null;
  };

  const handleStartLearning = () => {
    if (!id) return;
    const nextLessonId = getNextLessonId();
    navigate(
      nextLessonId
        ? `/learning/courses/${id}/lessons/${nextLessonId}`
        : `/learning/courses/${id}/lessons`
    );
  };

  const handleLessonClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!isPurchased) {
      sidebarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightSidebar(true);
      setTimeout(() => setHighlightSidebar(false), 2000);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col justify-center items-center py-32 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <p className="text-slate-500 font-medium">{t('courseDetail.loading')}</p>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError || !course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-32 text-center">
          <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-9 h-9 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold mb-3 text-slate-900">{t('courseDetail.notFoundTitle')}</h1>
          <p className="text-slate-500 mb-8">{t('courseDetail.notFoundDesc')}</p>
          <Link to="/courses">
            <Button size="lg" className="rounded-xl px-8">
              <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
              {t('courseDetail.backToList')}
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />

      <main className="pt-20">
        {/* ═══════════════ HERO ═══════════════ */}
        <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '28px 28px',
              }}
            />
          </div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

          <div className="relative z-10 container mx-auto px-4 py-14 md:py-16">
            <div className="max-w-4xl">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm mb-6">
                <Link to="/courses" className="text-white/50 hover:text-white transition-colors">
                  {t('courseDetail.breadcrumbCourses')}
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                {course.category && (
                  <>
                    <span className="text-white/50">{course.category}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                  </>
                )}
                <span className="text-white/80 line-clamp-1">{course.title}</span>
              </nav>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-5">
                {course.courseLevel && (
                  <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {course.courseLevel}
                  </Badge>
                )}
                {course.category && (
                  <Badge className="bg-primary/20 text-primary border-primary/30 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                    {course.category}
                  </Badge>
                )}
                {isPurchased && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {t('courseDetail.ownedBadge')}
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 tracking-tight leading-tight">
                {course.title}
              </h1>
              {course.description && (
                <p className="text-lg text-white/60 mb-8 line-clamp-2 max-w-2xl leading-relaxed">
                  {course.description}
                </p>
              )}

              {/* Meta stats */}
              <div className="flex flex-wrap gap-5 mb-8 items-center">
                <div className="flex items-center gap-2 bg-white/[0.07] backdrop-blur-sm rounded-lg px-3.5 py-2 border border-white/[0.08]">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-sm">{averageRating}</span>
                  <span className="text-white/50 text-sm">{t('courseDetail.ratingsCount', { count: totalRatings })}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/[0.07] backdrop-blur-sm rounded-lg px-3.5 py-2 border border-white/[0.08]">
                  <PlayCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{t('courseDetail.lessonCount', { count: course.lessonCount ?? courseLessons.length })}</span>
                </div>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-4">
                {instructor?.profilePicture ? (
                  <img
                    src={instructor.profilePicture}
                    alt={instructor.fullName}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-white/20 ring-offset-2 ring-offset-slate-900"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center ring-2 ring-white/10">
                    <User className="w-5 h-5 text-white/60" />
                  </div>
                )}
                <div>
                  <div className="text-xs text-white/40 font-medium uppercase tracking-wider">
                    {t('courseDetail.instructor')}
                  </div>
                  <div className="font-semibold text-sm">{instructor?.fullName}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ MAIN CONTENT ═══════════════ */}
        <div className="container mx-auto px-4 py-10">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* ── Left column ── */}
            <div className="lg:col-span-2 space-y-8">
              {/* Tabs */}
              <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
                <TabsList className="bg-white border border-slate-200 shadow-sm rounded-xl p-1 h-auto grid w-full grid-cols-3">
                  <TabsTrigger
                    value="overview"
                    className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm py-2.5 text-sm font-semibold"
                  >
                    {t('courseDetail.tabs.overview')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="instructor"
                    className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm py-2.5 text-sm font-semibold"
                  >
                    {t('courseDetail.tabs.instructor')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="content"
                    className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm py-2.5 text-sm font-semibold"
                  >
                    {t('courseDetail.tabs.content')}
                  </TabsTrigger>
                </TabsList>

                {/* ── Overview Tab ── */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                  {/* Description */}
                  {course.description && (
                    <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
                      <h3 className="text-xl font-bold mb-4 text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        {t('courseDetail.sections.description')}
                      </h3>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                        {course.description}
                      </p>
                    </div>
                  )}

                  {/* What you'll get */}
                  <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-bold mb-5 text-slate-900">{t('courseDetail.sections.whatYouGet')}</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        { icon: PlayCircle, text: t('courseDetail.benefits.videoLessons', { count: course.lessonCount ?? courseLessons.length }), color: 'text-blue-500 bg-blue-50' },
                        { icon: Shield, text: t('courseDetail.benefits.lifetime'), color: 'text-emerald-500 bg-emerald-50' },
                        { icon: RefreshCw, text: t('courseDetail.benefits.freeUpdates'), color: 'text-orange-500 bg-orange-50' },
                        { icon: Award, text: t('courseDetail.benefits.certificate'), color: 'text-purple-500 bg-purple-50' },
                      ].map((item) => (
                        <div
                          key={item.text}
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100"
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-slate-700">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Requirements */}
                  {course.requirements && course.requirements.length > 0 && (
                    <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
                      <h3 className="text-xl font-bold mb-5 text-slate-900 flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-primary" />
                        {t('courseDetail.sections.requirements')}
                      </h3>
                      <ul className="space-y-3">
                        {course.requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCheck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-slate-600 leading-relaxed">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Who this course is for */}
                  {course.targetAudiences && course.targetAudiences.length > 0 && (
                    <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
                      <h3 className="text-xl font-bold mb-5 text-slate-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        {t('courseDetail.sections.audience')}
                      </h3>
                      <ul className="space-y-3">
                        {course.targetAudiences.map((audience, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            <span className="text-sm text-slate-600 leading-relaxed">{audience}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Reports (purchased users only) */}
                  {isPurchased && (
                    <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-xl font-bold text-slate-900">{t('courseDetail.sections.myReports')}</h3>
                        <Button
                          size="sm"
                          onClick={() => setReportOpen(true)}
                          className="rounded-lg"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                          {t('courseDetail.reports.writeReport')}
                        </Button>
                      </div>
                      {myReports.length > 0 ? (
                        <ul className="space-y-3">
                          {myReports.map((report) => (
                            <li
                              key={report.id}
                              className="border border-slate-200 rounded-xl p-4 bg-slate-50/50"
                            >
                              <div className="text-xs text-slate-400 mb-1">
                                {new Date(report.createdAt).toLocaleString(dateLocale)}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {report.reasonType}
                                </Badge>
                                <span className="text-sm text-slate-600">{report.content}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-400 text-sm">
                          {t('courseDetail.reports.empty')}
                        </p>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* ── Instructor Tab ── */}
                <TabsContent value="instructor" className="mt-6">
                  <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
                    <div className="flex items-start gap-6 mb-6">
                      {instructor?.profilePicture ? (
                        <img
                          src={instructor.profilePicture}
                          alt={instructor.fullName}
                          className="w-20 h-20 rounded-2xl object-cover shadow-md ring-2 ring-slate-100"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-50 flex items-center justify-center ring-2 ring-slate-100">
                          <User className="w-8 h-8 text-primary/60" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-1 text-slate-900">
                          {instructor?.fullName}
                        </h3>
                        <div className="flex flex-col gap-2 mt-3">
                          {instructor?.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <span className="font-medium text-slate-700">{t('courseDetail.instructorTab.email')}</span>
                              {instructor.email}
                            </div>
                          )}
                          {instructor?.phoneNumber && (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <span className="font-medium text-slate-700">{t('courseDetail.instructorTab.phone')}</span>
                              {instructor.phoneNumber}
                            </div>
                          )}
                          {instructor?.englishLevel && (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <span className="font-medium text-slate-700">{t('courseDetail.instructorTab.level')}</span>
                              <Badge variant="outline" className="text-xs">
                                {instructor.englishLevel}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* ── Content Tab ── */}
                <TabsContent value="content" className="mt-6">
                  <div className="space-y-6">
                    {/* Lessons */}
                    <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
                      <h3 className="text-xl font-bold mb-5 text-slate-900 flex items-center gap-2">
                        <PlayCircle className="w-5 h-5 text-primary" />
                        {t('courseDetail.sections.lessons', { count: course.lessonCount ?? courseLessons.length })}
                      </h3>
                      {courseLessons.length > 0 ? (
                        <ul className="space-y-3">
                          {courseLessons.map((lesson, index) => (
                            <li
                              key={lesson.id}
                              onClick={() => {
                                if (isPurchased) {
                                  navigate(`/learning/courses/${id}/lessons/${lesson.id}`);
                                } else {
                                  handleLessonClick();
                                }
                              }}
                              className="flex items-start justify-between gap-4 border border-slate-200 rounded-xl p-4 hover:border-primary/40 hover:bg-primary/[0.02] transition-all group cursor-pointer"
                            >
                              <div className="flex gap-4">
                                <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-primary/10 to-primary/5 text-primary rounded-xl flex items-center justify-center font-bold text-sm mt-0.5">
                                  {lesson.lessonOrder ?? index + 1}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 group-hover:text-primary transition-colors flex items-center gap-2">
                                    {lesson.title}
                                    {!isPurchased && <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                                  </div>
                                  {lesson.description && (
                                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                      {lesson.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {lesson.durationInSeconds
                                        ? t('courseDetail.lessons.minutes', { count: Math.round(lesson.durationInSeconds / 60) })
                                        : '—'}
                                    </span>
                                    {(lesson.materials?.length ?? 0) > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>{t('courseDetail.lessons.materials', { count: lesson.materials!.length })}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-400 text-center py-6 text-sm">
                          {t('courseDetail.lessons.empty')}
                        </p>
                      )}
                      {!isPurchased && courseLessons.length > 0 && (
                        <p className="mt-4 text-xs text-slate-400 text-center">
                          <Lock className="w-3 h-3 inline mr-1" />
                          {t('courseDetail.lessons.lockedNotice')}
                        </p>
                      )}
                    </div>

                      {/* Tests */}
                      <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
                        <h3 className="text-xl font-bold mb-5 text-slate-900 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-500" />
                          {t('courseDetail.sections.tests')}
                        </h3>
                        {relatedTests.length > 0 ? (
                          <div className="space-y-4">
                            {relatedTests.map((test: Test) => (
                              <div
                                key={test.id}
                                className="border border-slate-200 rounded-xl p-5 hover:border-blue-200 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-4 mb-3">
                                  <div>
                                    <div className="font-semibold text-lg flex items-center gap-2 text-slate-900">
                                      <FileText className="w-5 h-5 text-blue-500" />
                                      {test.title}
                                    </div>
                                    <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                      <Clock className="w-3.5 h-3.5" />
                                      {t('courseDetail.tests.minutesAndMax', { minutes: test.durationInMinutes, score: test.totalScore })}
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-lg"
                                    onClick={() =>
                                      isPurchased
                                        ? navigate(`/practice/${test.id}`)
                                        : handleLessonClick()
                                    }
                                  >
                                    {t('courseDetail.tests.doTest')}
                                  </Button>
                                </div>
                                {test.sections && test.sections.length > 0 && (
                                  <ul className="grid sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
                                    {test.sections.map((section: Section) => (
                                      <li
                                        key={section.id}
                                        className="bg-slate-50 rounded-lg p-3 text-sm"
                                      >
                                        <div className="font-medium text-slate-700">
                                          {section.title}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-0.5">
                                          {t('courseDetail.tests.questionCount', { count: section.totalQuestions ?? 0 })}
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 text-center py-6 text-sm">
                            {t('courseDetail.tests.empty')}
                          </p>
                        )}
                      </div>

                      {/* Final test */}
                      {course.finalTestId && (
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-7 border border-amber-200 shadow-sm">
                          <h3 className="text-xl font-bold mb-3 text-slate-900 flex items-center gap-2">
                            <Award className="w-5 h-5 text-amber-500" />
                            {t('courseDetail.sections.finalTest')}
                          </h3>
                          <p className="text-sm text-slate-600 mb-4">
                            {t('courseDetail.finalTest.description')}
                          </p>
                          {(() => {
                            const totalLessons = courseLessons.length;
                            const completedLessons =
                              courseContext?.progress?.completedLessons ?? 0;
                            const allCompleted =
                              totalLessons > 0 && completedLessons >= totalLessons;
                            if (allCompleted) {
                              return (
                                <div className="flex items-center gap-3">
                                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                  <span className="text-sm font-medium text-green-700">
                                    {t('courseDetail.finalTest.allComplete')}
                                  </span>
                                  <Button
                                    className="ml-auto rounded-xl shadow-lg shadow-amber-200/50"
                                    onClick={() => navigate(`/practice/${course.finalTestId}`)}
                                  >
                                    <FileText className="w-4 h-4 mr-1.5" />
                                    {t('courseDetail.finalTest.doTestBtn')}
                                  </Button>
                                </div>
                              );
                            }
                            return (
                              <div className="flex items-center gap-3 bg-white/60 rounded-xl p-4 border border-amber-200/50">
                                <Lock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-slate-700">
                                    {t('courseDetail.finalTest.lockedTitle')}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {t('courseDetail.finalTest.progress', { completed: completedLessons, total: totalLessons })}
                                  </p>
                                </div>
                                <div className="ml-auto">
                                  <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-amber-400 rounded-full transition-all"
                                      style={{
                                        width: `${totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                </TabsContent>
              </Tabs>

              {/* ── Reviews section ── */}
              {id && (
                <CourseDetailReviews
                  courseId={id}
                  averageRating={averageRating}
                  totalRatings={totalRatings}
                  onShowAll={() => setAllRatingsOpen(true)}
                />
              )}

              {/* ── More from instructor ── */}
              {instructorCourses.length > 0 && instructor && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-7 py-5 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900">
                      <Trans
                        i18nKey="courseDetail.sections.moreFromInstructor"
                        ns="courses"
                        values={{ name: instructor.fullName }}
                        components={[<span key="0" className="text-primary" />]}
                      />
                    </h2>
                  </div>
                  <div className="p-5 grid sm:grid-cols-3 gap-4">
                    {instructorCourses.map((c) => (
                      <Link
                        key={c.id}
                        to={`/courses/${c.id}`}
                        className="group rounded-xl border border-slate-100 overflow-hidden hover:border-primary/30 hover:shadow-md transition-all"
                      >
                        {/* Thumbnail */}
                        <div className="h-28 bg-slate-100 overflow-hidden">
                          {c.thumbnailUrl ? (
                            <img
                              src={c.thumbnailUrl}
                              alt={c.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-8 h-8 text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                            {c.title}
                          </h4>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-semibold text-slate-700">
                                {c.averageRating != null
                                  ? c.averageRating.toFixed(1)
                                  : '—'}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-primary">
                              {formatVND(Number(c.price))}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right column: sticky sidebar ── */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-5">
                <div
                  ref={sidebarRef}
                  className={`bg-white rounded-2xl overflow-hidden shadow-lg border transition-all duration-500 ${
                    highlightSidebar
                      ? 'border-primary ring-2 ring-primary/40 shadow-primary/25 shadow-xl'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="h-52 w-full bg-gradient-to-br from-slate-100 to-slate-50 border-b overflow-hidden relative group">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-primary/50" />
                        </div>
                        <span className="text-xs text-slate-400 font-medium">{course.title}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Price */}
                    <div className="text-center">
                      <span className="text-3xl font-black text-slate-900">
                        {formatVND(Number(course.price))}
                      </span>
                    </div>

                    {isPurchased ? (
                      <div className="space-y-3">
                        <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-center text-sm font-semibold border border-emerald-200 flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          {t('courseDetail.sidebar.ownedNotice')}
                        </div>
                        <Button
                          size="lg"
                          className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-base font-bold rounded-xl h-12"
                          onClick={handleStartLearning}
                        >
                          <PlayCircle className="w-5 h-5 mr-2" />
                          {t('courseDetail.sidebar.startLearning')}
                        </Button>
                        <Button
                          size="lg"
                          variant="ghost"
                          className="w-full text-slate-500 hover:text-slate-700 rounded-xl"
                          onClick={() => setReportOpen(true)}
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          {t('courseDetail.reports.reportIncident')}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          size="lg"
                          className={`w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-base font-bold rounded-xl h-12 ${highlightSidebar ? 'animate-pulse' : ''}`}
                          onClick={handleBuyNowClick}
                          disabled={directBuyMutation.isPending || addToCartMutation.isPending}
                        >
                          {directBuyMutation.isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Zap className="w-5 h-5 mr-2" />
                              {t('courseDetail.sidebar.buyNow')}
                            </>
                          )}
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full text-base rounded-xl h-12 border-slate-300"
                          onClick={isInCart ? () => navigate('/cart') : handleAddToCart}
                          disabled={directBuyMutation.isPending || addToCartMutation.isPending}
                        >
                          {addToCartMutation.isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          ) : isInCart ? (
                            <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600" />
                          ) : (
                            <ShoppingCart className="w-5 h-5 mr-2" />
                          )}
                          {isInCart ? t('courseDetail.sidebar.inCartCta') : t('courseDetail.sidebar.addToCart')}
                        </Button>
                      </div>
                    )}

                    {/* Trust signals */}
                    <div className="pt-4 border-t border-slate-100 space-y-2.5">
                      {[
                        { icon: Shield, text: t('courseDetail.sidebar.trust.lifetime') },
                        { icon: RefreshCw, text: t('courseDetail.sidebar.trust.freeUpdates') },
                        { icon: Award, text: t('courseDetail.sidebar.trust.certificate') },
                      ].map((item) => (
                        <div
                          key={item.text}
                          className="flex items-center gap-2.5 text-xs text-slate-500"
                        >
                          <item.icon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Dialogs / Modals ── */}
      <CourseReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        course={course}
        userId={user?.id ?? ''}
        onSubmitted={(report) => setMyReports((prev) => [report, ...prev])}
      />

      <PaymentDialog
        open={buyOpen}
        onOpenChange={setBuyOpen}
        amount={Number(course.price) || 0}
        title={t('courseDetail.payment.dialogTitle')}
        items={[{ title: course.title, price: Number(course.price) || 0 }]}
        confirmLabel={directBuyMutation.isPending ? t('courseDetail.payment.processing') : t('courseDetail.payment.confirm')}
        onConfirm={handleConfirmPayment}
      />

      {id && (
        <AllRatingsModal
          open={allRatingsOpen}
          onOpenChange={setAllRatingsOpen}
          courseId={id}
          courseName={course.title}
        />
      )}

      <Footer />
    </div>
  );
};

export default CourseDetail;
