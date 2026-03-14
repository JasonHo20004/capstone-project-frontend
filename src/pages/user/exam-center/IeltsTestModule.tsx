import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import apiClient from "@/lib/api/config";

// ─── Highlight Colors ────────────────────────────────────────────────────────
const HIGHLIGHT_COLORS = [
  { name: 'Yellow', color: '#fef08a', border: '#eab308', icon: '🟡' },
  { name: 'Green', color: '#bbf7d0', border: '#22c55e', icon: '🟢' },
  { name: 'Blue', color: '#bfdbfe', border: '#3b82f6', icon: '🔵' },
  { name: 'Pink', color: '#fbcfe8', border: '#ec4899', icon: '🩷' },
];

// ─── Types (matching assessment-service API response) ────────────────────────

interface QuestionData {
  id: string;
  questionType: "MULTIPLE_CHOICE" | "GAP_FILL" | "MATCHING" | "TRUE_FALSE_NOT_GIVEN";
  questionText?: string;
  imageUrl?: string | null;
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
  imageUrl?: string | null;
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
  const passageRef = useRef<HTMLDivElement | null>(null);
  const questionsRef = useRef<HTMLDivElement | null>(null);

  // ─── Highlight State ────────────────────────────────────────────────────────
  const [highlightPopover, setHighlightPopover] = useState<{ x: number; y: number; range: Range } | null>(null);
  const [highlightMode, setHighlightMode] = useState(false);

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

  // ─── Highlight Handlers (must be before any early returns!) ──────────────
  const handleTextSelect = useCallback(() => {
    if (!highlightMode) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      setHighlightPopover(null);
      return;
    }
    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    if (!text || !(passageRef.current?.contains(range.commonAncestorContainer) || questionsRef.current?.contains(range.commonAncestorContainer))) {
      setHighlightPopover(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    setHighlightPopover({ x: rect.left + rect.width / 2, y: rect.top - 10, range: range.cloneRange() });
  }, [highlightMode]);

  const applyHighlight = useCallback((color: string) => {
    if (!highlightPopover?.range) return;
    try {
      const range = highlightPopover.range;
      const mark = document.createElement('mark');
      mark.style.backgroundColor = color;
      mark.style.borderRadius = '2px';
      mark.style.padding = '1px 0';
      mark.style.cursor = 'pointer';
      mark.dataset.highlight = 'true';
      mark.title = 'Click to remove highlight';
      mark.addEventListener('click', (e) => {
        e.stopPropagation();
        const parent = mark.parentNode;
        if (parent) {
          while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
          parent.removeChild(mark);
          parent.normalize();
        }
      });
      range.surroundContents(mark);
    } catch { /* skip if range crosses element boundaries */ }
    window.getSelection()?.removeAllRanges();
    setHighlightPopover(null);
  }, [highlightPopover]);

  const clearAllHighlights = useCallback(() => {
    if (!passageRef.current) return;
    const marks = passageRef.current.querySelectorAll('mark[data-highlight]');
    marks.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
        parent.normalize();
      }
    });
  }, []);

  // Close popover on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (highlightPopover && !(e.target as HTMLElement)?.closest?.('.highlight-popover')) {
        setHighlightPopover(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [highlightPopover]);

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
    const total = gradingResult?.score?.total ?? totalQuestions;
    const pct = gradingResult?.score?.percentage ?? (total > 0 ? Math.round((correctCount / total) * 100) : 0);
    const band = pct >= 90 ? "9.0" : pct >= 80 ? "8.0" : pct >= 70 ? "7.0" : pct >= 60 ? "6.0" : pct >= 50 ? "5.0" : pct >= 40 ? "4.0" : "3.0";
    const details: any[] = gradingResult?.details || [];

    const scoreColor = pct >= 70 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-600";
    const scoreBg = pct >= 70 ? "bg-green-50 border-green-200" : pct >= 50 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";
    const ringColor = pct >= 70 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";
    const circumference = 2 * Math.PI * 54;
    const dashOffset = circumference - (pct / 100) * circumference;

    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-6 justify-between">
          <Link to="/exam" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Exam Center
          </Link>
          <span className="text-sm font-bold text-slate-500">{testData?.title}</span>
        </header>

        <div className="max-w-5xl mx-auto p-8">
          {/* Score Summary */}
          <div className={`rounded-2xl border shadow-sm p-8 mb-8 ${scoreBg}`}>
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Score Ring */}
              <div className="relative w-36 h-36 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                  <circle cx="60" cy="60" r="54" fill="none" stroke={ringColor} strokeWidth="8"
                    strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
                    style={{ transition: "stroke-dashoffset 1s ease-in-out" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-black ${scoreColor}`}>{pct}%</span>
                  <span className="text-xs text-slate-400">Score</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Test Completed!</h2>
                <div className="flex flex-wrap items-center gap-6 justify-center md:justify-start">
                  <div>
                    <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Correct</p>
                    <p className="text-2xl font-black text-slate-800">{correctCount}<span className="text-base text-slate-400 font-medium">/{total}</span></p>
                  </div>
                  <div className="w-px h-10 bg-slate-200 hidden md:block"></div>
                  <div>
                    <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Band Score</p>
                    <p className={`text-2xl font-black ${scoreColor}`}>{band}</p>
                  </div>
                  <div className="w-px h-10 bg-slate-200 hidden md:block"></div>
                  <div>
                    <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Wrong</p>
                    <p className="text-2xl font-black text-red-600">{total - correctCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Answer Comparison Table */}
          {details.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600">fact_check</span>
                  Answer Review
                </h3>
                <p className="text-xs text-slate-400 mt-1">Compare your answers with the correct ones</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-left font-bold text-slate-500 text-xs uppercase tracking-wider w-12">Q#</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-500 text-xs uppercase tracking-wider">Question</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-500 text-xs uppercase tracking-wider w-24">Type</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-500 text-xs uppercase tracking-wider">Your Answer</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-500 text-xs uppercase tracking-wider">Correct Answer</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-500 text-xs uppercase tracking-wider w-16">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.map((d: any, i: number) => (
                      <tr key={d.questionId || i}
                        className={`border-b border-slate-100 transition-colors ${d.isCorrect ? "hover:bg-green-50/50" : "hover:bg-red-50/50"}`}>
                        <td className="px-4 py-3 font-bold text-indigo-600">{d.questionOrder || i + 1}</td>
                        <td className="px-4 py-3 text-slate-700 max-w-xs">
                          <span className="line-clamp-2">{d.questionText || `Question ${i + 1}`}</span>
                          {d.explanation && (
                            <p className="text-xs text-slate-400 mt-1 italic line-clamp-1">💡 {d.explanation}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            d.questionType === 'MULTIPLE_CHOICE' ? 'bg-blue-100 text-blue-600'
                            : d.questionType === 'TRUE_FALSE_NOT_GIVEN' ? 'bg-purple-100 text-purple-600'
                            : 'bg-orange-100 text-orange-600'
                          }`}>
                            {d.questionType === 'MULTIPLE_CHOICE' ? 'MCQ'
                              : d.questionType === 'TRUE_FALSE_NOT_GIVEN' ? 'T/F/NG'
                              : d.questionType === 'GAP_FILL' ? 'Fill'
                              : d.questionType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${d.isCorrect ? "text-green-700" : "text-red-700"}`}>
                            {d.userAnswer || "(no answer)"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-green-700">{d.correctAnswer}</td>
                        <td className="px-4 py-3 text-center">
                          {d.isCorrect ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100">
                              <span className="material-symbols-outlined text-green-600 text-[18px]">check</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100">
                              <span className="material-symbols-outlined text-red-600 text-[18px]">close</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No grading data fallback */}
          {details.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
              <p className="text-slate-600 mb-2">Your answers have been submitted.</p>
              <p className="text-sm text-slate-400">Total answered: {totalAnswered} / {total}</p>
            </div>
          )}

          {/* Back button */}
          <div className="text-center mt-8">
            <Link to="/exam" className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
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
        <div className="w-1/2 bg-white border-r border-slate-200 p-6 overflow-y-auto relative">
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

          {/* Highlight Toolbar */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isListeningTest ? "Questions Context" : "Reading Passage"}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setHighlightMode(!highlightMode); setHighlightPopover(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  highlightMode
                    ? 'bg-amber-100 text-amber-700 border border-amber-300 shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-transparent'
                }`}
                title={highlightMode ? 'Tắt highlight' : 'Bật highlight'}
              >
                <span className="material-symbols-outlined text-[16px]">ink_highlighter</span>
                {highlightMode ? 'ON' : 'Highlight'}
              </button>
              {highlightMode && (
                <button onClick={clearAllHighlights}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="Xóa tất cả highlight"
                >
                  <span className="material-symbols-outlined text-[14px]">delete_sweep</span>
                </button>
              )}
            </div>
          </div>

          {/* Highlight Mode Hint */}
          {highlightMode && (
            <div className="mb-3 flex items-center gap-3 text-[11px] text-slate-400">
              <span>Bôi đen chữ → chọn màu</span>
              <span className="text-slate-300">|</span>
              <span>Click highlight để xóa</span>
              <span className="text-slate-300">|</span>
              <div className="flex gap-1">
                {HIGHLIGHT_COLORS.map((c) => (
                  <span key={c.name} className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: c.color, border: `1px solid ${c.border}` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={passageRef} onMouseUp={handleTextSelect}
            className={`prose prose-sm text-slate-700 leading-relaxed whitespace-pre-line ${highlightMode ? 'cursor-text select-text' : ''}`}
            style={highlightMode ? { userSelect: 'text' } : undefined}
          >
            {passageContent || "No passage content available."}
          </div>

          {/* Highlight Color Popover */}
          {highlightPopover && (
            <div className="highlight-popover fixed z-50 animate-in fade-in zoom-in-95 duration-150"
              style={{ left: highlightPopover.x, top: highlightPopover.y, transform: 'translate(-50%, -100%)' }}>
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 px-2 py-1.5 flex items-center gap-1">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button key={c.name} onClick={() => applyHighlight(c.color)}
                    className="w-7 h-7 rounded-lg hover:scale-110 transition-transform flex items-center justify-center"
                    style={{ backgroundColor: c.color, border: `2px solid ${c.border}` }}
                    title={c.name}
                  />
                ))}
                <div className="w-px h-5 bg-slate-200 mx-0.5" />
                <button onClick={() => { window.getSelection()?.removeAllRanges(); setHighlightPopover(null); }}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-100 transition-colors flex items-center justify-center text-slate-400 hover:text-red-500"
                  title="Cancel"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
              {/* Arrow */}
              <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45" />
            </div>
          )}

          {/* Section Image (Maps, Diagrams) */}
          {currentSection.imageUrl && (
            <div className="mt-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Diagram / Map</h3>
              <img src={currentSection.imageUrl} alt="Section diagram" className="w-full rounded-lg border border-slate-200 shadow-sm" />
            </div>
          )}
        </div>

        {/* Right Panel: Questions */}
        <div ref={questionsRef} onMouseUp={handleTextSelect} className="w-1/2 bg-slate-50 p-6 overflow-y-auto">
          <div className="space-y-5">
            {currentQuestions.map((q) => {
              const qText = q.content?.text || q.questionText || "";
              const qOptions = q.content?.options || [];
              const qType = q.questionType;
              const qImage = q.imageUrl;

              return (
                <div key={q.id} className={`bg-white rounded-xl border p-5 transition-colors ${answers[q.id] ? "border-indigo-300 shadow-sm" : "border-slate-200"}`}>
                  <p className="font-medium text-sm text-slate-800 mb-3">
                    <span className="text-indigo-600 font-bold mr-2">Q{q.questionOrder}.</span>
                    {qText}
                  </p>

                  {/* Question Image (Maps, Diagrams) */}
                  {qImage && (
                    <div className="mb-3">
                      <img src={qImage} alt={`Question ${q.questionOrder}`} className="max-w-full rounded-lg border border-slate-200 shadow-sm" />
                    </div>
                  )}

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
