import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { WizardStep } from "./types";

const STEP_IDS: WizardStep[] = [1, 2, 3, 4];

interface StepperProps {
  current: WizardStep;
  onJump?: (step: WizardStep) => void;
}

export default function Stepper({ current, onJump }: StepperProps) {
  const { t } = useTranslation("exam");
  return (
    <nav
      aria-label={t("learningPath.stepper.ariaLabel")}
      className="w-full rounded-2xl border border-slate-200 bg-white/80 backdrop-blur px-4 py-3 sm:px-6 sm:py-4"
    >
      <ol className="flex flex-wrap items-center gap-y-3 gap-x-2 sm:gap-x-4">
        {STEP_IDS.map((id, idx) => {
          const isDone = id < current;
          const isActive = id === current;
          const reachable = id <= current;
          const label = t(`learningPath.stepper.items.${id}.label`);
          const hint = t(`learningPath.stepper.items.${id}.hint`);

          return (
            <li key={id} className="flex items-center gap-2 sm:gap-3 flex-1 min-w-[140px]">
              <button
                type="button"
                disabled={!onJump || !reachable}
                onClick={() => onJump && reachable && onJump(id)}
                aria-current={isActive ? "step" : undefined}
                className={[
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-all w-full",
                  isActive
                    ? "bg-cyan-50 ring-2 ring-cyan-500/40"
                    : isDone
                    ? "hover:bg-slate-50"
                    : "opacity-70",
                  reachable && onJump ? "cursor-pointer" : "cursor-default",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isActive
                      ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/30"
                      : "bg-slate-100 text-slate-500",
                  ].join(" ")}
                >
                  {isDone ? <Check size={16} aria-hidden /> : id}
                </span>
                <span className="flex flex-col">
                  <span
                    className={[
                      "text-sm font-semibold leading-tight",
                      isActive ? "text-cyan-800" : "text-slate-800",
                    ].join(" ")}
                  >
                    {label}
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    {hint}
                  </span>
                </span>
              </button>
              {idx < STEP_IDS.length - 1 && (
                <span
                  aria-hidden
                  className={[
                    "hidden sm:block h-px flex-1",
                    id < current ? "bg-emerald-300" : "bg-slate-200",
                  ].join(" ")}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
