import { useEffect, useMemo, useState } from 'react';
import type { Flashcard } from '@/types/type';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Volume2, Check, RotateCw } from 'lucide-react'; // Thêm icon RotateCw
import { toast } from 'sonner';

import { useGetReviewQueue, useSubmitReview } from '@/hooks/api/use-flashcards';
import type { ReviewQuality } from '@/lib/api/services/flashcard.service';

interface StudyModeProps {
  deckId: string;
  onClose: () => void;
}

const gradeToQualityMap: Record<string, ReviewQuality> = {
  again: 1, hard: 3, good: 4, easy: 5,
};

const playAudio = (audioUrl: string, e?: React.MouseEvent) => {
  if (e) e.stopPropagation();
  try {
    const audio = new Audio(audioUrl);
    audio.play();
  } catch (err) {
    console.error(err);
  }
};

export default function StudyMode({ deckId, onClose }: StudyModeProps) {
  const { data: queueData, isLoading: isLoadingQueue } = useGetReviewQueue(deckId);
  const submitReviewMutation = useSubmitReview();

  const [sessionQueue, setSessionQueue] = useState<Flashcard[]>([]);
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    if (queueData) {
      setSessionQueue(queueData);
      setIdx(0);
      setShowBack(false);
    }
  }, [queueData]);

  const currentCard = sessionQueue[idx];

  const stats = useMemo(() => {
    const remainingCards = sessionQueue.slice(idx);
    return {
      new: remainingCards.filter(c => c.queueType === 'NEW').length,
      learning: remainingCards.filter(c => c.queueType === 'LEARNING').length,
      review: remainingCards.filter(c => c.queueType === 'REVIEW').length,
    };
  }, [sessionQueue, idx]);

  const onGrade = (grade: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard || submitReviewMutation.isPending) return;

    const quality = gradeToQualityMap[grade];
    if (!quality) return;

    submitReviewMutation.mutate({
      flashcardId: currentCard.id,
      deckId: deckId,
      data: { quality },
    });

    if (grade === 'again') {
      setSessionQueue((q) => [...q, { ...currentCard, queueType: 'LEARNING' as const }]);
    }

    // Quan trọng: Đợi 300ms để hiệu ứng lật về (nếu muốn) hoặc reset ngay
    setShowBack(false);
    setIdx((i) => i + 1);
  };

  const renderStatusBadge = (type?: string) => {
    switch (type) {
      case 'NEW': return <Badge className="bg-blue-500 hover:bg-blue-600 absolute top-4 left-4 z-10">Mới</Badge>;
      case 'LEARNING': return <Badge className="bg-orange-500 hover:bg-orange-600 absolute top-4 left-4 z-10">Đang học</Badge>;
      case 'REVIEW': return <Badge className="bg-green-500 hover:bg-green-600 absolute top-4 left-4 z-10">Ôn tập</Badge>;
      default: return <Badge variant="secondary" className="absolute top-4 left-4 z-10">Khác</Badge>;
    }
  };

  const finished = !currentCard || idx >= sessionQueue.length;

  if (isLoadingQueue) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* HEADER THỐNG KÊ */}
      <div className="flex flex-col gap-2 pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Đang học</h3>
          <div className="flex gap-3 text-sm font-medium">
            <span className="text-blue-600">{stats.new} Mới</span>
            <span className="text-orange-600">{stats.learning} Đang học</span>
            <span className="text-green-600">{stats.review} Ôn tập</span>
          </div>
        </div>
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(idx / sessionQueue.length) * 100}%` }}
          />
        </div>
      </div>

      {!finished && currentCard ? (
        <div className="space-y-6">
          
          {/* === KHUNG THẺ LẬT 3D === */}
          <div className="flip-card cursor-pointer group" onClick={() => setShowBack(!showBack)}>
            <div className={`flip-card-inner ${showBack ? 'flipped' : ''}`}>
              
              {/* --- MẶT TRƯỚC --- */}
              <div className="flip-card-front relative">
                {renderStatusBadge(currentCard.queueType)}
                
                {/* Icon loa mặt trước */}
                {currentCard.audioUrl && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-4 right-4 rounded-full hover:bg-primary/10 z-20" 
                    onClick={(e) => playAudio(currentCard.audioUrl!, e)}
                  >
                    <Volume2 className="w-6 h-6 text-primary" />
                  </Button>
                )}

                {/* Nội dung chính */}
                <div className="flex flex-col items-center gap-4">
                  <h2 className="text-3xl font-bold text-center break-words px-4">
                    {currentCard.frontContent}
                  </h2>
                  <p className="text-sm text-muted-foreground absolute bottom-4 flex items-center gap-1 animate-pulse">
                    <RotateCw className="w-3 h-3" /> Chạm để lật
                  </p>
                </div>
              </div>

              {/* --- MẶT SAU --- */}
              <div className="flip-card-back relative">
                {/* Nội dung mặt sau */}
                <div className="flex flex-col items-center gap-4 w-full px-4 overflow-y-auto max-h-full">
                  {/* Nhắc lại câu hỏi nhỏ ở trên */}
                  <div className="text-sm text-muted-foreground border-b pb-2 mb-2 w-full text-center">
                    {currentCard.frontContent}
                  </div>

                  <h2 className="text-2xl font-bold text-primary text-center">
                    {currentCard.backContent}
                  </h2>

                  {currentCard.exampleSentence && (
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg text-base italic text-muted-foreground text-center">
                      "{currentCard.exampleSentence}"
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* === NÚT ĐÁNH GIÁ (Chỉ hiện khi đã lật) === */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <Button variant="destructive" className="h-12 flex flex-col gap-0.5" onClick={() => onGrade('again')} disabled={submitReviewMutation.isPending}>
              <span className="font-bold">Quên</span>
              <span className="text-[10px] font-normal opacity-80">&lt; 1p</span>
            </Button>
            <Button variant="outline" className="h-12 flex flex-col gap-0.5 border-orange-200 text-orange-700 hover:bg-orange-50" onClick={() => onGrade('hard')} disabled={submitReviewMutation.isPending}>
              <span className="font-bold">Khó</span>
              <span className="text-[10px] font-normal opacity-80">~2d</span>
            </Button>
            <Button className="h-12 flex flex-col gap-0.5 bg-blue-600 hover:bg-blue-700" onClick={() => onGrade('good')} disabled={submitReviewMutation.isPending}>
              <span className="font-bold">Được</span>
              <span className="text-[10px] font-normal opacity-80">~4d</span>
            </Button>
            <Button className="h-12 flex flex-col gap-0.5 bg-green-600 hover:bg-green-700" onClick={() => onGrade('easy')} disabled={submitReviewMutation.isPending}>
              <span className="font-bold">Dễ</span>
              <span className="text-[10px] font-normal opacity-80">~7d</span>
            </Button>
          </div>

        </div>
      ) : (
        /* MÀN HÌNH KẾT THÚC */
        <div className="border border-border rounded-2xl p-12 text-center space-y-6 bg-card shadow-sm mt-8">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-300">
            <Check className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Hoàn thành xuất sắc!</h3>
            <p className="text-muted-foreground text-lg">
              Bạn đã hoàn thành tất cả thẻ cần học trong phiên này.
            </p>
          </div>
          <Button size="lg" className="bg-primary w-full max-w-xs text-lg" onClick={onClose}>
            Kết thúc bài học
          </Button>
        </div>
      )}
    </div>
  );
}