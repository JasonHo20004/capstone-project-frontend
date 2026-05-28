import { Check } from "lucide-react";
import type { WizardStep } from "./types";

const STEPS: Array<{ id: WizardStep; label: string; hint: string }> = [
  { id: 1, label: "Level", hint: "Placement baseline" },
  { id: 2, label: "Goal", hint: "Exam & deadline" },
  { id: 3, label: "Schedule", hint: "Weekly availability" },
  { id: 4, label: "Preferences", hint: "Personalization" },
];

interface StepperProps {
  current: WizardStep;
  onJump?: (step: WizardStep) => void;
}

export default function Stepper({ current, onJump }: StepperProps) {
  return (
    <nav
      aria-label="Learning path wizard steps"
      className="w-full rounded-2xl border border-slate-200 bg-white/80 backdrop-blur px-4 py-3 sm:px-6 sm:py-4"
    >
      <ol className="flex flex-wrap items-center gap-y-3 gap-x-2 sm:gap-x-4">
        {STEPS.map((step, idx) => {
          const isDone = step.id < current;
          const isActive = step.id === current;
          const reachable = step.id <= current;

          return (
            <li key={step.id} className="flex items-center gap-2 sm:gap-3 flex-1 min-w-[140px]">
              <button
                type="button"
                disabled={!onJump || !reachable}
                onClick={() => onJump && reachable && onJump(step.id)}
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
                  {isDone ? <Check size={16} aria-hidden /> : step.id}
                </span>
                <span className="flex flex-col">
                  <span
                    className={[
                      "text-sm font-semibold leading-tight",
                      isActive ? "text-cyan-800" : "text-slate-800",
                    ].join(" ")}
                  >
                    {step.label}
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    {step.hint}
                  </span>
                </span>
              </button>
              {idx < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={[
                    "hidden sm:block h-px flex-1",
                    step.id < current ? "bg-emerald-300" : "bg-slate-200",
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
