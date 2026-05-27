// =============================================================================
// Skill Tree Flow — Duolingo-style Vertical Tower
// Premium UI: large circle nodes, dotted trail, ambient glow, progress ring
// =============================================================================

import { useMemo } from "react";
import { BookOpen, Zap, Trophy, Wrench, Pencil, CheckCircle2, Lock, Crown, Gift, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface SkillTreeNodeData {
  label: string;
  type: "root" | "lesson" | "challenge" | "checkpoint" | "remedial" | "practice" | "chest";
  status: "active" | "completed" | "locked" | "new";
  mixedSkills: string[];
  questionTypes: string[];
  description: string;
  [key: string]: unknown;
}

interface SkillTreeFlowProps {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    status: string;
    position?: { x: number; y: number };
    mixedSkills?: string[];
    questionTypes?: string[];
    description?: string;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    animated?: boolean;
  }>;
  onNodeClick?: (nodeId: string, nodeData: SkillTreeNodeData) => void;
}

// ─── Node Theme ─────────────────────────────────────────────────────────────────

export const NODE_THEME: Record<string, {
  bg: string;
  bgDark: string;
  border: string;
  glow: string;
  icon: LucideIcon;
  ring: string;
}> = {
  root: { bg: "#fbbf24", bgDark: "#b45309", border: "#fde68a", glow: "rgba(251,191,36,0.55)", icon: Crown, ring: "#fde68a" },
  lesson: { bg: "#60a5fa", bgDark: "#2563eb", border: "#93c5fd", glow: "rgba(96,165,250,0.4)", icon: BookOpen, ring: "#93c5fd" },
  challenge: { bg: "#fbbf24", bgDark: "#d97706", border: "#fde68a", glow: "rgba(251,191,36,0.4)", icon: Zap, ring: "#fde68a" },
  checkpoint: { bg: "#34d399", bgDark: "#059669", border: "#6ee7b7", glow: "rgba(52,211,153,0.4)", icon: Trophy, ring: "#6ee7b7" },
  remedial: { bg: "#f87171", bgDark: "#dc2626", border: "#fca5a5", glow: "rgba(248,113,113,0.4)", icon: Wrench, ring: "#fca5a5" },
  practice: { bg: "#a78bfa", bgDark: "#7c3aed", border: "#c4b5fd", glow: "rgba(167,139,250,0.4)", icon: Pencil, ring: "#c4b5fd" },
  chest: { bg: "#f59e0b", bgDark: "#b45309", border: "#fde68a", glow: "rgba(245,158,11,0.55)", icon: Gift, ring: "#fde68a" },
};

// ─── Shape helpers (Idea 5) ────────────────────────────────────────────────────
// Returns CSS clip-path or border-radius treatment per node type. Keeps the
// underlying button square so click area stays predictable; visuals come from
// either clip-path (shield) or transform-rotate (diamond) layered inside.

type NodeShape = "circle" | "diamond" | "shield" | "rounded-square" | "circle-large" | "chest";

function getShapeForType(type: string): NodeShape {
  switch (type) {
    case "challenge":  return "diamond";
    case "checkpoint": return "shield";
    case "remedial":   return "rounded-square";
    case "root":       return "circle-large";
    case "chest":      return "chest";
    default:           return "circle";
  }
}

// Pentagonal shield clip-path (top straight, bottom point)
const SHIELD_CLIP = "polygon(50% 0%, 100% 18%, 100% 65%, 50% 100%, 0 65%, 0 18%)";

// ─── BFS-Based Layout ───────────────────────────────────────────────────────────
// Every node gets a unique (x, y). Depth is the shortest path from a root via
// BFS; each depth is packed horizontally with strict H_GAP enforcement, then
// shifted so children sit roughly under the average of their incoming parents.

// H_GAP: horizontal distance between adjacent node centres
const H_GAP = 240;
const ROW_HEIGHT = 230;
const START_Y = 80;
const EDGE_PAD = 120;

// Idea 2: section banner constants
const SECTION_SIZE = 4;
const BANNER_HEIGHT = 110;

// Idea 7: remedial side-quest spacing
const REMEDIAL_OFFSET_X = H_GAP * 0.8;

const SECTION_THEMES: Array<{ label: string; gradient: string; accent: string }> = [
  { label: "Foundations",      gradient: "from-indigo-500/70 to-blue-500/70",   accent: "#818cf8" },
  { label: "Skill Building",   gradient: "from-emerald-500/70 to-teal-500/70",  accent: "#34d399" },
  { label: "Real Conversations", gradient: "from-amber-500/70 to-orange-500/70", accent: "#fbbf24" },
  { label: "Mastery",          gradient: "from-rose-500/70 to-fuchsia-500/70",  accent: "#f472b6" },
  { label: "Beyond",           gradient: "from-violet-500/70 to-purple-500/70", accent: "#a78bfa" },
];

interface LayoutBanner {
  y: number;          // vertical centre of banner area
  sectionIndex: number;
}

interface LayoutResult {
  posMap: Map<string, { x: number; y: number }>;
  sectionOf: Map<string, number>;
  banners: LayoutBanner[];
}

function computeTreeLayout(
  nodes: Array<{ id: string; type: string }>,
  edges: Array<{ source: string; target: string }>
): LayoutResult {
  const posMap = new Map<string, { x: number; y: number }>();
  const sectionOf = new Map<string, number>();
  const banners: LayoutBanner[] = [];

  if (nodes.length === 0) return { posMap, sectionOf, banners };

  // Build adjacency filtered to known node ids; skip self-loops & dangling edges
  const nodeIds = new Set(nodes.map((n) => n.id));
  const outEdges = new Map<string, string[]>();
  const inEdges = new Map<string, string[]>();
  nodes.forEach((n) => {
    outEdges.set(n.id, []);
    inEdges.set(n.id, []);
  });
  edges.forEach((e) => {
    if (e.source === e.target) return;
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) return;
    outEdges.get(e.source)!.push(e.target);
    inEdges.get(e.target)!.push(e.source);
  });

  // Idea 7: remedial nodes ride along their parent and don't participate in the
  // main BFS row layout. Exclude them up-front; we'll position them last.
  const remedialIds = new Set(nodes.filter((n) => n.type === "remedial").map((n) => n.id));
  const mainNodes = nodes.filter((n) => !remedialIds.has(n.id));

  // BFS depth from nodes with no incoming MAIN edges (true roots).
  const inDegreeMain = new Map<string, number>();
  mainNodes.forEach((n) => {
    const incoming = (inEdges.get(n.id) ?? []).filter((p) => !remedialIds.has(p));
    inDegreeMain.set(n.id, incoming.length);
  });
  const roots = mainNodes.filter((n) => (inDegreeMain.get(n.id) ?? 0) === 0);
  const startSeeds = roots.length > 0 ? roots.map((n) => n.id) : [mainNodes[0]?.id].filter(Boolean) as string[];

  const depthOf = new Map<string, number>();
  const queue: Array<{ id: string; depth: number }> = startSeeds.map((id) => ({ id, depth: 0 }));
  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    const prev = depthOf.get(id);
    if (prev !== undefined && prev <= depth) continue;
    depthOf.set(id, depth);
    for (const child of outEdges.get(id) ?? []) {
      if (remedialIds.has(child)) continue;
      queue.push({ id: child, depth: depth + 1 });
    }
  }

  // Any unreached main nodes go below the deepest known depth
  let maxDepth = 0;
  depthOf.forEach((d) => { if (d > maxDepth) maxDepth = d; });
  mainNodes.forEach((n) => {
    if (!depthOf.has(n.id)) depthOf.set(n.id, maxDepth + 1);
  });

  // Y offset per depth — adds BANNER_HEIGHT every SECTION_SIZE depths (Idea 2)
  const yForDepth = (d: number) =>
    START_Y + d * ROW_HEIGHT + Math.floor(d / SECTION_SIZE) * BANNER_HEIGHT;

  // Group ids by depth, preserving original node order as tiebreaker
  const byDepth = new Map<number, string[]>();
  mainNodes.forEach((n) => {
    const d = depthOf.get(n.id)!;
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d)!.push(n.id);
  });

  const sortedDepths = [...byDepth.keys()].sort((a, b) => a - b);

  for (const d of sortedDepths) {
    const ids = byDepth.get(d)!;
    const y = yForDepth(d);

    if (d === sortedDepths[0]) {
      const total = (ids.length - 1) * H_GAP;
      const startX = -total / 2;
      ids.forEach((id, i) => posMap.set(id, { x: startX + i * H_GAP, y }));
      continue;
    }

    const desired = new Map<string, number>();
    ids.forEach((id) => {
      const parents = (inEdges.get(id) ?? []).filter((p) => posMap.has(p) && !remedialIds.has(p));
      if (parents.length === 0) {
        desired.set(id, 0);
        return;
      }
      const avg = parents.reduce((s, p) => s + posMap.get(p)!.x, 0) / parents.length;
      desired.set(id, avg);
    });

    const sortedIds = [...ids].sort((a, b) => desired.get(a)! - desired.get(b)!);

    let lastX = -Infinity;
    const tempX = new Map<string, number>();
    sortedIds.forEach((id) => {
      let x = desired.get(id)!;
      if (x < lastX + H_GAP) x = lastX + H_GAP;
      tempX.set(id, x);
      lastX = x;
    });

    const desiredMid =
      sortedIds.reduce((s, id) => s + desired.get(id)!, 0) / sortedIds.length;
    const actualMid =
      sortedIds.reduce((s, id) => s + tempX.get(id)!, 0) / sortedIds.length;
    const rowShift = desiredMid - actualMid;
    sortedIds.forEach((id) => posMap.set(id, { x: tempX.get(id)! + rowShift, y }));
  }

  // Idea 7: place remedial nodes beside their primary parent (same Y, x - offset)
  nodes.forEach((n) => {
    if (!remedialIds.has(n.id)) return;
    const parents = (inEdges.get(n.id) ?? []).filter((p) => posMap.has(p));
    if (parents.length === 0) {
      // Orphan remedial — drop below the tree
      posMap.set(n.id, { x: 0, y: yForDepth(maxDepth + 1) });
      return;
    }
    const parent = parents[0];
    const parentPos = posMap.get(parent)!;
    posMap.set(n.id, { x: parentPos.x - REMEDIAL_OFFSET_X, y: parentPos.y });
  });

  // Idea 2: tag each node with its section index based on depth
  nodes.forEach((n) => {
    if (remedialIds.has(n.id)) {
      // Inherit from parent so remedials don't break section grouping
      const parents = (inEdges.get(n.id) ?? []);
      const parent = parents.find((p) => depthOf.has(p));
      if (parent) {
        sectionOf.set(n.id, Math.floor(depthOf.get(parent)! / SECTION_SIZE));
        return;
      }
      sectionOf.set(n.id, 0);
      return;
    }
    sectionOf.set(n.id, Math.floor((depthOf.get(n.id) ?? 0) / SECTION_SIZE));
  });

  // Idea 2: compute banner Y positions — banner sits between section boundaries
  // First section has no banner above it (section 0 is the intro).
  if (sortedDepths.length > 0) {
    const maxKnownDepth = Math.max(...sortedDepths);
    const totalSections = Math.floor(maxKnownDepth / SECTION_SIZE) + 1;
    for (let s = 1; s < totalSections; s++) {
      const boundaryDepth = s * SECTION_SIZE;
      // Banner sits in the BANNER_HEIGHT gap that yForDepth introduces before that depth
      const y = yForDepth(boundaryDepth) - BANNER_HEIGHT / 2 - ROW_HEIGHT * 0.05;
      banners.push({ y, sectionIndex: s });
    }
  }

  // Shift so leftmost node sits at EDGE_PAD
  const allX = [...posMap.values()].map((p) => p.x);
  if (allX.length > 0) {
    const minX = Math.min(...allX);
    const shift = EDGE_PAD - minX;
    if (shift !== 0) {
      posMap.forEach((p, id) => posMap.set(id, { x: p.x + shift, y: p.y }));
    }
  }

  return { posMap, sectionOf, banners };
}

// ─── Curved SVG path ────────────────────────────────────────────────────────────

function curvePath(x1: number, y1: number, x2: number, y2: number): string {
  const my = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
}

// ─── Injected styles ────────────────────────────────────────────────────────────

const STYLE_ID = "skill-tower-styles-v2";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes tower-breathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.06); }
    }
    @keyframes tower-ring-spin {
      to { transform: rotate(360deg); }
    }
    @keyframes tower-appear {
      from { opacity: 0; transform: scale(0.3) translateY(20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes tower-dash {
      to { stroke-dashoffset: -24; }
    }
    @keyframes tower-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    @keyframes tower-glow-pulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.7; }
    }
    .tower-active {
      animation: tower-breathe 2.8s ease-in-out infinite;
    }
    .tower-new-node {
      animation: tower-appear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    .tower-edge-flow {
      animation: tower-dash 1s linear infinite;
    }
    .tower-float {
      animation: tower-float 3s ease-in-out infinite;
    }
    .tower-glow-pulse {
      animation: tower-glow-pulse 2s ease-in-out infinite;
    }
    @keyframes tower-chest-shimmer {
      0%, 100% { box-shadow: 0 0 14px 4px rgba(245,158,11,0.45); }
      50%      { box-shadow: 0 0 24px 8px rgba(253,224,71,0.7); }
    }
    .tower-chest-shimmer {
      animation: tower-chest-shimmer 2.2s ease-in-out infinite;
    }
  `;
  document.head.appendChild(s);
}

// ─── Progress Ring SVG ──────────────────────────────────────────────────────────

function ProgressRing({ color, active }: { color: string; active: boolean }) {
  if (!active) return null;
  const r = 38;
  const circ = 2 * Math.PI * r;
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 80 80"
      style={{ animation: "tower-ring-spin 4s linear infinite" }}
    >
      <circle
        cx={40} cy={40} r={r}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeDasharray={`${circ * 0.3} ${circ * 0.7}`}
        strokeLinecap="round"
        opacity={0.6}
      />
    </svg>
  );
}

// ─── Connector with dots ────────────────────────────────────────────────────────

function DottedTrail({ x1, y1, x2, y2, completed, animated }: {
  x1: number; y1: number; x2: number; y2: number;
  completed: boolean; animated: boolean;
}) {
  const path = curvePath(x1, y1, x2, y2);
  const color = completed ? "#34d399" : animated ? "#fbbf24" : "#334155";
  return (
    <g>
      {/* Glow behind */}
      {(completed || animated) && (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          opacity={0.1}
        />
      )}
      {/* Dotted line */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={completed ? 3.5 : 2.5}
        strokeLinecap="round"
        strokeDasharray={completed ? "none" : "6 10"}
        className={animated ? "tower-edge-flow" : ""}
        opacity={completed ? 0.7 : 0.5}
      />
    </g>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

const NODE_SIZE = 72;
const NODE_R = NODE_SIZE / 2;
const REMEDIAL_SIZE = 56;
const REMEDIAL_R = REMEDIAL_SIZE / 2;
const ROOT_SIZE = 88;
const ROOT_R = ROOT_SIZE / 2;

function sizeForType(type: string): { size: number; r: number } {
  if (type === "remedial") return { size: REMEDIAL_SIZE, r: REMEDIAL_R };
  if (type === "root")     return { size: ROOT_SIZE, r: ROOT_R };
  return { size: NODE_SIZE, r: NODE_R };
}

export default function SkillTreeFlow({ nodes: rawNodes, edges: rawEdges, onNodeClick }: SkillTreeFlowProps) {
  injectStyles();

  // Defend against duplicate ids from the backend (causes React key collisions
  // and overlapping nodes at identical layout positions).
  const dedupedNodes = useMemo(() => {
    const seen = new Set<string>();
    const out: typeof rawNodes = [];
    for (const n of rawNodes) {
      if (seen.has(n.id)) continue;
      seen.add(n.id);
      out.push(n);
    }
    return out;
  }, [rawNodes]);

  const { posMap, sectionOf, banners } = useMemo(
    () => computeTreeLayout(dedupedNodes, rawEdges),
    [dedupedNodes, rawEdges]
  );

  const layoutNodes = useMemo(
    () =>
      dedupedNodes.map((node, i) => ({
        ...node,
        pos: posMap.get(node.id) ?? { x: EDGE_PAD, y: START_Y + i * ROW_HEIGHT },
        section: sectionOf.get(node.id) ?? 0,
        theme: NODE_THEME[node.type] || NODE_THEME.lesson,
        shape: getShapeForType(node.type),
        sizing: sizeForType(node.type),
        data: {
          label: node.label,
          type: node.type as SkillTreeNodeData["type"],
          status: node.status as SkillTreeNodeData["status"],
          mixedSkills: node.mixedSkills || [],
          questionTypes: node.questionTypes || [],
          description: node.description || "",
        } as SkillTreeNodeData,
      })),
    [dedupedNodes, posMap, sectionOf]
  );

  const nodeMap = useMemo(() => new Map(layoutNodes.map((n) => [n.id, n])), [layoutNodes]);

  const { canvasW, canvasH } = useMemo(() => {
    if (layoutNodes.length === 0) return { canvasW: 440, canvasH: 600 };
    const xs = layoutNodes.map((n) => n.pos.x);
    const ys = layoutNodes.map((n) => n.pos.y);
    return {
      canvasW: Math.max(640, Math.max(...xs) + ROOT_R + EDGE_PAD + 80),
      canvasH: Math.max(600, Math.max(...ys) + 220),
    };
  }, [layoutNodes]);

  const handleClick = (node: typeof layoutNodes[0]) => {
    if (onNodeClick && node.data.status !== "locked") {
      onNodeClick(node.id, node.data);
    }
  };

  const rootX = layoutNodes[0]?.pos.x ?? canvasW / 2;

  // Idea 2: virtual chest at the end of each section (decorative reward marker
  // shown beside the banner). One chest per banner = one per section boundary.

  return (
    <div className="w-full overflow-x-auto">
      <div className="relative mx-auto" style={{ width: canvasW, height: canvasH }}>

        {/* ── SVG Layer: trails ── */}
        <svg className="absolute inset-0 pointer-events-none" width={canvasW} height={canvasH}>
          {/* Ambient vertical line along main path */}
          <line
            x1={rootX} y1={0} x2={rootX} y2={canvasH}
            stroke="#1e293b"
            strokeWidth={1}
            strokeDasharray="4 8"
            opacity={0.5}
          />
          {rawEdges.map((edge) => {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) return null;
            const srcCompleted = src.data.status === "completed";
            return (
              <DottedTrail
                key={edge.id}
                x1={src.pos.x}
                y1={src.pos.y}
                x2={tgt.pos.x}
                y2={tgt.pos.y}
                completed={srcCompleted}
                animated={edge.animated || false}
              />
            );
          })}
        </svg>

        {/* ── Section Banners (Idea 2) ── */}
        {banners.map((banner) => {
          const theme = SECTION_THEMES[banner.sectionIndex % SECTION_THEMES.length];
          return (
            <div
              key={`banner-${banner.sectionIndex}`}
              className="absolute pointer-events-none flex items-center justify-center"
              style={{
                left: 0,
                right: 0,
                top: banner.y - BANNER_HEIGHT / 2,
                height: BANNER_HEIGHT,
              }}
              aria-hidden="true"
            >
              <div
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl backdrop-blur-md border bg-gradient-to-r ${theme.gradient} shadow-2xl`}
                style={{ borderColor: `${theme.accent}66` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg tower-glow-pulse"
                  style={{ backgroundColor: theme.accent }}
                >
                  <Gift size={20} />
                </div>
                <div className="text-left text-white">
                  <div className="text-[9px] font-bold uppercase tracking-widest opacity-80">
                    Section {banner.sectionIndex + 1}
                  </div>
                  <div className="text-base font-black leading-tight drop-shadow">
                    {theme.label}
                  </div>
                </div>
                <div className="text-white/80 text-[10px] font-bold uppercase tracking-wider ml-2 hidden sm:block">
                  +50 Bonus XP
                </div>
              </div>
            </div>
          );
        })}

        {/* ── Node Layer ── */}
        {layoutNodes.map((node, idx) => {
          const { data, theme, pos, shape, sizing } = node;
          const isActive = data.status === "active";
          const isCompleted = data.status === "completed";
          const isLocked = data.status === "locked";
          const isNew = data.status === "new";
          const isRemedial = data.type === "remedial";
          const isRoot = data.type === "root";
          const isChest = data.type === "chest";

          // Idea 5: shape-specific button styling
          const shapeStyle: React.CSSProperties = (() => {
            if (shape === "diamond")        return { borderRadius: 14, transform: "rotate(45deg)" };
            if (shape === "shield")         return { borderRadius: 0, clipPath: SHIELD_CLIP };
            if (shape === "rounded-square") return { borderRadius: 18 };
            return { borderRadius: "50%" };
          })();

          // Icons need counter-rotation for diamond so they read upright
          const iconCounterRotate = shape === "diamond" ? { transform: "rotate(-45deg)" } : undefined;

          return (
            <div key={node.id}>
              {/* ── Node Button ── */}
              <button
                onClick={() => handleClick(node)}
                disabled={isLocked}
                aria-label={`${data.label} — ${isCompleted ? "completed" : isLocked ? "locked" : isNew ? "new, tap to start" : "active, tap to continue"}`}
                className={`
                  absolute flex items-center justify-center
                  transition-all duration-300 select-none outline-none
                  ${isActive ? "tower-active" : ""}
                  ${isNew ? "tower-new-node" : ""}
                  ${isChest ? "tower-chest-shimmer" : ""}
                  ${isLocked ? "cursor-not-allowed" : "cursor-pointer"}
                  ${!isActive && !isLocked && !isNew ? "hover:scale-110" : ""}
                `}
                style={{
                  width: sizing.size,
                  height: sizing.size,
                  left: pos.x - sizing.r,
                  top: pos.y - sizing.r,
                  background: isCompleted
                    ? "linear-gradient(135deg, #374151, #1f2937)"
                    : isLocked
                      ? "linear-gradient(135deg, #1e293b, #0f172a)"
                      : `linear-gradient(135deg, ${theme.bg}, ${theme.bgDark})`,
                  border: `${isRoot ? 4 : 3}px solid ${
                    isCompleted ? "#4b5563"
                      : isLocked ? "#1e293b"
                        : isRoot ? "#fde047"
                          : theme.border
                  }`,
                  boxShadow: isNew
                    ? `0 0 18px 6px ${theme.glow}`
                    : isActive || isRoot
                      ? `0 0 18px 5px ${theme.glow}`
                      : isCompleted
                        ? "0 2px 8px rgba(0,0,0,0.3)"
                        : "none",
                  opacity: isLocked ? 0.65 : 1,
                  filter: isLocked ? "grayscale(0.6)" : "none",
                  ...shapeStyle,
                }}
              >
                {/* Spinning progress ring — only for circular shapes */}
                {(shape === "circle" || shape === "circle-large") && (
                  <span aria-hidden="true"><ProgressRing color={theme.ring} active={isActive} /></span>
                )}

                {/* Icon */}
                <span
                  aria-hidden="true"
                  className={`leading-none z-10 flex items-center justify-center ${isActive ? "tower-float" : ""}`}
                  style={{ filter: isLocked ? "grayscale(1)" : "none", color: "white", ...iconCounterRotate }}
                >
                  {isCompleted
                    ? <CheckCircle2 size={isRoot ? 28 : 22} />
                    : isLocked
                    ? <Lock size={isRoot ? 28 : 22} />
                    : <theme.icon size={isRoot ? 30 : isRemedial ? 18 : 22} />}
                </span>
              </button>

              {/* ── Remedial side-quest arrow connector (Idea 7) ── */}
              {isRemedial && !isLocked && (
                <svg
                  className="absolute pointer-events-none"
                  style={{
                    left: pos.x + sizing.r,
                    top: pos.y - 1,
                    width: REMEDIAL_OFFSET_X - sizing.r - NODE_R,
                    height: 2,
                    overflow: "visible",
                  }}
                  aria-hidden="true"
                >
                  <line
                    x1={0}
                    y1={1}
                    x2={REMEDIAL_OFFSET_X - sizing.r - NODE_R}
                    y2={1}
                    stroke="#f87171"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    opacity={0.55}
                  />
                </svg>
              )}

              {/* ── Ambient glow below active / chest / root node ── */}
              {(isActive || isChest) && (
                <div
                  aria-hidden="true"
                  className="absolute rounded-full pointer-events-none tower-glow-pulse"
                  style={{
                    width: sizing.size + 36,
                    height: sizing.size + 36,
                    left: pos.x - sizing.r - 18,
                    top: pos.y - sizing.r - 18,
                    background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`,
                  }}
                />
              )}

              {/* ── Step number badge (skip for remedial — uses review chip instead) ── */}
              {!isRemedial && (
                <div
                  aria-hidden="true"
                  className="absolute pointer-events-none"
                  style={{
                    width: 22,
                    height: 22,
                    left: pos.x + sizing.r - 8,
                    top: pos.y - sizing.r - 4,
                    borderRadius: "50%",
                    backgroundColor: isCompleted ? "#059669"
                      : isActive ? theme.bgDark
                        : "#1e293b",
                    border: `2px solid ${isCompleted ? "#34d399" : isActive ? theme.border : "#334155"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: isLocked ? 0.3 : 1,
                  }}
                >
                  <span className="text-[9px] font-black text-white leading-none">
                    {idx + 1}
                  </span>
                </div>
              )}

              {/* ── Crown ornament for root ── */}
              {isRoot && (
                <div
                  aria-hidden="true"
                  className="absolute pointer-events-none"
                  style={{
                    left: pos.x - 10,
                    top: pos.y - sizing.r - 18,
                    color: "#fde047",
                    filter: "drop-shadow(0 0 6px rgba(253,224,71,0.7))",
                  }}
                >
                  <Crown size={20} />
                </div>
              )}

              {/* ── Label ── */}
              <div
                className="absolute pointer-events-none transition-opacity duration-300 text-center flex flex-col items-center"
                style={{
                  top: pos.y + sizing.r + 10,
                  left: pos.x - 75,
                  width: 150,
                  opacity: isLocked ? 0.65 : 1,
                }}
              >
                {isRemedial ? (
                  <p
                    className="text-[10px] font-bold leading-snug line-clamp-2 px-2 py-1 rounded-md flex items-center gap-1 mx-auto"
                    style={{
                      backgroundColor: "rgba(127, 29, 29, 0.7)",
                      color: "#fecaca",
                      backdropFilter: "blur(2px)",
                      maxWidth: "100%",
                    }}
                  >
                    <RefreshCw size={10} className="shrink-0" />
                    <span className="truncate">Review: {data.label}</span>
                  </p>
                ) : (
                  <p
                    className="text-[11px] font-bold text-white leading-snug line-clamp-2 px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: "rgba(15, 23, 42, 0.72)",
                      backdropFilter: "blur(2px)",
                      maxWidth: "100%",
                    }}
                  >
                    {data.label}
                  </p>
                )}
                {isNew && !isRemedial && (
                  <span
                    className="inline-block mt-1 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: theme.glow, color: theme.bgDark }}
                  >
                    NEW
                  </span>
                )}
                {(isActive && !isNew && !isRemedial) && (
                  <span className="mt-1 text-[10px] text-slate-300 font-medium px-1.5 py-0.5 rounded bg-slate-900/60">
                    Tap to start
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* ── Bottom decoration ── */}
        <div
          className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none"
          style={{ bottom: 20 }}
        >
          <div className="text-slate-600 text-xs font-medium">
            {layoutNodes.filter((n) => n.data.status === "completed").length} / {layoutNodes.length} completed
          </div>
        </div>
      </div>
    </div>
  );
}
