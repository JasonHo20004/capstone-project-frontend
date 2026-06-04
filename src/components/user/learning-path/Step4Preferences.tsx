import { useTranslation } from "react-i18next";
import { Chip, Field, InfoCallout, OptionCard, PreviewCard, SectionHeader } from "./shared";
import type {
  Confidence,
  LearnerProfile,
  LearningPreference,
  PreviousExamExperience,
  WeakestSkillOption,
} from "./types";

const WEAK_SKILLS: WeakestSkillOption[] = [
  "Listening",
  "Reading",
  "Writing",
  "Speaking",
  "Vocabulary",
  "Grammar",
  "Not sure",
];

const LEARNING_PREFERENCES: LearningPreference[] = [
  "Video lessons",
  "Flashcards",
  "Practice exercises",
  "Mock tests",
  "Reading materials",
  "Mixed",
];

const EXPERIENCES: PreviousExamExperience[] = ["Never", "Once", "Multiple", "MockOnly"];

const CONFIDENCE: Confidence[] = ["Low", "Medium", "High"];

interface Step4Props {
  profile: LearnerProfile;
  onUpdate: (updates: Partial<LearnerProfile>) => void;
  onGenerate: () => void;
  onBack: () => void;
}

export default function Step4Preferences({
  profile,
  onUpdate,
  onGenerate,
  onBack,
}: Step4Props) {
  const { t } = useTranslation("exam");
  const togglePreference = (pref: LearningPreference) => {
    const next = profile.learningPreference.includes(pref)
      ? profile.learningPreference.filter((p) => p !== pref)
      : [...profile.learningPreference, pref];
    onUpdate({ learningPreference: next });
  };

  const canGenerate = profile.learningPreference.length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <SectionHeader
          title={t("learningPath.step4.title")}
          description={t("learningPath.step4.description")}
          badge={t("learningPath.step4.badge")}
        />

        <Field label={t("learningPath.step4.fields.weakest")} required>
          <div className="flex flex-wrap gap-2">
            {WEAK_SKILLS.map((skill) => (
              <Chip
                key={skill}
                selected={profile.weakestSkill === skill}
                onClick={() => onUpdate({ weakestSkill: skill })}
              >
                {t(`learningPath.step4.weakSkills.${skill}`)}
              </Chip>
            ))}
          </div>
          {profile.weakestSkill === "Not sure" && (
            <div className="mt-3">
              <InfoCallout tone="info" title={t("learningPath.step4.notSureCallout.title")}>
                {t("learningPath.step4.notSureCallout.body")}
              </InfoCallout>
            </div>
          )}
        </Field>

        <Field
          label={t("learningPath.step4.fields.preferences")}
          hint={t("learningPath.step4.fields.preferencesHint")}
          required
        >
          <div
            role="group"
            aria-label={t("learningPath.step4.fields.preferencesAria")}
            className="flex flex-wrap gap-2"
          >
            {LEARNING_PREFERENCES.map((pref) => (
              <Chip
                key={pref}
                selected={profile.learningPreference.includes(pref)}
                onClick={() => togglePreference(pref)}
              >
                {t(`learningPath.step4.preferences.${pref}`)}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label={t("learningPath.step4.fields.experience")}>
          <div
            role="radiogroup"
            aria-label={t("learningPath.step4.fields.experienceAria")}
            className="grid gap-2.5 sm:grid-cols-2"
          >
            {EXPERIENCES.map((e) => (
              <OptionCard
                key={e}
                value={e}
                selected={profile.previousExamExperience === e}
                onSelect={(v) => onUpdate({ previousExamExperience: v })}
                title={t(`learningPath.step4.experiences.${e}.label`)}
                description={t(`learningPath.step4.experiences.${e}.description`)}
              />
            ))}
          </div>
          {(profile.previousExamExperience === "Once" ||
            profile.previousExamExperience === "Multiple") && (
            <div className="mt-3">
              <label
                htmlFor="prev-score"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                {t("learningPath.step4.fields.prevScore")}
              </label>
              <input
                id="prev-score"
                type="text"
                value={profile.previousExamScore ?? ""}
                onChange={(e) => onUpdate({ previousExamScore: e.target.value })}
                placeholder={t("learningPath.step4.fields.prevScorePlaceholder")}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>
          )}
        </Field>

        <Field label={t("learningPath.step4.fields.confidence")}>
          <div
            role="radiogroup"
            aria-label={t("learningPath.step4.fields.confidenceAria")}
            className="grid gap-2.5 sm:grid-cols-3"
          >
            {CONFIDENCE.map((c) => (
              <OptionCard
                key={c}
                value={c}
                selected={profile.confidence === c}
                onSelect={(v) => onUpdate({ confidence: v })}
                title={t(`learningPath.step4.confidence.${c}.label`)}
                description={t(`learningPath.step4.confidence.${c}.description`)}
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
            onClick={onGenerate}
            disabled={!canGenerate}
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-xl hover:shadow-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
          >
            <span className="material-symbols-outlined text-[18px] transition group-hover:rotate-12">
              auto_awesome
            </span>
            {t("learningPath.step4.generate")}
          </button>
        </div>
      </div>

      <PreviewCard
        title={t("learningPath.step4.preview.title")}
        description={t("learningPath.step4.preview.description")}
      >
        <div className="rounded-xl bg-white border border-slate-200 p-4 text-xs text-slate-600 space-y-2">
          <p className="font-semibold text-slate-800">{t("learningPath.step4.preview.listHeading")}</p>
          <ul className="space-y-1.5">
            <li>• {t("learningPath.step4.preview.list1")}</li>
            <li>• {t("learningPath.step4.preview.list2")}</li>
            <li>• {t("learningPath.step4.preview.list3")}</li>
            <li>• {t("learningPath.step4.preview.list4")}</li>
            <li>• {t("learningPath.step4.preview.list5")}</li>
          </ul>
        </div>
      </PreviewCard>
    </div>
  );
}
