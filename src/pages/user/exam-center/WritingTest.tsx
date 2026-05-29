import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSubmitWriting, useWritingEvaluation, useWritingAssistant } from "@/hooks/api/use-ai-evaluation";

// ─── Helper: extract last 2 sentences ────────────────────────────────────────
function extractLastTwoSentences(text: string): { lastSentence: string; prevSentence: string } {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  const last = sentences[sentences.length - 1] || "";
  const prev = sentences[sentences.length - 2] || "";
  return { lastSentence: last, prevSentence: prev };
}

export default function WritingTest() {
  const navigate = useNavigate();
  const { t } = useTranslation("exam");

  // ─── State ──────────────────────────────────────────────────────────────────
  const [essayText, setEssayText] = useState("");
  const [timeLeft, setTimeLeft] = useState(40 * 60); // 40 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── Hooks ──────────────────────────────────────────────────────────────────
  const submitWriting = useSubmitWriting();
  const { data: evaluation } = useWritingEvaluation(evaluationId);
  const { result: assistantResult, isLoading: assistantLoading, analyze } = useWritingAssistant();

  // Word count
  const wordCount = essayText.trim().split(/\s+/).filter(Boolean).length;

  // User ID from localStorage
  const getUserId = () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.userId || payload.sub || "anonymous";
      }
    } catch { /* ignore */ }
    return "anonymous";
  };

  // ─── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft <= 0 || showResult) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Auto-submit when time's up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, showResult]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ─── Writing Assistant (debounced) ──────────────────────────────────────────
  useEffect(() => {
    if (essayText.length > 30) {
      const { lastSentence, prevSentence } = extractLastTwoSentences(essayText);
      analyze(lastSentence, prevSentence);
    }
  }, [essayText, analyze]);

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (isSubmitting || essayText.trim().length < 50) return;
    setIsSubmitting(true);

    try {
      const result = await submitWriting.mutateAsync({
        userId: getUserId(),
        essayText: essayText.trim(),
      });
      const evalId = result.data?.evaluationId || null;
      setEvaluationId(evalId);
      setShowResult(true);
      // Update URL with evaluationId
      if (evalId) {
        window.history.replaceState(null, "", `/exam/test/writing/session/${evalId}`);
      }
    } catch (err) {
      console.error("Submit failed:", err);
      setIsSubmitting(false);
    }
  }, [essayText, isSubmitting, submitWriting]);

  // ─── When evaluation completes, stop loading ───────────────────────────────
  useEffect(() => {
    if (evaluation?.status === "COMPLETED" || evaluation?.status === "FAILED") {
      setIsSubmitting(false);
    }
  }, [evaluation?.status]);

  // ─── Result Screen ─────────────────────────────────────────────────────────
  if (showResult) {
    return (
      <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-900">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">W</div>
            <h1 className="font-bold text-slate-800">{t("writingTest.result.header")}</h1>
          </div>
          <Link to="/practice" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            {t("writingTest.result.backToTests")}
          </Link>
        </header>

        <div className="max-w-4xl mx-auto p-8">
          {/* Loading State */}
          {(!evaluation || evaluation.status === "PENDING" || evaluation.status === "PROCESSING") && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">{t("writingTest.result.evaluatingTitle")}</h2>
              <p className="text-slate-500">{t("writingTest.result.evaluatingSubtitle")}</p>
            </div>
          )}

          {/* Failed State */}
          {evaluation?.status === "FAILED" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
              <span className="material-symbols-outlined text-red-500 text-5xl mb-4 block">error</span>
              <h2 className="text-xl font-bold text-red-800 mb-2">{t("writingTest.result.failedTitle")}</h2>
              <p className="text-red-600 mb-4">{t("writingTest.result.failedBody")}</p>
              <button onClick={() => { setShowResult(false); setEvaluationId(null); setIsSubmitting(false); }}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700">
                {t("writingTest.result.retry")}
              </button>
            </div>
          )}

          {/* Completed State */}
          {evaluation?.status === "COMPLETED" && evaluation.criteria && (
            <div className="space-y-6">
              {/* Overall Band */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                <p className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-2">{t("writingTest.result.estimatedBand")}</p>
                <div className="text-7xl font-black text-indigo-600 mb-2">{evaluation.overallBand}</div>
                <p className="text-xs text-slate-400 italic mb-3">{t("writingTest.result.disclaimer")}</p>
                <p className="text-slate-600 text-sm max-w-xl mx-auto">{evaluation.overallFeedback}</p>
              </div>

              {/* Criteria Scores */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "task_achievement", labelKey: "taskAchievement", icon: "task_alt" },
                  { key: "coherence", labelKey: "coherence", icon: "link" },
                  { key: "lexical", labelKey: "lexical", icon: "dictionary" },
                  { key: "grammar", labelKey: "grammar", icon: "spellcheck" },
                ].map(({ key, labelKey, icon }) => {
                  const c = evaluation.criteria?.[key as keyof typeof evaluation.criteria] as any;
                  if (!c) return null;
                  return (
                    <div key={key} className="bg-white rounded-xl border border-slate-200 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-indigo-500 text-xl">{icon}</span>
                          <span className="font-semibold text-slate-800 text-sm">{t(`writingTest.result.criteria.${labelKey}`)}</span>
                        </div>
                        <span className="text-2xl font-black text-indigo-600">{c.score}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{c.feedback}</p>
                      {c.improvements && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1 mb-1">
                            <span className="material-symbols-outlined text-sm">tips_and_updates</span>
                            {t("writingTest.result.improvementsTitle")}
                          </p>
                          <p className="text-xs text-emerald-600 leading-relaxed">{c.improvements}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Highlighted Errors */}
              {evaluation.highlightedErrors && evaluation.highlightedErrors.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500">edit_note</span>
                    {t("writingTest.result.keyCorrections")} ({evaluation.highlightedErrors.length})
                  </h3>
                  <div className="space-y-3">
                    {evaluation.highlightedErrors.map((err: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          err.type === "grammar" ? "bg-red-100 text-red-700" :
                          err.type === "vocab" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {err.type}
                        </span>
                        <div className="flex-1 text-sm">
                          <p className="text-red-600 line-through">{err.original}</p>
                          <p className="text-green-700 font-medium">→ {err.suggestion}</p>
                          {err.explanation && (
                            <p className="text-xs text-slate-500 mt-1 italic">{err.explanation}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center pt-4">
                <Link to="/practice" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                  {t("writingTest.result.backToPractice")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Writing Editor Screen ─────────────────────────────────────────────────
  return (
    <div className="bg-[#f8fafc] h-screen flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">W</div>
          <h1 className="font-bold text-slate-800">{t("writingTest.editor.header")}</h1>
          <div className="h-4 w-[1px] bg-slate-300 mx-2"></div>
          <span className="text-sm font-medium text-slate-500">{t("writingTest.editor.taskLabel")}</span>
        </div>
        <div className="flex items-center gap-6">
          {/* Writing Assistant Indicator */}
          {assistantLoading && (
            <div className="flex items-center gap-2 text-xs text-indigo-600 animate-pulse">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
              {t("writingTest.editor.assistantReading")}
            </div>
          )}
          {/* Timer */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${timeLeft < 300 ? "bg-red-100 text-red-700" : "bg-slate-100"}`}>
            <span className="material-symbols-outlined text-slate-500 text-[20px]">timer</span>
            <span className={`font-mono font-bold ${timeLeft < 300 ? "text-red-700" : "text-slate-700"}`}>{formatTime(timeLeft)}</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || wordCount < 20}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            {isSubmitting ? t("writingTest.editor.submitting") : t("writingTest.editor.submit")}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Prompt */}
        <div className="w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col h-full overflow-y-auto p-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("writingTest.editor.taskPromptLabel")}</h2>
            <h3 className="text-lg font-bold text-slate-900 mb-4">{t("writingTest.editor.promptTitle")}</h3>
            <p className="text-sm text-slate-600 mb-4 italic border-l-4 border-indigo-500 pl-4 py-1 bg-indigo-50/50 rounded-r">
              &quot;{t("writingTest.editor.promptQuote")}&quot;
            </p>
            <div className="space-y-2 text-sm text-slate-600">
              <p>{t("writingTest.editor.promptHint1")}</p>
              <p>{t("writingTest.editor.promptHint2")}</p>
            </div>
          </div>

          {/* Writing Assistant Suggestions */}
          {assistantResult && (assistantResult.errors.length > 0 || assistantResult.suggestions.length > 0) && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-4">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                {t("writingTest.editor.assistantTitle")}
              </h4>
              {assistantResult.errors.map((err, i) => (
                <div key={`err-${i}`} className="text-xs mb-2 p-2 bg-white rounded border border-amber-100">
                  <span className={`font-bold px-1.5 py-0.5 rounded mr-1 ${
                    err.type === "grammar" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                  }`}>{err.type}</span>
                  <span className="text-red-600 line-through">{err.text}</span>
                  <span className="mx-1">→</span>
                  <span className="text-green-700 font-medium">{err.suggestion}</span>
                </div>
              ))}
              {assistantResult.suggestions.map((sug, i) => (
                <div key={`sug-${i}`} className="text-xs mb-1 p-2 bg-white rounded border border-blue-100">
                  <span className="font-bold text-blue-600 mr-1">💡</span>
                  {sug.improvement}
                </div>
              ))}
            </div>
          )}

          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
            <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">{t("writingTest.editor.tipsTitle")}</h4>
            <ul className="text-xs text-indigo-700 space-y-1 list-disc list-inside">
              <li>{t("writingTest.editor.tips.plan")}</li>
              <li>{t("writingTest.editor.tips.mix")}</li>
              <li>{t("writingTest.editor.tips.check")}</li>
              <li>{t("writingTest.editor.tips.address")}</li>
            </ul>
          </div>
        </div>

        {/* Right Panel: Editor */}
        <div className="w-2/3 bg-white flex flex-col h-full">
          <div className="p-2 border-b border-slate-200 flex items-center gap-1 bg-slate-50">
            <div className="ml-auto flex items-center gap-3 px-3">
              <span className="text-xs font-medium text-slate-400">
                {t("writingTest.editor.wordCountLabel")} <span className={`font-bold ${wordCount >= 250 ? "text-green-600" : wordCount >= 200 ? "text-amber-600" : "text-slate-700"}`}>{wordCount}</span>
                <span className="text-slate-300 ml-1">{t("writingTest.editor.wordCountMin")}</span>
              </span>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            className="flex-1 p-8 text-lg leading-relaxed text-slate-800 outline-none resize-none font-serif"
            placeholder={t("writingTest.editor.placeholder")}
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
