interface ProgressBarProps {
  sectionTitle: string;
  sectionIndex: number;
  questionInSection: number;
  sectionTotal: number;
  globalIndex: number;
  globalTotal: number;
}

export function ProgressBar({
  sectionTitle,
  questionInSection,
  sectionTotal,
  globalIndex,
  globalTotal,
}: ProgressBarProps) {
  const pct = ((globalIndex + 1) / globalTotal) * 100;
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold uppercase tracking-wide text-slate-600">
          {sectionTitle}
        </span>
        <span className="text-slate-500">
          {questionInSection + 1} / {sectionTotal} · Q{globalIndex + 1} / {globalTotal}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-blue-500 transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
