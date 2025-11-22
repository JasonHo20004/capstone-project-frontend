import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import Hero from '@/components/user/home/Hero';
import Features from '@/components/user/home/Features';
import CourseCard from '@/components/user/course/CourseCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Quote } from 'lucide-react';
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
    <div className="min-h-screen">
      <Navbar />
      
      <main>
        <Hero />
        <Features />

        {/* Popular Courses Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-['Be Vietnam Pro']">
                Khóa học <span className="text-primary">phổ biến nhất</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Tham gia hàng nghìn học viên đang học với các khóa học được đánh giá cao của chúng tôi
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12 min-h-[220px]">
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
                <p className="col-span-full text-center text-muted-foreground">
                  Hiện chưa có khoá học nào phù hợp.
                </p>
              )}
              {!isLoadingCourses &&
                !isCoursesError &&
                popularCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
            </div>

            <div className="text-center">
              <Link to="/courses">
                <Button size="lg" className="bg-gradient-primary shadow-accent">
                  Xem tất cả khóa học
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-gradient-hero text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-['Be Vietnam Pro']">
                Cách hoạt động
              </h2>
              <p className="text-lg text-primary-foreground/80">
                Bắt đầu hành trình học tập với ba bước đơn giản
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  step: '01',
                  title: 'Chọn khóa học của bạn',
                  description: 'Duyệt danh mục phong phú và chọn khóa học phù hợp với mục tiêu',
                },
                {
                  step: '02',
                  title: 'Học theo tốc độ của bạn',
                  description: 'Truy cập bài giảng video, bài tập và tài liệu mọi lúc mọi nơi',
                },
                {
                  step: '03',
                  title: 'Nhận chứng chỉ',
                  description: 'Hoàn thành khóa học và nhận chứng chỉ được công nhận',
                },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary/20 backdrop-blur-sm border-2 border-secondary mb-6">
                    <span className="text-3xl font-bold text-secondary">{item.step}</span>
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 font-['Be Vietnam Pro']">{item.title}</h3>
                  <p className="text-primary-foreground/70">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-['Be Vietnam Pro']">
                Học viên nói gì
              </h2>
              <p className="text-lg text-muted-foreground">
                Câu chuyện thực tế từ những học viên đã cải thiện kỹ năng tiếng Anh
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: 'Maria Rodriguez',
                  role: 'Chuyên viên kinh doanh',
                  image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop',
                  content: 'SkillBoost đã giúp tôi đạt được công việc mơ ước! Khóa Business English đúng là những gì tôi cần.',
                },
                {
                  name: 'Ahmed Hassan',
                  role: 'Sinh viên đại học',
                  image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
                  content: 'Khóa luyện thi IELTS rất đầy đủ và giúp tôi đạt band mục tiêu.',
                },
                {
                  name: 'Jennifer Kim',
                  role: 'Giáo viên tiếng Anh',
                  image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop',
                  content: 'Là một giáo viên, tôi rất ấn tượng với chất lượng giảng dạy và tài liệu.',
                },
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-card rounded-2xl p-8 shadow-sm hover:shadow-accent transition-all border border-border"
                >
                  <Quote className="w-10 h-10 text-secondary mb-4" />
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold font-['Be Vietnam Pro']">
                Bắt đầu hành trình học tập của bạn ngay hôm nay
              </h2>
              <p className="text-lg text-primary-foreground/80">
                Khám phá hàng trăm khoá học từ các chuyên gia và nâng cao kỹ năng tiếng Anh của bạn.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/courses">
                  <Button size="lg" className="bg-primary-foreground text-primary font-semibold">
                    Khám phá khoá học
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/seller/apply">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-primary-foreground text-primary-foreground"
                  >
                    Trở thành giảng viên
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;