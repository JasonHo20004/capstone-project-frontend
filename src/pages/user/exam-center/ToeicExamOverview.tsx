import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function ToeicExamOverview() {
  const { t } = useTranslation("exam");

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/exam-center" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div className="h-6 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#10b981]/10 flex items-center justify-center text-[#10b981]">
                <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
              </div>
              <h1 className="font-bold text-lg tracking-tight">{t("toeicOverview.title")}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600">
              <span className="material-symbols-outlined text-[16px]">timer</span>
              <span>{t("toeicOverview.duration")}</span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600">
              <span className="material-symbols-outlined text-[16px]">help</span>
              <span>{t("toeicOverview.totalQuestions")}</span>
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <span className="material-symbols-outlined">share</span>
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <span className="material-symbols-outlined">bookmark</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Section */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#10b981]/20 to-transparent rounded-bl-full -mr-16 -mt-16 pointer-events-none"></div>
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 rounded-full bg-[#10b981]/10 text-[#10b981] text-xs font-bold uppercase tracking-wider mb-4">
                  {t("toeicOverview.hero.badge")}
                </span>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">{t("toeicOverview.hero.title")}</h2>
                <p className="text-slate-600 leading-relaxed mb-6 max-w-2xl">
                  {t("toeicOverview.hero.description")}
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/exam/test/listening"
                    className="px-6 py-3 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-xl shadow-lg shadow-[#10b981]/20 transition-all flex items-center gap-2"
                  >
                    <span>{t("toeicOverview.hero.startFullExam")}</span>
                    <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                  </Link>
                  <button className="px-6 py-3 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl transition-all flex items-center gap-2">
                    <span>{t("toeicOverview.hero.downloadSyllabus")}</span>
                    <span className="material-symbols-outlined text-[20px]">download</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
              <nav className="flex gap-8">
                <button className="pb-4 border-b-2 border-[#10b981] text-[#10b981] font-bold text-sm">
                  {t("toeicOverview.tabs.description")}
                </button>
                <button className="pb-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors">
                  {t("toeicOverview.tabs.breakdown")}
                </button>
                <button className="pb-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors">
                  {t("toeicOverview.tabs.studyPlan")}
                </button>
                <button className="pb-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors">
                  {t("toeicOverview.tabs.reviews")}
                </button>
              </nav>
            </div>

            {/* Description Content */}
            <div className="prose prose-slate max-w-none">
              <h3 className="text-xl font-bold text-slate-900 mb-4">{t("toeicOverview.description.heading")}</h3>
              <p className="text-slate-600 mb-6">
                {t("toeicOverview.description.intro")}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                    <span className="material-symbols-outlined">headphones</span>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">{t("toeicOverview.description.listening.title")}</h4>
                  <p className="text-sm text-slate-600 mb-4">
                    {t("toeicOverview.description.listening.body")}
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      {t("toeicOverview.description.listening.part1")}
                    </li>
                    <li className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      {t("toeicOverview.description.listening.part2")}
                    </li>
                    <li className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      {t("toeicOverview.description.listening.part3")}
                    </li>
                    <li className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      {t("toeicOverview.description.listening.part4")}
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                    <span className="material-symbols-outlined">menu_book</span>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">{t("toeicOverview.description.reading.title")}</h4>
                  <p className="text-sm text-slate-600 mb-4">
                    {t("toeicOverview.description.reading.body")}
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                      {t("toeicOverview.description.reading.part5")}
                    </li>
                    <li className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                      {t("toeicOverview.description.reading.part6")}
                    </li>
                    <li className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                      {t("toeicOverview.description.reading.part7")}
                    </li>
                  </ul>
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-4">{t("toeicOverview.description.learn.heading")}</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-green-500 mt-0.5 text-[20px]">check_circle</span>
                  <span className="text-sm text-slate-600">{t("toeicOverview.description.learn.item1")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-green-500 mt-0.5 text-[20px]">check_circle</span>
                  <span className="text-sm text-slate-600">{t("toeicOverview.description.learn.item2")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-green-500 mt-0.5 text-[20px]">check_circle</span>
                  <span className="text-sm text-slate-600">{t("toeicOverview.description.learn.item3")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-green-500 mt-0.5 text-[20px]">check_circle</span>
                  <span className="text-sm text-slate-600">{t("toeicOverview.description.learn.item4")}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Exam Info Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">{t("toeicOverview.info.heading")}</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">{t("toeicOverview.info.format")}</span>
                  <span className="text-sm font-semibold text-slate-900">{t("toeicOverview.info.formatValue")}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">{t("toeicOverview.info.questions")}</span>
                  <span className="text-sm font-semibold text-slate-900">{t("toeicOverview.info.questionsValue")}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">{t("toeicOverview.info.duration")}</span>
                  <span className="text-sm font-semibold text-slate-900">{t("toeicOverview.info.durationValue")}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">{t("toeicOverview.info.skillLevel")}</span>
                  <span className="text-sm font-semibold text-slate-900">{t("toeicOverview.info.skillLevelValue")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">{t("toeicOverview.info.language")}</span>
                  <span className="text-sm font-semibold text-slate-900">{t("toeicOverview.info.languageValue")}</span>
                </div>
              </div>
            </div>

            {/* Instructor / Provider */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">{t("toeicOverview.provider.heading")}</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-400 text-[24px]">school</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900">{t("toeicOverview.provider.name")}</p>
                  <p className="text-xs text-slate-500">{t("toeicOverview.provider.subtitle")}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                {t("toeicOverview.provider.description")}
              </p>
              <button className="w-full py-2 text-sm font-semibold text-[#10b981] border border-[#10b981]/20 rounded-lg hover:bg-[#10b981]/5 transition-colors">
                {t("toeicOverview.provider.viewProfile")}
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">{t("toeicOverview.tags.business")}</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">{t("toeicOverview.tags.communication")}</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">{t("toeicOverview.tags.workplace")}</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">{t("toeicOverview.tags.international")}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
