import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Zap, Users, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types (shared with LiveRoom) ──────────────────────────────────────────────

export interface QuizResult {
  counts: number[];
  totalAnswered: number;
  correctIndex: number;
  explanation: string;
}

export interface ActiveQuiz {
  id: number;
  ordinal: number;
  total: number;
  question: string;
  options: string[];
  durationSeconds: number;
  /** Epoch ms when the answer window closes. */
  deadline: number;
  myAnswer: number | null;
  /** Live count of participants who have answered so far. */
  answered: number;
  result: QuizResult | null;
}

interface Props {
  quiz: ActiveQuiz;
  /** Personal running score across this lesson's checkpoints. */
  score: { correct: number; total: number };
  onAnswer: (quizId: number, optionIndex: number) => void;
}

// Kahoot-style fixed palette: one colour + shape per option slot, so answers
// are identifiable at a glance even before reading the text.
const OPTION_STYLES = [
  { btn: 'bg-rose-500 hover:bg-rose-600',       chip: 'bg-rose-500',    bar: 'bg-rose-400',    shape: '▲' },
  { btn: 'bg-sky-500 hover:bg-sky-600',         chip: 'bg-sky-500',     bar: 'bg-sky-400',     shape: '◆' },
  { btn: 'bg-amber-500 hover:bg-amber-600',     chip: 'bg-amber-500',   bar: 'bg-amber-400',   shape: '●' },
  { btn: 'bg-emerald-500 hover:bg-emerald-600', chip: 'bg-emerald-500', bar: 'bg-emerald-400', shape: '■' },
] as const;

const CONFETTI_PIECES = ['🎉', '✨', '⭐', '🎊', '🎈'] as const;

/**
 * Full-stage overlay for a live comprehension checkpoint: a timed multiple-
 * choice poll everyone in the room answers simultaneously, followed by a live
 * bar chart of the room's votes and the AI's explanation.
 */
export function QuizOverlay({ quiz, score, onAnswer }: Props) {
  const { t } = useTranslation('livestream');
  const [secsLeft, setSecsLeft] = useState(quiz.durationSeconds);

  const reduceMotion = useMemo(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    [],
  );

  // Countdown driven by the server deadline (not a local decrement) so a
  // re-render or tab switch can't drift the timer.
  useEffect(() => {
    if (quiz.result) return;
    const tick = () => setSecsLeft(Math.max(0, Math.ceil((quiz.deadline - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [quiz.deadline, quiz.result]);

  const timeUp = secsLeft <= 0;
  const locked = quiz.myAnswer !== null;
  const result = quiz.result;
  const iWasRight = result !== null && quiz.myAnswer === result.correctIndex;
  const maxCount = result ? Math.max(1, ...result.counts) : 1;
  const timePct = Math.max(0, Math.min(100, (secsLeft / quiz.durationSeconds) * 100));

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Confetti burst on a correct answer (skipped for reduced motion) */}
      {result && iWasRight && !reduceMotion && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-xl"
              style={{
                left: `${6 + (i * 89) % 90}%`,
                top: '-8%',
                animation: `quiz-confetti ${1.6 + (i % 5) * 0.25}s ease-in ${(i % 7) * 0.12}s forwards`,
              }}
            >
              {CONFETTI_PIECES[i % CONFETTI_PIECES.length]}
            </span>
          ))}
        </div>
      )}

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* ── Header: badge + live answered count + personal score ── */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
          <Zap className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wide">
            {t('room.quiz.badge', { ordinal: quiz.ordinal, total: quiz.total })}
          </span>
          <span className="ml-auto flex items-center gap-1 text-xs font-medium bg-white/15 px-2 py-0.5 rounded-full">
            <Users className="w-3 h-3" />
            {t('room.quiz.answered', { count: result ? result.totalAnswered : quiz.answered })}
          </span>
          {score.total > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold bg-white/15 px-2 py-0.5 rounded-full">
              <Trophy className="w-3 h-3" />
              {t('room.quiz.score', { correct: score.correct, total: score.total })}
            </span>
          )}
        </div>

        {/* ── Countdown bar (answer phase only) ── */}
        {!result && (
          <div className="relative h-1.5 bg-slate-100">
            <div
              className={cn(
                'absolute inset-y-0 left-0 rounded-r-full',
                secsLeft <= 5 ? 'bg-rose-500' : 'bg-indigo-500',
                !reduceMotion && 'transition-[width] duration-300 ease-linear',
              )}
              style={{ width: `${timePct}%` }}
            />
          </div>
        )}

        <div className="p-4 space-y-3">
          {/* Question + timer */}
          <div className="flex items-start gap-3">
            <p className="flex-1 text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {quiz.question}
            </p>
            {!result && (
              <span
                className={cn(
                  'shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold tabular-nums border-2',
                  secsLeft <= 5
                    ? cn('border-rose-400 text-rose-600 bg-rose-50', !reduceMotion && 'animate-pulse')
                    : 'border-indigo-300 text-indigo-700 bg-indigo-50',
                )}
                aria-label={t('room.quiz.timeLeft', { secs: secsLeft })}
              >
                {secsLeft}
              </span>
            )}
          </div>

          {/* ── Answer phase: tappable options ── */}
          {!result && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quiz.options.map((opt, i) => {
                  const style = OPTION_STYLES[i % OPTION_STYLES.length];
                  const mine = quiz.myAnswer === i;
                  return (
                    <button
                      key={i}
                      onClick={() => onAnswer(quiz.id, i)}
                      disabled={locked || timeUp}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-3 rounded-xl text-left text-sm font-semibold text-white shadow-sm transition-all',
                        style.btn,
                        mine && 'ring-4 ring-slate-900/30 scale-[0.98]',
                        locked && !mine && 'opacity-35',
                        !locked && !timeUp && 'active:scale-95',
                        timeUp && !locked && 'opacity-50 cursor-not-allowed',
                      )}
                    >
                      <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-xs shrink-0" aria-hidden>
                        {style.shape}
                      </span>
                      <span className="leading-tight">{opt}</span>
                      {mine && <Check className="w-4 h-4 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-center text-slate-500 font-medium" aria-live="polite">
                {locked
                  ? t('room.quiz.lockedIn')
                  : timeUp
                    ? t('room.quiz.closing')
                    : t('room.quiz.pickOne')}
              </p>
            </>
          )}

          {/* ── Result phase: verdict + live bar chart + explanation ── */}
          {result && (
            <>
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold',
                  quiz.myAnswer === null
                    ? 'bg-slate-100 text-slate-600'
                    : iWasRight
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200',
                )}
                role="status"
              >
                {quiz.myAnswer === null ? (
                  <span>{t('room.quiz.noAnswer')}</span>
                ) : iWasRight ? (
                  <><Check className="w-4 h-4 shrink-0" /> {t('room.quiz.correct')}</>
                ) : (
                  <><X className="w-4 h-4 shrink-0" /> {t('room.quiz.incorrect')}</>
                )}
              </div>

              <div className="space-y-1.5">
                {quiz.options.map((opt, i) => {
                  const style = OPTION_STYLES[i % OPTION_STYLES.length];
                  const count = result.counts[i] ?? 0;
                  const isCorrect = i === result.correctIndex;
                  const mine = quiz.myAnswer === i;
                  return (
                    <div key={i} className={cn('rounded-lg p-1.5', isCorrect && 'bg-emerald-50 ring-1 ring-emerald-300')}>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-1">
                        <span className={cn('w-4 h-4 rounded flex items-center justify-center text-[8px] text-white shrink-0', style.chip)} aria-hidden>
                          {style.shape}
                        </span>
                        <span className={cn('flex-1 leading-tight', isCorrect && 'font-bold text-emerald-800')}>{opt}</span>
                        {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        {mine && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 shrink-0">
                            {t('room.quiz.you')}
                          </span>
                        )}
                        <span className="tabular-nums text-slate-500 shrink-0">{count}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            isCorrect ? 'bg-emerald-500' : style.bar,
                            !reduceMotion && 'transition-[width] duration-700 ease-out',
                          )}
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {result.explanation && (
                <div className="px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-0.5">
                    {t('room.quiz.explanation')}
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">{result.explanation}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes quiz-confetti {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(540deg); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
