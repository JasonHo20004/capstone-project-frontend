import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import apiClient from "@/lib/api/config";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getUserId(): string | null {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || payload.userId || payload.id || null;
  } catch { return null; }
}

function relativeTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return d.toLocaleDateString("vi-VN");
}

function bandColor(band: number): string {
  if (band >= 7) return "text-emerald-600";
  if (band >= 5) return "text-blue-600";
  if (band >= 4) return "text-amber-600";
  return "text-red-600";
}

function bandBg(band: number): string {
  if (band >= 7) return "bg-emerald-50 border-emerald-200";
  if (band >= 5) return "bg-blue-50 border-blue-200";
  if (band >= 4) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

function bandBarColor(band: number): string {
  if (band >= 7) return "bg-emerald-500";
  if (band >= 5) return "bg-blue-500";
  if (band >= 4) return "bg-amber-500";
  return "bg-red-500";
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TestHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "READING" | "LISTENING">("all");

  useEffect(() => {
    const userId = getUserId();
    if (!userId) { setLoading(false); return; }
    apiClient.get(`/tests/history/${userId}`)
      .then(r => setHistory(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return history;
    return history.filter((h: any) =>
      h.test?.testSkills?.some((s: any) => s.skill === filter)
    );
  }, [history, filter]);

  const stats = useMemo(() => {
    if (history.length === 0) return { total: 0, avg: 0, best: 0 };
    const scores = history.map((h: any) => {
      const raw = h.rawScoresBySkill || {};
      return raw.bandScore ?? h.overallScaledScore ?? 0;
    });
    return {
      total: history.length,
      avg: +(scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1),
      best: Math.max(...scores),
    };
  }, [history]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!getUserId()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-5xl text-slate-300">lock</span>
          <p className="text-slate-500">Vui lòng đăng nhập để xem lịch sử</p>
          <Link to="/login" className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/exam" className="text-slate-400 hover:text-slate-600 transition">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800">📊 Lịch sử làm bài</h1>
              <p className="text-xs text-slate-500 mt-0.5">{stats.total} lần làm bài</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/my-progress" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">analytics</span>
              Thống kê
            </Link>
            <Link to="/exam" className="text-sm text-slate-500 hover:text-slate-700 font-medium transition">
              ← Exam Center
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Stats Cards */}
        {history.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Tổng bài thi</p>
              <p className="text-3xl font-bold text-indigo-600 mt-1">{stats.total}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Band trung bình</p>
              <p className={`text-3xl font-bold mt-1 ${bandColor(stats.avg)}`}>{stats.avg}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Band cao nhất</p>
              <p className={`text-3xl font-bold mt-1 ${bandColor(stats.best)}`}>{stats.best}</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2">
          {(["all", "READING", "LISTENING"] as const).map(f => (
            <button key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                filter === f
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f === "all" ? "Tất cả" : f === "READING" ? "📖 Reading" : "🎧 Listening"}
            </button>
          ))}
        </div>

        {/* History List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <span className="material-symbols-outlined text-6xl text-slate-200">quiz</span>
            <p className="text-slate-400 text-lg">Chưa có lịch sử làm bài</p>
            <Link to="/exam" className="inline-block mt-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium">
              Làm bài ngay →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((h: any) => {
              const raw = h.rawScoresBySkill || {};
              const band = raw.bandScore ?? h.overallScaledScore ?? 0;
              const skill = h.test?.testSkills?.[0]?.skill || "READING";
              return (
                <Link key={h.id}
                  to={`/exam/result/${h.id}`}
                  className={`block bg-white rounded-2xl border p-5 hover:shadow-md transition-all group ${bandBg(band)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                          skill === "LISTENING"
                            ? "bg-teal-100 text-teal-700"
                            : "bg-indigo-100 text-indigo-700"
                        }`}>
                          {skill}
                        </span>
                        <span className="text-xs text-slate-400">{relativeTime(new Date(h.createdAt))}</span>
                      </div>
                      <p className="font-semibold text-slate-800 truncate group-hover:text-indigo-700 transition">
                        {h.test?.title || "Bài thi"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {raw.correct ?? 0}/{raw.total ?? 0} câu đúng · {h.test?.durationInMinutes || "—"} phút
                      </p>
                    </div>
                    <div className="text-right pl-4">
                      <p className={`text-3xl font-bold ${bandColor(band)}`}>{band.toFixed ? band.toFixed(1) : band}</p>
                      <p className="text-xs text-slate-400 mt-0.5">band</p>
                    </div>
                  </div>
                  {/* Mini bar */}
                  <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${bandBarColor(band)}`}
                      style={{ width: `${Math.round((band / 9) * 100)}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
