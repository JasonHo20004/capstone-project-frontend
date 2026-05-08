import type { Flashcard } from "@/domain";
import { Button } from '@/components/ui/button';
import { Edit, Trash2, BookOpen, MessageSquare, Volume2 } from 'lucide-react';
import { useCallback, useRef } from 'react';

interface CardListProps {
  cards: Flashcard[];
  onEditCard: (card: Flashcard) => void;
  onDeleteCard: (card: Flashcard) => void;
  readOnly?: boolean;
}

const CARD_COLORS = [
  'from-blue-500/8 to-indigo-500/4 hover:from-blue-500/12 hover:to-indigo-500/8 border-blue-200/60',
  'from-emerald-500/8 to-teal-500/4 hover:from-emerald-500/12 hover:to-teal-500/8 border-emerald-200/60',
  'from-amber-500/8 to-orange-500/4 hover:from-amber-500/12 hover:to-orange-500/8 border-amber-200/60',
  'from-rose-500/8 to-pink-500/4 hover:from-rose-500/12 hover:to-pink-500/8 border-rose-200/60',
  'from-cyan-500/8 to-sky-500/4 hover:from-cyan-500/12 hover:to-sky-500/8 border-cyan-200/60',
  'from-indigo-500/8 to-blue-500/4 hover:from-indigo-500/12 hover:to-blue-500/8 border-indigo-200/60',
];

const ACCENT_DOTS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500',
];

function AudioButton({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.play();
    } catch (err) {
      console.error('Audio playback error:', err);
    }
  }, [audioUrl]);

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 w-7 p-0 rounded-lg hover:bg-indigo-100/80 text-indigo-400 hover:text-indigo-600 transition-colors"
      onClick={handlePlay}
      title="Nghe phát âm"
    >
      <Volume2 className="w-3.5 h-3.5" />
    </Button>
  );
}

export function CardList({ cards, onEditCard, onDeleteCard, readOnly = false }: CardListProps) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {cards.map((card, i) => {
        const colorClass = CARD_COLORS[i % CARD_COLORS.length];
        const dotClass = ACCENT_DOTS[i % ACCENT_DOTS.length];

        return (
          <div
            key={card.id}
            className={`kahoot-slide-up group relative rounded-xl p-4 border bg-gradient-to-br ${colorClass}
              transition-all duration-300 hover:shadow-md hover:scale-[1.01]`}
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            {/* Accent dot */}
            <div className={`absolute top-3 left-3 w-2 h-2 rounded-full ${dotClass} opacity-60`} />

            <div className="flex items-start justify-between pl-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <span className="font-bold text-slate-800 truncate">{card.frontContent}</span>
                  {card.audioUrl && <AudioButton audioUrl={card.audioUrl} />}
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">{card.backContent}</p>
                {card.exampleSentence && (
                  <div className="flex items-start gap-1.5 mt-2 text-xs text-slate-400 italic">
                    <MessageSquare className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{card.exampleSentence}</span>
                  </div>
                )}
              </div>

              {!readOnly && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-lg hover:bg-indigo-100/80 text-slate-400 hover:text-indigo-600"
                    onClick={() => onEditCard(card)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-lg hover:bg-red-100/80 text-slate-400 hover:text-red-500"
                    onClick={() => onDeleteCard(card)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default CardList;