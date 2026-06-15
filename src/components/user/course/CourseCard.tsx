import { Link } from 'react-router-dom';
import { Star, User, ShoppingCart, Loader2, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { TiltCard } from '@/components/ui/tilt-card';
import type { Course } from "@/domain";
import { formatVND } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { useAddToCart, useIsInCart } from '@/hooks/api/use-cart';
import { useUser } from '@/hooks/api/use-user';
import { toast } from 'sonner';

interface CourseCardProps {
  course: Course;
  hideAddToCart?: boolean;
  purchased?: boolean;
}

const CourseCard = ({ course, hideAddToCart = false, purchased = false }: CourseCardProps) => {
  const { user } = useUser();
  const addToCartMutation = useAddToCart();
  const isInCart = useIsInCart(course.id);
  const { t } = useTranslation('courses');
  const instructor: { profilePicture?: string; fullName?: string } =
    course.user || course.courseSeller || {};

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error(t('courseCard.loginRequired'));
      return;
    }

    addToCartMutation.mutate({
      id: course.id,
      title: course.title,
      price: course.price,
      thumbnailUrl: course.thumbnailUrl,
    });
  };

  return (
    <Link to={purchased ? `/learning/courses/${course.id}/lessons` : `/courses/${course.id}`} className="block h-full">
      <TiltCard className="group flex h-full flex-col overflow-hidden rounded-2xl bg-surface-lowest shadow-md ring-1 ring-border/10 transition-shadow duration-300 ease-soft hover:shadow-card-hover">
        {purchased && (
          <div className="absolute right-3 top-3 z-10">
            <Badge className="rounded-full bg-secondary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground ring-1 ring-secondary/30 hover:bg-secondary/15">
              {t('courseCard.purchased')}
            </Badge>
          </div>
        )}

        {/* Accent strip */}
        <div className="relative h-2 bg-gradient-to-r from-primary via-primary-light to-secondary" />

        <div className="flex flex-1 flex-col p-5">
          {course.courseLevel && (
            <div className="mb-2">
              <Badge
                variant="outline"
                className="rounded-full bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary ring-1 ring-primary/20"
              >
                {course.courseLevel}
              </Badge>
            </div>
          )}

          <h3 className="mb-1 line-clamp-2 font-display text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
            {course.title}
          </h3>

          <p className="mb-4 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
            {course.description}
          </p>

          <div className="mb-4 flex items-center gap-3 border-b border-border/15 pb-4">
            {instructor.profilePicture ? (
              <img
                src={instructor.profilePicture}
                alt={instructor.fullName}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-surface-low"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
            )}
            <span className="text-xs font-medium text-muted-foreground">
              {instructor.fullName || t('courseCard.unknownInstructor')}
            </span>
          </div>

          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-secondary text-secondary" />
              <span className="text-xs font-bold text-foreground">
                {course.averageRating != null ? course.averageRating.toFixed(1) : '0.0'}
              </span>
              <span className="text-xs text-muted-foreground">({course.ratingCount ?? 0})</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-display text-lg font-bold text-primary">
                {formatVND(Number(course.price))}
              </span>

              {!hideAddToCart && !purchased && (
                <Button
                  size="icon"
                  variant={isInCart ? "secondary" : "default"}
                  className="h-9 w-9 rounded-full p-0"
                  onClick={handleAddToCart}
                  disabled={addToCartMutation.isPending || isInCart}
                  title={isInCart ? t('courseCard.alreadyInCart') : t('courseCard.addToCartTitle')}
                >
                  {addToCartMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isInCart ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </TiltCard>
    </Link>
  );
};

export default CourseCard;
