import { useEffect, useRef, useState } from "react";
import type { PlacementQuestionPayload } from "@/lib/api/services/user/placement/placement.service";

type FragmentKey = "A" | "B" | "C";

interface ReorderRendererProps {
  question: PlacementQuestionPayload;
  order?: string;
  onChange: (order: string) => void;
}

export function ReorderRenderer({ question, order, onChange }: ReorderRendererProps) {
  const initial: FragmentKey[] = (order && order.length === 3
    ? (order.split("") as FragmentKey[])
    : ["A", "B", "C"]
  );
  const [items, setItems] = useState<FragmentKey[]>(initial);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [keyboardPicked, setKeyboardPicked] = useState<number | null>(null);

  // Stable ref to the latest onChange. Avoids re-running effects when the
  // parent re-renders with a fresh inline arrow.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Sync from parent only when `order` actually changes externally. Compare
  // against current items via a functional update to keep `items` out of the
  // dependency array.
  useEffect(() => {
    if (!order || order.length !== 3) return;
    setItems((prev) =>
      order === prev.join("") ? prev : (order.split("") as FragmentKey[])
    );
  }, [order]);

  const move = (from: number, to: number) => {
    if (from === to) return;
    setItems((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(from, 1);
      copy.splice(to, 0, removed);
      onChangeRef.current(copy.join(""));
      return copy;
    });
  };

  const onKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (keyboardPicked === null) setKeyboardPicked(idx);
      else {
        move(keyboardPicked, idx);
        setKeyboardPicked(null);
      }
    } else if (e.key === "ArrowUp" && keyboardPicked !== null) {
      e.preventDefault();
      const next = Math.max(0, keyboardPicked - 1);
      move(keyboardPicked, next);
      setKeyboardPicked(next);
    } else if (e.key === "ArrowDown" && keyboardPicked !== null) {
      e.preventDefault();
      const next = Math.min(items.length - 1, keyboardPicked + 1);
      move(keyboardPicked, next);
      setKeyboardPicked(next);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm font-medium text-slate-600">{question.instruction}</p>

      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-100 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1l3 6 6 1-4.5 4.5L18 19l-6-3-6 3 1.5-6.5L3 8l6-1z" opacity=".4" />
          </svg>
          Opening paragraph
        </div>
        <p className="text-base text-slate-800">{question.fixed_fragment}</p>
      </div>

      <ul className="space-y-3" role="list" aria-live="polite">
        {items.map((key, idx) => (
          <li
            key={key}
            draggable
            tabIndex={0}
            onKeyDown={(e) => onKey(e, idx)}
            onDragStart={() => setDragIndex(idx)}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIndex(idx);
            }}
            onDragEnd={() => {
              if (dragIndex !== null && overIndex !== null) {
                move(dragIndex, overIndex);
              }
              setDragIndex(null);
              setOverIndex(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null) move(dragIndex, idx);
              setDragIndex(null);
              setOverIndex(null);
            }}
            className={[
              "flex min-h-[60px] items-start gap-4 rounded-2xl border-2 bg-white p-4 transition-all",
              "focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2",
              dragIndex === idx ? "scale-[1.02] shadow-xl opacity-70" : "shadow-sm",
              overIndex === idx && dragIndex !== null && dragIndex !== idx
                ? "border-teal-500 border-dashed"
                : "border-slate-200",
              keyboardPicked === idx ? "border-teal-500 ring-2 ring-teal-200" : "",
            ].join(" ")}
            aria-label={`Fragment ${key}, position ${idx + 1}`}
          >
            <span className="cursor-grab text-slate-400" aria-hidden="true">
              ⠿
            </span>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
              {key}
            </span>
            <span className="flex-1 text-base text-slate-800">
              {question.fragments?.[key]}
            </span>
          </li>
        ))}
      </ul>

      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Your order:{" "}
        <span className="font-mono font-semibold text-teal-700">
          {items.join(" → ")}
        </span>
      </div>
    </div>
  );
}
