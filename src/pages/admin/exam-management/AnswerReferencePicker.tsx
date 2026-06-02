import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Highlighter, Sparkles, X, Loader2, Quote } from 'lucide-react';

/** A pointer to where the answer is justified inside a passage / listening script. */
export interface AnswerReference {
  /** The exact justifying text, copied verbatim from the passage/transcript. */
  snippet: string;
  /** Char offsets into the passage/transcript content (best-effort). */
  start?: number;
  end?: number;
  /** Listening only — seconds, so the review player can seek to the moment. */
  audioStart?: number;
  audioEnd?: number;
  /** Whether the reference was authored by hand or pre-filled by AI. */
  source?: 'manual' | 'ai';
}

interface AudioSegment {
  start: number;
  end: number;
  text: string;
}

/**
 * Map a snippet of transcript text to an audio time range using Whisper
 * per-segment timestamps. Best-effort fuzzy match — returns {} if nothing lines up.
 */
export function snippetToAudioRange(
  snippet: string,
  segments?: AudioSegment[],
): { audioStart?: number; audioEnd?: number } {
  if (!snippet || !segments || segments.length === 0) return {};
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const ns = norm(snippet);
  if (!ns) return {};
  const matched = segments.filter((seg) => {
    const t = norm(seg.text || '');
    if (!t) return false;
    return (
      ns.includes(t) ||
      t.includes(ns) ||
      (t.length > 12 && ns.includes(t.slice(0, 12))) ||
      (ns.length > 12 && t.includes(ns.slice(0, 12)))
    );
  });
  if (matched.length === 0) return {};
  const starts = matched.map((m) => m.start).filter((n) => typeof n === 'number');
  const ends = matched.map((m) => m.end).filter((n) => typeof n === 'number');
  return {
    audioStart: starts.length ? Math.min(...starts) : undefined,
    audioEnd: ends.length ? Math.max(...ends) : undefined,
  };
}

/** mm:ss helper for showing the audio cue point. */
function formatTime(sec?: number): string {
  if (typeof sec !== 'number' || isNaN(sec)) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Find where `snippet` sits inside `text`, returning [start, end] char offsets.
 * Tries the stored offsets first, then an exact match, then a whitespace-tolerant
 * match (AI snippets often differ from the passage only by spaces / line breaks).
 * Returns null when the snippet can't be located at all.
 */
function locateSnippet(
  text: string,
  snippet: string,
  hintStart?: number,
  hintEnd?: number,
): [number, number] | null {
  if (!text || !snippet) return null;

  // 1. Trust the stored offsets only if they still point at the snippet.
  if (
    typeof hintStart === 'number' &&
    typeof hintEnd === 'number' &&
    hintStart >= 0 &&
    hintEnd <= text.length &&
    hintStart < hintEnd &&
    text.slice(hintStart, hintEnd) === snippet
  ) {
    return [hintStart, hintEnd];
  }

  // 2. Exact substring match.
  const exact = text.indexOf(snippet);
  if (exact >= 0) return [exact, exact + snippet.length];

  // 3. Whitespace-tolerant match: collapse runs of whitespace to \s+.
  const trimmed = snippet.trim();
  if (!trimmed) return null;
  const pattern = trimmed
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+');
  try {
    const m = new RegExp(pattern).exec(text);
    if (m) return [m.index, m.index + m[0].length];
  } catch {
    /* malformed regex — give up gracefully */
  }
  return null;
}

interface Props {
  /** Reading passage text, or listening transcript. */
  sourceText: string;
  isListening?: boolean;
  segments?: AudioSegment[];
  value?: AnswerReference | null;
  onChange: (ref: AnswerReference | null) => void;
  onAiSuggest?: () => void;
  aiLoading?: boolean;
}

/**
 * Lets a test author mark *where* a question's answer is justified in the
 * passage/transcript (Study4-style "answer location"). The author highlights
 * text in the preview box; we capture the snippet + char offsets, and for
 * listening also resolve the audio timestamp so the review player can seek.
 */
export function AnswerReferencePicker({
  sourceText,
  isListening,
  segments,
  value,
  onChange,
  onAiSuggest,
  aiLoading,
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLElement>(null);

  // When the reference changes (e.g. AI just suggested one), scroll the
  // highlighted text into view inside the passage box so the author sees it.
  useEffect(() => {
    if (value?.snippet && markRef.current) {
      markRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [value?.snippet]);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const snippet = sel.toString().trim();
    if (!snippet || snippet.length < 2) return;
    const box = boxRef.current;
    if (!box || !box.contains(sel.anchorNode)) return;

    // The box may render the passage as several nodes (the highlighted snippet
    // is wrapped in <mark>), so compute the absolute char offset by measuring
    // the text from the box start up to the selection start.
    let start: number | undefined;
    let end: number | undefined;
    try {
      const range = sel.getRangeAt(0);
      const pre = document.createRange();
      pre.selectNodeContents(box);
      pre.setEnd(range.startContainer, range.startOffset);
      start = pre.toString().length;
      end = start + snippet.length;
    } catch {
      const idx = sourceText.indexOf(snippet);
      if (idx >= 0) {
        start = idx;
        end = idx + snippet.length;
      }
    }

    const ref: AnswerReference = { snippet, start, end, source: 'manual' };
    if (isListening) {
      const range = snippetToAudioRange(snippet, segments);
      ref.audioStart = range.audioStart;
      ref.audioEnd = range.audioEnd;
    }
    onChange(ref);
    sel.removeAllRanges();
  };

  const hasSource = !!sourceText && sourceText.trim().length > 0;

  // Render the passage with the justifying snippet wrapped in <mark> so it
  // shows up highlighted in yellow inline within the reading text.
  const located = value?.snippet
    ? locateSnippet(sourceText, value.snippet, value.start, value.end)
    : null;
  const passageBody = located ? (
    <>
      {sourceText.slice(0, located[0])}
      <mark
        ref={markRef}
        className="rounded bg-amber-200 px-0.5 text-amber-900"
      >
        {sourceText.slice(located[0], located[1])}
      </mark>
      {sourceText.slice(located[1])}
    </>
  ) : (
    sourceText
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Highlighter className="h-3.5 w-3.5 text-amber-500" />
          Dẫn chứng đáp án
        </span>
        {onAiSuggest && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            disabled={!hasSource || aiLoading}
            onClick={onAiSuggest}
          >
            {aiLoading ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Đang gợi ý...</>
            ) : (
              <><Sparkles className="h-3 w-3 text-violet-500" /> AI gợi ý</>
            )}
          </Button>
        )}
      </div>

      {!hasSource ? (
        <p className="mt-1 text-xs text-muted-foreground italic">
          Chưa có {isListening ? 'transcript' : 'nội dung bài đọc'} ở bước "Nội dung" — hãy nhập trước rồi quay lại bôi đen dẫn chứng.
        </p>
      ) : (
        <>
          <p className="mt-1 mb-1 text-[11px] text-muted-foreground">
            Bôi đen đoạn {isListening ? 'trong transcript' : 'trong bài đọc'} chứa đáp án của câu này.
          </p>
          <div
            ref={boxRef}
            onMouseUp={handleMouseUp}
            className={`max-h-44 overflow-auto rounded-md border bg-muted/30 px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap cursor-text select-text ${
              isListening ? 'font-mono' : 'font-serif'
            }`}
          >
            {passageBody}
          </div>
          {value?.snippet && !located && (
            <p className="mt-1 text-[11px] text-amber-600">
              ⚠ Không tìm thấy dẫn chứng này trong bài đọc — có thể AI diễn đạt lại. Hãy bôi đen lại đoạn đúng.
            </p>
          )}
        </>
      )}

      {value?.snippet && (
        <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-300/60 bg-amber-50 px-2.5 py-2">
          <Quote className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-900 leading-snug">{value.snippet}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {value.source === 'ai' && (
                <span className="inline-flex items-center gap-0.5 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                  <Sparkles className="h-2.5 w-2.5" /> AI gợi ý
                </span>
              )}
              {isListening && typeof value.audioStart === 'number' && (
                <span className="rounded bg-amber-200/70 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                  ⏱ {formatTime(value.audioStart)}
                  {typeof value.audioEnd === 'number' ? `–${formatTime(value.audioEnd)}` : ''}
                </span>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0"
            onClick={() => onChange(null)}
            title="Xóa dẫn chứng"
          >
            <X className="h-3 w-3 text-amber-700" />
          </Button>
        </div>
      )}
    </div>
  );
}
