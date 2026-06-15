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
}

// Split text into clickable English words vs. punctuation/whitespace.
const TOKEN_RE = /([A-Za-z][A-Za-z'-]*)/g;

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
export function TranslatableText({ text, target = 'vi', ragBase, className, audioProgress }: Props) {
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

  // Tokenize
  const parts: { kind: 'word' | 'punct'; value: string }[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push({ kind: 'punct', value: text.slice(last, idx) });
    parts.push({ kind: 'word', value: m[0] });
    last = idx + m[0].length;
  }
  if (last < text.length) parts.push({ kind: 'punct', value: text.slice(last) });

  return (
    <>
      <span className={className}>
        {parts.map((p, i) => {
          const isHighlighted = audioProgress !== null && audioProgress !== undefined && (i / parts.length <= audioProgress);
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
