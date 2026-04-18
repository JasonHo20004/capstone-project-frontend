import { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import { BackToTopButton } from '@/components/user/layout/BackToTopButton';
import Hero from '@/components/user/home/Hero';
import Features from '@/components/user/home/Features';
import CourseCard from '@/components/user/course/CourseCard';
import { Input } from '@/components/ui/input';
import { Search, Loader2, ChevronLeft, ChevronRight, Target, Users, Award, Heart, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Pingo } from '@/components/pingo';
import { useGetCourses, useEnrolledCourses } from '@/hooks/api/use-courses';
import { useUser } from '@/hooks/api/use-user';
import type { Course } from "@/domain";

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
  const reduce = useReducedMotion();
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
                  Câu chuyện
                </span>
                <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                  Sinh ra từ một tầm nhìn đơn giản <span className="text-secondary">nhưng mạnh mẽ</span>
                </h2>
                <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
                  <p>Được thành lập năm 2020, SkillBoost ra đời từ một tầm nhìn đơn giản nhưng mạnh mẽ: mang giáo dục tiếng Anh chất lượng cao đến với mọi người, bất kể địa điểm hay hoàn cảnh.</p>
                  <p>Bắt đầu từ một đội ngũ nhỏ đầy nhiệt huyết, chúng tôi đã phát triển thành nền tảng toàn cầu phục vụ hàng nghìn học viên tại hơn 50 quốc gia.</p>
                  <p>Ngày nay, chúng tôi tiếp tục đổi mới và cải tiến khóa học để đảm bảo mỗi học viên nhận được trải nghiệm học tập tốt nhất.</p>
                </div>
              </motion.div>

              <motion.div {...reveal(1)} className="relative">
                <div className="overflow-hidden rounded-[2rem] shadow-lg ring-1 ring-border/10">
                  <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=600&fit=crop" alt="Câu chuyện SkillBoost" className="w-full" />
                </div>
                <div aria-hidden className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
                <div aria-hidden className="absolute -right-6 -top-6 h-40 w-40 rounded-full bg-secondary/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-6 -right-6 hidden md:block">
                  <Pingo pose="point" size={120} />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-surface-low py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Giá trị cốt lõi</h2>
              <p className="mt-3 text-lg text-muted-foreground">Những nguyên tắc định hướng mọi hoạt động của chúng tôi</p>
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
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-glass ring-1 ring-white/20">Explore</span>
                <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight md:text-5xl">Khám phá khoá học</h2>
                <p className="mt-3 text-white/85">Duyệt danh sách khoá học, lọc theo trình độ và tìm nội dung phù hợp.</p>
              </div>
            </motion.div>

            <div className="mb-8 flex flex-col gap-4 rounded-2xl bg-surface-lowest p-5 shadow-md ring-1 ring-border/10 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Tìm khóa học, kỹ năng hoặc giảng viên..." className="pl-10" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} />
              </div>
              <div className="flex items-center gap-3">
                <Select value={selectedLevel} onValueChange={(v) => { setSelectedLevel(v); setPage(1); }}>
                  <SelectTrigger className="w-[160px] rounded-xl"><SelectValue placeholder="Trình độ" /></SelectTrigger>
                  <SelectContent>
                    {levels.map((l) => <SelectItem key={l} value={l}>{l === 'all' ? 'Tất cả' : l}</SelectItem>)}
                  </SelectContent>
                </Select>
                <span className="whitespace-nowrap text-sm text-muted-foreground">{pagination?.total ?? 0} kết quả</span>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : (
              <>
                {user && myCourses.length > 0 && (
                  <div className="mb-14">
                    <h3 className="mb-4 font-display text-xl font-bold">Khóa học của bạn</h3>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {myCourses.slice(0, 4).map((c) => <CourseCard key={c.id} course={c} purchased hideAddToCart />)}
                    </div>
                    <Link to="/dashboard" className="mt-4 inline-flex items-center gap-2 font-medium text-primary hover:underline">
                      Xem tất cả <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
                <div>
                  <h3 className="mb-4 font-display text-xl font-bold">{user ? 'Khám phá thêm' : 'Danh sách khóa học'}</h3>
                  {availableCourses.length > 0 ? (
                    <>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {availableCourses.map((c) => <CourseCard key={c.id} course={c} />)}
                      </div>
                      {pagination && pagination.totalPages > 1 && (
                        <div className="mt-10 flex items-center justify-center gap-4">
                          <Button variant="outline" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>
                            <ChevronLeft className="mr-2 h-4 w-4" /> Trước
                          </Button>
                          <span className="text-sm font-medium">Trang {page} / {pagination.totalPages}</span>
                          <Button variant="outline" onClick={() => !isPlaceholderData && page < pagination.totalPages && setPage((p) => p + 1)} disabled={isPlaceholderData || page >= pagination.totalPages}>
                            Sau <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-2xl bg-surface-low py-20 text-center ring-1 ring-border/10">
                      <p className="text-muted-foreground">Không tìm thấy khóa học nào phù hợp.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Team */}
        <section className="bg-surface-low py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Đội ngũ giảng viên</h2>
              <p className="mt-3 text-lg text-muted-foreground">Học với các chuyên gia giàu kinh nghiệm</p>
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
              <Pingo pose="cheer" size={120} float />
              <h2 className="font-display text-4xl font-bold md:text-5xl">Tham gia cộng đồng đang phát triển của chúng tôi</h2>
              <p className="text-lg text-white/80 md:text-xl">Bắt đầu hành trình chinh phục tiếng Anh với sự đồng hành từ các chuyên gia</p>
              <Link to="/#courses">
                <Button variant="pingo" size="xl">
                  Khám phá khóa học <ArrowRight className="ml-1 h-5 w-5" />
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
