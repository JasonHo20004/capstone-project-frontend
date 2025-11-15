import { useState } from 'react';
import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import CourseCard from '@/components/user/course/CourseCard';
import { mockCourses } from '@/data/mock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePurchases } from '@/context/PurchasesContext';

const Courses = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const { items } = usePurchases();

  const levels = ['all', ...Array.from(new Set(mockCourses.map(c => c.courseLevel).filter(Boolean)))] as string[];

  const filteredCourses = mockCourses.filter(course => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = course.title.toLowerCase().includes(q) || (course.description ?? '').toLowerCase().includes(q);
    const matchesLevel = selectedLevel === 'all' || course.courseLevel === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const purchasedIds = new Set(items.map(i => i.course.id));
  const filteredPurchasedCourses = filteredCourses.filter(c => purchasedIds.has(c.id));
  const filteredUnpurchasedCourses = filteredCourses.filter(c => !purchasedIds.has(c.id));

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-hero text-primary-foreground py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 font-['Be Vietnam Pro']">
                Khám phá các khóa học
              </h1>
              <p className="text-xl text-primary-foreground/80 mb-8">
                Tìm khóa học phù hợp để đạt mục tiêu học tiếng Anh của bạn
              </p>
            </div>
          </div>
        </section>

        {/* Filters Section */}
        <section className="py-12 border-b border-border bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm khóa học..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              {/* Category filter removed: not in admin mock */}

              {/* Level Filter */}
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-full lg:w-[200px] h-12">
                  <SelectValue placeholder="Trình độ" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level === 'all' ? 'Tất cả trình độ' : level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Courses Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold">
                {filteredCourses.length} khóa học được tìm thấy
              </h2>
            </div>

            {filteredCourses.length > 0 ? (
              <div className="space-y-12">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Khóa học của bạn</h3>
                    {filteredPurchasedCourses.length > 0 && (
                      <span className="text-sm text-muted-foreground">{filteredPurchasedCourses.length} khóa</span>
                    )}
                  </div>
                  {filteredPurchasedCourses.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {filteredPurchasedCourses.map((course) => (
                        <CourseCard key={course.id} course={course} hideAddToCart purchased />
                      ))}
                    </div>
                  ) : (
                    <div className="border border-border rounded-xl p-6 text-center text-muted-foreground">Bạn chưa mua khóa học nào phù hợp với bộ lọc.</div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Các khóa học khác</h3>
                    {filteredUnpurchasedCourses.length > 0 && (
                      <span className="text-sm text-muted-foreground">{filteredUnpurchasedCourses.length} khóa</span>
                    )}
                  </div>
                  {filteredUnpurchasedCourses.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {filteredUnpurchasedCourses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                      ))}
                    </div>
                  ) : (
                    <div className="border border-border rounded-xl p-6 text-center text-muted-foreground">Không còn khóa học nào khác phù hợp với bộ lọc.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-xl text-muted-foreground">
                  Không tìm thấy khóa học phù hợp với tiêu chí.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Courses;
