import { useEffect, useState } from "react";

interface ScreenProps {
  onContinue: () => void;
}

export function WelcomeScreen({
  onStart,
  isLoading,
  error,
}: {
  onStart: () => void;
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-12 text-center">
      <h1 className="text-5xl font-bold tracking-tight text-slate-900">
        English Placement Test
      </h1>
      <p className="text-lg text-teal-600 font-medium">
        50 questions · ~40 minutes · Discover your level
      </p>
      <p className="text-base leading-relaxed text-slate-600">
        This test evaluates your Grammar, Vocabulary, Reading, and Listening skills to
        determine your English proficiency level (CEFR A1–C2).
      </p>
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <button
        type="button"
        onClick={onStart}
        disabled={isLoading}
        className="rounded-full bg-teal-500 px-10 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Preparing exam…" : "Start Test"}
      </button>
    </div>
  );
}

export function AudioCheckScreen({ onContinue }: ScreenProps) {
  const [tried, setTried] = useState(false);
  const [problem, setProblem] = useState(false);

  const playSample = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(
        "Welcome to the English placement test. Please make sure you can hear this message clearly before proceeding."
      );
      u.lang = "en-US";
      window.speechSynthesis.speak(u);
      setTried(true);
    } else {
      setTried(true);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      <h2 className="text-3xl font-bold text-slate-900">Audio check</h2>
      <p className="text-slate-600">
        If you can hear the audio clearly, your sound is working properly.
      </p>
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-8">
        <button
          onClick={playSample}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-500 text-white shadow-lg hover:bg-teal-600"
          aria-label="Play sample audio"
        >
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        <div className="flex h-8 items-center gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <span
              key={i}
              className="w-1.5 rounded-full bg-teal-400/70"
              style={{ height: `${10 + (i % 3) * 8}px` }}
            />
          ))}
        </div>
        <p className="rounded-xl bg-white p-4 text-center text-sm text-slate-700">
          “Welcome to the English placement test. Please make sure you can hear this
          message clearly before proceeding.”
        </p>
      </div>
      {problem && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          Try: increase your volume, plug in headphones, or switch to a different browser.
        </div>
      )}
      <div className="flex gap-3">
        <button
          onClick={onContinue}
          disabled={!tried}
          className="flex-1 rounded-full bg-teal-500 py-3 font-semibold text-white shadow disabled:cursor-not-allowed disabled:opacity-60"
        >
          I can hear it ✓
        </button>
        <button
          onClick={() => setProblem(true)}
          className="rounded-full border-2 border-slate-300 px-6 py-3 font-medium text-slate-700"
        >
          I can't hear it
        </button>
      </div>
    </div>
  );
}

export function BrightnessCheckScreen({ onContinue }: ScreenProps) {
  const [problem, setProblem] = useState(false);
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      <h2 className="text-3xl font-bold text-slate-900">Brightness check</h2>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
        <p
          className="text-xl text-center"
          style={{ color: "#e6e6e6", background: "#f3f3f3" }}
        >
          If you can see this text clearly, your screen brightness is set correctly
          for the test.
        </p>
      </div>
      <div className="rounded-xl bg-slate-100 p-4">
        <span className="text-sm font-medium uppercase text-slate-500">Reference</span>
        <p className="text-base text-slate-800">
          If you can see this text clearly, your screen brightness is set correctly
          for the test.
        </p>
      </div>
      {problem && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          Try increasing your screen brightness in your OS or monitor settings.
        </div>
      )}
      <div className="flex gap-3">
        <button
          onClick={onContinue}
          className="flex-1 rounded-full bg-teal-500 py-3 font-semibold text-white shadow"
        >
          I can see it ✓
        </button>
        <button
          onClick={() => setProblem(true)}
          className="rounded-full border-2 border-slate-300 px-6 py-3 font-medium text-slate-700"
        >
          I can't see it
        </button>
      </div>
    </div>
  );
}

export function RulesScreen({ onContinue }: ScreenProps) {
  const [agreed, setAgreed] = useState(false);
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      <h2 className="text-3xl font-bold text-slate-900">Test rules</h2>
      <ol className="list-inside list-decimal space-y-2 rounded-2xl bg-slate-50 p-6 text-slate-700">
        <li>Total: 50 questions across 3 sections.</li>
        <li>Section 1 — Grammar &amp; Vocabulary: 27 questions, 30 seconds each.</li>
        <li>Section 2 — Reading: 11 questions, 1 minute 30 seconds each.</li>
        <li>Section 3 — Listening: 12 questions, 1 minute each.</li>
        <li>Each question auto-submits when time runs out.</li>
        <li>You cannot go back to previous questions.</li>
        <li>There is a break between each section (you can skip it).</li>
        <li>
          Your results will show your CEFR level with IELTS/TOEIC equivalents.
        </li>
      </ol>
      <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        ⚠️ Do not refresh the page during the test — your progress will be lost.
      </div>
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="h-5 w-5"
        />
        <span className="text-slate-700">I have read and agree to the test rules</span>
      </label>
      <button
        onClick={onContinue}
        disabled={!agreed}
        className="w-full rounded-full bg-teal-500 py-3 font-semibold text-white shadow disabled:cursor-not-allowed disabled:opacity-60"
      >
        Begin Test
      </button>
    </div>
  );
}

export function CountdownScreen({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    const t = window.setInterval(() => {
      setCount((c) => c - 1);
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (count < 0) onComplete();
  }, [count, onComplete]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="text-9xl font-bold text-teal-500">
        {count > 0 ? count : "Go!"}
      </div>
    </div>
  );
}
