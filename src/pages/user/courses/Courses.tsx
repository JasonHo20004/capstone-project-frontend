import { useState } from 'react';
import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import CourseCard from '@/components/user/course/CourseCard';
import { Input } from '@/components/ui/input';
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

// Hooks
import { useGetCourses } from '@/hooks/api/use-courses';
import { useUser } from '@/hooks/api/use-user';

const levels = ['all', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const Courses = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [page, setPage] = useState(1); // Page cho danh sách "Chưa mua"
  const limit = 9;

  const { user } = useUser(); // Check xem user có login không

  // === FETCH 1: KHÓA HỌC CỦA TÔI (Chỉ fetch khi đã login) ===
  const { data: myCoursesRes, isLoading: isLoadingMy } = useGetCourses({
    page: 1,
    limit: 100, // Lấy nhiều để hiện hết (thường user không mua quá nhiều)
    search: searchQuery || undefined,
    level: selectedLevel,
    enrollmentStatus: 'enrolled', // 👈 Lọc Server: ĐÃ MUA
    sortBy: 'ratingCount',
    sortOrder: 'desc',
  }); // (Có thể thêm enabled: !!user vào đây nếu cần)

  // === FETCH 2: KHÓA HỌC CÓ SẴN (CHƯA MUA) ===
  // Nếu chưa login -> Lấy tất cả (undefined). Nếu đã login -> Lấy 'not_enrolled'
  const {
    data: availableRes,
    isLoading: isLoadingAvailable,
    isPlaceholderData,
  } = useGetCourses({
    page: page,
    limit: limit,
    search: searchQuery || undefined,
    level: selectedLevel,
    enrollmentStatus: user ? 'not_enrolled' : undefined, // 👈 Lọc Server: CHƯA MUA
    sortBy: 'ratingCount',
    sortOrder: 'desc',
  });

  // Data - Backend trả { data: [...], total, page, limit, totalPages } ở root
  const myCourses = user ? myCoursesRes?.data || [] : [];
  const availableCourses = availableRes?.data || [];
  const pagination = availableRes
    ? { total: availableRes.total, page: availableRes.page, limit: availableRes.limit, totalPages: availableRes.totalPages }
    : undefined;

  // Loading
  const isLoading = (!!user && isLoadingMy) || isLoadingAvailable;

  // Handlers
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };
  const handleLevel = (val: string) => {
    setSelectedLevel(val);
    setPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 flex-grow">
        <section className="container mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white p-8 md:p-12 min-h-[320px] flex items-center">
            <div className="absolute inset-0 opacity-35">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1920&q=80"
                alt="Courses hero"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/85 to-transparent"></div>
            </div>
            <div className="relative z-10 max-w-2xl">
              <span className="px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary-light text-xs font-bold uppercase tracking-widest">
                Explore
              </span>
              <h1 className="text-4xl md:text-5xl font-black mt-4 tracking-tight">
                Khám phá khoá học theo lộ trình của bạn
              </h1>
              <p className="text-slate-200 mt-4">
                Duyệt danh sách khoá học, lọc theo trình độ và tìm nội dung phù hợp để học ngay.
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 mt-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Tìm khóa học, kỹ năng hoặc giảng viên..."
                className="pl-10 border-slate-200 bg-slate-50"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedLevel} onValueChange={handleLevel}>
                <SelectTrigger className="w-[160px] bg-white">
                  <SelectValue placeholder="Trình độ" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l === 'all' ? 'Tất cả' : l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-slate-500 whitespace-nowrap">
                {pagination?.total || 0} kết quả
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 container mx-auto px-4 space-y-14">
          
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
          ) : (
            <>
              {/* --- PHẦN 1: KHÓA HỌC CỦA BẠN --- */}
              {user && myCourses.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Khóa học của bạn</h2>
                  {myCourses.length > 0 && (
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                      {myCourses.length}
                    </span>
                  )}
                </div>

                {/* Logic: Có khóa học thì hiện Grid, Không có thì hiện Thông báo */}
                {myCourses.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {myCourses.map(course => (
                      <CourseCard 
                        key={course.id} 
                        course={course} 
                        purchased 
                        hideAddToCart 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                    <p className="text-slate-800 font-medium text-lg">
                      Bạn chưa đăng ký khóa học nào.
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                      Hãy khám phá các khóa học chất lượng bên dưới và bắt đầu hành trình học tập ngay hôm nay!
                    </p>
                  </div>
                )}

                <div className="my-2 border-b border-slate-200/50" />
              </div>
            )}

              {/* --- PHẦN 2: KHÓA HỌC CÓ SẴN (PHÂN TRANG) --- */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {user ? 'Khám phá thêm' : 'Danh sách khóa học'}
                  </h2>
                  <span className="text-slate-500 text-sm">
                    {pagination?.total || 0} kết quả
                  </span>
                </div>

                {availableCourses.length > 0 ? (
                  <div className="space-y-8">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {availableCourses.map(course => (
                        <CourseCard key={course.id} course={course} />
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {pagination && pagination.totalPages > 1 && (
                      <div className="flex justify-center items-center gap-4">
                        <Button
                          variant="outline"
                          onClick={() => setPage(old => Math.max(old - 1, 1))}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="w-4 h-4 mr-2" /> Trước
                        </Button>
                        <span className="text-sm font-medium text-slate-900">Trang {page} / {pagination.totalPages}</span>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (!isPlaceholderData && page < pagination.totalPages) setPage(old => old + 1);
                          }}
                          disabled={isPlaceholderData || page >= pagination.totalPages}
                        >
                          Sau <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-500">Không tìm thấy khóa học nào phù hợp.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Courses;