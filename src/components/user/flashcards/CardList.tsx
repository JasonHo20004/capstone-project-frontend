import type { Flashcard } from '@/types/type';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface CardListProps {
  cards: Flashcard[];
  onEditCard: (card: Flashcard) => void;
  onDeleteCard: (card: Flashcard) => void;
}

export function CardList({ cards, onEditCard, onDeleteCard }: CardListProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {cards.map((card) => (
        <div key={card.id} className="border rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold">{card.frontContent}</div>
              <div className="text-sm text-muted-foreground mt-1">{card.backContent}</div>
              {card.exampleSentence && (
                <div className="text-xs text-muted-foreground mt-2 italic">
                  {card.exampleSentence}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onEditCard(card)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="destructive" size="sm" onClick={() => onDeleteCard(card)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
export default CardList;