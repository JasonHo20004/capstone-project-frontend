import { Link } from 'react-router-dom';
import { Star, User, ShoppingCart, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Course } from '@/types/type';
import { formatVND } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// MỚI: Import Hooks
import { useAddToCart } from '@/hooks/api/use-cart';
import { useUser } from '@/hooks/api/use-user';
import { toast } from 'sonner';

interface CourseCardProps {
  course: Course;
  hideAddToCart?: boolean; // Prop để ẩn nút thêm giỏ (ví dụ khóa đã mua)
  purchased?: boolean;     // Prop để hiện badge "Đã mua"
}

const CourseCard = ({ course, hideAddToCart = false, purchased = false }: CourseCardProps) => {
  const { user } = useUser();
  
  // Hook thêm vào giỏ
  const addToCartMutation = useAddToCart();

  // Xử lý logic lấy thông tin giảng viên
  const instructor = course.user || (course as any).courseSeller || {};

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Ngăn chặn chuyển trang khi bấm nút
    e.stopPropagation();

    if (!user) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }

    addToCartMutation.mutate(course.id);
  };

  return (
    <Link to={`/courses/${course.id}`}>
      <div className="group bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-accent transition-all duration-300 border border-border hover:border-primary/20 h-full flex flex-col relative">
        
        {/* Thumbnail Placeholder */}
        <div >
            
            
            {/* Badge Đã mua */}
            {purchased && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                  Đã sở hữu
                </Badge>
              </div>
            )}
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          {/* Level badge */}
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
                src={instructor.profilePicture}
                alt={instructor.fullName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                 <User className="w-4 h-4 text-secondary" />
              </div>
            )}
            
            <span className="text-sm text-muted-foreground">
              {instructor.fullName || 'Unknown Instructor'}
            </span>
          </div>

          {/* Rating & Price & AddToCart */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold text-sm">
                {course.averageRating != null ? course.averageRating.toFixed(1) : '0.0'}
              </span>
              <span className="text-xs text-muted-foreground">
                ({course.ratingCount ?? 0})
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-primary">
                {formatVND(Number(course.price))}
              </span>

              {/* Nút Add to Cart */}
              {!hideAddToCart && !purchased && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-9 w-9 rounded-full shadow-sm hover:bg-primary hover:text-white transition-colors"
                  onClick={handleAddToCart}
                  disabled={addToCartMutation.isPending}
                  title="Thêm vào giỏ hàng"
                >
                  {addToCartMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
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