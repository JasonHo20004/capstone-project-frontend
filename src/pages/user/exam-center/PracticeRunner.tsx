import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePracticeTestDetail, useSubmitPracticeTest } from "@/hooks/api/use-practice";
import type { PracticeQuestion, PracticeQuestionGroup, PracticeSection } from "@/lib/api/services/user/practice/practice.service";
import { ReadingShell, ListeningShell, WritingShell, SpeakingShell } from "@/components/user/exam-center/TestShell";
import { useSubmitWriting, useWritingEvaluation, useWritingAssistant } from "@/hooks/api/use-ai-evaluation";
import { Link } from "react-router-dom";
import { Lightbulb } from "lucide-react";

type AnswerMap = Record<string, unknown>;
type Mode = "reading" | "listening" | "writing" | "speaking";

// ─── Helper ────────────────────────────────────────────────────────────────────
function extractLastTwoSentences(text: string) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  return { lastSentence: sentences[sentences.length - 1] || "", prevSentence: sentences[sentences.length - 2] || "" };
}

function getUserId(): string {
  try {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId || payload.sub || "anonymous";
    }
  } catch { /* ignore */ }
  return "anonymous";
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// =============================================================================
// WRITING PRACTICE UI — Dedicated Layout
// =============================================================================

interface WritingSection {
  id: string;
  title: string;
  taskType: 1 | 2;
  imageUrl?: string;
  prompt: string;
  questionId?: string;
  wordCountMin: number;
}

function WritingPracticeUI({ test }: { test: any }) {
  const navigate = useNavigate();
  const { t } = useTranslation("exam");

  // Parse writing sections from test data
  const writingSections = useMemo<WritingSection[]>(() => {
    const sections: WritingSection[] = [];
    for (const sec of test.sections || []) {
      for (const part of sec.parts || []) {
        for (const group of part.questionGroups || []) {
          for (const q of group.questions || []) {
            const isTask1 = q.questionType?.includes("TASK1") || q.questionText?.toLowerCase().includes("task 1");
            sections.push({
              id: q.id || group.id,
              title: isTask1 ? t("practiceRunner.writing.task1Title") : t("practiceRunner.writing.task2Title"),
              taskType: isTask1 ? 1 : 2,
              imageUrl: group.imageUrl || q.imageUrl || sec.imageUrl || (q as any).content?.imageUrl,
              prompt: q.questionText || (q as any).content?.prompt || "",
              questionId: q.id,
              wordCountMin: isTask1 ? 150 : 250,
            });
          }
        }
      }
    }
    return sections.length > 0 ? sections : [{ id: "fallback", title: t("practiceRunner.writing.task2Title"), taskType: 2 as const, prompt: t("practiceRunner.writing.fallbackPrompt"), wordCountMin: 250 }];
  }, [test, t]);

  const [activeTab, setActiveTab] = useState(0);
  const [essays, setEssays] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState((test.duration || 3600));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const submitWriting = useSubmitWriting();
  const { data: evaluation } = useWritingEvaluation(evaluationId);
  const { result: assistantResult, isLoading: assistantLoading, analyze } = useWritingAssistant();

  const activeSection = writingSections[activeTab];
  const currentEssay = essays[activeTab] || "";
  const wordCount = currentEssay.trim().split(/\s+/).filter(Boolean).length;

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || showResult) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft, showResult]);

  // Writing assistant (debounced)
  useEffect(() => {
    if (currentEssay.length > 30) {
      const { lastSentence, prevSentence } = extractLastTwoSentences(currentEssay);
      analyze(lastSentence, prevSentence);
    }
  }, [currentEssay, analyze]);

  // Evaluation completed
  useEffect(() => {
    if (evaluation?.status === "COMPLETED" || evaluation?.status === "FAILED") {
      setIsSubmitting(false);
    }
  }, [evaluation?.status]);

  const handleEssayChange = (text: string) => {
    setEssays(prev => ({ ...prev, [activeTab]: text }));
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    const text = currentEssay.trim();
    if (text.length < 50) return;
    setIsSubmitting(true);

    try {
      const result = await submitWriting.mutateAsync({
        userId: getUserId(),
        essayText: text,
        questionId: activeSection?.questionId,
        taskType: activeSection?.taskType || 2,
        question: activeSection?.prompt,
        imageUrl: activeSection?.imageUrl,
      });
      setEvaluationId(result.data?.evaluationId || null);
      setShowResult(true);
    } catch (err) {
      console.error("Submit failed:", err);
      setIsSubmitting(false);
    }
  }, [currentEssay, isSubmitting, submitWriting, activeSection]);

  // ─── Result Screen ─────────────────────────────────────────────────────────
  if (showResult) {
    return (
      <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-900">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              <span className="material-symbols-outlined text-[20px]">edit_note</span>
            </div>
            <h1 className="font-bold text-slate-800">{t("practiceRunner.writing.resultHeader")}</h1>
          </div>
          <button onClick={() => navigate("/practice")} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            {t("practiceRunner.writing.backLink")}
          </button>
        </header>

        <div className="max-w-4xl mx-auto p-8">
          {(!evaluation || evaluation.status === "PENDING" || evaluation.status === "PROCESSING") && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-6" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">{t("practiceRunner.writing.aiGrading")}</h2>
              <p className="text-slate-500">{t("practiceRunner.writing.aiGradingHint")}</p>
            </div>
          )}

          {evaluation?.status === "FAILED" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
              <h2 className="text-xl font-bold text-red-800 mb-2">{t("practiceRunner.writing.gradingFailed")}</h2>
              <p className="text-red-600 mb-4">{t("practiceRunner.writing.errorOccurred")}</p>
              <button onClick={() => { setShowResult(false); setEvaluationId(null); setIsSubmitting(false); }}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700">
                {t("practiceRunner.writing.retry")}
              </button>
            </div>
          )}

          {evaluation?.status === "COMPLETED" && evaluation.criteria && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                <p className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-2">{t("practiceRunner.writing.overallBand")}</p>
                <div className="text-7xl font-black text-emerald-600 mb-2">{evaluation.overallBand}</div>
                <p className="text-slate-600 text-sm max-w-xl mx-auto">{evaluation.overallFeedback}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "task_achievement", labelKey: "taskAchievement", icon: "task_alt" },
                  { key: "coherence", labelKey: "coherence", icon: "link" },
                  { key: "lexical", labelKey: "lexical", icon: "dictionary" },
                  { key: "grammar", labelKey: "grammar", icon: "spellcheck" },
                ].map(({ key, labelKey, icon }) => {
                  const c = evaluation.criteria?.[key as keyof typeof evaluation.criteria];
                  if (!c) return null;
                  return (
                    <div key={key} className="bg-white rounded-xl border border-slate-200 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-emerald-500 text-xl">{icon}</span>
                          <span className="font-semibold text-slate-800 text-sm">{t(`practiceRunner.writing.criteria.${labelKey}`)}</span>
                        </div>
                        <span className="text-2xl font-black text-emerald-600">{c.score}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{c.feedback}</p>
                    </div>
                  );
                })}
              </div>

              {evaluation.highlightedErrors && evaluation.highlightedErrors.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500">warning</span>
                    {t("practiceRunner.writing.errorsDetected", { count: evaluation.highlightedErrors.length })}
                  </h3>
                  <div className="space-y-3">
                    {evaluation.highlightedErrors.map((err: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          err.type === "grammar" ? "bg-red-100 text-red-700" :
                          err.type === "vocab" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                        }`}>{err.type}</span>
                        <div className="flex-1 text-sm">
                          <p className="text-red-600 line-through">{err.original}</p>
                          <p className="text-green-700 font-medium">→ {err.suggestion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center pt-4">
                <button onClick={() => navigate("/practice")} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors">
                  {t("practiceRunner.writing.backToPractice")}
                </button>
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
      <header className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-5 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/practice")} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[18px]">edit_note</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm leading-tight">{test.title}</h1>
            <span className="text-[11px] text-slate-500">{t("practiceRunner.writing.brand")}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {assistantLoading && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 animate-pulse">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              {t("practiceRunner.writing.aiChecking")}
            </div>
          )}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm ${timeLeft < 300 ? "bg-red-100 text-red-700" : "bg-slate-100"}`}>
            <span className="material-symbols-outlined text-[18px]">timer</span>
            <span className={`font-mono font-bold ${timeLeft < 300 ? "text-red-700" : "text-slate-700"}`}>{formatTime(timeLeft)}</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || wordCount < 20}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
          >
            {isSubmitting ? t("practiceRunner.writing.submitting") : t("practiceRunner.writing.submit")}
          </button>
        </div>
      </header>

      {/* Section Tabs (if multiple) */}
      {writingSections.length > 1 && (
        <div className="bg-white border-b border-slate-200 px-5 flex gap-1 py-1.5 shrink-0">
          {writingSections.map((sec, idx) => (
            <button
              key={sec.id}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === idx
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "text-slate-500 hover:bg-slate-50 border border-transparent"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{sec.taskType === 1 ? "bar_chart" : "edit_note"}</span>
              {sec.title}
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel — Question + Chart */}
        <div className="w-[38%] bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-[18px] ${activeSection.taskType === 1 ? "text-blue-600" : "text-orange-500"}`}>
                {activeSection.taskType === 1 ? "bar_chart" : "edit_note"}
              </span>
              <h2 className="font-bold text-slate-700 text-sm">{activeSection.title}</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-auto">
                {t("practiceRunner.writing.wordsMin", { count: activeSection.wordCountMin })}
              </span>
            </div>
          </div>

          <div className="flex-1 p-5 space-y-5">
            {/* Chart/Image for Task 1 */}
            {activeSection.imageUrl && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 overflow-hidden">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t("practiceRunner.writing.chartLabel")}</p>
                <img
                  src={activeSection.imageUrl}
                  alt="Task 1 Visual"
                  className="w-full rounded-lg border border-slate-200 bg-white"
                />
              </div>
            )}

            {/* Prompt */}
            <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2">{t("practiceRunner.writing.promptLabel")}</p>
              <p className="text-sm text-slate-800 leading-relaxed italic">{activeSection.prompt}</p>
              {activeSection.taskType === 1 && (
                <p className="text-xs text-slate-600 mt-3">
                  {t("practiceRunner.writing.task1Instruction", { count: activeSection.wordCountMin })}
                </p>
              )}
              {activeSection.taskType === 2 && (
                <p className="text-xs text-slate-600 mt-3">
                  {t("practiceRunner.writing.task2Instruction", { count: activeSection.wordCountMin })}
                </p>
              )}
            </div>

            {/* AI Assistant */}
            {assistantResult && (assistantResult.errors.length > 0 || assistantResult.suggestions.length > 0) && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
                  {t("practiceRunner.writing.assistantTitle")}
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
                    <Lightbulb size={14} className="inline text-blue-600 mr-1" /> {sug.improvement}
                  </div>
                ))}
              </div>
            )}

            {/* Tips */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t("practiceRunner.writing.tipsTitle")}</h4>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                {activeSection.taskType === 1 ? (
                  <>
                    <li>{t("practiceRunner.writing.task1Tips.paraphrase")}</li>
                    <li>{t("practiceRunner.writing.task1Tips.overview")}</li>
                    <li>{t("practiceRunner.writing.task1Tips.compare")}</li>
                    <li>{t("practiceRunner.writing.task1Tips.vocabulary")}</li>
                  </>
                ) : (
                  <>
                    <li>{t("practiceRunner.writing.task2Tips.plan")}</li>
                    <li>{t("practiceRunner.writing.task2Tips.views")}</li>
                    <li>{t("practiceRunner.writing.task2Tips.linking")}</li>
                    <li>{t("practiceRunner.writing.task2Tips.proofread")}</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Panel — Essay Editor */}
        <div className="w-[62%] bg-white flex flex-col h-full">
          {/* Toolbar */}
          <div className="px-5 py-2 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
            <span className="text-xs text-slate-500 font-medium">{t("practiceRunner.writing.yourEssay")}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-400">
                {t("practiceRunner.writing.wordCountLabel")}{" "}
                <span className={`font-bold ${
                  wordCount >= activeSection.wordCountMin ? "text-emerald-600" :
                  wordCount >= activeSection.wordCountMin * 0.8 ? "text-amber-600" : "text-slate-700"
                }`}>{wordCount}</span>
                <span className="text-slate-300 ml-1">/ {activeSection.wordCountMin} {t("practiceRunner.writing.wordCountMinSuffix")}</span>
              </span>
              {wordCount >= activeSection.wordCountMin && (
                <span className="text-[10px] flex items-center gap-0.5 text-emerald-600 font-bold">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span> {t("practiceRunner.writing.wordsEnough")}
                </span>
              )}
            </div>
          </div>

          {/* Textarea */}
          <textarea
            className="flex-1 p-6 text-base leading-[1.8] text-slate-800 outline-none resize-none font-serif placeholder:text-slate-300"
            placeholder={activeSection.taskType === 1
              ? t("practiceRunner.writing.placeholderTask1")
              : t("practiceRunner.writing.placeholderTask2")
            }
            value={currentEssay}
            onChange={(e) => handleEssayChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}


// =============================================================================
// PRACTICE RUNNER (Original — for Reading / Listening / Speaking)
// =============================================================================

export default function PracticeRunner() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation("exam");

  const { data: test, isLoading, isError } = usePracticeTestDetail(testId);
  const submitMutation = useSubmitPracticeTest();

  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});

  const groups = useMemo(() => {
    if (!test) return [] as PracticeQuestionGroup[];
    return test.sections.flatMap((s) => s.parts.flatMap((p) => p.questionGroups));
  }, [test]);

  const questions = useMemo(() => {
    const all = groups.flatMap((g) => g.questions);
    return all as PracticeQuestion[];
  }, [groups]);

  const activeGroup = useMemo(() => {
    if (!groups.length) return null;
    const preferred = activeGroupId ? groups.find((g) => g.id === activeGroupId) : undefined;
    return preferred ?? groups[0];
  }, [groups, activeGroupId]);

  const activeQuestions = activeGroup?.questions ?? [];

  const handleSelect = (questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!testId) return;
    const res = await submitMutation.mutateAsync({ testId, submissions: answers });
    navigate(`/practice/${testId}/result`, { state: { result: res.data } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-600">
        {t("practiceRunner.shell.loading")}
      </div>
    );
  }

  if (isError || !test) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="bg-white border border-red-200 rounded-xl p-6 text-red-700">
          {t("practiceRunner.shell.loadError")}
        </div>
      </div>
    );
  }

  // Infer mode from test type/sections
  const rawType = `${test.type ?? ""} ${test.sections.map((s) => s.type).join(" ")}`.toLowerCase();
  const inferredMode: Mode = rawType.includes("listen")
    ? "listening"
    : rawType.includes("speak")
    ? "speaking"
    : rawType.includes("writ")
    ? "writing"
    : "reading";

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITING MODE → Dedicated UI
  // ═══════════════════════════════════════════════════════════════════════════
  if (inferredMode === "writing") {
    return <WritingPracticeUI test={test} />;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // READING / LISTENING / SPEAKING → Original Shell Layout
  // ═══════════════════════════════════════════════════════════════════════════
  const ShellComponent =
    inferredMode === "listening"
      ? ListeningShell
      : inferredMode === "speaking"
      ? SpeakingShell
      : ReadingShell;

  const leftContent = (
    <>
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h2 className="font-bold text-slate-700 flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-[20px] text-indigo-500">article</span>
          <span className="truncate">{t("practiceRunner.shell.context")}</span>
        </h2>
        <div className="flex gap-2">
          <select
            className="bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 px-3 py-1.5"
            value={activeGroup?.id ?? ""}
            onChange={(e) => setActiveGroupId(e.target.value)}
          >
            {groups.map((g, idx) => (
              <option key={g.id} value={g.id}>
                {t("practiceRunner.shell.groupOption", { n: idx + 1 })}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {activeGroup?.audioUrl ? (
          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t("practiceRunner.shell.audio")}</p>
            <audio controls className="w-full">
              <source src={activeGroup.audioUrl} />
            </audio>
          </div>
        ) : null}

        {activeGroup?.imageUrl ? (
          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t("practiceRunner.shell.image")}</p>
            <img src={activeGroup.imageUrl} alt="" className="w-full rounded-lg border border-slate-200" />
          </div>
        ) : null}

        {activeGroup?.passage ? (
          <div className="prose prose-slate max-w-none">
            <p className="whitespace-pre-wrap">{activeGroup.passage}</p>
          </div>
        ) : (
          <div className="text-sm text-slate-500">{t("practiceRunner.shell.noPassage")}</div>
        )}
      </div>
    </>
  );

  const rightContent = (
    <>
      <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
        <h2 className="font-bold text-slate-700">{t("practiceRunner.shell.questions")}</h2>
        <div className="text-xs font-medium text-slate-500">{t("practiceRunner.shell.itemsCount", { count: activeQuestions.length })}</div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="space-y-6">
          {activeQuestions.map((q, index) => {
            const chosen = answers[q.id];
            const num = questions.findIndex((x) => x.id === q.id) + 1;
            return (
              <div key={q.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex gap-4 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm">
                    {num || index + 1}
                  </span>
                  <p className="font-medium text-slate-800 pt-1">{q.questionText}</p>
                </div>

                {q.options?.length ? (
                  <div className="space-y-3 pl-12">
                    {q.options.map((opt) => (
                      <label
                        key={opt}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          chosen === opt
                            ? "border-indigo-200 bg-indigo-50"
                            : "border-slate-200 hover:bg-indigo-50 hover:border-indigo-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                          checked={chosen === opt}
                          onChange={() => handleSelect(q.id, opt)}
                        />
                        <span
                          className={`text-sm ${
                            chosen === opt ? "text-slate-900 font-medium" : "text-slate-600"
                          }`}
                        >
                          {opt}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="pl-12">
                    <textarea
                      className="w-full min-h-[120px] rounded-lg border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                      placeholder={t("practiceRunner.shell.answerPlaceholder")}
                      value={typeof chosen === "string" ? chosen : ""}
                      onChange={(e) => handleSelect(q.id, e.target.value)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  const navigator = (
    <div className="flex flex-wrap gap-2">
      {questions.map((q, idx) => {
        const isAnswered = answers[q.id] !== undefined && answers[q.id] !== "";
        return (
          <button
            key={q.id}
            type="button"
            onClick={() => {
              const owning = groups.find((g) => g.questions.some((qq) => qq.id === q.id));
              if (owning) setActiveGroupId(owning.id);
            }}
            className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-colors border ${
              isAnswered
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
            title={q.questionText}
          >
            {idx + 1}
          </button>
        );
      })}
    </div>
  );

  return (
    <ShellComponent
      title={test.title}
      subtitle={test.type}
      durationSeconds={test.duration}
      totalQuestions={questions.length}
      answeredCount={Object.keys(answers).length}
      onSubmit={handleSubmit}
      isSubmitting={submitMutation.isPending}
      onBackClick={() => navigate("/dashboard")}
      backConfirm={{
        title: t("practiceRunner.shell.exitConfirm.title"),
        description: t("practiceRunner.shell.exitConfirm.description"),
        confirmText: t("practiceRunner.shell.exitConfirm.confirm"),
        cancelText: t("practiceRunner.shell.exitConfirm.cancel"),
      }}
      leftContent={leftContent}
      rightContent={rightContent}
      navigator={navigator}
    />
  );
}
