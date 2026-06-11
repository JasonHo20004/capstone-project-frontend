import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, RotateCcw, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Web Speech API removed in favor of MediaRecorder + Whisper API

interface Props {
  phrase: string;
  /** Called when the student finishes — provides the transcript + 0-100 score */
  onResult: (transcript: string, score: number) => void;
}

const STRIP_RE = /[^a-z0-9 ']/g;
function normalize(s: string) {
  return s.toLowerCase().replace(STRIP_RE, ' ').replace(/\s+/g, ' ').trim();
}

/** Word-level Levenshtein distance for accurate grading */
function levenshteinDistance(a: string[], b: string[]): number {
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[a.length][b.length];
}

function scoreMatch(target: string, said: string): { score: number; details: { word: string; correct: boolean }[] } {
  const tWords = normalize(target).split(' ').filter(Boolean);
  const sWords = normalize(said).split(' ').filter(Boolean);
  
  if (!tWords.length) return { score: 0, details: [] };
  if (!sWords.length) {
    return { score: 0, details: tWords.map(w => ({ word: w, correct: false })) };
  }

  const distance = levenshteinDistance(tWords, sWords);
  const maxLen = Math.max(tWords.length, sWords.length);
  const score = Math.round(Math.max(0, 1 - distance / maxLen) * 100);
  
  // Basic marking: if a target word is found in said words (in order-ish), mark correct
  // A true alignment would require backtracking the matrix, but for UI feedback:
  let sIdx = 0;
  const details = tWords.map(tWord => {
    let correct = false;
    // Look ahead a few words to find a match
    for (let i = 0; i < 3 && sIdx + i < sWords.length; i++) {
      if (sWords[sIdx + i] === tWord) {
        correct = true;
        sIdx += i + 1;
        break;
      }
    }
    return { word: tWord, correct };
  });

  return { score, details };
}

/**
 * Interactive practice card: shows an English phrase, lets the student
 * speak it via the mic, and grades how closely they matched.
 */
export function PracticeCard({ phrase, onResult }: Props) {
  const { t } = useTranslation('livestream');
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [wordDetails, setWordDetails] = useState<{ word: string; correct: boolean }[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const supported = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const start = useCallback(async () => {
    if (!supported) return;
    setHeard('');
    setScore(null);
    
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
        
        setHeard('Đang xử lý...'); // Processing indicator
        try {
          const { ragService } = await import('@/lib/api/services/rag.service');
          const data = await ragService.transcribeDictation(audioBlob, 'en');
          if (data && data.success && data.sentences) {
            const finalTranscript = data.sentences.map((s: any) => s.text).join(' ');
            setHeard(finalTranscript);
            const { score: s, details } = scoreMatch(phrase, finalTranscript);
            setScore(s);
            setWordDetails(details);
            if (finalTranscript) onResult(finalTranscript, s);
          } else {
            setHeard('Không nhận diện được giọng nói.');
          }
        } catch (e) {
          console.error(e);
          setHeard('Lỗi kết nối.');
        } finally {
          setListening(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setListening(true);
    } catch (err) {
      console.error('Mic access denied', err);
      setListening(false);
    }
  }, [phrase, supported, onResult]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const feedback = score === null ? null
    : score >= 80 ? { color: 'text-emerald-600', icon: <CheckCircle2 className="w-4 h-4" />, label: t('practice.feedback.great') }
    : score >= 50 ? { color: 'text-amber-600',  icon: <Sparkles className="w-4 h-4" />,    label: t('practice.feedback.close') }
    :               { color: 'text-rose-600',   icon: <XCircle className="w-4 h-4" />,     label: t('practice.feedback.tryAgain') };

  if (!supported) {
    return (
      <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
        {t('practice.unsupported')}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100/70 border-b border-indigo-100">
        <Sparkles className="w-3 h-3 text-indigo-600" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">{t('practice.label')}</span>
      </div>
      {/* Original Phrase */}
      <div className="text-center min-h-[4rem] flex flex-col items-center justify-center p-3">
        {score === null || wordDetails.length === 0 ? (
          <p className="text-xl sm:text-2xl font-bold text-slate-800 leading-snug">
            "{phrase}"
          </p>
        ) : (
          <p className="text-xl sm:text-2xl font-bold text-slate-800 leading-snug flex flex-wrap justify-center gap-x-1.5">
            {wordDetails.map((wd, i) => (
              <span key={i} className={wd.correct ? 'text-green-600' : 'text-rose-500 underline decoration-rose-300 decoration-2 underline-offset-4'}>
                {wd.word}
              </span>
            ))}
          </p>
        )}
      </div>

      <div className="px-3 py-3 space-y-2 border-t border-indigo-100">
        {heard && (
          <p className="text-xs text-slate-500">
            {t('practice.youSaid')} <span className="italic">"{heard}"</span>
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
              {score === null ? t('practice.buttons.tryAloud') : t('practice.buttons.again')}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={stop} className="gap-1.5 border-rose-300 text-rose-600 hover:bg-rose-50">
              <MicOff className="w-3.5 h-3.5" />
              {t('practice.buttons.stop')}
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
              {t('practice.buttons.clear')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
