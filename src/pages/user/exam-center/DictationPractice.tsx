import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { dictationService, type DictationExerciseDetail, type DictationSentence } from "@/lib/api/services/user/dictation/dictation.service";

// ═══════════════════════════════════════════════════════════════════════════════
// Types & Helpers
// ═══════════════════════════════════════════════════════════════════════════════

interface WordResult {
  word: string;
  expected: string;
  status: "correct" | "wrong" | "missing";
}

/** Strip ALL non-alphanumeric chars for comparison (punctuation, apostrophes, hyphens) */
function stripForCompare(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Compare user input against expected text.
 * - Comparison ignores ALL punctuation, casing, apostrophes, hyphens
 * - Returns formatted input using expected text's original formatting for correct words
 * - Example: user "good morning id like" vs expected "Good morning. I'd like"
 *   → formattedInput = "Good morning. I'd like", accuracy = 100%
 */
function compareWords(
  userInput: string,
  expected: string
): { words: WordResult[]; accuracy: number; formattedInput: string } {
  const expectedTokens = expected.split(/\s+/).filter(Boolean);
  const userTokens = userInput.split(/\s+/).filter(Boolean);
  const hasTrailingSpace = userInput.endsWith(" ");

  const words: WordResult[] = [];
  let correctCount = 0;
  const formattedParts: string[] = [];

  for (let i = 0; i < expectedTokens.length; i++) {
    const expToken = expectedTokens[i];
    const expClean = stripForCompare(expToken);
    const usrToken = userTokens[i];
    const usrClean = usrToken ? stripForCompare(usrToken) : "";

    if (!usrToken) {
      // Only show missing words if user typed a trailing space (they're stuck)
      if (hasTrailingSpace) {
        words.push({ word: "•".repeat(expClean.length || 3), expected: expToken, status: "missing" });
      }
      // else: skip — user hasn't gotten to this word yet
    } else if (usrClean === expClean) {
      words.push({ word: expToken, expected: expToken, status: "correct" });
      correctCount++;
      formattedParts.push(expToken);
    } else {
      words.push({ word: usrToken, expected: expToken, status: "wrong" });
      formattedParts.push(usrToken);
    }
  }

  for (let i = expectedTokens.length; i < userTokens.length; i++) {
    words.push({ word: userTokens[i], expected: "", status: "wrong" });
  }

  const accuracy = expectedTokens.length > 0
    ? Math.round((correctCount / expectedTokens.length) * 100)
    : 0;

  return { words, accuracy, formattedInput: formattedParts.join(" ") };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════════

export default function DictationPractice() {
  const { exerciseId } = useParams<{ exerciseId: string }>();

  const [exercise, setExercise] = useState<DictationExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [results, setResults] = useState<WordResult[] | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Load saved progress from localStorage
  const storageKey = `dictation-progress-${exerciseId}`;
  const [completedSet, setCompletedSet] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return new Set(JSON.parse(saved) as number[]);
    } catch { /* ignore */ }
    return new Set();
  });

  // Persist progress whenever completedSet changes
  useEffect(() => {
    if (completedSet.size > 0) {
      localStorage.setItem(storageKey, JSON.stringify([...completedSet]));
    }
  }, [completedSet, storageKey]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeTab, setActiveTab] = useState<"dictation" | "transcript">("dictation");

  const audioRef = useRef<HTMLAudioElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const playTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // ─── Fetch Exercise ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!exerciseId) return;
    const fetchEx = async () => {
      try {
        const resp = await dictationService.getExerciseById(exerciseId);
        setExercise(resp.data);

        // Auto-navigate to first uncompleted sentence
        const sentences = resp.data?.sentences || [];
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const done = new Set(JSON.parse(saved) as number[]);
          const firstUndone = sentences.findIndex((_: unknown, i: number) => !done.has(i));
          if (firstUndone > 0) {
            setCurrentIndex(firstUndone);
          }
        }
      } catch {
        setError("Exercise not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchEx();
  }, [exerciseId, storageKey]);

  const sentences: DictationSentence[] = exercise?.sentences || [];
  const currentSentence = sentences[currentIndex] ?? null;
  const totalSentences = sentences.length;
  const completedCount = completedSet.size;
  const progressPercent = totalSentences > 0 ? Math.round((completedCount / totalSentences) * 100) : 0;

  // ─── Audio ─────────────────────────────────────────────────────────────────
  const playSegment = useCallback(() => {
    if (!audioRef.current || !currentSentence) return;
    const audio = audioRef.current;
    audio.playbackRate = playbackSpeed;
    audio.currentTime = currentSentence.startTime;
    audio.play();
    setIsPlaying(true);
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    const duration = (currentSentence.endTime - currentSentence.startTime) / playbackSpeed;
    playTimeoutRef.current = setTimeout(() => {
      audio.pause();
      setIsPlaying(false);
    }, duration * 1000 + 100);
  }, [currentSentence, playbackSpeed]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
      setIsPlaying(false);
    } else {
      playSegment();
    }
  }, [isPlaying, playSegment]);

  useEffect(() => {
    if (currentSentence && audioRef.current) {
      const timer = setTimeout(playSegment, 300);
      return () => clearTimeout(timer);
    }
  }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const speeds = useMemo(() => [0.75, 1, 1.25], []);
  const cycleSpeed = useCallback(() => {
    setPlaybackSpeed((prev) => {
      const idx = speeds.indexOf(prev);
      const next = speeds[(idx + 1) % speeds.length];
      if (audioRef.current) audioRef.current.playbackRate = next;
      return next;
    });
  }, [speeds]);

  // ─── Check / Skip / Navigate ───────────────────────────────────────────────
  const handleCheck = useCallback(() => {
    if (!userInput.trim() || !currentSentence) return;
    const result = compareWords(userInput, currentSentence.text);
    setResults(result.words);
    setUserInput(result.formattedInput); // Auto-format with punctuation!
    setAttempts((a) => a + 1);
    if (result.accuracy === 100) {
      setIsCorrect(true);
      setCompletedSet((prev) => new Set(prev).add(currentIndex));
    } else {
      setIsCorrect(false);
    }
  }, [userInput, currentSentence, currentIndex]);

  const handleSkip = useCallback(() => {
    if (!currentSentence) return;
    setShowAnswer(true);
    setUserInput(currentSentence.text);
    setResults(
      currentSentence.text
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => ({ word: w, expected: w, status: "correct" as const }))
    );
    setIsCorrect(true);
    setCompletedSet((prev) => new Set(prev).add(currentIndex));
  }, [currentSentence, currentIndex]);

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalSentences) return;
      setCurrentIndex(index);
      setUserInput("");
      setResults(null);
      setIsCorrect(false);
      setShowAnswer(false);
      setAttempts(0);
      if (audioRef.current) {
        audioRef.current.pause();
        if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
        setIsPlaying(false);
      }
      setTimeout(() => textareaRef.current?.focus(), 100);
    },
    [totalSentences]
  );

  // ─── Keyboard Shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl alone (no combo like Ctrl+V, Ctrl+C, Ctrl+A) → replay
      if (e.ctrlKey && e.key === "Control") {
        e.preventDefault();
        playSegment();
        return;
      }
      if (e.key === "Enter" && !e.shiftKey && e.target instanceof HTMLTextAreaElement) {
        e.preventDefault();
        if (isCorrect) goTo(currentIndex + 1);
        else handleCheck();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playSegment, handleCheck, isCorrect, currentIndex, goTo]);

  useEffect(() => () => {
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-teal-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-teal-600 animate-spin" />
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading exercise...</p>
        </div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl border border-slate-200 p-10 shadow-sm max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-red-400 text-3xl">error</span>
          </div>
          <p className="text-slate-600 font-medium mb-1">{error || "Exercise not found."}</p>
          <Link to="/dictation" className="text-teal-600 hover:text-teal-700 font-semibold text-sm mt-4 inline-block">
            ← Back to exercises
          </Link>
        </div>
      </div>
    );
  }

  const isComplete = completedCount === totalSentences && totalSentences > 0;

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* ─── Top Nav + Title ─── */}
      <div className="mb-6">
        <Link
          to="/dictation"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-teal-600 font-medium mb-3 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Quay lại danh sách
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{exercise.title}</h1>
            {exercise.description && (
              <p className="text-slate-500 text-sm mt-0.5">{exercise.description}</p>
            )}
          </div>
          {exercise.level && (
            <span className="text-[11px] font-black px-3 py-1 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-white uppercase tracking-wider shadow-sm">
              {exercise.level}
            </span>
          )}
        </div>
      </div>

      {/* ─── Progress ─── */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-sm p-4 mb-5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-teal-600 text-lg">trending_up</span>
            </div>
            <span className="text-sm font-bold text-slate-700">Tiến độ</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-teal-600">{progressPercent}%</span>
            <span className="text-xs text-slate-400">({completedCount}/{totalSentences})</span>
          </div>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex gap-1 p-1 bg-slate-100/80 rounded-xl mb-5 w-fit">
        {[
          { key: "dictation" as const, label: "Luyện tập", icon: "headphones" },
          { key: "transcript" as const, label: "Transcript", icon: "description" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === tab.key
                ? "bg-white text-teal-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <audio ref={audioRef} src={exercise.audioUrl} preload="auto" />

      {/* ─── Completion Celebration ─── */}
      {isComplete && (
        <div className="mb-5 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl p-8 text-center text-white shadow-xl shadow-teal-500/20 animate-fade-in">
          <div className="text-5xl mb-3">🎉</div>
          <h3 className="text-2xl font-black mb-1">Hoàn thành xuất sắc!</h3>
          <p className="text-teal-100 mb-6">Bạn đã hoàn thành cả {totalSentences} câu</p>
          <Link
            to="/dictation"
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-8 py-3 rounded-xl font-bold transition-colors inline-flex items-center gap-2 border border-white/20"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Chọn bài khác
          </Link>
        </div>
      )}

      {/* ═══ Dictation Tab ═══ */}
      {activeTab === "dictation" && currentSentence && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Sentence Nav */}
          <div className="flex items-center justify-between px-6 py-3 bg-slate-50/80 border-b border-slate-100">
            <button
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="w-8 h-8 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-slate-500 text-lg">chevron_left</span>
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-extrabold text-slate-800">
                Câu {currentIndex + 1}
              </span>
              <span className="text-xs text-slate-400">/ {totalSentences}</span>
              {/* Mini progress dots */}
              <div className="hidden sm:flex gap-0.5 ml-2">
                {sentences.slice(Math.max(0, currentIndex - 3), currentIndex + 4).map((_, i) => {
                  const idx = Math.max(0, currentIndex - 3) + i;
                  return (
                    <button
                      key={idx}
                      onClick={() => goTo(idx)}
                      className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === currentIndex
                          ? "bg-teal-600 w-4"
                          : completedSet.has(idx)
                          ? "bg-emerald-400"
                          : "bg-slate-200"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
            <button
              onClick={() => goTo(currentIndex + 1)}
              disabled={currentIndex >= totalSentences - 1}
              className="w-8 h-8 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-slate-500 text-lg">chevron_right</span>
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Audio Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg shrink-0 ${
                  isPlaying
                    ? "bg-slate-700 hover:bg-slate-800 shadow-slate-700/25 scale-95"
                    : "bg-gradient-to-br from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-teal-500/25"
                }`}
              >
                <span className="material-symbols-outlined text-white text-[28px]">
                  {isPlaying ? "pause" : "play_arrow"}
                </span>
              </button>

              <button
                onClick={playSegment}
                className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 flex items-center justify-center transition-all cursor-pointer"
                title="Nghe lại"
              >
                <span className="material-symbols-outlined text-slate-500 text-[20px]">replay</span>
              </button>

              <button
                onClick={cycleSpeed}
                className="h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-sm font-mono font-extrabold text-slate-600 transition-all cursor-pointer"
              >
                {playbackSpeed}×
              </button>

              {isPlaying && (
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="flex gap-0.5">
                    {[1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className="w-0.5 bg-teal-500 rounded-full animate-pulse"
                        style={{
                          height: `${8 + Math.random() * 12}px`,
                          animationDelay: `${i * 0.15}s`,
                          animationDuration: "0.6s",
                        }}
                      />
                    ))}
                  </span>
                  <span className="text-xs text-teal-600 font-semibold">Đang phát...</span>
                </div>
              )}

              <div className="ml-auto hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px]">Ctrl</kbd>
                <span>Nghe lại</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px]">Enter</kbd>
                <span>Kiểm tra</span>
              </div>
            </div>

            {/* Input Area */}
            <textarea
              ref={textareaRef}
              className={`w-full h-28 rounded-xl p-4 text-lg leading-relaxed outline-none transition-all resize-none font-serif ${
                isCorrect
                  ? "border-2 border-emerald-300 bg-emerald-50/50 text-emerald-800"
                  : "border-2 border-slate-200 focus:border-teal-400 focus:ring-4 focus:ring-teal-100 hover:border-slate-300"
              }`}
              placeholder="Nghe và gõ những gì bạn nghe được..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={showAnswer}
            />

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {!isCorrect ? (
                <>
                  <button
                    onClick={handleCheck}
                    disabled={!userInput.trim()}
                    className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:from-slate-300 disabled:to-slate-300 text-white px-7 py-2.5 rounded-xl font-bold transition-all disabled:cursor-not-allowed cursor-pointer shadow-sm disabled:shadow-none flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    Kiểm tra
                  </button>
                  <button
                    onClick={handleSkip}
                    className="bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 px-6 py-2.5 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    Bỏ qua
                  </button>
                  {attempts > 0 && results && (
                    <span className="ml-auto text-xs text-slate-400">
                      Lần thử: {attempts}
                    </span>
                  )}
                </>
              ) : (
                <button
                  onClick={() => goTo(currentIndex + 1)}
                  disabled={currentIndex >= totalSentences - 1}
                  className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:from-slate-300 disabled:to-slate-300 text-white px-7 py-2.5 rounded-xl font-bold transition-all disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  Câu tiếp
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              )}
            </div>

            {/* Result: Incorrect hint */}
            {results && !isCorrect && (
              <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl animate-shake">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-600 text-[18px]">lightbulb</span>
                  </div>
                  <span className="font-bold text-amber-800 text-sm">Gợi ý</span>
                  <span className="text-[11px] text-amber-500 ml-auto">Lần {attempts}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(() => {
                    let firstWrongRevealed = false;
                    return results.map((w, i) => {
                      let style = "";
                      let text = "";

                      if (w.status === "correct") {
                        style = "text-emerald-700 bg-emerald-100 font-semibold";
                        text = w.expected;
                      } else if (!firstWrongRevealed) {
                        // First wrong/missing word → reveal in red
                        firstWrongRevealed = true;
                        style = "text-red-600 bg-red-50 font-semibold border border-red-200";
                        text = w.expected;
                      } else {
                        // Other wrong/missing words → stay hidden
                        style = "text-slate-400 bg-slate-100 font-mono tracking-wide";
                        text = "•".repeat(w.expected.length || 3);
                      }

                      return (
                        <span key={i} className={`inline-flex px-2 py-1 rounded-md text-sm transition-all ${style}`}>
                          {text}
                        </span>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Result: Correct */}
            {results && isCorrect && (
              <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[18px]">check</span>
                  </div>
                  <span className="font-bold text-emerald-800 text-sm">
                    {showAnswer ? "Đáp án" : "Chính xác!"}
                  </span>
                  {!showAnswer && attempts > 0 && (
                    <span className="text-xs text-emerald-500 ml-2">
                      {attempts === 1 ? "Lần đầu! 🎉" : `${attempts} lần thử`}
                    </span>
                  )}
                </div>
                <p className="text-emerald-800 font-serif text-lg leading-relaxed">{currentSentence.text}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Transcript Tab ═══ */}
      {activeTab === "transcript" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400 text-lg">description</span>
              Toàn bộ Transcript
            </h3>
            <span className="text-xs text-slate-400">
              {completedCount} / {totalSentences} đã hoàn thành
            </span>
          </div>
          <div className="space-y-1.5">
            {sentences.map((s, i) => (
              <div
                key={s.id}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  completedSet.has(i)
                    ? "bg-emerald-50/80 border border-emerald-100"
                    : i === currentIndex
                    ? "bg-teal-50 border border-teal-200"
                    : "hover:bg-slate-50 border border-transparent"
                }`}
                onClick={() => {
                  goTo(i);
                  setActiveTab("dictation");
                }}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                    completedSet.has(i)
                      ? "bg-emerald-500 text-white"
                      : i === currentIndex
                      ? "bg-teal-500 text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {completedSet.has(i) ? "✓" : i + 1}
                </span>
                <p
                  className={`text-sm leading-relaxed font-serif transition-all ${
                    completedSet.has(i)
                      ? "text-emerald-800"
                      : "text-slate-400 blur-[3px] hover:blur-none select-none"
                  }`}
                >
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
