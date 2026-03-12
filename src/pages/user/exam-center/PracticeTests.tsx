import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { usePracticeTests } from "@/hooks/api/use-practice";
import type { PracticeTestSummary } from "@/lib/api/services/user/practice/practice.service";

export default function PracticeTests() {
  const { data, isLoading, isError } = usePracticeTests();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const tests = useMemo(() => {
    const raw = (data ?? []) as Array<PracticeTestSummary | null | undefined>;
    return raw.filter(Boolean) as PracticeTestSummary[];
  }, [data]);

  const types = useMemo(
    () => Array.from(new Set(tests.map((t) => t.type))).filter(Boolean).sort(),
    [tests],
  );

  const filtered = useMemo(
    () =>
      tests.filter((t) => {
        const title = (t.title ?? "").toString();
        const type = (t.type ?? "").toString();
        const matchesSearch =
          !search ||
          title.toLowerCase().includes(search.toLowerCase()) ||
          type.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === "all" || type === typeFilter;
        return matchesSearch && matchesType;
      }),
    [tests, search, typeFilter],
  );

  return (
    <div className="text-slate-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Practice tests</h2>
            <p className="text-slate-500 mt-1 text-sm">
              Tìm và bắt đầu các bài luyện kỹ năng Reading/Listening/Writing/Speaking.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or type..."
                className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#13b6ec]/20 outline-none"
              />
            </div>

            {/* Type filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 px-3 py-2 min-w-[150px]"
              >
                <option value="all">All types</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-600">
            Loading practice tests...
          </div>
        ) : isError ? (
          <div className="bg-white border border-red-200 rounded-xl p-6 text-red-700">
            Failed to load practice tests.
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-500 text-sm">
            No tests match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-xl border border-[#13b6ec]/10 shadow-[0_4px_20px_-2px_rgba(19,182,236,0.08)] overflow-hidden"
              >
                <div className="h-28 bg-gradient-to-br from-[#13b6ec] to-[#13b6ec]/60 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/30 uppercase tracking-widest">
                      {t.type}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.title}</h3>
                  <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px] text-slate-400">timer</span>
                      {Math.round(t.duration / 60)} mins
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px] text-slate-400">help</span>
                      {t.totalQuestions} questions
                    </span>
                  </div>

                  <Link
                    to={`/practice/${t.id}`}
                    className="mt-6 w-full bg-[#13b6ec] text-white font-bold py-3 rounded-xl shadow-lg shadow-[#13b6ec]/20 hover:bg-[#13b6ec]/90 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Start</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

