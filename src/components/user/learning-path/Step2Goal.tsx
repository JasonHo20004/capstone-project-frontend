import { useMemo } from "react";
import { Chip, Field, InfoCallout, OptionCard, PreviewCard, SectionHeader } from "./shared";
import type {
  CefrLevel,
  DeadlineOption,
  ExamType,
  LearnerProfile,
} from "./types";

const EXAMS: Array<{ value: ExamType; label: string; subtitle: string; icon: string }> = [
  { value: "IELTS", label: "IELTS", subtitle: "Academic / General", icon: "school" },
  { value: "TOEIC", label: "TOEIC", subtitle: "Workplace English", icon: "work" },
  { value: "TOEFL", label: "TOEFL", subtitle: "iBT / Essentials", icon: "language" },
  { value: "CEFR", label: "CEFR", subtitle: "Level-based goal", icon: "trending_up" },
  { value: "General", label: "General", subtitle: "No exam, just improve", icon: "auto_awesome" },
];

const DEADLINES: Array<{ value: DeadlineOption; label: string; hint: string }> = [
  { value: "1 month", label: "1 month", hint: "Sprint" },
  { value: "3 months", label: "3 months", hint: "Focused" },
  { value: "6 months", label: "6 months", hint: "Balanced" },
  { value: "12 months", label: "12 months", hint: "Long game" },
  { value: "Custom", label: "Custom date", hint: "Pick a date" },
];

const REASONS = [
  "Study abroad",
  "Work",
  "Graduation requirement",
  "Immigration",
  "Interview preparation",
  "Daily communication",
  "General improvement",
];

interface Step2Props {
  profile: LearnerProfile;
  onUpdate: (updates: Partial<LearnerProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

function isAggressive(
  cefr: CefrLevel | null,
  exam: ExamType,
  targetScore: string,
  deadline: DeadlineOption,
): boolean {
  if (!cefr) return false;
  const months =
    deadline === "1 month"
      ? 1
      : deadline === "3 months"
      ? 3
      : deadline === "6 months"
      ? 6
      : deadline === "12 months"
      ? 12
      : 6;
  if (exam === "IELTS") {
    const ielts = parseFloat(targetScore);
    if (Number.isFinite(ielts) && ielts >= 7 && months <= 3) {
      return ["A1", "A2", "B1"].includes(cefr);
    }
  }
  return false;
}

function validateTarget(exam: ExamType, raw: string): string | null {
  if (!raw.trim()) return null;
  if (exam === "IELTS") {
    const n = parseFloat(raw);
    if (!Number.isFinite(n) || n < 1 || n > 9) {
      return "Enter an IELTS band between 1.0 and 9.0.";
    }
  }
  if (exam === "TOEIC") {
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 10 || n > 990) {
      return "Enter a TOEIC score between 10 and 990.";
    }
  }
  if (exam === "TOEFL") {
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 0 || n > 120) {
      return "Enter a TOEFL iBT score between 0 and 120.";
    }
  }
  return null;
}

export default function Step2Goal({ profile, onUpdate, onNext, onBack }: Step2Props) {
  const validationError = useMemo(
    () => validateTarget(profile.targetExam, profile.targetScore),
    [profile.targetExam, profile.targetScore],
  );
  const showWarning = isAggressive(
    profile.cefrLevel,
    profile.targetExam,
    profile.targetScore,
    profile.deadline,
  );

  const canContinue =
    !!profile.targetScore.trim() &&
    !!profile.reasonForStudying &&
    !validationError &&
    (profile.deadline !== "Custom" || !!profile.customDeadline);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <SectionHeader
          title="Set your target"
          description="Tell SkillBoost what you're working toward. We'll check feasibility against your level and timeline."
          badge="Step 2 of 4"
        />

        <Field label="Exam type" required>
          <div role="radiogroup" aria-label="Exam type" className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {EXAMS.map((exam) => (
              <OptionCard
                key={exam.value}
                value={exam.value}
                selected={profile.targetExam === exam.value}
                onSelect={(v) => onUpdate({ targetExam: v, targetScore: "" })}
                title={exam.label}
                description={exam.subtitle}
                icon={<span className="material-symbols-outlined text-[18px]">{exam.icon}</span>}
              />
            ))}
          </div>
        </Field>

        <Field
          label="Target score"
          htmlFor="target-score"
          hint={
            profile.targetExam === "IELTS"
              ? "IELTS bands range from 1.0 to 9.0 (e.g. 6.5)."
              : profile.targetExam === "TOEIC"
              ? "TOEIC scores range from 10 to 990."
              : profile.targetExam === "TOEFL"
              ? "TOEFL iBT scores range from 0 to 120."
              : profile.targetExam === "CEFR"
              ? "Choose a CEFR target like B2 or C1."
              : "Describe the level you want to reach."
          }
          required
        >
          <input
            id="target-score"
            type="text"
            inputMode="decimal"
            value={profile.targetScore}
            onChange={(e) => onUpdate({ targetScore: e.target.value })}
            placeholder={
              profile.targetExam === "IELTS"
                ? "e.g. 6.5"
                : profile.targetExam === "TOEIC"
                ? "e.g. 750"
                : profile.targetExam === "TOEFL"
                ? "e.g. 90"
                : profile.targetExam === "CEFR"
                ? "e.g. B2"
                : "e.g. Confident at work meetings"
            }
            aria-invalid={!!validationError}
            aria-describedby={validationError ? "target-score-error" : undefined}
            className={[
              "w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition",
              "focus:ring-2 focus:ring-cyan-500/40",
              validationError
                ? "border-rose-300 focus:border-rose-400"
                : "border-slate-200 focus:border-cyan-500",
            ].join(" ")}
          />
          {validationError && (
            <p id="target-score-error" role="alert" className="mt-1.5 text-xs text-rose-600">
              {validationError}
            </p>
          )}
        </Field>

        <Field label="Deadline" required>
          <div role="radiogroup" aria-label="Deadline" className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {DEADLINES.map((d) => (
              <OptionCard
                key={d.value}
                value={d.value}
                selected={profile.deadline === d.value}
                onSelect={(v) => onUpdate({ deadline: v })}
                title={d.label}
                description={d.hint}
              />
            ))}
          </div>
          {profile.deadline === "Custom" && (
            <div className="mt-3">
              <label htmlFor="custom-deadline" className="sr-only">
                Custom deadline date
              </label>
              <input
                id="custom-deadline"
                type="date"
                value={profile.customDeadline ?? ""}
                onChange={(e) => onUpdate({ customDeadline: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>
          )}
        </Field>

        <Field label="Why are you studying?" required>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((reason) => (
              <Chip
                key={reason}
                selected={profile.reasonForStudying === reason}
                onClick={() => onUpdate({ reasonForStudying: reason })}
              >
                {reason}
              </Chip>
            ))}
          </div>
        </Field>

        {showWarning && (
          <div className="mb-5">
            <InfoCallout
              tone="warning"
              title="Heads up — this goal may be challenging with your timeline"
            >
              You can still continue. We'll recommend a more intensive plan, or you can extend
              the deadline / lower the target slightly on the result screen.
            </InfoCallout>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!canContinue}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
          >
            Continue
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>

      <PreviewCard
        title="Personalization preview"
        description="As you add details, your plan accuracy improves."
      >
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">CEFR baseline</span>
            <span className="font-semibold text-slate-800">{profile.cefrLevel ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Target</span>
            <span className="font-semibold text-slate-800">
              {profile.targetExam}
              {profile.targetScore ? ` · ${profile.targetScore}` : ""}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Timeline</span>
            <span className="font-semibold text-slate-800">
              {profile.deadline === "Custom"
                ? profile.customDeadline || "—"
                : profile.deadline}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Reason</span>
            <span className="font-semibold text-slate-800 text-right">
              {profile.reasonForStudying || "—"}
            </span>
          </div>
        </div>
      </PreviewCard>
    </div>
  );
}
