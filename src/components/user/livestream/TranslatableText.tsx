import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Volume2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TranslationResult {
  word: string;
  meaning: string;
  pronunciation: string;
  example: string;
}

interface Props {
  text: string;
  target?: 'vi' | 'en';
  ragBase: string;
  className?: string;
  audioProgress?: number | null;
  /** Characters spoken in the same audio clip BEFORE `text` (e.g. the slide
   *  title the teacher reads first). Used to offset the karaoke highlight so the
   *  words don't light up while the lead-in is still being spoken. */
  leadChars?: number;
  /** Characters spoken AFTER `text` in the same clip (e.g. a closing sign-off). */
  tailChars?: number;
}

// Split text into words vs. punctuation/whitespace. Unicode-aware (\p{L}) so
// accented scripts like Vietnamese keep WHOLE words intact — the old ASCII-only
// regex matched just the Latin letters of "trường" and treated every diacritic
// (ư, ờ…) as separate punctuation, shredding each word into fragments. Each
// fragment rendered as its own padded inline box, which looked unevenly spaced
// and let words break mid-word at line ends. Only pure-Latin words become
// click-to-translate buttons; other words render as plain (still highlightable)
// text so the karaoke fill stays smooth.
const TOKEN_RE = /\p{L}[\p{L}\p{M}'’-]*/gu;
const LATIN_WORD_RE = /^[A-Za-z][A-Za-z'-]*$/;

// In-memory translation cache shared across mounts (per page load).
const translationCache = new Map<string, TranslationResult>();

/**
 * Normalise an IPA string for display. The LLM frequently returns the
 * transcription already wrapped in slashes (`/həˈloʊ/`) or brackets (`[həˈloʊ]`),
 * sometimes with an "IPA:" label — wrapping that again produced `//həˈloʊ//`.
 * Strip any surrounding delimiters/label and whitespace so the caller can wrap
 * it in `/…/` exactly once. Returns '' when nothing usable remains.
 */
function normalizeIpa(raw: string): string {
  return raw
    .trim()
    .replace(/^ipa\s*[:：]?\s*/i, '')        // drop a leading "IPA:" label
    .replace(/^[\s/[\]]+|[\s/[\]]+$/g, '')   // drop surrounding / [ ] and spaces
    .trim();
}

/**
 * Renders plain text where each English word can be clicked to open a
 * translation popover. Caches results in-memory.
 */
export function TranslatableText({ text, target = 'vi', ragBase, className, audioProgress, leadChars = 0, tailChars = 0 }: Props) {
  const [popover, setPopover] = useState<{ word: string; rect: DOMRect; result?: TranslationResult; loading: boolean } | null>(null);

  const openWord = useCallback(async (word: string, target_lang: 'vi' | 'en', el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const cached = translationCache.get(`${target_lang}:${word.toLowerCase()}`);
    if (cached) {
      setPopover({ word, rect, result: cached, loading: false });
      return;
    }
    setPopover({ word, rect, loading: true });
    try {
      const res = await fetch(`${ragBase}/api/livestream/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, target: target_lang }),
      });
      const data = await res.json() as TranslationResult;
      translationCache.set(`${target_lang}:${word.toLowerCase()}`, data);
      setPopover(p => (p && p.word === word ? { ...p, result: data, loading: false } : p));
    } catch {
      setPopover(p => (p && p.word === word ? { ...p, loading: false, result: { word, meaning: '—', pronunciation: '', example: '' } } : p));
    }
  }, [ragBase]);

  const close = () => setPopover(null);

  // Tokenize. Pure-Latin words → 'word' (clickable); other whole words (e.g.
  // Vietnamese) → 'text' (rendered as one span, highlightable but not clickable).
  const parts: { kind: 'word' | 'text' | 'punct'; value: string }[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push({ kind: 'punct', value: text.slice(last, idx) });
    parts.push({ kind: LATIN_WORD_RE.test(m[0]) ? 'word' : 'text', value: m[0] });
    last = idx + m[0].length;
  }
  if (last < text.length) parts.push({ kind: 'punct', value: text.slice(last) });

  // Karaoke highlight, synced to the narration clip's playback progress.
  // Two things kept the old `i / parts.length` mapping out of sync:
  //   1. The clip speaks the slide title (and, on the last slide, a closing
  //      sign-off) which isn't shown here — so `audioProgress` was already past 0
  //      while the teacher was still on the title, lighting up words too early.
  //      `leadChars`/`tailChars` account for that spoken-but-unshown text.
  //   2. Every token (incl. punctuation) was treated as equal duration, so the
  //      fill jumped unevenly. Weighting each token by its character count is a
  //      far better proxy for how long it takes to speak.
  const hasProgress = audioProgress !== null && audioProgress !== undefined;
  const totalChars = leadChars + text.length + tailChars || 1;
  let acc = leadChars;
  const startFrac = parts.map(p => {
    const f = acc / totalChars;
    acc += p.value.length;
    return f;
  });

  return (
    <>
      <span className={className}>
        {parts.map((p, i) => {
          const isHighlighted = hasProgress && (audioProgress as number) >= startFrac[i];
          return p.kind === 'word' ? (
            <button
              key={i}
              type="button"
              onClick={e => openWord(p.value, target, e.currentTarget)}
              className={cn(
                "inline rounded px-0.5 transition-colors cursor-pointer",
                isHighlighted ? "bg-indigo-100 text-indigo-700" : "hover:bg-indigo-100 hover:text-indigo-700"
              )}
            >
              {p.value}
            </button>
          ) : (
            <span key={i} className={isHighlighted ? "text-indigo-700 font-medium transition-colors" : ""}>{p.value}</span>
          );
        })}
      </span>
      {popover && <TranslationPopover popover={popover} onClose={close} />}
    </>
  );
}

function TranslationPopover({
  popover,
  onClose,
}: {
  popover: { word: string; rect: DOMRect; result?: TranslationResult; loading: boolean };
  onClose: () => void;
}) {
  const { t } = useTranslation('livestream');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const speak = () => {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(popover.word);
    u.lang = 'en-US';
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  // Position near the clicked word; clamp to viewport.
  const top = Math.min(popover.rect.bottom + 6, window.innerHeight - 180);
  const left = Math.min(Math.max(popover.rect.left - 20, 8), window.innerWidth - 280);

  // Portal to <body>: the popover is `position: fixed`, but a `LessonSlide`
  // ancestor animates `transform` (animate-slide-in / ken-burns), which makes
  // that ancestor the containing block + stacking context for fixed children —
  // trapping the popover (wrong position AND covered by z-10/z-30 siblings).
  // Rendering into <body> escapes the transformed ancestor entirely.
  return createPortal(
    <div
      ref={ref}
      className="fixed z-50 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-3 animate-in fade-in zoom-in-95"
      style={{ top, left }}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-base font-bold text-slate-900">{popover.word}</p>
            <button
              onClick={speak}
              className="text-slate-400 hover:text-indigo-500 transition-colors"
              aria-label={t('translate.pronounce')}
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {popover.result?.pronunciation && normalizeIpa(popover.result.pronunciation) && (
            <p className="text-[11px] text-slate-400 mt-0.5">/{normalizeIpa(popover.result.pronunciation)}/</p>
          )}
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 -mt-0.5 -mr-1">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-2 min-h-[36px]">
        {popover.loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block w-3 h-3 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
            {t('translate.loading')}
          </div>
        )}
        {popover.result && !popover.loading && (
          <>
            <p className="text-sm text-slate-700 leading-snug">{popover.result.meaning}</p>
            {popover.result.example && (
              <p className="text-[11px] text-slate-400 mt-1.5 italic leading-snug">
                "{popover.result.example}"
              </p>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
