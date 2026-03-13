import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import apiClient from "@/lib/api/config";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SkillNode {
  id: string;
  label: string;
  type: "root" | "practice" | "remedial" | "challenge";
  position: { x: number; y: number };
  description?: string;
  status?: "new" | "completed" | "active";
}

interface SkillEdge {
  id: string;
  source: string;
  target: string;
}

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  root: { bg: "bg-indigo-600", border: "border-indigo-400", text: "text-white" },
  practice: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-800" },
  remedial: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-800" },
  challenge: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-800" },
};

export default function SkillTree() {
  const [nodes, setNodes] = useState<SkillNode[]>([]);
  const [edges, setEdges] = useState<SkillEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);

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

  // Fetch skill tree on mount
  useEffect(() => {
    const fetchTree = async () => {
      try {
        const resp = await apiClient.get(`/ai/skill-tree/${getUserId()}`);
        const data = resp.data?.data;
        if (data) {
          setNodes(data.nodes || []);
          setEdges(data.edges || []);
        }
      } catch (err) {
        console.error("Failed to load skill tree:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTree();
  }, []);

  // SVG dimensions
  const svgWidth = 900;
  const svgHeight = useMemo(() => {
    if (nodes.length === 0) return 500;
    const maxY = Math.max(...nodes.map(n => n.position?.y || 0));
    return Math.max(500, maxY + 200);
  }, [nodes]);

  // Draw edges as SVG lines
  const edgeLines = useMemo(() => {
    return edges.map(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (!source || !target) return null;
      return (
        <line
          key={edge.id}
          x1={source.position.x + 80}
          y1={source.position.y + 30}
          x2={target.position.x + 80}
          y2={target.position.y}
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="6,4"
          markerEnd="url(#arrowhead)"
        />
      );
    }).filter(Boolean);
  }, [nodes, edges]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            <span className="material-symbols-outlined text-lg">account_tree</span>
          </div>
          <h1 className="font-bold text-slate-800">AI Skill Tree</h1>
        </div>
        <Link to="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          ← Back to Dashboard
        </Link>
      </header>

      <div className="max-w-6xl mx-auto p-8">
        {/* Legend */}
        <div className="flex items-center gap-6 mb-6 bg-white rounded-xl p-4 border border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Legend:</span>
          {Object.entries(TYPE_COLORS).map(([type, colors]) => (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${colors.bg} border ${colors.border}`}></div>
              <span className="text-xs font-medium text-slate-600 capitalize">{type}</span>
            </div>
          ))}
        </div>

        {/* Skill Tree Canvas */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-auto relative" style={{ minHeight: svgHeight + 100 }}>
          <svg width={svgWidth} height={svgHeight + 50} className="relative">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
              </marker>
            </defs>
            {edgeLines}
          </svg>

          {/* Nodes (absolutely positioned) */}
          {nodes.map(node => {
            const colors = TYPE_COLORS[node.type] || TYPE_COLORS.practice;
            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={`absolute rounded-xl px-4 py-3 border-2 cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${colors.bg} ${colors.border} ${colors.text} ${
                  node.status === "new" ? "animate-pulse ring-2 ring-amber-400 ring-offset-2" : ""
                }`}
                style={{
                  left: node.position.x,
                  top: node.position.y + 12, // offset for SVG padding
                  minWidth: 160,
                  maxWidth: 200,
                }}
              >
                <p className="font-bold text-sm leading-tight">{node.label}</p>
                {node.description && (
                  <p className="text-xs opacity-70 mt-1 leading-snug">{node.description}</p>
                )}
                {node.status === "new" && (
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">NEW</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Node Detail */}
        {selectedNode && (
          <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-lg text-slate-800 mb-2">{selectedNode.label}</h3>
            <p className="text-sm text-slate-600">{selectedNode.description || "No description"}</p>
            <div className="flex items-center gap-4 mt-4">
              <span className={`text-xs font-bold px-2.5 py-1 rounded capitalize ${TYPE_COLORS[selectedNode.type]?.bg} ${TYPE_COLORS[selectedNode.type]?.text}`}>
                {selectedNode.type}
              </span>
              {selectedNode.status && (
                <span className="text-xs text-slate-500">Status: {selectedNode.status}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
