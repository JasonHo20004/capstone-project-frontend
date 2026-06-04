import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "@/lib/api/config";

interface TestSummary {
  id: string;
  title: string;
  slug: string | null;
  status: string;
  durationInMinutes: number | null;
  testSkills: { skill: string }[];
  englishTestType: { name: string };
}

type SkillFilter = 'ALL' | 'READING' | 'WRITING' | 'LISTENING' | 'SPEAKING';

const SKILL_TAB_VALUES: SkillFilter[] = ['ALL', 'READING', 'WRITING', 'LISTENING', 'SPEAKING'];

export default function ExamCenter() {
  const { t } = useTranslation('exam');
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<SkillFilter>('ALL');

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const resp = await apiClient.get("/tests?status=PUBLISHED");
        const data = resp.data?.data || [];
        setTests(data);
      } catch (err) {
        console.error("Failed to fetch tests:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  // Filter DB tests by skill
  const filteredTests = activeFilter === 'ALL'
    ? tests
    : tests.filter(t => t.testSkills?.some(s => s.skill === activeFilter));

  const tabLabel = (value: SkillFilter): string => {
    if (value === 'ALL') return t('examCenter.tabs.all');
    return t(`examCenter.skills.${value}`);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Title */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t('examCenter.title')}</h2>
          <p className="text-slate-500 mt-1">
            {t('examCenter.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>{t('examCenter.officialNotice')}</span>
          </div>
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition shadow-sm whitespace-nowrap cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">history</span>
              {t('examCenter.historyMenu.trigger')}
              <span className="material-symbols-outlined text-[16px] ml-0.5">expand_more</span>
            </button>
            <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
              <Link to="/exam/history" className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 transition-colors">
                <span className="material-symbols-outlined text-[18px] text-indigo-600">menu_book</span>
                {t('examCenter.historyMenu.readingListening')}
              </Link>
              <Link to="/exam/writing-history" className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-emerald-50 transition-colors border-t border-slate-100">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">edit_note</span>
                {t('examCenter.historyMenu.writing')}
              </Link>
              <Link to="/exam/speaking-history" className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-amber-50 transition-colors border-t border-slate-100">
                <span className="material-symbols-outlined text-[18px] text-amber-600">mic</span>
                {t('examCenter.historyMenu.speaking')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Skill Filter Tabs */}
      <div className="flex p-1 bg-white rounded-xl shadow-sm border border-slate-200 mb-8 w-fit overflow-x-auto">
        {SKILL_TAB_VALUES.map(value => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === value
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-500 hover:bg-primary/5'
            }`}
          >
            {tabLabel(value)}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">{t('examCenter.loading')}</p>
        </div>
      )}

      {/* Test Grid — from database */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => {
            const skills = test.testSkills?.map(s => s.skill) || [];
            const primarySkill = (skills[0] || 'READING') as Exclude<SkillFilter, 'ALL'>;
            const skillConfig: Record<string, { color: string; gradient: string; icon: string }> = {
              READING: { color: 'bg-primary/10 text-primary', gradient: 'from-[#13b6ec] to-[#0891b2]', icon: 'menu_book' },
              LISTENING: { color: 'bg-teal-100 text-teal-600', gradient: 'from-[#14b8a6] to-[#0d9488]', icon: 'headphones' },
              WRITING: { color: 'bg-violet-100 text-violet-600', gradient: 'from-[#8b5cf6] to-[#6d28d9]', icon: 'edit_note' },
              SPEAKING: { color: 'bg-amber-100 text-amber-600', gradient: 'from-[#f59e0b] to-[#d97706]', icon: 'mic' },
            };
            const cfg = skillConfig[primarySkill] || skillConfig.READING;
            const skillLabel = t(`examCenter.skills.${primarySkill}`);
            return (
            <div key={test.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
              <div className={`h-28 bg-gradient-to-br ${cfg.gradient} relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                <div className="absolute top-4 left-4">
                  <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/30 uppercase tracking-widest">
                    IELTS
                  </span>
                </div>
                <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/20">
                  <span className="material-symbols-outlined text-white text-[24px]">{cfg.icon}</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{test.title}</h3>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter shrink-0 ml-2 ${cfg.color}`}>{skillLabel}</span>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('examCenter.labels.duration')}</span>
                    <span className="text-sm font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">timer</span>
                      {t('examCenter.labels.durationMins', { count: test.durationInMinutes || 60 })}
                    </span>
                  </div>
                  <div className="w-[1px] h-8 bg-slate-100"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('examCenter.labels.status')}</span>
                    <span className="text-sm font-semibold flex items-center gap-1 text-green-600">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      {t('examCenter.labels.published')}
                    </span>
                  </div>
                </div>
                <Link
                  to={`/practice/${test.slug || test.id}`}
                  className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t('examCenter.actions.startTest')}</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          )})}
        </div>
      )}

      {!loading && filteredTests.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <span className="material-symbols-outlined text-4xl mb-2 block">quiz</span>
          <p>{t('examCenter.empty')}</p>
        </div>
      )}
    </div>
  );
}
