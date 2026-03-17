import { Link } from "react-router-dom";
import { useUserWritingEvaluations } from "@/hooks/api/use-ai-evaluation";

function getUserId(): string | undefined {
  try {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.sub || payload.userId || payload.id;
    }
  } catch { /* ignore */ }
  return undefined;
}

function getBandLabel(band: number | null): string {
  if (!band) return "—";
  if (band >= 8.5) return "Expert";
  if (band >= 7.5) return "Very Good";
  if (band >= 6.5) return "Competent";
  if (band >= 5.5) return "Modest";
  if (band >= 4.5) return "Limited";
  return "Basic";
}

function getBandColor(band: number | null): string {
  if (!band) return "text-slate-400";
  if (band >= 8) return "text-emerald-600";
  if (band >= 7) return "text-teal-600";
  if (band >= 6) return "text-blue-600";
  if (band >= 5) return "text-amber-600";
  return "text-red-500";
}

function getBandBg(band: number | null): string {
  if (!band) return "bg-slate-50 border-slate-200";
  if (band >= 8) return "bg-emerald-50 border-emerald-200";
  if (band >= 7) return "bg-teal-50 border-teal-200";
  if (band >= 6) return "bg-blue-50 border-blue-200";
  if (band >= 5) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "...";
}

export default function WritingHistory() {
  const userId = getUserId();
  const { data: evaluations, isLoading, error } = useUserWritingEvaluations(userId);

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link to="/exam" className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[18px]">edit_note</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm leading-tight">Writing Assessment History</h1>
            <span className="text-[11px] text-slate-500">Lịch sử bài viết đã nộp</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/my-progress" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition">
            <span className="material-symbols-outlined text-[16px]">analytics</span>
            Thống kê
          </Link>
          <Link to="/exam/history" className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition">
            <span className="material-symbols-outlined text-[16px]">menu_book</span>
            Reading/Listening History
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats Bar */}
        {evaluations && evaluations.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-black text-indigo-600">{evaluations.length}</p>
              <p className="text-xs text-slate-500 font-medium">Tổng bài viết</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className={`text-2xl font-black ${getBandColor(
                evaluations.filter(e => e.overallBand).length > 0
                  ? Math.max(...evaluations.filter(e => e.overallBand).map(e => e.overallBand!))
                  : null
              )}`}>
                {evaluations.filter(e => e.overallBand).length > 0
                  ? Math.max(...evaluations.filter(e => e.overallBand).map(e => e.overallBand!))
                  : "—"}
              </p>
              <p className="text-xs text-slate-500 font-medium">Band cao nhất</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className={`text-2xl font-black ${getBandColor(
                evaluations.filter(e => e.overallBand).length > 0
                  ? Number((evaluations.filter(e => e.overallBand).reduce((s, e) => s + e.overallBand!, 0) / evaluations.filter(e => e.overallBand).length).toFixed(1))
                  : null
              )}`}>
                {evaluations.filter(e => e.overallBand).length > 0
                  ? (evaluations.filter(e => e.overallBand).reduce((s, e) => s + e.overallBand!, 0) / evaluations.filter(e => e.overallBand).length).toFixed(1)
                  : "—"}
              </p>
              <p className="text-xs text-slate-500 font-medium">Band trung bình</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4 mx-auto" />
              <p className="text-slate-500 text-sm">Đang tải lịch sử...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <span className="material-symbols-outlined text-red-500 text-3xl mb-2 block">error</span>
            <p className="text-sm text-red-600">Không thể tải lịch sử. Vui lòng thử lại.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && evaluations && evaluations.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <span className="material-symbols-outlined text-slate-300 text-6xl mb-4 block">edit_note</span>
            <h3 className="text-lg font-bold text-slate-700 mb-2">Chưa có bài viết nào</h3>
            <p className="text-slate-500 text-sm mb-6">Bắt đầu luyện Writing để xem lịch sử ở đây.</p>
            <Link to="/exam/test/writing" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors">
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Viết bài ngay
            </Link>
          </div>
        )}

        {/* History List */}
        {evaluations && evaluations.length > 0 && (
          <div className="space-y-4">
            {evaluations.map((ev) => {
              const band = ev.overallBand;
              const criteria = ev.criteria;
              const isCompleted = ev.status === "COMPLETED";
              const isPending = ev.status === "PENDING" || ev.status === "PROCESSING";

              return (
                <div key={ev.id} className={`bg-white rounded-xl border ${isCompleted ? 'border-slate-200' : 'border-amber-200'} shadow-sm hover:shadow-md transition-all overflow-hidden`}>
                  <div className="flex">
                    {/* Score Section */}
                    <div className={`w-28 shrink-0 flex flex-col items-center justify-center border-r ${getBandBg(band)} p-4`}>
                      {isCompleted && band ? (
                        <>
                          <span className={`text-3xl font-black ${getBandColor(band)}`}>{band}</span>
                          <span className={`text-[10px] font-bold ${getBandColor(band)} mt-1`}>{getBandLabel(band)}</span>
                        </>
                      ) : isPending ? (
                        <div className="text-center">
                          <div className="w-8 h-8 border-3 border-amber-200 border-t-amber-500 rounded-full animate-spin mb-2 mx-auto" />
                          <span className="text-[10px] font-bold text-amber-600">Đang chấm</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {formatDate(ev.createdAt)}
                          </span>
                          <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                            {truncate(ev.essayText, 200)}
                          </p>
                        </div>
                      </div>

                      {/* Criteria Scores */}
                      {isCompleted && criteria && (
                        <div className="flex items-center gap-3 mt-3">
                          {[
                            { key: "task_achievement", label: "TA", score: criteria.task_achievement?.score },
                            { key: "coherence", label: "CC", score: criteria.coherence?.score },
                            { key: "lexical", label: "LR", score: criteria.lexical?.score },
                            { key: "grammar", label: "GRA", score: criteria.grammar?.score },
                          ].map(c => (
                            <div key={c.key} className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-slate-400">{c.label}</span>
                              <span className={`text-xs font-black ${getBandColor(c.score ?? null)}`}>{c.score ?? "—"}</span>
                            </div>
                          ))}
                          <div className="ml-auto">
                            <span className="text-[10px] text-slate-400">
                              {ev.essayText.trim().split(/\s+/).filter(Boolean).length} words
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Error message for failed status */}
                      {ev.status === "FAILED" && (
                        <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">error</span>
                          Chấm thất bại. Vui lòng thử lại.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
