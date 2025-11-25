import { Link } from 'react-router-dom';
import { Star, User } from 'lucide-react'; // Thêm icon User làm avatar fallback
import { Badge } from '@/components/ui/badge';
import { Course as AdminCourse } from '@/types/type';
import { formatVND } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';

interface CourseCardProps {
  course: AdminCourse;
  hideAddToCart?: boolean;
  purchased?: boolean;
}

const CourseCard = ({ course, hideAddToCart = false, purchased = false }: CourseCardProps) => {
  const { addItem } = useCart();

  // ✅ SỬA LỖI: Lấy thông tin giảng viên an toàn
  // API trả về 'user', nhưng type có thể là 'courseSeller'. Chúng ta kiểm tra cả hai.
  
  const instructor = course.courseSeller || course.user || {};

  return (
    <Link to={`/courses/${course.id}`}>
      <div className="group bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-accent transition-all duration-300 border border-border hover:border-primary/20 h-full flex flex-col relative">
        
        {/* Placeholder cho Thumbnail (nếu chưa có ảnh bìa) */}
        {/* <div className="h-48 bg-muted flex items-center justify-center text-muted-foreground">
            <span className="text-sm">Course Thumbnail</span>
        </div> */}

        {purchased && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-secondary text-secondary-foreground">Đã mua</Badge>
          </div>
        )}

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          {/* Level badge (A1–C2) */}
          {course.courseLevel && (
            <div className="mb-2">
              <Badge variant="outline" className="bg-card/90">
                {course.courseLevel}
              </Badge>
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors font-['Be Vietnam Pro']">
            {course.title}
          </h3>

          {/* Description */}
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
            {course.description}
          </p>

          {/* Instructor */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
            {instructor.profilePicture ? (
              <img
                src={course.courseSeller?.profilePicture ?? ''}
                alt={course.courseSeller?.fullName || 'Giảng viên'}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                 <User className="w-4 h-4 text-secondary" />
              </div>
            )}
            <span className="text-sm text-muted-foreground">
              {course.courseSeller?.fullName ?? 'Giảng viên ẩn danh'}
            </span>
          </div>

          {/* Rating & Price */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-secondary fill-secondary" />
              <span className="font-semibold">{course.averageRating ?? 0}</span>
              <span className="text-sm text-muted-foreground">({course.ratingCount ?? 0})</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                {formatVND(course.price)}
              </span>
              {!hideAddToCart && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addItem(course);
                  }}
                >
                  Thêm vào giỏ
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;