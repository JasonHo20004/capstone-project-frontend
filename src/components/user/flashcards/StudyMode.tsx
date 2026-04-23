import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Flashcard } from "@/domain";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Volume2, RotateCw, Trophy, Zap, Star,
  X, Clock, AlertTriangle, Timer, Video,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { useGetReviewQueue, useSubmitReview } from '@/hooks/api/use-flashcards';
import type { ReviewQuality } from '@/lib/api/services/user/flashcard/flashcard.service';

interface StudyModeProps {
  deckId: string;
  onClose: () => void;
}

const gradeToQualityMap: Record<string, ReviewQuality> = {
  again: 1, hard: 3, good: 4, easy: 5,
};

const CONFETTI_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

const playAudio = (word: string, audioUrl?: string | null, e?: React.MouseEvent) => {
  if (e) e.stopPropagation();
  if (audioUrl) {
    try {
      new Audio(audioUrl).play();
      return;
    } catch {
      // fall through to Web Speech API
    }
  }
  // Fallback: browser built-in TTS
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(word);
    utt.lang = 'en-US';
    utt.rate = 0.9;
    window.speechSynthesis.speak(utt);
  }
};

function spawnConfetti(container: HTMLElement) {
  for (let i = 0; i < 24; i++) {
    const particle = document.createElement('div');
    particle.className = 'kahoot-confetti-particle';
    particle.style.backgroundColor = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    particle.style.left = `${40 + Math.random() * 20}%`;
    particle.style.top = `${40 + Math.random() * 20}%`;
    particle.style.width = `${4 + Math.random() * 8}px`;
    particle.style.height = `${4 + Math.random() * 8}px`;
    particle.style.animationDuration = `${0.6 + Math.random() * 0.6}s`;
    particle.style.animationDelay = `${Math.random() * 0.2}s`;

    const angle = Math.random() * 360;
    const distance = 60 + Math.random() * 80;
    const tx = Math.cos(angle * Math.PI / 180) * distance;
    const ty = -Math.abs(Math.sin(angle * Math.PI / 180) * distance) - 20;
    particle.style.setProperty('--tx', `${tx}px`);
    particle.style.setProperty('--ty', `${ty}px`);
    particle.animate([
      { opacity: 1, transform: 'scale(1) rotate(0deg)' },
      { opacity: 0, transform: `translate(${tx}px, ${ty}px) scale(0) rotate(${360 + Math.random() * 360}deg)` },
    ], { duration: 800 + Math.random() * 400, easing: 'ease-out', fill: 'forwards' });

    container.appendChild(particle);
    setTimeout(() => particle.remove(), 1500);
  }
}

/** Format seconds into mm:ss */
function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function StudyMode({ deckId, onClose }: StudyModeProps) {
  const { data: queueData, isLoading: isLoadingQueue } = useGetReviewQueue(deckId);
  const submitReviewMutation = useSubmitReview();

  // ── Session-local state (survives refetches) ──
  const [sessionQueue, setSessionQueue] = useState<Flashcard[]>([]);
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [feedbackClass, setFeedbackClass] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [cardKey, setCardKey] = useState(0);
  const sessionInitialized = useRef(false);

  // ── Session Timer ──
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cardContainerRef = useRef<HTMLDivElement>(null);

  // Snapshot queue ONCE at session start — never reset mid-session
  useEffect(() => {
    if (queueData && queueData.length > 0 && !sessionInitialized.current) {
      setSessionQueue(queueData);
      setIdx(0);
      setShowBack(false);
      setCardKey(0);
      sessionInitialized.current = true;
    }
  }, [queueData]);

  // Start timer when session initializes
  useEffect(() => {
    if (sessionInitialized.current && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [sessionQueue]);

  const currentCard = sessionQueue[idx];

  const stats = useMemo(() => {
    const remainingCards = sessionQueue.slice(idx);
    return {
      new: remainingCards.filter(c => c.queueType === 'NEW').length,
      learning: remainingCards.filter(c => c.queueType === 'LEARNING').length,
      review: remainingCards.filter(c => c.queueType === 'REVIEW').length,
    };
  }, [sessionQueue, idx]);

  // Progress uses a smoothly-animated width derived from idx/total
  const progressPercent = sessionQueue.length > 0 ? (idx / sessionQueue.length) * 100 : 0;

  const onGrade = useCallback((grade: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard || submitReviewMutation.isPending) return;

    const quality = gradeToQualityMap[grade];
    if (!quality) return;

    submitReviewMutation.mutate({
      flashcardId: currentCard.id,
      deckId: deckId,
      data: { quality },
    });

    if (grade === 'again') {
      setSessionQueue((q) => [...q, { ...currentCard, queueType: 'LEARNING' as Flashcard['queueType'] }]);
    }

    // Visual feedback
    if (grade === 'again' || grade === 'hard') {
      setFeedbackClass('kahoot-shake');
      setFeedbackText(grade === 'again' ? '😤 Thử lại!' : '💪 Cố lên!');
    } else {
      setFeedbackClass('kahoot-glow-correct');
      setFeedbackText(grade === 'easy' ? '🔥 Tuyệt vời!' : '✨ Tốt lắm!');
      if (cardContainerRef.current) {
        spawnConfetti(cardContainerRef.current);
      }
    }

    setTimeout(() => {
      setFeedbackClass('');
      setFeedbackText('');
      setShowBack(false);
      setIdx((i) => i + 1);
      setCardKey((k) => k + 1);
    }, 600);
  }, [currentCard, submitReviewMutation, deckId]);

  const renderStatusBadge = (type?: string) => {
    const baseClass = 'text-xs font-bold px-3 py-1 rounded-full border-0 shadow-sm';
    switch (type) {
      case 'NEW': return <Badge className={`${baseClass} bg-blue-500/90 text-white`}><Zap className="w-3 h-3 mr-1" /> Mới</Badge>;
      case 'LEARNING': return <Badge className={`${baseClass} bg-amber-500/90 text-white`}><RotateCw className="w-3 h-3 mr-1" /> Đang học</Badge>;
      case 'REVIEW': return <Badge className={`${baseClass} bg-emerald-500/90 text-white`}><Star className="w-3 h-3 mr-1" /> Ôn tập</Badge>;
      default: return <Badge className={`${baseClass} bg-slate-500/90 text-white`}>Khác</Badge>;
    }
  };

  const finished = !currentCard || idx >= sessionQueue.length;

  // Stop timer when finished
  useEffect(() => {
    if (finished && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [finished]);

  if (isLoadingQueue) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 animate-ping absolute inset-0" />
          <Loader2 className="w-16 h-16 animate-spin text-indigo-400 relative" />
        </div>
        <p className="text-indigo-300 font-medium animate-pulse">Đang tải thẻ học...</p>
      </div>
    );
  }

  // No cards to review at all
  if (!isLoadingQueue && (!queueData || queueData.length === 0)) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 p-8 text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Star className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-white">Không có thẻ cần ôn tập!</h3>
        <p className="text-indigo-300 text-sm">Tất cả thẻ đã được ôn. Hẹn gặp lại vào phiên học tiếp theo 🎉</p>
        <button
          className="mx-auto flex items-center gap-2 h-12 px-8 rounded-xl font-bold text-white
            bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500
            shadow-xl shadow-indigo-500/30 transition-all duration-200 hover:scale-105 active:scale-95"
          onClick={onClose}
        >
          Đóng
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={cardContainerRef}>
      {/* Kahoot-style dark gradient wrapper */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 p-5 md:p-6 space-y-5 overflow-hidden relative">

        {/* Subtle geometric bg decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        {/* HEADER — Stats + Progress + Timer + Cancel */}
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Đang học
            </h3>

            <div className="flex items-center gap-2">
              {/* Session timer */}
              <div className="flex items-center gap-1.5 text-sm font-mono font-semibold text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
                <Timer className="w-3.5 h-3.5 text-indigo-400" />
                {formatTime(elapsedSeconds)}
              </div>

              {/* Cancel session button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-800/60 hover:bg-red-500/20 hover:text-red-400 px-3 py-1.5 rounded-full border border-slate-700/50 hover:border-red-500/30 transition-all duration-200"
                    title="Hủy phiên học"
                  >
                    <X className="w-3.5 h-3.5" />
                    Hủy
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-white">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      Hủy phiên học?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-400">
                      Tiến trình phiên học sẽ bị mất. Các thẻ đã chấm điểm sẽ được lưu lại,
                      nhưng các thẻ chưa ôn sẽ không được tính.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">
                      Tiếp tục học
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white border-0"
                      onClick={onClose}
                    >
                      Hủy phiên học
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Stats badges row */}
          <div className="flex gap-3 text-sm font-semibold">
            <span className="flex items-center gap-1 text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-full">
              {stats.new} Mới
            </span>
            <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full">
              {stats.learning} Học
            </span>
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
              {stats.review} Ôn
            </span>
          </div>

          {/* Progress bar — smooth CSS transition, no reset */}
          <div className="relative h-3 w-full bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
            <div
              className="h-full rounded-full relative"
              style={{
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)',
                transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
            </div>
          </div>
          <p className="text-xs text-slate-500 text-right font-medium">
            {idx} / {sessionQueue.length} thẻ
          </p>
        </div>

        {!finished && currentCard ? (
          <div className="relative z-10 space-y-5">

            {/* Floating feedback text — WHITE text for dark bg visibility */}
            {feedbackText && (
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
                <span className="kahoot-float-up text-4xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                  {feedbackText}
                </span>
              </div>
            )}

            {/* === FLIP CARD === */}
            <div
              key={cardKey}
              className={`flip-card cursor-pointer kahoot-bounce-in ${feedbackClass}`}
              onClick={() => setShowBack(!showBack)}
            >
              <div className={`flip-card-inner ${showBack ? 'flipped' : ''}`}>

                {/* FRONT */}
                <div className="flip-card-front relative overflow-hidden">
                  {/* Pexels video background */}
                  {currentCard.videoUrl && (
                    <>
                      <video
                        key={currentCard.videoUrl}
                        autoPlay muted loop playsInline
                        className="absolute inset-0 w-full h-full object-cover opacity-40 rounded-[inherit]"
                        src={currentCard.videoUrl}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/50 rounded-[inherit]" />
                    </>
                  )}

                  <div className="absolute top-4 left-4 z-10">
                    {renderStatusBadge(currentCard.queueType)}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 rounded-full bg-white/10 hover:bg-white/20 text-white z-20 transition-all duration-200"
                    onClick={(e) => playAudio(currentCard.frontContent, currentCard.audioUrl, e)}
                  >
                    <Volume2 className="w-5 h-5" />
                  </Button>

                  <div className="flex flex-col items-center gap-4 relative z-10">
                    <h2 className="text-3xl md:text-4xl font-black text-center break-words px-4 text-white drop-shadow-sm">
                      {currentCard.frontContent}
                    </h2>
                  </div>

                  {/* "Tap to flip" hint — direct child of flip-card-front so absolute bottom works */}
                  <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-indigo-300/70 flex items-center gap-1.5 animate-pulse font-medium z-10 whitespace-nowrap pointer-events-none">
                    <RotateCw className="w-3.5 h-3.5" /> Chạm để lật
                  </p>

                  {/* Pexels attribution badge */}
                  {currentCard.videoUrl && (
                    <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 text-[10px] text-white/35 font-medium pointer-events-none">
                      <Video className="w-3 h-3" />
                      Pexels
                    </div>
                  )}
                </div>

                {/* BACK */}
                <div className="flip-card-back relative">
                  <div className="flex flex-col items-center gap-4 w-full px-4 relative z-10">
                    <div className="text-sm text-indigo-300/60 border-b border-indigo-400/20 pb-2 mb-2 w-full text-center font-medium">
                      {currentCard.frontContent}
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black text-emerald-400 text-center drop-shadow-sm">
                      {currentCard.backContent}
                    </h2>

                    {currentCard.exampleSentence && (
                      <div className="mt-2 p-3 bg-white/5 backdrop-blur-sm rounded-xl text-base italic text-indigo-200/80 text-center border border-white/5">
                        "{currentCard.exampleSentence}"
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* === GRADE BUTTONS — Kahoot 4-color grid === */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* AGAIN — Red */}
              <button
                className="kahoot-slide-up-1 group relative h-16 md:h-14 rounded-xl font-bold text-white transition-all duration-200 overflow-hidden
                  bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500
                  shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.03] active:scale-95
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                onClick={() => onGrade('again')}
                disabled={submitReviewMutation.isPending}
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-200" />
                <div className="relative flex flex-col items-center gap-0.5">
                  <span className="text-sm font-black tracking-wide">Quên</span>
                  <span className="text-[10px] font-medium opacity-80">&lt; 1p</span>
                </div>
              </button>

              {/* HARD — Orange */}
              <button
                className="kahoot-slide-up-2 group relative h-16 md:h-14 rounded-xl font-bold text-white transition-all duration-200 overflow-hidden
                  bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400
                  shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.03] active:scale-95
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                onClick={() => onGrade('hard')}
                disabled={submitReviewMutation.isPending}
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-200" />
                <div className="relative flex flex-col items-center gap-0.5">
                  <span className="text-sm font-black tracking-wide">Khó</span>
                  <span className="text-[10px] font-medium opacity-80">~2 ngày</span>
                </div>
              </button>

              {/* GOOD — Blue */}
              <button
                className="kahoot-slide-up-3 group relative h-16 md:h-14 rounded-xl font-bold text-white transition-all duration-200 overflow-hidden
                  bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500
                  shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.03] active:scale-95
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                onClick={() => onGrade('good')}
                disabled={submitReviewMutation.isPending}
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-200" />
                <div className="relative flex flex-col items-center gap-0.5">
                  <span className="text-sm font-black tracking-wide">Được</span>
                  <span className="text-[10px] font-medium opacity-80">~4 ngày</span>
                </div>
              </button>

              {/* EASY — Green */}
              <button
                className="kahoot-slide-up-4 group relative h-16 md:h-14 rounded-xl font-bold text-white transition-all duration-200 overflow-hidden
                  bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500
                  shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.03] active:scale-95
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                onClick={() => onGrade('easy')}
                disabled={submitReviewMutation.isPending}
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-200" />
                <div className="relative flex flex-col items-center gap-0.5">
                  <span className="text-sm font-black tracking-wide">Dễ</span>
                  <span className="text-[10px] font-medium opacity-80">~7 ngày</span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* ===== CELEBRATION FINISH SCREEN ===== */
          <div className="relative z-10 py-8 text-center space-y-6">
            <div className="kahoot-trophy mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-xl shadow-amber-500/30">
              <Trophy className="w-12 h-12 text-white" />
            </div>

            <div className="space-y-2 kahoot-score-pop" style={{ animationDelay: '0.3s' }}>
              <h3 className="text-3xl font-black text-white">
                Hoàn thành xuất sắc! 🎉
              </h3>
              <p className="text-indigo-300 text-lg font-medium">
                Bạn đã hoàn thành tất cả {sessionQueue.length} thẻ trong phiên này.
              </p>
            </div>

            {/* Stats summary */}
            <div className="flex justify-center gap-4 kahoot-score-pop" style={{ animationDelay: '0.5s' }}>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10">
                <p className="text-2xl font-black text-white">{sessionQueue.length}</p>
                <p className="text-xs text-indigo-300 font-medium">Thẻ đã học</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10">
                <div className="flex items-center gap-1.5 justify-center">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <p className="text-2xl font-black text-white">{formatTime(elapsedSeconds)}</p>
                </div>
                <p className="text-xs text-indigo-300 font-medium">Thời gian</p>
              </div>
            </div>

            <button
              className="kahoot-score-pop mx-auto flex items-center gap-2 h-14 px-10 rounded-xl font-bold text-white text-lg
                bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500
                shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50
                transition-all duration-200 hover:scale-105 active:scale-95"
              style={{ animationDelay: '0.7s' }}
              onClick={onClose}
            >
              <Star className="w-5 h-5" />
              Kết thúc bài học
            </button>
          </div>
        )}
      </div>
    </div>
  );
}