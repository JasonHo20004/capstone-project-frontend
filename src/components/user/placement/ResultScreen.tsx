import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import type { PlacementResult } from "@/lib/api/services/user/placement/placement.service";

const LEVEL_GRADIENTS: Record<string, string> = {
  "Pre-A1": "from-rose-500 via-orange-500 to-amber-500",
  A1: "from-orange-500 via-amber-500 to-yellow-400",
  A2: "from-amber-500 via-yellow-500 to-lime-400",
  B1: "from-lime-500 via-emerald-500 to-teal-400",
  B2: "from-emerald-500 via-teal-500 to-cyan-500",
  C1: "from-sky-500 via-blue-500 to-indigo-500",
  C2: "from-indigo-500 via-purple-500 to-fuchsia-500",
};

const COMPARISON_ROWS = [
  { cefr: "Pre-A1", ielts: "< 3.0", toeic: "0–219" },
  { cefr: "A1", ielts: "3.0", toeic: "220–344" },
  { cefr: "A2", ielts: "3.5–4.0", toeic: "345–549" },
  { cefr: "B1", ielts: "4.5–5.5", toeic: "550–784" },
  { cefr: "B2", ielts: "6.0–6.5", toeic: "785–944" },
  { cefr: "C1", ielts: "7.0–8.0", toeic: "945+" },
  { cefr: "C2", ielts: "8.5–9.0", toeic: "945+" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

function useCountUp(target: number, durationMs = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target <= 0) {
      setValue(0);
      return;
    }
    const start = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const ratio = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - ratio, 3);
      setValue(Math.round(target * eased));
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
  const { t } = useTranslation("exam");
  const level = result.cefr_level ?? "A1";
  const label = result.cefr_label ?? "";
  const totalScore = useCountUp(result.raw_score ?? 0);
  const pct = useCountUp(Math.round(result.percentage ?? 0));

  const sections = result.section_scores ?? {};
  const sec1 = sections["1"] ?? { earned: 0, max: 48 };
  const sec2 = sections["2"] ?? { earned: 0, max: 18 };
  const sec3 = sections["3"] ?? { earned: 0, max: 19 };

  const gradient = LEVEL_GRADIENTS[level] ?? "from-teal-500 to-blue-500";

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="relative text-center"
      >
        <div className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          {t("placementTest.resultScreen.yourLevel")}
        </div>
        <div className="relative mx-auto mt-5 inline-block">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
            className={`relative flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-6xl font-black text-white shadow-2xl`}
          >
            <span
              className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradient} opacity-40 blur-2xl`}
              aria-hidden="true"
            />
            <span className="relative">{level}</span>
          </motion.div>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-5 text-2xl font-semibold text-slate-900"
        >
          {label}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="mt-1 text-sm text-slate-500"
        >
          {t("placementTest.resultScreen.congrats")}
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: EASE }}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-slate-500">
            {t("placementTest.resultScreen.totalScore")}
          </span>
          <span className="font-bold text-slate-900">
            <span className="text-4xl">{totalScore}</span>
            <span className="text-xl text-slate-400"> / {result.max_score ?? 85}</span>
            <span className="ml-3 text-xl font-semibold text-teal-600">({pct}%)</span>
          </span>
        </div>

        <div className="mt-6 space-y-5">
          <SectionRow
            title={t("placementTest.resultScreen.sectionTitles.1")}
            earned={sec1.earned}
            max={sec1.max}
            delay={0.4}
          />
          <SectionRow
            title={t("placementTest.resultScreen.sectionTitles.2")}
            earned={sec2.earned}
            max={sec2.max}
            delay={0.55}
          />
          <SectionRow
            title={t("placementTest.resultScreen.sectionTitles.3")}
            earned={sec3.earned}
            max={sec3.max}
            delay={0.7}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5, ease: EASE }}
        className="rounded-3xl bg-gradient-to-br from-slate-50 to-teal-50/40 p-6"
      >
        <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
          <span className={`inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-br ${gradient}`} />
          {t("placementTest.resultScreen.aboutLevel")}
        </h3>
        <p className="leading-relaxed text-slate-700">
          {t(`placementTest.resultScreen.levelDescriptions.${level}`, {
            defaultValue: t("placementTest.resultScreen.levelDescriptions.A1"),
          })}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5, ease: EASE }}
        className="overflow-hidden rounded-3xl border border-slate-200"
      >
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-4 py-3">{t("placementTest.resultScreen.comparisonHeaders.cefr")}</th>
              <th className="px-4 py-3">{t("placementTest.resultScreen.comparisonHeaders.description")}</th>
              <th className="px-4 py-3">{t("placementTest.resultScreen.comparisonHeaders.ielts")}</th>
              <th className="px-4 py-3">{t("placementTest.resultScreen.comparisonHeaders.toeic")}</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row, i) => {
              const isMine = row.cefr === level;
              return (
                <motion.tr
                  key={row.cefr}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.04, duration: 0.3 }}
                  className={
                    isMine
                      ? "bg-teal-50 font-semibold text-teal-900"
                      : "border-t border-slate-100"
                  }
                >
                  <td className="px-4 py-3">{isMine ? `→ ${row.cefr}` : row.cefr}</td>
                  <td className="px-4 py-3">
                    {t(`placementTest.resultScreen.comparisonDescriptions.${row.cefr}`)}
                  </td>
                  <td className="px-4 py-3">{row.ielts}</td>
                  <td className="px-4 py-3">{row.toeic}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.4 }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <motion.button
          onClick={onRetake}
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.02 }}
          className="flex-1 rounded-full border-2 border-slate-300 py-3 font-semibold text-slate-800 transition hover:bg-slate-50"
        >
          {t("placementTest.resultScreen.retake")}
        </motion.button>
        <motion.button
          onClick={() => navigate("/dashboard")}
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.02 }}
          className="flex-1 rounded-full bg-teal-500 py-3 font-semibold text-white shadow transition-colors hover:bg-teal-600"
        >
          {t("placementTest.resultScreen.backToHub")}
        </motion.button>
      </motion.div>
    </div>
  );
}

function SectionRow({
  title,
  earned,
  max,
  delay = 0,
}: {
  title: string;
  earned: number;
  max: number;
  delay?: number;
}) {
  const animated = useCountUp(earned);
  const pct = max > 0 ? (earned / max) * 100 : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{title}</span>
        <span className="font-mono text-slate-700">
          {animated} / {max}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <motion.div
          className="h-full bg-gradient-to-r from-teal-500 to-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay, duration: 0.9, ease: EASE }}
        />
      </div>
    </div>
  );
}
