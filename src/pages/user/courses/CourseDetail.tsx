import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, User, Loader2, PlayCircle, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatVND } from '@/lib/utils';
import PaymentDialog from '@/components/user/payment/PaymentDialog';
import CourseReportDialog from '@/components/user/course/CourseReportDialog';
import type { Report } from '@/types/type';

// --- HOOKS API ---
import { useGetCourseDetail, useGetMyCourses } from '@/hooks/api/use-courses';
import { useAddToCart, useDirectBuy } from '@/hooks/api/use-cart';
import { useUser } from '@/hooks/api/use-user';

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useUser();

  // 1. Fetch Data
  const { data: course, isLoading, isError } = useGetCourseDetail(id!);
  
  const { data: myCoursesData } = useGetMyCourses();
  
  // ✅ SỬA LỖI TẠI ĐÂY: Truy cập vào thuộc tính .data của object phân trang
  const myCourses = myCoursesData?.data || []; 

  // 2. Mutations (Khai báo trước khi return)
  const addToCartMutation = useAddToCart();
  const directBuyMutation = useDirectBuy();

  // 3. State
  const [buyOpen, setBuyOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [tab, setTab] = useState<'overview' | 'instructor' | 'content'>('overview');

  // 4. Calculated Values (useMemo)
  
  // Check đã mua
  const isPurchased = useMemo(() => {
    if (!course || !user) return false;
    // Bây giờ myCourses chắc chắn là mảng, hàm .some sẽ hoạt động
    return myCourses.some(c => c.id === course.id);
  }, [course, myCourses, user]);

  // Lấy thông tin giảng viên
  const instructor = useMemo(() => {
    if (!course) return null;
    return course.user || (course as any).courseSeller || { 
      fullName: 'Unknown Instructor', 
      email: '', 
      profilePicture: null,
      phoneNumber: '',
      learningGoals: [],
      englishLevel: ''
    };
  }, [course]);

  const courseLessons = useMemo(() => {
    return course?.lessons || [];
  }, [course]);

  const relatedTests = useMemo(() => {
    return course?.test ? [course.test] : [];
  }, [course]);

  const averageRating = useMemo(() => {
    if (!course) return 0;
    if (course.averageRating != null) return Number(course.averageRating.toFixed(1));
    
    // @ts-ignore
    const ratings = course.ratings || [];
    if (ratings.length === 0) return 0;
    // @ts-ignore
    const sum = ratings.reduce((acc, r) => acc + (r.score || 0), 0);
    return Number((sum / ratings.length).toFixed(1));
  }, [course]);

  // 5. Handlers
  const handleAddToCart = () => {
    if (!user) {
      alert("Vui lòng đăng nhập để thêm vào giỏ hàng");
      return;
    }
    if (course) addToCartMutation.mutate(course.id);
  };

  const handleBuyNowClick = () => {
    if (!user) {
      alert("Vui lòng đăng nhập để mua khóa học");
      return;
    }
    setBuyOpen(true);
  };

  const handleConfirmPayment = () => {
    if (course) {
      directBuyMutation.mutate(course.id, {
        onSuccess: () => {
          setBuyOpen(false);
          setTab('content');
        }
      });
    }
  };

  // 6. Render Loading / Error
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold mb-4">Không tìm thấy khóa học</h1>
          <Link to="/courses">
            <Button>Quay lại danh sách</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // 7. Render Main Content
  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-hero text-primary-foreground py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl">
              <div className="flex items-center gap-2 text-sm mb-4 text-primary-foreground/70">
                <Link to="/courses" className="hover:text-primary-foreground">Khóa học</Link>
                <span>/</span>
                <span className="line-clamp-1">{course.title}</span>
              </div>

              <div className="mb-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {course.courseLevel && (
                    <Badge variant="outline" className="bg-white text-primary border-white/40 shadow-sm px-3 py-1 rounded-full">
                      {course.courseLevel}
                    </Badge>
                  )}
                  {course.category && (
                    <Badge variant="secondary">{course.category}</Badge>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 font-['Be Vietnam Pro']">
                  {course.title}
                </h1>
                {course.description && (
                  <p className="text-xl text-primary-foreground/80 mb-6 line-clamp-3">
                    {course.description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-6 mb-6 items-center">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-secondary fill-secondary" />
                  <span className="font-semibold">
                    {averageRating}
                  </span>
                  <span className="text-primary-foreground/70">
                    ({course.ratingCount ?? 0} đánh giá)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-secondary" />
                  <span>{courseLessons.length} bài học</span>
                </div>
              </div>

              {/* Instructor Info */}
              <div className="flex items-center gap-4">
                {instructor?.profilePicture ? (
                  <img
                    src={instructor.profilePicture}
                    alt={instructor.fullName}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-foreground/20"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center ring-2 ring-primary-foreground/20">
                    <User className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <div className="text-sm text-primary-foreground/70">Giảng viên</div>
                  <div className="font-semibold">{instructor?.fullName}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Tabs */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left Column */}
            <div className="lg:col-span-2">
              <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                  <TabsTrigger value="instructor">Giảng viên</TabsTrigger>
                  <TabsTrigger value="content">Nội dung</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-6">
                  {course.description && (
                    <div className="bg-card rounded-2xl p-8 border border-border">
                      <h3 className="text-2xl font-semibold mb-4 font-['Be Vietnam Pro']">Mô tả khóa học</h3>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {course.description}
                      </p>
                    </div>
                  )}
                  {isPurchased && (
                    <div className="bg-card rounded-2xl p-8 border border-border">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-semibold font-['Be Vietnam Pro']">Báo cáo của bạn</h3>
                        <Button className="bg-primary" onClick={() => setReportOpen(true)}>Viết báo cáo</Button>
                      </div>
                      {myReports.length > 0 ? (
                        <ul className="space-y-4">
                          {myReports.map((report) => (
                            <li key={report.id} className="border border-border rounded-xl p-4">
                              <div className="text-sm text-muted-foreground">
                                {new Date(report.createdAt).toLocaleString('vi-VN')}
                              </div>
                              <div className="mt-1">
                                <Badge variant="outline" className="mr-2">{report.reasonType}</Badge>
                                <span className="text-sm">{report.content}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">Bạn chưa có báo cáo nào cho khóa học này.</p>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="instructor" className="mt-6">
                  <div className="bg-card rounded-2xl p-8 border border-border">
                    <div className="flex items-start gap-6 mb-6">
                      {instructor?.profilePicture ? (
                        <img
                          src={instructor.profilePicture}
                          alt={instructor.fullName}
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-secondary/20 flex items-center justify-center">
                          <User className="w-10 h-10 text-secondary" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-2xl font-semibold mb-2 font-['Be Vietnam Pro']">
                          {instructor?.fullName}
                        </h3>
                        <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                          {instructor?.email && <span><span className="font-medium">Email:</span> {instructor.email}</span>}
                          {instructor?.phoneNumber && <span><span className="font-medium">Điện thoại:</span> {instructor.phoneNumber}</span>}
                          {instructor?.englishLevel && <span><span className="font-medium">Trình độ:</span> {instructor.englishLevel}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="content" className="mt-6">
                  {!isPurchased ? (
                    <div className="bg-card rounded-2xl p-8 border border-border text-center py-12">
                      <div className="mb-4 flex justify-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                          <LockIcon className="w-8 h-8" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-semibold mb-2 font-['Be Vietnam Pro']">Nội dung bị khóa</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Bạn cần mua khoá học để xem {courseLessons.length} bài học và các bài kiểm tra.
                      </p>
                      <div className="flex justify-center gap-3">
                        <Button className="bg-gradient-primary shadow-lg px-8" onClick={handleBuyNowClick}>
                          Mua ngay
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="bg-card rounded-2xl p-8 border border-border">
                        <h3 className="text-2xl font-semibold mb-4 font-['Be Vietnam Pro']">Bài học ({courseLessons.length})</h3>
                        {courseLessons.length > 0 ? (
                          <ul className="space-y-4">
                            {courseLessons.map((lesson: any, index: number) => (
                              <li key={lesson.id} className="flex items-start justify-between gap-4 border border-border rounded-xl p-4 hover:border-primary/50 transition-colors group">
                                <div className="flex gap-4">
                                  <div className="flex-shrink-0 w-8 h-8 bg-secondary/20 text-secondary rounded-full flex items-center justify-center font-bold text-sm mt-0.5">
                                    {lesson.lessonOrder ?? index + 1}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-lg group-hover:text-primary transition-colors">
                                      {lesson.title}
                                    </div>
                                    {lesson.description && (
                                      <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                                      <span className="flex items-center gap-1">
                                        <ClockIcon className="w-3 h-3" />
                                        {lesson.durationInSeconds ? `${Math.round(lesson.durationInSeconds / 60)} phút` : '—'}
                                      </span>
                                      <span>•</span>
                                      <span>{lesson.materials?.length ?? 0} tài liệu</span>
                                    </div>
                                  </div>
                                </div>
                                {lesson.videoUrl && (
                                  <Button asChild variant="secondary" size="sm">
                                    <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer">Xem video</a>
                                  </Button>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">Chưa có bài học nào.</p>
                        )}
                      </div>

                      <div className="bg-card rounded-2xl p-8 border border-border">
                        <h3 className="text-2xl font-semibold mb-4 font-['Be Vietnam Pro']">Bài kiểm tra</h3>
                        {relatedTests.length > 0 ? (
                          <div className="space-y-4">
                            {relatedTests.map((test: any) => (
                              <div key={test.id} className="border border-border rounded-xl p-5">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                  <div>
                                    <div className="font-semibold text-lg flex items-center gap-2">
                                      <FileText className="w-5 h-5 text-blue-500" />
                                      {test.title}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      Thời lượng: {test.durationInMinutes} phút • Điểm tối đa: {test.totalScore}
                                    </div>
                                  </div>
                                  <Button variant="outline">Làm bài</Button>
                                </div>
                                {test.sections && test.sections.length > 0 && (
                                  <ul className="grid sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/50">
                                    {test.sections.map((section: any) => (
                                      <li key={section.id} className="bg-muted/30 rounded-lg p-3 text-sm">
                                        <div className="font-medium">{section.title}</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {section.totalQuestions ?? 0} câu hỏi
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">Chưa có bài kiểm tra nào.</p>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column: Sticky Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <div className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border">
                  {/* Thumbnail Placeholder */}
                  <div className="h-48 bg-muted flex items-center justify-center text-muted-foreground border-b">
                    <span className="text-sm">Thumbnail Khóa Học</span>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-bold text-primary">
                        {formatVND(Number(course.price))}
                      </span>
                    </div>

                    {isPurchased ? (
                      <div className="space-y-3">
                        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-center font-medium border border-green-200 flex items-center justify-center gap-2">
                          <span className="text-xl">✅</span> Đã sở hữu
                        </div>
                        <Button
                          size="lg"
                          className="w-full bg-primary shadow-md text-lg"
                          onClick={() => setTab('content')}
                        >
                          Vào học ngay
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full"
                          onClick={() => setReportOpen(true)}
                        >
                          Báo cáo sự cố
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        <Button
                          size="lg"
                          className="w-full bg-gradient-primary shadow-accent text-lg"
                          onClick={handleBuyNowClick}
                          disabled={directBuyMutation.isPending || addToCartMutation.isPending}
                        >
                          {directBuyMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin"/> : "Mua ngay"}
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full text-lg"
                          onClick={handleAddToCart}
                          disabled={directBuyMutation.isPending || addToCartMutation.isPending}
                        >
                          {addToCartMutation.isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          ) : null}
                          Thêm vào giỏ
                        </Button>
                      </div>
                    )}
                    
                    <div className="text-xs text-center text-muted-foreground pt-2 border-t border-border">
                      Truy cập trọn đời • Cập nhật miễn phí
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
        userId={user?.id || ''}
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

// Icon Helpers
const LockIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);
const ClockIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);

export default CourseDetail;