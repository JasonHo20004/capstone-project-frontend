// =============================================================================
// Skill Tree Flow — Duolingo-style Vertical Tower
// Premium UI: large circle nodes, dotted trail, ambient glow, progress ring
// =============================================================================

import { useMemo } from "react";

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
  icon: string;
  ring: string;
}> = {
  root: { bg: "#818cf8", bgDark: "#4f46e5", border: "#a5b4fc", glow: "rgba(129,140,248,0.5)", icon: "🎯", ring: "#a5b4fc" },
  lesson: { bg: "#60a5fa", bgDark: "#2563eb", border: "#93c5fd", glow: "rgba(96,165,250,0.4)", icon: "📖", ring: "#93c5fd" },
  challenge: { bg: "#fbbf24", bgDark: "#d97706", border: "#fde68a", glow: "rgba(251,191,36,0.4)", icon: "⚡", ring: "#fde68a" },
  checkpoint: { bg: "#34d399", bgDark: "#059669", border: "#6ee7b7", glow: "rgba(52,211,153,0.4)", icon: "🏆", ring: "#6ee7b7" },
  remedial: { bg: "#f87171", bgDark: "#dc2626", border: "#fca5a5", glow: "rgba(248,113,113,0.4)", icon: "🔧", ring: "#fca5a5" },
  practice: { bg: "#a78bfa", bgDark: "#7c3aed", border: "#c4b5fd", glow: "rgba(167,139,250,0.4)", icon: "✏️", ring: "#c4b5fd" },
};

// ─── Winding S-Curve Layout ─────────────────────────────────────────────────────

function computeLayout(nodeCount: number) {
  const positions: Array<{ x: number; y: number }> = [];
  const GAP = 130;
  const CX = 220;
  const AMP = 70;

  for (let i = 0; i < nodeCount; i++) {
    const x = CX + Math.sin((i * Math.PI) / 2) * AMP;
    const y = 70 + i * GAP;
    positions.push({ x, y });
  }
  return positions;
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

  const positions = useMemo(() => computeLayout(rawNodes.length), [rawNodes.length]);

  const layoutNodes = useMemo(
    () =>
      rawNodes.map((node, i) => ({
        ...node,
        pos: positions[i] || { x: 220, y: 70 + i * 130 },
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
    [rawNodes, positions]
  );

  const nodeMap = useMemo(() => new Map(layoutNodes.map((n) => [n.id, n])), [layoutNodes]);

  const canvasH = useMemo(
    () => Math.max(600, rawNodes.length * 130 + 140),
    [rawNodes.length]
  );

  const handleClick = (node: typeof layoutNodes[0]) => {
    if (onNodeClick && node.data.status !== "locked") {
      onNodeClick(node.id, node.data);
    }
  };

  return (
    <div className="w-full">
      <div className="relative mx-auto" style={{ width: 440, height: canvasH }}>

        {/* ── SVG Layer: trails ── */}
        <svg className="absolute inset-0 pointer-events-none" width={440} height={canvasH}>
          {/* Ambient vertical line */}
          <line
            x1={220} y1={0} x2={220} y2={canvasH}
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

          // Determine which side label goes
          const isRight = Math.sin((idx * Math.PI) / 2) >= 0;

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
                  className={`text-2xl leading-none z-10 ${isActive ? "tower-float" : ""}`}
                  style={{ filter: isLocked ? "grayscale(1)" : "none" }}
                >
                  {isCompleted ? "✅" : isLocked ? "🔒" : theme.icon}
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

              {/* ── Label ── */}
              <div
                className={`absolute pointer-events-none transition-opacity duration-300`}
                style={{
                  top: pos.y - 10,
                  ...(isRight
                    ? { left: pos.x + NODE_R + 20 }
                    : { right: 440 - pos.x + NODE_R + 20 }),
                  maxWidth: 140,
                  opacity: isLocked ? 0.25 : 0.95,
                }}
              >
                <p className="text-[13px] font-bold text-white leading-tight drop-shadow-sm">
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
