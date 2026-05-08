import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@/hooks/api/use-user';
import { AIAvatar } from '@/components/user/livestream/AIAvatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';
import {
  Users, Send, PlayCircle, StopCircle, ArrowLeft,
  MessageSquare, BookOpen, Volume2, WifiOff,
} from 'lucide-react';

const RAG_BASE = import.meta.env.VITE_RAG_SERVICE_URL ?? 'http://localhost:8000';
const WS_BASE = RAG_BASE.replace(/^http/, 'ws');
const MAX_RECONNECT_DELAY = 16000;

// ── Types ──────────────────────────────────────────────────────────────────────

interface RoomInfo {
  id: string;
  topic: string;
  level: string;
  level_label: string;
  host_id: string;
  host_name: string;
  status: string;
  transcript: TranscriptChunk[];
}

interface TranscriptChunk {
  title: string;
  content: string;
}

interface ChatMessage {
  type: 'question' | 'answer' | 'system' | 'error';
  user_name?: string;
  question?: string;
  answer?: string;
  text?: string;
}

// ── Audio queue (plays URLs sequentially) ─────────────────────────────────────

class AudioQueue {
  private queue: string[] = [];
  private playing = false;
  onPlay?: () => void;
  onStop?: () => void;

  push(url: string) {
    if (!url) return;
    this.queue.push(url);
    if (!this.playing) this._next();
  }

  private _next() {
    if (!this.queue.length) {
      this.playing = false;
      this.onStop?.();
      return;
    }
    this.playing = true;
    this.onPlay?.();
    const url = this.queue.shift()!;
    const audio = new Audio(url);
    audio.onended = () => this._next();
    audio.onerror = () => this._next();
    audio.play().catch(() => this._next());
  }

  clear() {
    this.queue = [];
    this.playing = false;
    this.onStop?.();
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced: 'bg-violet-100 text-violet-700',
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function LiveRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();

  const wsRef = useRef<WebSocket | null>(null);
  const audioQueueRef = useRef(new AudioQueue());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay = useRef(1000);
  const unmounted = useRef(false);

  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptChunk[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [status, setStatus] = useState('waiting');
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(-1);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    const aq = audioQueueRef.current;
    aq.onPlay = () => setIsSpeaking(true);
    aq.onStop = () => setIsSpeaking(false);
    return () => { unmounted.current = true; };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleMessage = useCallback((msg: Record<string, unknown>) => {
    switch (msg.type) {
      case 'room_state': {
        const r = msg.room as RoomInfo;
        setRoom(r);
        setStatus(r.status);
        setIsHost(!!msg.is_host);
        setParticipantCount(msg.participant_count as number);
        setTranscript(r.transcript ?? []);
        break;
      }
      case 'participant_join':
      case 'participant_leave':
        setParticipantCount(msg.participant_count as number);
        break;
      case 'lesson_start':
        setStatus('live');
        setChat((p) => [...p, { type: 'system', text: 'The lesson has started!' }]);
        break;
      case 'lesson_generating':
        setIsThinking(true);
        setChat((p) => [...p, { type: 'system', text: 'AI is preparing the lesson…' }]);
        break;
      case 'lesson_chunk': {
        setIsThinking(false);
        const chunk = { title: msg.title as string, content: msg.content as string };
        const idx = msg.index as number;
        setTranscript((p) => [...p, chunk]);
        setCurrentChunkIndex(idx);
        setProgress({ current: idx + 1, total: msg.total as number });
        if (msg.audio_url) audioQueueRef.current.push(msg.audio_url as string);
        break;
      }
      case 'lesson_complete':
        setStatus('completed');
        setCurrentChunkIndex(-1);
        setChat((p) => [...p, { type: 'system', text: 'Lesson complete! You can still ask questions.' }]);
        break;
      case 'question_asked':
        setChat((p) => [...p, {
          type: 'question',
          user_name: msg.user_name as string,
          question: msg.question as string,
        }]);
        setIsThinking(true);
        break;
      case 'ai_answer':
        setIsThinking(false);
        setChat((p) => [...p, {
          type: 'answer',
          user_name: msg.user_name as string,
          answer: msg.answer as string,
        }]);
        if (msg.audio_url) audioQueueRef.current.push(msg.audio_url as string);
        break;
      case 'error':
        setChat((p) => [...p, { type: 'error', text: msg.message as string }]);
        break;
      case 'room_ended':
        setStatus('ended');
        setChat((p) => [...p, { type: 'system', text: 'The classroom has ended.' }]);
        audioQueueRef.current.clear();
        break;
    }
  }, []);

  // ── WebSocket connect (with reconnect) ────────────────────────────────────

  const connect = useCallback(() => {
    if (!roomId || unmounted.current) return;

    const token = localStorage.getItem('accessToken') ?? '';
    const ws = new WebSocket(
      `${WS_BASE}/api/livestream/rooms/${roomId}/ws?token=${encodeURIComponent(token)}`
    );
    wsRef.current = ws;

    ws.onopen = () => {
      if (unmounted.current) { ws.close(); return; }
      reconnectDelay.current = 1000;
      setConnected(true);
      setReconnecting(false);
      ws.send(JSON.stringify({
        type: 'join',
        user_id: user?.id ?? 'guest-' + Math.random().toString(36).slice(2),
        user_name: user?.fullName ?? 'Student',
      }));
    };

    ws.onmessage = (e) => handleMessage(JSON.parse(e.data));

    ws.onclose = (ev) => {
      setConnected(false);
      // Don't reconnect if intentionally closed (room ended / navigated away)
      if (unmounted.current || ev.code === 4004 || ev.code === 4001 || ev.code === 4003) return;
      setReconnecting(true);
      reconnectTimer.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, MAX_RECONNECT_DELAY);
        connect();
      }, reconnectDelay.current);
    };
  }, [roomId, user?.id, user?.fullName, handleMessage]);

  useEffect(() => {
    if (!roomId) return;

    fetch(`${RAG_BASE}/api/livestream/rooms/${roomId}`)
      .then((r) => r.json())
      .then((data: RoomInfo) => {
        setRoom(data);
        setStatus(data.status);
        setTranscript(data.transcript ?? []);
      })
      .catch(() => navigate('/live'));

    connect();

    return () => {
      unmounted.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
      audioQueueRef.current.clear();
    };
  }, [roomId, navigate, connect]);

  const sendQuestion = () => {
    const q = question.trim();
    if (!q || wsRef.current?.readyState !== WebSocket.OPEN) return;
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

  const isLive = status === 'live';
  const isWaiting = status === 'waiting';
  const isEnded = status === 'ended' || status === 'completed';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shrink-0">
        <button onClick={() => navigate('/live')} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-slate-900 truncate text-sm">{room.topic}</h2>
            <Badge variant="outline" className={cn('text-xs', LEVEL_COLORS[room.level])}>
              {room.level_label}
            </Badge>
            {isLive && (
              <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </span>
            )}
            {isEnded && (
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Ended</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Host: {room.host_name}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Users className="w-3.5 h-3.5" />
            {participantCount}
          </span>

          {/* Connection indicator */}
          {reconnecting ? (
            <span className="flex items-center gap-1 text-xs text-amber-500">
              <WifiOff className="w-3 h-3" /> Reconnecting…
            </span>
          ) : (
            <span className={cn('w-2 h-2 rounded-full shrink-0', connected ? 'bg-emerald-500' : 'bg-slate-300')} />
          )}

          {isHost && isLive && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
              onClick={() => wsRef.current?.send(JSON.stringify({ type: 'end_room' }))}
            >
              <StopCircle className="w-3.5 h-3.5" /> End
            </Button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: avatar + transcript */}
        <div className="flex flex-col w-[58%] border-r border-slate-200 overflow-hidden">
          <div className="flex flex-col items-center gap-3 py-5 px-4 bg-gradient-to-b from-indigo-50 to-white shrink-0">
            <AIAvatar isSpeaking={isSpeaking} isThinking={isThinking} className="w-32 h-32" />

            <div className="text-center min-h-[1.5rem]">
              {isThinking && !isSpeaking && (
                <p className="text-sm text-indigo-500 font-medium animate-pulse">Preparing…</p>
              )}
              {isSpeaking && transcript[currentChunkIndex] && (
                <p className="text-sm text-indigo-600 font-medium">{transcript[currentChunkIndex].title}</p>
              )}
              {isWaiting && (
                <p className="text-sm text-slate-400">
                  {isHost ? 'Press Start when ready' : 'Waiting for host to start the lesson'}
                </p>
              )}
              {isEnded && !isSpeaking && (
                <p className="text-sm text-slate-400">Session ended</p>
              )}
            </div>

            {progress.total > 0 && (
              <div className="w-full max-w-xs">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Section {progress.current} / {progress.total}</span>
                  <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {isHost && isWaiting && (
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 gap-2 mt-1"
                onClick={() => wsRef.current?.send(JSON.stringify({ type: 'start_lesson' }))}
              >
                <PlayCircle className="w-4 h-4" /> Start Lesson
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 bg-white shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-500">Transcript</span>
            </div>
            <ScrollArea className="flex-1 px-4 py-3">
              {transcript.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  Lesson content will appear here as the AI speaks.
                </p>
              ) : (
                <div className="space-y-3">
                  {transcript.map((chunk, i) => (
                    <div
                      key={i}
                      className={cn(
                        'rounded-xl p-3 border transition-all duration-300',
                        i === currentChunkIndex
                          ? 'border-indigo-300 bg-indigo-50'
                          : 'border-transparent bg-slate-50',
                      )}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Volume2 className="w-3 h-3 text-indigo-400 shrink-0" />
                        <p className="text-xs font-semibold text-indigo-600">{chunk.title}</p>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{chunk.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Right: Q&A */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 bg-white shrink-0">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Q&amp;A Chat</span>
          </div>

          <ScrollArea className="flex-1 px-3 py-3">
            {chat.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                Ask the AI teacher anything during the lesson.
              </p>
            ) : (
              <div className="space-y-3">
                {chat.map((msg, i) => (
                  <div key={i}>
                    {(msg.type === 'system') && (
                      <div className="flex justify-center">
                        <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                          {msg.text}
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
                          <p className="text-[11px] text-slate-400 mb-0.5">Answering {msg.user_name}</p>
                          <p className="text-sm text-slate-800 leading-relaxed">{msg.answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </ScrollArea>

          <div className="p-3 border-t border-slate-200 bg-white shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder={isEnded ? 'Session ended' : 'Ask the AI teacher…'}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendQuestion()}
                disabled={isEnded || !connected}
                className="text-sm"
              />
              <Button
                size="icon"
                className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
                onClick={sendQuestion}
                disabled={!question.trim() || isEnded || !connected}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {reconnecting && (
              <p className="text-xs text-amber-500 mt-1.5 text-center">
                Connection lost — reconnecting…
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
