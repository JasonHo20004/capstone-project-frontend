import type { PlacementQuestionPayload } from "@/lib/api/services/user/placement/placement.service";
import { OptionCard } from "./OptionCard";

interface HeadingMatchRendererProps {
  question: PlacementQuestionPayload;
  selected?: "A" | "B" | "C";
  onSelect: (option: "A" | "B" | "C") => void;
}

export function HeadingMatchRenderer({ question, selected, onSelect }: HeadingMatchRendererProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-slate-50 p-6 leading-relaxed text-slate-800">
        <p className="text-[18px]">{question.passage}</p>
      </div>
      <p className="font-medium text-slate-700">{question.prompt}</p>
      <div className="space-y-3">
        {(["A", "B", "C"] as const).map((key) => (
          <OptionCard
            key={key}
            label={key}
            text={question.options?.[key] ?? ""}
            selected={selected === key}
            onSelect={() => onSelect(key)}
          />
        ))}
      </div>
    </div>
  );
}
