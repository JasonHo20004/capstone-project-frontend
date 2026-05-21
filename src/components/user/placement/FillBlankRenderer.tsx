import type { PlacementQuestionPayload } from "@/lib/api/services/user/placement/placement.service";
import { OptionCard } from "./OptionCard";

interface FillBlankRendererProps {
  question: PlacementQuestionPayload;
  selected?: "A" | "B" | "C";
  onSelect: (option: "A" | "B" | "C") => void;
}

export function FillBlankRenderer({ question, selected, onSelect }: FillBlankRendererProps) {
  const promptParts = question.prompt.split("___");

  return (
    <div className="space-y-6">
      {question.context && (
        <p className="italic text-slate-500">{question.context}</p>
      )}
      <p className="text-xl leading-relaxed text-slate-800">
        {promptParts.map((part, i) => (
          <span key={i}>
            {part}
            {i < promptParts.length - 1 && (
              <span className="mx-1 inline-block min-w-[80px] border-b-2 border-teal-500 px-2 font-semibold text-teal-700">
                {selected ? question.options?.[selected] ?? "" : "   "}
              </span>
            )}
          </span>
        ))}
      </p>
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
