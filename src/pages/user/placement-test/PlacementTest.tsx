import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Trans, useTranslation } from "react-i18next";
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
const NEXT_BUTTON_COOLDOWN_MS = 2000;

const ACTIVE_PHASES: Phase[] = [
  "COUNTDOWN",
  "SECTION_1",
  "BREAK_1",
  "SECTION_2",
  "BREAK_2",
  "SECTION_3",
];

const isActivePhase = (p: Phase) => ACTIVE_PHASES.includes(p);

export default function PlacementTest() {
  const navigate = useNavigate();
  const { t } = useTranslation("exam");
  const { user: profile, isLoading: profileLoading, isError: profileError } = useProfile();
  const userId = profile?.id ?? "";

  const [phase, setPhase] = useState<Phase>("WELCOME");
  const [exam, setExam] = useState<PlacementExamPayload | null>(null);
  const [answers, setAnswers] = useState<Map<string, StoredAnswer>>(new Map());
  const [questionStart, setQuestionStart] = useState<number>(Date.now());
  const [sectionIdx, setSectionIdx] = useState(0);
  const [qInSection, setQInSection] = useState(0);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [nextEnabled, setNextEnabled] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [audioReady, setAudioReady] = useState(true);

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

  // Reset the Next button cooldown each time the active question changes
  const questionId = question?.id;
  const isListening = question?.type === "listening_mcq";
  useEffect(() => {
    if (!questionId) return;
    setNextEnabled(false);
    // Listening questions start with audio loading — assume not ready until
    // the renderer confirms. Non-listening questions are ready immediately.
    setAudioReady(!isListening);
    const t = window.setTimeout(() => setNextEnabled(true), NEXT_BUTTON_COOLDOWN_MS);
    return () => window.clearTimeout(t);
  }, [questionId, isListening]);

  // Warn on browser-level navigation away during an active test
  useEffect(() => {
    if (!isActivePhase(phase)) return;
    const handler = (e: BeforeUnloadEvent) => {
      // Modern browsers only require preventDefault() to trigger the prompt.
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  // Preload audio for upcoming listening questions to avoid the 5-10s first-play
  // delay observed in production.
  const upcomingAudioUrls = useMemo(() => {
    if (!exam || !section) return [] as string[];
    const urls: string[] = [];
    for (let i = qInSection + 1; i < section.questions.length && urls.length < 2; i++) {
      const q = section.questions[i];
      if (q.audio_url) urls.push(q.audio_url);
    }
    for (let s = sectionIdx + 1; s < exam.sections.length && urls.length < 2; s++) {
      for (const q of exam.sections[s].questions) {
        if (q.audio_url) {
          urls.push(q.audio_url);
          if (urls.length >= 2) break;
        }
      }
    }
    return urls;
  }, [exam, section, sectionIdx, qInSection]);

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
          try {
            localStorage.setItem(
              "latestPlacementResult",
              JSON.stringify({
                cefr_level: data.cefr_level,
                completed_at: data.completed_at,
                section_scores: data.section_scores,
              })
            );
          } catch {
            /* ignore storage errors */
          }
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

  const advance = useCallback(() => {
    if (!exam || !section) return;
    if (qInSection + 1 < section.questions.length) {
      setQInSection((i) => i + 1);
      setQuestionStart(Date.now());
      return;
    }
    if (sectionIdx === 0) {
      setPhase("BREAK_1");
    } else if (sectionIdx === 1) {
      setPhase("BREAK_2");
    } else {
      void submitNow();
    }
  }, [exam, section, qInSection, sectionIdx, submitNow]);

  const startSection = (idx: number) => {
    setSectionIdx(idx);
    setQInSection(0);
    setQuestionStart(Date.now());
    setPhase(idx === 0 ? "SECTION_1" : idx === 1 ? "SECTION_2" : "SECTION_3");
  };

  const goBackToHub = () => {
    if (isActivePhase(phase)) {
      setExitOpen(true);
    } else {
      navigate("/dashboard");
    }
  };

  const confirmExit = () => {
    setExitOpen(false);
    setExam(null);
    setAnswers(new Map());
    navigate("/dashboard");
  };

  const phaseWrapper = (key: string, node: React.ReactNode) => (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {node}
      </motion.div>
    </AnimatePresence>
  );

  if (phase === "WELCOME") {
    return phaseWrapper(
      "welcome",
      <WelcomeScreen
        onStart={handleStart}
        onBack={() => navigate("/dashboard")}
        isLoading={profileLoading || generateMut.isPending}
        error={
          profileError
            ? t("placementTest.errors.profileLoad")
            : generateMut.isError
              ? t("placementTest.errors.generate")
              : null
        }
      />
    );
  }
  if (phase === "AUDIO_CHECK")
    return phaseWrapper(
      "audio",
      <AudioCheckScreen onContinue={() => setPhase("BRIGHTNESS_CHECK")} onBack={() => navigate("/dashboard")} />
    );
  if (phase === "BRIGHTNESS_CHECK")
    return phaseWrapper(
      "brightness",
      <BrightnessCheckScreen onContinue={() => setPhase("RULES")} onBack={() => navigate("/dashboard")} />
    );
  if (phase === "RULES")
    return phaseWrapper(
      "rules",
      <RulesScreen onContinue={() => setPhase("COUNTDOWN")} onBack={() => navigate("/dashboard")} />
    );
  if (phase === "COUNTDOWN")
    return phaseWrapper("countdown", <CountdownScreen onComplete={() => startSection(0)} />);

  if (phase === "BREAK_1" && exam) {
    const next = exam.sections[1];
    return phaseWrapper(
      "break1",
      <BreakScreen
        durationSeconds={BREAK_SECONDS}
        nextSectionTitle={t("placementTest.section.nextHeader", { number: 2, title: next.title })}
        nextSectionQuestions={next.questions.length}
        nextSectionTimePer={next.time_per_question}
        onComplete={() => startSection(1)}
      />
    );
  }

  if (phase === "BREAK_2" && exam) {
    const next = exam.sections[2];
    return phaseWrapper(
      "break2",
      <BreakScreen
        durationSeconds={BREAK_SECONDS}
        nextSectionTitle={t("placementTest.section.nextHeader", { number: 3, title: next.title })}
        nextSectionQuestions={next.questions.length}
        nextSectionTimePer={next.time_per_question}
        onComplete={() => startSection(2)}
      />
    );
  }

  if (phase === "SUBMITTING") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-[60vh] flex-col items-center justify-center gap-6"
      >
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-teal-200 border-t-teal-500" />
        <p className="text-xl font-medium text-slate-700">{t("placementTest.analyzing.title")}</p>
        <p className="text-sm text-slate-500">{t("placementTest.analyzing.subtitle")}</p>
      </motion.div>
    );
  }

  if (phase === "RESULT" && result) {
    return phaseWrapper(
      "result",
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
    return <div className="p-8 text-center text-slate-500">{t("placementTest.loading")}</div>;
  }

  const stored = answers.get(question.id);
  const sectionLabel = t("placementTest.section.label", {
    number: section.section,
    title: section.title.toUpperCase(),
  });

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goBackToHub}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("placementTest.backToHub")}
          </button>
          <Timer
            seconds={question.time_limit}
            resetKey={question.id}
            onExpire={advance}
            paused={!audioReady}
          />
        </div>

        <ProgressBar
          sectionTitle={sectionLabel}
          sectionIndex={sectionIdx}
          questionInSection={qInSection}
          sectionTotal={section.questions.length}
          globalIndex={globalIndex}
          globalTotal={globalTotal}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
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
                onAudioReadyChange={setAudioReady}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-end gap-3">
          {!nextEnabled && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-slate-400"
            >
              {t("placementTest.readingHint")}
            </motion.span>
          )}
          <motion.button
            type="button"
            onClick={advance}
            disabled={!nextEnabled}
            whileTap={nextEnabled ? { scale: 0.97 } : {}}
            whileHover={nextEnabled ? { scale: 1.02 } : {}}
            className={[
              "rounded-full px-8 py-3 font-semibold shadow transition-colors",
              nextEnabled
                ? "bg-teal-500 text-white hover:bg-teal-600"
                : "bg-slate-200 text-slate-400 cursor-not-allowed",
            ].join(" ")}
          >
            {question.type === "reorder" ? t("placementTest.confirmOrder") : t("placementTest.nextArrow")}
          </motion.button>
        </div>
      </div>

      <div aria-hidden="true" className="sr-only">
        {upcomingAudioUrls.map((url) => (
          <audio key={url} src={url} preload="auto" />
        ))}
      </div>

      <ExitConfirmModal
        open={exitOpen}
        onCancel={() => setExitOpen(false)}
        onConfirm={confirmExit}
      />
    </>
  );
}

function ExitConfirmModal({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation("exam");
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-modal-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="bg-gradient-to-br from-amber-50 to-rose-50 p-6">
              <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path
                    d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 id="exit-modal-title" className="text-xl font-bold text-slate-900">
                {t("placementTest.exitModal.title")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                <Trans
                  i18nKey="placementTest.exitModal.body"
                  ns="exam"
                  components={{ strong: <span className="font-semibold" /> }}
                  defaults="If you exit now, <strong>your current session will be cancelled</strong> and your answers will <strong>not be saved</strong>. You'll need to start over from the beginning if you want to take the test again."
                />
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border-2 border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {t("placementTest.exitModal.continue")}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-rose-600"
              >
                {t("placementTest.exitModal.confirm")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
