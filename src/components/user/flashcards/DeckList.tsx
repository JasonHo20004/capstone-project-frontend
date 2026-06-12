import type { FlashcardDeck } from "@/domain";
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { TiltCard } from '@/components/ui/tilt-card';
import { Edit, Trash2, Layers, Globe, Lock } from 'lucide-react';

interface DeckListProps {
  decks: FlashcardDeck[];
  selectedDeckId: string | null;
  onSelectDeck: (id: string) => void;
  onEditDeck: (deck: FlashcardDeck) => void;
  onDeleteDeck: (deck: FlashcardDeck) => void;
  formatDate: (iso: string) => string;
}

const ACCENT_COLORS = [
  { from: 'from-blue-500', to: 'to-indigo-600', shadow: 'shadow-blue-500/20', text: 'text-blue-400', bg: 'bg-blue-500' },
  { from: 'from-emerald-500', to: 'to-teal-600', shadow: 'shadow-emerald-500/20', text: 'text-emerald-400', bg: 'bg-emerald-500' },
  { from: 'from-amber-500', to: 'to-orange-600', shadow: 'shadow-amber-500/20', text: 'text-amber-400', bg: 'bg-amber-500' },
  { from: 'from-rose-500', to: 'to-pink-600', shadow: 'shadow-rose-500/20', text: 'text-rose-400', bg: 'bg-rose-500' },
  { from: 'from-cyan-500', to: 'to-blue-600', shadow: 'shadow-cyan-500/20', text: 'text-cyan-400', bg: 'bg-cyan-500' },
];

export function DeckList({
  decks,
  selectedDeckId,
  onSelectDeck,
  onEditDeck,
  onDeleteDeck,
  formatDate,
}: DeckListProps) {
  const { t } = useTranslation('exam');
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {decks.map((deck, i) => {
        const isSelected = selectedDeckId === deck.id;
        const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];

        return (
          <TiltCard
            key={deck.id}
            maxTilt={8}
            onClick={() => onSelectDeck(deck.id)}
            className={`group relative rounded-2xl p-5 cursor-pointer transition-shadow duration-300 border overflow-hidden flex flex-col h-[180px]
              ${isSelected
                ? `bg-gradient-to-br ${accent.from}/10 ${accent.to}/5 border-indigo-500/40 shadow-lg ${accent.shadow}`
                : 'bg-white border-slate-200 hover:border-indigo-300/50 hover:shadow-xl'
              }`}
          >
            {/* Active indicator bar */}
            {isSelected && (
              <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${accent.from} ${accent.to} rounded-l-xl`} />
            )}

            <div className="flex flex-col h-full justify-between">
              <div className="flex-1 min-w-0 pl-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Layers className={`w-5 h-5 flex-shrink-0 ${isSelected ? accent.text : 'text-slate-400'} transition-colors`} />
                    <h3 className={`text-lg font-bold line-clamp-2 leading-tight transition-colors ${isSelected ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
                      {deck.title}
                    </h3>
                  </div>
                </div>

                {deck.description && (
                  <p className="text-sm text-slate-500 line-clamp-2 mt-2">{deck.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pl-1">
                <div className="flex flex-col gap-1">
                  <span className={`inline-flex items-center gap-1 w-fit text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    deck.isPublic
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {deck.isPublic ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                    {deck.isPublic ? t('flashcards.deckList.public') : t('flashcards.deckList.private')}
                  </span>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {formatDate(deck.createdAt)}
                  </p>
                </div>

              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-slate-100/80 text-slate-400 hover:text-indigo-600 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditDeck(deck);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-red-50/80 text-slate-400 hover:text-red-500 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteDeck(deck);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          </TiltCard>
        );
      })}
    </div>
  );
}

export default DeckList;