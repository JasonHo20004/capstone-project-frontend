import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Field, OptionCard, SectionHeader, InfoCallout, PreviewCard } from "./shared";
import type { CefrLevel, LearnerProfile, PlacementBaseline } from "./types";

const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

interface Step1Props {
  baseline: PlacementBaseline;
  profile: LearnerProfile;
  onUpdate: (updates: Partial<LearnerProfile>) => void;
  onNext: () => void;
}

function formatDate(iso: string | null, locale: string, fallback: string): string {
  if (!iso) return fallback;
  try {
    return new Date(iso).toLocaleDateString(locale, {
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
  const { t, i18n } = useTranslation("exam");
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-GB";
  const hasPlacement = Boolean(baseline.cefrLevel);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <SectionHeader
          title={t("learningPath.step1.title")}
          description={t("learningPath.step1.description")}
          badge={t("learningPath.step1.badge")}
        />

        {hasPlacement ? (
          <div className="mb-6 rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
                  {t("learningPath.step1.placement.recent")}
                </p>
                <p className="mt-1 text-3xl font-black text-slate-900">
                  {baseline.cefrLevel}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {t("learningPath.step1.placement.takenOn", {
                    date: formatDate(
                      baseline.takenAt,
                      dateLocale,
                      t("learningPath.step1.placement.notAvailable"),
                    ),
                  })}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                {t("learningPath.step1.placement.recentBadge")}
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
              title={t("learningPath.step1.noPlacement.title")}
            >
              {t("learningPath.step1.noPlacement.body")}
            </InfoCallout>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                to="/placement-test"
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
              >
                <span className="material-symbols-outlined text-[18px]">quiz</span>
                {t("learningPath.step1.noPlacement.takeTest")}
              </Link>
            </div>
          </div>
        )}

        <Field
          label={
            hasPlacement
              ? t("learningPath.step1.levelField.labelOverride")
              : t("learningPath.step1.levelField.labelSelect")
          }
          hint={t("learningPath.step1.levelField.hint")}
        >
          <div
            role="radiogroup"
            aria-label={t("learningPath.step1.levelField.ariaLabel")}
            className="grid gap-2.5 sm:grid-cols-2"
          >
            {CEFR_LEVELS.map((level) => (
              <OptionCard
                key={level}
                value={level}
                selected={profile.cefrLevel === level}
                onSelect={(v) => onUpdate({ cefrLevel: v })}
                title={level}
                description={t(`learningPath.step1.cefr.${level}`)}
              />
            ))}
          </div>
        </Field>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/dashboard"
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            {t("learningPath.step1.backDashboard")}
          </Link>
          <button
            type="button"
            onClick={onNext}
            disabled={!profile.cefrLevel}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
          >
            {t("learningPath.common.continue")}
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>

      <PreviewCard
        title={t("learningPath.step1.preview.title")}
        description={t("learningPath.step1.preview.description")}
      >
        <div className="space-y-2 text-xs text-slate-600">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 text-[10px] font-bold text-cyan-700">1</span>
            <span>
              <strong>{t("learningPath.step1.preview.bullet1Strong")}</strong>{" "}
              {t("learningPath.step1.preview.bullet1Text")}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 text-[10px] font-bold text-cyan-700">2</span>
            <span>
              <strong>{t("learningPath.step1.preview.bullet2Strong")}</strong>{" "}
              {t("learningPath.step1.preview.bullet2Text")}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 text-[10px] font-bold text-cyan-700">3</span>
            <span>
              <strong>{t("learningPath.step1.preview.bullet3Strong")}</strong>{" "}
              {t("learningPath.step1.preview.bullet3Text")}
            </span>
          </div>
        </div>
      </PreviewCard>
    </div>
  );
}
