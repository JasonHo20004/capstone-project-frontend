import CourseCard from '@/components/user/course/CourseCard';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCourses } from '@/hooks/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';

const Index = () => {
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

  const popularCourses =
    popularCoursesResponse?.data?.slice(0, 3) ??
    [];

  return (
    <div className="bg-background pb-10">
      <main>
        <section className="container mx-auto px-4">
          <div className="rounded-3xl bg-slate-900 text-white p-8 md:p-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-30 bg-gradient-to-r from-slate-900 via-slate-900/70 to-primary/40"></div>
            <div className="relative z-10 max-w-3xl">
              <p className="text-primary-light font-semibold mb-3">Learning Workspace</p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                Giao diện học tập mới, giữ nguyên trải nghiệm cũ
              </h1>
              <p className="mt-4 text-slate-200">
                Khám phá khoá học, theo dõi tiến độ và học theo nhịp của bạn với giao diện trực quan hơn.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/courses">
                  <Button size="lg" className="bg-primary hover:bg-primary-dark text-white rounded-xl">
                    Bắt đầu học
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/my-courses">
                  <Button size="lg" variant="secondary">
                    Khóa học của tôi
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 mt-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Lộ trình cá nhân hóa", value: "08", subtitle: "đang theo học" },
              { title: "Nhiệm vụ hôm nay", value: "05", subtitle: "cần hoàn thành" },
              { title: "Thẻ ghi nhớ cần ôn", value: "12", subtitle: "đến hạn trong ngày" },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <p className="text-sm text-slate-500">{item.title}</p>
                <p className="text-3xl font-black text-slate-900 mt-2">{item.value}</p>
                <p className="text-xs text-slate-500 mt-1">{item.subtitle}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 mt-14">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Khoá học nổi bật</h2>
              <p className="text-slate-500 mt-1">Danh sách được cập nhật theo xu hướng học viên</p>
            </div>
            <Link to="/courses" className="text-primary font-semibold hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[220px]">
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
              <p className="col-span-full text-center text-slate-500">
                Hiện chưa có khoá học nào phù hợp.
              </p>
            )}
            {!isLoadingCourses &&
              !isCoursesError &&
              popularCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;