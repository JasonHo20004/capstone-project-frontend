import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Chip, Field, InfoCallout, OptionCard, PreviewCard, SectionHeader } from "./shared";
import type {
  CefrLevel,
  DeadlineOption,
  ExamType,
  LearnerProfile,
} from "./types";

const EXAMS: Array<{ value: ExamType; icon: string }> = [
  { value: "IELTS", icon: "school" },
  { value: "TOEIC", icon: "work" },
  { value: "TOEFL", icon: "language" },
  { value: "CEFR", icon: "trending_up" },
  { value: "General", icon: "auto_awesome" },
];

const DEADLINES: DeadlineOption[] = ["1 month", "3 months", "6 months", "12 months", "Custom"];

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

function validateTarget(exam: ExamType, raw: string): keyof typeof VALIDATION_KEYS | null {
  if (!raw.trim()) return null;
  if (exam === "IELTS") {
    const n = parseFloat(raw);
    if (!Number.isFinite(n) || n < 1 || n > 9) return "IELTS";
  }
  if (exam === "TOEIC") {
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 10 || n > 990) return "TOEIC";
  }
  if (exam === "TOEFL") {
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 0 || n > 120) return "TOEFL";
  }
  return null;
}

const VALIDATION_KEYS = { IELTS: 1, TOEIC: 1, TOEFL: 1 } as const;

export default function Step2Goal({ profile, onUpdate, onNext, onBack }: Step2Props) {
  const { t } = useTranslation("exam");
  const validationKey = useMemo(
    () => validateTarget(profile.targetExam, profile.targetScore),
    [profile.targetExam, profile.targetScore],
  );
  const validationError = validationKey ? t(`learningPath.step2.validation.${validationKey}`) : null;
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

  const targetExamKey = profile.targetExam;
  const dash = t("learningPath.common.dash");

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <SectionHeader
          title={t("learningPath.step2.title")}
          description={t("learningPath.step2.description")}
          badge={t("learningPath.step2.badge")}
        />

        <Field label={t("learningPath.step2.fields.exam")} required>
          <div
            role="radiogroup"
            aria-label={t("learningPath.step2.fields.examAria")}
            className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3"
          >
            {EXAMS.map((exam) => (
              <OptionCard
                key={exam.value}
                value={exam.value}
                selected={profile.targetExam === exam.value}
                onSelect={(v) => onUpdate({ targetExam: v, targetScore: "" })}
                title={t(`learningPath.step2.exams.${exam.value}.label`)}
                description={t(`learningPath.step2.exams.${exam.value}.subtitle`)}
                icon={<span className="material-symbols-outlined text-[18px]">{exam.icon}</span>}
              />
            ))}
          </div>
        </Field>

        <Field
          label={t("learningPath.step2.fields.target")}
          htmlFor="target-score"
          hint={t(`learningPath.step2.targetHints.${targetExamKey}`)}
          required
        >
          <input
            id="target-score"
            type="text"
            inputMode="decimal"
            value={profile.targetScore}
            onChange={(e) => onUpdate({ targetScore: e.target.value })}
            placeholder={t(`learningPath.step2.targetPlaceholders.${targetExamKey}`)}
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

        <Field label={t("learningPath.step2.fields.deadline")} required>
          <div
            role="radiogroup"
            aria-label={t("learningPath.step2.fields.deadlineAria")}
            className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3"
          >
            {DEADLINES.map((d) => (
              <OptionCard
                key={d}
                value={d}
                selected={profile.deadline === d}
                onSelect={(v) => onUpdate({ deadline: v })}
                title={t(`learningPath.step2.deadlines.${d}.label`)}
                description={t(`learningPath.step2.deadlines.${d}.hint`)}
              />
            ))}
          </div>
          {profile.deadline === "Custom" && (
            <div className="mt-3">
              <label htmlFor="custom-deadline" className="sr-only">
                {t("learningPath.step2.fields.deadlineCustomAria")}
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

        <Field label={t("learningPath.step2.fields.reason")} required>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((reason) => (
              <Chip
                key={reason}
                selected={profile.reasonForStudying === reason}
                onClick={() => onUpdate({ reasonForStudying: reason })}
              >
                {t(`learningPath.step2.reasons.${reason}`)}
              </Chip>
            ))}
          </div>
        </Field>

        {showWarning && (
          <div className="mb-5">
            <InfoCallout
              tone="warning"
              title={t("learningPath.step2.warning.title")}
            >
              {t("learningPath.step2.warning.body")}
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
            {t("learningPath.common.back")}
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!canContinue}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
          >
            {t("learningPath.common.continue")}
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>

      <PreviewCard
        title={t("learningPath.step2.preview.title")}
        description={t("learningPath.step2.preview.description")}
      >
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">{t("learningPath.step2.preview.cefr")}</span>
            <span className="font-semibold text-slate-800">{profile.cefrLevel ?? dash}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">{t("learningPath.step2.preview.target")}</span>
            <span className="font-semibold text-slate-800">
              {profile.targetExam}
              {profile.targetScore ? ` · ${profile.targetScore}` : ""}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">{t("learningPath.step2.preview.timeline")}</span>
            <span className="font-semibold text-slate-800">
              {profile.deadline === "Custom"
                ? profile.customDeadline || dash
                : t(`learningPath.step2.deadlines.${profile.deadline}.label`)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">{t("learningPath.step2.preview.reason")}</span>
            <span className="font-semibold text-slate-800 text-right">
              {profile.reasonForStudying
                ? t(`learningPath.step2.reasons.${profile.reasonForStudying}`)
                : dash}
            </span>
          </div>
        </div>
      </PreviewCard>
    </div>
  );
}
