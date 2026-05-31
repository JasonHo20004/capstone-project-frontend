import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function WritingResult() {
  const { t } = useTranslation("exam");

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center px-6 mb-8">
        <Link to="/exam-center" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="text-sm font-medium">{t("writingResultStatic.backToExamCenter")}</span>
        </Link>
      </header>

      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t("writingResultStatic.title")}</h1>
            <p className="text-slate-500">Completed on Oct 27, 2023 • 11:00 AM</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">download</span>
              {t("writingResultStatic.downloadReport")}
            </button>
            <Link
              to="/exam"
              className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-bold text-white hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
              {t("writingResultStatic.practiceAgain")}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Scores */}
          <div className="lg:col-span-1 space-y-6">
            {/* Overall Score */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600"></div>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">{t("writingResultStatic.estimatedBand")}</span>
              <span className="text-7xl font-black text-indigo-600 tracking-tighter">6.5</span>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mt-2 border border-indigo-100">
                Competent User
              </span>
            </div>

            {/* Criteria Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6">{t("writingResultStatic.scoreBreakdown")}</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-600">{t("writingResultStatic.criteria.taskResponse")}</span>
                    <span className="text-indigo-600 font-bold">6.0</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[60%] rounded-full"></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Addressed all parts of the task but some points were not fully developed.
                  </p>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-600">{t("writingResultStatic.criteria.coherence")}</span>
                    <span className="text-indigo-600 font-bold">7.0</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[70%] rounded-full"></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Logically organizes information and ideas; there is clear progression throughout.
                  </p>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-600">{t("writingResultStatic.criteria.lexical")}</span>
                    <span className="text-indigo-600 font-bold">6.5</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[65%] rounded-full"></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Uses an adequate range of vocabulary for the task.</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-600">{t("writingResultStatic.criteria.grammatical")}</span>
                    <span className="text-indigo-600 font-bold">6.5</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[65%] rounded-full"></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Uses a mix of simple and complex sentence forms.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Annotated Essay */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">{t("writingResultStatic.annotatedFeedback")}</h3>
                <div className="flex gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span> {t("writingResultStatic.legend.grammar")}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span> {t("writingResultStatic.legend.vocabulary")}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span> {t("writingResultStatic.legend.structure")}
                  </div>
                </div>
              </div>
              <div className="p-8 prose prose-slate max-w-none leading-loose text-slate-700">
                <p>
                  The shift towards remote work has been one of the most significant changes in the modern workforce, accelerated by global events. This transformation has sparked a debate regarding its impact on employees&apos; lives. While proponents argue that it offers unparalleled flexibility, critics suggest it erodes the boundary between work and home.
                </p>
                <p>
                  On the one hand, remote work provides a level of autonomy that traditional office environments often lack. Employees can tailor their schedules to fit personal commitments, such as childcare or exercise, leading to a{" "}
                  <span className="bg-blue-100 border-b-2 border-blue-400 px-1 rounded cursor-help relative group">
                    more balanced lifestyle
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Good collocation. Consider &quot;enhanced work-life balance&quot; for variety.
                    </span>
                  </span>
                  . The elimination of the daily commute also saves time and reduces stress, contributing to overall well-being.
                </p>
                <p>
                  However, the lack of physical separation between the office and the living room can make it{" "}
                  <span className="bg-yellow-100 border-b-2 border-yellow-400 px-1 rounded cursor-help relative group">
                    difficult to &apos;switch off&apos;
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Informal phrasing. Consider &quot;challenging to disconnect from work duties&quot;.
                    </span>
                  </span>
                  . Many remote workers report working longer hours and feeling pressured to be constantly available. This phenomenon, often referred to as &apos;always-on&apos; culture, can lead to burnout and anxiety.
                </p>
                <p>
                  <span className="bg-green-100 border-b-2 border-green-400 px-1 rounded cursor-help relative group">
                    In conclusion
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Clear transition signal.
                    </span>
                  </span>
                  , while remote work offers significant benefits in terms of flexibility, it also presents challenges related to work-life boundaries. It is essential for both employers and employees to establish clear guidelines to maximize the advantages while mitigating the downsides.
                </p>
              </div>
            </div>

            {/* Improvement Plan */}
            <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6">
              <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">auto_fix_high</span>
                {t("writingResultStatic.recommendedActions")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                  <h4 className="font-bold text-slate-800 text-sm mb-2">{t("writingResultStatic.expandVocabulary.title")}</h4>
                  <p className="text-xs text-slate-600 mb-3">
                    Use more precise academic vocabulary instead of phrasal verbs (e.g., &quot;disconnect&quot; instead of &quot;switch off&quot;).
                  </p>
                  <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                    {t("writingResultStatic.expandVocabulary.cta")}
                  </button>
                </div>
                <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                  <h4 className="font-bold text-slate-800 text-sm mb-2">{t("writingResultStatic.developIdeas.title")}</h4>
                  <p className="text-xs text-slate-600 mb-3">
                    Ensure each paragraph has a clear topic sentence followed by supporting evidence and examples.
                  </p>
                  <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                    {t("writingResultStatic.developIdeas.cta")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
