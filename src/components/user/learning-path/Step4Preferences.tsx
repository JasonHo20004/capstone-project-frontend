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

const EXPERIENCES: Array<{ value: PreviousExamExperience; label: string; description: string }> = [
  { value: "Never", label: "Never taken", description: "Brand new to this exam" },
  { value: "Once", label: "Took it once", description: "I have a previous score" },
  { value: "Multiple", label: "Multiple times", description: "Repeat test taker" },
  { value: "MockOnly", label: "Mock tests only", description: "Practiced but never sat the real exam" },
];

const CONFIDENCE: Array<{ value: Confidence; label: string; description: string }> = [
  { value: "Low", label: "Low", description: "Hesitant in most situations" },
  { value: "Medium", label: "Medium", description: "Comfortable with familiar topics" },
  { value: "High", label: "High", description: "Confident in most contexts" },
];

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
          title="Fine-tune for you"
          description="A few last details so the plan feels like it was built for you, not a generic learner."
          badge="Step 4 of 4"
        />

        <Field label="Which skill feels weakest right now?" required>
          <div className="flex flex-wrap gap-2">
            {WEAK_SKILLS.map((skill) => (
              <Chip
                key={skill}
                selected={profile.weakestSkill === skill}
                onClick={() => onUpdate({ weakestSkill: skill })}
              >
                {skill}
              </Chip>
            ))}
          </div>
          {profile.weakestSkill === "Not sure" && (
            <div className="mt-3">
              <InfoCallout tone="info" title="We'll build a balanced plan">
                Since you're not sure, we'll keep all skills in rotation and suggest a short
                diagnostic later to refine the plan.
              </InfoCallout>
            </div>
          )}
        </Field>

        <Field
          label="How do you prefer to learn?"
          hint="Pick one or more — we'll weight your roadmap accordingly."
          required
        >
          <div role="group" aria-label="Learning preferences" className="flex flex-wrap gap-2">
            {LEARNING_PREFERENCES.map((pref) => (
              <Chip
                key={pref}
                selected={profile.learningPreference.includes(pref)}
                onClick={() => togglePreference(pref)}
              >
                {pref}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Previous exam experience">
          <div role="radiogroup" aria-label="Previous exam experience" className="grid gap-2.5 sm:grid-cols-2">
            {EXPERIENCES.map((e) => (
              <OptionCard
                key={e.value}
                value={e.value}
                selected={profile.previousExamExperience === e.value}
                onSelect={(v) => onUpdate({ previousExamExperience: v })}
                title={e.label}
                description={e.description}
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
                Most recent score (optional)
              </label>
              <input
                id="prev-score"
                type="text"
                value={profile.previousExamScore ?? ""}
                onChange={(e) => onUpdate({ previousExamScore: e.target.value })}
                placeholder="e.g. IELTS 5.5"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>
          )}
        </Field>

        <Field label="How confident are you in your English right now?">
          <div role="radiogroup" aria-label="Confidence" className="grid gap-2.5 sm:grid-cols-3">
            {CONFIDENCE.map((c) => (
              <OptionCard
                key={c.value}
                value={c.value}
                selected={profile.confidence === c.value}
                onSelect={(v) => onUpdate({ confidence: v })}
                title={c.label}
                description={c.description}
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
            onClick={onGenerate}
            disabled={!canGenerate}
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-xl hover:shadow-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
          >
            <span className="material-symbols-outlined text-[18px] transition group-hover:rotate-12">
              auto_awesome
            </span>
            Generate Personalized Learning Path
          </button>
        </div>
      </div>

      <PreviewCard
        title="Ready to generate"
        description="SkillBoost AI will combine everything you've told us into a roadmap with weekly milestones and recommended lessons."
      >
        <div className="rounded-xl bg-white border border-slate-200 p-4 text-xs text-slate-600 space-y-2">
          <p className="font-semibold text-slate-800">What you'll get:</p>
          <ul className="space-y-1.5">
            <li>• Goal-gap analysis and feasibility check</li>
            <li>• Skill priority ranking with reasons</li>
            <li>• Phased roadmap (Foundation → Skill building → Simulation)</li>
            <li>• Weekly schedule mapped to your free days</li>
            <li>• Real lessons, flashcards, and practice tests inside SkillBoost</li>
          </ul>
        </div>
      </PreviewCard>
    </div>
  );
}
