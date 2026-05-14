import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, RotateCcw, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Web Speech API shims (Chrome / Edge)
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

interface Props {
  phrase: string;
  /** Called when the student finishes — provides the transcript + 0-100 score */
  onResult: (transcript: string, score: number) => void;
}

const STRIP_RE = /[^a-z0-9 ']/g;
function normalize(s: string) {
  return s.toLowerCase().replace(STRIP_RE, ' ').replace(/\s+/g, ' ').trim();
}

/** Word-overlap similarity 0-100. Lightweight; good enough for friendly feedback. */
function scoreMatch(target: string, said: string): number {
  const tWords = normalize(target).split(' ').filter(Boolean);
  const sWords = normalize(said).split(' ').filter(Boolean);
  if (!tWords.length) return 0;
  let hits = 0;
  const used = new Set<number>();
  for (const w of sWords) {
    const idx = tWords.findIndex((t, i) => !used.has(i) && t === w);
    if (idx >= 0) { used.add(idx); hits++; }
  }
  return Math.round((hits / tWords.length) * 100);
}

/**
 * Interactive practice card: shows an English phrase, lets the student
 * speak it via the mic, and grades how closely they matched.
 */
export function PracticeCard({ phrase, onResult }: Props) {
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const recRef = useRef<ISpeechRecognition | null>(null);
  const supported = typeof window !== 'undefined' && !!(window.SpeechRecognition ?? window.webkitSpeechRecognition);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (!supported) return;
    setHeard('');
    setScore(null);
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e: ISpeechRecognitionEvent) => {
      const t = Array.from({ length: e.results.length }, (_, i) => e.results[i][0].transcript).join('');
      setHeard(t);
    };
    rec.onend = () => {
      setListening(false);
      setHeard(prev => {
        const s = scoreMatch(phrase, prev);
        setScore(s);
        if (prev) onResult(prev, s);
        return prev;
      });
    };
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [phrase, supported, onResult]);

  useEffect(() => () => { recRef.current?.abort(); }, []);

  const feedback = score === null ? null
    : score >= 80 ? { color: 'text-emerald-600', icon: <CheckCircle2 className="w-4 h-4" />, label: 'Tuyệt vời!' }
    : score >= 50 ? { color: 'text-amber-600',  icon: <Sparkles className="w-4 h-4" />,    label: 'Gần đúng — thử lại nhé' }
    :               { color: 'text-rose-600',   icon: <XCircle className="w-4 h-4" />,     label: 'Cố lên! Đọc lại lần nữa' };

  if (!supported) {
    return (
      <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
        Trình duyệt không hỗ trợ luyện nói. Hãy dùng Chrome/Edge để dùng tính năng này.
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100/70 border-b border-indigo-100">
        <Sparkles className="w-3 h-3 text-indigo-600" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Luyện nói</span>
      </div>

      <div className="px-3 py-3 space-y-2">
        <p className="text-base font-semibold text-slate-800 leading-snug">"{phrase}"</p>

        {heard && (
          <p className="text-xs text-slate-500">
            Bạn nói: <span className="italic">"{heard}"</span>
          </p>
        )}

        {feedback && (
          <div className={cn('flex items-center gap-1.5 text-xs font-medium', feedback.color)}>
            {feedback.icon}
            <span>{feedback.label}</span>
            <span className="ml-auto tabular-nums text-[10px] opacity-70">{score}/100</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {!listening ? (
            <Button
              size="sm"
              onClick={start}
              className="bg-indigo-600 hover:bg-indigo-700 gap-1.5"
            >
              <Mic className="w-3.5 h-3.5" />
              {score === null ? 'Đọc theo' : 'Thử lại'}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={stop} className="gap-1.5 border-rose-300 text-rose-600 hover:bg-rose-50">
              <MicOff className="w-3.5 h-3.5" />
              Dừng
            </Button>
          )}
          {score !== null && !listening && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setHeard(''); setScore(null); }}
              className="gap-1.5 text-slate-500"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Xoá
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
