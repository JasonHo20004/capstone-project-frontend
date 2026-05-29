import { useTranslation } from "react-i18next";
import { Trans } from "react-i18next";
import { Chip, Field, OptionCard, PreviewCard, SectionHeader } from "./shared";
import type {
  DayOfWeek,
  LearnerProfile,
  ReminderPreference,
  SessionLength,
  StudyIntensity,
  WeeklyHoursOption,
} from "./types";

const HOURS: WeeklyHoursOption[] = ["2-3", "4-5", "6-8", "10+"];

const DAYS: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const SESSIONS: SessionLength[] = ["15", "30", "45", "60", "90"];

const INTENSITY: StudyIntensity[] = ["Light", "Standard", "Intensive"];

const REMINDERS: ReminderPreference[] = ["None", "Daily", "Weekly", "Before session"];

interface Step3Props {
  profile: LearnerProfile;
  onUpdate: (updates: Partial<LearnerProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step3Lifestyle({ profile, onUpdate, onNext, onBack }: Step3Props) {
  const { t } = useTranslation("exam");
  const toggleDay = (day: DayOfWeek) => {
    const next = profile.availableDays.includes(day)
      ? profile.availableDays.filter((d) => d !== day)
      : [...profile.availableDays, day];
    onUpdate({ availableDays: next });
  };

  const canContinue = profile.availableDays.length > 0;
  const dash = t("learningPath.common.dash");

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <SectionHeader
          title={t("learningPath.step3.title")}
          description={t("learningPath.step3.description")}
          badge={t("learningPath.step3.badge")}
        />

        <Field label={t("learningPath.step3.fields.hours")} required>
          <div
            role="radiogroup"
            aria-label={t("learningPath.step3.fields.hoursAria")}
            className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4"
          >
            {HOURS.map((opt) => (
              <OptionCard
                key={opt}
                value={opt}
                selected={profile.weeklyStudyHours === opt}
                onSelect={(v) => onUpdate({ weeklyStudyHours: v })}
                title={t(`learningPath.step3.hours.${opt}.label`)}
                description={t(`learningPath.step3.hours.${opt}.description`)}
              />
            ))}
          </div>
        </Field>

        <Field
          label={t("learningPath.step3.fields.days")}
          required
          hint={t("learningPath.step3.fields.daysHint")}
        >
          <div
            role="group"
            aria-label={t("learningPath.step3.fields.daysAria")}
            className="flex flex-wrap gap-2"
          >
            {DAYS.map((day) => (
              <Chip
                key={day}
                selected={profile.availableDays.includes(day)}
                onClick={() => toggleDay(day)}
                ariaLabel={t("learningPath.step3.toggleDay", { day: t(`learningPath.step3.days.${day}`) })}
              >
                {t(`learningPath.step3.daysShort.${day}`)}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {t("learningPath.step3.selected")}{" "}
            <span className="font-semibold text-slate-700">
              {t("learningPath.step3.daysCount", { count: profile.availableDays.length })}
            </span>
          </p>
        </Field>

        <Field label={t("learningPath.step3.fields.session")}>
          <div
            role="radiogroup"
            aria-label={t("learningPath.step3.fields.sessionAria")}
            className="flex flex-wrap gap-2"
          >
            {SESSIONS.map((s) => (
              <Chip
                key={s}
                selected={profile.preferredSessionLength === s}
                onClick={() => onUpdate({ preferredSessionLength: s })}
              >
                {t(`learningPath.step3.sessions.${s}`)}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label={t("learningPath.step3.fields.intensity")}>
          <div
            role="radiogroup"
            aria-label={t("learningPath.step3.fields.intensityAria")}
            className="grid gap-2.5 sm:grid-cols-3"
          >
            {INTENSITY.map((i) => (
              <OptionCard
                key={i}
                value={i}
                selected={profile.studyIntensity === i}
                onSelect={(v) => onUpdate({ studyIntensity: v })}
                title={t(`learningPath.step3.intensity.${i}.label`)}
                description={t(`learningPath.step3.intensity.${i}.description`)}
              />
            ))}
          </div>
        </Field>

        <Field label={t("learningPath.step3.fields.reminders")}>
          <div
            role="radiogroup"
            aria-label={t("learningPath.step3.fields.remindersAria")}
            className="grid gap-2.5 sm:grid-cols-2"
          >
            {REMINDERS.map((r) => (
              <OptionCard
                key={r}
                value={r}
                selected={profile.reminderPreference === r}
                onSelect={(v) => onUpdate({ reminderPreference: v })}
                title={t(`learningPath.step3.reminders.${r}.label`)}
                description={t(`learningPath.step3.reminders.${r}.description`)}
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
        title={t("learningPath.step3.preview.title")}
        description={t("learningPath.step3.preview.description")}
      >
        <ul className="space-y-2 text-xs text-slate-600">
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] text-cyan-600">schedule</span>
            <span>
              <Trans
                ns="exam"
                i18nKey="learningPath.step3.preview.hoursLine1"
                values={{
                  hours: profile.weeklyStudyHours || dash,
                  session: profile.preferredSessionLength,
                }}
                components={{ 0: <strong />, 1: <strong /> }}
              />
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] text-cyan-600">event</span>
            <span>
              <Trans
                ns="exam"
                i18nKey="learningPath.step3.preview.daysLine"
                values={{
                  days: profile.availableDays.length
                    ? profile.availableDays
                        .map((d) => t(`learningPath.step3.daysShort.${d}`))
                        .join(", ")
                    : t("learningPath.step3.preview.noDaysYet"),
                }}
                components={{ 0: <strong /> }}
              />
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] text-cyan-600">speed</span>
            <span>
              <Trans
                ns="exam"
                i18nKey="learningPath.step3.preview.intensityLine"
                values={{
                  intensity: t(`learningPath.step3.intensity.${profile.studyIntensity}.label`),
                }}
                components={{ 0: <strong /> }}
              />
            </span>
          </li>
        </ul>
      </PreviewCard>
    </div>
  );
}
