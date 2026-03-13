import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import apiClient from "@/lib/api/config";

// ─── Types (matching assessment-service API response) ────────────────────────

interface QuestionData {
  id: string;
  questionType: "MULTIPLE_CHOICE" | "GAP_FILL" | "MATCHING" | "TRUE_FALSE_NOT_GIVEN";
  questionText?: string;
  content?: {
    text?: string;
    options?: string[];
  };
  questionOrder: number;
  explanation?: string;
}

interface PassageData {
  id: string;
  content: string;
  passageOrder: number;
}

interface SectionData {
  id: string;
  title: string;
  skill?: string;
  mediaUrl?: string | null;
  orderIndex?: number;
  passages: PassageData[];
  questions: QuestionData[];
}

interface TestData {
  id: string;
  title: string;
  slug?: string;
  status: string;
  durationInMinutes: number | null;
  testSkills?: { skill: string }[];
  sections: SectionData[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function IeltsTestModule() {
  const { testId } = useParams<{ testId: string }>();
  const [testData, setTestData] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [gradingResult, setGradingResult] = useState<any>(null);

  // Audio refs for listening sections
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ─── Fetch test data by slug/ID ────────────────────────────────────────────
  useEffect(() => {
    const fetchTest = async () => {
      if (!testId) {
        setError("No test ID provided.");
        setLoading(false);
        return;
      }

      try {
        const resp = await apiClient.get(`/tests/${testId}`);
        const test = resp.data?.data;

        if (!test) {
          setError("Test not found.");
          setLoading(false);
          return;
        }

        setTestData(test);
        setTimeLeft((test.durationInMinutes || 60) * 60);
        setLoading(false);
      } catch (err: any) {
        console.error("Failed to fetch test:", err);
        setError(err.response?.data?.message || "Failed to load test. Please try again.");
        setLoading(false);
      }
    };

    fetchTest();
  }, [testId]);

  // ─── Derived data ──────────────────────────────────────────────────────────
  const sections = testData?.sections || [];
  const currentSection = sections[currentSectionIdx];
  const allQuestions = sections.flatMap(s => s.questions);
  const isListeningTest = sections.some(s => s.mediaUrl);
  const testSkillLabel = isListeningTest ? "Listening" : "Reading";

  // ─── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!testData || submitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [testData, timeLeft, submitted]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ─── Answer Handling ────────────────────────────────────────────────────────
  const setAnswer = useCallback((qId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  }, []);

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!testData) return;
    try {
      const resp = await apiClient.post(`/tests/${testData.id}/submit`, { submissions: answers });
      setGradingResult(resp.data?.data);
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
  }, [testData, answers]);

  // ─── Navigation ─────────────────────────────────────────────────────────────
  const goNext = () => {
    if (currentSectionIdx < sections.length - 1) setCurrentSectionIdx(prev => prev + 1);
  };
  const goPrev = () => {
    if (currentSectionIdx > 0) setCurrentSectionIdx(prev => prev - 1);
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6 mx-auto"></div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Loading IELTS Test...</h2>
          <p className="text-slate-500">Fetching test data from server</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 max-w-md text-center">
          <span className="material-symbols-outlined text-red-500 text-5xl mb-4 block">error</span>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link to="/exam" className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
            Back to Exam Center
          </Link>
        </div>
      </div>
    );
  }

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const currentQuestions = currentSection?.questions || [];
  const answeredCount = currentQuestions.filter(q => answers[q.id]?.trim()).length;
  const totalAnswered = allQuestions.filter(q => answers[q.id]?.trim()).length;

  // ─── Result Screen ─────────────────────────────────────────────────────────
  if (submitted) {
    const totalQuestions = allQuestions.length;
    const correctCount = gradingResult?.score?.correct ?? 0;
    const pct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const band = pct >= 90 ? "9.0" : pct >= 80 ? "8.0" : pct >= 70 ? "7.0" : pct >= 60 ? "6.0" : pct >= 50 ? "5.0" : pct >= 40 ? "4.0" : "3.0";

    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-6 justify-between">
          <Link to="/exam" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">← Back to Exam Center</Link>
          <span className="text-sm font-bold text-slate-500">{testData?.title}</span>
        </header>
        <div className="max-w-3xl mx-auto p-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Test Completed!</h2>
            {gradingResult ? (
              <>
                <div className={`text-7xl font-black mb-2 ${pct >= 70 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-600"}`}>{pct}%</div>
                <p className="text-slate-600 mb-1">{correctCount} / {totalQuestions} correct</p>
                <p className="text-lg font-bold text-indigo-600 mb-6">Estimated Band Score: {band}</p>
                {gradingResult.details && (
                  <div className="mt-6 text-left space-y-2">
                    {gradingResult.details.map((d: any, i: number) => (
                      <div key={i} className={`p-3 rounded-lg border ${d.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                        <p className="text-sm font-medium">
                          <span className="text-indigo-600 font-bold mr-2">Q{d.questionOrder || i + 1}.</span> {d.questionText || `Question ${i + 1}`}
                        </p>
                        <p className="text-xs mt-1">
                          Your answer: <span className={`font-bold ${d.isCorrect ? "text-green-700" : "text-red-700"}`}>{d.userAnswer || "(no answer)"}</span>
                          {!d.isCorrect && d.correctAnswer && (
                            <span className="text-green-700 ml-2">Correct: <span className="font-bold">{d.correctAnswer}</span></span>
                          )}
                        </p>
                        {d.explanation && <p className="text-xs text-slate-500 mt-1 italic">{d.explanation}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-slate-600 mb-6">
                <p className="mb-2">Your answers have been submitted.</p>
                <p className="text-sm text-slate-400">Total answered: {totalAnswered} / {totalQuestions}</p>
              </div>
            )}
            <Link to="/exam" className="inline-block mt-6 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
              Back to Exam Center
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!currentSection) return null;

  const passageContent = currentSection.passages?.[0]?.content || "";

  // ─── Test Screen ───────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] font-sans text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-indigo-600">{isListeningTest ? "headphones" : "menu_book"}</span>
          <h1 className="font-bold text-slate-800 text-sm">{testData?.title}</h1>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-500">{currentSection.title}</span>
          <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${isListeningTest ? "bg-teal-100 text-teal-700" : "bg-indigo-100 text-indigo-700"}`}>
            {testSkillLabel}
          </span>
          <span className="text-xs text-slate-400 ml-2">{answeredCount}/{currentQuestions.length} answered</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500">
            Section {currentSectionIdx + 1} / {sections.length}
          </span>
          <span className="text-xs text-slate-400">
            Total: {totalAnswered}/{allQuestions.length}
          </span>
          <div className={`px-3 py-1 rounded-md font-mono font-bold text-sm ${timeLeft < 60 ? "bg-red-100 text-red-700 animate-pulse" : timeLeft < 120 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
            {formatTime(timeLeft)}
          </div>
          {currentSectionIdx > 0 && (
            <button onClick={goPrev} className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-300 cursor-pointer">
              ← Prev
            </button>
          )}
          {currentSectionIdx < sections.length - 1 ? (
            <button onClick={goNext} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-700 cursor-pointer">
              Next Section →
            </button>
          ) : (
            <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-green-700 cursor-pointer">
              Submit All
            </button>
          )}
        </div>
      </header>

      {/* Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Passage / Audio */}
        <div className="w-1/2 bg-white border-r border-slate-200 p-6 overflow-y-auto">
          {/* Audio Player for Listening */}
          {currentSection.mediaUrl && (
            <div className="mb-6 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-teal-600 text-xl">headphones</span>
                <h3 className="text-sm font-bold text-teal-800">{currentSection.title} — Audio</h3>
              </div>
              <audio
                ref={audioRef}
                controls
                className="w-full h-10"
                src={currentSection.mediaUrl}
                preload="auto"
              >
                Your browser does not support audio.
              </audio>
              <p className="text-xs text-teal-600 mt-2">
                💡 Tip: You can only listen to the audio once in a real IELTS test.
              </p>
            </div>
          )}

          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            {isListeningTest ? "Questions Context" : "Reading Passage"}
          </h3>
          <div className="prose prose-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {passageContent || "No passage content available."}
          </div>
        </div>

        {/* Right Panel: Questions */}
        <div className="w-1/2 bg-slate-50 p-6 overflow-y-auto">
          <div className="space-y-5">
            {currentQuestions.map((q) => {
              const qText = q.content?.text || q.questionText || "";
              const qOptions = q.content?.options || [];
              const qType = q.questionType;

              return (
                <div key={q.id} className={`bg-white rounded-xl border p-5 transition-colors ${answers[q.id] ? "border-indigo-300 shadow-sm" : "border-slate-200"}`}>
                  <p className="font-medium text-sm text-slate-800 mb-3">
                    <span className="text-indigo-600 font-bold mr-2">Q{q.questionOrder}.</span>
                    {qText}
                  </p>

                  {qType === "MULTIPLE_CHOICE" && qOptions.length > 0 && (
                    <div className="space-y-2">
                      {qOptions.map((opt, idx) => (
                        <label key={idx} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          answers[q.id] === opt ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-200"
                        }`}>
                          <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt}
                            onChange={() => setAnswer(q.id, opt)} className="accent-indigo-600" />
                          <span className="text-sm text-slate-700">
                            <span className="font-bold text-indigo-600 mr-1">{String.fromCharCode(65 + idx)}.</span> {opt}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {qType === "GAP_FILL" && (
                    <input type="text" value={answers[q.id] || ""} onChange={e => setAnswer(q.id, e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                      placeholder="Type your answer..." />
                  )}

                  {qType === "TRUE_FALSE_NOT_GIVEN" && (
                    <div className="flex gap-3">
                      {["TRUE", "FALSE", "NOT GIVEN"].map(opt => (
                        <button key={opt} onClick={() => setAnswer(q.id, opt)}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-all cursor-pointer ${
                            answers[q.id] === opt ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                          }`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {qType === "MATCHING" && (
                    <input type="text" value={answers[q.id] || ""} onChange={e => setAnswer(q.id, e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                      placeholder="Type your answer (e.g., A, B, C)..." />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
