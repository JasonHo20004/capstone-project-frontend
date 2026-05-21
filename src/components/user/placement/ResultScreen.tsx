import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { PlacementResult } from "@/lib/api/services/user/placement/placement.service";

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  "Pre-A1":
    "You are just starting your English journey. You can recognize a few familiar words and simple phrases. Focus on building basic vocabulary and simple sentence patterns.",
  A1: "You can understand and use familiar everyday expressions and very basic phrases. You can introduce yourself and ask simple personal questions.",
  A2: "You can communicate in simple, routine tasks. You can describe your background, immediate environment, and matters of immediate need in simple terms.",
  B1: "You can deal with most situations likely to arise while travelling. You can produce simple connected text on familiar topics and briefly give reasons and explanations for opinions and plans.",
  B2: "You can interact with a degree of fluency and spontaneity with native speakers. You can produce clear, detailed text on a wide range of subjects and explain a viewpoint on a topical issue.",
  C1: "You can express yourself fluently and spontaneously without much obvious searching for expressions. You can use language flexibly and effectively for social, academic, and professional purposes.",
  C2: "You can understand with ease virtually everything heard or read. You can express yourself spontaneously, very fluently, and precisely, differentiating finer shades of meaning even in complex situations.",
};

const LEVEL_COLORS: Record<string, string> = {
  "Pre-A1": "from-red-500 to-orange-500",
  A1: "from-orange-500 to-amber-500",
  A2: "from-amber-500 to-yellow-500",
  B1: "from-yellow-500 to-lime-500",
  B2: "from-emerald-500 to-teal-500",
  C1: "from-blue-500 to-indigo-500",
  C2: "from-indigo-500 to-purple-500",
};

const COMPARISON_ROWS = [
  { cefr: "Pre-A1", desc: "Beginner", ielts: "< 3.0", toeic: "0–219" },
  { cefr: "A1", desc: "Elementary", ielts: "3.0", toeic: "220–344" },
  { cefr: "A2", desc: "Pre-Intermediate", ielts: "3.5–4.0", toeic: "345–549" },
  { cefr: "B1", desc: "Intermediate", ielts: "4.5–5.5", toeic: "550–784" },
  { cefr: "B2", desc: "Upper-Intermediate", ielts: "6.0–6.5", toeic: "785–944" },
  { cefr: "C1", desc: "Advanced", ielts: "7.0–8.0", toeic: "945+" },
  { cefr: "C2", desc: "Proficiency", ielts: "8.5–9.0", toeic: "945+" },
];

function useCountUp(target: number, durationMs = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const ratio = Math.min(1, elapsed / durationMs);
      setValue(Math.round(target * ratio));
      if (ratio >= 1) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, [target, durationMs]);
  return value;
}

interface ResultScreenProps {
  result: PlacementResult;
  onRetake: () => void;
}

export function ResultScreen({ result, onRetake }: ResultScreenProps) {
  const navigate = useNavigate();
  const level = result.cefr_level ?? "A1";
  const label = result.cefr_label ?? "";
  const totalScore = useCountUp(result.raw_score ?? 0);
  const pct = useCountUp(Math.round(result.percentage ?? 0));

  const sections = result.section_scores ?? {};
  const sec1 = sections["1"] ?? { earned: 0, max: 48 };
  const sec2 = sections["2"] ?? { earned: 0, max: 18 };
  const sec3 = sections["3"] ?? { earned: 0, max: 19 };

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-6 py-12">
      <div className="text-center">
        <div className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          Your level
        </div>
        <div
          className={`mx-auto mt-4 inline-flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br ${LEVEL_COLORS[level] ?? "from-teal-500 to-blue-500"} text-5xl font-bold text-white shadow-2xl`}
        >
          {level}
        </div>
        <p className="mt-4 text-2xl font-semibold text-slate-900">{label}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 p-6">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm font-medium text-slate-500">Total score</span>
          <span className="text-4xl font-bold text-slate-900">
            {totalScore} / {result.max_score ?? 85}
            <span className="ml-3 text-xl text-teal-600">({pct}%)</span>
          </span>
        </div>

        <div className="mt-6 space-y-4">
          <SectionRow title="Section 1 — Grammar & Vocabulary" earned={sec1.earned} max={sec1.max} />
          <SectionRow title="Section 2 — Reading" earned={sec2.earned} max={sec2.max} />
          <SectionRow title="Section 3 — Listening" earned={sec3.earned} max={sec3.max} />
        </div>
      </div>

      <div className="rounded-2xl bg-slate-50 p-6">
        <h3 className="mb-2 font-semibold text-slate-900">About your level</h3>
        <p className="text-slate-700 leading-relaxed">
          {LEVEL_DESCRIPTIONS[level]}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-4 py-3">CEFR</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">IELTS</th>
              <th className="px-4 py-3">TOEIC</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => {
              const isMine = row.cefr === level;
              return (
                <tr
                  key={row.cefr}
                  className={isMine ? "bg-teal-50 font-semibold text-teal-900" : ""}
                >
                  <td className="px-4 py-3">
                    {isMine ? `→ ${row.cefr}` : row.cefr}
                  </td>
                  <td className="px-4 py-3">{row.desc}</td>
                  <td className="px-4 py-3">{row.ielts}</td>
                  <td className="px-4 py-3">{row.toeic}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onRetake}
          className="flex-1 rounded-full border-2 border-slate-300 py-3 font-semibold text-slate-800 hover:bg-slate-50"
        >
          Retake Test
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex-1 rounded-full bg-teal-500 py-3 font-semibold text-white shadow hover:bg-teal-600"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

function SectionRow({ title, earned, max }: { title: string; earned: number; max: number }) {
  const animated = useCountUp(earned);
  const pct = (earned / max) * 100;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{title}</span>
        <span className="font-mono text-slate-700">
          {animated} / {max}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-blue-500 transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
