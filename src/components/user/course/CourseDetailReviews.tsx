import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, Flag, User, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCourseRatings } from '@/hooks/api/use-student-learning';
import type { RatingResponse } from '@/types/student-learning';

export function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days === 0) return 'Hôm nay';
  if (days === 1) return 'Hôm qua';
  if (days < 7) return `${days} ngày trước`;
  if (days < 14) return 'Tuần trước';
  if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
  if (days < 60) return 'Tháng trước';
  return `${Math.floor(days / 30)} tháng trước`;
}

export function StarRow({ score, size = 'sm' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${cls} ${i <= score ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`}
        />
      ))}
    </div>
  );
}

export function ReviewCard({ rating }: { rating: RatingResponse }) {
  const [helpful, setHelpful] = useState<'up' | 'down' | null>(null);
  const [reported, setReported] = useState(false);

  const userName = rating.user?.fullName ?? 'Học viên';
  const userAvatar = rating.user?.profilePicture ?? null;

  return (
    <div className="flex gap-4 py-5 border-b border-slate-100 last:border-0">
      {userAvatar ? (
        <img
          src={userAvatar}
          alt={userName}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-100"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ring-2 ring-slate-100">
          <User className="w-5 h-5 text-primary/60" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="font-semibold text-sm text-slate-900 truncate">
            {userName}
          </span>
          <span className="text-xs text-slate-400 flex-shrink-0">
            {formatRelativeTime(rating.createdAt)}
          </span>
        </div>

        <StarRow score={rating.score} />

        {rating.content && (
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{rating.content}</p>
        )}

        {rating.replyContent && (
          <div className="mt-3 bg-slate-50 rounded-lg p-3 border-l-2 border-primary/30">
            <p className="text-xs font-semibold text-slate-500 mb-1">Phản hồi từ giảng viên</p>
            <p className="text-sm text-slate-600">{rating.replyContent}</p>
          </div>
        )}

        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-slate-400">Hữu ích?</span>
          <button
            onClick={() => setHelpful(helpful === 'up' ? null : 'up')}
            className={`flex items-center gap-1 text-xs transition-colors rounded px-1.5 py-0.5 ${
              helpful === 'up'
                ? 'text-primary bg-primary/10'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            title="Hữu ích"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setHelpful(helpful === 'down' ? null : 'down')}
            className={`flex items-center gap-1 text-xs transition-colors rounded px-1.5 py-0.5 ${
              helpful === 'down'
                ? 'text-red-500 bg-red-50'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            title="Không hữu ích"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setReported(!reported)}
            className={`ml-auto flex items-center gap-1 text-xs transition-colors rounded px-1.5 py-0.5 ${
              reported
                ? 'text-orange-500 bg-orange-50'
                : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Flag className="w-3 h-3" />
            {reported ? 'Đã báo cáo' : 'Báo cáo'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CourseDetailReviewsProps {
  courseId: string;
  averageRating: number;
  totalRatings: number;
  onShowAll: () => void;
}

export default function CourseDetailReviews({
  courseId,
  averageRating,
  totalRatings,
  onShowAll,
}: CourseDetailReviewsProps) {
  const { data: ratingsData, isLoading } = useCourseRatings(courseId, { page: 1, limit: 4 });

  const displayAverage = ratingsData?.averageScore ?? averageRating;
  const displayTotal = ratingsData?.total ?? totalRatings;
  const reviews = ratingsData?.ratings ?? [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Summary header */}
      <div className="px-7 pt-7 pb-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-5">Đánh giá từ học viên</h2>

        <div className="flex items-center gap-8">
          {/* Big rating number */}
          <div className="text-center flex-shrink-0">
            <div className="text-6xl font-black text-amber-500 leading-none tabular-nums">
              {displayAverage > 0 ? displayAverage.toFixed(1) : '—'}
            </div>
            <div className="flex justify-center mt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i <= Math.round(displayAverage)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-slate-200 text-slate-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1.5">Điểm trung bình</p>
          </div>

          <div className="h-16 w-px bg-slate-100 flex-shrink-0" />

          <div>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{displayTotal}</p>
            <p className="text-sm text-slate-500 mt-0.5">lượt đánh giá</p>
            {displayTotal > 0 && (
              <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
                Dựa trên {displayTotal} đánh giá thực tế từ học viên.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Review list */}
      <div className="px-7">
        {isLoading ? (
          <div className="py-10 text-center">
            <div className="inline-block w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-slate-400 mt-2">Đang tải đánh giá...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-10 text-center">
            <Star className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Chưa có đánh giá</p>
            <p className="text-xs text-slate-400 mt-1">
              Hãy là người đầu tiên chia sẻ cảm nhận về khóa học này.
            </p>
          </div>
        ) : (
          reviews.map((rating) => <ReviewCard key={rating.id} rating={rating} />)
        )}
      </div>

      {/* Show all */}
      {displayTotal > 4 && (
        <div className="px-7 pb-6 pt-2">
          <Button
            variant="outline"
            className="w-full rounded-xl border-slate-200 hover:border-primary/40 hover:text-primary font-medium"
            onClick={onShowAll}
          >
            Xem tất cả {displayTotal} đánh giá
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
