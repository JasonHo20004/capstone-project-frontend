import { useState, useMemo } from 'react';
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

export default function MyCourses() {
  const { items, isLoading, count } = usePurchases();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      ({ course }) =>
        course.title.toLowerCase().includes(q) ||
        course.description?.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  // Stats
  const totalCourses = count;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
        <p className="text-slate-500 font-medium">Đang tải khóa học của bạn...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <section className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 md:p-10">
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }} />
        </div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center backdrop-blur-sm border border-primary/20">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Thư viện học tập</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Khóa học của bạn
            </h1>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
              Quản lý, theo dõi tiến độ và tiếp tục hành trình học tập của bạn tại đây.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="flex gap-3">
            <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.1] rounded-xl px-5 py-4 min-w-[120px]">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-xs text-slate-400 font-medium">Đã sở hữu</span>
              </div>
              <p className="text-2xl font-black text-white">{totalCourses}</p>
            </div>
            <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.1] rounded-xl px-5 py-4 min-w-[120px]">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-400 font-medium">Trạng thái</span>
              </div>
              <p className="text-sm font-bold text-emerald-400 mt-1">
                {totalCourses > 0 ? 'Đang học' : 'Chưa bắt đầu'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Action Bar */}
      {totalCourses > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm trong khóa học của bạn..."
              className="pl-10 bg-slate-50 border-slate-200 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              {filteredItems.length} / {totalCourses} khóa học
            </span>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-primary'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-primary'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Content */}
      {totalCourses === 0 ? (
        /* === EMPTY STATE === */
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            {/* Animated Icon */}
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-blue-50 flex items-center justify-center border border-primary/10">
                <BookOpen className="w-10 h-10 text-primary/60" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center border-2 border-white shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Bắt đầu hành trình học tập
            </h2>
            <p className="text-slate-500 text-sm max-w-sm mb-8 leading-relaxed">
              Bạn chưa sở hữu khóa học nào. Khám phá kho khóa học chất lượng và
              bắt đầu chinh phục mục tiêu của bạn ngay hôm nay!
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/courses">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 rounded-xl px-8 h-12 font-bold"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Khám phá khóa học
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Feature hints */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 max-w-2xl w-full">
              {[
                { icon: BookOpen, title: 'Học mọi lúc', desc: 'Truy cập 24/7 trên mọi thiết bị' },
                { icon: TrendingUp, title: 'Theo dõi tiến độ', desc: 'Biểu đồ học tập chi tiết' },
                { icon: GraduationCap, title: 'Chứng chỉ', desc: 'Nhận chứng chỉ khi hoàn thành' },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm border border-slate-100">
                    <feature.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{feature.title}</span>
                  <span className="text-xs text-slate-400">{feature.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : filteredItems.length === 0 ? (
        /* === NO SEARCH RESULTS === */
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-lg font-semibold text-slate-700 mb-1">
              Không tìm thấy kết quả
            </p>
            <p className="text-sm text-slate-400">
              Thử tìm với từ khóa khác hoặc{' '}
              <button
                onClick={() => setSearchQuery('')}
                className="text-primary font-medium hover:underline"
              >
                xóa bộ lọc
              </button>
            </p>
          </div>
        </section>
      ) : (
        /* === COURSE GRID/LIST === */
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <div
            className={
              viewMode === 'grid'
                ? 'grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
                : 'flex flex-col gap-4'
            }
          >
            {filteredItems.map(({ id, course }) => (
              <CourseCard key={id} course={course} hideAddToCart purchased />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}