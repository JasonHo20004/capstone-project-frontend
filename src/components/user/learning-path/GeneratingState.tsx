import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const STEP_IDS = [1, 2, 3, 4, 5, 6] as const;

export default function GeneratingState() {
  const { t } = useTranslation("exam");
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIdx((idx) => Math.min(idx + 1, STEP_IDS.length));
    }, 550);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="mb-6 flex items-center gap-3">
          <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white">
            <span className="material-symbols-outlined text-[26px] animate-pulse">
              auto_awesome
            </span>
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {t("learningPath.generating.title")}
            </h2>
            <p className="text-sm text-slate-500">
              {t("learningPath.generating.subtitle")}
            </p>
          </div>
        </div>

        <ol className="space-y-2">
          {STEP_IDS.map((id, idx) => {
            const done = idx < stepIdx;
            const active = idx === stepIdx;
            const label = t(`learningPath.generating.steps.${id}`);
            return (
              <li
                key={id}
                className={[
                  "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all",
                  done
                    ? "border-emerald-100 bg-emerald-50/60"
                    : active
                    ? "border-cyan-200 bg-cyan-50/70"
                    : "border-slate-100 bg-slate-50/60",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors",
                    done
                      ? "bg-emerald-500 text-white"
                      : active
                      ? "bg-cyan-600 text-white"
                      : "bg-white text-slate-400 border border-slate-200",
                  ].join(" ")}
                  aria-hidden
                >
                  {done ? (
                    <Check size={14} />
                  ) : active ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <span className="text-[11px] font-bold">{idx + 1}</span>
                  )}
                </span>
                <span
                  className={[
                    "text-sm font-medium",
                    done
                      ? "text-emerald-800"
                      : active
                      ? "text-cyan-800"
                      : "text-slate-500",
                  ].join(" ")}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-6 space-y-2">
          <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
