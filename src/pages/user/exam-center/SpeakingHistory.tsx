import { Link } from "react-router-dom";
import { useUserSpeakingSessions } from "@/hooks/api/use-ai-evaluation";

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

function getBandLabel(band: number | null): string {
  if (!band) return "—";
  if (band >= 8.5) return "Expert";
  if (band >= 7.5) return "Very Good";
  if (band >= 6.5) return "Competent";
  if (band >= 5.5) return "Modest";
  if (band >= 4.5) return "Limited";
  return "Basic";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Hoàn thành</span>;
    case "GRADING":
      return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Đang chấm</span>;
    case "IN_PROGRESS":
      return <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Đang làm</span>;
    default:
      return <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">{status}</span>;
  }
}

export default function SpeakingHistory() {
  const userId = getUserId();
  const { data: sessions, isLoading, error } = useUserSpeakingSessions(userId);

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link to="/exam" className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[18px]">mic</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm leading-tight">Speaking History</h1>
            <span className="text-[11px] text-slate-500">Lịch sử phiên thi Speaking</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/my-progress" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition">
            <span className="material-symbols-outlined text-[16px]">analytics</span>
            Thống kê
          </Link>
          <Link to="/exam/history" className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition">
            <span className="material-symbols-outlined text-[16px]">menu_book</span>
            Reading/Listening
          </Link>
          <Link to="/exam/writing-history" className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition">
            <span className="material-symbols-outlined text-[16px]">edit_note</span>
            Writing
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        {sessions && sessions.length > 0 && (() => {
          const completed = sessions.filter((s: any) => s.overallBand);
          const highest = completed.length > 0 ? Math.max(...completed.map((s: any) => s.overallBand)) : null;
          const avg = completed.length > 0 ? Number((completed.reduce((sum: number, s: any) => sum + s.overallBand, 0) / completed.length).toFixed(1)) : null;
          return (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <p className="text-2xl font-black text-amber-600">{sessions.length}</p>
                <p className="text-xs text-slate-500 font-medium">Tổng phiên thi</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <p className={`text-2xl font-black ${getBandColor(highest)}`}>{highest ?? "—"}</p>
                <p className="text-xs text-slate-500 font-medium">Band cao nhất</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <p className={`text-2xl font-black ${getBandColor(avg)}`}>{avg ?? "—"}</p>
                <p className="text-xs text-slate-500 font-medium">Band trung bình</p>
              </div>
            </div>
          );
        })()}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4 mx-auto" />
              <p className="text-slate-500 text-sm">Đang tải lịch sử...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <span className="material-symbols-outlined text-red-500 text-3xl mb-2 block">error</span>
            <p className="text-sm text-red-600">Không thể tải lịch sử.</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && sessions && sessions.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <span className="material-symbols-outlined text-slate-300 text-6xl mb-4 block">mic</span>
            <h3 className="text-lg font-bold text-slate-700 mb-2">Chưa có phiên thi nào</h3>
            <p className="text-slate-500 text-sm mb-6">Bắt đầu luyện Speaking để xem lịch sử ở đây.</p>
            <Link to="/exam/test/speaking" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors">
              <span className="material-symbols-outlined text-[18px]">mic</span>
              Thi Speaking ngay
            </Link>
          </div>
        )}

        {/* Session List */}
        {sessions && sessions.length > 0 && (
          <div className="space-y-3">
            {sessions.map((session: any) => (
              <div key={session.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="flex">
                  {/* Band Score */}
                  <div className={`w-24 shrink-0 flex flex-col items-center justify-center border-r p-4 ${getBandBg(session.overallBand)}`}>
                    {session.overallBand ? (
                      <>
                        <span className={`text-3xl font-black ${getBandColor(session.overallBand)}`}>{session.overallBand}</span>
                        <span className={`text-[10px] font-bold ${getBandColor(session.overallBand)} mt-1`}>{getBandLabel(session.overallBand)}</span>
                      </>
                    ) : session.status === "GRADING" ? (
                      <div className="text-center">
                        <div className="w-7 h-7 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-1" />
                        <span className="text-[10px] font-bold text-amber-600">Chấm</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500 text-[18px]">mic</span>
                        <span className="text-sm font-bold text-slate-800">{session.topic}</span>
                      </div>
                      {getStatusBadge(session.status)}
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2">
                      <span>{formatDate(session.createdAt)}</span>
                      <span>Part {session.currentPart}/3</span>
                      {session.completedAt && (
                        <span>Hoàn thành: {formatDate(session.completedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
