import { useEffect, useRef, useState } from "react";
import type { PlacementQuestionPayload } from "@/lib/api/services/user/placement/placement.service";
import { OptionCard } from "./OptionCard";

interface ListeningRendererProps {
  question: PlacementQuestionPayload;
  selected?: "A" | "B" | "C";
  onSelect: (option: "A" | "B" | "C") => void;
}

const MAX_PLAYS = 2;

export function ListeningRenderer({ question, selected, onSelect }: ListeningRendererProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [plays, setPlays] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [ttsUnavailable, setTtsUnavailable] = useState(false);

  useEffect(() => {
    setPlays(0);
    setPlaying(false);
    setHasPlayed(false);
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, [question.id]);

  const canPlayMore = plays < MAX_PLAYS;

  const playAudio = () => {
    if (!canPlayMore || playing) return;

    if (question.audio_url) {
      const el = audioRef.current;
      if (!el) return;
      el.currentTime = 0;
      el.play().catch(() => undefined);
      setPlaying(true);
      el.onended = () => {
        setPlaying(false);
        setHasPlayed(true);
        setPlays((p) => p + 1);
      };
      return;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utter = new SpeechSynthesisUtterance(question.audio_script ?? "");
      utter.lang = "en-US";
      utter.rate = 0.95;
      utter.onend = () => {
        setPlaying(false);
        setHasPlayed(true);
        setPlays((p) => p + 1);
      };
      setPlaying(true);
      window.speechSynthesis.speak(utter);
    } else {
      setTtsUnavailable(true);
      setHasPlayed(true);
    }
  };

  const optionsDisabled = !hasPlayed;

  return (
    <div className="space-y-6">
      {question.audio_context && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-semibold">Context:</span> {question.audio_context}
        </p>
      )}

      <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-slate-200 bg-slate-50 p-6">
        {question.audio_url ? (
          <audio ref={audioRef} src={question.audio_url} preload="auto" />
        ) : null}

        <button
          type="button"
          onClick={playAudio}
          disabled={!canPlayMore || playing}
          className={[
            "flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-all",
            canPlayMore && !playing
              ? "bg-teal-500 text-white hover:scale-105 hover:bg-teal-600"
              : "bg-slate-300 text-slate-500 cursor-not-allowed",
          ].join(" ")}
          aria-label="Play audio"
        >
          {playing ? (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="flex h-8 items-center gap-1">
          {playing ? (
            Array.from({ length: 7 }).map((_, i) => (
              <span
                key={i}
                className="w-1.5 rounded-full bg-teal-500 animate-pulse"
                style={{
                  height: `${10 + Math.random() * 20}px`,
                  animationDelay: `${i * 100}ms`,
                }}
              />
            ))
          ) : (
            <span className="text-sm text-slate-500">
              {hasPlayed
                ? "Audio complete. Choose your answer."
                : "Press play to hear the question."}
            </span>
          )}
        </div>

        <div className="text-xs text-slate-500">
          Plays remaining: {MAX_PLAYS - plays} / {MAX_PLAYS}
        </div>

        {ttsUnavailable && question.audio_script && (
          <div className="w-full rounded-xl bg-white p-3 text-sm text-slate-700">
            <span className="font-semibold">Transcript:</span> {question.audio_script}
          </div>
        )}
      </div>

      <p className="text-lg font-medium text-slate-800">{question.prompt}</p>

      <div className="space-y-3">
        {(["A", "B", "C"] as const).map((key) => (
          <OptionCard
            key={key}
            label={key}
            text={question.options?.[key] ?? ""}
            selected={selected === key}
            disabled={optionsDisabled}
            onSelect={() => onSelect(key)}
          />
        ))}
      </div>
    </div>
  );
}
