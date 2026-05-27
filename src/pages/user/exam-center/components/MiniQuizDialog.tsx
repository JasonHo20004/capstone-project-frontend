// =============================================================================
// Mini Quiz Dialog — Quiz UI for skill tree nodes
// =============================================================================

import { useState } from "react";
import { Pause, Volume2, Check, CheckCircle2, MousePointerClick, X, PartyPopper, FileText } from "lucide-react";
import apiClient from "@/lib/api/config";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface MiniQuizQuestion {
  question: string;
  type: string;
  options?: string[];
  pairs?: Array<{ left: string; right: string }>;
  correctIndex?: number;
  correctAnswer?: string;
  skill: string;
  tag: string;
  listenText?: string;
}

interface MiniQuizDialogProps {
  open: boolean;
  onClose: () => void;
  nodeId: string;
  nodeLabel: string;
  nodeDescription: string;
  skillTreeId: string;
  topic: string;
  level: string;
  mixedSkills: string[];
  questionTypes: string[];
  userId: string;
  onQuizComplete: (wrongAnswers: any[]) => void;
}

// ─── Skill Badge Colors ─────────────────────────────────────────────────────────

const SKILL_COLORS: Record<string, string> = {
  grammar: "bg-blue-100 text-blue-700",
  vocabulary: "bg-emerald-100 text-emerald-700",
  listening: "bg-purple-100 text-purple-700",
};

// ─── TTS Player ─────────────────────────────────────────────────────────────────

function TTSPlayer({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);

  const speak = () => {
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    utterance.pitch = 1;

    // Try to use a good English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
      (v) => v.lang.startsWith("en") && v.name.includes("Google")
    ) || voices.find((v) => v.lang.startsWith("en-US"));
    if (englishVoice) utterance.voice = englishVoice;

    utterance.onstart = () => setPlaying(true);
    utterance.onend = () => {
      setPlaying(false);
      setPlayCount((c) => c + 1);
    };
    utterance.onerror = () => setPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-5 mb-4">
      <div className="flex items-center gap-4">
        <button
          onClick={speak}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all shadow-lg ${
            playing
              ? "bg-indigo-600 text-white shadow-indigo-300 scale-105 animate-pulse"
              : "bg-white text-indigo-600 border-2 border-indigo-300 hover:bg-indigo-100 hover:scale-105"
          }`}
        >
          {playing ? <Pause size={20} /> : <Volume2 size={20} />}
        </button>
        <div>
          <p className="text-sm font-bold text-indigo-800">
            {playing ? "Playing audio..." : playCount === 0 ? "Tap to listen" : "Tap to replay"}
          </p>
          <p className="text-xs text-indigo-500 mt-0.5">
            {playCount > 0 ? `Played ${playCount} time${playCount > 1 ? "s" : ""}` : "Listen carefully, then answer"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Pair Match Question (Word Linking / Sentence Matching) ─────────────────────

function PairMatchQuestion({
  pairs,
  value,
  onChange,
}: {
  pairs: Array<{ left: string; right: string }>;
  value: string | undefined;
  onChange: (encoded: string) => void;
}) {
  const parseMatched = (v: string | undefined): Record<number, number> => {
    if (!v) return {};
    return Object.fromEntries(
      v.split(",").filter(Boolean).map((p) => {
        const [l, r] = p.split(":").map(Number);
        return [l, r] as [number, number];
      })
    );
  };

  const [matched, setMatched] = useState<Record<number, number>>(() => parseMatched(value));
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);

  // Deterministic shuffle: rotate right items by ceil(n/2) so answer isn't trivially visible
  const shuffledRight = pairs.map((_, i) => (i + Math.ceil(pairs.length / 2)) % pairs.length);

  const emit = (next: Record<number, number>) => {
    setMatched(next);
    const encoded = Object.entries(next).map(([l, r]) => `${l}:${r}`).join(",");
    onChange(encoded);
  };

  const handleLeftClick = (idx: number) => {
    if (matched[idx] !== undefined) {
      const next = { ...matched };
      delete next[idx];
      emit(next);
      setSelectedLeft(null);
    } else {
      setSelectedLeft((prev) => (prev === idx ? null : idx));
    }
  };

  const handleRightClick = (pos: number) => {
    if (selectedLeft === null) return;
    const origIdx = shuffledRight[pos];
    const next = { ...matched };
    Object.keys(next).forEach((k) => {
      if (next[Number(k)] === origIdx) delete next[Number(k)];
    });
    next[selectedLeft] = origIdx;
    emit(next);
    setSelectedLeft(null);
  };

  const matchedRightSet = new Set(Object.values(matched));
  const matchCount = Object.keys(matched).length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Left column — Terms */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Terms</p>
          {pairs.map((pair, idx) => {
            const isMatched = matched[idx] !== undefined;
            const isSelected = selectedLeft === idx;
            return (
              <button
                key={idx}
                onClick={() => handleLeftClick(idx)}
                className={`w-full text-left p-3 rounded-xl border-2 text-sm transition-all duration-200 ${
                  isMatched
                    ? "border-emerald-400 bg-emerald-50 text-emerald-800 font-medium"
                    : isSelected
                    ? "border-indigo-500 bg-indigo-50 text-indigo-800 font-semibold shadow-md"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-black shrink-0 ${
                      isMatched
                        ? "border-emerald-400 bg-emerald-400 text-white"
                        : isSelected
                        ? "border-indigo-500 bg-indigo-500 text-white"
                        : "border-slate-300 text-slate-400"
                    }`}
                  >
                    {isMatched ? <Check size={12} /> : String.fromCharCode(65 + idx)}
                  </div>
                  <span className="leading-snug">{pair.left}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right column — Matches (shuffled) */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Matches</p>
          {shuffledRight.map((origIdx, pos) => {
            const isMatched = matchedRightSet.has(origIdx);
            return (
              <button
                key={origIdx}
                onClick={() => handleRightClick(pos)}
                className={`w-full text-left p-3 rounded-xl border-2 text-sm transition-all duration-200 ${
                  isMatched
                    ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                    : selectedLeft !== null
                    ? "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 cursor-pointer"
                    : "border-slate-200 text-slate-500"
                }`}
              >
                {pairs[origIdx].right}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-center text-slate-500">
        {matchCount === pairs.length
          ? <><CheckCircle2 size={12} className="inline mr-1" />All {pairs.length} pairs matched!</>
          : selectedLeft !== null
          ? <><MousePointerClick size={12} className="inline mr-1" />Now tap the matching item on the right</>
          : `${matchCount}/${pairs.length} matched — tap a term on the left to start`}
      </p>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function MiniQuizDialog({
  open,
  onClose,
  nodeId,
  nodeLabel,
  nodeDescription,
  skillTreeId,
  topic,
  level,
  mixedSkills,
  questionTypes,
  userId,
  onQuizComplete,
}: MiniQuizDialogProps) {
  const [loading, setLoading] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<MiniQuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Generate quiz on open
  const generateQuiz = async () => {
    setLoading(true);
    try {
      const resp = await apiClient.post("/ai/mini-quiz/generate", {
        userId,
        skillTreeId,
        nodeId,
        topic,
        level,
        nodeLabel,
        nodeDescription,
        mixedSkills,
        questionTypes,
      });
      const data = resp.data?.data;
      if (data) {
        setQuizId(data.id);
        setQuestions(data.questions || []);
        setCurrentIndex(0);
        setAnswers({});
        setResult(null);
      }
    } catch (err) {
      console.error("Failed to generate quiz:", err);
    } finally {
      setLoading(false);
    }
  };

  // Submit answers
  const submitQuiz = async () => {
    if (!quizId) return;
    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([idx, val]) => ({
        questionIndex: parseInt(idx),
        ...(typeof val === "number" ? { selectedIndex: val } : { answerText: val }),
      }));

      const resp = await apiClient.post(`/ai/mini-quiz/${quizId}/submit`, {
        answers: formattedAnswers,
      });

      const data = resp.data?.data;
      setResult(data);
      onQuizComplete(data?.wrongAnswers || []);
    } catch (err) {
      console.error("Failed to submit quiz:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Start quiz when dialog opens
  if (open && !quizId && !loading && questions.length === 0) {
    generateQuiz();
  }

  const handleClose = () => {
    setQuizId(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setResult(null);
    onClose();
  };

  if (!open) return null;

  const currentQuestion = questions[currentIndex];
  const totalAnswered = Object.keys(answers).length;
  const progress = questions.length > 0 ? (totalAnswered / questions.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg text-slate-800">{nodeLabel}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{nodeDescription}</p>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Progress bar */}
          {questions.length > 0 && !result && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Q {currentIndex + 1} / {questions.length}</span>
                <span>{totalAnswered} answered</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="mt-4 text-sm text-slate-500">Generating questions...</p>
            </div>
          )}

          {/* Result state */}
          {result && (
            <div className="text-center py-8">
              <div className={`flex justify-center mb-4 ${result.score >= 70 ? "text-emerald-500" : "text-amber-500"}`}>
                {result.score >= 70 ? <PartyPopper size={56} /> : <FileText size={56} />}
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                {result.score >= 70 ? "Excellent!" : "Keep practicing!"}
              </h3>
              <p className="text-4xl font-black mb-2" style={{
                color: result.score >= 70 ? "#10b981" : "#f59e0b",
              }}>
                {Math.round(result.score)}%
              </p>
              <p className="text-sm text-slate-500 mb-6">
                {result.correctCount} / {result.totalQuestions} correct
              </p>

              {result.wrongAnswers?.length > 0 && (
                <div className="text-left bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <p className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-1"><FileText size={14} /> Areas to improve:</p>
                  {result.wrongAnswers.map((wa: any, i: number) => (
                    <div key={i} className="text-xs text-amber-700 mb-1.5 flex gap-2">
                      <span className="shrink-0 font-bold">#{i + 1}</span>
                      <span>{wa.question}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                {result.wrongAnswers?.length > 0 ? "View remedial nodes" : "Continue learning"}
              </button>
            </div>
          )}

          {/* Question state */}
          {!loading && !result && currentQuestion && (
            <div>
              {/* Skill badge */}
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${SKILL_COLORS[currentQuestion.skill] || "bg-gray-100 text-gray-700"}`}>
                {currentQuestion.skill}
              </span>

              {/* TTS Player for listening questions */}
              {currentQuestion.skill === "listening" && currentQuestion.listenText && (
                <div className="mt-3">
                  <TTSPlayer text={currentQuestion.listenText} />
                </div>
              )}

              {/* Question text */}
              <h3 className="text-lg font-bold text-slate-800 mt-3 mb-5">
                {currentQuestion.question}
              </h3>

              {/* Multiple choice / Fill in blank — show options */}
              {currentQuestion.options && currentQuestion.options.length > 0 && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option: string, optIdx: number) => {
                    const isSelected = answers[currentIndex] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => setAnswers((prev) => ({ ...prev, [currentIndex]: optIdx }))}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-50 shadow-md"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0 ${
                              isSelected
                                ? "border-indigo-500 bg-indigo-500 text-white"
                                : "border-slate-300 text-slate-400"
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          <span className={`text-sm ${isSelected ? "text-indigo-800 font-medium" : "text-slate-700"}`}>
                            {option}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Gap fill (text input) */}
              {currentQuestion.type === "GAP_FILL" && !currentQuestion.options && !currentQuestion.pairs && (
                <input
                  type="text"
                  placeholder="Type your answer..."
                  value={(answers[currentIndex] as string) || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [currentIndex]: e.target.value }))}
                  className="w-full p-4 border-2 border-slate-200 rounded-xl text-slate-800 focus:border-indigo-500 focus:outline-none transition-colors"
                />
              )}

              {/* Word linking / Sentence matching */}
              {(currentQuestion.type === "WORD_LINKING" || currentQuestion.type === "SENTENCE_MATCHING") &&
                currentQuestion.pairs &&
                currentQuestion.pairs.length > 0 && (
                  <PairMatchQuestion
                    key={currentIndex}
                    pairs={currentQuestion.pairs}
                    value={answers[currentIndex] as string | undefined}
                    onChange={(encoded) =>
                      setAnswers((prev) => ({ ...prev, [currentIndex]: encoded }))
                    }
                  />
                )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 disabled:opacity-40 transition-colors"
                >
                  ← Prev
                </button>

                <div className="flex gap-1.5">
                  {questions.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        i === currentIndex
                          ? "bg-indigo-500 scale-110"
                          : answers[i] !== undefined
                          ? "bg-indigo-300"
                          : "bg-slate-300"
                      }`}
                    />
                  ))}
                </div>

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                    className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={submitQuiz}
                    disabled={submitting || totalAnswered < questions.length}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? "Grading..." : "Submit"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
