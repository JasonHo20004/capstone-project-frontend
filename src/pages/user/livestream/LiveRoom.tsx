import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@/hooks/api/use-user';
import { AIAvatarAnime } from '@/components/user/livestream/AIAvatarAnime';
import { ReactionLayer, ReactionBar, type FloatingReaction } from '@/components/user/livestream/ReactionLayer';
import { ParticipantPanel, type Participant } from '@/components/user/livestream/ParticipantPanel';
import { PracticeCard } from '@/components/user/livestream/PracticeCard';
import { LessonSlide } from '@/components/user/livestream/LessonSlide';
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
  Mic2, Star, CheckCircle, Check,
} from 'lucide-react';

// Livestream traffic (HTTP + WebSocket) routes through the api-gateway, which
// proxies /api/livestream/* to the rag-service. Point at the gateway origin.
const RAG_BASE = import.meta.env.VITE_GATEWAY_URL ?? 'http://localhost:3000';
const WS_BASE = RAG_BASE.replace(/^http/, 'ws');
const MAX_RECONNECT_DELAY = 16000;
const MAX_QUESTION_LENGTH = 200;
const QUESTIONS_PER_MIN = 6;
const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5] as const;

// Quick-reply chips shown above input
const QUICK_CHIPS = [
  'Giải thích lại phần này',
  'Cho tôi một ví dụ',
  'Dùng từ đơn giản hơn',
  'Phần này có trong IELTS không?',
  'Làm sao ghi nhớ từ này?',
];

// Minimal type shim for Web Speech API (Chrome)
interface ISpeechRecognitionEvent {
  results: { [i: number]: { [i: number]: { transcript: string } }; length: number };
}
interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: ISpeechRecognitionEvent) => void) | null;
  onend:    (() => void) | null;
  onerror:  (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?:       new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

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
}

interface TranscriptChunk {
  title: string;
  content: string;
  practice_phrase?: string;
  key_points?: string[];
  keywords?: { term: string; meaning: string }[];
  example?: string;
  image_url?: string;
}

interface ChatMessage {
  type: 'question' | 'answer' | 'system' | 'error';
  user_name?: string;
  question?: string;
  answer?: string;
  text?: string;
}

// ── Audio queue ───────────────────────────────────────────────────────────────

class AudioQueue {
  private queue: string[] = [];
  private playing = false;
  private current: HTMLAudioElement | null = null;
  private _muted = false;
  private _rate = 1;
  private _blocked = false;
  onPlay?: () => void;
  onStop?: () => void;
  /** Fired when the browser blocked autoplay — the UI should prompt a tap. */
  onBlocked?: () => void;

  push(url: string) {
    if (!url) return;
    this.queue.push(url);
    if (!this.playing && !this._blocked) this._next();
  }

  private _next() {
    if (!this.queue.length) { this.playing = false; this.onStop?.(); return; }
    this.playing = true;
    const url = this.queue[0]; // peek — only drop the item once it actually plays/ends
    const audio = new Audio(url);
    audio.muted = this._muted;
    audio.playbackRate = this._rate;
    this.current = audio;
    // onPlay fires on the real `play` event, so the avatar only "speaks" when
    // audio is genuinely audible (not when playback was silently blocked).
    audio.onplay   = () => { this._blocked = false; this.onPlay?.(); };
    audio.onended  = () => { this.queue.shift(); this.current = null; this._next(); };
    audio.onerror  = () => { this.queue.shift(); this.current = null; this._next(); };
    audio.play().catch(() => {
      // Autoplay blocked (no user gesture yet). Keep the item queued and wait
      // for unlock() instead of silently draining the whole lesson.
      this.playing = false;
      this._blocked = true;
      this.onStop?.();
      this.onBlocked?.();
    });
  }

  /** Resume playback after a user gesture has granted audio permission. */
  unlock() {
    this._blocked = false;
    if (!this.playing && this.queue.length) this._next();
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
    this.playing = false;
    this._blocked = false;
    this.current?.pause();
    this.current = null;
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

const LEVEL_COLORS: Record<string, string> = {
  beginner:     'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced:     'bg-violet-100 text-violet-700',
};

const SYS_MESSAGES: Record<string, string> = {
  'The lesson has started!':                      'Bài học bắt đầu!',
  'AI is preparing the lesson…':                  'AI đang chuẩn bị bài học…',
  'Lesson complete! You can still ask questions.': 'Bài học hoàn thành! Bạn vẫn có thể đặt câu hỏi.',
  'The classroom has ended.':                     'Phòng học đã kết thúc.',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function LiveRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();

  const wsRef           = useRef<WebSocket | null>(null);
  const audioQueueRef   = useRef(new AudioQueue());
  const chatEndRef      = useRef<HTMLDivElement>(null);
  const activeChunkRef  = useRef<HTMLDivElement>(null);
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
  const [voiceSupported]                    = useState(
    () => !!(window.SpeechRecognition ?? window.webkitSpeechRecognition),
  );
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
  const reactionIdRef = useRef(0);
  const currentUserIdRef = useRef<string>('');
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const speakRecRef = useRef<ISpeechRecognition | null>(null);
  const speakTextRef = useRef('');

  // Keep the ref in sync with the latest profile (used by `connect` for name).
  useEffect(() => { userRef.current = user; }, [user]);

  // Sync mute + playback rate to audio queue
  useEffect(() => { audioQueueRef.current.setMuted(muted); }, [muted]);
  useEffect(() => { audioQueueRef.current.setRate(playbackRate); }, [playbackRate]);

  useEffect(() => {
    const aq = audioQueueRef.current;
    aq.onPlay = () => { setIsSpeaking(true); setAudioBlocked(false); };
    aq.onStop = () => setIsSpeaking(false);
    aq.onBlocked = () => setAudioBlocked(true);
    return () => { unmounted.current = true; };
  }, []);

  const enableAudio = useCallback(() => {
    audioQueueRef.current.unlock();
    setAudioBlocked(false);
  }, []);

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);

  // Auto-scroll transcript to active section
  useEffect(() => {
    if (currentChunkIndex >= 0) {
      setTimeout(() => activeChunkRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
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
        // On reconnect mid-lesson, restore the active slide so the stage isn't
        // blank until the next chunk arrives.
        if (r.status === 'live' && tr.length > 0) setCurrentChunkIndex(tr.length - 1);
        break;
      }
      case 'participant_join':
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
        setChat(p => [...p, { type: 'system', text: isMe ? `Giảng viên mời bạn phát biểu!` : `Giảng viên mời ${name} phát biểu` }]);
        if (isMe) { setHandRaised(false); setIsSpotlight(true); }
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
          speakRecRef.current?.abort();
          setSpeaking(false);
        }
        break;
      }
      case 'practice_result': {
        const isMe = msg.user_id === currentUserIdRef.current;
        const score = msg.score as number;
        if (!isMe) {
          const name = msg.user_name as string;
          const scoreLabel = score >= 80 ? '🌟' : score >= 50 ? '👍' : '💪';
          setChat(p => [...p, { type: 'system', text: `${scoreLabel} ${name} luyện nói: "${msg.phrase}" (${score}/100)` }]);
        }
        break;
      }
      case 'lesson_start':
        setStatus('live');
        setChat(p => [...p, { type: 'system', text: 'Bài học bắt đầu!' }]);
        break;
      case 'lesson_generating':
        setIsThinking(true);
        setChat(p => [...p, { type: 'system', text: 'AI đang chuẩn bị bài học…' }]);
        break;
      case 'lesson_info':
        if (msg.fallback) {
          setChat(p => [...p, { type: 'system', text: 'AI chưa tạo được bài tuỳ chỉnh — đang dùng nội dung mẫu. Bạn vẫn có thể đặt câu hỏi để được giải đáp chi tiết.' }]);
        }
        break;
      case 'lesson_chunk': {
        setIsThinking(false);
        const chunk: TranscriptChunk = {
          title: msg.title as string,
          content: msg.content as string,
          practice_phrase: (msg.practice_phrase as string) || '',
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
        setChat(p => [...p, { type: 'system', text: `Bài giảng kết thúc! Còn ${Math.floor(secs / 60)} phút để đặt câu hỏi.` }]);
        break;
      }
      case 'lesson_complete':
        setStatus('completed');
        setQaDeadline(null);
        setCurrentChunkIndex(-1);
        setChat(p => [...p, { type: 'system', text: 'Phòng học đã tự động kết thúc.' }]);
        break;
      case 'question_asked':
        setChat(p => [...p, { type: 'question', user_name: msg.user_name as string, question: msg.question as string }]);
        setIsThinking(true);
        break;
      case 'ai_answer':
        setIsThinking(false);
        setChat(p => [...p, { type: 'answer', user_name: msg.user_name as string, answer: msg.answer as string }]);
        if (msg.audio_url) audioQueueRef.current.push(msg.audio_url as string);
        break;
      case 'error':
        setChat(p => [...p, { type: 'error', text: msg.message as string }]);
        break;
      case 'room_ended':
        setStatus('ended');
        setChat(p => [...p, { type: 'system', text: 'Phòng học đã kết thúc.' }]);
        audioQueueRef.current.clear();
        break;
    }
  }, []);

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
        user_name: u?.fullName ?? 'Học viên',
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
  }, [roomId, handleMessage]);

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

  const toggleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = room?.language === 'en' ? 'en-US' : 'vi-VN';
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e: ISpeechRecognitionEvent) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join('');
      setQuestion(text.slice(0, MAX_QUESTION_LENGTH));
    };
    rec.onend  = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.start();
    recognitionRef.current = rec;
    setIsListening(true);
  }, [isListening]);

  // Stop mics if user navigates away
  useEffect(() => () => { recognitionRef.current?.abort(); speakRecRef.current?.abort(); }, []);

  // ── Spotlight speaking (option B: live speech-to-text, no WebRTC) ──
  const startSpeaking = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR || wsRef.current?.readyState !== WebSocket.OPEN) return;
    const rec = new SR();
    rec.lang = room?.language === 'en' ? 'en-US' : 'vi-VN';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: ISpeechRecognitionEvent) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join('').slice(0, 300);
      speakTextRef.current = text;
      wsRef.current?.send(JSON.stringify({ type: 'speaker_transcript', text, final: false }));
    };
    rec.onend = () => {
      setSpeaking(false);
      const finalText = speakTextRef.current.trim();
      wsRef.current?.send(JSON.stringify({ type: 'speaker_transcript', text: finalText, final: true }));
      speakTextRef.current = '';
      setIsSpotlight(false);
    };
    rec.onerror = () => setSpeaking(false);
    rec.start();
    speakRecRef.current = rec;
    setSpeaking(true);
  }, [room?.language]);

  const stopSpeaking = useCallback(() => {
    speakRecRef.current?.stop(); // triggers onend → sends the final transcript
  }, []);

  const cancelSpeaking = useCallback(() => {
    speakRecRef.current?.abort();
    setSpeaking(false);
    setIsSpotlight(false);
    speakTextRef.current = '';
    wsRef.current?.send(JSON.stringify({ type: 'end_speaking' }));
  }, []);

  const sendChip = useCallback((text: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN || questionsLeft === 0) return;
    const now = Date.now();
    const rl = rateLimitRef.current;
    if (now < rl.resetAt && rl.count >= QUESTIONS_PER_MIN) return;
    if (now >= rl.resetAt) rateLimitRef.current = { count: 1, resetAt: now + 60_000 };
    else rateLimitRef.current.count += 1;
    setQuestionsLeft(Math.max(0, QUESTIONS_PER_MIN - rateLimitRef.current.count));
    wsRef.current.send(JSON.stringify({ type: 'ask_question', question: text }));
  }, [questionsLeft]);

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

  const sendPracticeResult = useCallback((phrase: string, transcript: string, score: number) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'practice_result', phrase, transcript, score }));
  }, []);

  const expireReaction = useCallback((id: number) => {
    setReactions(p => p.filter(r => r.id !== id));
  }, []);

  const sendQuestion = () => {
    const q = question.trim();
    if (!q || wsRef.current?.readyState !== WebSocket.OPEN) return;

    const now = Date.now();
    const rl = rateLimitRef.current;
    if (now < rl.resetAt && rl.count >= QUESTIONS_PER_MIN) {
      const secsLeft = Math.ceil((rl.resetAt - now) / 1000);
      setChat(p => [...p, { type: 'error', text: `Chờ ${secsLeft}s — tối đa ${QUESTIONS_PER_MIN} câu/phút.` }]);
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
        <button onClick={() => navigate('/live')} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Quay lại">
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
                LIVE
              </span>
            )}
            {isQaPeriod && (
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                <MessageSquare className="w-3 h-3" />
                Q&A · {fmtCountdown(qaCountdown)}
              </span>
            )}
            {isEnded && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Đã kết thúc</span>}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Giảng viên: {room.host_name}
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
            title={showParticipants ? 'Ẩn danh sách người học' : 'Hiện danh sách người học'}
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
            title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
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
            title="Tốc độ đọc của AI"
            aria-label="Tốc độ đọc của AI"
          >
            {playbackRate}×
          </button>

          {reconnecting ? (
            <span className="flex items-center gap-1 text-xs text-amber-500">
              <WifiOff className="w-3 h-3" /> Đang kết nối lại…
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
              <StopCircle className="w-3.5 h-3.5" /> Kết thúc
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
          <BookOpen className="w-3.5 h-3.5" /> Bài giảng
        </button>
        <button
          onClick={() => setMobileTab('chat')}
          className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors',
            mobileTab === 'chat' ? 'text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-400')}
        >
          <MessageSquare className="w-3.5 h-3.5" /> Hỏi & Đáp
        </button>
      </div>

      {/* ── Connection banner — shown while a dropped socket auto-reconnects ── */}
      {reconnecting && (
        <div className="flex items-center justify-center gap-2 shrink-0 px-4 py-1.5 bg-amber-50 border-b border-amber-200 text-xs font-medium text-amber-700">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          Mất kết nối — đang tự động kết nối lại…
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Audio unlock gate — shown only when the browser blocked autoplay */}
        {audioBlocked && !muted && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <button
              onClick={enableAudio}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-indigo-600 text-white font-semibold shadow-xl hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <Volume2 className="w-5 h-5" /> Nhấn để bật tiếng AI
            </button>
          </div>
        )}

        {/* Left: stage (slide + avatar) + transcript — single scrollable column */}
        <div className={cn(
          'flex-col flex-1 min-w-0 lg:border-r border-slate-200 overflow-y-auto overflow-x-hidden',
          mobileTab === 'stage' ? 'flex' : 'hidden', 'lg:flex',
        )}>
          {/* ── Stage ── */}
          <div className="relative shrink-0 bg-gradient-to-b from-indigo-50 to-white">
            <ReactionLayer reactions={reactions} onExpire={expireReaction} />

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
                  avatarSlot={
                    <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 border-white shadow-xl bg-white/30 backdrop-blur-sm">
                      <AIAvatarAnime
                        isSpeaking={isSpeaking}
                        isThinking={isThinking}
                        className="w-full h-full"
                        name=""
                      />
                    </div>
                  }
                />
              </div>
            ) : (
              /* Pre-lesson / ended: large centered avatar */
              <div className="flex flex-col items-center gap-3 py-6 px-4">
                <AIAvatarAnime isSpeaking={isSpeaking} isThinking={isThinking} className="w-44 h-52" name="AI Sensei" />
              </div>
            )}

            {/* Controls strip below stage */}
            <div className="px-4 py-3 flex flex-col items-center gap-2 border-t border-slate-100">
              {/* Status line */}
              <div className="text-center min-h-[1.25rem]">
                {isThinking && !isSpeaking && (
                  <p className="text-sm text-indigo-500 font-medium animate-pulse">Đang chuẩn bị bài giảng…</p>
                )}
                {isWaiting && (
                  <p className="text-sm text-slate-400">
                    {isHost ? 'Nhấn "Bắt đầu bài học" khi sẵn sàng' : 'Đợi giảng viên bắt đầu bài học…'}
                  </p>
                )}
                {isQaPeriod && !isSpeaking && !isThinking && (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-amber-600 font-medium">Thời gian hỏi đáp</p>
                    <span className="text-base font-bold text-amber-500 tabular-nums">{fmtCountdown(qaCountdown)}</span>
                  </div>
                )}
                {isEnded && !isSpeaking && (
                  <p className="text-sm text-slate-400">Buổi học đã kết thúc</p>
                )}
              </div>

              {/* Progress bar */}
              {progress.total > 0 && (
                <div className="w-full max-w-md">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>Slide {progress.current} / {progress.total}</span>
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
                  onClick={() => wsRef.current?.send(JSON.stringify({ type: 'start_lesson' }))}
                >
                  <PlayCircle className="w-4 h-4" /> Bắt đầu bài học
                </Button>
              )}

              {/* Session ended CTA */}
              {isEnded && (
                <div className="flex gap-2 mt-1">
                  <Button
                    size="sm" variant="outline"
                    className="gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    onClick={() => navigate(`/live/replay/${roomId}`)}
                  >
                    <PlaySquare className="w-3.5 h-3.5" /> Xem lại
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    className="gap-1.5"
                    onClick={() => navigate('/live')}
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Phòng khác
                  </Button>
                </div>
              )}

              {/* Invited to speak: spotlight speaking panel */}
              {isSpotlight && !isEnded && (
                <div className="w-full max-w-md flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-indigo-300 bg-indigo-50">
                  <p className="text-sm font-semibold text-indigo-700 flex items-center gap-1.5">
                    <Mic2 className="w-4 h-4" /> Bạn được mời phát biểu
                  </p>
                  {voiceSupported ? (
                    <>
                      <p className="text-xs text-slate-500 text-center">
                        Nhấn micro và nói — cả lớp sẽ thấy lời bạn, AI phản hồi khi bạn nói xong.
                      </p>
                      <div className="flex gap-2">
                        {!speaking ? (
                          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-1.5" onClick={startSpeaking}>
                            <Mic className="w-4 h-4" /> Bắt đầu nói
                          </Button>
                        ) : (
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1.5" onClick={stopSpeaking}>
                            <CheckCircle className="w-4 h-4" /> Xong, gửi
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="gap-1.5 text-slate-500" onClick={cancelSpeaking}>
                          Thôi
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-amber-600 text-center">
                      Trình duyệt không hỗ trợ nói. Bạn có thể gõ câu hỏi ở khung Hỏi & Đáp.
                    </p>
                  )}
                </div>
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
                      title={handRaised ? 'Hạ tay' : 'Giơ tay phát biểu'}
                    >
                      <Hand className={cn('w-3.5 h-3.5', handRaised && 'animate-bounce')} />
                      {handRaised ? 'Đang giơ tay' : 'Giơ tay'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Transcript panel — flows in the parent scroll */}
          <div className="flex flex-col">
            <div className="sticky top-0 z-10 flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-500">Nội dung bài học</span>
              <span className="ml-auto text-[10px] text-slate-400">
                {transcript.length} / {progress.total || transcript.length} slide
              </span>
            </div>
            {/* Slide progress bar */}
            {transcript.length > 0 && progress.total > 0 && (
              <div className="px-4 pt-2 pb-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full transition-all duration-700"
                      style={{ width: `${((currentChunkIndex + 1) / progress.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {Math.max(0, currentChunkIndex + 1)}/{progress.total}
                  </span>
                </div>
              </div>
            )}
            <div className="px-4 py-3">
              {transcript.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  Nội dung bài học sẽ hiện ở đây khi AI giảng.
                </p>
              ) : (
                <div className="space-y-2">
                  {transcript.map((chunk, i) => {
                    const isActive = i === currentChunkIndex;
                    const isDone   = i < currentChunkIndex;
                    return (
                      <div
                        key={i}
                        ref={isActive ? activeChunkRef : null}
                        className={cn(
                          'rounded-2xl border overflow-hidden transition-all duration-300',
                          isActive
                            ? 'border-indigo-300 shadow-md ring-1 ring-indigo-200'
                            : isDone
                              ? 'border-slate-100 opacity-70'
                              : 'border-slate-100',
                        )}
                      >
                        {/* Slide header */}
                        <div className={cn(
                          'flex items-center gap-2 px-3 py-2',
                          isActive ? 'bg-indigo-600' : isDone ? 'bg-slate-100' : 'bg-slate-50',
                        )}>
                          <span className={cn(
                            'flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0',
                            isActive ? 'bg-white text-indigo-600' : isDone ? 'bg-slate-300 text-slate-600' : 'bg-slate-200 text-slate-500',
                          )}>
                            {i + 1}
                          </span>
                          <p className={cn(
                            'text-xs font-semibold flex-1 truncate',
                            isActive ? 'text-white' : isDone ? 'text-slate-500' : 'text-slate-600',
                          )}>
                            {chunk.title}
                          </p>
                          {isActive && isSpeaking && (
                            <span className="flex gap-0.5 shrink-0">
                              {[0,1,2].map(j => (
                                <span
                                  key={j}
                                  className="inline-block w-0.5 h-3 bg-white/80 rounded-full"
                                  style={{ animation: `speaking-bar 0.6s ease-in-out ${j*0.15}s infinite alternate` }}
                                />
                              ))}
                            </span>
                          )}
                          {isDone && (
                            <span className="text-[10px] text-slate-400 shrink-0"><Check size={14} /></span>
                          )}
                        </div>

                        {/* Slide body */}
                        {isActive ? (
                          // Active slide is shown at the top stage — here show compact controls only
                          <div className="px-3 py-2.5 bg-indigo-50 space-y-2">
                            <p className="text-[11px] text-indigo-600 italic">
                              ↑ Slide đang được trình bày ở trên
                            </p>
                            {chunk.practice_phrase && (
                              <PracticeCard
                                phrase={chunk.practice_phrase}
                                onResult={(t, s) => sendPracticeResult(chunk.practice_phrase!, t, s)}
                              />
                            )}
                            {isLive && (
                              <button
                                onClick={() => sendChip(`Giải thích lại phần "${chunk.title}" cho tôi`)}
                                disabled={questionsLeft === 0 || !connected}
                                className="flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Giải thích lại phần này
                              </button>
                            )}
                          </div>
                        ) : isDone ? (
                          // Past slide — render the slide content (not animated, no avatar PIP)
                          <div className="px-3 py-2.5 bg-white">
                            <LessonSlide
                              chunk={chunk}
                              index={i}
                              total={progress.total || transcript.length}
                              active={false}
                              ragBase={RAG_BASE}
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
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
            <span className="text-xs font-medium text-slate-500">Hỏi & Đáp</span>
            {!isEnded && (
              <span className={cn(
                'ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium',
                questionsLeft === 0 ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400',
              )}>
                {questionsLeft}/{QUESTIONS_PER_MIN} câu còn lại
              </span>
            )}
          </div>

          <ScrollArea className="flex-1 px-3 py-3">
            {chat.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                Đặt câu hỏi cho AI giảng viên trong buổi học.
              </p>
            ) : (
              <div className="space-y-3">
                {chat.map((msg, i) => (
                  <div key={i}>
                    {msg.type === 'system' && (
                      <div className="flex justify-center">
                        <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                          {SYS_MESSAGES[msg.text ?? ''] ?? msg.text}
                        </span>
                      </div>
                    )}
                    {msg.type === 'error' && (
                      <div className="flex justify-center">
                        <span className="text-xs text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                          {msg.text}
                        </span>
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
                          <p className="text-[11px] text-slate-400 mb-0.5">Trả lời {msg.user_name}</p>
                          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-words">{msg.answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Question input */}
          <div className="p-3 border-t border-slate-200 bg-white shrink-0 space-y-2">
            {/* Quick chips */}
            {!isEnded && connected && (
              <div className="flex gap-1.5 flex-wrap">
                {QUICK_CHIPS.map(chip => (
                  <button
                    key={chip}
                    onClick={() => sendChip(chip)}
                    disabled={questionsLeft === 0}
                    className="text-[11px] px-2 py-0.5 rounded-full border border-indigo-200 text-indigo-600
                               bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed
                               transition-colors whitespace-nowrap"
                  >
                    {chip}
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
                  disabled={!connected || questionsLeft === 0}
                  className={cn(
                    'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'border border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500',
                    (!connected || questionsLeft === 0) && 'opacity-40 cursor-not-allowed',
                  )}
                  title={isListening ? 'Dừng ghi âm' : (room?.language === 'en' ? 'Nói câu hỏi (tiếng Anh)' : 'Nói câu hỏi (tiếng Việt)')}
                  aria-label={isListening ? 'Dừng ghi âm' : 'Ghi âm câu hỏi'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}

              <Input
                placeholder={
                  isListening       ? 'Đang nghe… nói câu hỏi của bạn'
                  : isEnded         ? 'Buổi học đã kết thúc'
                  : !connected      ? 'Đang kết nối…'
                  : questionsLeft === 0 ? 'Đã hết lượt — đợi 1 phút'
                  : 'Đặt câu hỏi hoặc nhấn mic để nói…'
                }
                value={question}
                onChange={e => setQuestion(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendQuestion()}
                disabled={isEnded || !connected || questionsLeft === 0}
                className={cn('text-sm', isListening && 'border-red-300 ring-1 ring-red-200')}
              />
              <Button
                size="icon"
                className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
                onClick={sendQuestion}
                disabled={!question.trim() || isEnded || !connected || questionsLeft === 0}
                aria-label="Gửi câu hỏi"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between px-0.5">
              <p className="text-[11px] text-slate-400">
                {voiceSupported ? 'Mic · ' : ''}Tối đa {QUESTIONS_PER_MIN} câu/phút · Enter để gửi
              </p>
              <span className={cn('text-[11px]', charsLeft < 30 ? 'text-amber-500' : 'text-slate-300')}>
                {charsLeft}
              </span>
            </div>

            {reconnecting && (
              <p className="text-xs text-amber-500 text-center">Mất kết nối — đang kết nối lại…</p>
            )}
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

      {/* Inline keyframes for speaking bar animation */}
      <style>{`
        @keyframes speaking-bar {
          from { transform: scaleY(.3); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
