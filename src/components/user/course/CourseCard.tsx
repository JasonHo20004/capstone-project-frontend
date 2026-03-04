import { Link } from 'react-router-dom';
import { Star, User, ShoppingCart, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Course } from "@/domain";
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
  const instructor = course.user || course.courseSeller || {};

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
      <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 h-full flex flex-col relative">
        
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
        <div className="p-5 flex flex-col flex-1">
          {/* Level badge */}
          {course.courseLevel && (
            <div className="mb-2">
              <Badge variant="outline" className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {course.courseLevel}
              </Badge>
            </div>
          )}

          {/* Title */}
          <h3 className="text-lg font-bold text-slate-900 leading-snug mb-1 line-clamp-2 group-hover:text-primary transition-colors font-display">
            {course.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-500 mb-4 line-clamp-2 flex-1">
            {course.description}
          </p>

          {/* Instructor */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
            {instructor.profilePicture ? (
              <img
                src={instructor.profilePicture}
                alt={instructor.fullName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                 <User className="w-4 h-4 text-primary" />
              </div>
            )}
            
            <span className="text-xs font-medium text-slate-500">
              {instructor.fullName || 'Unknown Instructor'}
            </span>
          </div>

          {/* Rating & Price & AddToCart */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold">
                {course.averageRating != null ? course.averageRating.toFixed(1) : '0.0'}
              </span>
              <span className="text-xs text-slate-400">
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