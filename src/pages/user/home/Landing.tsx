import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import { BackToTopButton } from '@/components/user/layout/BackToTopButton';
import Hero from '@/components/user/home/Hero';
import Features from '@/components/user/home/Features';
import CourseCard from '@/components/user/course/CourseCard';
import { Input } from '@/components/ui/input';
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Target, Users, Award, Heart, ArrowRight } from 'lucide-react';
import { useGetCourses } from '@/hooks/api/use-courses';
import { useUser } from '@/hooks/api/use-user';

const levels = ['all', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const stats = [
  { value: '50,000+', label: 'Học viên đang hoạt động' },
  { value: '200+', label: 'Khoá học chuyên sâu' },
  { value: '98%', label: 'Tỷ lệ thành công' },
  { value: '50+', label: 'Quốc gia' },
];

const values = [
  { icon: Target, title: 'Sứ mệnh của chúng tôi', description: 'Mang giáo dục tiếng Anh chất lượng đến với mọi người, mọi nơi và trao quyền cho người học đạt được mục tiêu.' },
  { icon: Users, title: 'Đội ngũ chuyên gia', description: 'Giảng viên là các chuyên gia được chứng nhận, giàu kinh nghiệm và đam mê giảng dạy.' },
  { icon: Award, title: 'Chất lượng là trên hết', description: 'Duy trì tiêu chuẩn cao nhất trong nội dung khóa học, cách triển khai và hỗ trợ học viên.' },
  { icon: Heart, title: 'Thành công của học viên', description: 'Sự thành công của bạn là ưu tiên của chúng tôi. Luôn đồng hành và hỗ trợ trong suốt hành trình học tập.' },
];

const team = [
  { name: 'Dr. Sarah Johnson', role: 'Giảng viên trưởng', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' },
  { name: 'Michael Chen', role: 'Chuyên gia tiếng Anh thương mại', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop' },
  { name: 'Emma Williams', role: 'Chuyên gia IELTS', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop' },
  { name: 'David Martinez', role: 'Huấn luyện viên Speaking', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop' },
];

export default function Landing() {
  const location = useLocation();
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

  const { data: myCoursesRes, isLoading: isLoadingMy } = useGetCourses({
    page: 1,
    limit: 100,
    search: searchQuery || undefined,
    level: selectedLevel,
    enrollmentStatus: 'enrolled',
    sortBy: 'ratingCount',
    sortOrder: 'desc',
  });

  const { data: availableRes, isLoading: isLoadingAvailable, isPlaceholderData } = useGetCourses({
    page,
    limit,
    search: searchQuery || undefined,
    level: selectedLevel,
    enrollmentStatus: user ? 'not_enrolled' : undefined,
    sortBy: 'ratingCount',
    sortOrder: 'desc',
  });

  const myCourses = user ? myCoursesRes?.data || [] : [];
  const availableCourses = availableRes?.data || [];
  const pagination = availableRes ? { total: availableRes.total, page: availableRes.page, limit: availableRes.limit, totalPages: availableRes.totalPages } : undefined;
  const isLoading = (!!user && isLoadingMy) || isLoadingAvailable;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-grow">
        {/* Hero */}
        <Hero />

        {/* Stats */}
        <section id="about" className="py-16 bg-background scroll-mt-24">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features - Dịch vụ hệ thống */}
        <Features />

        {/* Story - Về SkillBoost */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6 font-display">Câu chuyện của chúng tôi</h2>
                <div className="space-y-4 text-slate-500 leading-relaxed">
                  <p>
                    Được thành lập năm 2020, SkillBoost ra đời từ một tầm nhìn đơn giản nhưng mạnh mẽ: mang giáo dục tiếng Anh chất lượng cao đến với mọi người, bất kể địa điểm hay hoàn cảnh.
                  </p>
                  <p>
                    Bắt đầu từ một đội ngũ nhỏ đầy nhiệt huyết, chúng tôi đã phát triển thành nền tảng toàn cầu phục vụ hàng nghìn học viên tại hơn 50 quốc gia. Cam kết về chất lượng và thành công của học viên luôn được giữ vững.
                  </p>
                  <p>
                    Ngày nay, chúng tôi tiếp tục đổi mới và cải tiến khóa học để đảm bảo mỗi học viên nhận được trải nghiệm học tập tốt nhất.
                  </p>
                </div>
              </div>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=600&fit=crop"
                  alt="Câu chuyện SkillBoost"
                  className="rounded-2xl shadow-lg w-full"
                />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -top-6 -right-6 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
              </div>
            </div>
          </div>
        </section>

        {/* Values - Giá trị cốt lõi */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">Giá trị cốt lõi</h2>
              <p className="text-lg text-slate-500">Những nguyên tắc định hướng mọi hoạt động của chúng tôi</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, i) => (
                <div key={i} className="bg-card rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all border border-slate-200">
                  <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-6 shadow-md">
                    <value.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 font-display">{value.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Course Catalog */}
        <section id="courses" className="py-20 bg-slate-50 scroll-mt-24">
          <div className="container mx-auto px-4">
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white p-8 md:p-12 min-h-[200px] flex items-center mb-10">
              <div className="absolute inset-0 opacity-35">
                <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1920&q=80" alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/85 to-transparent" />
              </div>
              <div className="relative z-10 max-w-2xl">
                <span className="px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary-light text-xs font-bold uppercase tracking-widest">Explore</span>
                <h2 className="text-3xl md:text-4xl font-black mt-4 tracking-tight">Khám phá khoá học</h2>
                <p className="text-slate-200 mt-2">Duyệt danh sách khoá học, lọc theo trình độ và tìm nội dung phù hợp.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-center md:justify-between mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Tìm khóa học, kỹ năng hoặc giảng viên..." className="pl-10 border-slate-200 bg-slate-50" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} />
              </div>
              <div className="flex items-center gap-3">
                <Select value={selectedLevel} onValueChange={(v) => { setSelectedLevel(v); setPage(1); }}>
                  <SelectTrigger className="w-[160px] bg-white"><SelectValue placeholder="Trình độ" /></SelectTrigger>
                  <SelectContent>
                    {levels.map((l) => <SelectItem key={l} value={l}>{l === 'all' ? 'Tất cả' : l}</SelectItem>)}
                  </SelectContent>
                </Select>
                <span className="text-sm text-slate-500 whitespace-nowrap">{pagination?.total ?? 0} kết quả</span>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
            ) : (
              <>
                {user && myCourses.length > 0 && (
                  <div className="mb-14">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Khóa học của bạn</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {myCourses.slice(0, 4).map((c) => <CourseCard key={c.id} course={c} purchased hideAddToCart />)}
                    </div>
                    <Link to="/dashboard" className="inline-flex items-center gap-2 mt-4 text-primary font-medium hover:underline">
                      Xem tất cả <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">{user ? 'Khám phá thêm' : 'Danh sách khóa học'}</h3>
                  {availableCourses.length > 0 ? (
                    <>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {availableCourses.map((c) => <CourseCard key={c.id} course={c} />)}
                      </div>
                      {pagination && pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                          <Button variant="outline" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>
                            <ChevronLeft className="w-4 h-4 mr-2" /> Trước
                          </Button>
                          <span className="text-sm font-medium">Trang {page} / {pagination.totalPages}</span>
                          <Button variant="outline" onClick={() => !isPlaceholderData && page < pagination.totalPages && setPage((p) => p + 1)} disabled={isPlaceholderData || page >= pagination.totalPages}>
                            Sau <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-20 bg-slate-100 rounded-xl border border-dashed border-slate-200">
                      <p className="text-slate-500">Không tìm thấy khóa học nào phù hợp.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Team */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">Đội ngũ giảng viên</h2>
              <p className="text-lg text-slate-500">Học với các chuyên gia giàu kinh nghiệm</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((m, i) => (
                <div key={i} className="group text-center">
                  <div className="relative mb-6 overflow-hidden rounded-2xl">
                    <img src={m.image} alt={m.name} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-xl font-semibold mb-1 font-display">{m.name}</h3>
                  <p className="text-slate-500">{m.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-white font-display">Tham gia cộng đồng đang phát triển của chúng tôi</h2>
              <p className="text-xl text-white/70">Bắt đầu hành trình chinh phục tiếng Anh với sự đồng hành từ các chuyên gia</p>
              <Link to="/#courses">
                <Button size="lg" variant="secondary" className="shadow-lg shadow-primary/20 text-lg h-14 px-8">
                  Khám phá khóa học <ArrowRight className="w-5 h-5 ml-2" />
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
