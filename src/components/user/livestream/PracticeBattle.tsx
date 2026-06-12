import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, Square, Swords, Users, Loader2, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { scoreMatch } from './practice-scoring';

// ── Types (shared with LiveRoom) ──────────────────────────────────────────────

export interface BattleScore {
  userId: string;
  userName: string;
  score: number;
}

export interface ActiveBattle {
  id: number;
  phrase: string;
  countdownSeconds: number;
  recordSeconds: number;
  /** Date.now() when battle_start arrived — phases derive from elapsed time. */
  startedAt: number;
  /** Live entries, in arrival order, as battle_score broadcasts land. */
  scores: BattleScore[];
  /** Final leaderboard once battle_end arrives. */
  end: { leaderboard: BattleScore[]; participants: number } | null;
}

interface Props {
  battle: ActiveBattle;
  currentUserId: string;
  onSubmit: (battleId: number, transcript: string, score: number) => void;
}

const MEDALS = ['🥇', '🥈', '🥉'];
const CONFETTI_PIECES = ['🎉', '✨', '⭐', '🎊', '🎈'] as const;

/**
 * Full-stage overlay for a choral speaking battle: 3-2-1 countdown, everyone
 * records the same phrase simultaneously, each attempt is transcribed and
 * scored client-side (same scoring as the solo practice card), scores land on
 * a live mini-leaderboard, and the reveal crowns the podium.
 */
export function PracticeBattle({ battle, currentUserId, onSubmit }: Props) {
  const { t } = useTranslation('livestream');
  const [now, setNow] = useState(Date.now());
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [myScore, setMyScore] = useState<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const submittedRef = useRef(false);

  const reduceMotion = useMemo(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    [],
  );
  const micSupported = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  useEffect(() => {
    if (battle.end) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [battle.end]);

  const elapsed = (now - battle.startedAt) / 1000;
  const countdownLeft = Math.ceil(battle.countdownSeconds - elapsed);
  const recordLeft = Math.ceil(battle.countdownSeconds + battle.recordSeconds - elapsed);
  const phase: 'countdown' | 'record' | 'waiting' | 'podium' =
    battle.end ? 'podium'
    : countdownLeft > 0 ? 'countdown'
    : recordLeft > 0 ? 'record'
    : 'waiting';

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }, []);

  const startRecording = useCallback(async () => {
    if (recording || processing || submittedRef.current || !micSupported) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach(tr => tr.stop());
        setRecording(false);
        setProcessing(true);
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const { ragService } = await import('@/lib/api/services/rag.service');
          const data = await ragService.transcribeDictation(blob, 'en');
          if (data?.success && data.sentences) {
            const transcript = data.sentences.map((s: { text: string }) => s.text).join(' ');
            const { score } = scoreMatch(battle.phrase, transcript);
            if (!submittedRef.current && transcript) {
              submittedRef.current = true;
              setMyScore(score);
              onSubmit(battle.id, transcript, score);
            }
          }
        } catch (e) {
          console.error('Battle transcription failed', e);
        } finally {
          setProcessing(false);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch (e) {
      console.error('Mic access denied', e);
    }
  }, [battle.id, battle.phrase, micSupported, onSubmit, processing, recording]);

  // Auto-stop the mic when the recording window closes; the grace period
  // covers the transcription round-trip.
  useEffect(() => {
    if (phase !== 'record' && phase !== 'countdown') stopRecording();
  }, [phase, stopRecording]);
  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }, []);

  const myRank = battle.end
    ? battle.end.leaderboard.findIndex(e => e.userId === currentUserId)
    : -1;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Confetti for a personal podium finish (skipped for reduced motion) */}
      {phase === 'podium' && myRank >= 0 && myRank < 3 && !reduceMotion && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-xl"
              style={{
                left: `${6 + (i * 89) % 90}%`,
                top: '-8%',
                animation: `battle-confetti ${1.6 + (i % 5) * 0.25}s ease-in ${(i % 7) * 0.12}s forwards`,
              }}
            >
              {CONFETTI_PIECES[i % CONFETTI_PIECES.length]}
            </span>
          ))}
        </div>
      )}

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white">
          <Swords className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wide">{t('room.battle.badge')}</span>
          <span className="ml-auto flex items-center gap-1 text-xs font-medium bg-white/15 px-2 py-0.5 rounded-full">
            <Users className="w-3 h-3" />
            {t('room.battle.joinedCount', { count: battle.end ? battle.end.participants : battle.scores.length })}
          </span>
          {(phase === 'record' || phase === 'countdown') && (
            <span className="text-xs font-extrabold tabular-nums bg-white/15 px-2 py-0.5 rounded-full">
              {phase === 'countdown' ? countdownLeft : recordLeft}s
            </span>
          )}
        </div>

        <div className="p-4 space-y-3">
          {/* The phrase — always front and center */}
          <div className="text-center">
            <p className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-1">
              <Volume2 className="w-3 h-3" />
              {phase === 'countdown' ? t('room.battle.getReady') : t('room.battle.speakNow')}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              "{battle.phrase}"
            </p>
          </div>

          {/* ── Countdown phase ── */}
          {phase === 'countdown' && (
            <div className="flex justify-center py-2" aria-live="polite">
              <span
                key={countdownLeft}
                className={cn(
                  'w-16 h-16 rounded-full bg-rose-500 text-white text-3xl font-extrabold flex items-center justify-center',
                  !reduceMotion && 'animate-in zoom-in duration-300',
                )}
              >
                {countdownLeft}
              </span>
            </div>
          )}

          {/* ── Recording phase ── */}
          {phase === 'record' && (
            <div className="flex flex-col items-center gap-2 py-1">
              {!micSupported ? (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  {t('practice.unsupported')}
                </p>
              ) : myScore !== null ? (
                <p className="text-sm font-semibold text-emerald-700" role="status">
                  {t('room.battle.yourScore', { score: myScore })}
                </p>
              ) : processing ? (
                <p className="flex items-center gap-2 text-sm font-medium text-slate-600" role="status">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('room.battle.processing')}
                </p>
              ) : (
                <>
                  <button
                    onClick={recording ? stopRecording : startRecording}
                    className={cn(
                      'w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95',
                      recording
                        ? cn('bg-rose-600 ring-4 ring-rose-200', !reduceMotion && 'animate-pulse')
                        : 'bg-indigo-600 hover:bg-indigo-700',
                    )}
                    aria-label={recording ? t('room.battle.tapToFinish') : t('room.battle.tapToStart')}
                  >
                    {recording ? <Square className="w-6 h-6" /> : <Mic className="w-7 h-7" />}
                  </button>
                  <p className="text-xs text-slate-500 font-medium">
                    {recording ? t('room.battle.tapToFinish') : t('room.battle.tapToStart')}
                  </p>
                </>
              )}
            </div>
          )}

          {/* ── Waiting for the tally ── */}
          {phase === 'waiting' && (
            <p className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600 py-2" role="status">
              <Loader2 className="w-4 h-4 animate-spin" />
              {processing
                ? t('room.battle.processing')
                : myScore !== null
                  ? t('room.battle.yourScore', { score: myScore })
                  : t('room.battle.waiting')}
            </p>
          )}

          {/* Live score chips as entries land */}
          {phase !== 'podium' && battle.scores.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {battle.scores.slice(0, 8).map(s => (
                <span
                  key={s.userId}
                  className={cn(
                    'text-[11px] font-semibold px-2 py-0.5 rounded-full border',
                    s.userId === currentUserId
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200',
                    !reduceMotion && 'animate-in fade-in slide-in-from-bottom-1 duration-300',
                  )}
                >
                  {s.userName} · {s.score}
                </span>
              ))}
            </div>
          )}

          {/* ── Podium ── */}
          {phase === 'podium' && battle.end && (
            battle.end.leaderboard.length === 0 ? (
              <p className="text-sm text-center text-slate-500 py-3">{t('room.battle.noPlayers')}</p>
            ) : (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t('room.battle.leaderboard')}
                </p>
                {battle.end.leaderboard.slice(0, 5).map((e, rank) => {
                  const mine = e.userId === currentUserId;
                  return (
                    <div
                      key={e.userId}
                      className={cn(
                        'rounded-lg p-1.5',
                        rank === 0 && 'bg-amber-50 ring-1 ring-amber-300',
                        mine && rank !== 0 && 'bg-indigo-50',
                      )}
                    >
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-1">
                        <span className="w-5 text-center shrink-0" aria-hidden>
                          {MEDALS[rank] ?? `${rank + 1}.`}
                        </span>
                        <span className={cn('flex-1 truncate', rank === 0 && 'font-bold text-amber-800')}>
                          {e.userName}
                        </span>
                        {mine && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 shrink-0">
                            {t('room.battle.you')}
                          </span>
                        )}
                        <span className="tabular-nums font-bold text-slate-800 shrink-0">{e.score}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            rank === 0 ? 'bg-amber-400' : rank < 3 ? 'bg-indigo-400' : 'bg-slate-300',
                            !reduceMotion && 'transition-[width] duration-700 ease-out',
                          )}
                          style={{ width: `${e.score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>

      <style>{`
        @keyframes battle-confetti {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(540deg); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
