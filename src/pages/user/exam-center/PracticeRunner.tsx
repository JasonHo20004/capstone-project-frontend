import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePracticeTestDetail, useSubmitPracticeTest } from "@/hooks/api/use-practice";
import type { PracticeQuestion, PracticeQuestionGroup } from "@/lib/api/services/user/practice/practice.service";
import { ReadingShell, ListeningShell, WritingShell, SpeakingShell } from "@/components/user/exam-center/TestShell";

type AnswerMap = Record<string, unknown>;
type Mode = "reading" | "listening" | "writing" | "speaking";

export default function PracticeRunner() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const { data: test, isLoading, isError } = usePracticeTestDetail(testId);
  const submitMutation = useSubmitPracticeTest();

  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});

  const groups = useMemo(() => {
    if (!test) return [] as PracticeQuestionGroup[];
    return test.sections.flatMap((s) => s.parts.flatMap((p) => p.questionGroups));
  }, [test]);

  const questions = useMemo(() => {
    const all = groups.flatMap((g) => g.questions);
    return all as PracticeQuestion[];
  }, [groups]);

  const activeGroup = useMemo(() => {
    if (!groups.length) return null;
    const preferred = activeGroupId ? groups.find((g) => g.id === activeGroupId) : undefined;
    return preferred ?? groups[0];
  }, [groups, activeGroupId]);

  const activeQuestions = activeGroup?.questions ?? [];

  const handleSelect = (questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!testId) return;
    const res = await submitMutation.mutateAsync({ testId, submissions: answers });
    // Pass result via navigation state (quick integration). Can be persisted later.
    navigate(`/practice/${testId}/result`, { state: { result: res.data } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-600">
        Loading test...
      </div>
    );
  }

  if (isError || !test) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="bg-white border border-red-200 rounded-xl p-6 text-red-700">
          Failed to load test.
        </div>
      </div>
    );
  }

  // Infer mode from test type/sections
  const rawType = `${test.type ?? ""} ${test.sections.map((s) => s.type).join(" ")}`.toLowerCase();
  const inferredMode: Mode = rawType.includes("listen")
    ? "listening"
    : rawType.includes("speak")
    ? "speaking"
    : rawType.includes("writ")
    ? "writing"
    : "reading";

  const ShellComponent =
    inferredMode === "listening"
      ? ListeningShell
      : inferredMode === "writing"
      ? WritingShell
      : inferredMode === "speaking"
      ? SpeakingShell
      : ReadingShell;

  const leftContent = (
    <>
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h2 className="font-bold text-slate-700 flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-[20px] text-indigo-500">article</span>
          <span className="truncate">Context</span>
        </h2>
        <div className="flex gap-2">
          <select
            className="bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 px-3 py-1.5"
            value={activeGroup?.id ?? ""}
            onChange={(e) => setActiveGroupId(e.target.value)}
          >
            {groups.map((g, idx) => (
              <option key={g.id} value={g.id}>
                Group {idx + 1}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {activeGroup?.audioUrl ? (
          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Audio</p>
            <audio controls className="w-full">
              <source src={activeGroup.audioUrl} />
            </audio>
          </div>
        ) : null}

        {activeGroup?.imageUrl ? (
          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Image</p>
            <img src={activeGroup.imageUrl} alt="" className="w-full rounded-lg border border-slate-200" />
          </div>
        ) : null}

        {activeGroup?.passage ? (
          <div className="prose prose-slate max-w-none">
            <p className="whitespace-pre-wrap">{activeGroup.passage}</p>
          </div>
        ) : (
          <div className="text-sm text-slate-500">No passage for this question group.</div>
        )}
      </div>
    </>
  );

  const rightContent = (
    <>
      <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
        <h2 className="font-bold text-slate-700">Questions</h2>
        <div className="text-xs font-medium text-slate-500">{activeQuestions.length} items</div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="space-y-6">
          {activeQuestions.map((q, index) => {
            const chosen = answers[q.id];
            const num = questions.findIndex((x) => x.id === q.id) + 1;
            return (
              <div key={q.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex gap-4 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm">
                    {num || index + 1}
                  </span>
                  <p className="font-medium text-slate-800 pt-1">{q.questionText}</p>
                </div>

                {q.options?.length ? (
                  <div className="space-y-3 pl-12">
                    {q.options.map((opt) => (
                      <label
                        key={opt}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          chosen === opt
                            ? "border-indigo-200 bg-indigo-50"
                            : "border-slate-200 hover:bg-indigo-50 hover:border-indigo-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                          checked={chosen === opt}
                          onChange={() => handleSelect(q.id, opt)}
                        />
                        <span
                          className={`text-sm ${
                            chosen === opt ? "text-slate-900 font-medium" : "text-slate-600"
                          }`}
                        >
                          {opt}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="pl-12">
                    <textarea
                      className="w-full min-h-[120px] rounded-lg border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                      placeholder="Type your answer..."
                      value={typeof chosen === "string" ? chosen : ""}
                      onChange={(e) => handleSelect(q.id, e.target.value)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  const navigator = (
    <div className="flex flex-wrap gap-2">
      {questions.map((q, idx) => {
        const isAnswered = answers[q.id] !== undefined && answers[q.id] !== "";
        return (
          <button
            key={q.id}
            type="button"
            onClick={() => {
              const owning = groups.find((g) => g.questions.some((qq) => qq.id === q.id));
              if (owning) setActiveGroupId(owning.id);
            }}
            className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-colors border ${
              isAnswered
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
            title={q.questionText}
          >
            {idx + 1}
          </button>
        );
      })}
    </div>
  );

  return (
    <ShellComponent
      title={test.title}
      subtitle={test.type}
      durationSeconds={test.duration}
      totalQuestions={questions.length}
      answeredCount={Object.keys(answers).length}
      onSubmit={handleSubmit}
      isSubmitting={submitMutation.isPending}
      onBackClick={() => navigate("/dashboard")}
      backConfirm={{
        title: "Thoát khỏi bài làm?",
        description: "Bạn sẽ rời khỏi màn hình làm bài. Tiến độ hiện tại có thể bị mất. Bạn có chắc muốn thoát?",
        confirmText: "Thoát",
        cancelText: "Ở lại",
      }}
      leftContent={leftContent}
      rightContent={rightContent}
      navigator={navigator}
    />
  );
}

