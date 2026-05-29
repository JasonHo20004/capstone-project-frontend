import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "@/lib/api/config";
import { placementService } from "@/lib/api/services/user/placement/placement.service";

import Stepper from "@/components/user/learning-path/Stepper";
import Step1Placement from "@/components/user/learning-path/Step1Placement";
import Step2Goal from "@/components/user/learning-path/Step2Goal";
import Step3Lifestyle from "@/components/user/learning-path/Step3Lifestyle";
import Step4Preferences from "@/components/user/learning-path/Step4Preferences";
import GeneratingState from "@/components/user/learning-path/GeneratingState";
import PlanResult from "@/components/user/learning-path/PlanResult";
import { buildMockPlan } from "@/components/user/learning-path/mock-plan";
import type {
  GeneratedPlan,
  LearnerProfile,
  PlacementBaseline,
  SkillKey,
  WizardStep,
} from "@/components/user/learning-path/types";

type View = "hydrating" | "wizard" | "generating" | "result" | "error";

const INITIAL_PROFILE: LearnerProfile = {
  cefrLevel: null,
  placementTakenAt: null,
  targetExam: "IELTS",
  targetScore: "",
  deadline: "6 months",
  reasonForStudying: "",
  weeklyStudyHours: "6-8",
  availableDays: [],
  preferredSessionLength: "45",
  studyIntensity: "Standard",
  reminderPreference: "Weekly",
  weakestSkill: "Not sure",
  learningPreference: [],
  previousExamExperience: "Never",
  confidence: "Medium",
};

function readPlacementBaseline(): PlacementBaseline {
  try {
    const raw = localStorage.getItem("latestPlacementResult");
    if (!raw) return { cefrLevel: null, takenAt: null };
    const parsed = JSON.parse(raw);
    return {
      cefrLevel: parsed?.cefr_level ?? parsed?.cefrLevel ?? null,
      takenAt: parsed?.completed_at ?? parsed?.takenAt ?? null,
      skillBreakdown: parsed?.skillBreakdown ?? undefined,
    };
  } catch {
    return { cefrLevel: null, takenAt: null };
  }
}

function writePlacementBaseline(b: PlacementBaseline): void {
  try {
    localStorage.setItem(
      "latestPlacementResult",
      JSON.stringify({
        cefr_level: b.cefrLevel,
        completed_at: b.takenAt,
        cefrLevel: b.cefrLevel,
        takenAt: b.takenAt,
        skillBreakdown: b.skillBreakdown ?? {},
      })
    );
  } catch {
    /* ignore */
  }
}

function getUserId(): string {
  try {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId || payload.sub || "anonymous";
    }
  } catch {
    /* ignore */
  }
  return "anonymous";
}

export default function LearningPath() {
  const [baseline, setBaseline] = useState<PlacementBaseline>(readPlacementBaseline);
  const [view, setView] = useState<View>("hydrating");
  const [step, setStep] = useState<WizardStep>(1);
  const [profile, setProfile] = useState<LearnerProfile>(() => ({
    ...INITIAL_PROFILE,
    cefrLevel: baseline.cefrLevel,
    placementTakenAt: baseline.takenAt,
  }));
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Hydrate existing saved plan on mount — skip wizard if user already has one.
  useEffect(() => {
    const uid = getUserId();
    if (uid === "anonymous") {
      setView("wizard");
      return;
    }
    let cancelled = false;
    apiClient
      .get(`/ai/learning-path/${uid}`)
      .then((resp) => {
        if (cancelled) return;
        const data = resp.data?.data;
        const existing = (data?.plan as GeneratedPlan) ?? null;
        if (existing && existing.summary) {
          setPlan(existing);
          setSaveStatus("saved");
          setView("result");
        } else {
          setView("wizard");
        }
      })
      .catch(() => {
        if (!cancelled) setView("wizard");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch authoritative placement from backend, then refresh both state and cache.
  useEffect(() => {
    const uid = getUserId();
    if (uid === "anonymous") return;
    let cancelled = false;
    placementService
      .getLatest(uid)
      .then((resp) => {
        const d = resp?.data;
        if (!d || cancelled) return;
        const fresh: PlacementBaseline = {
          cefrLevel: d.cefrLevel ?? null,
          takenAt: d.takenAt ?? null,
          skillBreakdown: d.skillBreakdown as Partial<Record<SkillKey, number>>,
        };
        setBaseline(fresh);
        writePlacementBaseline(fresh);
        setProfile((prev) =>
          prev.cefrLevel || prev.placementTakenAt
            ? prev
            : { ...prev, cefrLevel: fresh.cefrLevel, placementTakenAt: fresh.takenAt }
        );
      })
      .catch(() => {
        /* keep localStorage cache */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateProfile = useCallback((updates: Partial<LearnerProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const goNext = useCallback(() => {
    setStep((s) => (Math.min(s + 1, 4) as WizardStep));
  }, []);
  const goBack = useCallback(() => {
    setStep((s) => (Math.max(s - 1, 1) as WizardStep));
  }, []);

  const generatePlan = useCallback(async () => {
    setView("generating");
    const startedAt = Date.now();
    const mock = buildMockPlan(profile);

    try {
      const resp = await apiClient.post("/ai/learning-path/generate", {
        userId: getUserId(),
        profile,
        skillBreakdown: baseline.skillBreakdown ?? {},
      });
      const apiPlan =
        (resp.data?.data?.plan as GeneratedPlan) ??
        (resp.data?.data as GeneratedPlan) ??
        null;
      setSaveStatus("saved"); // /generate already upserted on the backend
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, 3300 - elapsed);
      window.setTimeout(() => {
        setPlan(apiPlan ?? mock);
        setView("result");
      }, wait);
    } catch {
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, 3300 - elapsed);
      window.setTimeout(() => {
        setPlan(mock);
        setView("result");
      }, wait);
    }
  }, [profile, baseline.skillBreakdown]);

  const handleRegenerate = useCallback(() => {
    setPlan(null);
    setSaveStatus("idle");
    void generatePlan();
  }, [generatePlan]);

  const handleEditInputs = useCallback(() => {
    setView("wizard");
    setStep(2);
  }, []);

  const handleSavePlan = useCallback(async () => {
    if (!plan) return;
    setSaveStatus("saving");
    try {
      await apiClient.post("/ai/learning-path/save", {
        userId: getUserId(),
        currentLevel: profile.cefrLevel,
        targetScore: profile.targetScore,
        deadline: profile.deadline,
        plan,
      });
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }, [plan, profile.cefrLevel, profile.targetScore, profile.deadline]);

  /* ── Hydrating (loading existing plan) ─────────────────────────── */
  if (view === "hydrating") {
    return (
      <div className="max-w-[1280px] mx-auto px-2 py-2">
        <PageHeader />
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-500" />
        </div>
      </div>
    );
  }

  /* ── Generating ────────────────────────────────────────────────── */
  if (view === "generating") {
    return (
      <div className="max-w-[1280px] mx-auto px-2 py-2">
        <PageHeader />
        <GeneratingState />
      </div>
    );
  }

  /* ── Result ────────────────────────────────────────────────────── */
  if (view === "result" && plan) {
    return (
      <div className="max-w-[1280px] mx-auto px-2 py-2">
        <PageHeader compact />
        <PlanResult
          plan={plan}
          onRegenerate={handleRegenerate}
          onEditInputs={handleEditInputs}
          onSave={handleSavePlan}
          saveStatus={saveStatus}
        />
      </div>
    );
  }

  /* ── Error ─────────────────────────────────────────────────────── */
  if (view === "error") {
    return <ErrorView onEditInputs={() => { setView("wizard"); setStep(4); }} onRetry={() => void generatePlan()} />;
  }

  /* ── Wizard ────────────────────────────────────────────────────── */
  return (
    <div className="max-w-[1280px] mx-auto px-2 py-2">
      <PageHeader />

      <div className="mb-6">
        <Stepper current={step} onJump={(s) => setStep(s)} />
      </div>

      {step === 1 && (
        <Step1Placement
          baseline={baseline}
          profile={profile}
          onUpdate={updateProfile}
          onNext={goNext}
        />
      )}
      {step === 2 && (
        <Step2Goal
          profile={profile}
          onUpdate={updateProfile}
          onNext={goNext}
          onBack={goBack}
        />
      )}
      {step === 3 && (
        <Step3Lifestyle
          profile={profile}
          onUpdate={updateProfile}
          onNext={goNext}
          onBack={goBack}
        />
      )}
      {step === 4 && (
        <Step4Preferences
          profile={profile}
          onUpdate={updateProfile}
          onGenerate={() => void generatePlan()}
          onBack={goBack}
        />
      )}
    </div>
  );
}

function PageHeader({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation("exam");
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <h1
            className={[
              "font-black tracking-tight text-slate-900",
              compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl",
            ].join(" ")}
          >
            {compact ? t("learningPath.header.titleCompact") : t("learningPath.header.titleFull")}
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
            {t("learningPath.header.aiBadge")}
          </span>
        </div>
        {!compact && (
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            {t("learningPath.header.tagline")}
          </p>
        )}
      </div>
      <Link
        to="/dashboard"
        className="text-sm font-medium text-cyan-700 hover:text-cyan-800"
      >
        {t("learningPath.header.backToDashboard")}
      </Link>
    </header>
  );
}

function ErrorView({ onEditInputs, onRetry }: { onEditInputs: () => void; onRetry: () => void }) {
  const { t } = useTranslation("exam");
  return (
    <div className="max-w-[1280px] mx-auto px-2 py-2">
      <PageHeader />
      <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50/60 p-8 text-center">
        <h2 className="text-lg font-bold text-rose-900">
          {t("learningPath.error.title")}
        </h2>
        <p className="mt-1 text-sm text-rose-700">
          {t("learningPath.error.description")}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            onClick={onEditInputs}
            className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
          >
            {t("learningPath.error.editInputs")}
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700"
          >
            {t("learningPath.error.tryAgain")}
          </button>
        </div>
      </div>
    </div>
  );
}
