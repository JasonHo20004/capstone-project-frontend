import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  badge?: string;
}

export function SectionHeader({ title, description, badge }: SectionHeaderProps) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2">
        <h3 className="text-xl font-bold tracking-tight text-slate-900">{title}</h3>
        {badge && (
          <span className="inline-flex items-center rounded-full bg-cyan-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-cyan-700 border border-cyan-100">
            {badge}
          </span>
        )}
      </div>
      {description && (
        <p className="mt-1.5 text-sm text-slate-500">{description}</p>
      )}
    </div>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
}

export function Field({ label, hint, required, children, htmlFor }: FieldProps) {
  return (
    <div className="mb-5">
      <label
        htmlFor={htmlFor}
        className="mb-2 flex items-baseline gap-1 text-sm font-semibold text-slate-700"
      >
        {label}
        {required && <span className="text-rose-500" aria-hidden>*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

interface OptionCardProps<T> {
  value: T;
  selected: boolean;
  onSelect: (value: T) => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export function OptionCard<T extends string>({
  value,
  selected,
  onSelect,
  title,
  description,
  icon,
  disabled,
}: OptionCardProps<T>) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={() => onSelect(value)}
      className={[
        "group relative w-full text-left rounded-xl border px-4 py-3.5 transition-all",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2",
        selected
          ? "border-cyan-500 bg-cyan-50/60 shadow-sm ring-1 ring-cyan-500/30"
          : "border-slate-200 bg-white hover:border-cyan-300 hover:bg-slate-50",
        disabled && "opacity-50 cursor-not-allowed",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <span
            className={[
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              selected
                ? "bg-cyan-600 text-white"
                : "bg-slate-100 text-slate-500 group-hover:bg-cyan-100 group-hover:text-cyan-700",
            ].join(" ")}
            aria-hidden
          >
            {icon}
          </span>
        )}
        <span className="flex-1">
          <span
            className={[
              "block text-sm font-semibold",
              selected ? "text-cyan-900" : "text-slate-800",
            ].join(" ")}
          >
            {title}
          </span>
          {description && (
            <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
          )}
        </span>
        <span
          className={[
            "mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            selected
              ? "border-cyan-600 bg-cyan-600"
              : "border-slate-300 bg-white",
          ].join(" ")}
          aria-hidden
        >
          {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
        </span>
      </div>
    </button>
  );
}

interface ChipProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  ariaLabel?: string;
}

export function Chip({ selected, onClick, children, ariaLabel }: ChipProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={ariaLabel}
      onClick={onClick}
      className={[
        "rounded-full px-3.5 py-1.5 text-sm font-medium transition-all border",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2",
        selected
          ? "bg-cyan-600 text-white border-cyan-600 shadow-sm"
          : "bg-white text-slate-700 border-slate-200 hover:border-cyan-300 hover:text-cyan-700",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

interface InfoCalloutProps {
  tone?: "info" | "warning" | "success";
  title: string;
  children?: ReactNode;
}

export function InfoCallout({ tone = "info", title, children }: InfoCalloutProps) {
  const styles = {
    info: "border-cyan-200 bg-cyan-50 text-cyan-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  }[tone];

  return (
    <div
      role={tone === "warning" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 ${styles}`}
    >
      <p className="text-sm font-semibold">{title}</p>
      {children && <div className="mt-1 text-xs leading-relaxed">{children}</div>}
    </div>
  );
}

interface PreviewCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function PreviewCard({ title, description, children }: PreviewCardProps) {
  return (
    <aside
      aria-label="Personalization preview"
      className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-cyan-50/40 p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700"
          aria-hidden
        >
          <span className="material-symbols-outlined text-[18px]">tips_and_updates</span>
        </span>
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">
          {title}
        </h3>
      </div>
      {description && (
        <p className="mb-4 text-sm text-slate-600 leading-relaxed">{description}</p>
      )}
      <div className="space-y-3">{children}</div>
    </aside>
  );
}
