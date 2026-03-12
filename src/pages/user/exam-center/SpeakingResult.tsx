import { Link } from "react-router-dom";

export default function SpeakingResult() {
  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-900 pb-12">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md h-16 flex items-center px-6 mb-8 sticky top-0 z-20">
        <Link to="/exam-center" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="text-sm font-medium">Back to Exam Center</span>
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Speaking Assessment Results</h1>
            <p className="text-slate-500">Completed on Oct 26, 2023 • 4:45 PM</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">download</span>
              Report
            </button>
            <Link
              to="/exam/test/speaking"
              className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-bold text-white hover:bg-indigo-500 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">mic</span>
              Practice Again
            </Link>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Scores */}
          <div className="lg:col-span-1 space-y-6">
            {/* Overall Score */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"></div>
              <div className="relative z-10 text-center">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Overall Band</span>
                <div className="text-7xl font-black text-indigo-600 my-2 tracking-tighter">7.0</div>
                <span className="px-3 py-1 bg-green-500/10 text-green-600 text-xs font-bold rounded-full border border-green-500/20">
                  Good User
                </span>
              </div>
            </div>

            {/* Criteria Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6">Score Breakdown</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-600">Fluency & Coherence</span>
                    <span className="text-indigo-600">7.5</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[75%] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.3)]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-600">Lexical Resource</span>
                    <span className="text-purple-600">7.0</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 w-[70%] rounded-full shadow-[0_0_10px_rgba(168,85,247,0.3)]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-600">Grammatical Range</span>
                    <span className="text-pink-600">6.5</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500 w-[65%] rounded-full shadow-[0_0_10px_rgba(236,72,153,0.3)]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-600">Pronunciation</span>
                    <span className="text-cyan-600">7.0</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 w-[70%] rounded-full shadow-[0_0_10px_rgba(6,182,212,0.3)]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Feedback & Audio */}
          <div className="lg:col-span-2 space-y-6">
            {/* Audio Player */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Your Recording</h3>
              <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4 border border-slate-100">
                <button className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
                  <span className="material-symbols-outlined">play_arrow</span>
                </button>
                <div className="flex-1 h-12 flex items-center gap-0.5 opacity-80">
                  {[...Array(40)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full ${i < 15 ? "bg-indigo-400" : "bg-slate-300"}`}
                      style={{ height: `${Math.max(20, Math.random() * 100)}%` }}
                    ></div>
                  ))}
                </div>
                <span className="text-xs font-mono text-slate-500">04:12</span>
              </div>
            </div>

            {/* AI Feedback */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-100">
                  <span className="material-symbols-outlined text-white text-[18px]">auto_awesome</span>
                </div>
                <h3 className="font-bold text-slate-800">AI Analysis & Feedback</h3>
              </div>

              <div className="space-y-6">
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <h4 className="font-bold text-green-700 text-sm mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Strengths
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-green-500 mt-2"></span>
                      Good use of connective markers (e.g., &quot;However&quot;, &quot;Furthermore&quot;).
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-green-500 mt-2"></span>
                      Clear pronunciation of individual sounds.
                    </li>
                  </ul>
                </div>

                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                  <h4 className="font-bold text-orange-700 text-sm mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-orange-500 mt-2"></span>
                      <span>
                        <strong>Pausing:</strong> Try to reduce hesitation when searching for vocabulary.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-orange-500 mt-2"></span>
                      <span>
                        <strong>Intonation:</strong> Use more variation in pitch to sound more natural and engaging.
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-700 text-sm mb-3">Vocabulary Suggestions</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                      <span className="line-through text-slate-400 mr-2">good</span>
                      <span className="text-indigo-600 font-bold">beneficial</span>
                    </span>
                    <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                      <span className="line-through text-slate-400 mr-2">think</span>
                      <span className="text-indigo-600 font-bold">believe</span>
                    </span>
                    <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                      <span className="line-through text-slate-400 mr-2">big</span>
                      <span className="text-indigo-600 font-bold">significant</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

