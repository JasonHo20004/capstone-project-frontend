// =============================================================================
// Skill Tree Flow — Duolingo-style Vertical Tower
// Premium UI: large circle nodes, dotted trail, ambient glow, progress ring
// =============================================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
  root: { bg: "#fbbf24", bgDark: "#d97706", border: "#fde68a", glow: "rgba(251,191,36,0.5)", icon: Crown, ring: "#fde68a" },
  lesson: { bg: "#0070eb", bgDark: "#0058bc", border: "#7fb5ff", glow: "rgba(0,112,235,0.38)", icon: BookOpen, ring: "#7fb5ff" },
  challenge: { bg: "#fbbf24", bgDark: "#d97706", border: "#fde68a", glow: "rgba(251,191,36,0.4)", icon: Zap, ring: "#fde68a" },
  checkpoint: { bg: "#34d399", bgDark: "#059669", border: "#6ee7b7", glow: "rgba(52,211,153,0.4)", icon: Trophy, ring: "#6ee7b7" },
  remedial: { bg: "#fb923c", bgDark: "#ea580c", border: "#fed7aa", glow: "rgba(251,146,60,0.4)", icon: Wrench, ring: "#fed7aa" },
  practice: { bg: "#2dd4bf", bgDark: "#0d9488", border: "#99f6e4", glow: "rgba(45,212,191,0.4)", icon: Pencil, ring: "#99f6e4" },
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

// Idea 7: horizontal spacing between side-quest (remedial/practice) nodes
const SIDE_GAP = 190;

const SECTION_THEMES: Array<{ labelKey: string; gradient: string; accent: string }> = [
  { labelKey: "foundations",        gradient: "from-primary/70 to-primary-light/70",   accent: "#0070eb" },
  { labelKey: "skillBuilding",      gradient: "from-emerald-500/70 to-teal-500/70",  accent: "#34d399" },
  { labelKey: "realConversations",  gradient: "from-amber-500/70 to-orange-500/70", accent: "#fbbf24" },
  { labelKey: "mastery",            gradient: "from-rose-500/70 to-fuchsia-500/70",  accent: "#f472b6" },
  { labelKey: "beyond",             gradient: "from-violet-500/70 to-purple-500/70", accent: "#a78bfa" },
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

  // Side-quest nodes: AI-generated supplementary nodes from the branch flow
  // ("remedial" / "practice") lie HORIZONTALLY beside their parent; only main
  // nodes (root/lesson/challenge/checkpoint/chest) form the vertical tower.
  const sideIds = new Set(
    nodes.filter((n) => n.type === "remedial" || n.type === "practice").map((n) => n.id)
  );
  const mainNodes = nodes.filter((n) => !sideIds.has(n.id));

  // The backend splices side nodes INTO the chain (parent → side_1 → … → next,
  // replacing the direct edge), so contract those chains into effective main
  // edges parent → next. Without this, every main node downstream of a branch
  // loses its parent and collapses to depth 0 (the overlap bug).
  const effChildren = new Map<string, string[]>();
  const effParents = new Map<string, string[]>();
  mainNodes.forEach((n) => {
    effChildren.set(n.id, []);
    effParents.set(n.id, []);
  });
  mainNodes.forEach((n) => {
    const reached: string[] = [];
    const visited = new Set<string>();
    const stack = [...(outEdges.get(n.id) ?? [])];
    while (stack.length > 0) {
      const t = stack.pop()!;
      if (visited.has(t)) continue;
      visited.add(t);
      if (sideIds.has(t)) {
        stack.push(...(outEdges.get(t) ?? []));
      } else {
        reached.push(t);
      }
    }
    effChildren.set(n.id, reached);
    reached.forEach((c) => effParents.get(c)!.push(n.id));
  });

  // BFS depth over main nodes only, following effective edges
  const roots = mainNodes.filter((n) => (effParents.get(n.id) ?? []).length === 0);
  const startSeeds = roots.length > 0 ? roots.map((n) => n.id) : [mainNodes[0]?.id].filter(Boolean) as string[];

  const depthOf = new Map<string, number>();
  const queue: Array<{ id: string; depth: number }> = startSeeds.map((id) => ({ id, depth: 0 }));
  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    const prev = depthOf.get(id);
    if (prev !== undefined && prev <= depth) continue;
    depthOf.set(id, depth);
    for (const child of effChildren.get(id) ?? []) {
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
      const parents = (effParents.get(id) ?? []).filter((p) => posMap.has(p));
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

  // Place side-quest chains horizontally beside their parent:
  // parent → side_1 → side_2 extends sideways on the SAME row.
  mainNodes.forEach((p) => {
    const parentPos = posMap.get(p.id);
    if (!parentPos) return;
    const heads = (outEdges.get(p.id) ?? []).filter((t) => sideIds.has(t) && !posMap.has(t));
    if (heads.length === 0) return;

    // Walk the chains in order (across multiple heads, slots keep advancing)
    const chainNodes: string[] = [];
    const seen = new Set<string>();
    heads.forEach((head) => {
      let cur: string | undefined = head;
      while (cur && sideIds.has(cur) && !seen.has(cur)) {
        seen.add(cur);
        chainNodes.push(cur);
        cur = (outEdges.get(cur) ?? []).find((t) => sideIds.has(t));
      }
    });

    // Prefer extending right; flip left if a main node in this row blocks it
    const span = (chainNodes.length + 0.5) * SIDE_GAP;
    const rowXs = mainNodes
      .filter((m) => m.id !== p.id)
      .map((m) => posMap.get(m.id))
      .filter((pp): pp is { x: number; y: number } => !!pp && Math.abs(pp.y - parentPos.y) < 1)
      .map((pp) => pp.x);
    const blockedRight = rowXs.some((x) => x > parentPos.x && x < parentPos.x + span);
    const blockedLeft = rowXs.some((x) => x < parentPos.x && x > parentPos.x - span);
    const dir = blockedRight && !blockedLeft ? -1 : 1;

    chainNodes.forEach((id, i) => {
      posMap.set(id, { x: parentPos.x + dir * (i + 1) * SIDE_GAP, y: parentPos.y });
    });
  });

  // Orphan side nodes (no reachable main parent) drop below the tree
  nodes.forEach((n) => {
    if (!posMap.has(n.id)) posMap.set(n.id, { x: 0, y: yForDepth(maxDepth + 1) });
  });

  // Idea 2: tag each node with its section index based on depth; side-quest
  // nodes inherit the section of their nearest main ancestor.
  const sideSection = (id: string): number => {
    const seen = new Set<string>();
    let cur: string | undefined = id;
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      const parents = inEdges.get(cur) ?? [];
      const mainParent = parents.find((p) => !sideIds.has(p));
      if (mainParent !== undefined) {
        return Math.floor((depthOf.get(mainParent) ?? 0) / SECTION_SIZE);
      }
      cur = parents.find((p) => sideIds.has(p));
    }
    return 0;
  };
  nodes.forEach((n) => {
    sectionOf.set(
      n.id,
      sideIds.has(n.id)
        ? sideSection(n.id)
        : Math.floor((depthOf.get(n.id) ?? 0) / SECTION_SIZE)
    );
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

const STYLE_ID = "skill-tower-styles-v3";

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
    /* Locked-node feedback. --shape-rot keeps diamond nodes rotated while the
       animation owns the transform property. */
    @keyframes tower-shake {
      0%, 100% { transform: translateX(0) rotate(var(--shape-rot, 0deg)); }
      20% { transform: translateX(-5px) rotate(var(--shape-rot, 0deg)); }
      40% { transform: translateX(5px) rotate(var(--shape-rot, 0deg)); }
      60% { transform: translateX(-4px) rotate(var(--shape-rot, 0deg)); }
      80% { transform: translateX(4px) rotate(var(--shape-rot, 0deg)); }
    }
    .tower-shake {
      animation: tower-shake 0.4s ease-in-out;
    }
    @keyframes tower-mascot-bob {
      0%, 100% { transform: translateY(0) rotate(-8deg); }
      50% { transform: translateY(-6px) rotate(4deg); }
    }
    .tower-mascot {
      animation: tower-mascot-bob 2.2s ease-in-out infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      .tower-active, .tower-float, .tower-edge-flow, .tower-glow-pulse,
      .tower-chest-shimmer, .tower-shake, .tower-mascot, .tower-new-node {
        animation: none;
      }
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
  const color = completed ? "#34d399" : animated ? "#fbbf24" : "#cbd5e1";
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
  const { t } = useTranslation("exam");
  injectStyles();

  const wrapperRef = useRef<HTMLDivElement>(null); // horizontal scroll container
  const canvasRef = useRef<HTMLDivElement>(null);  // positioned canvas (for page Y)
  const autoScrolledRef = useRef(false);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(shakeTimerRef.current), []);

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

  // Step numbers follow visual (top-to-bottom) order over MAIN nodes only —
  // side-quest nodes (remedial/practice) don't consume a step number.
  const stepNumberOf = useMemo(() => {
    const ordered = [...layoutNodes]
      .filter((n) => n.data.type !== "remedial" && n.data.type !== "practice")
      .sort((a, b) => a.pos.y - b.pos.y || a.pos.x - b.pos.x);
    const m = new Map<string, number>();
    ordered.forEach((n, i) => m.set(n.id, i + 1));
    return m;
  }, [layoutNodes]);

  const { canvasW, canvasH } = useMemo(() => {
    if (layoutNodes.length === 0) return { canvasW: 440, canvasH: 600 };
    const xs = layoutNodes.map((n) => n.pos.x);
    const ys = layoutNodes.map((n) => n.pos.y);
    return {
      canvasW: Math.max(640, Math.max(...xs) + ROOT_R + EDGE_PAD + 80),
      canvasH: Math.max(600, Math.max(...ys) + 220),
    };
  }, [layoutNodes]);

  // Auto-center the node the learner should do next — resuming a long tree
  // used to land at the very top, far from where they left off.
  useEffect(() => {
    if (autoScrolledRef.current || layoutNodes.length === 0) return;
    const target =
      layoutNodes.find((n) => n.data.status === "active") ??
      layoutNodes.find((n) => n.data.status === "new");
    if (!target) return;
    autoScrolledRef.current = true;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const behavior: ScrollBehavior = reduce ? "auto" : "smooth";

    const canvasTop = canvasRef.current?.getBoundingClientRect().top ?? 0;
    const targetY = canvasTop + window.scrollY + target.pos.y - window.innerHeight / 2;
    if (targetY > 80) window.scrollTo({ top: targetY, behavior });

    const wrapper = wrapperRef.current;
    if (wrapper && wrapper.scrollWidth > wrapper.clientWidth) {
      wrapper.scrollTo({ left: Math.max(0, target.pos.x - wrapper.clientWidth / 2), behavior });
    }
  }, [layoutNodes]);

  const handleClick = (node: typeof layoutNodes[0]) => {
    if (node.data.status === "locked") {
      // Feedback instead of a dead click: shake the node + explain why.
      setShakeId(node.id);
      clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = setTimeout(() => setShakeId(null), 450);
      toast(t("skillTree.flow.lockedHint"), { id: "skilltree-locked" });
      return;
    }
    onNodeClick?.(node.id, node.data);
  };

  const rootX = layoutNodes[0]?.pos.x ?? canvasW / 2;

  // Idea 2: virtual chest at the end of each section (decorative reward marker
  // shown beside the banner). One chest per banner = one per section boundary.

  return (
    <div className="w-full overflow-x-auto" ref={wrapperRef}>
      <div className="relative mx-auto" ref={canvasRef} style={{ width: canvasW, height: canvasH }}>

        {/* ── SVG Layer: trails ── */}
        <svg className="absolute inset-0 pointer-events-none" width={canvasW} height={canvasH}>
          {/* Ambient vertical line along main path */}
          <line
            x1={rootX} y1={0} x2={rootX} y2={canvasH}
            stroke="#cbd5e1"
            strokeWidth={1}
            strokeDasharray="4 8"
            opacity={0.7}
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
                    {t("skillTree.flow.section", { num: banner.sectionIndex + 1 })}
                  </div>
                  <div className="text-base font-black leading-tight drop-shadow">
                    {t(`skillTree.flow.sections.${theme.labelKey}`)}
                  </div>
                </div>
                <div className="text-white/80 text-[10px] font-bold uppercase tracking-wider ml-2 hidden sm:block">
                  {t("skillTree.flow.bonusXp")}
                </div>
              </div>
            </div>
          );
        })}

        {/* ── Node Layer ── */}
        {layoutNodes.map((node) => {
          const { data, theme, pos, shape, sizing } = node;
          const isActive = data.status === "active";
          const isCompleted = data.status === "completed";
          const isLocked = data.status === "locked";
          const isNew = data.status === "new";
          const isRemedial = data.type === "remedial";
          const isSideQuest = isRemedial || data.type === "practice";
          const isRoot = data.type === "root";
          const isChest = data.type === "chest";

          // Idea 5: shape-specific button styling. --shape-rot feeds the
          // tower-shake keyframes so a shaking diamond keeps its rotation.
          const shapeStyle: React.CSSProperties = (() => {
            if (shape === "diamond")        return { borderRadius: 14, transform: "rotate(45deg)", ["--shape-rot" as never]: "45deg" };
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
                aria-disabled={isLocked}
                aria-label={`${data.label} — ${
                  isCompleted ? t("skillTree.flow.aria.completed")
                    : isLocked ? t("skillTree.flow.aria.locked")
                      : isNew ? t("skillTree.flow.aria.newStart")
                        : t("skillTree.flow.aria.activeContinue")
                }`}
                className={`
                  absolute flex items-center justify-center
                  transition-all duration-300 select-none outline-none
                  ${isActive ? "tower-active" : ""}
                  ${isNew ? "tower-new-node" : ""}
                  ${isChest ? "tower-chest-shimmer" : ""}
                  ${shakeId === node.id ? "tower-shake" : ""}
                  ${isLocked ? "cursor-not-allowed" : "cursor-pointer"}
                  ${!isActive && !isLocked && !isNew ? "hover:scale-110" : ""}
                `}
                style={{
                  width: sizing.size,
                  height: sizing.size,
                  left: pos.x - sizing.r,
                  top: pos.y - sizing.r,
                  background: isCompleted
                    ? "linear-gradient(135deg, #34d399, #059669)"
                    : isLocked
                      ? "linear-gradient(135deg, #cbd5e1, #94a3b8)"
                      : `linear-gradient(135deg, ${theme.bg}, ${theme.bgDark})`,
                  border: `${isRoot ? 4 : 3}px solid ${
                    isCompleted ? "#6ee7b7"
                      : isLocked ? "#e2e8f0"
                        : isRoot ? "#fde047"
                          : theme.border
                  }`,
                  boxShadow: isNew
                    ? `0 0 18px 6px ${theme.glow}`
                    : isActive || isRoot
                      ? `0 0 18px 5px ${theme.glow}`
                      : isCompleted
                        ? "0 4px 14px rgba(5,150,105,0.28)"
                        : "none",
                  opacity: isLocked ? 0.9 : 1,
                  filter: "none",
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
                  style={{ color: isLocked ? "#475569" : "white", ...iconCounterRotate }}
                >
                  {isCompleted
                    ? <CheckCircle2 size={isRoot ? 28 : 22} />
                    : isLocked
                    ? <Lock size={isRoot ? 28 : 22} />
                    : <theme.icon size={isRoot ? 30 : isRemedial ? 18 : 22} />}
                </span>
              </button>

              {/* ── Brand mascot perched beside the node the learner is on ── */}
              {isActive && (
                <div
                  aria-hidden="true"
                  className="absolute pointer-events-none select-none tower-mascot"
                  style={{
                    left: pos.x - sizing.r - 30,
                    top: pos.y - sizing.r - 22,
                    fontSize: 26,
                    lineHeight: 1,
                    zIndex: 5,
                    filter: "drop-shadow(0 2px 4px rgba(15,23,42,0.35))",
                  }}
                >
                  🐧
                </div>
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

              {/* ── Step number badge (skip for side-quest nodes — they don't
                     consume a step in the main chain) ── */}
              {!isSideQuest && (
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
                        : "#94a3b8",
                    border: `2px solid ${isCompleted ? "#34d399" : isActive ? theme.border : "#cbd5e1"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: isLocked ? 0.3 : 1,
                  }}
                >
                  <span className="text-[9px] font-black text-white leading-none">
                    {stepNumberOf.get(node.id)}
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
                      backgroundColor: "rgba(255, 237, 213, 0.92)",
                      color: "#c2410c",
                      backdropFilter: "blur(2px)",
                      boxShadow: "0 1px 3px rgba(15,23,42,0.1)",
                      maxWidth: "100%",
                    }}
                  >
                    <RefreshCw size={10} className="shrink-0" />
                    <span className="truncate">{t("skillTree.flow.review", { label: data.label })}</span>
                  </p>
                ) : (
                  <p
                    className="text-[11px] font-bold text-foreground leading-snug line-clamp-2 px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.88)",
                      backdropFilter: "blur(2px)",
                      boxShadow: "0 1px 3px rgba(15,23,42,0.12)",
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
                    {t("skillTree.flow.new")}
                  </span>
                )}
                {(isActive && !isNew && !isRemedial) && (
                  <span className="mt-1 text-[10px] text-primary font-semibold px-1.5 py-0.5 rounded bg-white/80 shadow-sm">
                    {t("skillTree.flow.tapToStart")}
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
          <div className="text-muted-foreground text-xs font-medium">
            {t("skillTree.flow.completedCount", {
              done: layoutNodes.filter((n) => n.data.status === "completed").length,
              total: layoutNodes.length,
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
