import type { FlashcardDeck } from '@/types/type';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface DeckListProps {
  decks: FlashcardDeck[];
  selectedDeckId: string | null;
  onSelectDeck: (id: string) => void;
  onEditDeck: (deck: FlashcardDeck) => void;
  onDeleteDeck: (deck: FlashcardDeck) => void;
  formatDate: (iso: string) => string;
}

export function DeckList({
  decks,
  selectedDeckId,
  onSelectDeck,
  onEditDeck,
  onDeleteDeck,
  formatDate,
}: DeckListProps) {
  return (
    <div className="space-y-3">
      {decks.map((deck) => (
        <div
          key={deck.id}
          className={`border rounded-xl p-4 flex items-start justify-between hover:shadow-sm transition cursor-pointer ${
            selectedDeckId === deck.id ? 'border-primary' : 'border-border'
          }`}
          onClick={() => onSelectDeck(deck.id)}
        >
          <div className="pr-4">
            <div>
              <h3 className="text-lg font-semibold">{deck.title}</h3>
              <span
                className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full ${
                  deck.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {deck.isPublic ? 'Công khai' : 'Riêng tư'}
              </span>
            </div>
            {deck.description && (
              <p className="text-sm text-muted-foreground mt-1">{deck.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Tạo ngày: {formatDate(deck.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEditDeck(deck);
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteDeck(deck);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
export default DeckList;