import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { InfoCallout } from "./shared";
import type {
  GeneratedPlan,
  RecommendedItem,
  SkillPriority,
  WeeklyTask,
} from "./types";

const PERSONALIZATION_STYLES = {
  Basic: {
    tone: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
    width: "33%",
    progressValue: 33,
  },
  Good: {
    tone: "bg-cyan-100 text-cyan-800 border-cyan-200",
    dot: "bg-cyan-500",
    width: "66%",
    progressValue: 66,
  },
  High: {
    tone: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
    width: "100%",
    progressValue: 100,
  },
} as const;

const INTENSITY_STYLES = {
  High: "bg-rose-50 text-rose-700 border-rose-100",
  Medium: "bg-amber-50 text-amber-700 border-amber-100",
  Low: "bg-slate-50 text-slate-600 border-slate-100",
} as const;

const FEASIBILITY_STYLES = {
  Achievable: "text-emerald-700 bg-emerald-50 border-emerald-100",
  Challenging: "text-amber-700 bg-amber-50 border-amber-100",
  "Very challenging": "text-rose-700 bg-rose-50 border-rose-100",
} as const;

const TYPE_ICON: Record<RecommendedItem["type"], string> = {
  Course: "school",
  Lesson: "play_lesson",
  Flashcard: "style",
  Quiz: "quiz",
  "Practice Test": "assignment",
};

interface PlanResultProps {
  plan: GeneratedPlan;
  onRegenerate: () => void;
  onEditInputs: () => void;
  onSave?: () => void;
  saveStatus?: "idle" | "saving" | "saved" | "error";
}

export default function PlanResult({
  plan,
  onRegenerate,
  onEditInputs,
  onSave,
  saveStatus = "idle",
}: PlanResultProps) {
  const { t } = useTranslation("exam");
  const persona = PERSONALIZATION_STYLES[plan.personalizationLevel];
  const personaLabel = t(`learningPath.result.personalization.${plan.personalizationLevel}`);
  const saveLabel = t(`learningPath.result.save.${saveStatus}`);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* ── 1. Summary ─────────────────────────────────────────────────── */}
      <section
        aria-labelledby="plan-summary-heading"
        className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-cyan-600 via-cyan-700 to-indigo-700 p-6 sm:p-8 text-white shadow-xl"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur">
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              {t("learningPath.result.badge")}
            </span>
            <h2 id="plan-summary-heading" className="mt-2 text-2xl sm:text-3xl font-black">
              {t("learningPath.result.headline", {
                exam: plan.summary.targetExam,
                score: plan.summary.targetScore,
              })}
            </h2>
            <p className="mt-1 text-sm text-white/80">
              {plan.summary.estimatedWeeklyWorkload}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onEditInputs}
              className="rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/20"
            >
              {t("learningPath.result.editInputs")}
            </button>
            <button
              type="button"
              onClick={onRegenerate}
              className="rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/20"
            >
              {t("learningPath.result.regenerate")}
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saveStatus === "saving"}
              className="rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-cyan-700 shadow transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saveLabel}
            </button>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: t("learningPath.result.summary.current"), value: plan.summary.currentLevel },
            { label: t("learningPath.result.summary.target"), value: plan.summary.targetScore },
            { label: t("learningPath.result.summary.deadline"), value: plan.summary.deadline },
            {
              label: t("learningPath.result.summary.weekly"),
              value: t("learningPath.result.summary.weeklyValue", { hours: plan.summary.weeklyStudyHours }),
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                {stat.label}
              </dt>
              <dd className="mt-0.5 text-xl font-black">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── 2. Personalization meter ───────────────────────────────────── */}
      <section
        aria-labelledby="personalization-heading"
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="personalization-heading" className="text-base font-bold text-slate-900">
              {t("learningPath.result.personalization.title")}
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-2xl">
              {plan.personalizationReason}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${persona.tone}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${persona.dot}`} aria-hidden />
            {personaLabel}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={persona.progressValue}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("learningPath.result.personalization.ariaLabel")}
          className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100"
        >
          <div
            className={`h-full rounded-full transition-all ${persona.dot}`}
            style={{ width: persona.width }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          <span>{t("learningPath.result.personalization.Basic")}</span>
          <span>{t("learningPath.result.personalization.Good")}</span>
          <span>{t("learningPath.result.personalization.High")}</span>
        </div>
      </section>

      {/* ── 3. Gap analysis ────────────────────────────────────────────── */}
      <GapAnalysisCard plan={plan} />

      {/* ── 4. Skill priorities ────────────────────────────────────────── */}
      <SkillPriorityCard priorities={plan.skillPriorities} />

      <div className="grid gap-6 xl:grid-cols-2">
        {/* ── 5a. Phases ──────────────────────────────────────────────── */}
        <PhasesCard phases={plan.phases} />

        {/* ── 5b. Weekly schedule ─────────────────────────────────────── */}
        <WeeklyScheduleCard tasks={plan.weeklyPlan} />
      </div>

      {/* ── 6. Why this plan ──────────────────────────────────────────── */}
      <section
        aria-labelledby="why-heading"
        className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50/80 via-white to-white p-6 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white">
            <span className="material-symbols-outlined">psychology</span>
          </span>
          <div>
            <h3 id="why-heading" className="text-base font-bold text-slate-900">
              {t("learningPath.result.why.heading")}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
              {plan.explanation}
            </p>
          </div>
        </div>
      </section>

      {/* ── 7. Recommended content ────────────────────────────────────── */}
      <RecommendedSection
        title={t("learningPath.result.sections.lessons.title")}
        description={t("learningPath.result.sections.lessons.description")}
        items={plan.recommendedLessons}
      />
      <RecommendedSection
        title={t("learningPath.result.sections.flashcards.title")}
        description={t("learningPath.result.sections.flashcards.description")}
        items={plan.recommendedFlashcards}
      />
      <RecommendedSection
        title={t("learningPath.result.sections.quizzes.title")}
        description={t("learningPath.result.sections.quizzes.description")}
        items={plan.recommendedQuizzes}
      />

      {/* ── 8. Action bar ─────────────────────────────────────────────── */}
      <section
        aria-label={t("learningPath.result.actionBar.ariaLabel")}
        className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-3 sm:p-4 shadow-xl backdrop-blur"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            {t("learningPath.result.actionBar.note")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/placement-test"
              className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t("learningPath.result.actionBar.retake")}
            </Link>
            <button
              type="button"
              onClick={onRegenerate}
              className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t("learningPath.result.regenerate")}
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saveStatus === "saving"}
              className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── Sub-cards ─────────────────────────────────────────────────────── */

function GapAnalysisCard({ plan }: { plan: GeneratedPlan }) {
  const { t } = useTranslation("exam");
  const f = FEASIBILITY_STYLES[plan.gapAnalysis.feasibility];
  return (
    <section
      aria-labelledby="gap-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="gap-heading" className="text-base font-bold text-slate-900">
          {t("learningPath.result.gap.heading")}
        </h3>
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${f}`}>
          {t(`learningPath.result.feasibility.${plan.gapAnalysis.feasibility}`)}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {t("learningPath.result.gap.from")}
          </p>
          <p className="mt-1 text-lg font-bold text-slate-800">
            {plan.gapAnalysis.currentLevel}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {t("learningPath.result.gap.to")}
          </p>
          <p className="mt-1 text-lg font-bold text-slate-800">
            {plan.gapAnalysis.targetLabel}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {t("learningPath.result.gap.estimatedGap")}
          </p>
          <p className="mt-1 text-lg font-bold text-slate-800">
            {t(`learningPath.result.gapSize.${plan.gapAnalysis.gap}`)}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-600">{plan.gapAnalysis.recommendation}</p>
      {plan.gapAnalysis.warning && (
        <div className="mt-3">
          <InfoCallout tone="warning" title={t("learningPath.result.gap.warningTitle")}>
            {plan.gapAnalysis.warning}
          </InfoCallout>
        </div>
      )}
    </section>
  );
}

function SkillPriorityCard({ priorities }: { priorities: SkillPriority[] }) {
  const { t } = useTranslation("exam");
  return (
    <section
      aria-labelledby="priority-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
    >
      <h3 id="priority-heading" className="text-base font-bold text-slate-900">
        {t("learningPath.result.priorities.heading")}
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        {t("learningPath.result.priorities.subtitle")}
      </p>
      <ol className="mt-4 space-y-3">
        {priorities.map((p) => (
          <li
            key={p.skill}
            className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 sm:p-4"
          >
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-sm font-bold text-slate-700"
            >
              {t("learningPath.result.priorities.rank", { rank: p.rank })}
            </span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-slate-900">
                  {t(`learningPath.result.skillsList.${p.skill}`)}
                </p>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${INTENSITY_STYLES[p.intensity]}`}
                >
                  {t("learningPath.result.priorities.priorityLabel", {
                    intensity: t(`learningPath.result.intensity.${p.intensity}`),
                  })}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">{p.reason}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function PhasesCard({ phases }: { phases: GeneratedPlan["phases"] }) {
  const { t } = useTranslation("exam");
  return (
    <section
      aria-labelledby="phases-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
    >
      <h3 id="phases-heading" className="text-base font-bold text-slate-900">
        {t("learningPath.result.phases.heading")}
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        {t("learningPath.result.phases.subtitle")}
      </p>
      <ol className="mt-4 space-y-3">
        {phases.map((phase, idx) => (
          <li key={phase.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                aria-hidden
                className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600 text-xs font-bold text-white"
              >
                {idx + 1}
              </span>
              {idx < phases.length - 1 && (
                <span className="mt-1 h-full w-px flex-1 bg-cyan-100" aria-hidden />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-slate-900">{phase.title}</p>
                <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700 border border-cyan-100">
                  {phase.weeks}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                {phase.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {phase.focus.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200"
                  >
                    {t(`learningPath.result.skillsList.${skill}`)}
                  </span>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function WeeklyScheduleCard({ tasks }: { tasks: WeeklyTask[] }) {
  const { t } = useTranslation("exam");
  return (
    <section
      aria-labelledby="weekly-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
    >
      <h3 id="weekly-heading" className="text-base font-bold text-slate-900">
        {t("learningPath.result.weekly.heading")}
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        {t("learningPath.result.weekly.subtitle")}
      </p>
      <ul className="mt-4 space-y-2.5">
        {tasks.map((task, idx) => (
          <li
            key={`${task.day}-${idx}`}
            className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/40 px-3 py-2.5 transition hover:border-cyan-200 hover:bg-cyan-50/30"
          >
            <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500">
                {t(`learningPath.step3.daysShort.${task.day}`)}
              </span>
              <span className="text-[10px] text-slate-400">
                {t("learningPath.result.weekly.duration", { minutes: task.durationMinutes })}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{task.title}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {t(`learningPath.result.taskTypes.${task.type}`)} ·{" "}
                {t(`learningPath.result.skillsList.${task.skill}`)}
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 opacity-0 transition group-hover:opacity-100 hover:border-cyan-300 hover:text-cyan-700"
            >
              {t("learningPath.result.weekly.start")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecommendedSection({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: RecommendedItem[];
}) {
  const { t } = useTranslation("exam");
  if (items.length === 0) return null;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="group rounded-xl border border-slate-200 bg-slate-50/40 p-4 transition hover:border-cyan-300 hover:bg-white hover:shadow-md"
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700"
                aria-hidden
              >
                <span className="material-symbols-outlined text-[18px]">
                  {TYPE_ICON[item.type]}
                </span>
              </span>
              <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {t(`learningPath.result.types.${item.type}`)}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 leading-snug">
              {item.title}
            </h4>
            <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">timer</span>
                {t("learningPath.result.itemMeta.minutes", { minutes: item.estimatedMinutes })}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                {t(`learningPath.result.difficulty.${item.difficulty}`)}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">label</span>
                {t(`learningPath.result.skillsList.${item.skill}`)}
              </span>
            </div>
            <button
              type="button"
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition group-hover:border-cyan-300 group-hover:bg-cyan-100"
            >
              <span className="material-symbols-outlined text-[14px]">
                {item.cta === "Practice" ? "fitness_center" : "play_arrow"}
              </span>
              {t(`learningPath.result.cta.${item.cta}`)}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
