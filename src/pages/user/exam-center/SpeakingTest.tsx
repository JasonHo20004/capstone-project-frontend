import { Link } from "react-router-dom";

export default function SpeakingTest() {
  return (
    <div className="bg-[#f8fafc] h-screen flex flex-col font-sans text-slate-900 overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Header */}
      <header className="h-20 flex items-center justify-between px-8 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <Link to="/exam-center" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <span className="material-symbols-outlined">mic</span>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-slate-900">Speaking Proficiency Test</h1>
            <p className="text-xs text-slate-500">Part 2: Long Turn</p>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-slate-100 rounded-full border border-slate-200 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-mono font-bold text-slate-700">REC 00:42</span>
          </div>
          <button className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-slate-500">settings</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 p-8">
        {/* Prompt Card */}
        <div className="max-w-2xl w-full bg-white backdrop-blur-xl border border-slate-200 rounded-3xl p-8 mb-12 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-4">Topic Card</h2>
          <h3 className="text-2xl font-bold text-slate-900 mb-6 leading-tight">
            Describe a piece of technology you use often.
          </h3>
          <div className="space-y-3 text-slate-600 text-lg">
            <p className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              You should say what it is
            </p>
            <p className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              How often you use it
            </p>
            <p className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              What you use it for
            </p>
            <p className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              And explain why it is important to you
            </p>
          </div>
        </div>

        {/* Visualizer */}
        <div className="flex items-center justify-center gap-1 h-24 mb-12 w-full max-w-3xl">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-full transition-all duration-100 ease-in-out"
              style={{
                height: `${Math.max(10, Math.random() * 100)}%`,
                opacity: Math.random() * 0.5 + 0.5,
              }}
            ></div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8">
          <button className="w-14 h-14 rounded-full bg-white hover:bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 transition-all hover:scale-105 hover:text-indigo-600">
            <span className="material-symbols-outlined text-[28px]">replay</span>
          </button>

          <div className="relative group">
            <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <Link
              to="/exam/results/speaking"
              className="relative w-24 h-24 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-white text-[40px]">stop</span>
            </Link>
          </div>

          <button className="w-14 h-14 rounded-full bg-white hover:bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 transition-all hover:scale-105 hover:text-indigo-600">
            <span className="material-symbols-outlined text-[28px]">skip_next</span>
          </button>
        </div>

        <p className="mt-8 text-slate-500 text-sm font-medium">Click stop when you have finished speaking</p>
      </main>
    </div>
  );
}

