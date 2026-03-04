import CourseCard from '@/components/user/course/CourseCard';
import { usePurchases } from '@/context/PurchasesContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function MyCourses() {
  const { items } = usePurchases();

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-900">
              My Courses
            </h1>
            <p className="text-slate-500 text-base max-w-xl">
              Theo dõi tiến độ và tiếp tục các khóa học bạn đã sở hữu.
            </p>
          </div>
          <div className="text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-lg w-fit">
            {items.length} khóa học
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        {items.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-xl text-slate-500">
              Bạn chưa mua khoá học nào.
            </p>
            <Link to="/courses">
              <Button className="bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20">
                Khám phá khoá học
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map(({ id, course }) => (
              <CourseCard key={id} course={course} hideAddToCart purchased />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}