import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  motion, AnimatePresence, useMotionValue, useTransform, animate, useReducedMotion,
  type PanInfo,
} from 'framer-motion';
import type { Flashcard } from "@/domain";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Volume2, VolumeX, RotateCw, RotateCcw, Trophy, Zap, Star,
  X, Clock, AlertTriangle, Timer, Video, Flame, Target,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { useGetReviewQueue, useSubmitReview } from '@/hooks/api/use-flashcards';
import type { ReviewQuality } from '@/lib/api/services/user/flashcard/flashcard.service';
import { Celebration } from '@/components/ui/celebration';
import { sfx, isSfxMuted, setSfxMuted } from '@/lib/flashcard-sfx';

interface StudyModeProps {
  deckId: string;
  onClose: () => void;
}

type Grade = 'again' | 'hard' | 'good' | 'easy';

const gradeToQualityMap: Record<Grade, ReviewQuality> = {
  again: 1, hard: 3, good: 4, easy: 5,
};

const CONFETTI_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

// Shared Audio element — reused across plays to avoid leaking dozens of HTMLAudioElement
// instances on rapid clicks (low-end mobiles can OOM-crash otherwise).
let sharedAudio: HTMLAudioElement | null = null;

const speakWithBrowserTTS = (word: string) => {
  try {
    if (!('speechSynthesis' in window)) {
      console.warn('[Flashcard] Browser does not support speech synthesis');
      return;
    }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(word);
    utt.lang = 'en-US';
    utt.rate = 0.9;
    window.speechSynthesis.speak(utt);
  } catch (err) {
    console.warn('[Flashcard] TTS error:', err);
  }
};

const playAudio = (word: string, audioUrl?: string | null, e?: React.MouseEvent) => {
  if (e) e.stopPropagation();
  if (audioUrl) {
    try {
      if (!sharedAudio) sharedAudio = new Audio();
      sharedAudio.pause();
      sharedAudio.src = audioUrl;
      sharedAudio.currentTime = 0;
      void sharedAudio.play().catch((err) => {
        console.warn('[Flashcard] audio play failed, falling back to TTS:', err);
        speakWithBrowserTTS(word);
      });
      return;
    } catch (err) {
      console.warn('[Flashcard] audio init error, falling back to TTS:', err);
    }
  }
  speakWithBrowserTTS(word);
};

function spawnConfetti(container: HTMLElement, count = 24) {
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'kahoot-confetti-particle';
    particle.style.backgroundColor = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const leftPct = 20 + Math.random() * 60;
    particle.style.left = `${leftPct}%`;
    particle.style.top = `0`;
    particle.style.width = `${4 + Math.random() * 8}px`;
    particle.style.height = `${4 + Math.random() * 8}px`;

    const horizontalDir = leftPct < 50 ? -1 : 1;
    const tx = horizontalDir * (30 + Math.random() * 80);
    const ty = -(50 + Math.random() * 80);

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

// =============================================================================
// SwipeCard — draggable flip card with Tinder-style grade gestures + 3D tilt
// =============================================================================

interface SwipeCardHandle {
  fling: (grade: Grade) => void;
}

interface SwipeCardProps {
  card: Flashcard;
  showBack: boolean;
  reduced: boolean;
  t: TFunction;
  onFlip: () => void;
  onGrade: (grade: Grade) => void;
  renderStatusBadge: (type?: string) => React.ReactNode;
}

const FLING_TARGET: Record<Grade, { x: number; y: number }> = {
  again: { x: -700, y: 0 },
  good: { x: 700, y: 0 },
  easy: { x: 0, y: -700 },
  hard: { x: 0, y: 700 },
};

const FLING_SPRING = { type: 'spring' as const, stiffness: 260, damping: 28 };

const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(function SwipeCard(
  { card, showBack, reduced, t, onFlip, onGrade, renderStatusBadge }, ref
) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-15, 15]);
  // Hover-driven 3D parallax tilt (disabled while dragging / reduced motion)
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);

  // Swipe-direction overlay opacities
  const goodOp = useTransform(x, [30, 130], [0, 1]);
  const againOp = useTransform(x, [-30, -130], [0, 1]);
  const easyOp = useTransform(y, [-30, -130], [0, 1]);
  const hardOp = useTransform(y, [30, 130], [0, 1]);

  const flinging = useRef(false);
  const dragging = useRef(false);

  const flingTo = useCallback((g: Grade) => {
    if (flinging.current) return;
    flinging.current = true;
    const target = FLING_TARGET[g];
    if (target.x !== 0) {
      animate(y, 0, FLING_SPRING);
      animate(x, target.x, { ...FLING_SPRING, onComplete: () => onGrade(g) });
    } else {
      animate(x, 0, FLING_SPRING);
      animate(y, target.y, { ...FLING_SPRING, onComplete: () => onGrade(g) });
    }
  }, [onGrade, x, y]);

  useImperativeHandle(ref, () => ({ fling: flingTo }), [flingTo]);

  const onDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    dragging.current = false;
    const TH = 100;
    const V = 550;
    const { offset, velocity } = info;
    let g: Grade | null = null;
    if (offset.x > TH || velocity.x > V) g = 'good';
    else if (offset.x < -TH || velocity.x < -V) g = 'again';
    else if (offset.y < -TH || velocity.y < -V) g = 'easy';
    else if (offset.y > TH || velocity.y > V) g = 'hard';

    if (g) {
      flingTo(g);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 32 });
      animate(y, 0, { type: 'spring', stiffness: 500, damping: 32 });
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (reduced || dragging.current || flinging.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    tiltY.set(px * 9);
    tiltX.set(-py * 9);
  };

  const resetTilt = () => {
    animate(tiltX, 0, { duration: 0.3 });
    animate(tiltY, 0, { duration: 0.3 });
  };

  return (
    <motion.div
      className="relative w-full select-none"
      style={{ x, y, rotate, rotateX: tiltX, rotateY: tiltY, transformStyle: 'preserve-3d', cursor: reduced ? 'default' : 'grab' }}
      drag={!reduced}
      dragMomentum={false}
      dragElastic={0.7}
      whileTap={reduced ? undefined : { cursor: 'grabbing' }}
      onDragStart={() => { dragging.current = true; resetTilt(); }}
      onDragEnd={onDragEnd}
      onPointerMove={onPointerMove}
      onPointerLeave={resetTilt}
      onTap={() => { if (!flinging.current) onFlip(); }}
      initial={reduced ? false : { scale: 0.62, opacity: 0, y: 26 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 22 }}
    >
      {/* Swipe-direction badges (fade in with drag distance) */}
      {!reduced && (
        <>
          <motion.div className="swipe-badge" style={{ opacity: againOp, left: '1.25rem', right: 'auto', background: 'linear-gradient(90deg,#ef4444,#f43f5e)' }}>
            {t('flashcards.studyMode.grade.again')}
          </motion.div>
          <motion.div className="swipe-badge" style={{ opacity: goodOp, right: '1.25rem', left: 'auto', background: 'linear-gradient(90deg,#10b981,#22c55e)' }}>
            {t('flashcards.studyMode.grade.good')}
          </motion.div>
          <motion.div className="swipe-badge" style={{ opacity: easyOp, left: '50%', x: '-50%', background: 'linear-gradient(90deg,#3b82f6,#6366f1)' }}>
            {t('flashcards.studyMode.grade.easy')}
          </motion.div>
          <motion.div className="swipe-badge" style={{ opacity: hardOp, left: '50%', x: '-50%', top: 'auto', bottom: '1.25rem', background: 'linear-gradient(90deg,#f59e0b,#f97316)' }}>
            {t('flashcards.studyMode.grade.hard')}
          </motion.div>
        </>
      )}

      <div className="flip-card cursor-pointer">
        <div className={`flip-card-inner ${showBack ? 'flipped' : ''}`}>
          {/* FRONT */}
          <div className="flip-card-front relative overflow-hidden">
            {card.videoUrl && (
              <>
                <video
                  key={card.videoUrl}
                  autoPlay muted loop playsInline
                  className="absolute inset-0 w-full h-full object-cover opacity-40 rounded-[inherit]"
                  src={card.videoUrl}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/50 rounded-[inherit]" />
              </>
            )}

            <div className="absolute top-4 left-4 z-10">
              {renderStatusBadge(card.queueType)}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 rounded-full bg-white/10 hover:bg-white/20 text-white z-20 transition-all duration-200"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => playAudio(card.frontContent, card.audioUrl, e)}
              aria-label={t('flashcards.cardList.playAudioAria')}
            >
              <Volume2 className="w-5 h-5" aria-hidden="true" />
            </Button>

            <div className="flex flex-col items-center gap-4 relative z-10">
              <h2 className="text-3xl md:text-4xl font-black text-center break-words px-4 text-white drop-shadow-sm">
                {card.frontContent}
              </h2>
            </div>

            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-indigo-300/70 flex items-center gap-1.5 animate-pulse font-medium z-10 whitespace-nowrap pointer-events-none">
              <RotateCw className="w-3.5 h-3.5" /> {t('flashcards.studyMode.tapToFlip')}
            </p>

            {card.videoUrl && (
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
                {card.frontContent}
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-emerald-400 text-center drop-shadow-sm">
                {card.backContent}
              </h2>

              {card.exampleSentence && (
                <div className="mt-2 p-3 bg-white/5 backdrop-blur-sm rounded-xl text-base italic text-indigo-200/80 text-center border border-white/5">
                  "{card.exampleSentence}"
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// =============================================================================
// StudyMode
// =============================================================================

export default function StudyMode({ deckId, onClose }: StudyModeProps) {
  const { t } = useTranslation('exam');
  const reduced = useReducedMotion() ?? false;
  const { data: queueData, isLoading: isLoadingQueue } = useGetReviewQueue(deckId);
  const submitReviewMutation = useSubmitReview();

  // ── Session-local state (survives refetches) ──
  const [sessionQueue, setSessionQueue] = useState<Flashcard[]>([]);
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const sessionInitialized = useRef(false);
  const originalQueue = useRef<Flashcard[]>([]);
  const [locked, setLocked] = useState(false);

  // ── Gamification state ──
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [gradedCount, setGradedCount] = useState(0);
  const streakRef = useRef(0);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [flareKey, setFlareKey] = useState(0);
  const [muted, setMuted] = useState<boolean>(() => isSfxMuted());

  // ── Session Timer ──
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cardContainerRef = useRef<HTMLDivElement>(null);
  const feedbackBandRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<SwipeCardHandle>(null);

  // Snapshot queue ONCE at session start — never reset mid-session
  useEffect(() => {
    if (queueData && queueData.length > 0 && !sessionInitialized.current) {
      setSessionQueue(queueData);
      originalQueue.current = queueData;
      setIdx(0);
      setShowBack(false);
      sessionInitialized.current = true;
    }
  }, [queueData]);

  // Start timer when session initializes / restarts
  useEffect(() => {
    if (sessionInitialized.current && !timerRef.current) {
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [sessionQueue]);

  // Unlock interaction when a fresh card mounts
  useEffect(() => { setLocked(false); }, [idx]);

  const currentCard = sessionQueue[idx];
  const finished = !currentCard || idx >= sessionQueue.length;
  const remaining = sessionQueue.length - idx;

  const stats = useMemo(() => {
    const remainingCards = sessionQueue.slice(idx);
    return {
      new: remainingCards.filter((c) => c.queueType === 'NEW').length,
      learning: remainingCards.filter((c) => c.queueType === 'LEARNING').length,
      review: remainingCards.filter((c) => c.queueType === 'REVIEW').length,
    };
  }, [sessionQueue, idx]);

  const progressPercent = sessionQueue.length > 0 ? (idx / sessionQueue.length) * 100 : 0;

  const triggerMilestone = useCallback((n: number) => {
    sfx.streak(Math.floor(n / 5));
    if (reduced) return;
    setFlareKey((k) => k + 1);
    setMilestone(n);
    if (cardContainerRef.current) spawnConfetti(cardContainerRef.current, 40);
    window.setTimeout(() => setMilestone((m) => (m === n ? null : m)), 1300);
  }, [reduced]);

  // Apply scoring effects for a grade (no advance)
  const registerGrade = useCallback((g: Grade) => {
    if (!currentCard) return;
    submitReviewMutation.mutate({
      flashcardId: currentCard.id,
      deckId,
      data: { quality: gradeToQualityMap[g] },
    });

    setGradedCount((c) => c + 1);

    if (g === 'good' || g === 'easy') {
      const ns = streakRef.current + 1;
      streakRef.current = ns;
      setStreak(ns);
      setBestStreak((b) => Math.max(b, ns));
      setCorrectCount((c) => c + 1);
      if (ns > 0 && ns % 5 === 0) triggerMilestone(ns);
      if (g === 'easy') sfx.easy(); else sfx.good();
      setFeedbackText(g === 'easy' ? t('flashcards.studyMode.feedback.easy') : t('flashcards.studyMode.feedback.good'));
      if (!reduced && feedbackBandRef.current) spawnConfetti(feedbackBandRef.current);
    } else if (g === 'hard') {
      sfx.hard();
      setFeedbackText(t('flashcards.studyMode.feedback.hard'));
    } else {
      streakRef.current = 0;
      setStreak(0);
      sfx.again();
      setFeedbackText(t('flashcards.studyMode.feedback.again'));
      // Requeue forgotten card to the end of this session
      setSessionQueue((q) => [...q, { ...currentCard, queueType: 'LEARNING' as Flashcard['queueType'] }]);
    }
  }, [currentCard, deckId, submitReviewMutation, t, reduced, triggerMilestone]);

  const advance = useCallback(() => {
    setFeedbackText('');
    setShowBack(false);
    setIdx((i) => i + 1);
  }, []);

  // Called by SwipeCard once the fling animation completes (or directly on swipe)
  const onCardGrade = useCallback((g: Grade) => {
    registerGrade(g);
    advance();
  }, [registerGrade, advance]);

  // Buttons / keyboard entry point
  const grade = useCallback((g: Grade) => {
    if (locked || finished || submitReviewMutation.isPending) return;
    setLocked(true);
    if (reduced) {
      registerGrade(g);
      advance();
    } else {
      cardRef.current?.fling(g);
    }
  }, [locked, finished, submitReviewMutation.isPending, reduced, registerGrade, advance]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      setSfxMuted(next);
      if (!next) sfx.flip();
      return next;
    });
  }, []);

  const replay = useCallback(() => {
    setSessionQueue([...originalQueue.current]);
    setIdx(0);
    setShowBack(false);
    setFeedbackText('');
    streakRef.current = 0;
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setGradedCount(0);
    setElapsedSeconds(0);
    setLocked(false);
  }, []);

  const renderStatusBadge = useCallback((type?: string) => {
    const baseClass = 'text-xs font-bold px-3 py-1 rounded-full border-0 shadow-sm';
    switch (type) {
      case 'NEW': return <Badge className={`${baseClass} bg-blue-500/90 text-white`}><Zap className="w-3 h-3 mr-1" /> {t('flashcards.studyMode.status.new')}</Badge>;
      case 'LEARNING': return <Badge className={`${baseClass} bg-amber-500/90 text-white`}><RotateCw className="w-3 h-3 mr-1" /> {t('flashcards.studyMode.status.learning')}</Badge>;
      case 'REVIEW': return <Badge className={`${baseClass} bg-emerald-500/90 text-white`}><Star className="w-3 h-3 mr-1" /> {t('flashcards.studyMode.status.review')}</Badge>;
      default: return <Badge className={`${baseClass} bg-slate-500/90 text-white`}>{t('flashcards.studyMode.status.other')}</Badge>;
    }
  }, [t]);

  // Stop timer when finished
  useEffect(() => {
    if (finished && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [finished]);

  // Count-up animation for finish stats
  const [shownCount, setShownCount] = useState(0);
  useEffect(() => {
    if (!finished || gradedCount <= 0) { setShownCount(0); return; }
    const target = gradedCount;
    const start = performance.now();
    const dur = 700;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setShownCount(Math.round(p * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [finished, gradedCount]);

  // Keyboard shortcuts: Space = flip, 1-4 = grade (again/hard/good/easy)
  useEffect(() => {
    if (finished) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setShowBack((v) => { const nv = !v; if (nv) sfx.flip(); return nv; });
        return;
      }
      if (!showBack) return;
      const gradeKey: Record<string, Grade> = { '1': 'again', '2': 'hard', '3': 'good', '4': 'easy' };
      const g = gradeKey[e.key];
      if (g) {
        e.preventDefault();
        grade(g);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [finished, showBack, grade]);

  if (isLoadingQueue) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 animate-ping absolute inset-0" />
          <Loader2 className="w-16 h-16 animate-spin text-indigo-400 relative" />
        </div>
        <p className="text-indigo-300 font-medium animate-pulse">{t('flashcards.studyMode.loadingCards')}</p>
      </div>
    );
  }

  if (!isLoadingQueue && (!queueData || queueData.length === 0)) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 p-8 text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Star className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-white">{t('flashcards.studyMode.empty.title')}</h3>
        <p className="text-indigo-300 text-sm">{t('flashcards.studyMode.empty.subtitle')}</p>
        <button
          className="mx-auto flex items-center gap-2 h-12 px-8 rounded-xl font-bold text-white
            bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500
            shadow-xl shadow-indigo-500/30 transition-all duration-200 hover:scale-105 active:scale-95"
          onClick={onClose}
        >
          {t('flashcards.studyMode.close')}
        </button>
      </div>
    );
  }

  const accuracy = gradedCount > 0 ? Math.round((correctCount / gradedCount) * 100) : 100;
  const RING_C = 2 * Math.PI * 52;

  return (
    <div className="relative" ref={cardContainerRef}>
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 p-5 md:p-6 space-y-5 overflow-hidden relative">

        {/* Aurora ambient background */}
        <div className="study-aurora" aria-hidden="true" />

        {/* Streak-milestone flare */}
        {flareKey > 0 && <div key={flareKey} className="study-flare" aria-hidden="true" />}

        {/* Milestone banner */}
        <AnimatePresence>
          {milestone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="absolute top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-black text-lg shadow-2xl border-2 border-white/30"
              style={{ background: 'linear-gradient(90deg,#f59e0b,#ef4444)' }}
            >
              <Flame className="w-5 h-5" />
              {t('flashcards.studyMode.streakBanner', { count: milestone })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* HEADER */}
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              {t('flashcards.studyMode.studying')}
            </h3>

            <div className="flex items-center gap-2">
              {/* Streak chip */}
              {streak > 0 && (
                <div className="flex items-center gap-1.5 text-sm font-bold text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span key={streak} className="study-streak-pop inline-block">{streak}</span>
                </div>
              )}

              {/* Session timer */}
              <div className="flex items-center gap-1.5 text-sm font-mono font-semibold text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
                <Timer className="w-3.5 h-3.5 text-indigo-400" />
                {formatTime(elapsedSeconds)}
              </div>

              {/* Sound toggle */}
              <button
                onClick={toggleMute}
                className="flex items-center justify-center w-9 h-9 rounded-full text-slate-300 bg-slate-800/60 hover:bg-indigo-500/20 hover:text-indigo-300 border border-slate-700/50 transition-all duration-200"
                title={muted ? t('flashcards.studyMode.soundOff') : t('flashcards.studyMode.soundOn')}
                aria-label={muted ? t('flashcards.studyMode.soundOff') : t('flashcards.studyMode.soundOn')}
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Cancel session */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-800/60 hover:bg-red-500/20 hover:text-red-400 px-3 py-1.5 rounded-full border border-slate-700/50 hover:border-red-500/30 transition-all duration-200"
                    title={t('flashcards.studyMode.cancelTitle')}
                  >
                    <X className="w-3.5 h-3.5" />
                    {t('flashcards.studyMode.cancel')}
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-white">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      {t('flashcards.studyMode.cancelDialog.title')}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-400">
                      {t('flashcards.studyMode.cancelDialog.description')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">
                      {t('flashcards.studyMode.cancelDialog.keep')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white border-0"
                      onClick={onClose}
                    >
                      {t('flashcards.studyMode.cancelDialog.confirm')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Stats badges row */}
          <div className="flex gap-3 text-sm font-semibold">
            <span className="flex items-center gap-1 text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-full">
              {stats.new} {t('flashcards.studyMode.statsShort.new')}
            </span>
            <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full">
              {stats.learning} {t('flashcards.studyMode.statsShort.learning')}
            </span>
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
              {stats.review} {t('flashcards.studyMode.statsShort.review')}
            </span>
          </div>

          {/* Progress bar */}
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
            {t('flashcards.studyMode.progress', { current: idx, total: sessionQueue.length })}
          </p>
        </div>

        {!finished && currentCard ? (
          <div className="relative z-10 space-y-5">

            {/* === CARD STAGE (stacked deck + swipe) === */}
            <div className="relative" style={{ perspective: 1100 }}>
              {/* Peek cards behind */}
              {!reduced && remaining >= 3 && (
                <div className="study-peek" style={{ transform: 'scale(0.88) translateY(34px)', opacity: 0.5 }} />
              )}
              {!reduced && remaining >= 2 && (
                <div className="study-peek" style={{ transform: 'scale(0.94) translateY(17px)', opacity: 0.72 }} />
              )}

              <SwipeCard
                key={idx}
                ref={cardRef}
                card={currentCard}
                showBack={showBack}
                reduced={reduced}
                t={t}
                onFlip={() => setShowBack((v) => { const nv = !v; if (nv) sfx.flip(); return nv; })}
                onGrade={onCardGrade}
                renderStatusBadge={renderStatusBadge}
              />
            </div>

            {/* Feedback chip band */}
            <div ref={feedbackBandRef} className="relative h-0 z-30 pointer-events-none" aria-live="polite">
              {feedbackText && (
                <div
                  className="kahoot-feedback-chip absolute left-1/2 top-0 inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-white text-sm shadow-2xl whitespace-nowrap border border-white/20 backdrop-blur-sm"
                  style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
                >
                  <Star className="w-4 h-4" aria-hidden="true" />
                  {feedbackText}
                </div>
              )}
            </div>

            {/* Swipe hint */}
            {!reduced && (
              <p className="text-center text-xs text-slate-500 font-medium -mt-1">
                {t('flashcards.studyMode.swipeHint')}
              </p>
            )}

            {/* === GRADE BUTTONS — Kahoot 4-color grid with key chips === */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {([
                { g: 'again', key: '1', cls: 'from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-red-500/25', anim: 'kahoot-slide-up-1' },
                { g: 'hard', key: '2', cls: 'from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-500/25', anim: 'kahoot-slide-up-2' },
                { g: 'good', key: '3', cls: 'from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 shadow-blue-500/25', anim: 'kahoot-slide-up-3' },
                { g: 'easy', key: '4', cls: 'from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 shadow-emerald-500/25', anim: 'kahoot-slide-up-4' },
              ] as const).map(({ g, key, cls, anim }) => (
                <button
                  key={g}
                  className={`${anim} group relative h-16 rounded-xl font-bold text-white transition-all duration-200 overflow-hidden
                    bg-gradient-to-br ${cls} shadow-lg hover:scale-[1.03] active:scale-95
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100`}
                  onClick={() => grade(g)}
                  disabled={locked || submitReviewMutation.isPending}
                >
                  <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-md bg-black/25 text-[11px] font-black flex items-center justify-center border border-white/20">
                    {key}
                  </span>
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-200" />
                  <div className="relative flex flex-col items-center gap-0.5">
                    <span className="text-sm font-black tracking-wide">{t(`flashcards.studyMode.grade.${g}`)}</span>
                    <span className="text-[10px] font-medium opacity-80">{t(`flashcards.studyMode.gradeHint.${g}`)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // === FINISH SCREEN ===
          <div className="relative z-10 py-6 text-center space-y-6">
            <Celebration />
            <div className="kahoot-trophy mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-xl shadow-amber-500/30">
              <Trophy className="w-12 h-12 text-white" />
            </div>

            <div className="space-y-2 kahoot-score-pop" style={{ animationDelay: '0.3s' }}>
              <h3 className="text-3xl font-black text-white">{t('flashcards.studyMode.finish.title')}</h3>
              <p className="text-indigo-300 text-lg font-medium">
                {t('flashcards.studyMode.finish.subtitle', { count: gradedCount })}
              </p>
            </div>

            {/* Accuracy ring + stat tiles */}
            <div className="flex flex-wrap justify-center items-center gap-4 kahoot-score-pop" style={{ animationDelay: '0.5s' }}>
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="52" fill="none" stroke="url(#accGrad)" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={RING_C}
                    strokeDashoffset={RING_C * (1 - accuracy / 100)}
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                  />
                  <defs>
                    <linearGradient id="accGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white">{accuracy}%</span>
                  <span className="text-[10px] text-indigo-300 font-semibold flex items-center gap-1">
                    <Target className="w-3 h-3" /> {t('flashcards.studyMode.finish.accuracy')}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10 min-w-[140px]">
                  <p className="text-2xl font-black text-white">{shownCount}</p>
                  <p className="text-xs text-indigo-300 font-medium">{t('flashcards.studyMode.finish.cardsLearned')}</p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 flex-1">
                    <div className="flex items-center gap-1.5 justify-center">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <p className="text-xl font-black text-white">{bestStreak}</p>
                    </div>
                    <p className="text-[10px] text-indigo-300 font-medium">{t('flashcards.studyMode.finish.bestStreak')}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 flex-1">
                    <div className="flex items-center gap-1.5 justify-center">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <p className="text-xl font-black text-white">{formatTime(elapsedSeconds)}</p>
                    </div>
                    <p className="text-[10px] text-indigo-300 font-medium">{t('flashcards.studyMode.finish.duration')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3 kahoot-score-pop" style={{ animationDelay: '0.7s' }}>
              <button
                className="flex items-center gap-2 h-12 px-6 rounded-xl font-bold text-indigo-200 border border-indigo-400/30
                  bg-indigo-500/10 hover:bg-indigo-500/20 transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={replay}
              >
                <RotateCcw className="w-5 h-5" />
                {t('flashcards.studyMode.finish.replay')}
              </button>
              <button
                className="flex items-center gap-2 h-12 px-8 rounded-xl font-bold text-white
                  bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500
                  shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={onClose}
              >
                <Star className="w-5 h-5" />
                {t('flashcards.studyMode.finish.cta')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
