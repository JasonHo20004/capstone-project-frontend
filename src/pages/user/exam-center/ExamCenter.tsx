import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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

export default function ExamCenter() {
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Title */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">IELTS Exam Center</h2>
          <p className="text-slate-500 mt-1">
            Practice all 4 IELTS skills — Reading, Writing, Listening, Speaking.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span className="material-symbols-outlined text-[16px]">info</span>
          <span>Tests are timed and follow official IELTS guidelines</span>
        </div>
      </div>

      {/* Skill Filter Tabs */}
      <div className="flex p-1 bg-white rounded-xl shadow-sm border border-slate-200 mb-8 w-fit overflow-x-auto">
        <button className="px-8 py-2.5 rounded-lg text-sm font-bold transition-all bg-primary text-white shadow-md whitespace-nowrap cursor-pointer">
          All Skills
        </button>
        <button className="px-8 py-2.5 rounded-lg text-sm font-bold transition-all text-slate-500 hover:bg-primary/5 whitespace-nowrap cursor-pointer">
          Reading
        </button>
        <button className="px-8 py-2.5 rounded-lg text-sm font-bold transition-all text-slate-500 hover:bg-primary/5 whitespace-nowrap cursor-pointer">
          Writing
        </button>
        <button className="px-8 py-2.5 rounded-lg text-sm font-bold transition-all text-slate-500 hover:bg-primary/5 whitespace-nowrap cursor-pointer">
          Listening
        </button>
        <button className="px-8 py-2.5 rounded-lg text-sm font-bold transition-all text-slate-500 hover:bg-primary/5 whitespace-nowrap cursor-pointer">
          Speaking
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading tests...</p>
        </div>
      )}

      {/* Test Grid — from database */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <div key={test.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
              <div className="h-28 bg-gradient-to-br from-[#13b6ec] to-[#0891b2] relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                <div className="absolute top-4 left-4">
                  <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/30 uppercase tracking-widest">
                    IELTS
                  </span>
                </div>
                <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/20">
                  <span className="material-symbols-outlined text-white text-[24px]">menu_book</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{test.title}</h3>
                  {(() => {
                    const skills = test.testSkills?.map(s => s.skill) || [];
                    const isListening = skills.includes('LISTENING');
                    const label = isListening ? 'Listening' : 'Reading';
                    const color = isListening ? 'bg-teal-100 text-teal-600' : 'bg-primary/10 text-primary';
                    return <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter shrink-0 ml-2 ${color}`}>{label}</span>;
                  })()}
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Duration</span>
                    <span className="text-sm font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">timer</span>
                      {test.durationInMinutes || 60} mins
                    </span>
                  </div>
                  <div className="w-[1px] h-8 bg-slate-100"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status</span>
                    <span className="text-sm font-semibold flex items-center gap-1 text-green-600">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Published
                    </span>
                  </div>
                </div>
                <Link
                  to={`/exam/test/${test.slug || test.id}`}
                  className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Start Test</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          ))}

          {/* Static cards for Writing and Speaking (no DB data yet) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            <div className="h-28 bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
              <div className="absolute top-4 left-4">
                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/30 uppercase tracking-widest">IELTS</span>
              </div>
              <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/20">
                <span className="material-symbols-outlined text-white text-[24px]">edit_note</span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-slate-900 leading-tight">IELTS Writing Task 2</h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter shrink-0 ml-2 bg-violet-100 text-violet-600">Writing</span>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Duration</span>
                  <span className="text-sm font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">timer</span>
                    40 mins
                  </span>
                </div>
              </div>
              <Link to="/exam/test/writing" className="w-full bg-violet-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all flex items-center justify-center gap-2 cursor-pointer">
                <span>Start Writing Test</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            <div className="h-28 bg-gradient-to-br from-[#f59e0b] to-[#d97706] relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
              <div className="absolute top-4 left-4">
                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/30 uppercase tracking-widest">IELTS</span>
              </div>
              <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/20">
                <span className="material-symbols-outlined text-white text-[24px]">mic</span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-slate-900 leading-tight">IELTS Speaking Workshop</h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter shrink-0 ml-2 bg-amber-100 text-amber-600">Speaking</span>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Duration</span>
                  <span className="text-sm font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">timer</span>
                    15 mins
                  </span>
                </div>
              </div>
              <Link to="/exam/test/speaking" className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all flex items-center justify-center gap-2 cursor-pointer">
                <span>Start Speaking Test</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {!loading && tests.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <span className="material-symbols-outlined text-4xl mb-2 block">quiz</span>
          <p>No IELTS reading tests available yet.</p>
        </div>
      )}
    </div>
  );
}
