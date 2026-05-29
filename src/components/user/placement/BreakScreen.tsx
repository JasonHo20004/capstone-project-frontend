import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface BreakScreenProps {
  durationSeconds: number;
  nextSectionTitle: string;
  nextSectionQuestions: number;
  nextSectionTimePer: number;
  onComplete: () => void;
}

export function BreakScreen({
  durationSeconds,
  nextSectionTitle,
  nextSectionQuestions,
  nextSectionTimePer,
  onComplete,
}: BreakScreenProps) {
  const { t } = useTranslation("exam");
  const [remaining, setRemaining] = useState(durationSeconds);
  const [confirmingSkip, setConfirmingSkip] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(timer);
          onComplete();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [onComplete]);

  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");
  const timeStr = `${mm}:${ss}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-12 text-center">
      <h2 className="text-3xl font-bold text-slate-900">{t("placementTest.break.title")}</h2>
      <p className="text-slate-600">{t("placementTest.break.startsIn")}</p>
      <div className="font-mono text-7xl font-bold text-teal-600">{timeStr}</div>
      <div className="rounded-2xl bg-slate-50 p-6 text-left">
        <h3 className="mb-2 font-semibold text-slate-900">{t("placementTest.break.upNext")}</h3>
        <p className="text-slate-700">{nextSectionTitle}</p>
        <p className="text-sm text-slate-500">
          {t("placementTest.break.meta", {
            questions: nextSectionQuestions,
            timePer: nextSectionTimePer,
          })}
        </p>
      </div>

      {confirmingSkip ? (
        <div className="space-y-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-amber-900">
            {t("placementTest.break.confirm", { time: timeStr })}
          </p>
          <div className="flex gap-3">
            <button
              className="flex-1 rounded-full bg-teal-500 py-2 font-medium text-white"
              onClick={onComplete}
            >
              {t("placementTest.break.skipYes")}
            </button>
            <button
              className="rounded-full border border-slate-300 px-4 py-2"
              onClick={() => setConfirmingSkip(false)}
            >
              {t("placementTest.break.cancel")}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmingSkip(true)}
          className="rounded-full bg-slate-900 px-8 py-3 font-semibold text-white"
        >
          {t("placementTest.break.skipBtn")}
        </button>
      )}
    </div>
  );
}
