import { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import CourseCard from '@/components/user/course/CourseCard';
import { usePurchases } from '@/context/PurchasesContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import {
  Search,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Loader2,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Pingo } from '@/components/pingo';

export default function MyCourses() {
  const { items, isLoading, count } = usePurchases();
  const reduce = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      ({ course }) =>
        course.title.toLowerCase().includes(q) ||
        course.description?.toLowerCase().includes(q),
    );
  }, [items, searchQuery]);

  const totalCourses = count;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="font-medium text-muted-foreground">Đang tải khóa học của bạn...</p>
      </div>
    );
  }

  const reveal = (i = 0) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.45, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.section
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl bg-hero-gradient p-8 text-white md:p-10"
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div aria-hidden className="absolute -right-16 top-0 h-80 w-80 rounded-full bg-secondary/30 blur-3xl" />
        <div aria-hidden className="absolute -left-16 bottom-0 h-60 w-60 rounded-full bg-primary-light/40 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-glass ring-1 ring-white/20">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-secondary-light">
                Thư viện học tập
              </span>
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              Khóa học của bạn
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-white/80">
              Quản lý, theo dõi tiến độ và tiếp tục hành trình học tập của bạn tại đây.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="glass min-w-[120px] rounded-xl px-5 py-4">
              <div className="mb-1 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Đã sở hữu</span>
              </div>
              <p className="font-display text-2xl font-extrabold text-foreground">{totalCourses}</p>
            </div>
            <div className="glass min-w-[120px] rounded-xl px-5 py-4">
              <div className="mb-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-secondary" />
                <span className="text-xs font-medium text-muted-foreground">Trạng thái</span>
              </div>
              <p className="mt-1 text-sm font-bold text-secondary-foreground">
                {totalCourses > 0 ? 'Đang học' : 'Chưa bắt đầu'}
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Action Bar */}
      {totalCourses > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl bg-surface-lowest p-4 shadow-md ring-1 ring-border/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm trong khóa học của bạn..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {filteredItems.length} / {totalCourses} khóa học
            </span>
            <div className="h-5 w-px bg-border/30" />
            <div className="flex rounded-xl bg-surface-container p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-1.5 transition-all duration-200 ease-soft ${
                  viewMode === 'grid'
                    ? 'bg-surface-lowest text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-lg p-1.5 transition-all duration-200 ease-soft ${
                  viewMode === 'list'
                    ? 'bg-surface-lowest text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Content */}
      {totalCourses === 0 ? (
        <section className="overflow-hidden rounded-2xl bg-surface-lowest shadow-md ring-1 ring-border/10">
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="relative mb-8">
              <Pingo pose="think" size={140} float />
              <div className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-secondary/20 ring-2 ring-surface-lowest">
                <Sparkles className="h-4 w-4 text-secondary" />
              </div>
            </div>

            <h2 className="mb-2 font-display text-2xl font-bold">Bắt đầu hành trình học tập</h2>
            <p className="mb-8 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Bạn chưa sở hữu khóa học nào. Khám phá kho khóa học chất lượng và bắt đầu chinh phục mục tiêu của bạn ngay hôm nay!
            </p>

            <Link to="/courses">
              <Button variant="pingo" size="lg">
                <Sparkles className="mr-1 h-4 w-4" />
                Khám phá khóa học
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>

            <div className="mt-12 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { icon: BookOpen, title: 'Học mọi lúc', desc: 'Truy cập 24/7 trên mọi thiết bị' },
                { icon: TrendingUp, title: 'Theo dõi tiến độ', desc: 'Biểu đồ học tập chi tiết' },
                { icon: GraduationCap, title: 'Chứng chỉ', desc: 'Nhận chứng chỉ khi hoàn thành' },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  {...reveal(i)}
                  className="flex flex-col items-center gap-2 rounded-xl bg-surface-low p-4 ring-1 ring-border/10"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-lowest shadow-sm">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{feature.title}</span>
                  <span className="text-xs text-muted-foreground">{feature.desc}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : filteredItems.length === 0 ? (
        <section className="rounded-2xl bg-surface-lowest p-6 shadow-md ring-1 ring-border/10">
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container">
              <Search className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="mb-1 font-display text-lg font-semibold">Không tìm thấy kết quả</p>
            <p className="text-sm text-muted-foreground">
              Thử tìm với từ khóa khác hoặc{' '}
              <button onClick={() => setSearchQuery('')} className="font-medium text-primary hover:underline">
                xóa bộ lọc
              </button>
            </p>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl bg-surface-lowest p-6 shadow-md ring-1 ring-border/10">
          <div
            className={
              viewMode === 'grid'
                ? 'grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'flex flex-col gap-4'
            }
          >
            {filteredItems.map(({ id, course }, i) => (
              <motion.div key={id} {...reveal(i)}>
                <CourseCard course={course} hideAddToCart purchased />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
