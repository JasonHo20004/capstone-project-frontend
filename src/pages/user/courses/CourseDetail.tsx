import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatVND } from '@/lib/utils';
import PaymentDialog from '@/components/user/payment/PaymentDialog';
import CourseReportDialog from '@/components/user/course/CourseReportDialog';
import type { Lesson, Report, CourseLesson } from "@/domain";
import type { Test, Section } from "@/types/type";

import { useGetCourseDetail, useGetMyCourses } from '@/hooks/api/use-courses';
import { useAddToCart, useDirectBuy } from '@/hooks/api/use-cart';
import { useUser } from '@/hooks/api/use-user';
import { useCourseContext } from '@/hooks/api/use-student-learning';

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();

  const { data: course, isLoading, isError } = useGetCourseDetail(id!);
  const { data: myCoursesData } = useGetMyCourses();

  const addToCartMutation = useAddToCart();
  const directBuyMutation = useDirectBuy();

  const [buyOpen, setBuyOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [tab, setTab] = useState<"overview" | "instructor" | "content">("overview");

  const isEnrolledInApi = useMemo(() => {
    if (!course || !user) return false;
    const myCourses = myCoursesData?.data ?? [];
    return myCourses.some((c) => c.id === course.id);
  }, [course, myCoursesData?.data, user]);

  const isPurchased = isEnrolledInApi || directBuyMutation.isSuccess;

  const { data: courseContext } = useCourseContext(isEnrolledInApi ? id : undefined);

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
    const src = course.user ?? course.courseSeller;
    if (src) {
      return {
        fullName: src.fullName,
        id: src.id,
        ...(src as Record<string, unknown>),
      } as InstructorInfo;
    }
    return { fullName: "Unknown Instructor", email: "", profilePicture: null, phoneNumber: "", englishLevel: "" };
  }, [course]);

  const courseLessons: Lesson[] = useMemo(() => {
    const raw = course?.lessons ?? [];
    return raw
      .map((item) => {
        const cl = item as CourseLesson;
        if (cl.lesson) return cl.lesson;
        return "id" in item && "title" in item ? (item as unknown as Lesson) : null;
      })
      .filter((l): l is Lesson => l != null);
  }, [course]);

  const relatedTests = useMemo(() => {
    const c = course as { test?: Test } | undefined;
    return c?.test ? [c.test] : [];
  }, [course]);

  const averageRating = useMemo(() => {
    if (!course) return 0;
    if (course.averageRating != null) return Number(course.averageRating.toFixed(1));
    const c = course as { ratings?: { score?: number }[] };
    const ratings = c.ratings ?? [];
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + (r.score ?? 0), 0);
    return Number((sum / ratings.length).toFixed(1));
  }, [course]);

  const thumbnailUrl = course?.thumbnailUrl || "";

  const handleAddToCart = () => {
    if (!user) { alert("Vui lòng đăng nhập để thêm vào giỏ hàng"); return; }
    if (course) addToCartMutation.mutate(course.id);
  };

  const handleBuyNowClick = () => {
    if (!user) { alert("Vui lòng đăng nhập để mua khóa học"); return; }
    setBuyOpen(true);
  };

  const handleConfirmPayment = () => {
    if (course) {
      directBuyMutation.mutate(course.id, {
        onSuccess: () => { setBuyOpen(false); setTab("content"); },
      });
    }
  };

  const getNextLessonId = (): string | null => {
    if (!courseContext?.syllabus || courseContext.syllabus.length === 0) return null;
    const sorted = [...courseContext.syllabus].sort((a, b) => (a.lessonOrder ?? 999) - (b.lessonOrder ?? 999));
    const firstIncomplete = sorted.find((l) => !l.isCompleted);
    if (firstIncomplete) return firstIncomplete.id;
    if (sorted.length > 0) return sorted[sorted.length - 1].id;
    return sorted[0]?.id || null;
  };

  const handleStartLearning = () => {
    if (!id) return;
    if (courseContext) {
      const nextLessonId = getNextLessonId();
      if (nextLessonId) { navigate(`/learning/courses/${id}/lessons/${nextLessonId}`); return; }
    }
    navigate(`/learning/courses/${id}/lessons`);
  };

  // --- LOADING ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col justify-center items-center py-32 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <p className="text-slate-500 font-medium">Đang tải thông tin khóa học...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // --- ERROR ---
  if (isError || !course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-32 text-center">
          <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-9 h-9 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold mb-3 text-slate-900">Không tìm thấy khóa học</h1>
          <p className="text-slate-500 mb-8">Khóa học này có thể đã bị xóa hoặc không tồn tại.</p>
          <Link to="/courses">
            <Button size="lg" className="rounded-xl px-8">
              <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
              Quay lại danh sách
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />

      <main className="pt-20">
        {/* ═══════════════════════════════════════════════════════════════════
            HERO SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
          {/* Decorative background */}
          <div className="absolute inset-0 opacity-[0.06]">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '28px 28px'
            }} />
          </div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

          <div className="relative z-10 container mx-auto px-4 py-14 md:py-16">
            <div className="max-w-4xl">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm mb-6">
                <Link to="/courses" className="text-white/50 hover:text-white transition-colors">
                  Khóa học
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
                    Đã sở hữu
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 tracking-tight leading-tight">
                {course.title}
              </h1>
              {course.description && (
                <p className="text-lg text-white/60 mb-8 line-clamp-2 max-w-2xl leading-relaxed">
                  {course.description}
                </p>
              )}

              {/* Meta Stats */}
              <div className="flex flex-wrap gap-5 mb-8 items-center">
                <div className="flex items-center gap-2 bg-white/[0.07] backdrop-blur-sm rounded-lg px-3.5 py-2 border border-white/[0.08]">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-sm">{averageRating}</span>
                  <span className="text-white/50 text-sm">({course.ratingCount ?? 0} đánh giá)</span>
                </div>
                <div className="flex items-center gap-2 bg-white/[0.07] backdrop-blur-sm rounded-lg px-3.5 py-2 border border-white/[0.08]">
                  <PlayCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{courseLessons.length} bài học</span>
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
                  <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Giảng viên</div>
                  <div className="font-semibold text-sm">{instructor?.fullName}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            MAIN CONTENT
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="container mx-auto px-4 py-10">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* ── Left Column: Tabs ── */}
            <div className="lg:col-span-2">
              <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
                <TabsList className="bg-white border border-slate-200 shadow-sm rounded-xl p-1 h-auto grid w-full grid-cols-3">
                  <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm py-2.5 text-sm font-semibold">
                    Tổng quan
                  </TabsTrigger>
                  <TabsTrigger value="instructor" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm py-2.5 text-sm font-semibold">
                    Giảng viên
                  </TabsTrigger>
                  <TabsTrigger value="content" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm py-2.5 text-sm font-semibold">
                    Nội dung
                  </TabsTrigger>
                </TabsList>

                {/* ── Overview Tab ── */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                  {course.description && (
                    <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
                      <h3 className="text-xl font-bold mb-4 text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Mô tả khóa học
                      </h3>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                        {course.description}
                      </p>
                    </div>
                  )}

                  {/* What you'll get */}
                  <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-bold mb-5 text-slate-900">Bạn sẽ nhận được</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        { icon: PlayCircle, text: `${courseLessons.length} bài học video`, color: 'text-blue-500 bg-blue-50' },
                        { icon: Shield, text: 'Truy cập trọn đời', color: 'text-emerald-500 bg-emerald-50' },
                        { icon: RefreshCw, text: 'Cập nhật miễn phí', color: 'text-orange-500 bg-orange-50' },
                        { icon: Award, text: 'Chứng chỉ hoàn thành', color: 'text-purple-500 bg-purple-50' },
                      ].map((item) => (
                        <div key={item.text} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-slate-700">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reports section (only if purchased) */}
                  {isPurchased && (
                    <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-xl font-bold text-slate-900">Báo cáo của bạn</h3>
                        <Button size="sm" onClick={() => setReportOpen(true)} className="rounded-lg">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                          Viết báo cáo
                        </Button>
                      </div>
                      {myReports.length > 0 ? (
                        <ul className="space-y-3">
                          {myReports.map((report) => (
                            <li key={report.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                              <div className="text-xs text-slate-400 mb-1">
                                {new Date(report.createdAt).toLocaleString("vi-VN")}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{report.reasonType}</Badge>
                                <span className="text-sm text-slate-600">{report.content}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-400 text-sm">Bạn chưa có báo cáo nào cho khóa học này.</p>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* ── Instructor Tab ── */}
                <TabsContent value="instructor" className="mt-6">
                  <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
                    <div className="flex items-start gap-6 mb-6">
                      {instructor?.profilePicture ? (
                        <img src={instructor.profilePicture} alt={instructor.fullName}
                          className="w-20 h-20 rounded-2xl object-cover shadow-md ring-2 ring-slate-100" />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-50 flex items-center justify-center ring-2 ring-slate-100">
                          <User className="w-8 h-8 text-primary/60" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-1 text-slate-900">{instructor?.fullName}</h3>
                        <div className="flex flex-col gap-2 mt-3">
                          {instructor?.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <span className="font-medium text-slate-700">Email:</span>
                              {instructor.email}
                            </div>
                          )}
                          {instructor?.phoneNumber && (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <span className="font-medium text-slate-700">Điện thoại:</span>
                              {instructor.phoneNumber}
                            </div>
                          )}
                          {instructor?.englishLevel && (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <span className="font-medium text-slate-700">Trình độ:</span>
                              <Badge variant="outline" className="text-xs">{instructor.englishLevel}</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* ── Content Tab ── */}
                <TabsContent value="content" className="mt-6">
                  {!isPurchased ? (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center py-16">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <Lock className="w-7 h-7 text-slate-400" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2 text-slate-900">Nội dung bị khóa</h3>
                      <p className="text-slate-500 mb-7 max-w-md mx-auto text-sm leading-relaxed">
                        Bạn cần mua khoá học để truy cập {courseLessons.length} bài học và các bài kiểm tra liên quan.
                      </p>
                      <Button size="lg" onClick={handleBuyNowClick} className="rounded-xl px-8 shadow-lg shadow-primary/20">
                        <Zap className="w-4 h-4 mr-2" />
                        Mua ngay để học
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Lessons */}
                      <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
                        <h3 className="text-xl font-bold mb-5 text-slate-900 flex items-center gap-2">
                          <PlayCircle className="w-5 h-5 text-primary" />
                          Bài học ({courseLessons.length})
                        </h3>
                        {courseLessons.length > 0 ? (
                          <ul className="space-y-3">
                            {courseLessons.map((lesson, index) => (
                              <li
                                key={lesson.id}
                                className="flex items-start justify-between gap-4 border border-slate-200 rounded-xl p-4 hover:border-primary/40 hover:bg-primary/[0.02] transition-all group cursor-pointer"
                              >
                                <div className="flex gap-4">
                                  <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-primary/10 to-primary/5 text-primary rounded-xl flex items-center justify-center font-bold text-sm mt-0.5">
                                    {lesson.lessonOrder ?? index + 1}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                                      {lesson.title}
                                    </div>
                                    {lesson.description && (
                                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{lesson.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {lesson.durationInSeconds
                                          ? `${Math.round(lesson.durationInSeconds / 60)} phút`
                                          : "—"}
                                      </span>
                                      <span>•</span>
                                      <span>{lesson.materials?.length ?? 0} tài liệu</span>
                                    </div>
                                  </div>
                                </div>
                                {lesson.videoUrl && (
                                  <Button asChild variant="ghost" size="sm" className="text-primary hover:bg-primary/10 rounded-lg">
                                    <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer">
                                      <PlayCircle className="w-4 h-4 mr-1" />
                                      Xem
                                    </a>
                                  </Button>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-400 text-center py-6 text-sm">Chưa có bài học nào.</p>
                        )}
                      </div>

                      {/* Tests */}
                      <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
                        <h3 className="text-xl font-bold mb-5 text-slate-900 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-500" />
                          Bài kiểm tra
                        </h3>
                        {relatedTests.length > 0 ? (
                          <div className="space-y-4">
                            {relatedTests.map((test: Test) => (
                              <div key={test.id} className="border border-slate-200 rounded-xl p-5 hover:border-blue-200 transition-colors">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                  <div>
                                    <div className="font-semibold text-lg flex items-center gap-2 text-slate-900">
                                      <FileText className="w-5 h-5 text-blue-500" />
                                      {test.title}
                                    </div>
                                    <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                      <Clock className="w-3.5 h-3.5" />
                                      {test.durationInMinutes} phút • Điểm tối đa: {test.totalScore}
                                    </div>
                                  </div>
                                  <Button variant="outline" size="sm" className="rounded-lg">Làm bài</Button>
                                </div>
                                {test.sections && test.sections.length > 0 && (
                                  <ul className="grid sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
                                    {test.sections.map((section: Section) => (
                                      <li key={section.id} className="bg-slate-50 rounded-lg p-3 text-sm">
                                        <div className="font-medium text-slate-700">{section.title}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">{section.totalQuestions ?? 0} câu hỏi</div>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 text-center py-6 text-sm">Chưa có bài kiểm tra nào.</p>
                        )}
                      </div>

                      {/* Final Test */}
                      {course.finalTestId && (
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-7 border border-amber-200 shadow-sm">
                          <h3 className="text-xl font-bold mb-3 text-slate-900 flex items-center gap-2">
                            <Award className="w-5 h-5 text-amber-500" />
                            Bài kiểm tra cuối khóa
                          </h3>
                          <p className="text-sm text-slate-600 mb-4">
                            Hoàn thành bài kiểm tra này để xác nhận bạn đã nắm vững kiến thức của khóa học.
                          </p>

                          {(() => {
                            const totalLessons = courseLessons.length;
                            const completedLessons = courseContext?.progress?.completedLessons ?? 0;
                            const allCompleted = totalLessons > 0 && completedLessons >= totalLessons;

                            if (allCompleted) {
                              return (
                                <div className="flex items-center gap-3">
                                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                  <span className="text-sm font-medium text-green-700">Bạn đã hoàn thành tất cả bài học!</span>
                                  <Button
                                    className="ml-auto rounded-xl shadow-lg shadow-amber-200/50"
                                    onClick={() => navigate(`/tests/${course.finalTestId}`)}
                                  >
                                    <FileText className="w-4 h-4 mr-1.5" />
                                    Làm bài kiểm tra
                                  </Button>
                                </div>
                              );
                            }

                            return (
                              <div className="flex items-center gap-3 bg-white/60 rounded-xl p-4 border border-amber-200/50">
                                <Lock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-slate-700">
                                    Hoàn thành tất cả bài học để mở khóa
                                  </p>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    Tiến độ: {completedLessons}/{totalLessons} bài học
                                  </p>
                                </div>
                                <div className="ml-auto">
                                  <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-amber-400 rounded-full transition-all"
                                      style={{ width: `${totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* ── Right Column: Sticky Sidebar ── */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-5">
                {/* Price Card */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200">
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
                          Đã sở hữu khóa học
                        </div>
                        <Button
                          size="lg"
                          className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-base font-bold rounded-xl h-12"
                          onClick={handleStartLearning}
                        >
                          <PlayCircle className="w-5 h-5 mr-2" />
                          Vào học ngay
                        </Button>
                        <Button
                          size="lg"
                          variant="ghost"
                          className="w-full text-slate-500 hover:text-slate-700 rounded-xl"
                          onClick={() => setReportOpen(true)}
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Báo cáo sự cố
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          size="lg"
                          className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-base font-bold rounded-xl h-12"
                          onClick={handleBuyNowClick}
                          disabled={directBuyMutation.isPending || addToCartMutation.isPending}
                        >
                          {directBuyMutation.isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Zap className="w-5 h-5 mr-2" />
                              Mua ngay
                            </>
                          )}
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full text-base rounded-xl h-12 border-slate-300"
                          onClick={handleAddToCart}
                          disabled={directBuyMutation.isPending || addToCartMutation.isPending}
                        >
                          {addToCartMutation.isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          ) : (
                            <ShoppingCart className="w-5 h-5 mr-2" />
                          )}
                          Thêm vào giỏ
                        </Button>
                      </div>
                    )}

                    {/* Trust signals */}
                    <div className="pt-4 border-t border-slate-100 space-y-2.5">
                      {[
                        { icon: Shield, text: 'Truy cập trọn đời' },
                        { icon: RefreshCw, text: 'Cập nhật miễn phí' },
                        { icon: Award, text: 'Chứng chỉ hoàn thành' },
                      ].map((item) => (
                        <div key={item.text} className="flex items-center gap-2.5 text-xs text-slate-500">
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

      {/* Dialogs */}
      <CourseReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        course={course}
        userId={user?.id || ""}
        onSubmitted={(report) => setMyReports((prev) => [report, ...prev])}
      />

      <PaymentDialog
        open={buyOpen}
        onOpenChange={setBuyOpen}
        amount={Number(course.price) || 0}
        title="Xác nhận thanh toán nhanh"
        items={[{ title: course.title, price: Number(course.price) || 0 }]}
        confirmLabel={directBuyMutation.isPending ? "Đang xử lý..." : "Thanh toán ngay"}
        onConfirm={handleConfirmPayment}
      />

      <Footer />
    </div>
  );
};

export default CourseDetail;
