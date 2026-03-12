import { Link, useLocation, useParams } from "react-router-dom";
import type { PracticeGradingResult } from "@/lib/api/services/user/practice/practice.service";

export default function PracticeResult() {
  const { testId } = useParams<{ testId: string }>();
  const location = useLocation();
  const result = (location.state as { result?: PracticeGradingResult } | null)?.result;

  if (!result) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-700">
          No result data found. Please re-submit the test.
          <div className="mt-4">
            <Link to={testId ? `/practice/${testId}` : "/practice"} className="text-indigo-600 font-bold">
              Go back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-900 pb-12">
      <header className="bg-white border-b border-slate-200 h-16 flex items-center px-6 mb-8">
        <Link to="/practice" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="text-sm font-medium">Back to Practice Tests</span>
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Practice Result</h1>
            <p className="text-slate-500">Auto grading summary</p>
          </div>
          {testId ? (
            <Link
              to={`/practice/${testId}`}
              className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-bold text-white hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">replay</span>
              Retake
            </Link>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Score</span>
            <span className="text-5xl font-black text-indigo-600">{result.score}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Correct</span>
            <span className="text-5xl font-black text-green-500">{result.correctAnswers}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-400"></div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total</span>
            <span className="text-5xl font-black text-blue-400">{result.totalQuestions}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-orange-400"></div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Percentage</span>
            <span className="text-5xl font-black text-orange-400">{Math.round(result.percentage)}%</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Answer Review</h3>
            <div className="text-xs text-slate-500">{result.details.length} items</div>
          </div>
          <div className="divide-y divide-slate-100">
            {result.details.slice(0, 25).map((d, idx) => (
              <div key={d.questionId} className="p-4 flex gap-4 items-start">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                    d.isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-500">
                    Question ID: <span className="font-mono">{d.questionId}</span>
                  </div>
                  <div className="mt-2 text-xs">
                    <span className="text-slate-500">Your answer:</span>{" "}
                    <span className="font-semibold text-slate-800">{String(d.userAnswer ?? "")}</span>
                  </div>
                  <div className="mt-1 text-xs">
                    <span className="text-slate-500">Correct answer:</span>{" "}
                    <span className="font-semibold text-slate-800">{String(d.correctAnswer ?? "")}</span>
                  </div>
                  {d.explanation ? (
                    <div className="mt-2 text-xs text-slate-600">{d.explanation}</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          {result.details.length > 25 ? (
            <div className="p-4 border-t border-slate-100 text-center text-xs text-slate-500">
              Showing first 25 items.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

