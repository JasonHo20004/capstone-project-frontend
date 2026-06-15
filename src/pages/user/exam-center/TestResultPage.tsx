import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import apiClient from "@/lib/api/config";
import DiscussionSection from "@/components/DiscussionSection";
import AiTutorPanel from "@/components/AiTutorPanel";
import { Celebration } from "@/components/ui/celebration";
import { assessmentService } from "@/lib/api/services/user/assessment/assessment.service";

interface QuestionContent {
  text?: string;
  options?: string[];
  instruction?: string;
  summaryText?: string;
}

interface QuestionAnswer {
  correctIndex?: number;
  correctIndices?: number[];
  text?: string | string[];
  correctAnswer?: string;
}

/** Study4-style answer location — where the answer is justified in the passage/transcript. */
interface AnswerRef {
  snippet: string;
  start?: number;
  end?: number;
  audioStart?: number;
  audioEnd?: number;
  source?: "manual" | "ai";
}

interface RawQuestion {
  id: string;
  sectionId?: string | null;
  passageId?: string | null;
  questionOrder?: number;
  questionType: string;
  questionText?: string;
  imageUrl?: string | null;
  content?: QuestionContent | null;
  answer?: QuestionAnswer | null;
  answerReference?: AnswerRef | null;
  explanation?: string | null;
}

interface RawPassage {
  id: string;
  content: string;
  passageOrder?: number | null;
}

interface RawSection {
  id: string;
  title: string;
  skill?: string;
  orderIndex?: number | null;
  audioTranscript?: string | null;
  mediaUrl?: string | null;
  imageUrl?: string | null;
  passages?: RawPassage[];
  questions?: RawQuestion[];
}

interface RawTest {
  id: string;
  title: string;
  sections?: RawSection[];
  testSkills?: { skill: string }[];
}

interface UserAnswer {
  questionId: string;
  answerText?: string;
  isCorrect: boolean;
  question?: RawQuestion;
}

interface CorrectAnswerRaw {
  index?: number;
  indices?: number[];
  text?: string;
  texts?: string[];
}

interface ReviewQuestion {
  questionId: string;
  questionOrder: number;
  questionType: string;
  questionText: string;
  options: string[];
  userAnswer: string;
  correctAnswer: string;
  correctAnswerRaw: CorrectAnswerRaw;
  isCorrect: boolean;
  explanation: string | null;
  imageUrl?: string | null;
  content?: QuestionContent | null;
  answerReference?: AnswerRef | null;
}

interface ReviewSection {
  id: string;
  title: string;
  skill?: string;
  orderIndex: number;
  passage: string;
  audioTranscript?: string | null;
  mediaUrl?: string | null;
  imageUrl?: string | null;
  questions: ReviewQuestion[];
}

const QUESTION_TYPE_BADGE: Record<string, string> = {
  MULTIPLE_CHOICE: "bg-blue-100 text-blue-700",
  MULTIPLE_CHOICE_MULTI_ANSWER: "bg-blue-100 text-blue-700",
  TRUE_FALSE_NOT_GIVEN: "bg-teal-100 text-teal-700",
  YES_NO_NOT_GIVEN: "bg-teal-100 text-teal-700",
  GAP_FILL: "bg-orange-100 text-orange-700",
  SHORT_ANSWER: "bg-orange-100 text-orange-700",
  MATCHING: "bg-purple-100 text-purple-700",
};

function buildCorrectAnswer(q: RawQuestion): { display: string; raw: CorrectAnswerRaw } {
  const answerData: QuestionAnswer = q.answer || {};
  const contentData: QuestionContent = q.content || {};
  const options: string[] = contentData?.options || [];

  if (q.questionType === "MULTIPLE_CHOICE") {
    const idx = answerData?.correctIndex;
    const letter = typeof idx === "number" ? String.fromCharCode(65 + idx) : "";
    const text = typeof idx === "number" ? options[idx] || "" : "";
    return { display: letter && text ? `${letter}. ${text}` : letter || text, raw: { index: idx, text } };
  }
  if (q.questionType === "MULTIPLE_CHOICE_MULTI_ANSWER") {
    const indices: number[] = answerData?.correctIndices || [];
    const parts = indices.map(i => `${String.fromCharCode(65 + i)}. ${options[i] || ""}`);
    return { display: parts.join(", "), raw: { indices, texts: indices.map(i => options[i] || "") } };
  }
  if (q.questionType === "GAP_FILL" || q.questionType === "SHORT_ANSWER") {
    // Multi-gap Summary Completion stores answers as { gaps: { "1": ["word"] } }.
    const gaps = (answerData as { gaps?: Record<string, unknown> })?.gaps;
    if (gaps && typeof gaps === "object" && Object.keys(gaps).length > 0) {
      const texts = Object.keys(gaps).map(k => {
        const v = (gaps as Record<string, unknown>)[k];
        return Array.isArray(v) ? v.join(" / ") : String(v ?? "");
      });
      return { display: texts.join("  •  "), raw: { text: texts.join("  •  "), texts } };
    }
    const text: string = Array.isArray(answerData?.text)
      ? answerData.text.join(" / ")
      : (answerData?.text as string) || answerData?.correctAnswer || "";
    return { display: text, raw: { text } };
  }
  if (q.questionType === "MATCHING") {
    const text: string = Array.isArray(answerData?.text)
      ? answerData.text[0]
      : (answerData?.text as string) || answerData?.correctAnswer || "";
    return { display: text, raw: { text } };
  }
  if (q.questionType === "TRUE_FALSE_NOT_GIVEN" || q.questionType === "YES_NO_NOT_GIVEN") {
    const text: string = answerData?.correctAnswer || "";
    return { display: text, raw: { text } };
  }
  return { display: answerData?.correctAnswer || "", raw: { text: answerData?.correctAnswer || "" } };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collectEvidenceTerms(q: ReviewQuestion | undefined): string[] {
  if (!q) return [];
  const terms: string[] = [];
  const push = (s: string | undefined | null) => {
    if (!s) return;
    const cleaned = s.trim().replace(/^[A-Z]\.\s*/, "");
    if (cleaned.length >= 2 && cleaned.length <= 200) terms.push(cleaned);
  };

  if (q.questionType === "GAP_FILL" || q.questionType === "SHORT_ANSWER") {
    // Prefer per-gap values; fall back to the slash-joined display string.
    if (q.correctAnswerRaw?.texts?.length) {
      q.correctAnswerRaw.texts.forEach(v => v.split(/\s*\/\s*/).forEach(push));
    } else {
      const raw = q.correctAnswerRaw?.text;
      if (typeof raw === "string") raw.split(/\s*[/•]\s*/).forEach(push);
    }
  } else if (q.questionType === "MULTIPLE_CHOICE") {
    push(q.correctAnswerRaw?.text);
  } else if (q.questionType === "MULTIPLE_CHOICE_MULTI_ANSWER") {
    (q.correctAnswerRaw?.texts || []).forEach(push);
  } else if (q.questionType === "MATCHING") {
    push(q.correctAnswerRaw?.text);
  }
  return Array.from(new Set(terms));
}

/**
 * Fallback answer location for tests without an authored answerReference
 * (imported tests, or AI tests generated before the evidence feature): pull the
 * quoted passage phrase out of the explanation, e.g.
 *   "Gap 1: The passage states ... cut into 'the earth of English hillsides'."
 * → "the earth of English hillsides". HighlightedPassage then fuzzy-matches it.
 */
function evidenceFromExplanation(explanation?: string | null): string {
  if (!explanation) return "";
  const quotes = Array.from(
    explanation.matchAll(/['"“”‘’]([^'"“”‘’]{6,200}?)['"“”‘’]/g)
  ).map(m => m[1].trim()).filter(Boolean);
  if (!quotes.length) return "";
  return quotes.sort((a, b) => b.length - a.length)[0];
}

function HighlightedPassage({
  passage,
  activeTerms,
  referenceSnippet,
}: {
  passage: string;
  activeTerms: string[];
  /** Exact answer-location snippet (Study4-style). Takes priority over keyword terms. */
  referenceSnippet?: string | null;
}) {
  const { t } = useTranslation("exam");
  const paragraphs = useMemo(() => {
    if (!passage) return [] as string[];
    return passage.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  }, [passage]);

  const ref = (referenceSnippet || "").trim();
  const isReference = ref.length > 0;
  // Reference mode: flexible-whitespace match of the exact authored snippet so the
  // precise answer location is highlighted (and gets the #answer-evidence scroll target).
  // Fallback mode: legacy keyword evidence terms.
  const pattern = isReference
    ? escapeRegExp(ref).replace(/\s+/g, "\\s+")
    : activeTerms.filter(Boolean).map(escapeRegExp).sort((a, b) => b.length - a.length).join("|");
  let evidenceAssigned = false;

  const renderText = (text: string) => {
    if (!pattern) return <>{text}</>;
    const regex = new RegExp(`(${pattern})`, "gi");
    const parts = text.split(regex);
    const matchRegex = new RegExp(`^(${pattern})$`, "i");
    return (
      <>
        {parts.map((part, i) => {
          if (!matchRegex.test(part)) return <Fragment key={i}>{part}</Fragment>;
          const assignId = isReference && !evidenceAssigned;
          if (assignId) evidenceAssigned = true;
          return (
            <mark
              key={i}
              id={assignId ? "answer-evidence" : undefined}
              className={
                isReference
                  ? "bg-amber-300 text-amber-950 rounded px-0.5 ring-1 ring-amber-400/70 shadow-sm"
                  : "bg-amber-200/80 text-amber-900 rounded px-0.5 underline decoration-amber-500/60 decoration-2 underline-offset-2"
              }
            >
              {part}
            </mark>
          );
        })}
      </>
    );
  };

  if (!passage) {
    return <p className="text-slate-400 italic text-sm">{t("testResultPage.noPassage")}</p>;
  }

  if (paragraphs.length < 2) {
    return <p className="text-slate-700 text-[15px] leading-[1.95] whitespace-pre-line">{renderText(passage)}</p>;
  }

  return (
    <div className="space-y-4">
      {paragraphs.map((para, i) => {
        const isHeading = para.length <= 90 && !para.endsWith(".") && i === 0;
        if (isHeading) {
          return (
            <h2 key={i} className="font-bold text-slate-900 text-base leading-snug">
              {para}
            </h2>
          );
        }
        return (
          <div key={i} className="flex gap-3">
            <span className="font-bold text-slate-400 text-sm w-5 shrink-0 pt-[3px] select-none">
              {String.fromCharCode(64 + i)}
            </span>
            <p className="text-slate-700 text-[15px] leading-[1.95] flex-1">{renderText(para)}</p>
          </div>
        );
      })}
    </div>
  );
}

function AnswerPill({ label, value, tone }: { label: string; value: string; tone: "user" | "correct" }) {
  const colors =
    tone === "correct"
      ? "border-green-300 bg-green-50 text-green-800"
      : "border-red-300 bg-red-50 text-red-800";
  return (
    <div className={`flex flex-col gap-0.5 rounded-lg border px-3 py-2 ${colors}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</span>
      <span className="text-sm font-semibold break-words">{value || "—"}</span>
    </div>
  );
}

interface ResultPayload {
  testId?: string;
  completedAt?: string;
  rawScoresBySkill?: {
    correct?: number;
    total?: number;
    percentage?: number;
    bandScore?: number;
  };
  overallScaledScore?: number;
  test?: {
    title?: string;
    testSkills?: { skill: string }[];
  };
  userAnswers?: UserAnswer[];
}

export default function TestResultPage() {
  const { t, i18n } = useTranslation("exam");
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-GB";
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  // A question to auto-highlight, passed in when arriving from the review table's
  // "View evidence" button (navigate(..., { state: { focusQuestionId } })).
  const pendingFocusId = (location.state as { focusQuestionId?: string } | null)?.focusQuestionId;
  const [appliedFocus, setAppliedFocus] = useState(false);
  const [result, setResult] = useState<ResultPayload | null>(null);
  const [test, setTest] = useState<RawTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [focusedQuestionId, setFocusedQuestionId] = useState<string | null>(null);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});
  const [showAudioReplay, setShowAudioReplay] = useState<Record<string, boolean>>({});
  const [tutorOpen, setTutorOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<{
    questionId: string;
    questionText: string;
    questionType: string;
    options: string[];
    correctAnswer: string;
    userAnswer: string;
    questionOrder: number;
  } | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    apiClient
      .get(`/tests/attempts/${sessionId}`)
      .then(r => setResult(r.data?.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    if (!result?.testId) return;
    apiClient
      .get(`/tests/${result.testId}`)
      .then(r => setTest(r.data?.data))
      .catch(console.error);
  }, [result?.testId]);

  const sections: ReviewSection[] = useMemo(() => {
    if (!test?.sections) return [];
    const userAnswers: UserAnswer[] = result?.userAnswers || [];
    const answerByQid = new Map(userAnswers.map(ua => [ua.questionId, ua]));

    return (test.sections || [])
      .slice()
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      .map((s, sectionIdx) => {
        const passage = (s.passages || [])
          .slice()
          .sort((a, b) => (a.passageOrder ?? 0) - (b.passageOrder ?? 0))
          .map(p => p.content)
          .filter(Boolean)
          .join("\n\n");

        const questions: ReviewQuestion[] = (s.questions || [])
          .slice()
          .sort((a, b) => (a.questionOrder ?? 0) - (b.questionOrder ?? 0))
          .map(q => {
            const ua = answerByQid.get(q.id);
            const { display: correctDisplay, raw: correctRaw } = buildCorrectAnswer(q);
            const contentData = q.content || {};
            return {
              questionId: q.id,
              questionOrder: q.questionOrder ?? 0,
              questionType: q.questionType,
              questionText: contentData?.text || q.questionText || "",
              options: contentData?.options || [],
              userAnswer: ua?.answerText || "",
              correctAnswer: correctDisplay,
              correctAnswerRaw: correctRaw,
              isCorrect: !!ua?.isCorrect,
              explanation: q.explanation || ua?.question?.explanation || null,
              imageUrl: q.imageUrl || null,
              content: contentData,
              // The attempt detail (/tests/attempts/:id) always returns the reference;
              // the /tests/:id fetch only includes it for owners/admins, so prefer the attempt.
              answerReference: q.answerReference || ua?.question?.answerReference || null,
            };
          });

        return {
          id: s.id,
          title: s.title,
          skill: s.skill,
          orderIndex: s.orderIndex ?? sectionIdx,
          passage,
          audioTranscript: s.audioTranscript,
          mediaUrl: s.mediaUrl,
          imageUrl: s.imageUrl,
          questions,
        };
      });
  }, [test, result]);

  useEffect(() => {
    if (sections.length && !activeSectionId) {
      setActiveSectionId(sections[0].id);
    }
  }, [sections, activeSectionId]);

  // Arriving with a focusQuestionId (from the review table): switch to that
  // question's section and highlight it. The effect below then scrolls to it.
  useEffect(() => {
    if (appliedFocus || !pendingFocusId || !sections.length) return;
    const sec = sections.find(s => s.questions.some(q => q.questionId === pendingFocusId));
    if (!sec) return;
    setActiveSectionId(sec.id);
    setFocusedQuestionId(pendingFocusId);
    setAppliedFocus(true);
  }, [pendingFocusId, sections, appliedFocus]);

  // When a question is focused, scroll the passage/transcript to the exact answer
  // location, and (for listening) seek the audio player to the answer moment.
  useEffect(() => {
    if (!focusedQuestionId) return;
    const section = sections.find(s => s.id === activeSectionId) || sections[0];
    const fq = section?.questions.find(q => q.questionId === focusedQuestionId);
    const ref = fq?.answerReference;
    // Scroll to the highlight whether it comes from the authored reference or
    // the explanation-quote fallback (both render the #answer-evidence anchor).
    const hasEvidence = !!ref?.snippet || !!evidenceFromExplanation(fq?.explanation);
    if (!hasEvidence) return;

    const raf = requestAnimationFrame(() => {
      const el = document.getElementById("answer-evidence");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (typeof ref?.audioStart === "number" && section?.mediaUrl) {
      setShowAudioReplay(prev => ({ ...prev, [section.id]: true }));
      const applySeek = () => {
        const audio = document.getElementById("result-audio") as HTMLAudioElement | null;
        if (!audio) return false;
        try {
          audio.currentTime = ref.audioStart as number;
          audio.play().catch(() => {});
        } catch {
          /* seeking before metadata is loaded — ignore */
        }
        return true;
      };
      // Audio element may need a tick to mount after opening the replay panel.
      if (!applySeek()) timer = setTimeout(applySeek, 250);
    }

    return () => {
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, [focusedQuestionId, activeSectionId, sections]);

  const activeSection = sections.find(s => s.id === activeSectionId) || sections[0];

  const fetchResultComments = useCallback(
    async (page: number, limit: number) => {
      if (!result?.testId) return { comments: [], total: 0 };
      const res = await assessmentService.getTestComments(result.testId, page, limit);
      return { comments: res.data?.comments ?? [], total: res.data?.total ?? 0 };
    },
    [result?.testId]
  );

  const postResultComment = useCallback(
    async (content: string, parentCommentId?: string) => {
      if (!result?.testId) return;
      return assessmentService.postTestComment(result.testId, content, parentCommentId);
    },
    [result?.testId]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="text-slate-500">{t("testResultPage.loading")}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-5xl text-slate-300">error_outline</span>
          <p className="text-slate-500 text-lg">{t("testResultPage.notFound")}</p>
          <Link
            to="/exam"
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            ← {t("testResultPage.examCenter")}
          </Link>
        </div>
      </div>
    );
  }

  const rawScore = result.rawScoresBySkill || {};
  const correctCount = rawScore.correct ?? 0;
  const total = rawScore.total ?? 0;
  const pct = rawScore.percentage ?? (total > 0 ? Math.round((correctCount / total) * 100) : 0);
  const bandScore = rawScore.bandScore ?? result.overallScaledScore ?? null;
  const band = bandScore != null ? bandScore.toFixed(1) : "—";
  const testTitle = result.test?.title || t("testResultPage.defaultTestTitle");
  const skills: string[] = result.test?.testSkills?.map(s => s.skill) || [];
  const isListeningTest = skills.includes("LISTENING");

  const bandNum = bandScore ?? 0;
  const scoreColor = bandNum >= 7 ? "text-green-600" : bandNum >= 5 ? "text-amber-600" : "text-red-600";
  const scoreBg =
    bandNum >= 7
      ? "from-green-50 to-emerald-50 border-green-200"
      : bandNum >= 5
      ? "from-amber-50 to-orange-50 border-amber-200"
      : "from-red-50 to-rose-50 border-red-200";
  const ringColor = bandNum >= 7 ? "#16a34a" : bandNum >= 5 ? "#d97706" : "#dc2626";
  const ringPct = bandNum > 0 ? (bandNum / 9) * 100 : 0;
  const circumference = 2 * Math.PI * 32;
  const dashOffset = circumference - (ringPct / 100) * circumference;

  const focusedQuestion = focusedQuestionId
    ? activeSection?.questions.find(q => q.questionId === focusedQuestionId)
    : undefined;
  const activeTerms = collectEvidenceTerms(focusedQuestion);
  // The exact span to highlight: prefer the authored answer location, else fall
  // back to the quoted phrase inside the explanation.
  const focusedReference =
    focusedQuestion?.answerReference?.snippet || evidenceFromExplanation(focusedQuestion?.explanation);
  // For Listening sections use the transcript as context (same role as the reading passage).
  const tutorPassage = activeSection?.audioTranscript || activeSection?.passage || "";

  const handleExplainClick = (q: ReviewQuestion) => {
    setSelectedQuestion({
      questionId: q.questionId,
      questionText: q.questionText || t("testResultPage.questionAlt", { n: q.questionOrder }),
      questionType: q.questionType,
      options: q.options,
      correctAnswer: q.correctAnswer,
      userAnswer: q.userAnswer,
      questionOrder: q.questionOrder,
    });
    setTutorOpen(true);
  };

  const toggleExplanation = (qid: string) => {
    setExpandedExplanations(prev => ({ ...prev, [qid]: !prev[qid] }));
  };

  const renderMcqOptions = (q: ReviewQuestion) => {
    if (!q.options.length) return null;
    const correctIdx = typeof q.correctAnswerRaw?.index === "number" ? q.correctAnswerRaw.index : -1;
    const correctIndices: number[] = q.correctAnswerRaw?.indices || (correctIdx >= 0 ? [correctIdx] : []);
    const userIndices: number[] =
      q.questionType === "MULTIPLE_CHOICE_MULTI_ANSWER"
        ? q.userAnswer
          ? q.userAnswer
              .split(",")
              .map(s => parseInt(s, 10))
              .filter(n => !isNaN(n))
          : []
        : (() => {
            const ui = q.options.findIndex(opt => opt === q.userAnswer);
            return ui >= 0 ? [ui] : [];
          })();

    return (
      <div className="space-y-1.5">
        {q.options.map((opt, idx) => {
          const isCorrect = correctIndices.includes(idx);
          const isUserPick = userIndices.includes(idx);
          const tone = isCorrect
            ? "border-green-400 bg-green-50"
            : isUserPick
            ? "border-red-400 bg-red-50"
            : "border-slate-200 bg-white";
          return (
            <div key={idx} className={`flex items-start gap-2 p-2 rounded-lg border ${tone}`}>
              <span
                className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                  isCorrect
                    ? "bg-green-500 text-white"
                    : isUserPick
                    ? "bg-red-500 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="text-sm text-slate-700 flex-1 leading-relaxed">{opt}</span>
              {isCorrect && (
                <span className="material-symbols-outlined text-green-600 text-[18px]" title={t("testResultPage.correct")}>
                  check_circle
                </span>
              )}
              {isUserPick && !isCorrect && (
                <span className="material-symbols-outlined text-red-600 text-[18px]" title={t("testResultPage.yourAnswer")}>
                  cancel
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTrueFalseOptions = (q: ReviewQuestion) => {
    const opts =
      q.questionType === "TRUE_FALSE_NOT_GIVEN" ? ["TRUE", "FALSE", "NOT GIVEN"] : ["YES", "NO", "NOT GIVEN"];
    const correct = q.correctAnswerRaw?.text;
    return (
      <div className="grid grid-cols-3 gap-2">
        {opts.map(opt => {
          const isCorrect = opt === correct;
          const isUserPick = opt === q.userAnswer;
          const tone = isCorrect
            ? "border-green-400 bg-green-50 text-green-800"
            : isUserPick
            ? "border-red-400 bg-red-50 text-red-800"
            : "border-slate-200 bg-white text-slate-600";
          return (
            <div
              key={opt}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 text-xs font-bold ${tone}`}
            >
              {opt}
              {isCorrect && <span className="material-symbols-outlined text-[14px]">check_circle</span>}
              {isUserPick && !isCorrect && <span className="material-symbols-outlined text-[14px]">cancel</span>}
            </div>
          );
        })}
      </div>
    );
  };

  const renderQuestionCard = (q: ReviewQuestion, opts?: { interactive?: boolean }) => {
    const interactive = opts?.interactive ?? true;
    const isFocused = focusedQuestionId === q.questionId;
    const hasExplanation = !!q.explanation;
    const explExpanded = expandedExplanations[q.questionId];
    const borderTone = q.isCorrect ? "border-green-200" : "border-red-200";
    const ringTone = isFocused ? "ring-2 ring-indigo-300" : "";

    return (
      <div
        key={q.questionId}
        id={`review-${q.questionId}`}
        onClick={interactive ? () => setFocusedQuestionId(q.questionId) : undefined}
        className={`bg-white rounded-xl border ${borderTone} ${ringTone} p-4 shadow-sm transition-all ${
          interactive ? "cursor-pointer hover:shadow-md" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                q.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {q.questionOrder || "?"}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                QUESTION_TYPE_BADGE[q.questionType] || "bg-slate-100 text-slate-600"
              }`}
            >
              {t(`testResultPage.questionTypes.${q.questionType}`, { defaultValue: q.questionType })}
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1 text-xs font-bold ${
              q.isCorrect ? "text-green-600" : "text-red-600"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {q.isCorrect ? "check_circle" : "cancel"}
            </span>
            {q.isCorrect ? t("testResultPage.correct") : t("testResultPage.incorrect")}
          </span>
        </div>

        {q.questionText && (
          <p className="text-sm text-slate-800 mb-3 leading-relaxed">{q.questionText}</p>
        )}

        {q.imageUrl && (
          <img
            src={q.imageUrl}
            alt={t("testResultPage.questionAlt", { n: q.questionOrder })}
            className="mb-3 max-w-full rounded-lg border border-slate-200"
          />
        )}

        {(q.questionType === "MULTIPLE_CHOICE" || q.questionType === "MULTIPLE_CHOICE_MULTI_ANSWER") &&
          q.options.length > 0 && <div className="mb-3">{renderMcqOptions(q)}</div>}

        {(q.questionType === "TRUE_FALSE_NOT_GIVEN" || q.questionType === "YES_NO_NOT_GIVEN") && (
          <div className="mb-3">{renderTrueFalseOptions(q)}</div>
        )}

        {(q.questionType === "GAP_FILL" ||
          q.questionType === "SHORT_ANSWER" ||
          q.questionType === "MATCHING") && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            <AnswerPill
              label={t("testResultPage.yourAnswer")}
              value={q.userAnswer || t("testResultPage.noAnswer")}
              tone={q.isCorrect ? "correct" : "user"}
            />
            <AnswerPill label={t("testResultPage.correctAnswer")} value={q.correctAnswer} tone="correct" />
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1">
            {hasExplanation && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  toggleExplanation(q.questionId);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 px-2 py-1 rounded hover:bg-amber-50"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {explExpanded ? "expand_less" : "lightbulb"}
                </span>
                {explExpanded ? t("testResultPage.hideExplanation") : t("testResultPage.showExplanation")}
              </button>
            )}
          </div>
          {tutorPassage && (
            <button
              onClick={e => {
                e.stopPropagation();
                handleExplainClick(q);
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 px-3 py-1.5 rounded-lg shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              {t("testResultPage.aiTutor")}
            </button>
          )}
        </div>

        {hasExplanation && explExpanded && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <span className="material-symbols-outlined text-amber-500 text-[18px] mt-0.5 shrink-0">
              lightbulb
            </span>
            <p className="text-sm text-amber-900 leading-relaxed">{q.explanation}</p>
          </div>
        )}
      </div>
    );
  };

  // Show split layout whenever the active section has a passage OR a transcript — regardless of skill flag.
  const hasLeftPanel = !!activeSection && (!!activeSection.passage || !!activeSection.audioTranscript);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900">
      {/* Confetti when the learner scores a strong band */}
      <Celebration fire={bandNum >= 7} />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16 flex items-center px-6 justify-between">
        <Link
          to="/exam"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {t("testResultPage.examCenter")}
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-700">{testTitle}</span>
          {skills.map(s => (
            <span
              key={s}
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                s === "LISTENING" ? "bg-teal-100 text-teal-700" : "bg-indigo-100 text-indigo-700"
              }`}
            >
              {s}
            </span>
          ))}
        </div>
        <Link
          to="/exam/history"
          className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[18px]">history</span>
          {t("testResultPage.history")}
        </Link>
      </header>

      {/* Compact Score Summary */}
      <div className={`bg-gradient-to-r ${scoreBg} border-b`}>
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="32" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                <circle
                  cx="36"
                  cy="36"
                  r="32"
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-xl font-black ${scoreColor}`}>{band}</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase">{t("testResultPage.band")}</span>
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">{t("testResultPage.testCompleted")}</h2>
              <p className="text-xs text-slate-500">
                {result.completedAt ? new Date(result.completedAt).toLocaleString(dateLocale) : "—"}
              </p>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{t("testResultPage.stats.correct")}</p>
              <p className="text-lg font-black text-slate-800">
                {correctCount}
                <span className="text-sm text-slate-400 font-medium">/{total}</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{t("testResultPage.stats.wrong")}</p>
              <p className="text-lg font-black text-red-600">{total - correctCount}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{t("testResultPage.stats.accuracy")}</p>
              <p className="text-lg font-black text-slate-800">{pct}%</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{t("testResultPage.stats.bandScore")}</p>
              <p className={`text-lg font-black ${scoreColor}`}>{band}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      {sections.length > 1 && (
        <div className="bg-white border-b border-slate-200 sticky top-16 z-20">
          <div className="max-w-[1600px] mx-auto px-6 flex gap-1 overflow-x-auto">
            {sections.map(s => {
              const correctInSection = s.questions.filter(q => q.isCorrect).length;
              const isActive = s.id === activeSectionId;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSectionId(s.id);
                    setFocusedQuestionId(null);
                  }}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {s.title}
                  <span className="ml-2 text-[10px] font-bold text-slate-400">
                    {correctInSection}/{s.questions.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Split-screen Review */}
      {activeSection && (
        <div className="max-w-[1600px] mx-auto">
          {hasLeftPanel ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x lg:divide-slate-200">
              {/* Left: Passage / Transcript */}
              <div className="bg-white p-6 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:sticky lg:top-[7.5rem]">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {isListeningTest ? t("testResultPage.audioTranscript") : t("testResultPage.readingPassage")}
                  </h3>
                  {focusedQuestionId && (
                    <button
                      onClick={() => setFocusedQuestionId(null)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                      {t("testResultPage.clearHighlight")}
                    </button>
                  )}
                </div>

                {focusedQuestion && (activeTerms.length > 0 || !!focusedReference) && (
                  <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-[14px]">ink_highlighter</span>
                    <Trans
                      i18nKey="testResultPage.highlightingEvidence"
                      ns="exam"
                      values={{ order: focusedQuestion.questionOrder }}
                      components={{ strong: <strong /> }}
                    />
                  </div>
                )}

                {isListeningTest && activeSection.audioTranscript ? (
                  <>
                    {activeSection.mediaUrl && (
                      <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <button
                          onClick={() =>
                            setShowAudioReplay(prev => ({
                              ...prev,
                              [activeSection.id]: !prev[activeSection.id],
                            }))
                          }
                          className="w-full flex items-center justify-between text-sm font-bold text-slate-700"
                        >
                          <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-teal-600">headphones</span>
                            {t("testResultPage.audioReplay")}
                          </span>
                          <span className="material-symbols-outlined">
                            {showAudioReplay[activeSection.id] ? "expand_less" : "expand_more"}
                          </span>
                        </button>
                        {showAudioReplay[activeSection.id] && (
                          <audio id="result-audio" controls src={activeSection.mediaUrl} className="w-full mt-3 h-10" />
                        )}
                      </div>
                    )}
                    <HighlightedPassage
                      passage={activeSection.audioTranscript}
                      activeTerms={activeTerms}
                      referenceSnippet={focusedReference}
                    />
                  </>
                ) : (
                  <HighlightedPassage
                    passage={activeSection.passage}
                    activeTerms={activeTerms}
                    referenceSnippet={focusedReference}
                  />
                )}

                {activeSection.imageUrl && (
                  <div className="mt-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("testResultPage.diagram")}</h4>
                    <img
                      src={activeSection.imageUrl}
                      alt={t("testResultPage.sectionDiagramAlt")}
                      className="w-full rounded-lg border border-slate-200"
                    />
                  </div>
                )}
              </div>

              {/* Right: Questions Review */}
              <div className="bg-slate-50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600 text-[18px]">fact_check</span>
                    {t("testResultPage.answerReviewCount", { count: activeSection.questions.length })}
                  </h3>
                  <p className="text-[11px] text-slate-400 hidden md:block">
                    {t("testResultPage.clickToHighlight")}
                  </p>
                </div>
                <div className="space-y-4">
                  {activeSection.questions.map(q => renderQuestionCard(q, { interactive: true }))}
                  {activeSection.questions.length === 0 && (
                    <p className="text-sm text-slate-400 italic text-center py-6">
                      {t("testResultPage.noQuestions")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Full-width questions (Writing/Speaking, or sections without passages) */
            <div className="bg-white p-6">
              <div className="space-y-4 max-w-3xl mx-auto">
                {activeSection.questions.map(q => renderQuestionCard(q, { interactive: false }))}
                {activeSection.questions.length === 0 && (
                  <p className="text-sm text-slate-400 italic text-center py-6">
                    {t("testResultPage.noQuestions")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Discussion + Actions */}
      <div className="max-w-[1600px] mx-auto px-6 pb-8 pt-6 space-y-6">
        {result?.testId && (
          <DiscussionSection
            fetchComments={fetchResultComments}
            postComment={postResultComment}
            title={t("testResultPage.discussionTitle")}
            subtitle={t("testResultPage.discussionSubtitle")}
          />
        )}

        <div className="flex items-center justify-center gap-4">
          <Link
            to="/exam"
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            ← {t("testResultPage.examCenter")}
          </Link>
          <Link
            to="/exam/history"
            className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-bold border-2 border-indigo-200 hover:bg-indigo-50 transition-colors"
          >
            {t("testResultPage.historyFull")}
          </Link>
        </div>
      </div>

      <AiTutorPanel
        isOpen={tutorOpen}
        onClose={() => {
          setTutorOpen(false);
          setSelectedQuestion(null);
        }}
        passage={tutorPassage}
        question={selectedQuestion}
        practiceSessionId={sessionId || ""}
        testTitle={testTitle}
        testSkill={isListeningTest ? "LISTENING" : "READING"}
      />
    </div>
  );
}
