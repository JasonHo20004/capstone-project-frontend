import { Link } from "react-router-dom";
import { Field, OptionCard, SectionHeader, InfoCallout, PreviewCard } from "./shared";
import type { CefrLevel, LearnerProfile, PlacementBaseline } from "./types";

const CEFR_LEVELS: Array<{ value: CefrLevel; label: string; description: string }> = [
  { value: "A1", label: "A1", description: "Beginner — basic everyday phrases" },
  { value: "A2", label: "A2", description: "Elementary — simple routine tasks" },
  { value: "B1", label: "B1", description: "Intermediate — main ideas of familiar topics" },
  { value: "B2", label: "B2", description: "Upper-intermediate — complex texts and arguments" },
  { value: "C1", label: "C1", description: "Advanced — flexible & effective use of English" },
  { value: "C2", label: "C2", description: "Proficient — near-native command" },
];

interface Step1Props {
  baseline: PlacementBaseline;
  profile: LearnerProfile;
  onUpdate: (updates: Partial<LearnerProfile>) => void;
  onNext: () => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "Not available";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function Step1Placement({
  baseline,
  profile,
  onUpdate,
  onNext,
}: Step1Props) {
  const hasPlacement = Boolean(baseline.cefrLevel);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <SectionHeader
          title="Confirm your starting level"
          description="Your placement test result is the baseline. You can override it if you've already improved."
          badge="Step 1 of 4"
        />

        {hasPlacement ? (
          <div className="mb-6 rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
                  Most recent placement
                </p>
                <p className="mt-1 text-3xl font-black text-slate-900">
                  {baseline.cefrLevel}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Taken {formatDate(baseline.takenAt)}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                Recent placement result
              </span>
            </div>
            {baseline.skillBreakdown && (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Object.entries(baseline.skillBreakdown).map(([skill, val]) => (
                  <div
                    key={skill}
                    className="rounded-lg bg-white/70 border border-cyan-100 px-2.5 py-2 text-center"
                  >
                    <p className="text-[10px] uppercase text-slate-500 font-semibold">{skill}</p>
                    <p className="text-sm font-bold text-slate-800">{val}%</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6">
            <InfoCallout
              tone="warning"
              title="No placement result on record"
            >
              Take a quick placement test so SkillBoost can pinpoint your CEFR level. You
              can still continue manually below — accuracy will be limited.
            </InfoCallout>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                to="/placement-test"
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
              >
                <span className="material-symbols-outlined text-[18px]">quiz</span>
                Take placement test
              </Link>
            </div>
          </div>
        )}

        <Field
          label={hasPlacement ? "Override level (optional)" : "Select your level"}
          hint="CEFR levels describe overall English ability — we'll personalize per skill later."
        >
          <div role="radiogroup" aria-label="CEFR level" className="grid gap-2.5 sm:grid-cols-2">
            {CEFR_LEVELS.map((level) => (
              <OptionCard
                key={level.value}
                value={level.value}
                selected={profile.cefrLevel === level.value}
                onSelect={(v) => onUpdate({ cefrLevel: v })}
                title={level.label}
                description={level.description}
              />
            ))}
          </div>
        </Field>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/dashboard"
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            ← Back to dashboard
          </Link>
          <button
            type="button"
            onClick={onNext}
            disabled={!profile.cefrLevel}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
          >
            Continue
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>

      <PreviewCard
        title="Why CEFR matters"
        description="CEFR is your baseline, but we'll combine it with your goal, schedule and learning style to truly personalize the plan."
      >
        <div className="space-y-2 text-xs text-slate-600">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 text-[10px] font-bold text-cyan-700">1</span>
            <span><strong>Baseline only.</strong> Two B1 learners can have very different weak spots.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 text-[10px] font-bold text-cyan-700">2</span>
            <span><strong>Layered with skill data.</strong> When skill breakdown becomes available, we'll prioritize automatically.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 text-[10px] font-bold text-cyan-700">3</span>
            <span><strong>Tracked over time.</strong> Retake placement to keep your plan calibrated.</span>
          </div>
        </div>
      </PreviewCard>
    </div>
  );
}
