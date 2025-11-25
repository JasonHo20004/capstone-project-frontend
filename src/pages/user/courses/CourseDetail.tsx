import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatVND } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import PaymentDialog from '@/components/user/payment/PaymentDialog';
import { usePurchases } from '@/context/PurchasesContext';
import CourseReportDialog from '@/components/user/course/CourseReportDialog';
import type { Report } from '@/types/type';
import { useCourse } from '@/hooks/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';

const REPORT_STORAGE_KEY = 'skillboost_course_reports_v1';

const loadStoredReports = (): Report[] => {
  try {
    const raw = localStorage.getItem(REPORT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Report[]) : [];
  } catch {
    return [];
  }
};

const CourseDetail = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const { addCourse, has } = usePurchases();
  const [buyOpen, setBuyOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [tab, setTab] = useState<'overview' | 'instructor' | 'content'>('overview');
  const currentUserId = useMemo(() => localStorage.getItem('currentUserId') ?? '1', []);
  const { data: course, isLoading, isError, error, refetch } = useCourse(id);
  const [myReports, setMyReports] = useState<Report[]>([]);

  useEffect(() => {
    if (!course) return;
    const storedReports = loadStoredReports();
    setMyReports(storedReports.filter((report) => report.courseId === course.id && report.userId === currentUserId));
  }, [course, currentUserId]);

  const courseLessons = useMemo(() => {
    if (!course?.lessons) return [];
    return [...course.lessons].sort((a, b) => (a.lessonOrder ?? 0) - (b.lessonOrder ?? 0));
  }, [course]);

  const isPurchased = course ? has(course.id) : false;

  const renderNotFound = () => (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">Không tìm thấy khóa học</h1>
        <Link to="/courses">
          <Button>Quay lại Khóa học</Button>
        </Link>
      </div>
      <Footer />
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 flex justify-center">
          <LoadingSpinner text="Đang tải thông tin khóa học..." />
        </div>
        <Footer />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <ErrorMessage
            message={error instanceof Error ? error.message : 'Không thể tải dữ liệu khoá học.'}
            onRetry={refetch}
          />
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return renderNotFound();
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-20">
        <section className="bg-gradient-hero text-primary-foreground py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl">
              <div className="flex items-center gap-2 text-sm mb-4 text-primary-foreground/70">
                <Link to="/courses" className="hover:text-primary-foreground">Khóa học</Link>
                <span>/</span>
                <span>{course.title}</span>
              </div>

              <div className="mb-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {course.courseLevel && (
                    <Badge variant="outline" className="bg-primary-foreground/10 border-primary-foreground/20">
                      {course.courseLevel}
                    </Badge>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 font-['Be Vietnam Pro']">
                  {course.title}
                </h1>
                {course.description && (
                  <p className="text-xl text-primary-foreground/80 mb-6">
                    {course.description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-secondary fill-secondary" />
                  <span className="font-semibold">{course.averageRating ?? 'N/A'}</span>
                  <span className="text-primary-foreground/70">({course.ratingCount ?? 0} đánh giá)</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {course.courseSeller?.profilePicture && (
                  <img
                    src={course.courseSeller?.profilePicture ?? ''}
                    alt={course.courseSeller?.fullName ?? 'Giảng viên'}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-foreground/20"
                  />
                )}
                <div>
                  <div className="text-sm text-primary-foreground/70">Giảng viên</div>
                  <div className="font-semibold">{course.courseSeller?.fullName ?? 'Giảng viên ẩn danh'}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                  <TabsTrigger value="instructor">Giảng viên</TabsTrigger>
                  <TabsTrigger value="content">Nội dung</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-6">
                  {course.description && (
                    <div className="bg-card rounded-2xl p-8 border border-border">
                      <h3 className="text-2xl font-semibold mb-4 font-['Be Vietnam Pro']">Mô tả khóa học</h3>
                      <p className="text-muted-foreground leading-relaxed">
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
                      {course.courseSeller?.profilePicture && (
                        <img
                          src={course.courseSeller?.profilePicture ?? ''}
                          alt={course.courseSeller?.fullName ?? 'Giảng viên'}
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <h3 className="text-2xl font-semibold mb-2 font-['Be Vietnam Pro']">
                          {course.courseSeller?.fullName ?? 'Giảng viên ẩn danh'}
                        </h3>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="content" className="mt-6">
                  {!isPurchased ? (
                    <div className="bg-card rounded-2xl p-8 border border-border">
                      <h3 className="text-2xl font-semibold mb-4 font-['Be Vietnam Pro']">Nội dung khoá học</h3>
                      <p className="text-muted-foreground mb-6">Bạn cần mua khoá học để xem bài học và bài test.</p>
                      <div className="flex gap-3">
                        <Button className="bg-gradient-primary" onClick={() => setBuyOpen(true)}>Mua ngay</Button>
                        <Button variant="outline" onClick={() => addItem(course)}>Thêm vào giỏ</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="bg-card rounded-2xl p-8 border border-border">
                        <h3 className="text-2xl font-semibold mb-4 font-['Be Vietnam Pro']">Bài học</h3>
                        {courseLessons.length > 0 ? (
                          <ul className="space-y-4">
                            {courseLessons.map((lesson, index) => (
                              <li key={lesson.id} className="flex items-start justify-between gap-4 border border-border rounded-xl p-4">
                                <div>
                                  <div className="font-semibold">
                                    {lesson.lessonOrder ?? index + 1}. {lesson.title}
                                  </div>
                                  {lesson.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
                                  )}
                                  <div className="text-xs text-muted-foreground mt-2">
                                    {lesson.durationInSeconds ? `${Math.round(lesson.durationInSeconds / 60)} phút` : '—'} •{' '}
                                    {lesson.materials?.length ?? 0} tài liệu • {lesson.commentCount ?? 0} bình luận
                                  </div>
                                </div>
                                {lesson.videoUrl && (
                                  <Button asChild variant="outline" size="sm">
                                    <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer">Xem video</a>
                                  </Button>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground">Chưa có bài học được liệt kê.</p>
                        )}
                      </div>

                      <div className="bg-card rounded-2xl p-8 border border-border">
                        <h3 className="text-2xl font-semibold mb-4 font-['Be Vietnam Pro']">Bài test</h3>
                        {course.test ? (
                          <div className="space-y-4">
                            <div className="border border-border rounded-xl p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="font-semibold">{course.test.title}</div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    Thời lượng: {course.test.durationInMinutes} phút • Điểm tối đa: {course.test.totalScore}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-2">
                                    Loại bài: {course.test.testType}
                                  </div>
                                </div>
                              </div>
                              {course.test.sections && course.test.sections.length > 0 && (
                                <ul className="mt-3 grid sm:grid-cols-2 gap-3">
                                  {course.test.sections.map((section) => (
                                    <li key={section.id} className="border border-border rounded-lg p-3">
                                      <div className="text-sm font-medium">{section.title}</div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Kỹ năng: {section.skill} • {section.totalQuestions ?? 0} câu •{' '}
                                        {section.durationInSeconds ? Math.round(section.durationInSeconds / 60) : 0} phút
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">Chưa có bài test phù hợp cho khoá học này.</p>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <div className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border">
                  <div className="p-6 space-y-4">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-bold text-primary">
                        {formatVND(course.price)}
                      </span>
                    </div>

                    {isPurchased ? (
                      <div className="space-y-3">
                        <div className="text-green-600 font-medium text-center">Bạn đã mua khoá học này</div>
                        <Button
                          size="lg"
                          className="w-full bg-gradient-primary shadow-accent text-lg"
                          onClick={() => setTab('content')}
                        >
                          Xem nội dung
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full"
                          onClick={() => setReportOpen(true)}
                        >
                          Báo cáo khóa học
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        <Button
                          size="lg"
                          className="w-full bg-gradient-primary shadow-accent text-lg"
                          onClick={() => setBuyOpen(true)}
                          disabled={(course.price || 0) <= 0}
                        >
                          Mua ngay
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full text-lg"
                          onClick={() => addItem(course)}
                        >
                          Thêm vào giỏ
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <CourseReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        course={course}
        userId={currentUserId}
        onSubmitted={(report) => setMyReports((prev) => [report, ...prev])}
      />

      <PaymentDialog
        open={buyOpen}
        onOpenChange={setBuyOpen}
        amount={course.price || 0}
        title="Xác nhận đơn hàng"
        items={[{ title: course.title, price: course.price || 0 }]}
        onConfirm={() => addCourse(course)}
      />

      <Footer />
    </div>
  );
};

export default CourseDetail;
