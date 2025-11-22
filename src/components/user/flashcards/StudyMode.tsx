import { useEffect, useMemo, useState } from 'react';
import type { Flashcard } from '@/types/type';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

import { useGetReviewQueue, useSubmitReview } from '@/hooks/api/use-flashcards';
import type { ReviewQuality } from '@/lib/api/services/flashcard.service';
interface StudyModeProps {
  //cards: Flashcard[]; 
  deckId: string;
  onClose: () => void;
}
const gradeToQualityMap: Record<string, ReviewQuality> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
};
const playAudio = (audioUrl: string, e?: React.MouseEvent) => {
  if (e) e.stopPropagation(); // Ngăn việc bấm vào icon làm lật thẻ
  try {
    const audio = new Audio(audioUrl);
    audio.play();
  } catch (err) {
    console.error('Không thể phát audio:', err);
    toast.error('Không thể phát file audio.');
  }
};

export default function StudyMode({  deckId, onClose }: StudyModeProps) {
  // BỎ: const now = useMemo(...)

  // MỚI: Fetch hàng đợi (queue) từ server
  const { data: queueData, isLoading: isLoadingQueue } = useGetReviewQueue(deckId);
  
  // MỚI: Mutation để gửi kết quả
  const submitReviewMutation = useSubmitReview();

  // BỎ: useMemo cho progressMap
  // BỎ: useMemo cho dueCards (vì queueData chính là dueCards)

  // State Quản lý phiên học (Session)
  // Chúng ta dùng `queueData` làm danh sách ban đầu,
  // nhưng dùng `sessionQueue` để quản lý việc "học lại" (again)
  const [sessionQueue, setSessionQueue] = useState<Flashcard[]>([]);
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);

  // Load queue từ API vào state của session
  useEffect(() => {
    if (queueData) {
      setSessionQueue(queueData);
      setIdx(0); // Reset
      setShowBack(false);
    }
  }, [queueData]);

  const currentCard = sessionQueue[idx];
  const totalInSession = sessionQueue.length; // Tổng số thẻ trong phiên này
  const totalInQueue = queueData?.length ?? 0; // Tổng số thẻ ban đầu từ API

  const onGrade = (grade: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard || submitReviewMutation.isPending) return;

    const quality = gradeToQualityMap[grade];
    if (!quality) return;

    // 1. Gửi kết quả lên server (chạy ngầm)
   submitReviewMutation.mutate({
      flashcardId: currentCard.id,
      deckId: deckId, // 👈 THÊM DÒNG NÀY
      data: { quality },
    });
    // 2. Quản lý UI của session (Optimistic Update)
    // Nếu "again", xếp lại thẻ vào cuối hàng đợi của *phiên này*
    if (grade === 'again') {
      setSessionQueue((q) => {
        const copy = [...q];
        copy.push(currentCard); // Thêm lại vào cuối
        return copy;
      });
    }

    // 3. Chuyển thẻ tiếp theo
    setShowBack(false); // Tự động lật về mặt trước
    setIdx((i) => i + 1); // Luôn di chuyển tới (vì thẻ "again" đã ở cuối)
  };

  // SỬA: finished là khi `idx` vượt qua độ dài của `sessionQueue`
  const finished = !currentCard || idx >= sessionQueue.length;

  if (isLoadingQueue) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="ml-3">Đang chuẩn bị thẻ học...</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Chế độ học flashcard</h3>
          <p className="text-sm text-muted-foreground">
            {finished ? "Đã hoàn thành phiên học" : `Thẻ${Math.min(idx + 1, totalInSession)} / ${totalInSession}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Đến hạn: {totalInQueue}</Badge>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>

      {!finished && currentCard ? (
        <div className="border border-border rounded-2xl p-6">
          <div className="min-h-[160px] cursor-pointer"
          onClick={() => setShowBack((s) => !s)}>
            {!showBack ? (
              <div>
                <div className="text-2xl font-bold">{currentCard.frontContent}</div>
                {currentCard.audioUrl && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => playAudio(currentCard.audioUrl!, e)}
                  >
                    <Volume2 className="w-5 h-5" />
                  </Button>
                )}
              </div>
            ) : (
              <div>
                <div className="text-lg font-medium">{currentCard.backContent}</div>
                {currentCard.exampleSentence && (
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    {currentCard.exampleSentence}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-6">
            
            <div className="ml-auto flex items-center gap-2">
              <Button variant="destructive" onClick={() => onGrade("again")}>
                Chưa nhớ
              </Button>
              <Button variant="outline" onClick={() => onGrade("hard")}>
                Khó
              </Button>
              <Button className="bg-primary" onClick={() => onGrade("good")}>
                Tốt
              </Button>
              <Button
                className="bg-secondary text-secondary-foreground"
                onClick={() => onGrade("easy")}
              >
                Dễ
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-2xl p-6 text-center">
          <p className="text-muted-foreground">
            Không có thẻ đến hạn hoặc bạn đã hoàn thành phiên học.
          </p>
          <div className="mt-4">
            <Button className="bg-primary" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
