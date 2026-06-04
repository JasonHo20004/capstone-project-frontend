import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { PlacementQuestionPayload } from "@/lib/api/services/user/placement/placement.service";
import { OptionCard } from "./OptionCard";

interface ListeningRendererProps {
  question: PlacementQuestionPayload;
  selected?: "A" | "B" | "C";
  onSelect: (option: "A" | "B" | "C") => void;
  // Notifies the parent when audio playback is ready (or failed/skipped).
  // Used to pause the question timer while we wait for the clip to load.
  onAudioReadyChange?: (ready: boolean) => void;
}

const MAX_PLAYS = 2;

export function ListeningRenderer({
  question,
  selected,
  onSelect,
  onAudioReadyChange,
}: ListeningRendererProps) {
  const { t } = useTranslation("exam");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [plays, setPlays] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [ttsUnavailable, setTtsUnavailable] = useState(false);
  const [audioLoading, setAudioLoading] = useState<boolean>(!!question.audio_url);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    setPlays(0);
    setPlaying(false);
    setHasPlayed(false);
    setAudioError(false);
    setAudioLoading(!!question.audio_url);
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, [question.id, question.audio_url]);

  // Surface audio readiness to the parent so it can pause the question timer.
  // Questions without an audio URL fall back to TTS and are considered "ready"
  // immediately — the timer should not be blocked on speechSynthesis.
  useEffect(() => {
    if (!onAudioReadyChange) return;
    if (!question.audio_url) {
      onAudioReadyChange(true);
      return;
    }
    onAudioReadyChange(!audioLoading || audioError);
  }, [audioLoading, audioError, question.audio_url, onAudioReadyChange]);

  // Drive loading UI from real audio readiness events
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !question.audio_url) return;
    const onReady = () => setAudioLoading(false);
    const onError = () => {
      setAudioLoading(false);
      setAudioError(true);
    };
    el.addEventListener("canplaythrough", onReady);
    el.addEventListener("loadeddata", onReady);
    el.addEventListener("error", onError);
    try {
      el.load();
    } catch {
      // ignore
    }
    return () => {
      el.removeEventListener("canplaythrough", onReady);
      el.removeEventListener("loadeddata", onReady);
      el.removeEventListener("error", onError);
    };
  }, [question.audio_url, question.id]);

  const canPlayMore = plays < MAX_PLAYS;
  const audioReady = !audioLoading && !audioError;

  const playAudio = () => {
    if (!canPlayMore || playing) return;

    if (question.audio_url) {
      const el = audioRef.current;
      if (!el || !audioReady) return;
      el.currentTime = 0;
      el.play().catch(() => setAudioError(true));
      setPlaying(true);
      setHasPlayed(true);
      el.onended = () => {
        setPlaying(false);
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
        setPlays((p) => p + 1);
      };
      setPlaying(true);
      setHasPlayed(true);
      window.speechSynthesis.speak(utter);
    } else {
      setTtsUnavailable(true);
      setHasPlayed(true);
    }
  };

  const optionsDisabled = !hasPlayed && !ttsUnavailable;

  return (
    <div className="space-y-6">
      {question.audio_context && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <span className="font-semibold">{t("placementTest.listening.contextLabel")}</span> {question.audio_context}
        </motion.p>
      )}

      <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-slate-200 bg-slate-50 p-6">
        {question.audio_url ? (
          // No crossOrigin attribute: <audio> playback does not need CORS,
          // and setting crossOrigin triggers a preflight that S3 currently
          // rejects. Bucket CORS is still recommended (see docs/s3-cors.json).
          <audio ref={audioRef} src={question.audio_url} preload="auto" />
        ) : null}

        <motion.button
          type="button"
          onClick={playAudio}
          disabled={!canPlayMore || playing || (!!question.audio_url && !audioReady)}
          whileTap={{ scale: 0.95 }}
          whileHover={
            canPlayMore && !playing && (audioReady || !question.audio_url) ? { scale: 1.05 } : {}
          }
          className={[
            "flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-colors",
            canPlayMore && !playing && (audioReady || !question.audio_url)
              ? "bg-teal-500 text-white hover:bg-teal-600"
              : "bg-slate-300 text-slate-500 cursor-not-allowed",
          ].join(" ")}
          aria-label={t("placementTest.listening.playAriaLabel")}
        >
          {audioLoading && question.audio_url ? (
            <svg className="h-7 w-7 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
            </svg>
          ) : playing ? (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </motion.button>

        <div className="flex h-8 items-center gap-1">
          {playing ? (
            Array.from({ length: 7 }).map((_, i) => (
              <motion.span
                key={i}
                className="w-1.5 rounded-full bg-teal-500"
                animate={{ height: [10, 26, 12, 22, 14], opacity: [0.6, 1, 0.7, 1, 0.8] }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  delay: i * 0.08,
                  ease: "easeInOut",
                }}
                style={{ height: 14 }}
              />
            ))
          ) : (
            <span className="text-sm text-slate-500">
              {audioLoading && question.audio_url
                ? t("placementTest.listening.preparing")
                : audioError
                  ? t("placementTest.listening.audioError")
                  : hasPlayed
                    ? t("placementTest.listening.answerAny")
                    : t("placementTest.listening.pressPlay")}
            </span>
          )}
        </div>

        <div className="text-xs text-slate-500">
          {t("placementTest.listening.playsRemaining", {
            remaining: MAX_PLAYS - plays,
            total: MAX_PLAYS,
          })}
        </div>

        {ttsUnavailable && question.audio_script && (
          <div className="w-full rounded-xl bg-white p-3 text-sm text-slate-700">
            <span className="font-semibold">{t("placementTest.listening.transcript")}</span> {question.audio_script}
          </div>
        )}
      </div>

      <p className="text-lg font-medium text-slate-800">{question.prompt}</p>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-3"
        >
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
