import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import apiClient from "@/lib/api/config";

interface Milestone {
  id: string;
  title: string;
  description: string;
  weekNumber: number;
  skills: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  completedAt?: string;
}

interface LearningGoal {
  id: string;
  currentLevel: string;
  targetScore: string;
  deadline: string;
  roadmap: {
    milestones: Milestone[];
    weeklyHours: number;
    estimatedFinalScore: string;
    examType: string;
  };
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
};

export default function LearningPath() {
  const [step, setStep] = useState<"form" | "loading" | "result">("form");
  const [currentLevel, setCurrentLevel] = useState("A2");
  const [targetScore, setTargetScore] = useState("6.0");
  const [deadline, setDeadline] = useState("6 months");
  const [examType, setExamType] = useState("IELTS");
  const [goal, setGoal] = useState<LearningGoal | null>(null);

  const getUserId = () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.userId || payload.sub || "anonymous";
      }
    } catch { /* ignore */ }
    return "anonymous";
  };

  const handleGenerate = useCallback(async () => {
    setStep("loading");
    try {
      const resp = await apiClient.post("/ai/learning-path/generate", {
        userId: getUserId(),
        currentLevel,
        targetScore,
        deadline,
        examType,
      });
      setGoal(resp.data?.data);
      setStep("result");
    } catch (err) {
      console.error("Failed to generate learning path:", err);
      setStep("form");
    }
  }, [currentLevel, targetScore, deadline, examType]);

  // ─── Form Screen ────────────────────────────────────────────────────────────
  if (step === "form") {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold">
              <span className="material-symbols-outlined text-lg">route</span>
            </div>
            <h1 className="font-bold text-slate-800">Learning Path Generator</h1>
          </div>
          <Link to="/dashboard" className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">← Dashboard</Link>
        </header>

        <div className="max-w-lg mx-auto p-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Set Your Goal</h2>

            {/* Current Level */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-slate-600 mb-2">Current Level</label>
              <select value={currentLevel} onChange={e => setCurrentLevel(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-200">
                {["A1", "A2", "B1", "B2", "C1"].map(lv => <option key={lv} value={lv}>{lv}</option>)}
              </select>
            </div>

            {/* Exam Type */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-slate-600 mb-2">Exam Type</label>
              <div className="flex gap-3">
                <button
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all bg-cyan-600 text-white border-cyan-600"
                >
                  IELTS
                </button>
              </div>
            </div>

            {/* Target Score */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-slate-600 mb-2">Target Score</label>
              <input type="text" value={targetScore} onChange={e => setTargetScore(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-200"
                placeholder="e.g., 6.5" />
            </div>

            {/* Deadline */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-600 mb-2">Deadline</label>
              <select value={deadline} onChange={e => setDeadline(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-200">
                {["3 months", "6 months", "9 months", "12 months"].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <button onClick={handleGenerate}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3.5 rounded-xl font-bold text-lg transition-colors shadow-lg">
              Generate AI Learning Path
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Loading Screen ─────────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin mb-6 mx-auto"></div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">AI đang tạo lộ trình...</h2>
          <p className="text-slate-500">Phân tích trình độ và tạo milestone phù hợp</p>
        </div>
      </div>
    );
  }

  // ─── Result Screen ──────────────────────────────────────────────────────────
  const milestones = goal?.roadmap?.milestones || [];

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold">
            <span className="material-symbols-outlined text-lg">route</span>
          </div>
          <h1 className="font-bold text-slate-800">Your Learning Path</h1>
        </div>
        <Link to="/dashboard" className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">← Dashboard</Link>
      </header>

      <div className="max-w-3xl mx-auto p-8">
        {/* Summary Card */}
        <div className="bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
          <div className="grid grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-xs opacity-70 uppercase tracking-wider font-bold">Current</p>
              <p className="text-2xl font-black mt-1">{goal?.currentLevel}</p>
            </div>
            <div>
              <p className="text-xs opacity-70 uppercase tracking-wider font-bold">Target</p>
              <p className="text-2xl font-black mt-1">{goal?.targetScore}</p>
            </div>
            <div>
              <p className="text-xs opacity-70 uppercase tracking-wider font-bold">Deadline</p>
              <p className="text-2xl font-black mt-1">{goal?.deadline}</p>
            </div>
            <div>
              <p className="text-xs opacity-70 uppercase tracking-wider font-bold">Weekly</p>
              <p className="text-2xl font-black mt-1">{goal?.roadmap?.weeklyHours}h</p>
            </div>
          </div>
        </div>

        {/* Milestones Timeline */}
        <div className="space-y-4">
          {milestones.map((m, i) => (
            <div key={m.id} className="flex gap-4">
              {/* Timeline Line */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  m.completedAt ? "bg-green-500 text-white" : "bg-white border-2 border-slate-300 text-slate-500"
                }`}>
                  {m.completedAt ? "✓" : i + 1}
                </div>
                {i < milestones.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-1"></div>}
              </div>

              {/* Content */}
              <div className="flex-1 bg-white rounded-xl border border-slate-200 p-5 mb-2">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-slate-800">{m.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Week {m.weekNumber}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${DIFFICULTY_COLORS[m.difficulty]}`}>
                    {m.difficulty}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-3">{m.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {m.skills.map(skill => (
                    <span key={skill} className="text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded font-medium border border-cyan-100">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
