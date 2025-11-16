import { useEffect, useMemo, useState } from 'react';
import type { Flashcard } from '@/types/type';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockUserFlashcardProgress } from '@/data/mock';

type FlashcardProgress = {
  userId: string;
  flashcardId: string;
  status: 'LEARNING' | 'REVIEW';
  nextReviewAt: string; // ISO
  repetitions: number;
  learningStep: number;
  easeFactor: number; // SM-2 EF
  interval: number; // days
};

interface StudyModeProps {
  cards: Flashcard[];
  userId: string;
  onClose: () => void;
}

const STORAGE_KEY_PREFIX = 'skillboost_flashcard_progress_v1_';

function loadProgress(userId: string): Record<string, FlashcardProgress> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    const stored: Record<string, FlashcardProgress> = raw ? JSON.parse(raw) : {};
    // Seed from mock if empty
    if (!stored || Object.keys(stored).length === 0) {
      const seed = mockUserFlashcardProgress
        .filter((p) => p.userId === userId)
        .reduce((acc, p) => {
          acc[p.flashcardId] = { ...p } as FlashcardProgress;
          return acc;
        }, {} as Record<string, FlashcardProgress>);
      return seed;
    }
    return stored;
  } catch {
    return {};
  }
}

function saveProgress(userId: string, map: Record<string, FlashcardProgress>) {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(map));
  } catch {
    // ignore
  }
}

type Grade = 'again' | 'hard' | 'good' | 'easy';

function scheduleNext(now: Date, grade: Grade, prev?: FlashcardProgress): FlashcardProgress {
  const baseEF = prev?.easeFactor ?? 2.5;
  const baseRep = prev?.repetitions ?? 0;
  const baseInterval = prev?.interval ?? 0;

  let EF = baseEF;
  let repetitions = baseRep;
  let intervalDays = baseInterval;
  let status: FlashcardProgress['status'] = 'LEARNING';

  switch (grade) {
    case 'again':
      EF = Math.max(1.3, EF - 0.2);
      repetitions = 0;
      intervalDays = 0; // review soon
      status = 'LEARNING';
      break;
    case 'hard':
      EF = Math.max(1.3, EF - 0.15);
      repetitions = baseRep + 1;
      intervalDays = Math.max(1, Math.round((baseInterval || 1))); // 1 day
      status = 'REVIEW';
      break;
    case 'good':
      EF = Math.max(1.3, EF);
      repetitions = baseRep + 1;
      intervalDays = baseInterval > 0 ? Math.round(baseInterval * EF) : 2; // 2 days
      status = 'REVIEW';
      break;
    case 'easy':
      EF = EF + 0.1;
      repetitions = baseRep + 1;
      intervalDays = baseInterval > 0 ? Math.round(baseInterval * EF) : 4; // 4 days
      status = 'REVIEW';
      break;
  }

  const nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000).toISOString();
  return {
    userId: prev?.userId ?? '',
    flashcardId: prev?.flashcardId ?? '',
    status,
    nextReviewAt,
    repetitions,
    learningStep: (prev?.learningStep ?? 0) + 1,
    easeFactor: EF,
    interval: intervalDays,
  };
}

export default function StudyMode({ cards, userId, onClose }: StudyModeProps) {
  const [progressMap, setProgressMap] = useState<Record<string, FlashcardProgress>>(() => loadProgress(userId));
  const now = useMemo(() => new Date(), []);

  const dueCards = useMemo(() => {
    const list = cards.filter((c) => {
      const p = progressMap[c.id];
      if (!p) return true; // new card
      return new Date(p.nextReviewAt) <= now;
    });
    return list;
  }, [cards, progressMap, now]);

  const [queue, setQueue] = useState<Flashcard[]>(dueCards);
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    setQueue(dueCards);
    setIdx(0);
    setShowBack(false);
  }, [dueCards]);

  useEffect(() => {
    saveProgress(userId, progressMap);
  }, [userId, progressMap]);

  const current = queue[idx];
  const total = queue.length;

  const onGrade = (grade: Grade) => {
    if (!current) return;
    const prev = progressMap[current.id] ?? {
      userId,
      flashcardId: current.id,
      status: 'LEARNING',
      nextReviewAt: now.toISOString(),
      repetitions: 0,
      learningStep: 0,
      easeFactor: 2.5,
      interval: 0,
    };
    const next = scheduleNext(new Date(), grade, prev);
    setProgressMap((pm) => ({ ...pm, [current.id]: next }));

    // For 'again', re-queue the card at the end; otherwise move forward
    if (grade === 'again') {
      setQueue((q) => {
        const copy = [...q];
        copy.push(current);
        return copy;
      });
    }

    setShowBack(false);
    setIdx((i) => (i + 1 < total ? i + 1 : i + 1));
  };

  const finished = idx >= total || total === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Chế độ học flashcard</h3>
          <p className="text-sm text-muted-foreground">
            {finished ? 'Đã hoàn thành phiên học' : `Thẻ ${idx + 1} / ${total}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Đến hạn: {dueCards.length}</Badge>
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </div>
      </div>

      {!finished && current ? (
        <div className="border border-border rounded-2xl p-6">
          <div className="min-h-[160px]">
            {!showBack ? (
              <div>
                <div className="text-2xl font-bold">{current.frontContent}</div>
                {current.audioUrl && (
                  <audio controls className="mt-3 w-full">
                    <source src={current.audioUrl} />
                  </audio>
                )}
              </div>
            ) : (
              <div>
                <div className="text-lg font-medium">{current.backContent}</div>
                {current.exampleSentence && (
                  <p className="text-sm text-muted-foreground mt-2 italic">{current.exampleSentence}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowBack((s) => !s)}>
              {showBack ? 'Xem mặt trước' : 'Lật thẻ'}
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="destructive" onClick={() => onGrade('again')}>Chưa nhớ</Button>
              <Button variant="outline" onClick={() => onGrade('hard')}>Khó</Button>
              <Button className="bg-primary" onClick={() => onGrade('good')}>Tốt</Button>
              <Button className="bg-secondary text-secondary-foreground" onClick={() => onGrade('easy')}>Dễ</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-2xl p-6 text-center">
          <p className="text-muted-foreground">Không có thẻ đến hạn hoặc bạn đã hoàn thành phiên học.</p>
          <div className="mt-4">
            <Button className="bg-primary" onClick={onClose}>Đóng</Button>
          </div>
        </div>
      )}
    </div>
  );
}