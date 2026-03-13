import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "@/lib/api/config";

interface WordResult {
  word: string;
  expected?: string;
  status: "correct" | "wrong" | "missing";
}

const STATUS_STYLES: Record<string, string> = {
  correct: "text-green-700 bg-green-50 border-green-200",
  wrong: "text-red-700 bg-red-50 border-red-200 line-through",
  missing: "text-slate-400 bg-slate-50 border-slate-200 italic",
};

export default function DictationPractice() {
  const [userInput, setUserInput] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [results, setResults] = useState<WordResult[] | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Sample audio + transcript (in production, fetch from practice-service)
  const sampleAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
  const originalTranscript =
    "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the English alphabet at least once.";

  // ─── Audio Controls ─────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const rewind = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 3);
  }, []);

  const changeSpeed = useCallback(() => {
    const speeds = [0.75, 1, 1.25];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  }, [playbackSpeed]);

  // ─── Keyboard Shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) {
        if (e.key === " " && e.ctrlKey) {
          e.preventDefault();
          togglePlay();
        }
        if (e.key === "ArrowLeft" && e.ctrlKey) {
          e.preventDefault();
          rewind();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, rewind]);

  // ─── Submit for Checking ────────────────────────────────────────────────────
  const handleCheck = useCallback(async () => {
    if (!userInput.trim() || isChecking) return;
    setIsChecking(true);

    try {
      const resp = await apiClient.post("/ai/dictation/check", {
        userInput: userInput.trim(),
        originalTranscript,
      });
      const data = resp.data?.data;
      if (data) {
        setResults(data.words);
        setAccuracy(data.accuracy);
      }
    } catch (err) {
      console.error("Dictation check failed:", err);
    } finally {
      setIsChecking(false);
    }
  }, [userInput, isChecking, originalTranscript]);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold">
            <span className="material-symbols-outlined text-lg">hearing</span>
          </div>
          <h1 className="font-bold text-slate-800">Dictation Practice</h1>
        </div>
        <Link to="/practice" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
          ← Back to Practice
        </Link>
      </header>

      <div className="max-w-3xl mx-auto p-8">
        {/* Audio Player */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Audio Player</h2>
          <audio ref={audioRef} src={sampleAudioUrl} preload="auto" />

          <div className="flex items-center gap-4">
            {/* Rewind */}
            <button onClick={rewind} className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-slate-600">replay</span>
            </button>

            {/* Play/Pause */}
            <button onClick={togglePlay} className="w-14 h-14 rounded-full bg-teal-600 hover:bg-teal-700 flex items-center justify-center transition-colors shadow-lg">
              <span className="material-symbols-outlined text-white text-[28px]">
                {isPlaying ? "pause" : "play_arrow"}
              </span>
            </button>

            {/* Speed */}
            <button onClick={changeSpeed} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-mono font-bold text-slate-600 transition-colors">
              {playbackSpeed}x
            </button>

            <div className="ml-auto text-xs text-slate-400">
              <span className="font-medium">Ctrl+Space</span> = Play/Pause · <span className="font-medium">Ctrl+←</span> = Rewind 3s
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Type what you hear</h2>
          <textarea
            className="w-full h-32 border border-slate-200 rounded-xl p-4 text-lg leading-relaxed outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all resize-none font-serif"
            placeholder="Start typing..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
          />
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-slate-400">
              Word Count: <span className="font-bold text-slate-600">{userInput.trim().split(/\s+/).filter(Boolean).length}</span>
            </span>
            <button
              onClick={handleCheck}
              disabled={isChecking || !userInput.trim()}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white px-6 py-2.5 rounded-xl font-bold transition-colors disabled:cursor-not-allowed"
            >
              {isChecking ? "Checking..." : "Check Answer"}
            </button>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            {/* Accuracy Badge */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Results</h2>
              <div className={`text-2xl font-black px-4 py-1 rounded-xl ${
                accuracy! >= 80 ? "bg-green-100 text-green-700" :
                accuracy! >= 50 ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700"
              }`}>
                {accuracy}%
              </div>
            </div>

            {/* Word-by-word comparison */}
            <div className="flex flex-wrap gap-1.5">
              {results.map((word, i) => (
                <span
                  key={i}
                  className={`inline-block px-2 py-1 rounded-md border text-sm font-medium ${STATUS_STYLES[word.status]}`}
                  title={word.status === "wrong" ? `Expected: ${word.expected}` : undefined}
                >
                  {word.word}
                  {word.status === "wrong" && word.expected && (
                    <span className="ml-1 text-green-600 no-underline font-bold">→{word.expected}</span>
                  )}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-6 mt-6 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-200"></span> Correct</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-200"></span> Wrong</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-100 border border-slate-200"></span> Missing</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
