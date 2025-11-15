import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
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
  return (
    <Link to={`/courses/${course.id}`}>
      <div className="group bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-accent transition-all duration-300 border border-border hover:border-primary/20 h-full flex flex-col relative">
        {/* Thumbnail removed: not available in admin mock */}

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
            {course.courseSeller?.profilePicture && (
              <img
                src={course.courseSeller.profilePicture}
                alt={course.courseSeller.fullName}
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <span className="text-sm text-muted-foreground">{course.courseSeller.fullName}</span>
          </div>

          {/* Meta Info removed: fields not present in admin mock */}

          {/* Rating & Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-secondary fill-secondary" />
              <span className="font-semibold">{course.averageRating ?? 'N/A'}</span>
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
