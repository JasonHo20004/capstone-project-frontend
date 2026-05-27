// =============================================================================
// Skill Tree Page — Topic + Level selection → React Flow skill tree
// Sprints 1-7: saved trees, resume-first UI, localStorage cache, XP/streak,
//              gamification header, node-completion celebration
// =============================================================================

import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import apiClient from "@/lib/api/config";
import SkillTreeFlow, { type SkillTreeNodeData, NODE_THEME } from "./components/SkillTreeFlow";
import MiniQuizDialog from "./components/MiniQuizDialog";
import {
  Globe, Pizza, Briefcase, Hospital, Laptop, BookOpen, Home, Leaf,
  Map, ArrowRight, BookMarked, Flame, Heart, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  fetchUserTrees,
  patchGamification,
  calculateProgress,
  type SavedSkillTree,
} from "@/lib/api/services/user/skill-tree/skill-tree.service";

// ─── Constants ───────────────────────────────────────────────────────────────

const XP_PER_NODE = 15;

const CELEBRATION_MESSAGES = [
  "Perfect! 🎉",
  "Great work! ✨",
  "You're on fire! 🔥",
  "Brilliant! 🌟",
  "Outstanding! 💪",
];

// ─── Topic / Level Definitions ───────────────────────────────────────────────

const TOPICS: Array<{ id: string; label: string; icon: LucideIcon; description: string; color: string; popular?: boolean }> = [
  { id: "travel",      label: "Travel",       icon: Globe,     description: "Booking, directions, airports",      color: "from-blue-500 to-cyan-500",      popular: true },
  { id: "food",        label: "Food & Dining", icon: Pizza,     description: "Ordering, cooking, nutrition",        color: "from-orange-500 to-amber-500" },
  { id: "business",    label: "Business",     icon: Briefcase, description: "Email, meetings, presentations",      color: "from-slate-600 to-slate-800",    popular: true },
  { id: "health",      label: "Health",       icon: Hospital,  description: "Doctor visits, symptoms, medicine",   color: "from-emerald-500 to-green-600" },
  { id: "technology",  label: "Technology",   icon: Laptop,    description: "Internet, software, AI",              color: "from-violet-500 to-purple-600" },
  { id: "education",   label: "Education",    icon: BookOpen,  description: "School, lectures, exams",             color: "from-indigo-500 to-blue-600" },
  { id: "daily_life",  label: "Daily Life",   icon: Home,      description: "Shopping, socializing, family",       color: "from-pink-500 to-rose-500",      popular: true },
  { id: "environment", label: "Environment",  icon: Leaf,      description: "Pollution, conservation, recycling",  color: "from-teal-500 to-emerald-600" },
];

const LEVELS = [
  { id: "A1", label: "A1", description: "Beginner",     subtext: "Simple introductions & phrases",     color: "#22c55e" },
  { id: "A2", label: "A2", description: "Elementary",   subtext: "Everyday situations & routines",     color: "#84cc16" },
  { id: "B1", label: "B1", description: "Intermediate", subtext: "Travel, work & school convos",       color: "#eab308" },
  { id: "B2", label: "B2", description: "Upper-Inter",  subtext: "Opinions & detailed discussion",     color: "#f97316" },
  { id: "C1", label: "C1", description: "Advanced",     subtext: "Fluent, complex communication",      color: "#ef4444" },
  { id: "C2", label: "C2", description: "Proficiency",  subtext: "Near-native nuance & precision",     color: "#dc2626" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface SkillTreeData {
  id: string;
  nodes: any[];
  edges: any[];
}

interface LastVisitedCache {
  topic: string;
  level: string;
  treeId: string;
  updatedAt: string;
}

interface CelebrationState {
  message: string;
}

// ─── Module-level localStorage helpers ──────────────────────────────────────

function readLocalXP(): number {
  try {
    const raw = localStorage.getItem("skillXP");
    if (raw === null) return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function readLocalStreak(): number {
  try {
    const raw = localStorage.getItem("skillStreak");
    if (raw === null) return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function readLastVisitedCache(): LastVisitedCache | null {
  try {
    const raw = localStorage.getItem("lastVisitedSkillTree");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.treeId !== "string" || typeof parsed?.topic !== "string") return null;
    return parsed as LastVisitedCache;
  } catch {
    return null;
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SkillTree() {
  // ── Flow state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState<"topic" | "level" | "tree">("topic");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<SkillTreeData | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Saved trees (Sprint 1) ────────────────────────────────────────────────
  const [savedTrees, setSavedTrees] = useState<SavedSkillTree[]>([]);
  const [savedTreesLoading, setSavedTreesLoading] = useState(false);

  // ── Resume guard (Sprint 3) ───────────────────────────────────────────────
  const [resumingId, setResumingId] = useState<string | null>(null);

  // ── Last-visited highlight (Sprint 4) ────────────────────────────────────
  const [lastVisitedTreeId, setLastVisitedTreeId] = useState<string | null>(null);

  // ── Gamification (Sprint 5) ───────────────────────────────────────────────
  const [xp, setXp] = useState<number>(() => readLocalXP());
  const [streak, setStreak] = useState<number>(() => readLocalStreak());
  const [hearts] = useState<number>(3);

  // ── Celebration (Sprint 7) ────────────────────────────────────────────────
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const prefersReducedMotion = useRef(
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ).current;

  // ── Quiz / detail state ───────────────────────────────────────────────────
  const [quizNode, setQuizNode] = useState<{ id: string; data: SkillTreeNodeData } | null>(null);
  const [detailNode, setDetailNode] = useState<{ id: string; data: SkillTreeNodeData } | null>(null);

  // ─── Helpers ──────────────────────────────────────────────────────────────

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

  // ─── Mount: fetch saved trees + validate localStorage cache (Sprints 1 & 4) ──

  useEffect(() => {
    const userId = getUserId();
    if (userId === "anonymous") return;

    let cancelled = false;
    setSavedTreesLoading(true);

    const cache = readLastVisitedCache();

    // Sprint 9: load gamification from server and merge with localStorage
    apiClient.get("/users/profile").then((res) => {
      if (cancelled) return;
      const profile = res.data?.data;
      if (profile) {
        const serverXP = typeof profile.xp === "number" ? profile.xp : 0;
        const serverStreak = typeof profile.streak === "number" ? profile.streak : 0;
        setXp((local) => Math.max(local, serverXP));
        setStreak(serverStreak);
        if (serverXP > readLocalXP()) localStorage.setItem("skillXP", String(serverXP));
        if (serverStreak > 0) localStorage.setItem("skillStreak", String(serverStreak));
      }
    }).catch(() => { /* keep localStorage values on network error */ });

    fetchUserTrees(userId)
      .then((trees) => {
        if (cancelled) return;
        setSavedTrees(trees);

        // Sprint 4: validate cache against authoritative server list
        if (cache) {
          const serverHasTree = trees.some((t) => t.id === cache.treeId);
          if (serverHasTree) {
            setLastVisitedTreeId(cache.treeId);
          } else {
            localStorage.removeItem("lastVisitedSkillTree");
          }
        }
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to load saved skill trees:", err);
      })
      .finally(() => {
        if (!cancelled) setSavedTreesLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(celebrationTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Node click → detail panel ────────────────────────────────────────────

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

  // ─── New topic flow ────────────────────────────────────────────────────────

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
        setTreeData({ id: data.id, nodes: data.nodes || [], edges: data.edges || [] });
        setStep("tree");
      }
    } catch (err) {
      console.error("Failed to generate skill tree:", err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Resume flow (Sprint 3) ───────────────────────────────────────────────

  const handleResumeTree = async (savedTree: SavedSkillTree) => {
    if (resumingId) return;
    setResumingId(savedTree.id);
    setSelectedTopic(savedTree.topic);
    setSelectedLevel(savedTree.level);
    try {
      const resp = await apiClient.post("/ai/skill-tree/generate", {
        userId: getUserId(),
        topic: savedTree.topic,
        level: savedTree.level,
        nodeLimit: 8,
      });
      const data = resp.data?.data;
      if (data) {
        setTreeData({ id: data.id, nodes: data.nodes || [], edges: data.edges || [] });
        localStorage.setItem(
          "lastVisitedSkillTree",
          JSON.stringify({
            topic: savedTree.topic,
            level: savedTree.level,
            treeId: data.id,
            updatedAt: new Date().toISOString(),
          })
        );
        setLastVisitedTreeId(data.id);
        setStep("tree");
      }
    } catch (err) {
      console.error("Failed to resume skill tree:", err);
    } finally {
      setResumingId(null);
    }
  };

  // ─── Quiz complete → XP + celebration + tree update (Sprints 5 & 7) ───────

  const handleQuizComplete = useCallback(
    async (wrongAnswers: any[]) => {
      if (!treeData || !quizNode || !selectedTopic || !selectedLevel) return;

      try {
        if (wrongAnswers.length === 0) {
          // Sprint 5: award XP
          const newXp = xp + XP_PER_NODE;
          setXp(newXp);
          localStorage.setItem("skillXP", String(newXp));
          // Sprint 9: sync to backend; keep localStorage on failure
          patchGamification({ xp: newXp, streak, lastActiveDate: new Date().toISOString() }).catch(() => {});

          // Sprint 7: show celebration
          if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
          setCelebration({
            message: CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)],
          });
          const dismissDelay = prefersReducedMotion ? 2500 : 1600;
          celebrationTimerRef.current = setTimeout(() => setCelebration(null), dismissDelay);

          // Complete node on server
          const resp = await apiClient.post(`/ai/skill-tree/${getUserId()}/complete-node`, {
            topic: selectedTopic,
            level: selectedLevel,
            nodeId: quizNode.id,
          });
          const updated = resp.data?.data;
          if (updated) {
            setTreeData({ id: updated.id, nodes: updated.nodes || [], edges: updated.edges || [] });
          }
        } else {
          // Wrong answers → branch tree
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [treeData, quizNode, selectedTopic, selectedLevel, xp]
  );

  // ─── Derived ──────────────────────────────────────────────────────────────

  const topicInfo = TOPICS.find((t) => t.id === selectedTopic);
  const levelInfo  = LEVELS.find((l) => l.id === selectedLevel);

  // ═══════════════════════════════════════════════════════════════════════════
  // TOPIC SCREEN  (Sprints 2, 3, 4)
  // ═══════════════════════════════════════════════════════════════════════════

  if (step === "topic") {
    // Sort: lastVisited first, then by updatedAt desc
    const sortedTrees = [...savedTrees].sort((a, b) => {
      if (a.id === lastVisitedTreeId) return -1;
      if (b.id === lastVisitedTreeId) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    const hasResumable = !savedTreesLoading && sortedTrees.length > 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 font-sans">
        <header className="bg-white/80 backdrop-blur border-b border-slate-200 h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white">
              <Map size={18} />
            </div>
            <h1 className="font-bold text-slate-800 text-lg">Learning Map</h1>
          </div>
          <Link to="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            ← Back
          </Link>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-12">

          {/* ── Continue Your Journey ─────────────────────────────────────── */}
          {hasResumable && (
            <div className="mb-12">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-800 mb-1">Continue Your Journey</h2>
                <p className="text-slate-500 text-sm">Pick up where you left off</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedTrees.map((tree) => {
                  const progress  = calculateProgress(tree.nodes);
                  const tInfo     = TOPICS.find((t) => t.id === tree.topic);
                  const lInfo     = LEVELS.find((l) => l.id === tree.level);
                  const isResuming   = resumingId === tree.id;
                  const isLastVisited = tree.id === lastVisitedTreeId;

                  return (
                    <button
                      key={tree.id}
                      onClick={() => handleResumeTree(tree)}
                      disabled={!!resumingId}
                      className={`group relative bg-white rounded-2xl border-2 p-5 text-left transition-all duration-300
                        ${isResuming
                          ? "border-indigo-400 shadow-lg shadow-indigo-100"
                          : "border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100 hover:-translate-y-0.5"
                        }
                        ${resumingId && !isResuming ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {/* Topic color stripe */}
                      <div
                        className={`absolute top-0 left-0 right-0 h-1 rounded-t-[14px] bg-gradient-to-r ${tInfo?.color ?? "from-indigo-500 to-purple-500"}`}
                      />

                      <div className="pt-2">
                        {/* Header row */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {tInfo && <tInfo.icon size={16} className="text-slate-500 shrink-0" />}
                            <span className="font-bold text-slate-800 text-sm truncate">
                              {tInfo?.label ?? tree.topic}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 ml-2 shrink-0">
                            {/* Sprint 4: last-visited badge */}
                            {isLastVisited && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded-full">
                                Last visited
                              </span>
                            )}
                            <span
                              className="text-[10px] font-black px-2 py-0.5 rounded-md text-white"
                              style={{ backgroundColor: lInfo?.color ?? "#6366f1" }}
                            >
                              {tree.level}
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mb-2.5">
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${progress.percentage}%`,
                                background: progress.percentage === 100
                                  ? "linear-gradient(90deg,#34d399,#10b981)"
                                  : "linear-gradient(90deg,#818cf8,#6366f1)",
                              }}
                            />
                          </div>
                        </div>

                        {/* Stats + CTA */}
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 font-medium tabular-nums">
                            {progress.completed}/{progress.total} · {progress.percentage}%
                          </span>
                          {isResuming ? (
                            <span className="flex items-center gap-1.5 text-[11px] text-indigo-500 font-semibold">
                              <span className="inline-block w-3 h-3 border border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                              Loading…
                            </span>
                          ) : (
                            <span className="text-[11px] text-indigo-500 font-semibold group-hover:text-indigo-700 transition-colors">
                              Tap to resume →
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Start a New Topic ────────────────────────────────────────── */}
          <div>
            <div className={`mb-6 ${hasResumable ? "" : "text-center"}`}>
              {hasResumable ? (
                <>
                  <h2 className="text-2xl font-black text-slate-800 mb-1">Start a New Topic</h2>
                  <p className="text-slate-500 text-sm">Each topic mixes grammar, vocabulary and listening</p>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-black text-slate-800 mb-3">Choose a Topic</h2>
                  <p className="text-slate-500 text-lg">Each topic mixes grammar, vocabulary and listening</p>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => { setSelectedTopic(topic.id); setStep("level"); }}
                  className="group relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${topic.color} opacity-90 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative text-white">
                    {topic.popular && (
                      <span className="absolute -top-1 -right-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-white/20 rounded-full">
                        Popular
                      </span>
                    )}
                    <topic.icon size={28} className="mb-3 text-white/90" />
                    <h3 className="font-bold text-base mb-1">{topic.label}</h3>
                    <p className="text-xs opacity-80 leading-relaxed">{topic.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL SCREEN  (unchanged)
  // ═══════════════════════════════════════════════════════════════════════════

  if (step === "level") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 font-sans">
        <header className="bg-white/80 backdrop-blur border-b border-slate-200 h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white">
              <Map size={18} />
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
              {topicInfo && <topicInfo.icon size={18} />}
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
                <div className="text-2xl font-black mb-0.5" style={{ color: level.color }}>
                  {level.label}
                </div>
                <div className="text-[10px] text-slate-600 font-semibold leading-tight">{level.description}</div>
                <div className="text-[8px] text-slate-400 mt-1 leading-snug">{level.subtext}</div>
              </button>
            ))}
          </div>

          <div className="text-center mb-4">
            <Link
              to="/placement-test"
              className="text-sm text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
            >
              Not sure? Take a quick placement test →
            </Link>
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
                <><ArrowRight size={16} className="mr-1.5" />Start Learning</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TREE SCREEN  (Sprints 6 & 7: gamification header + celebration)
  // ═══════════════════════════════════════════════════════════════════════════

  const completedCount = treeData?.nodes.filter((n: any) => n.status === "completed").length || 0;
  const totalNodes     = treeData?.nodes.length || 1;
  const progressPct    = Math.round((completedCount / totalNodes) * 100);

  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 font-sans">

      {/* ── Sprint 6: Gamification header ─────────────────────────────── */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center justify-between gap-2 mb-2">

          {/* Topic info */}
          <div className="flex items-center gap-2 min-w-0 shrink">
            {topicInfo && <topicInfo.icon size={16} className="text-slate-300 shrink-0" />}
            <div className="min-w-0">
              <div className="font-bold text-white text-sm leading-tight truncate">{topicInfo?.label}</div>
              <div className="text-[10px] text-slate-500">Level {levelInfo?.label}</div>
            </div>
          </div>

          {/* Gamification stats */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="flex items-center gap-1 text-orange-400">
              <Flame size={13} />
              <span className="text-xs font-bold tabular-nums">{streak}</span>
            </span>
            <span className="text-slate-700 text-xs">·</span>
            <span className="flex items-center gap-1 text-rose-400">
              <Heart size={12} fill="currentColor" />
              <span className="text-xs font-bold tabular-nums">{hearts}</span>
            </span>
            <span className="text-slate-700 text-xs">·</span>
            <span className="flex items-center gap-1 text-amber-400">
              <Zap size={12} fill="currentColor" />
              <span className="text-xs font-bold tabular-nums">{xp}</span>
            </span>
          </div>

          {/* Level badge + change */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-black text-white"
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
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progressPct}%`,
                background: progressPct === 100
                  ? "linear-gradient(90deg,#34d399,#10b981)"
                  : "linear-gradient(90deg,#818cf8,#6366f1)",
              }}
            />
          </div>
          <span className="text-[10px] font-bold text-slate-500 tabular-nums shrink-0">
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

      {/* Node Detail Panel */}
      {detailNode && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center"
          onClick={() => setDetailNode(null)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md mx-4 mb-0 rounded-t-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            <div
              className="h-1 w-full"
              style={{
                background: `linear-gradient(90deg, ${NODE_THEME[detailNode.data.type]?.bg || "#3b82f6"}, ${NODE_THEME[detailNode.data.type]?.bgDark || "#2563eb"})`,
              }}
            />
            <div className="bg-slate-900 p-6">
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-5" />
              <div className="flex items-start gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${NODE_THEME[detailNode.data.type]?.bg || "#3b82f6"}, ${NODE_THEME[detailNode.data.type]?.bgDark || "#2563eb"})`,
                  }}
                >
                  {(() => {
                    const IconComp = NODE_THEME[detailNode.data.type]?.icon || BookMarked;
                    return <IconComp size={28} className="text-white" />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-lg leading-tight">{detailNode.data.label}</h3>
                  {detailNode.data.description && (
                    <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{detailNode.data.description}</p>
                  )}
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {detailNode.data.mixedSkills.map((skill) => {
                      const skillColors: Record<string, string> = {
                        grammar:    "bg-blue-500/20 text-blue-300 border-blue-500/30",
                        vocabulary: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                        listening:  "bg-amber-500/20 text-amber-300 border-amber-500/30",
                      };
                      return (
                        <span
                          key={skill}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${skillColors[skill] || "bg-slate-700 text-slate-300 border-slate-600"}`}
                        >
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              <button
                onClick={startQuizFromDetail}
                className="w-full mt-6 py-4 rounded-2xl font-bold text-base text-white shadow-xl active:scale-[0.97] transition-all relative overflow-hidden group"
                style={{
                  background: `linear-gradient(135deg, ${NODE_THEME[detailNode.data.type]?.bg || "#3b82f6"}, ${NODE_THEME[detailNode.data.type]?.bgDark || "#2563eb"})`,
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-xl">🎮</span>
                  Start Quiz
                </span>
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

      {/* ── Sprint 7: Node-completion celebration ─────────────────────── */}
      {celebration && (
        <div
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {prefersReducedMotion ? (
            // Accessible static message for reduced-motion users
            <div className="bg-slate-800/95 border border-slate-700 text-white px-8 py-5 rounded-2xl text-center shadow-2xl">
              <div className="text-3xl font-black text-amber-400">+{XP_PER_NODE} XP</div>
              <div className="text-base font-semibold text-slate-200 mt-1">{celebration.message}</div>
            </div>
          ) : (
            // Animated floating celebration
            <div className="skill-xp-pop text-center select-none">
              <div className="text-5xl font-black text-amber-400 drop-shadow-[0_0_16px_rgba(251,191,36,0.6)]">
                +{XP_PER_NODE} XP
              </div>
              <div className="text-xl font-bold text-white drop-shadow-lg mt-1.5">
                {celebration.message}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes xpPop {
          0%   { transform: scale(0.4) translateY(0);    opacity: 0; }
          30%  { transform: scale(1.15) translateY(-12px); opacity: 1; }
          60%  { transform: scale(1) translateY(-20px);  opacity: 1; }
          100% { transform: scale(0.9) translateY(-80px); opacity: 0; }
        }
        .skill-xp-pop {
          animation: xpPop 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}
