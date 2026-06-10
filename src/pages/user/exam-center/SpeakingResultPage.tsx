import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import {
  useUserSpeakingSessions,
} from "@/hooks/api/use-ai-evaluation";
import { aiEvaluationService } from "@/lib/api/services/user/ai-evaluation/ai-evaluation.service";
import {
  getBandColor,
  getBandBg,
  highlightErrors,
  getUserId,
  type ErrorHighlight,
  type VocabSuggestion,
  type ConversationTurn,
} from "./speaking-utils";

interface ModelAnswerData {
  modelAnswer: string;
  keyVocab: VocabSuggestion[];
  improvement: string;
}

// Unified result shape — normalized from either Session or Evaluation entity
interface NormalizedResult {
  kind: "session" | "evaluation";
  id: string;
  topic: string;
  overallBand: number | null;
  scores: {
    fluency: number | null;
    lexical: number | null;
    grammar: number | null;
    pronunciation: number | null;
  };
  feedback: string | null;
  // For session: per-turn transcripts/audio
  turns: ConversationTurn[];
  // For evaluation: single transcript + single audio
  singleTranscript: string | null;
  singleAudioUrl: string | null;
  completedAt: string | null;
  isProcessing: boolean;
}

function extractFeedback(detailed: any): string | null {
  if (!detailed) return null;
  if (typeof detailed === "string") return detailed;
  if (detailed.overall_feedback) return detailed.overall_feedback;
  const parts: string[] = [];
  if (detailed.strengths?.length)
    parts.push(i18n.t("speakingResultPage.feedbackParts.strengths", { ns: "exam" }) + detailed.strengths.join("\n- "));
  if (detailed.areas_to_improve?.length)
    parts.push(i18n.t("speakingResultPage.feedbackParts.areasToImprove", { ns: "exam" }) + detailed.areas_to_improve.join("\n- "));
  if (detailed.estimated_preparation_tips?.length)
    parts.push(i18n.t("speakingResultPage.feedbackParts.tips", { ns: "exam" }) + detailed.estimated_preparation_tips.join("\n- "));
  return parts.length > 0 ? parts.join("\n") : null;
}

function normalizeSession(s: any): NormalizedResult {
  return {
    kind: "session",
    id: s.sessionId || s.id,
    topic: s.topic || "",
    overallBand: s.overallBand ?? null,
    scores: {
      fluency: s.scores?.fluency ?? null,
      lexical: s.scores?.lexical ?? null,
      grammar: s.scores?.grammar ?? null,
      pronunciation: s.scores?.pronunciation ?? null,
    },
    feedback: extractFeedback(s.detailedFeedback),
    turns: (s.turns as ConversationTurn[]) || [],
    singleTranscript: null,
    singleAudioUrl: null,
    completedAt: s.completedAt ?? null,
    isProcessing: s.status === "GRADING" || s.status === "IN_PROGRESS",
  };
}

function normalizeEvaluation(e: any): NormalizedResult {
  return {
    kind: "evaluation",
    id: e.id,
    topic: i18n.t("speakingResultPage.evaluationTopic", { ns: "exam" }),
    overallBand: e.overallBand ?? null,
    scores: {
      fluency: e.fluencyScore ?? null,
      lexical: e.vocabScore ?? null,
      grammar: e.grammarScore ?? null,
      pronunciation: e.pronunciationScore ?? null,
    },
    feedback: e.feedback ?? null,
    turns: [],
    singleTranscript: e.transcript ?? null,
    singleAudioUrl: e.audioUrl ?? null,
    completedAt: e.completedAt ?? null,
    isProcessing: e.status === "PENDING" || e.status === "PROCESSING",
  };
}

// Stop auto-polling after this many attempts (~3 min at 3s) so a grading job
// that never finishes can't poll the API forever. The user keeps a manual
// "reload" button to check again. Bumped from 40 because grading now uses
// Whisper STT + Gemini Pro (slower than the old Flash-only path).
const MAX_GRADING_POLLS = 60;

// Try to load either entity. Prefer session (History route uses session IDs).
function useNormalizedResult(id: string | null) {
  return useQuery<NormalizedResult | null>({
    queryKey: ["speaking-normalized-result", id],
    enabled: Boolean(id),
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d?.isProcessing) return false;
      if (q.state.dataUpdateCount >= MAX_GRADING_POLLS) return false; // give up auto-poll
      return 3000;
    },
    queryFn: async () => {
      if (!id) return null;
      try {
        const r = await aiEvaluationService.getSpeakingSessionResult(id);
        const data: any = r.data;
        if (data && (data.sessionId || data.status === "GRADING" || data.status === "IN_PROGRESS")) {
          return normalizeSession(data);
        }
      } catch {
        // Session not found — try evaluation
      }
      try {
        const r = await aiEvaluationService.getSpeakingEvaluation(id);
        if (r.data) return normalizeEvaluation(r.data);
      } catch {
        // both failed
      }
      return null;
    },
  });
}

export default function SpeakingResultPage() {
  const { t } = useTranslation("exam");
  const { evaluationId } = useParams();
  const { data: result, isLoading, refetch, isFetching } = useNormalizedResult(evaluationId || null);

  const userId = getUserId();
  const { data: allSessions } = useUserSpeakingSessions(userId);

  const [errorAnalysis, setErrorAnalysis] = useState<ErrorHighlight[]>([]);
  const [loadingErrors, setLoadingErrors] = useState(false);
  const [modelAnswer, setModelAnswer] = useState<ModelAnswerData | null>(null);
  const [loadingModel, setLoadingModel] = useState(false);
  const [expandedTurnIdx, setExpandedTurnIdx] = useState<number | null>(null);

  const delta = useMemo<{ value: number; vs: string } | null>(() => {
    if (!result?.overallBand || !allSessions) return null;
    const completed = (allSessions as any[]).filter(
      (s) => s.overallBand !== null && s.id !== result.id
    );
    if (completed.length === 0) return null;
    const last = completed[0];
    return {
      value: result.overallBand - last.overallBand,
      vs: last.topic || t("speakingResultPage.delta.previous"),
    };
  }, [result, allSessions, t]);

  // Combined transcript text — for error analysis & model answer.
  // For session: concatenated candidate turns. For evaluation: single transcript.
  const fullCandidateText = useMemo(() => {
    if (!result) return "";
    if (result.kind === "session") {
      return result.turns
        .filter((t) => t.role === "candidate")
        .map((t) => t.content)
        .join(" ");
    }
    return result.singleTranscript || "";
  }, [result]);

  const handleAnalyzeErrors = async () => {
    if (!fullCandidateText) return;
    setLoadingErrors(true);
    try {
      const r = await aiEvaluationService.highlightSpeakingErrors(fullCandidateText);
      setErrorAnalysis((r.data as any)?.errors || []);
    } catch (e) {
      console.error("highlight errors failed", e);
    } finally {
      setLoadingErrors(false);
    }
  };

  const handleGenerateModelAnswer = async () => {
    if (!result) return;
    setLoadingModel(true);
    try {
      // For sessions, use the last examiner question; for evaluations, use a generic prompt.
      let question = "Discuss the topic you spoke about.";
      if (result.kind === "session") {
        const lastExaminer = [...result.turns]
          .reverse()
          .find((t) => t.role === "examiner");
        if (lastExaminer) question = lastExaminer.content;
      }
      const r = await aiEvaluationService.getSpeakingModelAnswer({
        question,
        transcript: fullCandidateText,
        part: 2,
      });
      setModelAnswer(r.data as ModelAnswerData);
    } catch (e) {
      console.error("model answer failed", e);
    } finally {
      setLoadingModel(false);
    }
  };

  if (isLoading || result?.isProcessing) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-amber-500/20 animate-pulse">
            <span className="material-symbols-outlined text-[28px]">grading</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">{t("speakingResultPage.grading.title")}</h2>
          <p className="text-sm text-slate-500">{t("speakingResultPage.grading.subtitle")}</p>
          <p className="text-xs text-slate-400 mt-1">{t("speakingResultPage.grading.hint")}</p>
          {/* Escape hatch: if grading drags on (or auto-poll has stopped), let
              the user re-check or leave instead of staring at the spinner. */}
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              {isFetching
                ? t("speakingResultPage.grading.checking", "Đang kiểm tra…")
                : t("speakingResultPage.grading.reload", "Tải lại")}
            </button>
            <Link
              to="/exam/speaking-history"
              className="px-4 py-2 text-sm font-semibold text-slate-500 rounded-lg hover:bg-slate-100 transition"
            >
              {t("speakingResultPage.grading.backLater", "Quay lại sau")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center font-sans">
        <div className="text-center p-8 bg-white rounded-2xl border border-slate-200">
          <span className="material-symbols-outlined text-red-500 text-5xl mb-4 block">error</span>
          <h2 className="text-lg font-bold text-slate-800 mb-2">{t("speakingResultPage.error.title")}</h2>
          <p className="text-sm text-slate-500 mb-6">{t("speakingResultPage.error.body")}</p>
          <Link to="/exam" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">
            {t("speakingResultPage.error.backToExamCenter")}
          </Link>
        </div>
      </div>
    );
  }

  // Build segments for inline error highlighting (single transcript view only)
  const singleTranscriptSegments = result.singleTranscript
    ? highlightErrors(result.singleTranscript, errorAnalysis)
    : [];

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900">
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined text-[18px]">mic</span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm sm:text-base truncate">{t("speakingResultPage.header.title")}</p>
            {result.topic && (
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">{result.topic}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/exam/speaking-history" className="text-xs font-bold text-slate-500 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition">
            {t("speakingResultPage.header.history")}
          </Link>
          <Link to="/exam" className="text-xs font-bold text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition">
            {t("speakingResultPage.header.back")}
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className={`rounded-2xl border p-6 text-center mb-6 shadow-sm ${getBandBg(result.overallBand)}`}>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t("speakingResultPage.overallBandScore")}</p>
          <p className={`text-6xl font-black ${getBandColor(result.overallBand)}`}>
            {result.overallBand !== null ? result.overallBand.toFixed(1) : "N/A"}
          </p>
          {delta && (
            <div className="mt-3 inline-flex flex-wrap items-center gap-1.5 text-sm font-bold bg-white/70 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200">
              {delta.value > 0 && (
                <>
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">trending_up</span>
                  <span className="text-emerald-700">+{delta.value.toFixed(1)} {t("speakingResultPage.delta.bandSuffix")}</span>
                </>
              )}
              {delta.value < 0 && (
                <>
                  <span className="material-symbols-outlined text-red-500 text-[18px]">trending_down</span>
                  <span className="text-red-600">{delta.value.toFixed(1)} {t("speakingResultPage.delta.bandSuffix")}</span>
                </>
              )}
              {delta.value === 0 && (
                <>
                  <span className="material-symbols-outlined text-slate-500 text-[18px]">trending_flat</span>
                  <span className="text-slate-600">{t("speakingResultPage.delta.same")}</span>
                </>
              )}
              <span className="text-slate-500 text-xs font-medium">{t("speakingResultPage.delta.vs", { topic: delta.vs })}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { key: "fluency", label: t("speakingResultPage.criteria.fluency"), icon: "waves" },
            { key: "lexical", label: t("speakingResultPage.criteria.lexical"), icon: "dictionary" },
            { key: "grammar", label: t("speakingResultPage.criteria.grammar"), icon: "spellcheck" },
            { key: "pronunciation", label: t("speakingResultPage.criteria.pronunciation"), icon: "record_voice_over" },
          ].map(({ key, label, icon }) => {
            const score = (result.scores as any)[key];
            return (
              <div key={key} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <span className="material-symbols-outlined text-slate-400 text-[20px] mb-1 block">{icon}</span>
                <p className={`text-2xl font-black ${getBandColor(score)}`}>
                  {score !== null && score !== undefined ? score.toFixed(1) : "—"}
                </p>
                <p className="text-[10px] font-bold text-slate-500 mt-1">{label}</p>
              </div>
            );
          })}
        </div>

        {result.feedback && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
            <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-[18px]">lightbulb</span>
              {t("speakingResultPage.feedbackTitle")}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{result.feedback}</p>
          </div>
        )}

        {/* Conversation view (session) */}
        {result.kind === "session" && result.turns.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-[18px]">history</span>
                {t("speakingResultPage.conversation.title")}
              </h3>
              <button
                onClick={handleAnalyzeErrors}
                disabled={loadingErrors || errorAnalysis.length > 0 || !fullCandidateText}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition disabled:opacity-60 cursor-pointer inline-flex items-center gap-1.5"
              >
                {loadingErrors ? (
                  <>
                    <div className="w-3 h-3 border border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                    {t("speakingResultPage.analyze.analyzing")}
                  </>
                ) : errorAnalysis.length > 0 ? (
                  <>
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    {t("speakingResultPage.analyze.analyzed", { count: errorAnalysis.length })}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px]">highlight</span>
                    {t("speakingResultPage.analyze.find")}
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3">
              {result.turns.map((turn, idx) => {
                const isExaminer = turn.role === "examiner";
                const segs = !isExaminer && errorAnalysis.length > 0
                  ? highlightErrors(turn.content, errorAnalysis)
                  : null;
                return (
                  <div
                    key={idx}
                    className={`p-3 sm:p-4 rounded-xl border ${
                      isExaminer ? "bg-slate-50 border-slate-100" : "bg-indigo-50/60 border-indigo-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${
                        isExaminer ? "text-slate-500" : "text-indigo-600"
                      }`}>
                        {isExaminer ? t("speakingResultPage.roles.examiner") : t("speakingResultPage.roles.you")}
                      </span>
                      {!isExaminer && turn.audioUrl && (
                        <button
                          onClick={() => setExpandedTurnIdx(expandedTurnIdx === idx ? null : idx)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {expandedTurnIdx === idx ? "expand_less" : "play_circle"}
                          </span>
                          {expandedTurnIdx === idx ? t("speakingResultPage.hideAudio") : t("speakingResultPage.replay")}
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {segs
                        ? segs.map((seg, i) =>
                            seg.error ? (
                              <span
                                key={i}
                                className={`relative inline-block px-1 rounded cursor-help group ${
                                  seg.error.type === "grammar"
                                    ? "bg-red-100 text-red-800 border-b-2 border-red-400"
                                    : seg.error.type === "vocab"
                                    ? "bg-amber-100 text-amber-800 border-b-2 border-amber-400"
                                    : "bg-blue-100 text-blue-800 border-b-2 border-blue-400"
                                }`}
                                title={`→ ${seg.error.suggestion}`}
                              >
                                {seg.text}
                                <span className="invisible group-hover:visible absolute left-0 bottom-full mb-1 z-20 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                                  {seg.error.suggestion}
                                </span>
                              </span>
                            ) : (
                              <span key={i}>{seg.text}</span>
                            )
                          )
                        : turn.content || <span className="italic text-slate-400">{t("speakingResultPage.noContent")}</span>}
                    </p>
                    {!isExaminer && turn.audioUrl && (expandedTurnIdx === idx || result.turns.length <= 4) && (
                      <audio
                        src={turn.audioUrl}
                        controls
                        preload="none"
                        className="mt-3 h-9 w-full opacity-90"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {errorAnalysis.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 mb-2">{t("speakingResultPage.errorDetails")}</p>
                <ul className="space-y-1.5">
                  {errorAnalysis.map((e, i) => (
                    <li key={i} className="text-xs flex items-start gap-2 flex-wrap">
                      <span className={`shrink-0 font-black text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        e.type === "grammar" ? "bg-red-100 text-red-700" :
                        e.type === "vocab" ? "bg-amber-100 text-amber-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>{e.type}</span>
                      <span className="line-through text-slate-500">{e.original}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-bold text-slate-700">{e.suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Single transcript view (evaluation) */}
        {result.kind === "evaluation" && result.singleTranscript && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-[18px]">history</span>
                {t("speakingResultPage.singleTranscript.title")}
              </h3>
              <button
                onClick={handleAnalyzeErrors}
                disabled={loadingErrors || errorAnalysis.length > 0}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition disabled:opacity-60 cursor-pointer inline-flex items-center gap-1.5"
              >
                {loadingErrors ? (
                  <>
                    <div className="w-3 h-3 border border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                    {t("speakingResultPage.analyze.analyzing")}
                  </>
                ) : errorAnalysis.length > 0 ? (
                  <>
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    {t("speakingResultPage.analyze.analyzed", { count: errorAnalysis.length })}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px]">highlight</span>
                    {t("speakingResultPage.analyze.find")}
                  </>
                )}
              </button>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {singleTranscriptSegments.length === 0 ? (
                result.singleTranscript
              ) : (
                singleTranscriptSegments.map((seg, i) =>
                  seg.error ? (
                    <span
                      key={i}
                      className={`relative inline-block px-1 rounded cursor-help group ${
                        seg.error.type === "grammar"
                          ? "bg-red-100 text-red-800 border-b-2 border-red-400"
                          : seg.error.type === "vocab"
                          ? "bg-amber-100 text-amber-800 border-b-2 border-amber-400"
                          : "bg-blue-100 text-blue-800 border-b-2 border-blue-400"
                      }`}
                      title={`→ ${seg.error.suggestion}`}
                    >
                      {seg.text}
                      <span className="invisible group-hover:visible absolute left-0 bottom-full mb-1 z-20 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                        {seg.error.suggestion}
                      </span>
                    </span>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  )
                )
              )}
            </p>

            {errorAnalysis.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 mb-2">{t("speakingResultPage.errorDetails")}</p>
                <ul className="space-y-1.5">
                  {errorAnalysis.map((e, i) => (
                    <li key={i} className="text-xs flex items-start gap-2 flex-wrap">
                      <span className={`shrink-0 font-black text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        e.type === "grammar" ? "bg-red-100 text-red-700" :
                        e.type === "vocab" ? "bg-amber-100 text-amber-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>{e.type}</span>
                      <span className="line-through text-slate-500">{e.original}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-bold text-slate-700">{e.suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.singleAudioUrl && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 mb-2">{t("speakingResultPage.fullRecording")}</p>
                <audio src={result.singleAudioUrl} controls className="h-10 w-full opacity-80" />
              </div>
            )}
          </div>
        )}

        {/* Model Answer */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500 text-[18px]">workspace_premium</span>
              {t("speakingResultPage.modelAnswer.title")}
            </h3>
            {!modelAnswer && (
              <button
                onClick={handleGenerateModelAnswer}
                disabled={loadingModel || !fullCandidateText}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-50 transition disabled:opacity-60 cursor-pointer inline-flex items-center gap-1.5"
              >
                {loadingModel ? (
                  <>
                    <div className="w-3 h-3 border border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                    {t("speakingResultPage.modelAnswer.generating")}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                    {t("speakingResultPage.modelAnswer.view")}
                  </>
                )}
              </button>
            )}
          </div>

          {!modelAnswer && !loadingModel && (
            <p className="text-sm text-slate-500 italic">{t("speakingResultPage.modelAnswer.placeholder")}</p>
          )}

          {modelAnswer && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-sm text-slate-800 leading-relaxed italic">"{modelAnswer.modelAnswer}"</p>
              </div>

              {modelAnswer.keyVocab && modelAnswer.keyVocab.length > 0 && (
                <div>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t("speakingResultPage.modelAnswer.keyVocab")}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {modelAnswer.keyVocab.map((v, i) => (
                      <div key={i} className="border border-amber-200 bg-amber-50/50 rounded-lg p-3">
                        <p className="font-black text-amber-700 text-xs mb-1">{v.word}</p>
                        <p className="text-[10px] text-slate-600 mb-1">{v.meaning}</p>
                        <p className="text-[10px] italic text-slate-500">"{v.example}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {modelAnswer.improvement && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <p className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-1">{t("speakingResultPage.modelAnswer.advice")}</p>
                  <p className="text-sm text-indigo-900">{modelAnswer.improvement}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <Link
            to="/exam/test/speaking"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">replay</span>
            {t("speakingResultPage.practiceMore")}
          </Link>
        </div>
      </div>
    </div>
  );
}
