import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Swords, Trophy, Mic, Users, Loader2, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ragService } from '@/lib/api/services/rag.service';
import { scoreMatch, type WordMark } from './practice-scoring';
import { setSfxEnabled, unlockBattleSfx, tone, chime } from './battle-sfx';

// ── Shared types (LiveRoom imports these) ─────────────────────────────────────

export interface BattleLeader {
  userId: string;
  name: string;
  score: number;
}

export interface ActiveBattle {
  id: number;
  ordinal: number;
  total: number;
  phrase: string;
  /** Full read-aloud window length in seconds (server BATTLE_SUBMIT_SECONDS). */
  durationSeconds: number;
  /** Epoch ms when the read-aloud window closes (shared across the whole room). */
  deadline: number;
  /** Live "N recording now" crowd count. */
  recordingCount: number;
  /** This client's locked score once submitted + acked. */
  myScore: number | null;
  /** Leaderboard slice that builds in real time as scores land. */
  liveBoard: BattleLeader[];
  /** Final ranked board once battle_result arrives. */
  result: { leaderboard: BattleLeader[]; totalSubmitted: number } | null;
}

interface Props {
  battle: ActiveBattle;
  audioUnlocked: boolean;
  currentUserId: string;
  onSubmit: (battleId: number, score: number) => void;
  onStartRecording: (battleId: number) => void;
  onReact: (emoji: string) => void;
}

// ── Choreography constants ────────────────────────────────────────────────────

const COUNTDOWN_STEP_MS = 700;
const COUNTDOWN_MS = 3100; // 3,2,1 (3×700) then a ~1s "GO" hold
const BARS = 16;
// Symmetric envelope so the centre bars react most to the voice (like a mouth).
const BAR_ENV = Array.from({ length: BARS }, (_, i) => {
  const d = Math.abs(i - (BARS - 1) / 2) / ((BARS - 1) / 2);
  return 1 - d * 0.7;
});
const PODIUM_PIECES = ['🎉', '✨', '⭐', '🎊', '🎈'] as const;
const COUNTDOWN_HUE: Record<string, string> = {
  '3': 'bg-sky-500',
  '2': 'bg-amber-500',
  '1': 'bg-rose-500',
  GO: 'bg-emerald-500',
};

function countdownLabel(elapsedMs: number): string | null {
  if (elapsedMs < 0) return '3';
  if (elapsedMs >= COUNTDOWN_MS) return null;
  const idx = Math.floor(elapsedMs / COUNTDOWN_STEP_MS);
  return idx <= 2 ? String(3 - idx) : 'GO';
}

function bandKey(score: number): string {
  if (score >= 90) return 'room.battle.bandPerfect';
  if (score >= 75) return 'room.battle.bandGreat';
  if (score >= 50) return 'room.battle.bandGood';
  return 'room.battle.bandKeepGoing';
}

/**
 * Full-stage overlay for a synchronized choral pronunciation battle. Four acts:
 *  1. Countdown — phrase huge + 3·2·1·GO off the shared server deadline.
 *  2. Record    — everyone reads aloud at once; live waveform + crowd ticker.
 *  3. Reveal    — your score counts up + per-word green/red feedback.
 *  4. Podium    — top-3 pedestals rise, confetti + fanfare, your placement.
 * Owns the mic lifecycle, all timers (derived from battle.deadline so the room
 * stays in sync), local scoring, and its own prefers-reduced-motion handling.
 */
export function BattleOverlay({
  battle,
  audioUnlocked,
  currentUserId,
  onSubmit,
  onStartRecording,
  onReact,
}: Props) {
  const { t } = useTranslation('livestream');

  const reduceMotion = useMemo(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    [],
  );

  const [now, setNow] = useState(() => Date.now());
  const [localPhase, setLocalPhase] = useState<'countdown' | 'record' | 'scoring' | 'done'>('countdown');
  const [micBlocked, setMicBlocked] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [myScore, setMyScore] = useState<number | null>(battle.myScore);
  const [wordDetails, setWordDetails] = useState<WordMark[]>([]);
  const [displayScore, setDisplayScore] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedRef = useRef(false);
  const submittedRef = useRef(battle.myScore !== null);
  const handledRef = useRef(false);
  const dismissedRef = useRef(false);
  const lastBeepRef = useRef<string | null>(null);
  const revealSfxRef = useRef(false);
  const podiumSfxRef = useRef(false);

  const micSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  const anchor = battle.deadline - battle.durationSeconds * 1000;
  const recordStart = anchor + COUNTDOWN_MS;

  const vibrate = useCallback((pattern: number | number[]) => {
    if (reduceMotion) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(pattern); } catch { /* unsupported */ }
    }
  }, [reduceMotion]);

  // ── Enable sfx only when motion is allowed AND audio is unlocked ──
  useEffect(() => {
    setSfxEnabled(!reduceMotion && audioUnlocked);
    if (audioUnlocked) unlockBattleSfx();
    return () => setSfxEnabled(false);
  }, [reduceMotion, audioUnlocked]);

  // ── Master clock — drives every time-derived phase + timer ──
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);

  // ── Mic waveform loop ──
  const stopWave = useCallback(() => {
    if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setMicVolume(0);
  }, []);

  const teardownMic = useCallback(() => {
    stopWave();
    streamRef.current?.getTracks().forEach(tr => tr.stop());
    streamRef.current = null;
    analyserRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
  }, [stopWave]);

  // ── Score the recorded attempt, then submit (first-write-wins server-side) ──
  const handleRecorded = useCallback(async () => {
    if (handledRef.current) return; // guard against a double `onstop`
    handledRef.current = true;
    teardownMic();
    setLocalPhase('scoring');
    let score = 0;
    let details: WordMark[] = [];
    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      // fast=true → small low-latency Whisper model so the score is ready before
      // the battle window closes (the accurate model was too slow on CPU).
      const data = await ragService.transcribeDictation(blob, 'en', true);
      const transcript = data?.success && data.sentences
        ? data.sentences.map(s => s.text).join(' ')
        : '';
      const scored = scoreMatch(battle.phrase, transcript);
      score = scored.score;
      details = scored.details;
    } catch {
      // Transcription failed — submit what we have so the learner is still ranked.
    }
    setWordDetails(details);
    if (!submittedRef.current) {
      submittedRef.current = true;
      setMyScore(score);
      onSubmit(battle.id, score);
    }
  }, [battle.id, battle.phrase, onSubmit, teardownMic]);

  const startRecording = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (!micSupported) { setMicBlocked(true); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // The overlay may have been dismissed, or the window may have closed,
      // while the permission prompt was up — don't leave the mic running or
      // start a recording that can never be submitted.
      if (dismissedRef.current || Date.now() >= battle.deadline) {
        stream.getTracks().forEach(tr => tr.stop());
        return;
      }
      streamRef.current = stream;
      // Tee the mic into an analyser for the live waveform — NOT connected to
      // destination, so there is no feedback howl.
      const Ctor = window.AudioContext
        ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) {
        const actx = new Ctor();
        audioCtxRef.current = actx;
        const src = actx.createMediaStreamSource(stream);
        const analyser = actx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        analyserRef.current = analyser;
        const data = new Uint8Array(analyser.frequencyBinCount);
        const loop = () => {
          const a = analyserRef.current;
          if (!a) return;
          a.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          setMicVolume(Math.min(1, sum / data.length / 180));
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      }
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => { void handleRecorded(); };
      rec.start();
      onStartRecording(battle.id);
    } catch {
      setMicBlocked(true);
      teardownMic();
    }
  }, [battle.id, battle.deadline, handleRecorded, micSupported, onStartRecording, teardownMic]);

  const finishRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }, []);

  // ── Phase transitions driven by the master clock ──
  useEffect(() => {
    if (localPhase === 'countdown' && now >= recordStart) {
      setLocalPhase('record');
      void startRecording();
    } else if (localPhase === 'record' && now >= battle.deadline) {
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop(); // → handleRecorded → scoring
      } else if (!submittedRef.current) {
        // Mic blocked/denied, or getUserMedia still pending past the window —
        // never strand the learner on the record screen.
        setLocalPhase('done');
      }
    }
  }, [now, localPhase, recordStart, battle.deadline, micBlocked, startRecording]);

  // ── Countdown beeps + haptics ──
  const elapsed = now - anchor;
  const cdLabel = countdownLabel(elapsed);
  useEffect(() => {
    if (localPhase !== 'countdown' || !cdLabel || cdLabel === lastBeepRef.current) return;
    lastBeepRef.current = cdLabel;
    if (cdLabel === 'GO') {
      chime([880, 1318.5], 0.06, 'triangle', 0.22);
      vibrate([60, 40, 90]);
    } else {
      tone({ freq: { '3': 440, '2': 554, '1': 659 }[cdLabel] ?? 440, type: 'square', gain: 0.16, dur: 0.16 });
      vibrate(35);
    }
  }, [cdLabel, localPhase, vibrate]);

  // ── Reveal sfx + count-up ──
  useEffect(() => {
    if (myScore === null || revealSfxRef.current) return;
    revealSfxRef.current = true;
    const f = 392 * Math.pow(2, myScore / 100); // G4→G5 across 0..100
    chime([f, f * 1.25, f * 1.5], 0.05, 'sine', 0.18);
    if (myScore >= 90) tone({ freq: f * 2, type: 'triangle', dur: 0.25, when: 0.18, gain: 0.15 });

    if (reduceMotion) { setDisplayScore(myScore); return; }
    const start = performance.now();
    let raf = 0;
    const tick = (ts: number) => {
      const p = Math.min(1, (ts - start) / 900);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(myScore * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [myScore, reduceMotion]);

  // ── Podium fanfare ──
  useEffect(() => {
    if (!battle.result || podiumSfxRef.current) return;
    podiumSfxRef.current = true;
    chime([523, 659, 784, 1047], 0.09, 'triangle', 0.22);
  }, [battle.result]);

  // ── Hard teardown on unmount / dismissal (mic LED must not linger) ──
  useEffect(() => () => {
    dismissedRef.current = true; // also aborts any in-flight getUserMedia
    if (recorderRef.current?.state === 'recording') {
      try { recorderRef.current.stop(); } catch { /* already stopped */ }
    }
    teardownMic();
    setSfxEnabled(false);
  }, [teardownMic]);

  // ── Derived display state ──
  const showPodium = !!battle.result;
  const showReveal = !showPodium && myScore !== null;
  const showCountdown = !showPodium && !showReveal && localPhase === 'countdown';
  const showRecord = !showPodium && !showReveal && localPhase === 'record';
  const showScoring = !showPodium && !showReveal && localPhase === 'scoring';

  const secsLeft = Math.max(0, Math.ceil((battle.deadline - now) / 1000));
  const recordWindow = Math.max(1, battle.deadline - recordStart);
  const recordFrac = Math.max(0, Math.min(1, (battle.deadline - now) / recordWindow));

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-slate-900/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden relative">
        {/* ── Header ── */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white">
          <Swords className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wide">
            {t('room.battle.badge', { ordinal: battle.ordinal, total: battle.total })}
          </span>
          {(showCountdown || showRecord) && (
            <span className="ml-auto flex items-center gap-1 text-xs font-medium bg-white/15 px-2 py-0.5 rounded-full">
              <Users className="w-3 h-3" />
              {t('room.battle.recordingNow', { count: battle.recordingCount })}
            </span>
          )}
          {(showReveal || showScoring) && battle.liveBoard.length > 0 && (
            <span className="ml-auto text-xs font-medium bg-white/15 px-2 py-0.5 rounded-full">
              {t('room.battle.submitted', { count: battle.liveBoard.length, total: Math.max(battle.recordingCount, battle.liveBoard.length) })}
            </span>
          )}
        </div>

        <div className="p-4 space-y-3">
          {/* ── Act 1: Countdown ── */}
          {showCountdown && (
            <div className="flex flex-col items-center gap-4 py-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-500">
                {t('room.battle.getReady')}
              </p>
              <p
                className="text-2xl sm:text-4xl font-black text-slate-900 text-center leading-tight"
                aria-live="assertive"
              >
                "{battle.phrase}"
              </p>
              <div
                key={cdLabel}
                className={cn(
                  'w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-lg',
                  COUNTDOWN_HUE[cdLabel ?? '3'] ?? 'bg-sky-500',
                  !reduceMotion && 'animate-[battle-pop_0.7s_cubic-bezier(.2,.9,.25,1)]',
                  cdLabel === 'GO' && 'text-3xl',
                )}
              >
                {cdLabel === 'GO' ? t('room.battle.go') : cdLabel}
              </div>
            </div>
          )}

          {/* ── Act 2: Record ── */}
          {showRecord && (
            <div className="flex flex-col items-center gap-3 py-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> {t('room.battle.readAloud')}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 text-center leading-snug">
                "{battle.phrase}"
              </p>

              {micBlocked ? (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-center">
                  {t('room.battle.micBlocked')}
                </p>
              ) : (
                <>
                  {/* Pulsing mic ring + live waveform */}
                  <div
                    className="relative flex items-center justify-center my-1"
                    role="status"
                    aria-label={t('room.battle.readAloud')}
                  >
                    <div
                      className="w-24 h-24 rounded-full bg-rose-500 flex items-center justify-center"
                      style={{
                        boxShadow: reduceMotion
                          ? '0 0 0 6px rgba(244,63,94,0.18)'
                          : `0 0 0 ${6 + micVolume * 22}px rgba(244,63,94,${0.10 + micVolume * 0.22})`,
                        transition: reduceMotion ? undefined : 'box-shadow 80ms ease-out',
                      }}
                    >
                      <Mic className="w-9 h-9 text-white" />
                    </div>
                  </div>
                  <div className="flex items-end justify-center gap-[3px] h-10" aria-hidden>
                    {BAR_ENV.map((env, i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full bg-rose-400"
                        style={{
                          height: `${6 + (reduceMotion ? 0.25 : micVolume) * env * 34}px`,
                          transition: reduceMotion ? undefined : 'height 75ms ease-out',
                        }}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Shared time ring */}
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                  <circle
                    cx="28" cy="28" r="24" fill="none" strokeWidth="5" strokeLinecap="round"
                    stroke={secsLeft <= 3 ? '#f43f5e' : '#6366f1'}
                    strokeDasharray={2 * Math.PI * 24}
                    strokeDashoffset={2 * Math.PI * 24 * (1 - recordFrac)}
                    style={{ transition: reduceMotion ? undefined : 'stroke-dashoffset 100ms linear' }}
                  />
                </svg>
                <span className={cn(
                  'absolute inset-0 flex items-center justify-center text-sm font-extrabold tabular-nums',
                  secsLeft <= 3 ? 'text-rose-600' : 'text-indigo-700',
                )}>
                  {secsLeft}
                </span>
              </div>

              {!micBlocked && (
                <button
                  onClick={finishRecording}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 underline underline-offset-2"
                >
                  {t('room.battle.doneSpeaking')}
                </button>
              )}
            </div>
          )}

          {/* ── Scoring (transcription in flight) ── */}
          {showScoring && (
            <div className="flex flex-col items-center gap-2 py-6">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              <p className="text-sm font-medium text-slate-600">{t('room.battle.scoring')}</p>
            </div>
          )}

          {/* ── Act 3: Reveal ── */}
          {showReveal && myScore !== null && (
            <div className="flex flex-col items-center gap-2 py-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">
                {t('room.battle.understoodAs')}
              </p>
              <div className="text-5xl font-black tabular-nums text-slate-900">
                {reduceMotion ? myScore : displayScore}
                <span className="text-2xl text-slate-400">/100</span>
              </div>
              <p className={cn(
                'text-sm font-bold',
                myScore >= 75 ? 'text-emerald-600' : myScore >= 50 ? 'text-amber-600' : 'text-rose-600',
              )}>
                {t(bandKey(myScore))}
              </p>
              {wordDetails.length > 0 && (
                <p className="flex flex-wrap justify-center gap-1.5 mt-1">
                  {wordDetails.map((w, i) => (
                    <span
                      key={i}
                      className={cn(
                        'text-sm font-semibold px-1.5 py-0.5 rounded',
                        w.correct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700 line-through',
                        !reduceMotion && 'animate-[battle-word-in_0.3s_ease-out_both]',
                      )}
                      style={reduceMotion ? undefined : { animationDelay: `${i * 40}ms` }}
                    >
                      {w.word}
                    </span>
                  ))}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1">{t('room.battle.scoring')}</p>
            </div>
          )}

          {/* ── Waiting (mic blocked / no score, pre-podium) ── */}
          {!showPodium && !showReveal && localPhase === 'done' && (
            <div className="flex flex-col items-center gap-2 py-6">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              <p className="text-sm text-slate-500">{t('room.battle.scoring')}</p>
            </div>
          )}

          {/* ── Act 4: Podium ── */}
          {showPodium && battle.result && (
            <Podium
              result={battle.result}
              currentUserId={currentUserId}
              myScore={myScore}
              wordDetails={wordDetails}
              reduceMotion={reduceMotion}
              onReact={onReact}
              t={t}
            />
          )}
        </div>

        {/* Confetti for a podium finish */}
        {showPodium && battle.result && !reduceMotion &&
          battle.result.leaderboard.findIndex(e => e.userId === currentUserId) >= 0 &&
          battle.result.leaderboard.findIndex(e => e.userId === currentUserId) < 3 && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
            {Array.from({ length: 16 }).map((_, i) => (
              <span
                key={i}
                className="absolute text-xl"
                style={{
                  left: `${6 + (i * 89) % 90}%`,
                  top: '-8%',
                  animation: `battle-confetti ${1.6 + (i % 5) * 0.25}s ease-in ${(i % 7) * 0.12}s forwards`,
                }}
              >
                {PODIUM_PIECES[i % PODIUM_PIECES.length]}
              </span>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes battle-pop {
          0%   { transform: scale(2.4); filter: blur(6px); opacity: 0; }
          40%  { transform: scale(1);   filter: blur(0);   opacity: 1; }
          100% { transform: scale(0.55); opacity: 0; }
        }
        @keyframes battle-word-in {
          0%   { transform: translateY(6px) scale(0.8); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes battle-rise {
          0%   { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes battle-bob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
        @keyframes battle-confetti {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(540deg); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

// ── Podium sub-view ───────────────────────────────────────────────────────────

interface PodiumProps {
  result: { leaderboard: BattleLeader[]; totalSubmitted: number };
  currentUserId: string;
  myScore: number | null;
  wordDetails: WordMark[];
  reduceMotion: boolean;
  onReact: (emoji: string) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

const PODIUM_ORDER = [1, 0, 2]; // render 2nd, 1st, 3rd so the winner is centre
const PEDESTAL_H = ['h-16', 'h-24', 'h-12'];
const MEDALS = ['🥇', '🥈', '🥉'];
const PODIUM_REACTIONS = ['👏', '🔥', '🎉'];

function Podium({ result, currentUserId, myScore, wordDetails, reduceMotion, onReact, t }: PodiumProps) {
  const lb = result.leaderboard;
  const top3 = lb.slice(0, 3);
  const myRank = lb.findIndex(e => e.userId === currentUserId);
  const solo = result.totalSubmitted <= 1;

  return (
    <div className="flex flex-col items-center gap-3 py-1">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-500">
        <Trophy className="w-3.5 h-3.5" /> {solo ? t('room.battle.yourResult') : t('room.battle.podium')}
      </p>

      {solo ? (
        // Alone in the room there's no leaderboard to rank against, so the score
        // IS the result — lead with it (the transient reveal act can be skipped
        // entirely if transcription lands after battle_result). When we never
        // captured a score, say so honestly rather than show a hollow cheer.
        <div className="flex flex-col items-center gap-2 py-1 w-full">
          {myScore !== null ? (
            <>
              <div className="text-5xl font-black tabular-nums text-slate-900">
                {myScore}
                <span className="text-2xl text-slate-400">/100</span>
              </div>
              <p className={cn(
                'text-sm font-bold',
                myScore >= 75 ? 'text-emerald-600' : myScore >= 50 ? 'text-amber-600' : 'text-rose-600',
              )}>
                {t(bandKey(myScore))}
              </p>
              {wordDetails.length > 0 && (
                <p className="flex flex-wrap justify-center gap-1.5 mt-1">
                  {wordDetails.map((w, i) => (
                    <span
                      key={i}
                      className={cn(
                        'text-sm font-semibold px-1.5 py-0.5 rounded',
                        w.correct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700 line-through',
                      )}
                    >
                      {w.word}
                    </span>
                  ))}
                </p>
              )}
              <p className="text-xs font-semibold text-indigo-600 text-center mt-1">
                {t('room.battle.soloEncouragement')}
              </p>
            </>
          ) : (
            <p className="text-sm font-medium text-slate-500 text-center py-2">
              {t('room.battle.soloNoCapture')}
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Pedestals: 2nd · 1st · 3rd */}
          <div className="flex items-end justify-center gap-2 w-full">
            {PODIUM_ORDER.map(slot => {
              const e = top3[slot];
              if (!e) return <div key={slot} className="flex-1" />;
              const mine = e.userId === currentUserId;
              return (
                <div key={slot} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-2xl">{MEDALS[slot]}</span>
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0',
                    slot === 0 ? 'bg-amber-400' : slot === 1 ? 'bg-slate-400' : 'bg-orange-400',
                    mine && 'ring-2 ring-indigo-500 ring-offset-1',
                    slot === 0 && !reduceMotion && 'animate-[battle-bob_2s_ease-in-out_infinite]',
                  )}>
                    {(e.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 truncate max-w-full px-0.5">
                    {mine ? t('room.battle.you') : e.name}
                  </span>
                  <div
                    className={cn(
                      'w-full rounded-t-lg flex items-start justify-center pt-1',
                      PEDESTAL_H[slot],
                      slot === 0 ? 'bg-amber-200' : slot === 1 ? 'bg-slate-200' : 'bg-orange-200',
                      !reduceMotion && 'animate-[battle-rise_0.55s_ease-out_both]',
                    )}
                    style={reduceMotion ? undefined : { animationDelay: `${slot === 1 ? 0 : slot === 0 ? 0.12 : 0.24}s` }}
                  >
                    <span className="text-xs font-extrabold tabular-nums text-slate-700">{e.score}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Your placement when you're outside the top 3 */}
          {myRank >= 3 && myScore !== null && (
            <div className="w-full flex items-center gap-2 text-xs font-medium text-slate-600 bg-indigo-50 rounded-lg px-3 py-1.5">
              <span className="font-bold text-indigo-700">#{myRank + 1}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                {t('room.battle.you')}
              </span>
              <span className="ml-auto tabular-nums font-bold">{myScore}</span>
            </div>
          )}

          {myRank >= 0 && (
            <p className="text-xs font-semibold text-slate-500">
              {t('room.battle.placement', { beaten: Math.max(0, result.totalSubmitted - myRank - 1), total: result.totalSubmitted })}
            </p>
          )}
        </>
      )}

      {/* Cheer the room */}
      <div className="flex gap-2 pt-1">
        {PODIUM_REACTIONS.map(emoji => (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-90 transition text-lg"
            aria-label={t('reactions.sendAria', { emoji })}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
