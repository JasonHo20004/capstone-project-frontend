interface OptionCardProps {
  label: "A" | "B" | "C";
  text: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export function OptionCard({ label, text, selected, disabled, onSelect }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={[
        "group flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all",
        "focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2",
        selected
          ? "border-teal-500 bg-teal-50 shadow-md scale-[1.01]"
          : "border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold",
          selected ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-700",
        ].join(" ")}
      >
        {label}
      </span>
      <span className="pt-1 text-base text-slate-800">{text}</span>
    </button>
  );
}
