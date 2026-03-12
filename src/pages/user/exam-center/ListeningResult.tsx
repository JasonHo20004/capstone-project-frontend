import { Link } from "react-router-dom";

export default function ListeningResult() {
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
            <h1 className="text-2xl font-bold text-slate-900">Listening Assessment Results</h1>
            <p className="text-slate-500">Completed on Oct 24, 2023 • 10:30 AM</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">download</span>
              PDF Report
            </button>
            <Link
              to="/exam/test/listening"
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
            <span className="text-5xl font-black text-indigo-600">7.5</span>
            <span className="text-xs font-medium text-indigo-400 bg-indigo-50 px-2 py-1 rounded mt-2">Advanced</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Accuracy</span>
            <span className="text-5xl font-black text-green-500">82%</span>
            <span className="text-xs font-medium text-slate-400 mt-2">33/40 Correct</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-orange-400"></div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Time Taken</span>
            <span className="text-5xl font-black text-orange-400">28m</span>
            <span className="text-xs font-medium text-slate-400 mt-2">Avg 42s / question</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-400"></div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Percentile</span>
            <span className="text-5xl font-black text-blue-400">Top 15%</span>
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
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300"></span> Skipped
                  </div>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { id: 1, q: "What was the main topic of the lecture?", ans: "B", userAns: "B", correct: true },
                  { id: 2, q: "How many students attended the seminar?", ans: "C", userAns: "A", correct: false },
                  { id: 3, q: "What did the professor suggest?", ans: "A", userAns: "A", correct: true },
                  { id: 4, q: "Where is the library located?", ans: "D", userAns: "D", correct: true },
                  { id: 5, q: "When is the assignment due?", ans: "B", userAns: "C", correct: false },
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
              <h3 className="font-bold text-slate-800 mb-4">Performance by Section</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600">Section 1: Social Context</span>
                    <span className="text-green-600">90%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[90%] rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600">Section 2: General Topic</span>
                    <span className="text-green-500">80%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[80%] rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600">Section 3: Academic Discussion</span>
                    <span className="text-orange-500">65%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 w-[65%] rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600">Section 4: Academic Lecture</span>
                    <span className="text-red-500">50%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 w-[50%] rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
              <h3 className="font-bold text-lg mb-2 relative z-10">AI Recommendation</h3>
              <p className="text-indigo-100 text-sm mb-4 relative z-10">
                You struggled with <span className="font-bold text-white">Academic Lectures</span>. We recommend focusing on extended monologues and note-taking strategies.
              </p>
              <button className="w-full py-2 bg-white text-indigo-600 font-bold text-sm rounded-lg hover:bg-indigo-50 transition-colors relative z-10">
                Start Targeted Practice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

