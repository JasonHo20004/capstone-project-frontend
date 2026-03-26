// =============================================================================
// Skill Tree Page — Topic + Level selection → React Flow skill tree
// =============================================================================

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import apiClient from "@/lib/api/config";
import SkillTreeFlow, { type SkillTreeNodeData, NODE_THEME } from "./components/SkillTreeFlow";
import MiniQuizDialog from "./components/MiniQuizDialog";

// ─── Topic Definitions ──────────────────────────────────────────────────────────

const TOPICS = [
  { id: "travel", label: "Travel", icon: "🌍", description: "Booking, directions, airports", color: "from-blue-500 to-cyan-500" },
  { id: "food", label: "Food & Dining", icon: "🍕", description: "Ordering, cooking, nutrition", color: "from-orange-500 to-amber-500" },
  { id: "business", label: "Business", icon: "💼", description: "Email, meetings, presentations", color: "from-slate-600 to-slate-800" },
  { id: "health", label: "Health", icon: "🏥", description: "Doctor visits, symptoms, medicine", color: "from-emerald-500 to-green-600" },
  { id: "technology", label: "Technology", icon: "💻", description: "Internet, software, AI", color: "from-violet-500 to-purple-600" },
  { id: "education", label: "Education", icon: "📚", description: "School, lectures, exams", color: "from-indigo-500 to-blue-600" },
  { id: "daily_life", label: "Daily Life", icon: "🏠", description: "Shopping, socializing, family", color: "from-pink-500 to-rose-500" },
  { id: "environment", label: "Environment", icon: "🌿", description: "Pollution, conservation, recycling", color: "from-teal-500 to-emerald-600" },
];

const LEVELS = [
  { id: "A1", label: "A1", description: "Beginner", color: "#22c55e" },
  { id: "A2", label: "A2", description: "Elementary", color: "#84cc16" },
  { id: "B1", label: "B1", description: "Intermediate", color: "#eab308" },
  { id: "B2", label: "B2", description: "Upper-Inter", color: "#f97316" },
  { id: "C1", label: "C1", description: "Advanced", color: "#ef4444" },
  { id: "C2", label: "C2", description: "Proficiency", color: "#dc2626" },
];

// ─── Types ──────────────────────────────────────────────────────────────────────

interface SkillTreeData {
  id: string;
  nodes: any[];
  edges: any[];
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function SkillTree() {
  const [step, setStep] = useState<"topic" | "level" | "tree">("topic");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<SkillTreeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [quizNode, setQuizNode] = useState<{
    id: string;
    data: SkillTreeNodeData;
  } | null>(null);
  const [detailNode, setDetailNode] = useState<{
    id: string;
    data: SkillTreeNodeData;
  } | null>(null);

  const handleNodeClick = useCallback(
    (nodeId: string, nodeData: SkillTreeNodeData) => {
      if (nodeData.status === "completed" || nodeData.status === "locked") return;
      setDetailNode({ id: nodeId, data: nodeData });
    },
    []
  );

  const startQuizFromDetail = useCallback(() => {
    if (detailNode) {
      setQuizNode(detailNode);
      setDetailNode(null);
    }
  }, [detailNode]);

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

  // Generate or fetch tree
  const startLearning = async () => {
    if (!selectedTopic || !selectedLevel) return;
    setLoading(true);
    try {
      const resp = await apiClient.post("/ai/skill-tree/generate", {
        userId: getUserId(),
        topic: selectedTopic,
        level: selectedLevel,
        nodeLimit: 8,
      });
      const data = resp.data?.data;
      if (data) {
        setTreeData({
          id: data.id,
          nodes: data.nodes || [],
          edges: data.edges || [],
        });
        setStep("tree");
      }
    } catch (err) {
      console.error("Failed to generate skill tree:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle quiz complete → advance or branch
  const handleQuizComplete = useCallback(
    async (wrongAnswers: any[]) => {
      if (!treeData || !quizNode || !selectedTopic || !selectedLevel) return;

      try {
        if (wrongAnswers.length === 0) {
          // All correct → complete this node & activate next
          const resp = await apiClient.post(`/ai/skill-tree/${getUserId()}/complete-node`, {
            topic: selectedTopic,
            level: selectedLevel,
            nodeId: quizNode.id,
          });

          const updated = resp.data?.data;
          if (updated) {
            setTreeData({
              id: updated.id,
              nodes: updated.nodes || [],
              edges: updated.edges || [],
            });
          }
        } else {
          // Wrong answers → branch tree (insert remedial nodes)
          const resp = await apiClient.post(`/ai/skill-tree/${getUserId()}/branch`, {
            topic: selectedTopic,
            level: selectedLevel,
            parentNodeId: quizNode.id,
            wrongAnswers,
          });

          const result = resp.data?.data;
          if (result?.skillTree) {
            setTreeData({
              id: result.skillTree.id,
              nodes: result.skillTree.nodes || [],
              edges: result.skillTree.edges || [],
            });
          }
        }
      } catch (err) {
        console.error("Failed to update tree after quiz:", err);
      }
    },
    [treeData, quizNode, selectedTopic, selectedLevel]
  );

  const topicInfo = TOPICS.find((t) => t.id === selectedTopic);
  const levelInfo = LEVELS.find((l) => l.id === selectedLevel);

  // ─── Topic Selection ────────────────────────────────────────────────────────

  if (step === "topic") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 font-sans">
        <header className="bg-white/80 backdrop-blur border-b border-slate-200 h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg">
              🗺️
            </div>
            <h1 className="font-bold text-slate-800 text-lg">Learning Map</h1>
          </div>
          <Link to="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            ← Back
          </Link>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-800 mb-3">Choose a Topic</h2>
            <p className="text-slate-500 text-lg">Each topic mixes grammar, vocabulary and listening</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => {
                  setSelectedTopic(topic.id);
                  setStep("level");
                }}
                className="group relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${topic.color} opacity-90 group-hover:opacity-100 transition-opacity`} />
                <div className="relative text-white">
                  <span className="text-3xl mb-3 block">{topic.icon}</span>
                  <h3 className="font-bold text-base mb-1">{topic.label}</h3>
                  <p className="text-xs opacity-80 leading-relaxed">{topic.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Level Selection ────────────────────────────────────────────────────────

  if (step === "level") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 font-sans">
        <header className="bg-white/80 backdrop-blur border-b border-slate-200 h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg">
              🗺️
            </div>
            <h1 className="font-bold text-slate-800 text-lg">Learning Map</h1>
          </div>
          <button
            onClick={() => setStep("topic")}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Change topic
          </button>
        </header>

        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full shadow-sm border border-slate-200 mb-4">
              <span className="text-lg">{topicInfo?.icon}</span>
              <span className="font-bold text-slate-700">{topicInfo?.label}</span>
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-3">Select Level</h2>
            <p className="text-slate-500">Standard CEFR scale</p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-10">
            {LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                className={`rounded-2xl p-4 text-center transition-all duration-300 hover:scale-105 border-2 ${
                  selectedLevel === level.id
                    ? "border-indigo-500 shadow-lg shadow-indigo-500/20 bg-white"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div
                  className="text-2xl font-black mb-1"
                  style={{ color: level.color }}
                >
                  {level.label}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">{level.description}</div>
              </button>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={startLearning}
              disabled={!selectedLevel || loading}
              className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 disabled:opacity-50 transition-all duration-300 hover:scale-105"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI is building your path...
                </span>
              ) : (
                "🚀 Start Learning"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Skill Tree View ────────────────────────────────────────────────────────

  const completedCount = treeData?.nodes.filter((n: any) => n.status === "completed").length || 0;
  const totalNodes = treeData?.nodes.length || 1;
  const progressPct = Math.round((completedCount / totalNodes) * 100);

  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 font-sans">
      {/* Header with progress */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 px-5 py-3 sticky top-0 z-30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-xl">{topicInfo?.icon}</span>
            <div>
              <h1 className="font-bold text-white text-sm leading-tight">{topicInfo?.label}</h1>
              <span className="text-[10px] text-slate-400">Level {levelInfo?.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className="px-2.5 py-1 rounded-lg text-[11px] font-black text-white"
              style={{ backgroundColor: levelInfo?.color }}
            >
              {levelInfo?.label}
            </span>
            <button
              onClick={() => {
                setStep("topic");
                setTreeData(null);
                setSelectedTopic(null);
                setSelectedLevel(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Change
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progressPct}%`,
                background: progressPct === 100
                  ? "linear-gradient(90deg, #34d399, #10b981)"
                  : "linear-gradient(90deg, #818cf8, #6366f1)",
              }}
            />
          </div>
          <span className="text-[11px] font-bold text-slate-400 tabular-nums shrink-0">
            {completedCount}/{totalNodes}
          </span>
        </div>
      </header>

      {/* Tower Canvas */}
      <div className="flex justify-center pt-4 pb-6">
        {treeData && (
          <SkillTreeFlow
            nodes={treeData.nodes}
            edges={treeData.edges}
            onNodeClick={handleNodeClick}
          />
        )}
      </div>

      {/* Node Detail Panel (slide up) */}
      {detailNode && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center"
          onClick={() => setDetailNode(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className="relative w-full max-w-md mx-4 mb-0 rounded-t-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            {/* Top gradient accent */}
            <div
              className="h-1 w-full"
              style={{
                background: `linear-gradient(90deg, ${
                  NODE_THEME[detailNode.data.type]?.bg || "#3b82f6"
                }, ${NODE_THEME[detailNode.data.type]?.bgDark || "#2563eb"})`,
              }}
            />

            <div className="bg-slate-900 p-6">
              {/* Handle bar */}
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-5" />

              {/* Node info */}
              <div className="flex items-start gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-3xl shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${
                      NODE_THEME[detailNode.data.type]?.bg || "#3b82f6"
                    }, ${NODE_THEME[detailNode.data.type]?.bgDark || "#2563eb"})`,
                  }}
                >
                  {NODE_THEME[detailNode.data.type]?.icon || "📘"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-lg leading-tight">
                    {detailNode.data.label}
                  </h3>
                  {detailNode.data.description && (
                    <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                      {detailNode.data.description}
                    </p>
                  )}
                  {/* Skill tags */}
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {detailNode.data.mixedSkills.map((skill) => {
                      const skillColors: Record<string, string> = {
                        grammar: "bg-blue-500/20 text-blue-300 border-blue-500/30",
                        vocabulary: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                        listening: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                      };
                      return (
                        <span
                          key={skill}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                            skillColors[skill] || "bg-slate-700 text-slate-300 border-slate-600"
                          }`}
                        >
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Start Quiz Button */}
              <button
                onClick={startQuizFromDetail}
                className="w-full mt-6 py-4 rounded-2xl font-bold text-base text-white shadow-xl active:scale-[0.97] transition-all relative overflow-hidden group"
                style={{
                  background: `linear-gradient(135deg, ${
                    NODE_THEME[detailNode.data.type]?.bg || "#3b82f6"
                  }, ${NODE_THEME[detailNode.data.type]?.bgDark || "#2563eb"})`,
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-xl">🎮</span>
                  Start Quiz
                </span>
                {/* Hover shine */}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mini Quiz Dialog */}
      {quizNode && treeData && (
        <MiniQuizDialog
          open={!!quizNode}
          onClose={() => setQuizNode(null)}
          nodeId={quizNode.id}
          nodeLabel={quizNode.data.label}
          nodeDescription={quizNode.data.description}
          skillTreeId={treeData.id}
          topic={selectedTopic!}
          level={selectedLevel!}
          mixedSkills={quizNode.data.mixedSkills}
          questionTypes={quizNode.data.questionTypes}
          userId={getUserId()}
          onQuizComplete={handleQuizComplete}
        />
      )}

      {/* Animations */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
