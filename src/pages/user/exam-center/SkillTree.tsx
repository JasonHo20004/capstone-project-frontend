// =============================================================================
// Skill Tree Page — Topic + Level selection → React Flow skill tree
// Sprints 1-7: saved trees, resume-first UI, localStorage cache, XP/streak,
//              gamification header, node-completion celebration
// =============================================================================

import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import apiClient from "@/lib/api/config";
import SkillTreeFlow, { type SkillTreeNodeData, NODE_THEME } from "./components/SkillTreeFlow";
import MiniQuizDialog from "./components/MiniQuizDialog";
import { playNodeComplete, playTreeComplete } from "./components/skill-sounds";
import {
  Globe, Pizza, Briefcase, Hospital, Laptop, BookOpen, Home, Leaf,
  Map, ArrowRight, BookMarked, Flame, Zap, Sparkles, ChevronRight, ChevronLeft,
  CheckCircle2,
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

// Celebration messages are resolved at runtime via t(`skillTree.celebrationMessages.${n}`)
const CELEBRATION_MESSAGE_COUNT = 5;

// ─── Topic / Level Definitions ───────────────────────────────────────────────
// User-facing label/description/subtext live in i18n (skillTree.topics / .levels);
// these constants hold only ids, icons, colors and gameplay metadata.

interface TopicDef {
  id: string;
  icon: LucideIcon;
  color: string;
  popular?: boolean;
  nodeCount: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

const TOPICS: TopicDef[] = [
  { id: "travel",      icon: Globe,     color: "from-blue-500 to-cyan-500",      popular: true, nodeCount: 24, difficulty: 2 },
  { id: "food",        icon: Pizza,     color: "from-orange-500 to-amber-500",                  nodeCount: 20, difficulty: 2 },
  { id: "business",    icon: Briefcase, color: "from-slate-600 to-slate-800",    popular: true, nodeCount: 32, difficulty: 4 },
  { id: "health",      icon: Hospital,  color: "from-emerald-500 to-green-600",                 nodeCount: 22, difficulty: 3 },
  { id: "technology",  icon: Laptop,    color: "from-violet-500 to-purple-600",                 nodeCount: 28, difficulty: 4 },
  { id: "education",   icon: BookOpen,  color: "from-indigo-500 to-blue-600",                   nodeCount: 26, difficulty: 3 },
  { id: "daily_life",  icon: Home,      color: "from-pink-500 to-rose-500",      popular: true, nodeCount: 18, difficulty: 1 },
  { id: "environment", icon: Leaf,      color: "from-teal-500 to-emerald-600",                  nodeCount: 24, difficulty: 3 },
];

const LEVELS = [
  { id: "A1", label: "A1", color: "#22c55e" },
  { id: "A2", label: "A2", color: "#84cc16" },
  { id: "B1", label: "B1", color: "#eab308" },
  { id: "B2", label: "B2", color: "#f97316" },
  { id: "C1", label: "C1", color: "#ef4444" },
  { id: "C2", label: "C2", color: "#dc2626" },
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

// ─── Count-up number ─────────────────────────────────────────────────────────
// Animates the XP figure in the header so a reward visibly "lands" instead of
// the number silently jumping.

function CountUpNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;
    if (from === to) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(to);
      return;
    }
    const dur = 600;
    const t0 = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display}</>;
}

// ─── AI-generation waiting overlay ───────────────────────────────────────────
// Tree generation is an LLM call (~10-20s). A bare button spinner reads as
// "frozen"; this overlay shows a fake-but-honest stepper so the wait feels
// purposeful. Steps advance on a timer and the last one holds until the
// request actually resolves (the overlay unmounts).

function GeneratingOverlay() {
  const { t } = useTranslation("exam");
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStepIdx((i) => Math.min(i + 1, 3)), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="status" aria-live="polite">
      <div className="absolute inset-0 bg-slate-950/60" style={{ backdropFilter: "blur(6px)" }} />
      <div className="relative bg-white rounded-3xl shadow-2xl px-8 py-8 w-[min(92vw,380px)] text-center">
        <div className="text-5xl mb-3 select-none animate-bounce motion-reduce:animate-none">🐧</div>
        <h3 className="text-lg font-black text-slate-900 mb-1">{t("skillTree.generating.title")}</h3>
        <p className="text-xs text-slate-500 mb-5">{t("skillTree.generating.hint")}</p>
        <div className="space-y-2.5 text-left">
          {[1, 2, 3, 4].map((n, i) => (
            <div
              key={n}
              className={`flex items-center gap-2.5 text-sm transition-opacity duration-300 ${i <= stepIdx ? "opacity-100" : "opacity-35"}`}
            >
              {i < stepIdx ? (
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              ) : i === stepIdx ? (
                <span className="inline-block w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin shrink-0" />
              ) : (
                <span className="inline-block w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />
              )}
              <span className={i === stepIdx ? "font-semibold text-slate-800" : "text-slate-500"}>
                {t(`skillTree.generating.steps.${n}`)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SkillTree() {
  const { t } = useTranslation("exam");

  // i18n label resolvers for module-level topic/level definitions
  const topicLabel = (id: string) => t(`skillTree.topics.${id}.label`);
  const topicDesc = (id: string) => t(`skillTree.topics.${id}.description`);

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
  // (Hearts were removed: they rendered a static ❤️×3 that never changed —
  // a fake mechanic. Re-add only together with a real lives system.)
  const [xp, setXp] = useState<number>(() => readLocalXP());
  const [streak, setStreak] = useState<number>(() => readLocalStreak());

  // ── Full-tree completion moment ───────────────────────────────────────────
  const [treeComplete, setTreeComplete] = useState(false);
  const prevPctRef = useRef(0);
  const lastTreeIdRef = useRef<string | null>(null);

  // ── Topic carousel (desktop arrows) ───────────────────────────────────────
  const carouselRef = useRef<HTMLDivElement>(null);

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

  // ─── Full-tree completion detection ───────────────────────────────────────
  // Fires only on the TRANSITION to 100% within a session — a tree that loads
  // already complete (resume) sets the baseline without celebrating again.

  useEffect(() => {
    if (!treeData) {
      lastTreeIdRef.current = null;
      return;
    }
    const total = treeData.nodes.length || 1;
    const done = treeData.nodes.filter((n: any) => n.status === "completed").length;
    const pct = Math.round((done / total) * 100);
    if (lastTreeIdRef.current !== treeData.id) {
      lastTreeIdRef.current = treeData.id;
      prevPctRef.current = pct;
      return;
    }
    if (prevPctRef.current < 100 && pct === 100 && total > 1) {
      setTreeComplete(true);
      playTreeComplete();
    }
    prevPctRef.current = pct;
  }, [treeData]);

  // ─── Node click → detail panel ────────────────────────────────────────────

  const handleNodeClick = useCallback(
    (nodeId: string, nodeData: SkillTreeNodeData) => {
      // Locked clicks are handled (shake + hint) inside SkillTreeFlow.
      // Completed nodes open as a REVIEW: replayable quiz, no XP.
      if (nodeData.status === "locked") return;
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
      // Surface the failure — a silently dying spinner reads as a frozen app.
      toast.error(t("skillTree.errors.generateFailed"));
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
      toast.error(t("skillTree.errors.generateFailed"));
    } finally {
      setResumingId(null);
    }
  };

  // ─── Quiz complete → XP + celebration + tree update (Sprints 5 & 7) ───────

  const handleQuizComplete = useCallback(
    async (wrongAnswers: any[]) => {
      if (!treeData || !quizNode || !selectedTopic || !selectedLevel) return;

      // Review of an already-completed node: pure practice — no XP, no server
      // mutation (re-completing would no-op; branching would graft remedial
      // nodes onto a finished chain).
      if (quizNode.data.status === "completed") {
        toast.success(t("skillTree.tree.reviewDone"), { id: "skilltree-review" });
        return;
      }

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
          const messageIndex = Math.floor(Math.random() * CELEBRATION_MESSAGE_COUNT) + 1;
          setCelebration({
            message: t(`skillTree.celebrationMessages.${messageIndex}`),
          });
          playNodeComplete();
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
        // XP/celebration already fired — tell the user the PROGRESS save
        // failed so they don't think it's lost silently.
        toast.error(t("skillTree.errors.updateFailed"));
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50 font-sans relative overflow-hidden">
        {/* AI is rebuilding a saved tree — block input with the stepper overlay */}
        {resumingId && <GeneratingOverlay />}

        {/* Starfield ambient backdrop */}
        <div className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(1px 1px at 20% 30%, rgba(99,102,241,0.25) 50%, transparent 51%), radial-gradient(1px 1px at 70% 20%, rgba(129,140,248,0.2) 50%, transparent 51%), radial-gradient(1.5px 1.5px at 40% 70%, rgba(99,102,241,0.22) 50%, transparent 51%), radial-gradient(1px 1px at 85% 80%, rgba(129,140,248,0.18) 50%, transparent 51%), radial-gradient(1px 1px at 15% 85%, rgba(99,102,241,0.2) 50%, transparent 51%)",
            backgroundSize: "600px 600px",
          }}
        />
        <header className="relative z-10 bg-white/70 backdrop-blur border-b border-slate-200 h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Map size={18} />
            </div>
            <h1 className="font-bold text-slate-900 text-lg">{t("skillTree.header.title")}</h1>
          </div>
          <Link to="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            {t("skillTree.header.back")}
          </Link>
        </header>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">

          {/* ── Continue Your Journey ─────────────────────────────────────── */}
          {hasResumable && (
            <div className="mb-12">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-900 mb-1">{t("skillTree.resume.heading")}</h2>
                <p className="text-slate-500 text-sm">{t("skillTree.resume.subtitle")}</p>
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
                          ? "border-indigo-400 shadow-lg shadow-indigo-500/20"
                          : "border-slate-200 hover:border-indigo-400/60 hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5"
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
                            {tInfo && <tInfo.icon size={16} className="text-slate-600 shrink-0" />}
                            <span className="font-bold text-slate-900 text-sm truncate">
                              {tInfo ? topicLabel(tInfo.id) : tree.topic}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 ml-2 shrink-0">
                            {isLastVisited && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">
                                {t("skillTree.resume.lastVisited")}
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
                          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
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
                          <span className="text-[11px] text-slate-500 font-medium tabular-nums">
                            {progress.completed}/{progress.total} · {progress.percentage}%
                          </span>
                          {isResuming ? (
                            <span className="flex items-center gap-1.5 text-[11px] text-indigo-600 font-semibold">
                              <span className="inline-block w-3 h-3 border border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                              {t("skillTree.resume.loading")}
                            </span>
                          ) : (
                            <span className="text-[11px] text-indigo-600 font-semibold group-hover:text-indigo-800 transition-colors">
                              {t("skillTree.resume.tapToResume")}
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

          {/* ── Start a New Topic — World Map Carousel (Idea 3) ─────────── */}
          <div>
            <div className={`mb-6 ${hasResumable ? "" : "text-center"}`}>
              {hasResumable ? (
                <>
                  <h2 className="text-2xl font-black text-slate-900 mb-1">{t("skillTree.newTopic.headingResumable")}</h2>
                  <p className="text-slate-500 text-sm">{t("skillTree.newTopic.subtitleResumable")}</p>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-black text-slate-900 mb-3">{t("skillTree.newTopic.heading")}</h2>
                  <p className="text-slate-500 text-lg">{t("skillTree.newTopic.subtitle")}</p>
                </>
              )}
            </div>

            <div className="relative">
              {/* Desktop affordance: mouse users can't easily scroll sideways,
                  and without arrows half the topics were effectively hidden */}
              <button
                onClick={() => carouselRef.current?.scrollBy({ left: -320, behavior: "smooth" })}
                aria-label={t("skillTree.carousel.prev")}
                className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white shadow-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => carouselRef.current?.scrollBy({ left: 320, behavior: "smooth" })}
                aria-label={t("skillTree.carousel.next")}
                className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white shadow-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
              >
                <ChevronRight size={20} />
              </button>

              <div
                ref={carouselRef}
                className="flex gap-5 overflow-x-auto overflow-y-visible pt-2 pb-6 -mx-6 px-6 snap-x snap-mandatory"
                style={{ scrollbarWidth: "thin" }}
              >
              {TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => { setSelectedTopic(topic.id); setStep("level"); }}
                  className="group relative shrink-0 snap-start overflow-hidden rounded-3xl text-left transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1"
                  style={{ width: 280, height: 340 }}
                >
                  {/* Gradient base */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${topic.color}`} />
                  {/* Atmospheric glow ring */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.25) 0%, transparent 60%)" }}
                  />
                  {/* Dark vignette at bottom for text legibility */}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                  {/* Popular ribbon */}
                  {topic.popular && (
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-white/95 text-slate-900 rounded-full shadow-lg">
                      <Sparkles size={11} /> {t("skillTree.topicCard.popular")}
                    </div>
                  )}

                  {/* Icon medallion */}
                  <div className="absolute top-6 left-6 z-10 w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <topic.icon size={32} />
                  </div>

                  {/* Body */}
                  <div className="absolute inset-x-0 bottom-0 z-10 p-6 text-white">
                    <h3 className="font-black text-2xl mb-1 drop-shadow-md">{topicLabel(topic.id)}</h3>
                    <p className="text-sm text-white/85 leading-snug mb-4 line-clamp-2">{topicDesc(topic.id)}</p>

                    {/* Stats row */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/90">
                        <BookMarked size={12} />
                        <span>{t("skillTree.topicCard.lessons", { count: topic.nodeCount })}</span>
                      </div>
                      <div className="flex items-center gap-0.5" aria-label={t("skillTree.topicCard.difficultyAria", { level: topic.difficulty })}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <span
                            key={i}
                            className="block w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: i <= topic.difficulty ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.25)",
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between border-t border-white/20 pt-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-white/90">{t("skillTree.topicCard.enterWorld")}</span>
                      <ChevronRight size={18} className="text-white group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              ))}
              </div>
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50 font-sans relative overflow-hidden">
        {/* AI is generating the tree — show the stepper overlay over the page */}
        {loading && <GeneratingOverlay />}

        {/* Starfield backdrop */}
        <div className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(1px 1px at 20% 30%, rgba(99,102,241,0.25) 50%, transparent 51%), radial-gradient(1px 1px at 70% 20%, rgba(129,140,248,0.2) 50%, transparent 51%), radial-gradient(1.5px 1.5px at 40% 70%, rgba(99,102,241,0.22) 50%, transparent 51%), radial-gradient(1px 1px at 85% 80%, rgba(129,140,248,0.18) 50%, transparent 51%), radial-gradient(1px 1px at 15% 85%, rgba(99,102,241,0.2) 50%, transparent 51%)",
            backgroundSize: "600px 600px",
          }}
        />
        <header className="relative z-10 bg-white/70 backdrop-blur border-b border-slate-200 h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Map size={18} />
            </div>
            <h1 className="font-bold text-slate-900 text-lg">{t("skillTree.header.title")}</h1>
          </div>
          <button
            onClick={() => setStep("topic")}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {t("skillTree.header.changeTopic")}
          </button>
        </header>

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full shadow-lg border border-slate-200 mb-4 text-slate-700">
              {topicInfo && <topicInfo.icon size={18} />}
              <span className="font-bold">{topicInfo ? topicLabel(topicInfo.id) : ""}</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3">{t("skillTree.level.selectTitle")}</h2>
            <p className="text-slate-500">{t("skillTree.level.cefrScale")}</p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-10">
            {LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                className={`rounded-2xl p-4 text-center transition-all duration-300 hover:scale-105 border-2 ${
                  selectedLevel === level.id
                    ? "border-indigo-400 shadow-lg shadow-indigo-500/30 bg-indigo-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="text-2xl font-black mb-0.5" style={{ color: level.color }}>
                  {level.label}
                </div>
                <div className="text-[10px] text-slate-700 font-semibold leading-tight">{t(`skillTree.levels.${level.id}.description`)}</div>
                <div className="text-[8px] text-slate-500 mt-1 leading-snug">{t(`skillTree.levels.${level.id}.subtext`)}</div>
              </button>
            ))}
          </div>

          <div className="text-center mb-4">
            <Link
              to="/placement-test"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              {t("skillTree.level.placementHint")}
            </Link>
          </div>

          <div className="text-center">
            <button
              onClick={startLearning}
              disabled={!selectedLevel || loading}
              className="px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60 disabled:opacity-50 transition-all duration-300 hover:scale-105"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t("skillTree.level.building")}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ArrowRight size={18} />
                  {t("skillTree.level.startLearning")}
                </span>
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
    <div className="bg-gradient-to-b from-slate-50 via-white to-indigo-50 font-sans">

      {/* ── Sprint 6: Gamification header ─────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center justify-between gap-2 mb-2">

          {/* Topic info */}
          <div className="flex items-center gap-2 min-w-0 shrink">
            {topicInfo && <topicInfo.icon size={16} className="text-slate-600 shrink-0" />}
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-sm leading-tight truncate">{topicInfo ? topicLabel(topicInfo.id) : ""}</div>
              <div className="text-[10px] text-slate-500">{t("skillTree.tree.level", { level: levelInfo?.label })}</div>
            </div>
          </div>

          {/* Gamification stats */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="flex items-center gap-1 text-orange-500">
              <Flame size={13} />
              <span className="text-xs font-bold tabular-nums">{streak}</span>
            </span>
            <span className="text-slate-300 text-xs">·</span>
            <span className="flex items-center gap-1 text-amber-500">
              <Zap size={12} fill="currentColor" />
              <span className="text-xs font-bold tabular-nums"><CountUpNumber value={xp} /></span>
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
                setTreeComplete(false);
              }}
              className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              {t("skillTree.tree.change")}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
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
            <div className="bg-white p-6">
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-5" />
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
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">{detailNode.data.label}</h3>
                  {detailNode.data.description && (
                    <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{detailNode.data.description}</p>
                  )}
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {detailNode.data.mixedSkills.map((skill) => {
                      const skillColors: Record<string, string> = {
                        grammar:    "bg-blue-100 text-blue-700 border-blue-200",
                        vocabulary: "bg-emerald-100 text-emerald-700 border-emerald-200",
                        listening:  "bg-amber-100 text-amber-700 border-amber-200",
                      };
                      return (
                        <span
                          key={skill}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${skillColors[skill] || "bg-slate-100 text-slate-600 border-slate-200"}`}
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
                  <span className="text-xl">{detailNode.data.status === "completed" ? "🔁" : "🎮"}</span>
                  {detailNode.data.status === "completed"
                    ? t("skillTree.tree.practiceAgain")
                    : t("skillTree.tree.startQuiz")}
                </span>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              {detailNode.data.status === "completed" && (
                <p className="text-center text-[11px] text-slate-400 mt-2">
                  {t("skillTree.tree.reviewNoXp")}
                </p>
              )}
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

      {/* ── Full-tree completion moment — the emotional peak of the feature ── */}
      {treeComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden" role="dialog" aria-modal="true">
          <div
            className={`absolute inset-0 ${prefersReducedMotion ? "bg-slate-950/85" : "bg-slate-950/80 skill-fade-in"}`}
            style={{ backdropFilter: "blur(8px)" }}
          />

          {/* Star burst (reuses the celebration keyframes below) */}
          {!prefersReducedMotion && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i / 12) * Math.PI * 2;
                const colors = ["#fbbf24", "#fde68a", "#a78bfa", "#f472b6", "#34d399"];
                const color = colors[i % colors.length];
                return (
                  <Sparkles
                    key={i}
                    size={i % 3 === 0 ? 30 : 20}
                    className="absolute skill-burst-star"
                    style={{
                      color,
                      filter: `drop-shadow(0 0 8px ${color})`,
                      ["--dx" as never]: `${Math.cos(angle) * 260}px`,
                      ["--dy" as never]: `${Math.sin(angle) * 260}px`,
                      animationDelay: `${i * 35}ms`,
                    }}
                  />
                );
              })}
            </div>
          )}

          <div className="relative text-center px-6 max-w-md">
            <div className="text-7xl mb-4 select-none">🏆</div>
            <h2 className="text-4xl md:text-5xl font-black text-amber-400 drop-shadow-[0_0_24px_rgba(251,191,36,0.7)] mb-3">
              {t("skillTree.treeComplete.title")}
            </h2>
            <p className="text-slate-200 text-base mb-8">
              {t("skillTree.treeComplete.subtitle", { topic: topicInfo ? topicLabel(topicInfo.id) : "" })}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setTreeComplete(false);
                  setStep("topic");
                  setTreeData(null);
                  setSelectedTopic(null);
                  setSelectedLevel(null);
                }}
                className="px-7 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/40 hover:scale-105 transition-transform"
              >
                {t("skillTree.treeComplete.newTopic")}
              </button>
              <button
                onClick={() => setTreeComplete(false)}
                className="px-7 py-3 rounded-xl font-bold text-slate-200 border border-slate-500 hover:bg-white/10 transition-colors"
              >
                {t("skillTree.treeComplete.stay")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Idea 4: Full-screen node-completion celebration ──────────── */}
      {celebration && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {/* Backdrop */}
          <div
            className={`absolute inset-0 ${prefersReducedMotion ? "bg-slate-950/80" : "bg-slate-950/70 skill-fade-in"}`}
            style={{ backdropFilter: "blur(6px)" }}
          />

          {prefersReducedMotion ? (
            // Accessible static fallback
            <div className="relative bg-slate-800/95 border border-slate-700 text-white px-10 py-7 rounded-3xl text-center shadow-2xl">
              <Sparkles size={36} className="text-amber-400 mx-auto mb-2" />
              <div className="text-4xl font-black text-amber-400">+{XP_PER_NODE} XP</div>
              <div className="text-lg font-semibold text-slate-200 mt-2">{celebration.message}</div>
            </div>
          ) : (
            <div className="relative flex items-center justify-center select-none pointer-events-none">
              {/* Star burst — 12 stars radiating outward */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i / 12) * Math.PI * 2;
                const dx = Math.cos(angle) * 220;
                const dy = Math.sin(angle) * 220;
                const size = i % 3 === 0 ? 28 : i % 3 === 1 ? 18 : 22;
                const colors = ["#fbbf24", "#fde68a", "#a78bfa", "#f472b6", "#34d399"];
                const color = colors[i % colors.length];
                return (
                  <Sparkles
                    key={i}
                    size={size}
                    className="absolute skill-burst-star"
                    style={{
                      color,
                      filter: `drop-shadow(0 0 8px ${color})`,
                      // CSS custom props consumed by the keyframes
                      ["--dx" as any]: `${dx}px`,
                      ["--dy" as any]: `${dy}px`,
                      animationDelay: `${i * 35}ms`,
                    }}
                  />
                );
              })}

              {/* Center radial glow */}
              <div
                className="absolute skill-burst-glow"
                style={{
                  width: 360,
                  height: 360,
                  background: "radial-gradient(circle, rgba(251,191,36,0.45) 0%, rgba(167,139,250,0.18) 40%, transparent 70%)",
                  borderRadius: "50%",
                }}
              />

              {/* XP + message */}
              <div className="relative text-center">
                <div className="skill-xp-bounce text-7xl md:text-8xl font-black text-amber-400 drop-shadow-[0_0_28px_rgba(251,191,36,0.8)] leading-none">
                  +{XP_PER_NODE} XP
                </div>
                <div className="skill-message-rise mt-4 text-2xl md:text-3xl font-black text-white drop-shadow-2xl">
                  {celebration.message}
                </div>
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
        @keyframes skillFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .skill-fade-in {
          animation: skillFadeIn 0.25s ease-out forwards;
        }
        @keyframes xpBounce {
          0%   { transform: scale(0.3);  opacity: 0; }
          35%  { transform: scale(1.2);  opacity: 1; }
          55%  { transform: scale(0.95); opacity: 1; }
          75%  { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
        .skill-xp-bounce {
          animation: xpBounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes messageRise {
          0%   { transform: translateY(20px); opacity: 0; }
          40%  { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
        .skill-message-rise {
          animation: messageRise 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes burstStar {
          0%   { transform: translate(0, 0) scale(0) rotate(0deg);            opacity: 0; }
          15%  { transform: translate(calc(var(--dx) * 0.15), calc(var(--dy) * 0.15)) scale(1) rotate(45deg); opacity: 1; }
          70%  { transform: translate(calc(var(--dx) * 0.85), calc(var(--dy) * 0.85)) scale(1) rotate(180deg); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0) rotate(360deg); opacity: 0; }
        }
        .skill-burst-star {
          animation: burstStar 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes burstGlow {
          0%   { transform: scale(0.2); opacity: 0; }
          25%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .skill-burst-glow {
          animation: burstGlow 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
