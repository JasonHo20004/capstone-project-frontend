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

// ─── Tree-Based Layout ──────────────────────────────────────────────────────────
// Main path stays centered; remedial branches expand horizontally left/right.

// H_GAP: horizontal distance between adjacent leaf-node centres
const H_GAP = 180;
const ROW_HEIGHT = 160;
const START_Y = 80;
const EDGE_PAD = 80;

/**
 * Recursive subtree-width layout (Reingold-Tilford style).
 * Every node is centred over its subtree, so siblings always get
 * distinct x coordinates regardless of node type.
 */
function computeTreeLayout(
  nodes: Array<{ id: string; type: string }>,
  edges: Array<{ source: string; target: string }>
): Map<string, { x: number; y: number }> {
  const posMap = new Map<string, { x: number; y: number }>();
  if (nodes.length === 0) return posMap;

  const childrenOf = new Map<string, string[]>();
  const parentOf = new Map<string, string>();
  nodes.forEach((n) => childrenOf.set(n.id, []));
  edges.forEach((e) => {
    childrenOf.get(e.source)?.push(e.target);
    parentOf.set(e.target, e.source);
  });

  const root = nodes.find((n) => !parentOf.has(n.id)) ?? nodes[0];

  // Memoised leaf-count for each subtree
  const widthOf = new Map<string, number>();
  function subtreeWidth(id: string): number {
    if (widthOf.has(id)) return widthOf.get(id)!;
    const children = childrenOf.get(id) ?? [];
    const w = children.length === 0 ? 1 : children.reduce((s, c) => s + subtreeWidth(c), 0);
    widthOf.set(id, w);
    return w;
  }

  // Each node is centred over its full subtree span
  const placed = new Set<string>();
  function place(id: string, depth: number, centerX: number) {
    if (placed.has(id)) return;
    placed.add(id);
    posMap.set(id, { x: centerX, y: START_Y + depth * ROW_HEIGHT });
    const children = childrenOf.get(id) ?? [];
    if (children.length === 0) return;
    const total = children.reduce((s, c) => s + subtreeWidth(c), 0);
    let left = centerX - (total * H_GAP) / 2;
    for (const cid of children) {
      const w = subtreeWidth(cid);
      place(cid, depth + 1, left + (w * H_GAP) / 2);
      left += w * H_GAP;
    }
  }

  place(root.id, 0, 0);

  // Fallback for nodes not reachable from root
  nodes.forEach((n, i) => {
    if (!posMap.has(n.id)) posMap.set(n.id, { x: 0, y: START_Y + i * ROW_HEIGHT });
  });

  // Shift so leftmost node is at EDGE_PAD
  const minX = Math.min(...[...posMap.values()].map((p) => p.x));
  const shift = EDGE_PAD - minX;
  if (shift !== 0) posMap.forEach((p, id) => posMap.set(id, { x: p.x + shift, y: p.y }));

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

  const posMap = useMemo(() => computeTreeLayout(rawNodes, rawEdges), [rawNodes, rawEdges]);

  const layoutNodes = useMemo(
    () =>
      rawNodes.map((node, i) => ({
        ...node,
        pos: posMap.get(node.id) || { x: CENTER_X, y: START_Y + i * ROW_HEIGHT },
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
    [rawNodes, posMap]
  );

  const nodeMap = useMemo(() => new Map(layoutNodes.map((n) => [n.id, n])), [layoutNodes]);

  const { canvasW, canvasH } = useMemo(() => {
    if (layoutNodes.length === 0) return { canvasW: 440, canvasH: 600 };
    const xs = layoutNodes.map((n) => n.pos.x);
    const ys = layoutNodes.map((n) => n.pos.y);
    return {
      canvasW: Math.max(440, Math.max(...xs) + 70 + EDGE_PAD),
      canvasH: Math.max(600, Math.max(...ys) + 140),
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
                    ? `0 0 24px 8px ${theme.glow}, 0 0 48px 16px ${theme.glow}`
                    : isActive
                      ? `0 0 20px 4px ${theme.glow}`
                      : isCompleted
                        ? "0 2px 8px rgba(0,0,0,0.3)"
                        : "none",
                  opacity: isLocked ? 0.35 : 1,
                  filter: isLocked ? "grayscale(0.8)" : "none",
                }}
              >
                {/* Spinning progress ring for active node */}
                <ProgressRing color={theme.ring} active={isActive} />

                {/* Icon */}
                <span
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
                className="absolute pointer-events-none transition-opacity duration-300 text-center"
                style={{
                  top: pos.y + NODE_R + 6,
                  left: pos.x - 70,
                  width: 140,
                  opacity: isLocked ? 0.25 : 0.95,
                }}
              >
                <p className="text-[12px] font-bold text-white leading-tight drop-shadow-sm line-clamp-2">
                  {data.label}
                </p>
                {isNew && (
                  <span
                    className="inline-block mt-0.5 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: theme.glow, color: theme.bgDark }}
                  >
                    MỚI
                  </span>
                )}
                {isActive && (
                  <span className="block mt-0.5 text-[10px] text-slate-400 font-medium">
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
