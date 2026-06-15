import type { Flashcard } from "@/domain";
import { FlashcardStatus } from "@/domain/enums";
import { Button } from '@/components/ui/button';
import {
  Edit,
  Trash2,
  MessageSquare,
  Volume2,
  Sparkles,
  GraduationCap,
  RefreshCw,
  Repeat,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardListProps {
  cards: Flashcard[];
  onEditCard: (card: Flashcard) => void;
  onDeleteCard: (card: Flashcard) => void;
  readOnly?: boolean;
}

/** Per-card colour theme — front is a vibrant gradient, back stays clean white with matching accents. */
const THEMES = [
  { front: 'from-primary via-primary-light to-primary', glow: 'group-hover:shadow-primary/40', accent: 'text-primary', chip: 'bg-primary/10 text-primary', edge: 'before:bg-primary' },
  { front: 'from-emerald-500 via-teal-500 to-emerald-600', glow: 'group-hover:shadow-emerald-500/40', accent: 'text-emerald-600', chip: 'bg-emerald-100 text-emerald-700', edge: 'before:bg-emerald-500' },
  { front: 'from-secondary via-secondary-light to-secondary', glow: 'group-hover:shadow-secondary/40', accent: 'text-secondary', chip: 'bg-secondary/10 text-secondary-foreground', edge: 'before:bg-secondary' },
  { front: 'from-rose-500 via-pink-500 to-rose-600', glow: 'group-hover:shadow-rose-500/40', accent: 'text-rose-600', chip: 'bg-rose-100 text-rose-700', edge: 'before:bg-rose-500' },
  { front: 'from-primary-dark via-primary to-primary-dark', glow: 'group-hover:shadow-primary/40', accent: 'text-primary-dark', chip: 'bg-primary/10 text-primary-dark', edge: 'before:bg-primary-dark' },
];

const STATUS_ICON: Record<FlashcardStatus, typeof Sparkles> = {
  [FlashcardStatus.NEW]: Sparkles,
  [FlashcardStatus.LEARNING]: GraduationCap,
  [FlashcardStatus.REVIEW]: RefreshCw,
};

function AudioButton({ audioUrl, onColor = false }: { audioUrl: string; onColor?: boolean }) {
  const { t } = useTranslation('exam');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.pause();
      audioRef.current.src = audioUrl;
      audioRef.current.currentTime = 0;
      void audioRef.current.play().catch((err) => {
        console.warn('Audio playback failed:', err);
      });
    } catch (err) {
      console.error('Audio playback error:', err);
    }
  }, [audioUrl]);

  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 active:scale-90',
        onColor
          ? 'bg-white/20 text-white hover:bg-white/35 backdrop-blur-sm'
          : 'text-primary/70 hover:bg-primary/10 hover:text-primary',
      )}
      onClick={handlePlay}
      title={t('flashcards.cardList.playAudioTitle')}
      aria-label={t('flashcards.cardList.playAudioAria')}
    >
      <Volume2 className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

function FlipCard({
  card,
  index,
  theme,
  readOnly,
  reduceMotion,
  onEditCard,
  onDeleteCard,
}: {
  card: Flashcard;
  index: number;
  theme: (typeof THEMES)[number];
  readOnly: boolean;
  reduceMotion: boolean;
  onEditCard: (card: Flashcard) => void;
  onDeleteCard: (card: Flashcard) => void;
}) {
  const { t } = useTranslation('flashcards');
  const [flipped, setFlipped] = useState(false);

  const status = card.queueType;
  const StatusIcon = status ? STATUS_ICON[status] : null;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: reduceMotion ? 0 : index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="group [perspective:1400px]"
    >
      <div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={card.frontContent}
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setFlipped((f) => !f);
          }
        }}
        className={cn(
          'relative h-[188px] w-full cursor-pointer rounded-2xl outline-none [transform-style:preserve-3d]',
          'transition-transform [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          reduceMotion ? '[transition-duration:0ms]' : '[transition-duration:600ms]',
        )}
        style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* ── FRONT ──────────────────────────────────────────── */}
        <div
          className={cn(
            'absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg [backface-visibility:hidden] [-webkit-backface-visibility:hidden]',
            'shadow-slate-900/10 transition-shadow duration-300',
            theme.front,
            theme.glow,
          )}
        >
          {/* decorative bloom */}
          <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-black/10 blur-2xl" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white/20 px-2 text-xs font-black tabular-nums backdrop-blur-sm">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-1.5">
              {StatusIcon && (
                <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm">
                  <StatusIcon className="h-3 w-3" aria-hidden="true" />
                  {t(`cardList.status.${status}`)}
                </span>
              )}
              {card.audioUrl && <AudioButton audioUrl={card.audioUrl} onColor />}
            </div>
          </div>

          <div className="relative z-10">
            <p className="line-clamp-2 text-2xl font-black leading-tight tracking-tight drop-shadow-sm">
              {card.frontContent}
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-1.5 text-[11px] font-semibold text-white/70">
            <Repeat className="h-3 w-3" aria-hidden="true" />
            {t('cardList.flipHint')}
          </div>
        </div>

        {/* ── BACK ───────────────────────────────────────────── */}
        <div
          className={cn(
            'absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-lowest p-5 shadow-lg [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)]',
            // coloured left edge accent
            "before:absolute before:inset-y-0 before:left-0 before:w-1.5",
            theme.edge,
          )}
        >
          <div className="flex items-center justify-between pl-2">
            <span className={cn('text-[11px] font-black uppercase tracking-wider', theme.accent)}>
              {t('cardList.meaning')}
            </span>
            {card.audioUrl && <AudioButton audioUrl={card.audioUrl} />}
          </div>

          <p className="mt-1 flex-1 overflow-hidden pl-2 text-[15px] font-semibold leading-snug text-foreground line-clamp-3">
            {card.backContent}
          </p>

          {card.exampleSentence && (
            <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-surface-low p-2 pl-2.5 text-xs italic text-muted-foreground">
              <MessageSquare className="mt-0.5 h-3 w-3 flex-shrink-0" aria-hidden="true" />
              <span className="line-clamp-2">{card.exampleSentence}</span>
            </div>
          )}

          {!readOnly && (
            <div className="mt-2 flex items-center justify-end gap-1 pl-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted-foreground hover:bg-primary/5 hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCard(card);
                }}
              >
                <Edit className="h-3.5 w-3.5" /> {t('cardList.edit')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-lg p-0 text-muted-foreground hover:bg-red-50 hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCard(card);
                }}
                aria-label={t('cardList.delete')}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function CardList({ cards, onEditCard, onDeleteCard, readOnly = false }: CardListProps) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card, i) => (
        <FlipCard
          key={card.id}
          card={card}
          index={i}
          theme={THEMES[i % THEMES.length]}
          readOnly={readOnly}
          reduceMotion={reduceMotion}
          onEditCard={onEditCard}
          onDeleteCard={onDeleteCard}
        />
      ))}
    </div>
  );
}
export default CardList;
