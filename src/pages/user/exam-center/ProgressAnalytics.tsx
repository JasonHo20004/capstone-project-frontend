import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend,
} from "recharts";
import apiClient from "@/lib/api/config";
import { aiEvaluationService } from "@/lib/api/services/user/ai-evaluation/ai-evaluation.service";
import i18n from "@/i18n";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUserId(): string | null {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || payload.userId || payload.id || null;
  } catch { return null; }
}

function bandColor(band: number): string {
  if (band >= 7) return "text-emerald-600";
  if (band >= 5) return "text-blue-600";
  if (band >= 4) return "text-amber-600";
  return "text-red-500";
}

function bandBg(band: number): string {
  if (band >= 7) return "bg-emerald-50 border-emerald-200";
  if (band >= 5) return "bg-blue-50 border-blue-200";
  if (band >= 4) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

function getBandLabelKey(band: number | null): string | null {
  if (!band) return null;
  if (band >= 8.5) return "Expert";
  if (band >= 7.5) return "VeryGood";
  if (band >= 6.5) return "Competent";
  if (band >= 5.5) return "Modest";
  if (band >= 4.5) return "Limited";
  return "Basic";
}

function relativeTime(d: Date, commonT: (key: string, opts?: any) => string, dateLocale: string): string {
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return commonT("relativeTime.justNow");
  if (mins < 60) return commonT("relativeTime.minutesAgo", { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return commonT("relativeTime.hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return commonT("relativeTime.daysAgo", { count: days });
  return d.toLocaleDateString(dateLocale);
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max) + "...";
}

// ─── Skill Config ─────────────────────────────────────────────────────────────

const SKILLS = [
  { key: "reading", icon: "menu_book", gradient: "from-indigo-500 to-blue-600", bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200", chartColor: "#6366f1" },
  { key: "listening", icon: "headphones", gradient: "from-teal-500 to-cyan-600", bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-200", chartColor: "#14b8a6" },
  { key: "writing", icon: "edit_note", gradient: "from-emerald-500 to-green-600", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", chartColor: "#10b981" },
  { key: "speaking", icon: "mic", gradient: "from-amber-500 to-orange-600", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", chartColor: "#f59e0b" },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoryItem {
  id: string;
  date: Date;
  band: number;
  skill: string;
  label: string;
  subtitle?: string;
  criteria?: Record<string, number>;
  status?: string;
  raw?: any;
}

interface SkillStats {
  total: number;
  avg: number;
  best: number;
  latest: number | null;
  trend: "up" | "down" | "flat";
}

type TabKey = "all" | "reading" | "listening" | "writing" | "speaking";

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProgressAnalytics() {
  const { t, i18n: i18nInstance } = useTranslation("exam");
  const commonT = i18n.getFixedT(null, "common");
  const dateLocale = i18nInstance.language === "vi" ? "vi-VN" : "en-GB";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const userId = getUserId();

  // ─── Fetch all data sources ──────────────────────────────────────────────
  // Each source is fetched independently so one failing endpoint doesn't wipe
  // out the others. A blocking error is only shown when every source fails.
  const fetchAll = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    setError(false);

    const items: HistoryItem[] = [];
    let failures = 0;

    // 1. Reading/Listening from test history
    try {
        const historyRes = await apiClient.get(`/tests/history/${userId}`);
        const history = historyRes.data?.data || [];
        for (const h of history) {
          const raw = h.rawScoresBySkill || {};
          let band = 0;
          if (raw.bandScore != null && raw.bandScore <= 9) {
            band = raw.bandScore;
          } else if (h.overallScaledScore != null && h.overallScaledScore <= 9) {
            band = h.overallScaledScore;
          } else if (raw.bandScore != null) {
            band = raw.bandScore;
          }
          if (band <= 0) continue;
          const skill = (h.test?.testSkills?.[0]?.skill || "READING").toLowerCase();
          const chartBand = band <= 9 ? band : 0;
          items.push({
            id: h.id,
            date: new Date(h.createdAt),
            band: chartBand > 0 ? chartBand : band,
            skill,
            label: h.test?.title || skill.toUpperCase(),
            subtitle: t("progressAnalytics.itemSubtitle", {
              correct: raw.correct ?? 0,
              total: raw.total ?? 0,
              minutes: h.test?.durationInMinutes ?? "—",
            }),
            raw: h,
          });
        }
    } catch (err) {
        failures++;
        console.error("Failed to fetch test history:", err);
    }

    // 2. Writing evaluations
    try {
        const writingRes = await aiEvaluationService.getUserWritingEvaluations(userId);
        const writings = (writingRes.data || []) as any[];
        for (const w of writings) {
          const band = w.overallBand ?? 0;
          const criteria: Record<string, number> = {};
          if (w.criteria) {
            if (w.criteria.task_achievement?.score) criteria.TA = w.criteria.task_achievement.score;
            if (w.criteria.coherence?.score) criteria.CC = w.criteria.coherence.score;
            if (w.criteria.lexical?.score) criteria.LR = w.criteria.lexical.score;
            if (w.criteria.grammar?.score) criteria.GRA = w.criteria.grammar.score;
          }
          items.push({
            id: w.id,
            date: new Date(w.createdAt),
            band,
            skill: "writing",
            label: t("progressAnalytics.writingDefaultLabel"),
            subtitle: truncate(w.essayText || "", 120),
            criteria: Object.keys(criteria).length > 0 ? criteria : undefined,
            status: w.status,
            raw: w,
          });
        }
    } catch (err) {
        failures++;
        console.error("Failed to fetch writing evaluations:", err);
    }

    // 3. Speaking sessions
    try {
        const speakingRes = await aiEvaluationService.listSpeakingSessions(userId);
        const sessions = (speakingRes.data || []) as any[];
        for (const s of sessions) {
          const band = s.overallBand ?? 0;
          items.push({
            id: s.id,
            date: new Date(s.createdAt),
            band,
            skill: "speaking",
            label: s.topic || t("progressAnalytics.speakingDefaultLabel"),
            status: s.status,
            raw: s,
          });
        }
    } catch (err) {
        failures++;
        console.error("Failed to fetch speaking sessions:", err);
    }

    items.sort((a, b) => b.date.getTime() - a.date.getTime());
    setHistoryItems(items);
    // Only block with an error screen when every source failed and there's
    // nothing to show; partial data is rendered as-is.
    setError(failures === 3 && items.length === 0);
    setLoading(false);
  }, [userId, t]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ─── Compute per-skill stats ─────────────────────────────────────────────
  const skillStats = useMemo(() => {
    const stats: Record<string, SkillStats> = {};
    for (const sk of SKILLS) {
      const pts = historyItems.filter(p => p.skill === sk.key && p.band > 0);
      if (pts.length === 0) {
        stats[sk.key] = { total: 0, avg: 0, best: 0, latest: null, trend: "flat" };
        continue;
      }
      const bands = pts.map(p => p.band);
      const avg = +(bands.reduce((a, b) => a + b, 0) / bands.length).toFixed(1);
      const best = Math.max(...bands);
      const latest = bands[0];

      let trend: "up" | "down" | "flat" = "flat";
      if (pts.length >= 4) {
        const mid = Math.floor(pts.length / 2);
        const recentAvg = pts.slice(0, mid).reduce((s, p) => s + p.band, 0) / mid;
        const earlyAvg = pts.slice(mid).reduce((s, p) => s + p.band, 0) / (pts.length - mid);
        if (recentAvg > earlyAvg + 0.3) trend = "up";
        else if (recentAvg < earlyAvg - 0.3) trend = "down";
      }

      stats[sk.key] = { total: pts.length, avg, best, latest, trend };
    }
    return stats;
  }, [historyItems]);

  // ─── Line chart data ────────────────────────────────────────────────────
  const lineChartData = useMemo(() => {
    const points = historyItems.filter(p => p.band > 0);
    if (points.length === 0) return [];

    const sorted = [...points].sort((a, b) => a.date.getTime() - b.date.getTime());
    const byDate = new Map<string, Record<string, number>>();
    for (const p of sorted) {
      const key = p.date.toISOString().split("T")[0];
      if (!byDate.has(key)) byDate.set(key, {});
      byDate.get(key)![p.skill] = p.band;
    }

    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, scores]) => ({
        date: new Date(dateKey).toLocaleDateString(dateLocale, { day: "2-digit", month: "2-digit" }),
        ...scores,
      }));
  }, [historyItems, dateLocale]);

  // ─── Radar chart data ───────────────────────────────────────────────────
  const radarData = useMemo(() => {
    return SKILLS.map(sk => {
      const pts = historyItems.filter(p => p.skill === sk.key && p.band > 0)
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5);
      const avg = pts.length > 0
        ? +(pts.reduce((s, p) => s + p.band, 0) / pts.length).toFixed(1)
        : 0;
      return { skill: t(`progressAnalytics.skills.${sk.key}`), band: avg, fullMark: 9 };
    });
  }, [historyItems, t]);

  // ─── Filtered history ───────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    if (activeTab === "all") return historyItems;
    return historyItems.filter(h => h.skill === activeTab);
  }, [historyItems, activeTab]);

  const totalTests = historyItems.filter(h => h.band > 0).length;

  // ─── Loading / Auth ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">{t("progressAnalytics.loading")}</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-5xl text-slate-300">lock</span>
          <p className="text-slate-500">{t("progressAnalytics.loginRequired")}</p>
          <Link to="/login" className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">{t("progressAnalytics.loginCta")}</Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-5xl text-slate-300">cloud_off</span>
          <p className="text-slate-500">
            {t("progressAnalytics.loadError", "Không tải được dữ liệu tiến độ. Vui lòng thử lại.")}
          </p>
          <button
            onClick={() => void fetchAll()}
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            {t("progressAnalytics.retry", "Thử lại")}
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  const TABS: { key: TabKey; icon: string }[] = [
    { key: "all", icon: "apps" },
    { key: "reading", icon: "menu_book" },
    { key: "listening", icon: "headphones" },
    { key: "writing", icon: "edit_note" },
    { key: "speaking", icon: "mic" },
  ];

  return (
    <div className="space-y-6">

      {/* ═══ Summary Cards ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SKILLS.map(sk => {
          const st = skillStats[sk.key];
          return (
            <div key={sk.key} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 bg-gradient-to-br ${sk.gradient} rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-[20px]">{sk.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{t(`progressAnalytics.skills.${sk.key}`)}</p>
                  <p className="text-[10px] text-slate-400">{t("progressAnalytics.testsCount", { count: st.total })}</p>
                </div>
                {st.trend !== "flat" && (
                  <span className={`ml-auto text-[18px] material-symbols-outlined ${
                    st.trend === "up" ? "text-emerald-500" : "text-red-400"
                  }`}>
                    {st.trend === "up" ? "trending_up" : "trending_down"}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className={`text-xl font-black ${st.avg > 0 ? bandColor(st.avg) : "text-slate-300"}`}>
                    {st.avg > 0 ? st.avg : "—"}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">{t("progressAnalytics.stats.avg")}</p>
                </div>
                <div className="text-center">
                  <p className={`text-xl font-black ${st.best > 0 ? bandColor(st.best) : "text-slate-300"}`}>
                    {st.best > 0 ? st.best : "—"}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">{t("progressAnalytics.stats.max")}</p>
                </div>
                <div className="text-center">
                  <p className={`text-xl font-black ${st.latest ? bandColor(st.latest) : "text-slate-300"}`}>
                    {st.latest ?? "—"}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">{t("progressAnalytics.stats.latest")}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ Charts Section ═══ */}
      {totalTests > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-800">{t("progressAnalytics.lineChart.title")}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{t("progressAnalytics.lineChart.subtitle")}</p>
              </div>
              <span className="material-symbols-outlined text-slate-300">show_chart</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={lineChartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                <YAxis domain={[0, 9]} ticks={[0, 3, 5, 7, 9]} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "12px" }}
                  labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                {SKILLS.map(sk => (
                  <Line
                    key={sk.key}
                    type="monotone"
                    dataKey={sk.key}
                    name={t(`progressAnalytics.skills.${sk.key}`)}
                    stroke={sk.chartColor}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: sk.chartColor, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-base font-bold text-slate-800">{t("progressAnalytics.radarChart.title")}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{t("progressAnalytics.radarChart.subtitle")}</p>
              </div>
              <span className="material-symbols-outlined text-slate-300">radar</span>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12, fill: "#475569", fontWeight: 600 }} />
                <PolarRadiusAxis domain={[0, 9]} tick={{ fontSize: 9, fill: "#94a3b8" }} tickCount={4} />
                <Radar name={t("progressAnalytics.radarChart.seriesName")} dataKey="band" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {radarData.map(r => (
                <div key={r.skill} className="text-center">
                  <p className={`text-lg font-black ${r.band > 0 ? bandColor(r.band) : "text-slate-300"}`}>{r.band > 0 ? r.band : "—"}</p>
                  <p className="text-[9px] text-slate-400 font-medium">{r.skill}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ History Section with Tabs ═══ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center gap-1 px-4 pt-4 pb-0 border-b border-slate-100 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              {t(`progressAnalytics.tabs.${tab.key}`)}
              {tab.key !== "all" && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? "bg-indigo-200 text-indigo-700" : "bg-slate-100 text-slate-400"
                }`}>
                  {historyItems.filter(h => h.skill === tab.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* History items */}
        <div className="p-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-slate-200 mb-3 block">
                {activeTab === "writing" ? "edit_note" : activeTab === "speaking" ? "mic" : "quiz"}
              </span>
              <p className="text-slate-400 text-sm mb-4">
                {activeTab === "all"
                  ? t("progressAnalytics.empty.generic")
                  : t("progressAnalytics.empty.withSkill", { skill: t(`progressAnalytics.skills.${activeTab}`) })}
              </p>
              <Link to="/exam" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition">
                <span className="material-symbols-outlined text-[16px]">quiz</span>
                {t("progressAnalytics.empty.cta")}
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map(item => {
                const sk = SKILLS.find(s => s.key === item.skill) || SKILLS[0];
                const isPending = item.status === "PENDING" || item.status === "PROCESSING" || item.status === "GRADING";
                const isFailed = item.status === "FAILED";
                const showBand = item.band > 0 && !isPending && !isFailed;
                const bandLabelKey = getBandLabelKey(item.band);

                return (
                  <div
                    key={`${item.skill}-${item.id}`}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm ${
                      showBand ? bandBg(item.band) : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    {/* Skill icon */}
                    <div className={`w-10 h-10 bg-gradient-to-br ${sk.gradient} rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm`}>
                      <span className="material-symbols-outlined text-[18px]">{sk.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${sk.text}`}>{t(`progressAnalytics.skills.${sk.key}`)}</span>
                        <span className="text-[10px] text-slate-400">{relativeTime(item.date, commonT, dateLocale)}</span>
                        {isPending && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            {item.status === "GRADING" ? t("progressAnalytics.itemStatus.grading") : t("progressAnalytics.itemStatus.processing")}
                          </span>
                        )}
                        {isFailed && (
                          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">{t("progressAnalytics.itemStatus.failed")}</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.label}</p>
                      {item.subtitle && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{item.subtitle}</p>
                      )}
                      {/* Writing criteria inline */}
                      {item.criteria && (
                        <div className="flex items-center gap-3 mt-1.5">
                          {Object.entries(item.criteria).map(([key, val]) => (
                            <div key={key} className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-slate-400">{key}</span>
                              <span className={`text-xs font-black ${bandColor(val)}`}>{val}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Score */}
                    <div className="text-right shrink-0 pl-3">
                      {showBand ? (
                        <>
                          <p className={`text-2xl font-black ${bandColor(item.band)}`}>
                            {item.band.toFixed ? item.band.toFixed(1) : item.band}
                          </p>
                          <p className="text-[9px] text-slate-400 font-medium">
                            {bandLabelKey ? t(`bandLabels.${bandLabelKey}`) : "—"}
                          </p>
                        </>
                      ) : isPending ? (
                        <div className="w-8 h-8 border-3 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
                      ) : (
                        <span className="text-slate-300 text-lg">—</span>
                      )}
                    </div>

                    {/* Mini bar */}
                    {showBand && (
                      <div className="hidden sm:block w-20 shrink-0">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              item.band >= 7 ? "bg-emerald-500" : item.band >= 5 ? "bg-blue-500" : item.band >= 4 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${Math.round((item.band / 9) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
