import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Quote, Sparkles, BookMarked } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TranslatableText } from './TranslatableText';

export interface SlideChunk {
  title: string;
  content: string;
  key_points?: string[];
  keywords?: { term: string; meaning: string }[];
  example?: string;
  practice_phrase?: string;
  image_url?: string;
}

interface Props {
  chunk: SlideChunk;
  index: number;
  total: number;
  active: boolean;
  ragBase: string;
  /** Optional teacher avatar to overlay in the top-right corner of the slide */
  avatarSlot?: ReactNode;
  audioProgress?: number | null;
}

/**
 * Visual slide rendering for a lesson section.
 * - Hero image at top (with ken-burns animation when active)
 * - Slide-in animation when becoming active
 * - Optional avatar PIP in the top-right
 */
export function LessonSlide({ chunk, index, total, active, ragBase, avatarSlot, audioProgress }: Props) {
  const { t } = useTranslation('livestream');
  const hasSlideData = !!(
    (chunk.key_points && chunk.key_points.length) ||
    (chunk.keywords && chunk.keywords.length) ||
    chunk.example
  );

  return (
    <div
      key={`${index}-${chunk.title}`}
      className={cn(
        'space-y-3 transition-all',
        active && 'animate-slide-in',
      )}
    >
      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-in { animation: slide-in 0.45s ease-out both; }

        @keyframes ken-burns {
          0%   { transform: scale(1) translate(0,0); }
          50%  { transform: scale(1.08) translate(-1%, -1%); }
          100% { transform: scale(1.04) translate(1%, 0); }
        }
        .ken-burns { animation: ken-burns 18s ease-in-out infinite alternate; }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%);
          background-size: 200% 100%;
          animation: shimmer 1.6s linear infinite;
        }

        @keyframes pop-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pop-in { animation: pop-in 0.4s ease-out both; }
      `}</style>

      {(hasSlideData || chunk.image_url) && active && (
        <div className="relative rounded-2xl border border-indigo-100 bg-white overflow-hidden shadow-md">
          {/* Image hero with ken-burns */}
          <div className="relative w-full h-44 sm:h-52 bg-slate-100 overflow-hidden">
            {chunk.image_url ? (
              <img
                src={chunk.image_url}
                alt={chunk.title}
                className="w-full h-full object-cover ken-burns"
                loading="eager"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full shimmer" />
            )}

            {/* Gradient overlay for legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30" />

            {/* Slide counter top-left */}
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-white/40 rounded-full px-2 py-0.5 shadow">
              <BookMarked className="w-3 h-3 text-indigo-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                Slide {index + 1}/{total}
              </span>
            </div>

            {/* Avatar PIP top-right */}
            {avatarSlot && (
              <div className="absolute top-2 right-2 pop-in">
                {avatarSlot}
              </div>
            )}

            {/* Slide title across bottom of image */}
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2 pop-in">
              <h3 className="text-white text-lg sm:text-xl font-bold leading-tight drop-shadow-lg">
                {chunk.title}
              </h3>
            </div>
          </div>

          <div className="p-3 space-y-3">
            {/* Key points */}
            {chunk.key_points && chunk.key_points.length > 0 && (
              <div className="space-y-1.5">
                {chunk.key_points.map((pt, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 pop-in"
                    style={{ animationDelay: `${100 + i * 80}ms` }}
                  >
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-[10px] font-bold shrink-0 mt-0.5 shadow-sm">
                      {i + 1}
                    </span>
                    <TranslatableText
                      text={pt}
                      target="vi"
                      ragBase={ragBase}
                      className="text-sm text-slate-700 leading-snug flex-1"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Keywords */}
            {chunk.keywords && chunk.keywords.length > 0 && (
              <div className="pt-1 border-t border-slate-100 pop-in" style={{ animationDelay: '340ms' }}>
                <div className="flex items-center gap-1 mb-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {t('slide.vocabulary')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {chunk.keywords.map((kw, i) => (
                    <div
                      key={i}
                      className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5"
                    >
                      <span className="text-xs font-semibold text-amber-900">{kw.term}</span>
                      <span className="text-[10px] text-amber-700">→ {kw.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Example sentence */}
            {chunk.example && (
              <div className="pt-1 border-t border-slate-100 pop-in" style={{ animationDelay: '420ms' }}>
                <div className="flex items-center gap-1 mb-1">
                  <Quote className="w-3 h-3 text-indigo-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {t('slide.example')}
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50 border-l-2 border-indigo-400 px-3 py-2">
                  <TranslatableText
                    text={chunk.example}
                    target="vi"
                    ragBase={ragBase}
                    className="text-sm italic text-slate-700 leading-snug block"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spoken narration — keep below the slide */}
      <TranslatableText
        text={chunk.content}
        target="vi"
        ragBase={ragBase}
        audioProgress={active ? audioProgress : null}
        className={cn(
          'text-sm leading-relaxed block',
          active ? 'text-slate-700' : 'text-slate-500',
        )}
      />
    </div>
  );
}
