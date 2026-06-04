import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Star } from 'lucide-react';
import { useCourseRatings } from '@/hooks/api/use-student-learning';
import { ReviewCard, StarRow } from './CourseDetailReviews';

interface AllRatingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseName: string;
}

type FilterValue = 'all' | '5' | '4' | '3' | '2' | '1';

export default function AllRatingsModal({
  open,
  onOpenChange,
  courseId,
  courseName,
}: AllRatingsModalProps) {
  const { t } = useTranslation('courses');
  const [filter, setFilter] = useState<FilterValue>('all');

  const { data: ratingsData, isLoading } = useCourseRatings(
    open ? courseId : undefined,
    { page: 1, limit: 100 }
  );

  // Lock body scroll while modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setFilter('all');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  if (!open) return null;

  const allReviews = ratingsData?.ratings ?? [];
  const displayAverage = ratingsData?.averageScore ?? 0;
  const displayTotal = ratingsData?.total ?? 0;

  const filtered =
    filter === 'all'
      ? allReviews
      : allReviews.filter((r) => r.score === Number(filter));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      aria-modal="true"
      role="dialog"
      aria-label={t('allRatings.title')}
    >
      {/* Dimmed backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal panel */}
      <div className="relative z-10 w-full sm:max-w-2xl bg-white sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t('allRatings.title')}</h2>
            <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{courseName}</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
            aria-label={t('allRatings.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary strip */}
        {displayTotal > 0 && !isLoading && (
          <div className="px-6 py-4 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-black text-amber-500 leading-none tabular-nums">
                  {displayAverage.toFixed(1)}
                </div>
                <div className="mt-1">
                  <StarRow score={Math.round(displayAverage)} size="md" />
                </div>
              </div>
              <div className="h-12 w-px bg-slate-100" />
              <p className="text-sm text-slate-500">
                <span className="font-bold text-slate-900 text-base">{displayTotal}</span> {t('allRatings.reviewsLabel')}
              </p>
            </div>
          </div>
        )}

        {/* Star filter chips */}
        <div className="px-6 py-3 border-b border-slate-100 flex gap-2 flex-wrap flex-shrink-0">
          {(['all', '5', '4', '3', '2', '1'] as FilterValue[]).map((val) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${
                filter === val
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary'
              }`}
            >
              {val === 'all' ? (
                t('allRatings.filterAll')
              ) : (
                <span className="flex items-center gap-1">
                  {val} <Star className="w-3 h-3 fill-current" />
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 overscroll-contain">
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="inline-block w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-slate-400 mt-3">{t('allRatings.loading')}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Star className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                {filter === 'all' ? t('allRatings.emptyAll') : t('allRatings.emptyFiltered', { stars: filter })}
              </p>
            </div>
          ) : (
            filtered.map((rating) => <ReviewCard key={rating.id} rating={rating} />)
          )}
        </div>
      </div>
    </div>
  );
}
