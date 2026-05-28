import { Chip, Field, OptionCard, PreviewCard, SectionHeader } from "./shared";
import type {
  DayOfWeek,
  LearnerProfile,
  ReminderPreference,
  SessionLength,
  StudyIntensity,
  WeeklyHoursOption,
} from "./types";

const HOURS: Array<{ value: WeeklyHoursOption; label: string; description: string }> = [
  { value: "2-3", label: "2–3 hours", description: "Casual learner" },
  { value: "4-5", label: "4–5 hours", description: "Steady pace" },
  { value: "6-8", label: "6–8 hours", description: "Committed" },
  { value: "10+", label: "10+ hours", description: "All in" },
];

const DAYS: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const SESSIONS: Array<{ value: SessionLength; label: string }> = [
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "60 min" },
  { value: "90", label: "90 min" },
];

const INTENSITY: Array<{ value: StudyIntensity; label: string; description: string }> = [
  { value: "Light", label: "Light", description: "Steady, low-pressure" },
  { value: "Standard", label: "Standard", description: "Balanced workload" },
  { value: "Intensive", label: "Intensive", description: "Faster progress, more practice" },
];

const REMINDERS: Array<{ value: ReminderPreference; label: string; description: string }> = [
  { value: "None", label: "No reminders", description: "I'll check in on my own" },
  { value: "Daily", label: "Daily reminder", description: "Nudge once a day" },
  { value: "Weekly", label: "Weekly check-in", description: "Review my week" },
  { value: "Before session", label: "Before each session", description: "Notify before scheduled time" },
];

interface Step3Props {
  profile: LearnerProfile;
  onUpdate: (updates: Partial<LearnerProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step3Lifestyle({ profile, onUpdate, onNext, onBack }: Step3Props) {
  const toggleDay = (day: DayOfWeek) => {
    const next = profile.availableDays.includes(day)
      ? profile.availableDays.filter((d) => d !== day)
      : [...profile.availableDays, day];
    onUpdate({ availableDays: next });
  };

  const canContinue = profile.availableDays.length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <SectionHeader
          title="Your study lifestyle"
          description="We use weekly time more than the deadline itself when sizing your workload."
          badge="Step 3 of 4"
        />

        <Field label="Weekly study time" required>
          <div role="radiogroup" aria-label="Weekly study time" className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {HOURS.map((opt) => (
              <OptionCard
                key={opt.value}
                value={opt.value}
                selected={profile.weeklyStudyHours === opt.value}
                onSelect={(v) => onUpdate({ weeklyStudyHours: v })}
                title={opt.label}
                description={opt.description}
              />
            ))}
          </div>
        </Field>

        <Field label="Available days" required hint="Pick the days you can realistically study. We'll build your weekly schedule around them.">
          <div role="group" aria-label="Available days" className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <Chip
                key={day}
                selected={profile.availableDays.includes(day)}
                onClick={() => toggleDay(day)}
                ariaLabel={`Toggle ${day}`}
              >
                {day.slice(0, 3)}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Selected:{" "}
            <span className="font-semibold text-slate-700">
              {profile.availableDays.length || 0} {profile.availableDays.length === 1 ? "day" : "days"} per week
            </span>
          </p>
        </Field>

        <Field label="Preferred session length">
          <div role="radiogroup" aria-label="Session length" className="flex flex-wrap gap-2">
            {SESSIONS.map((s) => (
              <Chip
                key={s.value}
                selected={profile.preferredSessionLength === s.value}
                onClick={() => onUpdate({ preferredSessionLength: s.value })}
              >
                {s.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Study intensity">
          <div role="radiogroup" aria-label="Study intensity" className="grid gap-2.5 sm:grid-cols-3">
            {INTENSITY.map((i) => (
              <OptionCard
                key={i.value}
                value={i.value}
                selected={profile.studyIntensity === i.value}
                onSelect={(v) => onUpdate({ studyIntensity: v })}
                title={i.label}
                description={i.description}
              />
            ))}
          </div>
        </Field>

        <Field label="Reminders">
          <div role="radiogroup" aria-label="Reminder preference" className="grid gap-2.5 sm:grid-cols-2">
            {REMINDERS.map((r) => (
              <OptionCard
                key={r.value}
                value={r.value}
                selected={profile.reminderPreference === r.value}
                onSelect={(v) => onUpdate({ reminderPreference: v })}
                title={r.label}
                description={r.description}
              />
            ))}
          </div>
        </Field>

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
        title="What we'll do with this"
        description="Your schedule shapes the weekly plan. Light intensity drops mock tests; intensive packs in extra practice."
      >
        <ul className="space-y-2 text-xs text-slate-600">
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] text-cyan-600">schedule</span>
            <span>
              <strong>{profile.weeklyStudyHours || "—"}</strong> hours / week with{" "}
              <strong>{profile.preferredSessionLength}-minute</strong> sessions.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] text-cyan-600">event</span>
            <span>
              We'll fit lessons on{" "}
              <strong>
                {profile.availableDays.length
                  ? profile.availableDays.map((d) => d.slice(0, 3)).join(", ")
                  : "no days yet"}
              </strong>
              .
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] text-cyan-600">speed</span>
            <span>
              Intensity: <strong>{profile.studyIntensity}</strong> — affects mock test cadence and review depth.
            </span>
          </li>
        </ul>
      </PreviewCard>
    </div>
  );
}
