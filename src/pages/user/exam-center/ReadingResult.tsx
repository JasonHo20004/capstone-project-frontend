import { Link } from "react-router-dom";

export default function ReadingResult() {
  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center px-6 mb-8">
        <Link to="/exam-center" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="text-sm font-medium">Back to Exam Center</span>
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reading Assessment Results</h1>
            <p className="text-slate-500">Completed on Oct 25, 2023 • 2:15 PM</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">download</span>
              PDF Report
            </button>
            <Link
              to="/exam/test/reading"
              className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-bold text-white hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">replay</span>
              Retake Test
            </Link>
          </div>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Band Score</span>
            <span className="text-5xl font-black text-indigo-600">8.0</span>
            <span className="text-xs font-medium text-indigo-400 bg-indigo-50 px-2 py-1 rounded mt-2">Expert</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Accuracy</span>
            <span className="text-5xl font-black text-green-500">88%</span>
            <span className="text-xs font-medium text-slate-400 mt-2">35/40 Correct</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-orange-400"></div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Time Taken</span>
            <span className="text-5xl font-black text-orange-400">52m</span>
            <span className="text-xs font-medium text-slate-400 mt-2">Avg 78s / question</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-400"></div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Percentile</span>
            <span className="text-5xl font-black text-blue-400">Top 8%</span>
            <span className="text-xs font-medium text-slate-400 mt-2">Among all test takers</span>
          </div>
        </div>

        {/* Detailed Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Review */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Question Review</h3>
                <div className="flex gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Correct
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Incorrect
                  </div>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { id: 1, q: "The main purpose of the passage is to...", ans: "C", userAns: "C", correct: true },
                  { id: 2, q: "The author implies that...", ans: "A", userAns: "A", correct: true },
                  { id: 3, q: "Which of the following is NOT mentioned?", ans: "D", userAns: "B", correct: false },
                  { id: 4, q: "The word 'ubiquitous' in paragraph 3 is closest in meaning to...", ans: "B", userAns: "B", correct: true },
                  { id: 5, q: "According to the graph, the trend shows...", ans: "A", userAns: "A", correct: true },
                ].map((item) => (
                  <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex gap-4">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${item.correct ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                    >
                      {item.id}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800 mb-2">{item.q}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-slate-500">
                          Correct Answer: <span className="font-bold text-slate-700">{item.ans}</span>
                        </span>
                        <span className={`${item.correct ? "text-green-600" : "text-red-500"}`}>
                          Your Answer: <span className="font-bold">{item.userAns}</span>
                        </span>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-slate-100 text-center">
                <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                  View All 40 Questions
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Insights */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-4">Skill Breakdown</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600">Skimming & Scanning</span>
                    <span className="text-green-600">95%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[95%] rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600">Vocabulary in Context</span>
                    <span className="text-green-500">85%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[85%] rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600">Inference</span>
                    <span className="text-orange-500">70%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 w-[70%] rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-4">Time Management</h3>
              <div className="flex items-end gap-2 h-32 mb-2">
                <div className="flex-1 bg-indigo-100 rounded-t-lg relative group">
                  <div
                    className="absolute bottom-0 w-full bg-indigo-500 rounded-t-lg transition-all"
                    style={{ height: "40%" }}
                  ></div>
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none">
                    15m
                  </div>
                </div>
                <div className="flex-1 bg-indigo-100 rounded-t-lg relative group">
                  <div
                    className="absolute bottom-0 w-full bg-indigo-500 rounded-t-lg transition-all"
                    style={{ height: "60%" }}
                  ></div>
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none">
                    22m
                  </div>
                </div>
                <div className="flex-1 bg-indigo-100 rounded-t-lg relative group">
                  <div
                    className="absolute bottom-0 w-full bg-indigo-500 rounded-t-lg transition-all"
                    style={{ height: "35%" }}
                  ></div>
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none">
                    15m
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Passage 1</span>
                <span>Passage 2</span>
                <span>Passage 3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

