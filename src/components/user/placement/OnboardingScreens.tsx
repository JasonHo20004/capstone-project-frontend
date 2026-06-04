import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BaseScreenProps {
  onContinue: () => void;
  onBack?: () => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

function BackToHubButton({ onBack }: { onBack?: () => void }) {
  const { t } = useTranslation("exam");
  if (!onBack) return null;
  return (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {t("placementTest.backToHub")}
    </button>
  );
}

function ScreenShell({
  onBack,
  children,
}: {
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto min-h-[80vh] max-w-3xl px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <BackToHubButton onBack={onBack} />
      </div>
      {children}
    </div>
  );
}

const containerStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemRise = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

export function WelcomeScreen({
  onStart,
  onBack,
  isLoading,
  error,
}: {
  onStart: () => void;
  onBack?: () => void;
  isLoading: boolean;
  error: string | null;
}) {
  const { t } = useTranslation("exam");
  const statItems = [
    { v: t("placementTest.onboarding.welcome.stats.questionsValue"), l: t("placementTest.onboarding.welcome.stats.questionsLabel") },
    { v: t("placementTest.onboarding.welcome.stats.durationValue"), l: t("placementTest.onboarding.welcome.stats.durationLabel") },
    { v: t("placementTest.onboarding.welcome.stats.levelsValue"), l: t("placementTest.onboarding.welcome.stats.levelsLabel") },
  ];

  return (
    <ScreenShell onBack={onBack}>
      <motion.div
        variants={containerStagger}
        initial="hidden"
        animate="show"
        className="mx-auto flex max-w-2xl flex-col items-center gap-7 pt-8 text-center"
      >
        <motion.div
          variants={itemRise}
          className="relative inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-400 to-blue-500 shadow-xl"
        >
          <div className="absolute inset-0 animate-pulse rounded-3xl bg-teal-400/30 blur-2xl" />
          <svg className="relative h-12 w-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>

        <motion.div variants={itemRise} className="space-y-3">
          <h1 className="text-5xl font-bold tracking-tight text-slate-900">
            {t("placementTest.onboarding.welcome.title")}
          </h1>
          <p className="text-base font-medium text-teal-600">
            {t("placementTest.onboarding.welcome.meta")}
          </p>
        </motion.div>

        <motion.p variants={itemRise} className="max-w-xl text-base leading-relaxed text-slate-600">
          {t("placementTest.onboarding.welcome.description")}
        </motion.p>

        <motion.div variants={itemRise} className="grid w-full max-w-md grid-cols-3 gap-3 pt-2">
          {statItems.map((s) => (
            <div key={s.l} className="rounded-2xl bg-slate-50 px-3 py-4 text-center">
              <div className="text-2xl font-bold text-slate-900">{s.v}</div>
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{s.l}</div>
            </div>
          ))}
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={itemRise} className="flex w-full flex-col items-center gap-3 pt-2">
          <motion.button
            type="button"
            onClick={onStart}
            disabled={isLoading}
            whileTap={!isLoading ? { scale: 0.97 } : {}}
            whileHover={!isLoading ? { scale: 1.02 } : {}}
            className="rounded-full bg-teal-500 px-12 py-4 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t("placementTest.onboarding.welcome.preparing")}
              </span>
            ) : (
              t("placementTest.onboarding.welcome.startTest")
            )}
          </motion.button>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              {t("placementTest.onboarding.welcome.notNow")}
            </button>
          )}
        </motion.div>
      </motion.div>
    </ScreenShell>
  );
}

export function AudioCheckScreen({ onContinue, onBack }: BaseScreenProps) {
  const { t } = useTranslation("exam");
  const [tried, setTried] = useState(false);
  const [problem, setProblem] = useState(false);

  const playSample = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(
        t("placementTest.onboarding.audioCheck.ttsText")
      );
      u.lang = "en-US";
      window.speechSynthesis.speak(u);
      setTried(true);
    } else {
      setTried(true);
    }
  };

  return (
    <ScreenShell onBack={onBack}>
      <motion.div
        variants={containerStagger}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-2xl space-y-6"
      >
        <motion.div variants={itemRise}>
          <h2 className="text-3xl font-bold text-slate-900">{t("placementTest.onboarding.audioCheck.title")}</h2>
          <p className="mt-1 text-slate-600">
            {t("placementTest.onboarding.audioCheck.subtitle")}
          </p>
        </motion.div>

        <motion.div
          variants={itemRise}
          className="relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-teal-50/40 p-8"
        >
          <motion.button
            type="button"
            onClick={playSample}
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.06 }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-500 text-white shadow-lg hover:bg-teal-600"
            aria-label={t("placementTest.onboarding.audioCheck.playAria")}
          >
            <svg className="h-9 w-9" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </motion.button>

          <div className="flex h-10 items-end gap-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <motion.span
                key={i}
                className="w-1.5 rounded-full bg-teal-400/70"
                animate={tried ? { height: [10, 28, 14, 24, 12] } : { height: 12 }}
                transition={
                  tried
                    ? { duration: 0.9, repeat: Infinity, delay: i * 0.07, ease: "easeInOut" }
                    : {}
                }
                style={{ height: 12 }}
              />
            ))}
          </div>

          <p className="rounded-xl bg-white px-4 py-3 text-center text-sm text-slate-700 shadow-sm">
            "{t("placementTest.onboarding.audioCheck.sampleText")}"
          </p>
        </motion.div>

        <AnimatePresence>
          {problem && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              {t("placementTest.onboarding.audioCheck.problemHint")}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={itemRise} className="flex gap-3">
          <motion.button
            onClick={onContinue}
            disabled={!tried}
            whileTap={tried ? { scale: 0.97 } : {}}
            whileHover={tried ? { scale: 1.02 } : {}}
            className="flex-1 rounded-full bg-teal-500 py-3 font-semibold text-white shadow transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {t("placementTest.onboarding.audioCheck.canHear")} <Check size={14} className="inline" />
          </motion.button>
          <button
            onClick={() => setProblem(true)}
            className="rounded-full border-2 border-slate-300 px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {t("placementTest.onboarding.audioCheck.cantHear")}
          </button>
        </motion.div>
      </motion.div>
    </ScreenShell>
  );
}

export function BrightnessCheckScreen({ onContinue, onBack }: BaseScreenProps) {
  const { t } = useTranslation("exam");
  const [problem, setProblem] = useState(false);
  return (
    <ScreenShell onBack={onBack}>
      <motion.div
        variants={containerStagger}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-2xl space-y-6"
      >
        <motion.div variants={itemRise}>
          <h2 className="text-3xl font-bold text-slate-900">{t("placementTest.onboarding.brightnessCheck.title")}</h2>
          <p className="mt-1 text-slate-600">
            {t("placementTest.onboarding.brightnessCheck.subtitle")}
          </p>
        </motion.div>

        <motion.div
          variants={itemRise}
          className="rounded-3xl border border-slate-200 p-8"
          style={{ background: "#f3f3f3" }}
        >
          <p className="text-center text-xl" style={{ color: "#e6e6e6" }}>
            {t("placementTest.onboarding.brightnessCheck.faintText")}
          </p>
        </motion.div>

        <motion.div variants={itemRise} className="rounded-2xl bg-slate-50 p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {t("placementTest.onboarding.brightnessCheck.referenceLabel")}
          </span>
          <p className="text-base text-slate-800">
            {t("placementTest.onboarding.brightnessCheck.referenceText")}
          </p>
        </motion.div>

        <AnimatePresence>
          {problem && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              {t("placementTest.onboarding.brightnessCheck.problemHint")}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={itemRise} className="flex gap-3">
          <motion.button
            onClick={onContinue}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            className="flex-1 rounded-full bg-teal-500 py-3 font-semibold text-white shadow transition-colors hover:bg-teal-600"
          >
            {t("placementTest.onboarding.brightnessCheck.canSee")} <Check size={14} className="inline" />
          </motion.button>
          <button
            onClick={() => setProblem(true)}
            className="rounded-full border-2 border-slate-300 px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {t("placementTest.onboarding.brightnessCheck.cantSee")}
          </button>
        </motion.div>
      </motion.div>
    </ScreenShell>
  );
}

const RULE_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

export function RulesScreen({ onContinue, onBack }: BaseScreenProps) {
  const { t } = useTranslation("exam");
  const [agreed, setAgreed] = useState(false);
  return (
    <ScreenShell onBack={onBack}>
      <motion.div
        variants={containerStagger}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-2xl space-y-6"
      >
        <motion.div variants={itemRise}>
          <h2 className="text-3xl font-bold text-slate-900">{t("placementTest.onboarding.rules.title")}</h2>
          <p className="mt-1 text-slate-600">{t("placementTest.onboarding.rules.subtitle")}</p>
        </motion.div>

        <motion.ol variants={itemRise} className="space-y-2 rounded-3xl bg-slate-50 p-6">
          {RULE_KEYS.map((key, i) => (
            <motion.li
              key={key}
              variants={itemRise}
              className="flex items-start gap-3 text-slate-700"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                {i + 1}
              </span>
              <span className="leading-relaxed">{t(`placementTest.onboarding.rules.items.${key}`)}</span>
            </motion.li>
          ))}
        </motion.ol>

        <motion.div
          variants={itemRise}
          className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900"
        >
          <svg className="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{t("placementTest.onboarding.rules.warning")}</span>
        </motion.div>

        <motion.label
          variants={itemRise}
          className="flex cursor-pointer items-center gap-3 select-none rounded-2xl border-2 border-transparent p-3 transition hover:bg-slate-50"
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="h-5 w-5 rounded accent-teal-500"
          />
          <span className="text-slate-700">{t("placementTest.onboarding.rules.agree")}</span>
        </motion.label>

        <motion.button
          variants={itemRise}
          onClick={onContinue}
          disabled={!agreed}
          whileTap={agreed ? { scale: 0.98 } : {}}
          whileHover={agreed ? { scale: 1.01 } : {}}
          className="w-full rounded-full bg-teal-500 py-3 font-semibold text-white shadow transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {t("placementTest.onboarding.rules.begin")}
        </motion.button>
      </motion.div>
    </ScreenShell>
  );
}

export function CountdownScreen({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation("exam");
  const [count, setCount] = useState(3);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCount((c) => c - 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (count < 0) onComplete();
  }, [count, onComplete]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="bg-gradient-to-br from-teal-500 to-blue-500 bg-clip-text text-9xl font-black text-transparent"
        >
          {count > 0 ? count : t("placementTest.onboarding.countdown.go")}
        </motion.div>
      </AnimatePresence>
      <p className="mt-6 text-slate-500">{t("placementTest.onboarding.countdown.getReady")}</p>
    </div>
  );
}
