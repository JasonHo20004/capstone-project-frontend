import { useEffect, useRef, useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/hooks/api/use-user';
import { AIAvatarAnime } from '@/components/user/livestream/AIAvatarAnime';

// 3D hologram teacher — lazy so three.js stays out of this route's main chunk
// (same convention as PenguinHero3D). The 2D orb doubles as Suspense fallback.
const AIAvatar3D = lazy(() => import('@/components/user/livestream/AIAvatar3D'));
import { ReactionLayer, ReactionBar, type FloatingReaction } from '@/components/user/livestream/ReactionLayer';
import { ParticipantPanel, type Participant } from '@/components/user/livestream/ParticipantPanel';
import { LessonSlide } from '@/components/user/livestream/LessonSlide';
import { QuizOverlay, type ActiveQuiz } from '@/components/user/livestream/QuizOverlay';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api/config';
import {
  Users, Send, PlayCircle, StopCircle, ArrowLeft,
  MessageSquare, BookOpen, Volume2, VolumeX, WifiOff,
  RotateCcw, PlaySquare, Mic, MicOff, RefreshCw, Hand,
  Mic2, Star, CheckCircle, Check, Sparkles,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Livestream traffic (HTTP + WebSocket) routes through the api-gateway, which
// proxies /api/livestream/* to the rag-service. Point at the gateway origin.
const RAG_BASE = import.meta.env.VITE_GATEWAY_URL ?? 'http://localhost:3000';
const WS_BASE = RAG_BASE.replace(/^http/, 'ws');
const MAX_RECONNECT_DELAY = 16000;
const MAX_QUESTION_LENGTH = 200;
const QUESTIONS_PER_MIN = 6;
// No sub-1× preset: the server paces slides by the REAL audio length at 1×, so
// slower playback made narration lag further behind the slides/quizzes every
// section. Faster rates only add a little silence, which is harmless.
const PLAYBACK_RATES = [1, 1.25, 1.5] as const;

// Quick-reply chips: `value` is always English (sent to AI), `key` resolves the
// translated display label via i18n. Keeping them separate prevents Vietnamese
// labels from being forwarded to an English-prompt AI and confusing it.
const QUICK_CHIPS = [
  { key: 'explainAgain', value: 'Explain this part again' },
  { key: 'example',      value: 'Give me an example' },
  { key: 'simpler',      value: 'Use simpler words' },
  { key: 'ielts',        value: 'Does this appear in IELTS?' },
  { key: 'memorize',     value: 'How do I memorize this word?' },
] as const;

// Minimal type shim for Web Speech API (Chrome) removed in favor of MediaRecorder + Whisper API

// ── Types ─────────────────────────────────────────────────────────────────────

interface RoomInfo {
  id: string;
  topic: string;
  lesson_prompt?: string;
  level: string;
  level_label: string;
  language: string;
  host_id: string;
  host_name: string;
  status: string;
  transcript: TranscriptChunk[];
  /** Planned slide count — set once generation finishes; lets a reconnect
   *  restore the progress bar before the next chunk arrives. */
  total_sections?: number;
}

interface TranscriptChunk {
  title: string;
  content: string;
  key_points?: string[];
  keywords?: { term: string; meaning: string }[];
  example?: string;
  image_url?: string;
}

interface ChatMessage {
  type: 'question' | 'answer' | 'system' | 'error' | 'aside';
  /** Server id tying an answer bubble to its question — lets two answers
   *  stream concurrently without clobbering each other's bubble. */
  qa_id?: string;
  user_name?: string;
  question?: string;
  answer?: string;
  text?: string;
}

// ── Audio queue ───────────────────────────────────────────────────────────────

class AudioQueue {
  private queue: string[] = [];          // lecture (slide) narration, FIFO
  private priorityQueue: string[] = [];  // AI answers — jump ahead of slides
  private playing = false;
  private current: HTMLAudioElement | null = null;
  // A slide narration paused mid-way to let an AI answer through; resumed once
  // every queued answer has finished.
  private paused: HTMLAudioElement | null = null;
  private currentIsPriority = false;
  private _muted = false;
  private _rate = 1;
  private _blocked = false;
  onPlay?: () => void;
  onStop?: () => void;
  /** Fired when the browser blocked autoplay — the UI should prompt a tap. */
  onBlocked?: () => void;
  onVolumeChange?: (vol: number) => void;
  onProgress?: (progress: number, isPriority: boolean) => void;

  private audioCtx?: AudioContext;
  private analyser?: AnalyserNode;
  private dataArray?: Uint8Array;
  private animationFrameId?: number;
  private sourceNode?: MediaElementAudioSourceNode;

  private initAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx?.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  private startVolumeLoop() {
    if (!this.analyser || !this.dataArray || !this.onVolumeChange) return;
    const loop = () => {
      this.analyser!.getByteFrequencyData(this.dataArray!);
      let sum = 0;
      for (let i = 0; i < this.dataArray!.length; i++) sum += this.dataArray![i];
      const avg = sum / this.dataArray!.length;
      this.onVolumeChange!(avg / 255); // normalize 0 to 1

      if (this.current && this.current.duration && this.onProgress) {
        this.onProgress(this.current.currentTime / this.current.duration, this.currentIsPriority);
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  private stopVolumeLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
    if (this.onVolumeChange) this.onVolumeChange(0);
  }

  /** Queue a slide narration clip (plays after anything already queued). */
  push(url: string) {
    if (!url) return;
    this.queue.push(url);
    if (!this.playing && !this._blocked) this._next();
  }

  /**
   * Queue an AI answer. Answers take priority over slides: if a slide narration
   * is currently playing it is paused mid-way, the answer plays immediately, and
   * the slide resumes once every queued answer has finished. This is what lets
   * the AI reply to a question without waiting for the current slide to end.
   */
  pushPriority(url: string) {
    if (!url) return;
    this.priorityQueue.push(url);
    if (this._blocked) return; // resumes via unlock()
    if (this.playing && this.current && !this.currentIsPriority) {
      // Interrupt the slide narration and remember it so we can resume later.
      this.paused = this.current;
      this.current.pause();
      this.current = null;
      this.playing = false;
      this._next();
    } else if (!this.playing) {
      this._next();
    }
    // If an answer is already playing, the new one just waits in priorityQueue.
  }

  private _play(q: string[], isPriority: boolean) {
    this.playing = true;
    this.currentIsPriority = isPriority;
    const url = q[0]; // peek — only drop the item once it actually plays/ends
    const audio = new Audio(url);
    audio.crossOrigin = "anonymous"; // crucial for Web Audio API with external URLs
    audio.muted = this._muted;
    audio.playbackRate = this._rate;
    this.current = audio;

    try {
      this.initAudioContext();
      if (this.audioCtx && this.analyser) {
        this.sourceNode = this.audioCtx.createMediaElementSource(audio);
        this.sourceNode.connect(this.analyser);
      }
    } catch (e) {
      console.warn('AudioContext setup failed', e);
    }

    // onPlay fires on the real `play` event, so the avatar only "speaks" when
    // audio is genuinely audible (not when playback was silently blocked).
    audio.onplay   = () => { 
      this._blocked = false; 
      this.onPlay?.(); 
      if (this.audioCtx?.state === 'suspended') this.audioCtx.resume();
      this.startVolumeLoop();
    };
    audio.onended  = () => { 
      this.stopVolumeLoop();
      if (this.sourceNode) { this.sourceNode.disconnect(); this.sourceNode = undefined; }
      q.shift(); this.current = null; this._next(); 
    };
    audio.onerror  = () => { 
      this.stopVolumeLoop();
      if (this.sourceNode) { this.sourceNode.disconnect(); this.sourceNode = undefined; }
      q.shift(); this.current = null; this._next(); 
    };
    audio.play().catch(() => {
      // Autoplay blocked (no user gesture yet). Keep the item queued and wait
      // for unlock() instead of silently draining the whole lesson.
      this.playing = false;
      this._blocked = true;
      this.onStop?.();
      this.onBlocked?.();
    });
  }

  private _next() {
    // 1) Answers first — they may have interrupted a slide narration.
    if (this.priorityQueue.length) { this._play(this.priorityQueue, true); return; }

    // 2) Resume a slide narration an answer interrupted (reuse the element so it
    //    continues from where it was paused, not from the start).
    if (this.paused) {
      const audio = this.paused;
      this.paused = null;
      this.playing = true;
      this.currentIsPriority = false;
      this.current = audio;
      audio.muted = this._muted;
      audio.playbackRate = this._rate;
      audio.play().catch(() => {
        this.paused = audio;   // resume blocked — wait for unlock()
        this.current = null;
        this.playing = false;
        this._blocked = true;
        this.onStop?.();
        this.onBlocked?.();
      });
      return;
    }

    // 3) Otherwise the next slide narration.
    if (!this.queue.length) { this.playing = false; this.current = null; this.onStop?.(); return; }
    this._play(this.queue, false);
  }

  /** Resume playback after a user gesture has granted audio permission. */
  unlock() {
    this._blocked = false;
    this.initAudioContext();
    if (!this.playing && (this.priorityQueue.length || this.paused || this.queue.length)) this._next();
  }

  setMuted(muted: boolean) {
    this._muted = muted;
    if (this.current) this.current.muted = muted;
  }

  setRate(rate: number) {
    this._rate = rate;
    if (this.current) this.current.playbackRate = rate;
  }

  clear() {
    this.queue = [];
    this.priorityQueue = [];
    this.playing = false;
    this._blocked = false;
    this.currentIsPriority = false;
    this.stopVolumeLoop();
    if (this.sourceNode) { this.sourceNode.disconnect(); this.sourceNode = undefined; }
    this.current?.pause();
    this.current = null;
    this.paused?.pause();
    this.paused = null;
    this.onStop?.();
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extract the user id the server will authenticate us as, straight from the
 * access token. The server trusts the JWT `userId` claim (falling back to
 * `sub`), so deriving our own id the same way keeps "this is me" checks
 * (spotlight, raised hand, practice results) correct even before the async
 * profile query has resolved.
 */
function userIdFromToken(token: string): string | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = JSON.parse(
      decodeURIComponent(
        atob(part.replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join(''),
      ),
    ) as { userId?: string; sub?: string };
    return json.userId ?? json.sub ?? null;
  } catch {
    return null;
  }
}

/**
 * Locate the chat bubble for an in-flight AI answer. Prefers the server's
 * qa_id; falls back to the old trailing-message heuristic for servers that
 * don't send one.
 */
function findAnswerIndex(chat: ChatMessage[], qaId: string | undefined, userName: string): number {
  if (qaId) {
    for (let i = chat.length - 1; i >= 0; i--) {
      if (chat[i].type === 'answer' && chat[i].qa_id === qaId) return i;
    }
    return -1;
  }
  const last = chat[chat.length - 1];
  return last && last.type === 'answer' && last.user_name === userName ? chat.length - 1 : -1;
}

const LEVEL_COLORS: Record<string, string> = {
  beginner:     'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced:     'bg-violet-100 text-violet-700',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function LiveRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { t } = useTranslation('livestream');

  // System messages forwarded from the server are tagged with stable English
  // strings. Map them to localized copy at render time so the UI stays in
  // sync with the active language without round-tripping through the server.
  const sysMessages = useMemo<Record<string, string>>(() => ({
    'The lesson has started!':                       t('room.system.lessonStart'),
    'AI is preparing the lesson…':                   t('room.system.lessonGenerating'),
    'Lesson complete! You can still ask questions.': t('room.system.qaStart', { mins: 5 }),
    'The classroom has ended.':                      t('room.system.roomEnded'),
  }), [t]);

  // Same idea for server-sent error strings (stable English keys → local copy).
  const errMessages = useMemo<Record<string, string>>(() => ({
    'Too many questions — please wait.': t('room.chat.serverRateLimited'),
  }), [t]);

  const wsRef           = useRef<WebSocket | null>(null);
  const audioQueueRef   = useRef(new AudioQueue());
  const chatEndRef      = useRef<HTMLDivElement>(null);
  const stageRef        = useRef<HTMLDivElement>(null);
  const reconnectTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay  = useRef(1000);
  // Guards against an infinite refresh→reconnect loop when the token can't be
  // renewed. Reset on every successful (re)connect.
  const authRetried     = useRef(false);
  const unmounted       = useRef(false);
  const rateLimitRef    = useRef<{ count: number; resetAt: number }>({ count: 0, resetAt: 0 });
  // Latest user kept in a ref so `connect` doesn't depend on the async profile
  // query — that dependency is what made the socket tear down (and never come
  // back) the moment the profile resolved on a cold cache.
  const userRef         = useRef(user);

  const [room, setRoom]                     = useState<RoomInfo | null>(null);
  const [isHost, setIsHost]                 = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [transcript, setTranscript]         = useState<TranscriptChunk[]>([]);
  const [chat, setChat]                     = useState<ChatMessage[]>([]);
  const [question, setQuestion]             = useState('');
  const [isSpeaking, setIsSpeaking]         = useState(false);
  const [isThinking, setIsThinking]         = useState(false);
  const [status, setStatus]                 = useState('waiting');
  const [connected, setConnected]           = useState(false);
  const [reconnecting, setReconnecting]     = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(-1);
  const [progress, setProgress]             = useState({ current: 0, total: 0 });
  const [muted, setMuted]                   = useState(false);
  const [questionsLeft, setQuestionsLeft]   = useState(QUESTIONS_PER_MIN);
  const [isListening, setIsListening]       = useState(false);
  // Voice input runs on MediaRecorder + the Whisper endpoint — NOT the Web
  // Speech API — so feature-detect the APIs actually used (the old
  // SpeechRecognition check wrongly hid the mic on Firefox).
  const [voiceSupported]                    = useState(
    () => !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder),
  );
  // True while a recorded question is being transcribed by the server.
  const [transcribing, setTranscribing]     = useState(false);
  const [qaDeadline, setQaDeadline]         = useState<number | null>(null);
  const [qaCountdown, setQaCountdown]       = useState(0);
  const [participants, setParticipants]     = useState<Participant[]>([]);
  const [reactions, setReactions]           = useState<FloatingReaction[]>([]);
  const [handRaised, setHandRaised]         = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);
  const [audioBlocked, setAudioBlocked]     = useState(false);
  const [playbackRate, setPlaybackRate]     = useState(1);
  const [mobileTab, setMobileTab]           = useState<'stage' | 'chat'>('stage');
  const [isSpotlight, setIsSpotlight]       = useState(false);   // I was invited to speak
  const [speaking, setSpeaking]             = useState(false);   // my mic is live
  const [spotlight, setSpotlight]           = useState<{ user_name: string; text: string } | null>(null); // live caption for the room
  const [aiTyping, setAiTyping]             = useState(false);
  const [audioVolume, setAudioVolume]       = useState(0);
  const [audioProgress, setAudioProgress]   = useState<{ progress: number; isPriority: boolean } | null>(null);
  const [unreadChat, setUnreadChat]         = useState(0);
  const [rateLimitSecs, setRateLimitSecs]   = useState(0);
  const [quiz, setQuiz]                     = useState<ActiveQuiz | null>(null);
  const [quizScore, setQuizScore]           = useState({ correct: 0, total: 0 });
  // Mirror of quiz.myAnswer readable inside handleMessage (which closes over
  // stale state) — set optimistically on tap, confirmed by quiz_answer_ack.
  const quizAnswerRef                       = useRef<number | null>(null);
  // Transient stage banner for the teacher's between-slide remark.
  const [aside, setAside]                   = useState<string | null>(null);
  const asideTimerRef                       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rateLimitTimerRef                   = useRef<ReturnType<typeof setInterval> | null>(null);
  const spotlightPanelRef                   = useRef<HTMLDivElement>(null);
  const reactionIdRef = useRef(0);
  const currentUserIdRef = useRef<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speakRecorderRef = useRef<MediaRecorder | null>(null);
  const speakChunksRef = useRef<Blob[]>([]);
  const speakTextRef = useRef('');
  // Mirror of mobileTab readable inside handleMessage (which closes over
  // stale state) — used to gate the unread-chat badge.
  const mobileTabRef = useRef<'stage' | 'chat'>('stage');

  // Keep the ref in sync with the latest profile (used by `connect` for name).
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { mobileTabRef.current = mobileTab; }, [mobileTab]);

  // Sync mute + playback rate to audio queue
  useEffect(() => { audioQueueRef.current.setMuted(muted); }, [muted]);
  useEffect(() => { audioQueueRef.current.setRate(playbackRate); }, [playbackRate]);

  useEffect(() => {
    const aq = audioQueueRef.current;
    aq.onPlay    = () => { setIsSpeaking(true); setAudioBlocked(false); };
    aq.onStop    = () => { setIsSpeaking(false); setAudioVolume(0); setAudioProgress(null); };
    aq.onBlocked = () => setAudioBlocked(true);
    aq.onVolumeChange = (vol) => setAudioVolume(vol);
    aq.onProgress = (progress, isPriority) => setAudioProgress({ progress, isPriority });

    return () => { unmounted.current = true; aq.clear(); };
  }, []);

  const enableAudio = useCallback(() => {
    audioQueueRef.current.unlock();
    setAudioBlocked(false);
  }, []);

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);

  // Auto-scroll up to the active slide (stage) when a new slide appears,
  // so the learner always sees the current slide rather than the transcript below it.
  useEffect(() => {
    if (currentChunkIndex >= 0) {
      setTimeout(() => stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [currentChunkIndex]);

  // Rate limit counter reset
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      if (now >= rateLimitRef.current.resetAt) {
        rateLimitRef.current = { count: 0, resetAt: now + 60_000 };
        setQuestionsLeft(QUESTIONS_PER_MIN);
      }
    }, 5000);
    rateLimitRef.current = { count: 0, resetAt: Date.now() + 60_000 };
    return () => clearInterval(id);
  }, []);

  // Q&A period countdown tick
  useEffect(() => {
    if (qaDeadline === null) return;
    const id = setInterval(() => {
      const secs = Math.max(0, Math.round((qaDeadline - Date.now()) / 1000));
      setQaCountdown(secs);
      if (secs === 0) clearInterval(id);
    }, 1000);
    setQaCountdown(Math.max(0, Math.round((qaDeadline - Date.now()) / 1000)));
    return () => clearInterval(id);
  }, [qaDeadline]);

  // Stop the spotlight recorder WITHOUT transcribing, always releasing the
  // mic. MediaRecorder has no abort(); and nulling onstop before stop() (the
  // old approach) skipped the track cleanup inside it, leaving the browser's
  // recording indicator on until a full page reload.
  const abortSpeakRecorder = useCallback(() => {
    const rec = speakRecorderRef.current;
    if (rec) {
      rec.onstop = () => rec.stream.getTracks().forEach(tr => tr.stop());
      if (rec.state === 'recording') rec.stop();
      else rec.stream.getTracks().forEach(tr => tr.stop());
    }
    speakRecorderRef.current = null;
  }, []);

  const handleMessage = useCallback((msg: Record<string, unknown>) => {
    switch (msg.type) {
      case 'room_state': {
        const r = msg.room as RoomInfo;
        setRoom(r);
        setStatus(r.status);
        setIsHost(!!msg.is_host);
        setParticipantCount(msg.participant_count as number);
        const tr = r.transcript ?? [];
        setTranscript(tr);
        // On reconnect mid-lesson, restore the active slide (and progress bar)
        // so the stage isn't blank until the next chunk arrives.
        if (r.status === 'live' && tr.length > 0) {
          setCurrentChunkIndex(tr.length - 1);
          setProgress({ current: tr.length, total: r.total_sections ?? tr.length });
        }
        break;
      }
      case 'participant_join':
        setParticipantCount(msg.participant_count as number);
        // Greet joiners by name — makes the (waiting) room feel inhabited.
        if (msg.user_name) {
          setChat(p => [...p, { type: 'system', text: t('room.system.joined', { name: msg.user_name as string }) }]);
        }
        break;
      case 'participant_leave':
        setParticipantCount(msg.participant_count as number);
        break;
      case 'participant_list':
        setParticipants(msg.participants as Participant[]);
        // Sync own hand-raised state in case server changed it (e.g. invite)
        {
          const me = (msg.participants as Participant[]).find(p => p.user_id === currentUserIdRef.current);
          if (me) setHandRaised(me.hand_raised);
        }
        break;
      case 'reaction': {
        const id = ++reactionIdRef.current;
        const r: FloatingReaction = {
          id,
          emoji: msg.emoji as string,
          user_name: msg.user_name as string,
          x: 10 + Math.random() * 80, // 10-90% horizontal
        };
        setReactions(p => [...p, r]);
        break;
      }
      case 'speaker_invited': {
        const name = msg.target_user_name as string;
        const isMe = msg.target_user_id === currentUserIdRef.current;
        setChat(p => [...p, { type: 'system', text: isMe ? t('room.system.speakerInvitedSelf') : t('room.system.speakerInvitedOther', { name }) }]);
        if (isMe) {
          setHandRaised(false);
          setIsSpotlight(true);
          // Switch to stage tab on mobile so the spotlight panel is immediately visible,
          // then scroll it into view after the panel has rendered.
          setMobileTab('stage');
          setTimeout(() => spotlightPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
        }
        break;
      }
      case 'speaker_transcript': {
        if (msg.final) setSpotlight(null);
        else setSpotlight({ user_name: msg.user_name as string, text: (msg.text as string) || '' });
        break;
      }
      case 'speaker_ended': {
        setSpotlight(null);
        if (msg.user_id === currentUserIdRef.current) {
          setIsSpotlight(false);
          abortSpeakRecorder();
          setSpeaking(false);
        }
        break;
      }
      case 'lesson_start':
        setStatus('live');
        setChat(p => [...p, { type: 'system', text: t('room.system.lessonStart') }]);
        break;
      case 'lesson_generating':
        setIsThinking(true);
        setChat(p => [...p, { type: 'system', text: t('room.system.lessonGenerating') }]);
        break;
      case 'lesson_info':
        if (msg.fallback) {
          setChat(p => [...p, { type: 'system', text: t('room.system.lessonFallback') }]);
        }
        break;
      case 'lesson_error':
        // Generation crashed server-side; the room was rolled back to
        // "waiting" so the host can simply press Start again.
        setIsThinking(false);
        setStatus('waiting');
        setChat(p => [...p, { type: 'error', text: t('room.system.lessonError') }]);
        break;
      case 'lesson_chunk': {
        setIsThinking(false);
        setQuiz(null); // next slide arriving dismisses any quiz overlay
        const chunk: TranscriptChunk = {
          title: msg.title as string,
          content: msg.content as string,
          key_points: (msg.key_points as string[]) || [],
          keywords: (msg.keywords as { term: string; meaning: string }[]) || [],
          example: (msg.example as string) || '',
          image_url: (msg.image_url as string) || '',
        };
        const idx = msg.index as number;
        // Replace-at-index (not blind append) so a chunk re-sent after a
        // reconnect doesn't create a duplicate slide.
        setTranscript(p => {
          if (idx < p.length) { const c = [...p]; c[idx] = chunk; return c; }
          return [...p, chunk];
        });
        setCurrentChunkIndex(idx);
        setProgress({ current: idx + 1, total: msg.total as number });
        if (msg.audio_url) audioQueueRef.current.push(msg.audio_url as string);
        break;
      }
      case 'qa_period_start': {
        const secs = (msg.duration_seconds as number) ?? 300;
        setQaDeadline(Date.now() + secs * 1000);
        setChat(p => [...p, { type: 'system', text: t('room.system.qaStart', { mins: Math.floor(secs / 60) }) }]);
        break;
      }
      case 'lesson_complete':
        setStatus('completed');
        setQaDeadline(null);
        setCurrentChunkIndex(-1);
        setQuiz(null);
        setChat(p => [...p, { type: 'system', text: t('room.system.lessonAutoComplete') }]);
        break;
      case 'question_asked':
        setChat(p => [...p, { type: 'question', user_name: msg.user_name as string, question: msg.question as string }]);
        setIsThinking(true);
        setAiTyping(true);
        break;
      case 'ai_answer_chunk': {
        setIsThinking(false); // Once streaming starts, orb can pulse or at least not say PROCESSING
        setAiTyping(true);
        const chunkQaId = msg.qa_id as string | undefined;
        let isNewBubble = false;
        setChat(p => {
          // Match the bubble by qa_id so two answers streaming at once each
          // keep their own bubble — matching on "the last message's user_name"
          // spawned a new bubble per chunk whenever streams interleaved.
          const idx = findAnswerIndex(p, chunkQaId, msg.user_name as string);
          if (idx >= 0) {
            const copy = [...p];
            copy[idx] = { ...copy[idx], answer: msg.text_so_far as string };
            return copy;
          }
          isNewBubble = true;
          return [...p, { type: 'answer', qa_id: chunkQaId, user_name: msg.user_name as string, answer: msg.text_so_far as string }];
        });
        // One unread per answer (not per streamed chunk), and only while the
        // user is away from the chat tab.
        if (isNewBubble && mobileTabRef.current !== 'chat') setUnreadChat(n => n + 1);
        break;
      }
      case 'ai_answer': {
        setIsThinking(false);
        setAiTyping(false);
        const answerQaId = msg.qa_id as string | undefined;
        // If ai_answer_chunk handled the text, just update the final text if needed
        setChat(p => {
          const idx = findAnswerIndex(p, answerQaId, msg.user_name as string);
          if (idx >= 0) {
            const copy = [...p];
            copy[idx] = { ...copy[idx], answer: msg.answer as string };
            return copy;
          }
          return [...p, { type: 'answer', qa_id: answerQaId, user_name: msg.user_name as string, answer: msg.answer as string }];
        });
        // Answers jump ahead of the slide narration: the current slide is paused,
        // the answer plays immediately, then the slide resumes (see AudioQueue).
        if (msg.audio_url) audioQueueRef.current.pushPriority(msg.audio_url as string);
        break;
      }
      case 'quiz_start': {
        const duration = (msg.duration_seconds as number) ?? 15;
        quizAnswerRef.current = null;
        setQuiz({
          id: msg.quiz_id as number,
          ordinal: (msg.ordinal as number) ?? 1,
          total: (msg.total as number) ?? 1,
          question: msg.question as string,
          options: (msg.options as string[]) ?? [],
          durationSeconds: duration,
          deadline: Date.now() + duration * 1000,
          myAnswer: null,
          answered: 0,
          result: null,
        });
        // The poll lives on the stage — pull mobile users away from the chat
        // tab so nobody misses the answer window.
        setMobileTab('stage');
        if (msg.audio_url) audioQueueRef.current.pushPriority(msg.audio_url as string);
        break;
      }
      case 'quiz_progress':
        setQuiz(q => (q && q.id === msg.quiz_id ? { ...q, answered: msg.answered as number } : q));
        break;
      case 'quiz_answer_ack': {
        const locked = msg.option_index as number;
        quizAnswerRef.current = locked;
        setQuiz(q => (q && q.id === msg.quiz_id ? { ...q, myAnswer: locked } : q));
        break;
      }
      case 'quiz_result': {
        const correctIndex = msg.correct_index as number;
        setQuiz(q => (q && q.id === msg.quiz_id ? {
          ...q,
          result: {
            counts: (msg.counts as number[]) ?? [],
            totalAnswered: (msg.total_answered as number) ?? 0,
            correctIndex,
            explanation: (msg.explanation as string) ?? '',
          },
        } : q));
        setQuizScore(s => ({
          correct: s.correct + (quizAnswerRef.current === correctIndex ? 1 : 0),
          total: s.total + 1,
        }));
        if (msg.audio_url) audioQueueRef.current.pushPriority(msg.audio_url as string);
        break;
      }
      case 'teacher_aside': {
        const text = msg.text as string;
        setChat(p => [...p, { type: 'aside', text }]);
        setAside(text);
        if (asideTimerRef.current) clearTimeout(asideTimerRef.current);
        asideTimerRef.current = setTimeout(() => setAside(null), 15000);
        if (msg.audio_url) audioQueueRef.current.pushPriority(msg.audio_url as string);
        break;
      }
      case 'error':
        setChat(p => [...p, { type: 'error', text: msg.message as string }]);
        break;
      case 'room_ended':
        setStatus('ended');
        setQuiz(null);
        setChat(p => [...p, { type: 'system', text: t('room.system.roomEnded') }]);
        audioQueueRef.current.clear();
        break;
    }
  }, [t, abortSpeakRecorder]);

  // WebSocket connect with exponential backoff
  const connect = useCallback(() => {
    if (!roomId || unmounted.current) return;
    const token = localStorage.getItem('accessToken') ?? '';
    const ws = new WebSocket(`${WS_BASE}/api/livestream/rooms/${roomId}/ws?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (unmounted.current) { ws.close(); return; }
      reconnectDelay.current = 1000;
      authRetried.current = false;
      setConnected(true);
      setReconnecting(false);
      // Identity must match what the server derives from the JWT, otherwise our
      // own messages (spotlight, raised hand, practice) wouldn't be recognised
      // as "me". The profile query may not have resolved yet, so read the token
      // claim first and fall back to the profile / a random guest id.
      const u = userRef.current;
      const uid = userIdFromToken(token) ?? u?.id ?? 'guest-' + Math.random().toString(36).slice(2);
      currentUserIdRef.current = uid;
      ws.send(JSON.stringify({
        type: 'join',
        user_id: uid,
        user_name: u?.fullName ?? t('common:student', { defaultValue: 'Student' }),
      }));
    };

    ws.onmessage = e => handleMessage(JSON.parse(e.data));

    ws.onclose = ev => {
      setConnected(false);
      if (unmounted.current) return;

      // 4001 = invalid/expired token. The 15-min access token likely expired
      // mid-session — refresh it once and reconnect with the fresh token
      // instead of silently dropping the user. (4003 = room full, 4004 = room
      // not found: reconnecting won't help, so give up.)
      if (ev.code === 4001 && !authRetried.current) {
        authRetried.current = true;
        setReconnecting(true);
        apiClient.post('/auth/refresh')
          .then((res) => {
            const accessToken =
              res.data?.data?.accessToken ?? res.data?.accessToken;
            if (accessToken) localStorage.setItem('accessToken', accessToken);
            if (!unmounted.current) connect();
          })
          .catch(() => {
            // Refresh failed (refresh token expired/revoked) — the apiClient
            // interceptor handles logout + redirect to /login.
            setReconnecting(false);
          });
        return;
      }
      if (ev.code === 4001 || ev.code === 4003 || ev.code === 4004) return;

      setReconnecting(true);
      reconnectTimer.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, MAX_RECONNECT_DELAY);
        connect();
      }, reconnectDelay.current);
    };
  }, [roomId, handleMessage, t]);

  useEffect(() => {
    if (!roomId) return;
    // Re-arm: a previous run's cleanup (or a StrictMode remount) may have left
    // this true, which would make connect() bail out and never reconnect.
    unmounted.current = false;
    fetch(`${RAG_BASE}/api/livestream/rooms/${roomId}`)
      .then(r => r.json())
      .then((data: RoomInfo) => { setRoom(data); setStatus(data.status); setTranscript(data.transcript ?? []); })
      .catch(() => navigate('/live'));
    connect();
    return () => {
      unmounted.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
      audioQueueRef.current.clear();
    };
  }, [roomId, navigate, connect]);

  const toggleVoice = useCallback(async () => {
    audioQueueRef.current.unlock();
    if (isListening) {
      mediaRecorderRef.current?.stop();
      setIsListening(false);
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // Status/errors must never land in the question input — the user could
        // accidentally send "connection error" to the AI as a question.
        setTranscribing(true);
        try {
          const { ragService } = await import('@/lib/api/services/rag.service');
          const data = await ragService.transcribeDictation(audioBlob, room?.language || 'vi');
          const text = data?.success && data.sentences
            ? data.sentences.map(s => s.text).join(' ').trim()
            : '';
          if (text) {
            setQuestion(text.slice(0, MAX_QUESTION_LENGTH));
          } else {
            setChat(p => [...p, { type: 'error', text: t('room.chat.voiceFailed') }]);
          }
        } catch (e) {
          console.error(e);
          setChat(p => [...p, { type: 'error', text: t('room.chat.voiceError') }]);
        } finally {
          setTranscribing(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsListening(true);
    } catch (err) {
      console.error('Mic access denied', err);
      setIsListening(false);
    }
  }, [isListening, room?.language, t]);

  // Stop mics if user navigates away
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      if (speakRecorderRef.current?.state === 'recording') speakRecorderRef.current.stop();
    };
  }, []);

  // ── Spotlight speaking (Live speech via WebM upload instead of WebRTC/browser-speech) ──
  const startSpeaking = useCallback(async () => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      speakChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) speakChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(speakChunksRef.current, { type: 'audio/webm' });
        
        try {
          const { ragService } = await import('@/lib/api/services/rag.service');
          const data = await ragService.transcribeDictation(audioBlob, room?.language || 'vi');
          if (data && data.success && data.sentences) {
            const finalText = data.sentences.map(s => s.text).join(' ');
            speakTextRef.current = finalText;
            wsRef.current?.send(JSON.stringify({ type: 'speaker_transcript', text: finalText, final: true }));
          }
        } catch (err) {
          console.error(err);
        } finally {
          setSpeaking(false);
          setIsSpotlight(false);
          speakTextRef.current = '';
        }
      };

      recorder.start();
      speakRecorderRef.current = recorder;
      setSpeaking(true);
      // Let the room know we're recording (sent in the speaker's UI language —
      // the server relays it verbatim as the live caption).
      wsRef.current?.send(JSON.stringify({ type: 'speaker_transcript', text: t('room.spotlight.recordingLive'), final: false }));
    } catch (err) {
      console.error('Mic access denied for spotlight', err);
    }
  }, [room?.language, t]);

  const stopSpeaking = useCallback(() => {
    if (speakRecorderRef.current?.state === 'recording') {
      speakRecorderRef.current.stop(); // triggers onstop → transcribes and sends final text
    }
  }, []);

  const cancelSpeaking = useCallback(() => {
    // abortSpeakRecorder swaps onstop for a track-cleanup-only handler — the
    // old `onstop = null` skipped that cleanup and left the mic live.
    abortSpeakRecorder();
    setSpeaking(false);
    setIsSpotlight(false);
    speakTextRef.current = '';
    wsRef.current?.send(JSON.stringify({ type: 'end_speaking' }));
  }, [abortSpeakRecorder]);

  const startRateLimitCountdown = useCallback((secsLeft: number) => {
    if (rateLimitTimerRef.current) clearInterval(rateLimitTimerRef.current);
    setRateLimitSecs(secsLeft);
    rateLimitTimerRef.current = setInterval(() => {
      setRateLimitSecs(s => {
        if (s <= 1) { clearInterval(rateLimitTimerRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
  }, []);

  const sendChip = useCallback((text: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    const now = Date.now();
    const rl = rateLimitRef.current;
    if (now < rl.resetAt && rl.count >= QUESTIONS_PER_MIN) {
      startRateLimitCountdown(Math.ceil((rl.resetAt - now) / 1000));
      return;
    }
    if (now >= rl.resetAt) rateLimitRef.current = { count: 1, resetAt: now + 60_000 };
    else rateLimitRef.current.count += 1;
    setQuestionsLeft(Math.max(0, QUESTIONS_PER_MIN - rateLimitRef.current.count));
    wsRef.current.send(JSON.stringify({ type: 'ask_question', question: text }));
  }, [startRateLimitCountdown]);

  const sendReaction = useCallback((emoji: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'reaction', emoji }));
  }, []);

  const toggleHand = useCallback(() => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: handRaised ? 'lower_hand' : 'raise_hand' }));
    setHandRaised(h => !h);
  }, [handRaised]);

  const inviteSpeaker = useCallback((targetUserId: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'invite_speaker', target_user_id: targetUserId }));
  }, []);

  const sendQuizAnswer = useCallback((quizId: number, optionIndex: number) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    // Optimistic lock — the server ack (first-answer-wins) is authoritative.
    quizAnswerRef.current = optionIndex;
    setQuiz(q => (q && q.id === quizId && q.myAnswer === null && !q.result
      ? { ...q, myAnswer: optionIndex }
      : q));
    wsRef.current.send(JSON.stringify({ type: 'quiz_answer', quiz_id: quizId, option_index: optionIndex }));
  }, []);

  useEffect(() => () => {
    if (asideTimerRef.current) clearTimeout(asideTimerRef.current);
  }, []);

  const expireReaction = useCallback((id: number) => {
    setReactions(p => p.filter(r => r.id !== id));
  }, []);

  const sendQuestion = () => {
    audioQueueRef.current.unlock();
    const q = question.trim();
    if (!q || wsRef.current?.readyState !== WebSocket.OPEN) return;

    const now = Date.now();
    const rl = rateLimitRef.current;
    if (now < rl.resetAt && rl.count >= QUESTIONS_PER_MIN) {
      startRateLimitCountdown(Math.ceil((rl.resetAt - now) / 1000));
      return;
    }
    if (now >= rl.resetAt) {
      rateLimitRef.current = { count: 1, resetAt: now + 60_000 };
    } else {
      rateLimitRef.current.count += 1;
    }
    setQuestionsLeft(Math.max(0, QUESTIONS_PER_MIN - rateLimitRef.current.count));

    wsRef.current.send(JSON.stringify({ type: 'ask_question', question: q }));
    setQuestion('');
  };

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  const isLive    = status === 'live';
  const isWaiting = status === 'waiting';
  const isEnded   = status === 'ended' || status === 'completed';
  const isQaPeriod = isLive && qaDeadline !== null;
  const charsLeft = MAX_QUESTION_LENGTH - question.length;
  const fmtCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const activeChunk = currentChunkIndex >= 0 ? transcript[currentChunkIndex] : null;
  const hasActiveSlide = !!activeChunk && !isEnded;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50">
      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shrink-0">
        <button onClick={() => navigate('/live')} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" aria-label={t('room.back')}>
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-slate-900 truncate text-sm">{room.topic}</h2>
            <Badge variant="outline" className={cn('text-xs', LEVEL_COLORS[room.level])}>
              {room.level_label}
            </Badge>
            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
              {room.language === 'vi' ? 'VI' : 'EN'}
            </span>
            {isLive && !isQaPeriod && (
              <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {t('list.status.live')}
              </span>
            )}
            {isQaPeriod && (
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                <MessageSquare className="w-3 h-3" />
                {t('room.qaTimer', { time: fmtCountdown(qaCountdown) })}
              </span>
            )}
            {isEnded && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{t('room.endedBadge')}</span>}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('room.teacher', { name: room.host_name })}
            {room.lesson_prompt && (
              <span className="ml-2 text-slate-300">·</span>
            )}
            {room.lesson_prompt && (
              <span className="ml-2 italic line-clamp-1" title={room.lesson_prompt}>
                {room.lesson_prompt}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowParticipants(s => !s)}
            className={cn(
              'flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors',
              showParticipants ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100',
            )}
            title={showParticipants ? t('room.participants.hide') : t('room.participants.show')}
          >
            <Users className="w-3.5 h-3.5" />
            {participantCount}
            {participants.some(p => p.hand_raised) && (
              <span className="ml-1 flex items-center gap-0.5 text-amber-600">
                <Hand className="w-3 h-3 animate-pulse" />
                {participants.filter(p => p.hand_raised).length}
              </span>
            )}
          </button>

          {/* Mute toggle */}
          <button
            onClick={() => setMuted(m => !m)}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              muted ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'hover:bg-slate-100 text-slate-500',
            )}
            title={muted ? t('room.mute.unmute') : t('room.mute.mute')}
            aria-label={muted ? t('room.mute.unmute') : t('room.mute.mute')}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Playback speed (cycles through presets) */}
          <button
            onClick={() => setPlaybackRate(r => {
              const i = PLAYBACK_RATES.indexOf(r as typeof PLAYBACK_RATES[number]);
              return PLAYBACK_RATES[(i + 1) % PLAYBACK_RATES.length];
            })}
            className="px-1.5 py-1 rounded-md text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors tabular-nums"
            title={t('room.playbackRate')}
            aria-label={t('room.playbackRate')}
          >
            {playbackRate}×
          </button>

          {reconnecting ? (
            <span className="flex items-center gap-1 text-xs text-amber-500">
              <WifiOff className="w-3 h-3" /> {t('room.reconnecting')}
            </span>
          ) : (
            <span className={cn('w-2 h-2 rounded-full shrink-0', connected ? 'bg-emerald-500' : 'bg-slate-300')} />
          )}

          {isHost && isLive && (
            <Button
              size="sm" variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
              onClick={() => wsRef.current?.send(JSON.stringify({ type: 'end_room' }))}
            >
              <StopCircle className="w-3.5 h-3.5" /> {t('room.endButton')}
            </Button>
          )}
        </div>
      </div>

      {/* ── Mobile tab switcher (below lg only) ── */}
      <div className="lg:hidden flex shrink-0 border-b border-slate-200 bg-white">
        <button
          onClick={() => setMobileTab('stage')}
          className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors',
            mobileTab === 'stage' ? 'text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-400')}
        >
          <BookOpen className="w-3.5 h-3.5" /> {t('room.mobileTabs.stage')}
        </button>
        <button
          onClick={() => { setMobileTab('chat'); setUnreadChat(0); }}
          className={cn('flex-1 relative flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors',
            mobileTab === 'chat' ? 'text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-400')}
        >
          <MessageSquare className="w-3.5 h-3.5" /> {t('room.mobileTabs.chat')}
          {unreadChat > 0 && mobileTab !== 'chat' && (
            <span className="absolute top-1 right-[calc(50%-24px)] min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
              {unreadChat}
            </span>
          )}
        </button>
      </div>

      {/* ── Connection banner — shown while a dropped socket auto-reconnects ── */}
      {reconnecting && (
        <div className="flex items-center justify-center gap-2 shrink-0 px-4 py-1.5 bg-amber-50 border-b border-amber-200 text-xs font-medium text-amber-700">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          {t('room.connectionLost')}
        </div>
      )}

      {/* Audio unlock banner — shown only when the browser blocked autoplay */}
      {audioBlocked && !muted && (
        <div className="flex items-center justify-center gap-3 shrink-0 px-4 py-2 bg-indigo-600 text-white">
          <Volume2 className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">{t('room.unlockAudio')}</span>
          <button
            onClick={enableAudio}
            className="ml-2 px-3 py-1 rounded-full bg-white text-indigo-700 text-sm font-semibold hover:bg-indigo-50 active:scale-95 transition-all"
          >
            {t('room.unlockAudioCta')}
          </button>
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Left: stage (slide + avatar) + transcript — single scrollable column */}
        <div className={cn(
          'flex-col flex-1 min-w-0 lg:border-r border-slate-200 overflow-y-auto overflow-x-hidden',
          mobileTab === 'stage' ? 'flex' : 'hidden', 'lg:flex',
        )}>
          {/* ── Stage ── */}
          <div ref={stageRef} className="relative shrink-0 bg-gradient-to-b from-indigo-50 to-white">
            <ReactionLayer reactions={reactions} onExpire={expireReaction} />

            {/* Live comprehension checkpoint — covers the stage while the
                whole room answers, then shows the vote chart + explanation */}
            {quiz && !isEnded && (
              <QuizOverlay quiz={quiz} score={quizScore} onAnswer={sendQuizAnswer} />
            )}

            {/* Teacher aside — the AI's between-slide remark about the room */}
            {aside && !spotlight && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 max-w-[90%] flex items-center gap-2 bg-white/95 border border-indigo-200 text-indigo-900 px-3 py-1.5 rounded-full shadow-lg">
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                <span className="text-xs line-clamp-2">{aside}</span>
              </div>
            )}

            {/* Live spotlight caption — what the invited student is saying, shown to everyone */}
            {spotlight && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 max-w-[90%] flex items-center gap-2 bg-indigo-600/95 text-white px-3 py-1.5 rounded-full shadow-lg">
                <Mic2 className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                <span className="text-xs font-semibold shrink-0">{spotlight.user_name}:</span>
                <span className="text-xs truncate">{spotlight.text || '…'}</span>
              </div>
            )}

            {hasActiveSlide && activeChunk ? (
              /* Slide-first layout: big slide on top with avatar PIP top-right */
              <div className="px-3 pt-3">
                <LessonSlide
                  chunk={activeChunk}
                  index={currentChunkIndex}
                  total={progress.total || transcript.length}
                  active={true}
                  ragBase={RAG_BASE}
                  audioProgress={audioProgress && !audioProgress.isPriority ? audioProgress.progress : null}
                  avatarSlot={
                    <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 border-white shadow-xl bg-white/30 backdrop-blur-sm">
                      <AIAvatarAnime
                        isSpeaking={isSpeaking}
                        isThinking={isThinking}
                        audioVolume={audioVolume}
                        className="w-full h-full"
                        name=""
                      />
                    </div>
                  }
                />
              </div>
            ) : (
              /* Pre-lesson / ended: large centered avatar — 3D hologram with
                 the 2D orb as Suspense fallback while the chunk loads */
              <div className="flex flex-col items-center gap-3 py-6 px-4">
                <Suspense
                  fallback={
                    <AIAvatarAnime
                      isSpeaking={isSpeaking}
                      isThinking={isThinking}
                      audioVolume={audioVolume}
                      className="w-44 h-52"
                      name="AI Sensei"
                    />
                  }
                >
                  <AIAvatar3D
                    isSpeaking={isSpeaking}
                    isThinking={isThinking}
                    audioVolume={audioVolume}
                    className="w-44 h-52"
                    name="AI Sensei"
                  />
                </Suspense>
              </div>
            )}

            {/* Controls strip below stage */}
            <div className="px-4 py-3 flex flex-col items-center gap-2 border-t border-slate-100">
              {/* Status line */}
              <div className="text-center min-h-[1.25rem] flex flex-col items-center justify-center">
                {isThinking && !isSpeaking && (
                  <p className="text-sm text-indigo-500 font-medium animate-pulse">{t('room.preparing')}</p>
                )}
                {isSpeaking && (
                  <button
                    onClick={() => audioQueueRef.current.clear()}
                    className="flex items-center gap-1 px-3 py-0.5 bg-red-50 text-red-600 rounded-full text-[11px] font-semibold border border-red-200 hover:bg-red-100 transition-colors"
                  >
                    <StopCircle className="w-3 h-3" /> {t('room.stopAi')}
                  </button>
                )}
                {isWaiting && !isSpeaking && (
                  <p className="text-sm text-slate-400">
                    {isHost ? t('room.waitingHost') : t('room.waitingStudent')}
                  </p>
                )}
                {isQaPeriod && !isSpeaking && !isThinking && (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-amber-600 font-medium">{t('room.qaPeriod')}</p>
                    <span className="text-base font-bold text-amber-500 tabular-nums">{fmtCountdown(qaCountdown)}</span>
                  </div>
                )}
                {isEnded && !isSpeaking && (
                  <p className="text-sm text-slate-400">{t('room.ended')}</p>
                )}
              </div>

              {/* Progress bar */}
              {progress.total > 0 && (
                <div className="w-full max-w-md">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>{t('room.slideProgress', { current: progress.current, total: progress.total })}</span>
                    <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                  </div>
                  <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Host: start button */}
              {isHost && isWaiting && (
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 gap-2 mt-1"
                  onClick={() => {
                    audioQueueRef.current.unlock();
                    wsRef.current?.send(JSON.stringify({ type: 'start_lesson' }));
                  }}
                >
                  <PlayCircle className="w-4 h-4" /> {t('room.startLesson')}
                </Button>
              )}

              {/* Session ended CTA. The replay button only shows when at least
                  one slide was delivered — a room ended from "waiting" has no
                  recording, and the link would land on a 404. */}
              {isEnded && (
                <div className="flex gap-2 mt-1">
                  {transcript.length > 0 && (
                    <Button
                      size="sm" variant="outline"
                      className="gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      onClick={() => navigate(`/live/replay/${roomId}`)}
                    >
                      <PlaySquare className="w-3.5 h-3.5" /> {t('room.watchReplay')}
                    </Button>
                  )}
                  <Button
                    size="sm" variant="outline"
                    className="gap-1.5"
                    onClick={() => navigate('/live')}
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> {t('room.otherRooms')}
                  </Button>
                </div>
              )}

              {/* Invited to speak: spotlight speaking panel */}
              {isSpotlight && !isEnded && (
                <div ref={spotlightPanelRef} className="w-full max-w-md flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-indigo-300 bg-indigo-50">
                  <p className="text-sm font-semibold text-indigo-700 flex items-center gap-1.5">
                    <Mic2 className="w-4 h-4" /> {t('room.spotlight.invited')}
                  </p>
                  {voiceSupported ? (
                    <>
                      <p className="text-xs text-slate-500 text-center">
                        {t('room.spotlight.hint')}
                      </p>
                      <div className="flex gap-2">
                        {!speaking ? (
                          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-1.5" onClick={startSpeaking}>
                            <Mic className="w-4 h-4" /> {t('room.spotlight.start')}
                          </Button>
                        ) : (
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1.5" onClick={stopSpeaking}>
                            <CheckCircle className="w-4 h-4" /> {t('room.spotlight.submit')}
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="gap-1.5 text-slate-500" onClick={cancelSpeaking}>
                          {t('room.spotlight.cancel')}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-amber-600 text-center">
                      {t('room.spotlight.unsupported')}
                    </p>
                  )}
                </div>
              )}

              {/* Explain again button */}
              {hasActiveSlide && isLive && (
                <button
                  onClick={() => sendChip(t('room.explainAgainPart', { title: activeChunk.title }))}
                  disabled={questionsLeft === 0 || !connected}
                  className="flex items-center justify-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors my-1 z-10"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {t('room.transcript.explainAgain')}
                </button>
              )}

              {/* Reaction bar + hand-raise */}
              {!isEnded && connected && (
                <div className="flex items-center gap-2 z-10">
                  <ReactionBar onSend={sendReaction} />
                  {!isHost && (
                    <button
                      onClick={toggleHand}
                      className={cn(
                        'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95',
                        handRaised
                          ? 'bg-amber-400 text-white border-amber-400 shadow-md hover:bg-amber-500'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-600',
                      )}
                      title={handRaised ? t('room.hand.raisedTitle') : t('room.hand.raiseTitle')}
                    >
                      <Hand className={cn('w-3.5 h-3.5', handRaised && 'animate-bounce')} />
                      {handRaised ? t('room.hand.raisedLabel') : t('room.hand.raiseLabel')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>


        </div>

        {/* Right: Q&A chat */}
        <div className={cn(
          'flex-col flex-1 min-w-0 overflow-hidden',
          mobileTab === 'chat' ? 'flex' : 'hidden', 'lg:flex',
        )}>
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 bg-white shrink-0">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">{t('room.chat.heading')}</span>
            {!isEnded && (
              <span className={cn(
                'ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium',
                questionsLeft === 0 ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400',
              )}>
                {t('room.chat.questionsLeft', { left: questionsLeft, max: QUESTIONS_PER_MIN })}
              </span>
            )}
          </div>

          <ScrollArea className="flex-1 px-3 py-3">
            {chat.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                {t('room.chat.empty')}
              </p>
            ) : (
              <div className="space-y-3">
                {chat.map((msg, i) => (
                  <div key={i}>
                    {msg.type === 'system' && (
                      <div className="flex justify-center">
                        <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                          {sysMessages[msg.text ?? ''] ?? msg.text}
                        </span>
                      </div>
                    )}
                    {msg.type === 'error' && (
                      <div className="flex justify-center">
                        <span className="text-xs text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                          {errMessages[msg.text ?? ''] ?? msg.text}
                        </span>
                      </div>
                    )}
                    {msg.type === 'aside' && (
                      <div className="flex justify-center">
                        <div className="max-w-[90%] flex items-start gap-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl">
                          <Sparkles className="w-3 h-3 shrink-0 mt-0.5" />
                          <span className="italic">{msg.text}</span>
                        </div>
                      </div>
                    )}
                    {msg.type === 'question' && (
                      <div className="flex justify-end">
                        <div className="max-w-[80%] bg-indigo-600 text-white rounded-2xl rounded-br-sm px-3 py-2">
                          <p className="text-[11px] font-semibold opacity-70 mb-0.5">{msg.user_name}</p>
                          <p className="text-sm">{msg.question}</p>
                        </div>
                      </div>
                    )}
                    {msg.type === 'answer' && (
                      <div className="flex gap-2 items-start">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-white text-[9px] font-bold">AI</span>
                        </div>
                        <div className="max-w-[80%] bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                          <p className="text-[11px] text-slate-400 mb-0.5">{t('room.chat.answerLabel', { name: msg.user_name })}</p>
                          <div className="text-sm text-slate-800 leading-relaxed break-words prose prose-sm prose-slate max-w-none dark:prose-invert">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.answer}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {aiTyping && (
                  <div className="flex gap-2 items-start">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-white text-[9px] font-bold">AI</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                      <p className="text-xs text-slate-400 animate-pulse">{t('room.chat.aiTyping')}</p>
                      <div className="flex gap-1 mt-1">
                        {[0,1,2].map(i => (
                          <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300"
                            style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Question input */}
          <div className="p-3 border-t border-slate-200 bg-white shrink-0 space-y-2">
            {/* Quick chips */}
            {!isEnded && connected && (
              <div className="flex gap-1.5 flex-wrap">
                {QUICK_CHIPS.map(({ key, value }) => (
                  <button
                    key={key}
                    onClick={() => sendChip(value)}
                    disabled={questionsLeft === 0 || rateLimitSecs > 0}
                    className="text-[11px] px-2 py-0.5 rounded-full border border-indigo-200 text-indigo-600
                               bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed
                               transition-colors whitespace-nowrap"
                  >
                    {t(`room.chat.quickChips.${key}`)}
                  </button>
                ))}
              </div>
            )}

            {/* Input row */}
            <div className="flex gap-2">
              {/* Mic button */}
              {voiceSupported && !isEnded && (
                <button
                  onClick={toggleVoice}
                  disabled={!connected || questionsLeft === 0 || transcribing}
                  className={cn(
                    'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'border border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500',
                    (!connected || questionsLeft === 0 || transcribing) && 'opacity-40 cursor-not-allowed',
                  )}
                  title={isListening ? t('room.chat.stopMic') : (room?.language === 'en' ? t('room.chat.speakEn') : t('room.chat.speakVi'))}
                  aria-label={isListening ? t('room.chat.stopMic') : t('room.chat.recordAria')}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}

              <Input
                placeholder={
                  isListening            ? t('room.chat.placeholder.listening')
                  : transcribing         ? t('room.chat.placeholder.transcribing')
                  : isEnded              ? t('room.chat.placeholder.ended')
                  : !connected           ? t('room.chat.placeholder.connecting')
                  : rateLimitSecs > 0    ? t('room.chat.rateLimitWait', { secs: rateLimitSecs })
                  : questionsLeft === 0  ? t('room.chat.placeholder.noQuota')
                  : t('room.chat.placeholder.default')
                }
                value={question}
                onChange={e => setQuestion(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendQuestion()}
                disabled={isEnded || !connected || questionsLeft === 0 || rateLimitSecs > 0}
                className={cn('text-sm', isListening && 'border-red-300 ring-1 ring-red-200')}
              />
              <Button
                size="icon"
                className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
                onClick={sendQuestion}
                disabled={!question.trim() || isEnded || !connected || questionsLeft === 0 || rateLimitSecs > 0}
                aria-label={t('room.chat.send')}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between px-0.5">
              {rateLimitSecs > 0 ? (
                <p className="text-[11px] text-amber-600 font-medium animate-pulse">
                  {t('room.chat.rateLimitWait', { secs: rateLimitSecs })}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">
                  {voiceSupported
                    ? t('room.chat.footer.withMic', { max: QUESTIONS_PER_MIN })
                    : t('room.chat.footer.withoutMic', { max: QUESTIONS_PER_MIN })}
                </p>
              )}
              <span className={cn('text-[11px]', charsLeft < 30 ? 'text-amber-500' : 'text-slate-300')}>
                {charsLeft}
              </span>
            </div>
          </div>
        </div>

        {/* Far-right: participant sidebar (static on lg, slide-over drawer on mobile) */}
        {showParticipants && (
          <>
            <div
              className="lg:hidden absolute inset-0 z-30 bg-slate-900/30"
              onClick={() => setShowParticipants(false)}
            />
            <ParticipantPanel
              className="w-56 shrink-0 absolute right-0 top-0 bottom-0 z-30 shadow-xl lg:static lg:shadow-none"
              participants={participants}
              currentUserId={currentUserIdRef.current}
              isHost={isHost}
              onInvite={inviteSpeaker}
            />
          </>
        )}
      </div>

      {/* Inline keyframes for speaking bar + typing dot animations */}
      <style>{`
        @keyframes speaking-bar {
          from { transform: scaleY(.3); }
          to   { transform: scaleY(1); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50%       { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
