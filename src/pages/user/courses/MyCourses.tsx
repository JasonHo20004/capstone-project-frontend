import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import CourseCard from '@/components/user/course/CourseCard';
import { usePurchases } from '@/context/PurchasesContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function MyCourses() {
  const { items } = usePurchases();

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        <section className="bg-gradient-hero text-primary-foreground py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold font-['Be Vietnam Pro']">Khoá học đã mua</h1>
                <p className="text-primary-foreground/80">
                  Xem tất cả khoá học bạn sở hữu
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            {items.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <p className="text-xl text-muted-foreground">
                  Bạn chưa mua khoá học nào.
                </p>
                <Link to="/courses">
                  <Button className="bg-gradient-primary">Khám phá khoá học</Button>
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map(({ id, course }) => (
                  <CourseCard key={id} course={course} hideAddToCart purchased />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}