import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useUserSpeakingSessions } from "@/hooks/api/use-ai-evaluation";
import { getUserId, getBandColor, getBandBg } from "./speaking-utils";

function getBandLabelKey(band: number | null): string | null {
  if (!band) return null;
  if (band >= 8.5) return "Expert";
  if (band >= 7.5) return "VeryGood";
  if (band >= 6.5) return "Competent";
  if (band >= 5.5) return "Modest";
  if (band >= 4.5) return "Limited";
  return "Basic";
}

function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale, {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatShortDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale, {
    day: "2-digit", month: "2-digit",
  });
}

export default function SpeakingHistory() {
  const { t, i18n } = useTranslation("exam");
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-GB";
  const userId = getUserId();
  const { data: sessions, isLoading, error } = useUserSpeakingSessions(userId);

  const renderBandLabel = (band: number | null) => {
    const key = getBandLabelKey(band);
    return key ? t(`bandLabels.${key}`) : "—";
  };

  const renderStatusBadge = (status: string) => {
    const knownStatuses = ["COMPLETED", "GRADING", "IN_PROGRESS"];
    if (status === "COMPLETED") {
      return <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">{t("speakingHistory.statuses.COMPLETED")}</span>;
    }
    if (status === "GRADING") {
      return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">{t("speakingHistory.statuses.GRADING")}</span>;
    }
    if (status === "IN_PROGRESS") {
      return <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">{t("speakingHistory.statuses.IN_PROGRESS")}</span>;
    }
    return <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">{knownStatuses.includes(status) ? t(`speakingHistory.statuses.${status}`) : status}</span>;
  };

  const chartData = useMemo(() => {
    if (!sessions || !Array.isArray(sessions)) return [];
    return (sessions as any[])
      .filter((s) => s.overallBand !== null && s.overallBand !== undefined)
      .slice()
      .reverse()
      .map((s, idx) => ({
        idx: idx + 1,
        date: formatShortDate(s.createdAt, dateLocale),
        band: s.overallBand,
        topic: s.topic,
      }));
  }, [sessions, dateLocale]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return null;
    const recent = chartData.slice(-3);
    const prior = chartData.slice(-6, -3);
    if (recent.length === 0 || prior.length === 0) return null;
    const avg = (arr: any[]) => arr.reduce((s, x) => s + x.band, 0) / arr.length;
    return avg(recent) - avg(prior);
  }, [chartData]);

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/exam" className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[18px]">mic</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm leading-tight">{t("speakingHistory.header.title")}</h1>
            <span className="text-[11px] text-slate-500 hidden sm:block">{t("speakingHistory.header.subtitle")}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/my-progress" className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition">
            <span className="material-symbols-outlined text-[16px]">analytics</span>
            <span className="hidden sm:inline">{t("speakingHistory.nav.stats")}</span>
          </Link>
          <Link to="/exam/history" className="text-xs sm:text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-slate-100 transition">
            <span className="material-symbols-outlined text-[16px]">menu_book</span>
            <span className="hidden sm:inline">{t("speakingHistory.nav.readingListening")}</span>
          </Link>
          <Link to="/exam/writing-history" className="hidden sm:flex text-sm text-slate-500 hover:text-slate-700 font-medium items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition">
            <span className="material-symbols-outlined text-[16px]">edit_note</span>
            {t("speakingHistory.nav.writing")}
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {sessions && sessions.length > 0 && (() => {
          const completed = sessions.filter((s: any) => s.overallBand);
          const highest = completed.length > 0 ? Math.max(...completed.map((s: any) => s.overallBand)) : null;
          const avg = completed.length > 0 ? Number((completed.reduce((sum: number, s: any) => sum + s.overallBand, 0) / completed.length).toFixed(1)) : null;
          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <p className="text-2xl font-black text-amber-600">{sessions.length}</p>
                <p className="text-xs text-slate-500 font-medium">{t("speakingHistory.stats.totalSessions")}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <p className={`text-2xl font-black ${getBandColor(highest)}`}>{highest ?? "—"}</p>
                <p className="text-xs text-slate-500 font-medium">{t("speakingHistory.stats.highestBand")}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <p className={`text-2xl font-black ${getBandColor(avg)}`}>{avg ?? "—"}</p>
                <p className="text-xs text-slate-500 font-medium">{t("speakingHistory.stats.averageBand")}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                {trend !== null ? (
                  <>
                    <p className={`text-2xl font-black ${trend > 0 ? "text-emerald-600" : trend < 0 ? "text-red-500" : "text-slate-500"}`}>
                      {trend > 0 ? "+" : ""}{trend.toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">{t("speakingHistory.stats.recentTrend")}</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-black text-slate-300">—</p>
                    <p className="text-xs text-slate-500 font-medium">{t("speakingHistory.stats.needTwoMore")}</p>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {chartData.length >= 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-[18px]">trending_up</span>
                {t("speakingHistory.chart.title")}
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("speakingHistory.chart.attemptsCount", { count: chartData.length })}</span>
            </div>
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[0, 9]} stroke="#94a3b8" fontSize={11} ticks={[0, 3, 5, 6, 7, 8, 9]} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                    formatter={(value: any) => [`Band ${value}`, "Score"]}
                    labelFormatter={(label, items) => {
                      const topic = items?.[0]?.payload?.topic;
                      return topic ? `${label} • ${topic}` : label;
                    }}
                  />
                  <ReferenceLine y={6.5} stroke="#10b981" strokeDasharray="4 4" label={{ value: "B6.5", position: "right", fill: "#10b981", fontSize: 10 }} />
                  <ReferenceLine y={7.5} stroke="#0ea5e9" strokeDasharray="4 4" label={{ value: "B7.5", position: "right", fill: "#0ea5e9", fontSize: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="band"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4 mx-auto" />
              <p className="text-slate-500 text-sm">{t("speakingHistory.loading")}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <span className="material-symbols-outlined text-red-500 text-3xl mb-2 block">error</span>
            <p className="text-sm text-red-600">{t("speakingHistory.loadError")}</p>
          </div>
        )}

        {!isLoading && sessions && sessions.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center">
            <span className="material-symbols-outlined text-slate-300 text-6xl mb-4 block">mic</span>
            <h3 className="text-lg font-bold text-slate-700 mb-2">{t("speakingHistory.empty.title")}</h3>
            <p className="text-slate-500 text-sm mb-6">{t("speakingHistory.empty.hint")}</p>
            <Link to="/exam/test/speaking" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors">
              <span className="material-symbols-outlined text-[18px]">mic</span>
              {t("speakingHistory.empty.cta")}
            </Link>
          </div>
        )}

        {sessions && sessions.length > 0 && (
          <div className="space-y-3">
            {sessions.map((session: any) => {
              const destinationUrl = `/exam/speaking-result/${session.id}`;
              return (
                <Link key={session.id} to={destinationUrl} className="block bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all overflow-hidden group">
                  <div className="flex">
                    <div className={`w-20 sm:w-24 shrink-0 flex flex-col items-center justify-center border-r p-3 sm:p-4 ${getBandBg(session.overallBand)}`}>
                      {session.overallBand ? (
                        <>
                          <span className={`text-2xl sm:text-3xl font-black ${getBandColor(session.overallBand)}`}>{session.overallBand}</span>
                          <span className={`text-[9px] sm:text-[10px] font-bold ${getBandColor(session.overallBand)} mt-1`}>{renderBandLabel(session.overallBand)}</span>
                        </>
                      ) : session.status === "GRADING" ? (
                        <div className="text-center">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-1" />
                          <span className="text-[10px] font-bold text-amber-600">{t("speakingHistory.gradingShort")}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </div>

                    <div className="flex-1 p-3 sm:p-4 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="material-symbols-outlined text-amber-500 text-[18px] shrink-0">mic</span>
                          <span className="text-sm font-bold text-slate-800 truncate">{session.topic}</span>
                        </div>
                        {renderStatusBadge(session.status)}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] text-slate-500 mt-2 flex-wrap">
                        <span>{formatDate(session.createdAt, dateLocale)}</span>
                        <span>{t("speakingHistory.partLabel", { current: session.currentPart })}</span>
                        {session.completedAt && (
                          <span className="hidden sm:inline">{t("speakingHistory.completedLabel", { date: formatDate(session.completedAt, dateLocale) })}</span>
                        )}
                      </div>
                    </div>
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
