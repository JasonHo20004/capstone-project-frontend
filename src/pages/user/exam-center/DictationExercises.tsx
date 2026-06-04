import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { dictationService, type DictationExercise } from "@/lib/api/services/user/dictation/dictation.service";
import { useSubscription } from "@/context/SubscriptionContext";

const LEVEL_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  A1: { bg: "from-green-400 to-emerald-500", text: "text-white", glow: "shadow-green-500/20" },
  A2: { bg: "from-green-400 to-emerald-500", text: "text-white", glow: "shadow-green-500/20" },
  B1: { bg: "from-sky-400 to-blue-500", text: "text-white", glow: "shadow-sky-500/20" },
  B2: { bg: "from-indigo-400 to-violet-500", text: "text-white", glow: "shadow-indigo-500/20" },
  C1: { bg: "from-amber-400 to-orange-500", text: "text-white", glow: "shadow-amber-500/20" },
  C2: { bg: "from-rose-400 to-red-500", text: "text-white", glow: "shadow-rose-500/20" },
};

const DEFAULT_LEVEL = { bg: "from-slate-400 to-slate-500", text: "text-white", glow: "shadow-slate-500/20" };

function DictationExercisesContent() {
  const { t } = useTranslation("exam");
  const [exercises, setExercises] = useState<DictationExercise[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { hasFeature } = useSubscription();
  const navigate = useNavigate();
  const isPro = hasFeature("dictation");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [exRes, catRes] = await Promise.all([
          dictationService.listExercises(),
          dictationService.getCategories(),
        ]);
        setExercises(exRes.data || []);
        setCategories(catRes.data || []);
      } catch (err) {
        console.error("Failed to fetch dictation exercises:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredExercises =
    activeCategory === "ALL"
      ? exercises
      : exercises.filter((ex) => ex.category === activeCategory);

  const grouped = filteredExercises.reduce<Record<string, DictationExercise[]>>((acc, ex) => {
    const cat = ex.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ex);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* ─── Hero Header ─── */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
              <span className="material-symbols-outlined text-white text-[28px]">hearing</span>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                {t("dictation.title")}
              </h2>
              <p className="text-slate-500 mt-1 text-sm">
                {t("dictation.subtitle")}
              </p>
            </div>
          </div>
          <Link
            to="/exam"
            className="text-sm text-slate-400 hover:text-teal-600 font-medium flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            {t("dictation.backToExamCenter")}
          </Link>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mt-5">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-xl px-4 py-2 shadow-sm">
            <span className="material-symbols-outlined text-teal-500 text-lg">library_books</span>
            <span className="text-sm font-bold text-slate-700">{exercises.length}</span>
            <span className="text-xs text-slate-400">{t("dictation.exercisesLabel")}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-xl px-4 py-2 shadow-sm">
            <span className="material-symbols-outlined text-emerald-500 text-lg">folder</span>
            <span className="text-sm font-bold text-slate-700">{categories.length}</span>
            <span className="text-xs text-slate-400">{t("dictation.categoriesLabel")}</span>
          </div>
        </div>
      </div>

      {/* ─── Category Tabs ─── */}
      {categories.length > 0 && (
        <div className="flex gap-1 p-1 bg-slate-100/80 rounded-xl mb-8 w-fit overflow-x-auto">
          <button
            onClick={() => setActiveCategory("ALL")}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeCategory === "ALL"
                ? "bg-white text-teal-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t("dictation.categoryAll")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ─── Loading ─── */}
      {loading && (
        <div className="text-center py-16">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-teal-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-teal-600 animate-spin" />
          </div>
          <p className="text-slate-400 text-sm font-medium">{t("dictation.loading")}</p>
        </div>
      )}

      {/* ─── Exercise Groups ─── */}
      {!loading &&
        Object.entries(grouped).map(([category, exs]) => (
          <div key={category} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-teal-600 text-lg">folder</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-800">{category}</h3>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                {exs.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exs.map((ex) => {
                const levelStyle = LEVEL_COLORS[ex.level || ""] || DEFAULT_LEVEL;
                const isLocked = ex.isPremium && !isPro;

                return isLocked ? (
                  // PRO locked card — button instead of Link
                  <button
                    key={ex.id}
                    onClick={() => setShowUpgradeDialog(true)}
                    className="group relative bg-white rounded-2xl border border-amber-200/80 ring-1 ring-amber-100 shadow-sm p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 text-left cursor-pointer"
                  >
                    {/* PRO Badge */}
                    <span className="absolute -top-2 -right-2 flex items-center gap-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm z-10">
                      <span className="material-symbols-outlined text-[13px]">diamond</span>
                      PRO
                    </span>

                    <div className="mb-3">
                      <h4 className="text-base font-bold text-slate-900 leading-tight pr-8">
                        {ex.title}
                      </h4>
                      {ex.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{ex.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span className="material-symbols-outlined text-[14px]">format_list_numbered</span>
                        <span className="font-medium">{t("dictation.sentencesCount", { count: ex.totalSentences })}</span>
                      </div>
                      <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">lock</span>
                        PRO
                      </span>
                    </div>
                  </button>
                ) : (
                  // Free/unlocked card — regular Link
                  <Link
                    key={ex.id}
                    to={`/dictation/${ex.id}`}
                    className="group relative bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 hover:shadow-md hover:border-teal-200/80 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    {/* Level Badge */}
                    {ex.level && (
                      <span
                        className={`absolute -top-2 -right-2 text-[10px] font-black px-2.5 py-1 rounded-lg bg-gradient-to-r ${levelStyle.bg} ${levelStyle.text} uppercase tracking-wider shadow-sm ${levelStyle.glow}`}
                      >
                        {ex.level}
                      </span>
                    )}

                    <div className="mb-3">
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors leading-tight pr-8">
                        {ex.title}
                      </h4>
                      {ex.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{ex.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span className="material-symbols-outlined text-[14px]">format_list_numbered</span>
                        <span className="font-medium">{t("dictation.sentencesCount", { count: ex.totalSentences })}</span>
                      </div>
                      <span className="text-xs font-bold text-teal-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                        {t("dictation.practice")}
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

      {/* ─── Empty State ─── */}
      {!loading && filteredExercises.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl text-slate-300">headphones_off</span>
          </div>
          <p className="text-slate-500 text-lg font-semibold mb-1">{t("dictation.empty")}</p>
          <p className="text-slate-400 text-sm">{t("dictation.emptyHint")}</p>
        </div>
      )}

      {/* ─── PRO Upgrade Dialog ─── */}
      {showUpgradeDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowUpgradeDialog(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200/50">
              <span className="material-symbols-outlined text-white text-[28px]">diamond</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">{t("dictation.upgrade.title")}</h3>
            <p className="text-sm text-slate-500 mb-6">{t("dictation.upgrade.body")}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeDialog(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {t("dictation.upgrade.close")}
              </button>
              <button
                onClick={() => navigate("/#pricing")}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-200/30 hover:scale-105 transition-all cursor-pointer"
              >
                {t("dictation.upgrade.upgradeBtn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DictationExercises() {
  return <DictationExercisesContent />;
}
