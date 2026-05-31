import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

interface Props {
  audioUrl: string;
  /** Whisper per-segment timestamps. When present, each line is clickable. */
  segments?: TranscriptSegment[] | null;
  /** Plain transcript fallback when there are no timestamped segments. */
  transcript?: string;
  title?: string;
  className?: string;
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/**
 * Listening review player: an audio element plus its transcript. When segment
 * timestamps exist, every line is clickable — clicking seeks the audio to that
 * moment, and the line currently being spoken is highlighted (karaoke style).
 */
export default function SyncedAudioTranscript({
  audioUrl,
  segments,
  transcript,
  title,
  className,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lineRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const hasSegments = Array.isArray(segments) && segments.length > 0;

  const onTimeUpdate = useCallback(() => {
    const el = audioRef.current;
    if (!el || !hasSegments) return;
    const t = el.currentTime;
    const idx = segments!.findIndex((s) => t >= s.start && t < s.end);
    setActiveIdx((prev) => (idx !== prev ? idx : prev));
  }, [segments, hasSegments]);

  // Keep the highlighted line in view as the audio plays.
  useEffect(() => {
    if (activeIdx < 0) return;
    lineRefs.current[activeIdx]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeIdx]);

  const seekTo = useCallback((seg: TranscriptSegment, i: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = seg.start + 0.01;
    setActiveIdx(i);
    el.play().catch(() => {});
  }, []);

  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white overflow-hidden", className)}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
        <span className="material-symbols-outlined text-teal-600 text-[18px]">headphones</span>
        <p className="text-sm font-bold text-slate-700">{title || "Nghe lại"}</p>
        {hasSegments && (
          <span className="ml-auto text-[11px] text-slate-400">Bấm vào dòng để nghe đúng đoạn đó</span>
        )}
      </div>

      <div className="p-4 space-y-3">
        <audio
          ref={audioRef}
          controls
          src={audioUrl}
          preload="metadata"
          onTimeUpdate={onTimeUpdate}
          className="w-full h-10"
        >
          Trình duyệt không hỗ trợ phát audio.
        </audio>

        {hasSegments ? (
          <div className="max-h-[360px] overflow-y-auto rounded-lg border border-slate-100 divide-y divide-slate-50">
            {segments!.map((seg, i) => (
              <button
                key={i}
                ref={(el) => { lineRefs.current[i] = el; }}
                onClick={() => seekTo(seg, i)}
                className={cn(
                  "w-full text-left flex gap-3 px-3 py-2 transition-colors cursor-pointer",
                  i === activeIdx
                    ? "bg-indigo-50 border-l-2 border-indigo-500"
                    : "hover:bg-slate-50 border-l-2 border-transparent",
                )}
              >
                <span className="text-[11px] font-mono text-slate-400 shrink-0 mt-0.5 tabular-nums w-10">
                  {fmt(seg.start)}
                </span>
                <span className={cn("text-sm leading-relaxed", i === activeIdx ? "text-indigo-900 font-medium" : "text-slate-700")}>
                  {seg.text}
                </span>
              </button>
            ))}
          </div>
        ) : transcript ? (
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-mono max-h-[360px] overflow-y-auto">
            {transcript}
          </p>
        ) : (
          <p className="text-sm text-slate-400 italic">Không có transcript cho phần này.</p>
        )}
      </div>
    </div>
  );
}
