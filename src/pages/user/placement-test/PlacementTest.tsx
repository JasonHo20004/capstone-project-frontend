import { useCallback, useMemo, useState } from "react";
import {
  useGeneratePlacementExam,
  useSubmitPlacementExam,
} from "@/hooks/api/use-placement";
import { useProfile } from "@/hooks/api/use-user";
import type {
  PlacementAnswerSubmission,
  PlacementExamPayload,
  PlacementQuestionPayload,
  PlacementResult,
} from "@/lib/api/services/user/placement/placement.service";
import { Timer } from "@/components/user/placement/Timer";
import { ProgressBar } from "@/components/user/placement/ProgressBar";
import { FillBlankRenderer } from "@/components/user/placement/FillBlankRenderer";
import { HeadingMatchRenderer } from "@/components/user/placement/HeadingMatchRenderer";
import { ReorderRenderer } from "@/components/user/placement/ReorderRenderer";
import { ListeningRenderer } from "@/components/user/placement/ListeningRenderer";
import { BreakScreen } from "@/components/user/placement/BreakScreen";
import { ResultScreen } from "@/components/user/placement/ResultScreen";
import {
  WelcomeScreen,
  AudioCheckScreen,
  BrightnessCheckScreen,
  RulesScreen,
  CountdownScreen,
} from "@/components/user/placement/OnboardingScreens";

type Phase =
  | "WELCOME"
  | "AUDIO_CHECK"
  | "BRIGHTNESS_CHECK"
  | "RULES"
  | "COUNTDOWN"
  | "SECTION_1"
  | "BREAK_1"
  | "SECTION_2"
  | "BREAK_2"
  | "SECTION_3"
  | "SUBMITTING"
  | "RESULT";

interface StoredAnswer {
  selected_option?: "A" | "B" | "C";
  selected_order?: string;
  time_spent: number;
}

const BREAK_SECONDS = 30 * 60;

export default function PlacementTest() {
  const { data: profile } = useProfile();
  const userId = profile?.id ?? "";

  const [phase, setPhase] = useState<Phase>("WELCOME");
  const [exam, setExam] = useState<PlacementExamPayload | null>(null);
  const [answers, setAnswers] = useState<Map<string, StoredAnswer>>(new Map());
  const [questionStart, setQuestionStart] = useState<number>(Date.now());
  const [sectionIdx, setSectionIdx] = useState(0);
  const [qInSection, setQInSection] = useState(0);
  const [result, setResult] = useState<PlacementResult | null>(null);

  const generateMut = useGeneratePlacementExam();
  const submitMut = useSubmitPlacementExam();

  const section = exam?.sections[sectionIdx];
  const question = section?.questions[qInSection];

  const globalIndex = useMemo(() => {
    if (!exam) return 0;
    let g = 0;
    for (let i = 0; i < sectionIdx; i++) g += exam.sections[i].questions.length;
    return g + qInSection;
  }, [exam, sectionIdx, qInSection]);

  const globalTotal = useMemo(
    () => exam?.sections.reduce((acc, s) => acc + s.questions.length, 0) ?? 50,
    [exam]
  );

  const handleStart = useCallback(() => {
    if (!userId) return;
    generateMut.mutate(
      { userId },
      {
        onSuccess: (data) => {
          setExam(data);
          setPhase("AUDIO_CHECK");
        },
      }
    );
  }, [userId, generateMut]);

  const recordAnswer = useCallback(
    (q: PlacementQuestionPayload, patch: Partial<StoredAnswer>) => {
      const elapsed = Math.floor((Date.now() - questionStart) / 1000);
      setAnswers((prev) => {
        const next = new Map(prev);
        const existing = next.get(q.id) ?? { time_spent: 0 };
        next.set(q.id, { ...existing, ...patch, time_spent: elapsed });
        return next;
      });
    },
    [questionStart]
  );

  const advance = useCallback(() => {
    if (!exam || !section) return;
    if (qInSection + 1 < section.questions.length) {
      setQInSection((i) => i + 1);
      setQuestionStart(Date.now());
      return;
    }
    // section finished
    if (sectionIdx === 0) {
      setPhase("BREAK_1");
    } else if (sectionIdx === 1) {
      setPhase("BREAK_2");
    } else {
      void submitNow();
    }
  }, [exam, section, qInSection, sectionIdx]);

  const submitNow = useCallback(async () => {
    if (!exam || !userId) return;
    setPhase("SUBMITTING");

    const payload: PlacementAnswerSubmission[] = [];
    let gi = 0;
    exam.sections.forEach((s) => {
      s.questions.forEach((q) => {
        const a = answers.get(q.id);
        payload.push({
          question_id: q.id,
          question_index: gi,
          selected_option: a?.selected_option,
          selected_order: a?.selected_order,
          time_spent: a?.time_spent ?? 0,
        });
        gi += 1;
      });
    });

    const minWaitMs = 2500;
    const startedAt = Date.now();

    submitMut.mutate(
      { session_id: exam.session_id, userId, answers: payload },
      {
        onSuccess: (data) => {
          const remaining = Math.max(0, minWaitMs - (Date.now() - startedAt));
          window.setTimeout(() => {
            setResult(data);
            setPhase("RESULT");
          }, remaining);
        },
        onError: () => {
          setPhase("SECTION_3");
        },
      }
    );
  }, [exam, userId, answers, submitMut]);

  const startSection = (idx: number) => {
    setSectionIdx(idx);
    setQInSection(0);
    setQuestionStart(Date.now());
    setPhase(idx === 0 ? "SECTION_1" : idx === 1 ? "SECTION_2" : "SECTION_3");
  };

  // === Render by phase ===
  if (phase === "WELCOME") {
    return (
      <WelcomeScreen
        onStart={handleStart}
        isLoading={generateMut.isPending}
        error={generateMut.isError ? "Failed to load test. Please try again." : null}
      />
    );
  }
  if (phase === "AUDIO_CHECK") return <AudioCheckScreen onContinue={() => setPhase("BRIGHTNESS_CHECK")} />;
  if (phase === "BRIGHTNESS_CHECK") return <BrightnessCheckScreen onContinue={() => setPhase("RULES")} />;
  if (phase === "RULES") return <RulesScreen onContinue={() => setPhase("COUNTDOWN")} />;
  if (phase === "COUNTDOWN") return <CountdownScreen onComplete={() => startSection(0)} />;

  if (phase === "BREAK_1" && exam) {
    const next = exam.sections[1];
    return (
      <BreakScreen
        durationSeconds={BREAK_SECONDS}
        nextSectionTitle={`Section 2 — ${next.title}`}
        nextSectionQuestions={next.questions.length}
        nextSectionTimePer={next.time_per_question}
        onComplete={() => startSection(1)}
      />
    );
  }

  if (phase === "BREAK_2" && exam) {
    const next = exam.sections[2];
    return (
      <BreakScreen
        durationSeconds={BREAK_SECONDS}
        nextSectionTitle={`Section 3 — ${next.title}`}
        nextSectionQuestions={next.questions.length}
        nextSectionTimePer={next.time_per_question}
        onComplete={() => startSection(2)}
      />
    );
  }

  if (phase === "SUBMITTING") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-teal-200 border-t-teal-500" />
        <p className="text-xl font-medium text-slate-700">Analyzing your answers…</p>
        <p className="text-sm text-slate-500">Calculating your level…</p>
      </div>
    );
  }

  if (phase === "RESULT" && result) {
    return (
      <ResultScreen
        result={result}
        onRetake={() => {
          setExam(null);
          setAnswers(new Map());
          setSectionIdx(0);
          setQInSection(0);
          setResult(null);
          setPhase("WELCOME");
        }}
      />
    );
  }

  // === Active question ===
  if (!exam || !section || !question) {
    return <div className="p-8 text-center text-slate-500">Loading…</div>;
  }

  const stored = answers.get(question.id);
  const sectionLabel = `Section ${section.section}: ${section.title.toUpperCase()}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <ProgressBar
            sectionTitle={sectionLabel}
            sectionIndex={sectionIdx}
            questionInSection={qInSection}
            sectionTotal={section.questions.length}
            globalIndex={globalIndex}
            globalTotal={globalTotal}
          />
        </div>
        <Timer
          seconds={question.time_limit}
          resetKey={question.id}
          onExpire={advance}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {question.type === "fill_blank" && (
          <FillBlankRenderer
            question={question}
            selected={stored?.selected_option}
            onSelect={(opt) => recordAnswer(question, { selected_option: opt })}
          />
        )}
        {question.type === "heading_match" && (
          <HeadingMatchRenderer
            question={question}
            selected={stored?.selected_option}
            onSelect={(opt) => recordAnswer(question, { selected_option: opt })}
          />
        )}
        {question.type === "reorder" && (
          <ReorderRenderer
            question={question}
            order={stored?.selected_order}
            onChange={(order) => recordAnswer(question, { selected_order: order })}
          />
        )}
        {question.type === "listening_mcq" && (
          <ListeningRenderer
            question={question}
            selected={stored?.selected_option}
            onSelect={(opt) => recordAnswer(question, { selected_option: opt })}
          />
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={advance}
          className="rounded-full bg-teal-500 px-8 py-3 font-semibold text-white shadow hover:bg-teal-600"
        >
          {question.type === "reorder" ? "Confirm Order" : "Next →"}
        </button>
      </div>
    </div>
  );
}
