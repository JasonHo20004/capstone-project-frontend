// =============================================================================
// Skill Tree Flow — Duolingo-style Vertical Tower
// Premium UI: large circle nodes, dotted trail, ambient glow, progress ring
// =============================================================================

import { useMemo } from "react";
import { Target, BookOpen, Zap, Trophy, Wrench, Pencil, CheckCircle2, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface SkillTreeNodeData {
  label: string;
  type: "root" | "lesson" | "challenge" | "checkpoint" | "remedial" | "practice";
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
  root: { bg: "#818cf8", bgDark: "#4f46e5", border: "#a5b4fc", glow: "rgba(129,140,248,0.5)", icon: Target, ring: "#a5b4fc" },
  lesson: { bg: "#60a5fa", bgDark: "#2563eb", border: "#93c5fd", glow: "rgba(96,165,250,0.4)", icon: BookOpen, ring: "#93c5fd" },
  challenge: { bg: "#fbbf24", bgDark: "#d97706", border: "#fde68a", glow: "rgba(251,191,36,0.4)", icon: Zap, ring: "#fde68a" },
  checkpoint: { bg: "#34d399", bgDark: "#059669", border: "#6ee7b7", glow: "rgba(52,211,153,0.4)", icon: Trophy, ring: "#6ee7b7" },
  remedial: { bg: "#f87171", bgDark: "#dc2626", border: "#fca5a5", glow: "rgba(248,113,113,0.4)", icon: Wrench, ring: "#fca5a5" },
  practice: { bg: "#a78bfa", bgDark: "#7c3aed", border: "#c4b5fd", glow: "rgba(167,139,250,0.4)", icon: Pencil, ring: "#c4b5fd" },
};

// ─── BFS-Based Layout ───────────────────────────────────────────────────────────
// Every node gets a unique (x, y). Depth is the shortest path from a root via
// BFS; each depth is packed horizontally with strict H_GAP enforcement, then
// shifted so children sit roughly under the average of their incoming parents.

// H_GAP: horizontal distance between adjacent node centres
const H_GAP = 240;
const ROW_HEIGHT = 230;
const START_Y = 80;
const EDGE_PAD = 120;

function computeTreeLayout(
  nodes: Array<{ id: string; type: string }>,
  edges: Array<{ source: string; target: string }>
): Map<string, { x: number; y: number }> {
  const posMap = new Map<string, { x: number; y: number }>();
  if (nodes.length === 0) return posMap;

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

  // BFS depth from nodes with no incoming edges (true roots).
  // Falls back to the first node when the graph is one big cycle.
  const roots = nodes.filter((n) => (inEdges.get(n.id) ?? []).length === 0);
  const startSeeds = roots.length > 0 ? roots.map((n) => n.id) : [nodes[0].id];

  const depthOf = new Map<string, number>();
  const queue: Array<{ id: string; depth: number }> = startSeeds.map((id) => ({ id, depth: 0 }));
  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    const prev = depthOf.get(id);
    if (prev !== undefined && prev <= depth) continue;
    depthOf.set(id, depth);
    for (const child of outEdges.get(id) ?? []) {
      queue.push({ id: child, depth: depth + 1 });
    }
  }

  // Any unreached nodes go below the deepest known depth
  let maxDepth = 0;
  depthOf.forEach((d) => {
    if (d > maxDepth) maxDepth = d;
  });
  nodes.forEach((n) => {
    if (!depthOf.has(n.id)) depthOf.set(n.id, maxDepth + 1);
  });

  // Group ids by depth, preserving original node order as tiebreaker
  const byDepth = new Map<number, string[]>();
  nodes.forEach((n) => {
    const d = depthOf.get(n.id)!;
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d)!.push(n.id);
  });

  const sortedDepths = [...byDepth.keys()].sort((a, b) => a - b);

  // Place each depth. Root level centres on x=0. Deeper levels position each
  // node near the average x of its already-placed parents, then sort and
  // enforce H_GAP so no two share the same x.
  for (const d of sortedDepths) {
    const ids = byDepth.get(d)!;
    const y = START_Y + d * ROW_HEIGHT;

    if (d === sortedDepths[0]) {
      const total = (ids.length - 1) * H_GAP;
      const startX = -total / 2;
      ids.forEach((id, i) => posMap.set(id, { x: startX + i * H_GAP, y }));
      continue;
    }

    const desired = new Map<string, number>();
    ids.forEach((id) => {
      const parents = (inEdges.get(id) ?? []).filter((p) => posMap.has(p));
      if (parents.length === 0) {
        desired.set(id, 0);
        return;
      }
      const avg = parents.reduce((s, p) => s + posMap.get(p)!.x, 0) / parents.length;
      desired.set(id, avg);
    });

    const sortedIds = [...ids].sort((a, b) => desired.get(a)! - desired.get(b)!);

    // First pass: place left-to-right, pushing right to maintain H_GAP
    let lastX = -Infinity;
    const tempX = new Map<string, number>();
    sortedIds.forEach((id) => {
      let x = desired.get(id)!;
      if (x < lastX + H_GAP) x = lastX + H_GAP;
      tempX.set(id, x);
      lastX = x;
    });

    // Second pass: re-centre the whole row on its desired midpoint
    const desiredMid =
      sortedIds.reduce((s, id) => s + desired.get(id)!, 0) / sortedIds.length;
    const actualMid =
      sortedIds.reduce((s, id) => s + tempX.get(id)!, 0) / sortedIds.length;
    const rowShift = desiredMid - actualMid;
    sortedIds.forEach((id) => posMap.set(id, { x: tempX.get(id)! + rowShift, y }));
  }

  // Shift so leftmost node sits at EDGE_PAD
  const minX = Math.min(...[...posMap.values()].map((p) => p.x));
  const shift = EDGE_PAD - minX;
  if (shift !== 0) {
    posMap.forEach((p, id) => posMap.set(id, { x: p.x + shift, y: p.y }));
  }

  return posMap;
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

  const posMap = useMemo(() => computeTreeLayout(dedupedNodes, rawEdges), [dedupedNodes, rawEdges]);

  const layoutNodes = useMemo(
    () =>
      dedupedNodes.map((node, i) => ({
        ...node,
        pos: posMap.get(node.id) ?? { x: EDGE_PAD, y: START_Y + i * ROW_HEIGHT },
        theme: NODE_THEME[node.type] || NODE_THEME.lesson,
        data: {
          label: node.label,
          type: node.type as SkillTreeNodeData["type"],
          status: node.status as SkillTreeNodeData["status"],
          mixedSkills: node.mixedSkills || [],
          questionTypes: node.questionTypes || [],
          description: node.description || "",
        } as SkillTreeNodeData,
      })),
    [dedupedNodes, posMap]
  );

  const nodeMap = useMemo(() => new Map(layoutNodes.map((n) => [n.id, n])), [layoutNodes]);

  const { canvasW, canvasH } = useMemo(() => {
    if (layoutNodes.length === 0) return { canvasW: 440, canvasH: 600 };
    const xs = layoutNodes.map((n) => n.pos.x);
    const ys = layoutNodes.map((n) => n.pos.y);
    return {
      canvasW: Math.max(560, Math.max(...xs) + NODE_R + EDGE_PAD + 80),
      canvasH: Math.max(600, Math.max(...ys) + 180),
    };
  }, [layoutNodes]);

  const handleClick = (node: typeof layoutNodes[0]) => {
    if (onNodeClick && node.data.status !== "locked") {
      onNodeClick(node.id, node.data);
    }
  };

  const rootX = layoutNodes[0]?.pos.x ?? canvasW / 2;

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

        {/* ── Node Layer ── */}
        {layoutNodes.map((node, idx) => {
          const { data, theme, pos } = node;
          const isActive = data.status === "active";
          const isCompleted = data.status === "completed";
          const isLocked = data.status === "locked";
          const isNew = data.status === "new";

          return (
            <div key={node.id}>
              {/* ── Node Circle ── */}
              <button
                onClick={() => handleClick(node)}
                disabled={isLocked}
                aria-label={`${data.label} — ${isCompleted ? "completed" : isLocked ? "locked" : isNew ? "new, tap to start" : "active, tap to continue"}`}
                className={`
                  absolute flex items-center justify-center rounded-full
                  transition-all duration-300 select-none outline-none
                  ${isActive ? "tower-active" : ""}
                  ${isNew ? "tower-new-node" : ""}
                  ${isLocked ? "cursor-not-allowed" : "cursor-pointer"}
                  ${!isActive && !isLocked && !isNew ? "hover:scale-110" : ""}
                `}
                style={{
                  width: NODE_SIZE,
                  height: NODE_SIZE,
                  left: pos.x - NODE_R,
                  top: pos.y - NODE_R,
                  background: isCompleted
                    ? "linear-gradient(135deg, #374151, #1f2937)"
                    : isLocked
                      ? "linear-gradient(135deg, #1e293b, #0f172a)"
                      : `linear-gradient(135deg, ${theme.bg}, ${theme.bgDark})`,
                  border: `3px solid ${isCompleted ? "#4b5563"
                      : isLocked ? "#1e293b"
                        : theme.border
                    }`,
                  boxShadow: isNew
                    ? `0 0 18px 6px ${theme.glow}`
                    : isActive
                      ? `0 0 16px 4px ${theme.glow}`
                      : isCompleted
                        ? "0 2px 8px rgba(0,0,0,0.3)"
                        : "none",
                  opacity: isLocked ? 0.65 : 1,
                  filter: isLocked ? "grayscale(0.6)" : "none",
                }}
              >
                {/* Spinning progress ring for active node */}
                <span aria-hidden="true"><ProgressRing color={theme.ring} active={isActive} /></span>

                {/* Icon */}
                <span
                  aria-hidden="true"
                  className={`leading-none z-10 flex items-center justify-center ${isActive ? "tower-float" : ""}`}
                  style={{ filter: isLocked ? "grayscale(1)" : "none", color: "white" }}
                >
                  {isCompleted
                    ? <CheckCircle2 size={22} />
                    : isLocked
                    ? <Lock size={22} />
                    : <theme.icon size={22} />}
                </span>
              </button>

              {/* ── Ambient glow below active node ── */}
              {isActive && (
                <div
                  aria-hidden="true"
                  className="absolute rounded-full pointer-events-none tower-glow-pulse"
                  style={{
                    width: NODE_SIZE + 32,
                    height: NODE_SIZE + 32,
                    left: pos.x - NODE_R - 16,
                    top: pos.y - NODE_R - 16,
                    background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`,
                  }}
                />
              )}

              {/* ── Step number badge ── */}
              <div
                aria-hidden="true"
                className="absolute pointer-events-none"
                style={{
                  width: 22,
                  height: 22,
                  left: pos.x + NODE_R - 8,
                  top: pos.y - NODE_R - 4,
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

              {/* ── Label (centred below the node circle) ── */}
              <div
                className="absolute pointer-events-none transition-opacity duration-300 text-center flex flex-col items-center"
                style={{
                  top: pos.y + NODE_R + 10,
                  left: pos.x - 75,
                  width: 150,
                  opacity: isLocked ? 0.65 : 1,
                }}
              >
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
                {isNew && (
                  <span
                    className="inline-block mt-1 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: theme.glow, color: theme.bgDark }}
                  >
                    NEW
                  </span>
                )}
                {(isActive && !isNew) && (
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
