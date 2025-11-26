import { useState } from 'react';
import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import CourseCard from '@/components/user/course/CourseCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  // Data
  const myCourses = user ? myCoursesRes?.data || [] : [];
  const availableCourses = availableRes?.data || [];
  const pagination = availableRes?.pagination;

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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="pt-20 flex-grow">
        {/* Hero & Filter Section (Giữ nguyên UI) */}
        <section className="bg-gradient-hero text-primary-foreground py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-6 font-['Be Vietnam Pro']">Khám phá khóa học</h1>
            <div className="max-w-3xl mx-auto bg-background/10 p-4 rounded-xl backdrop-blur-md border border-white/20 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                <Input
                  placeholder="Tìm kiếm..."
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
              <Select value={selectedLevel} onValueChange={handleLevel}>
                <SelectTrigger className="w-full md:w-[180px] bg-white/10 border-white/20 text-white">
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
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 container mx-auto px-4 space-y-16">
          
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
          ) : (
            <>
              {/* --- PHẦN 1: KHÓA HỌC CỦA BẠN --- */}
              {user && myCourses.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-bold text-green-700">Khóa học của bạn</h2>
                  {myCourses.length > 0 && (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
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
                  // 👇 ĐÂY LÀ CÁI DÒNG BẠN CẦN 👇
                  <div className="bg-green-50/50 border border-green-100 rounded-xl p-8 text-center">
                    <p className="text-green-800 font-medium text-lg">
                      Bạn chưa đăng ký khóa học nào.
                    </p>
                    <p className="text-green-600 text-sm mt-1">
                      Hãy khám phá các khóa học chất lượng bên dưới và bắt đầu hành trình học tập ngay hôm nay!
                    </p>
                  </div>
                )}

                <div className="my-12 border-b border-border/50" />
              </div>
            )}

              {/* --- PHẦN 2: KHÓA HỌC CÓ SẴN (PHÂN TRANG) --- */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-primary">
                    {user ? 'Khám phá thêm' : 'Danh sách khóa học'}
                  </h2>
                  <span className="text-muted-foreground text-sm">
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
                        <span className="text-sm font-medium">Trang {page} / {pagination.totalPages}</span>
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
                  <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
                    <p className="text-muted-foreground">Không tìm thấy khóa học nào phù hợp.</p>
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