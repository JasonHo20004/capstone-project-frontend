import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import apiClient from "@/lib/api/config";
import DiscussionSection from "@/components/DiscussionSection";
import { assessmentService } from "@/lib/api/services/user/assessment/assessment.service";

interface TestInfo {
  id: string;
  title: string;
  durationInMinutes: number | null;
  totalScore: number | null;
  practiceCount: number | null;
  testSkills?: { skill: string }[];
  sections: { id: string; title: string; totalQuestions: number | null; questions: any[] }[];
}

export default function TestDetailPage() {
  const { testId, sessionId } = useParams<{ testId: string; sessionId?: string }>();
  const navigate = useNavigate();

  // Overview state
  const [test, setTest] = useState<TestInfo | null>(null);
  const [loadingTest, setLoadingTest] = useState(true);

  // Result state
  const [resultData, setResultData] = useState<any>(null);
  const [loadingResult, setLoadingResult] = useState(!!sessionId);

  const isResultMode = !!sessionId;

  const fetchTestComments = useCallback(async (page: number, limit: number) => {
    if (!testId) return { comments: [], total: 0 };
    const res = await assessmentService.getTestComments(testId, page, limit);
    return { comments: res.data?.comments ?? [], total: res.data?.total ?? 0 };
  }, [testId]);

  const postTestComment = useCallback(async (content: string, parentCommentId?: string) => {
    if (!testId) return;
    return assessmentService.postTestComment(testId, content, parentCommentId);
  }, [testId]);

  // Fetch test info (always needed for overview + discussion)
  useEffect(() => {
    if (!testId) return;
    apiClient.get(`/tests/${testId}`)
      .then((r) => setTest(r.data?.data))
      .catch(() => {})
      .finally(() => setLoadingTest(false));
  }, [testId]);

  // Fetch result data (only in result mode)
  useEffect(() => {
    if (!sessionId) return;
    apiClient.get(`/tests/attempts/${sessionId}`)
      .then((r) => setResultData(r.data?.data))
      .catch(() => {})
      .finally(() => setLoadingResult(false));
  }, [sessionId]);

  // Loading
  if (loadingTest || loadingResult) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="text-slate-500">{isResultMode ? "Đang tải kết quả..." : "Đang tải thông tin bài thi..."}</p>
        </div>
      </div>
    );
  }

  // Error
  if (!test && !resultData) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 max-w-md text-center">
          <span className="material-symbols-outlined text-red-500 text-5xl mb-4 block">error</span>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Lỗi</h2>
          <p className="text-slate-600 mb-6">Không tìm thấy bài thi</p>
          <Link to="/exam" className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
            ← Exam Center
          </Link>
        </div>
      </div>
    );
  }

  const skills = test?.testSkills?.map((s) => s.skill) || resultData?.test?.testSkills?.map((s: any) => s.skill) || [];
  const testTitle = test?.title || resultData?.test?.title || "Bài thi";
  const totalQuestions = test ? test.sections.reduce((acc, s) => acc + (s.totalQuestions || s.questions?.length || 0), 0) : 0;

  const skillColor: Record<string, string> = {
    READING: "bg-indigo-100 text-indigo-700 border-indigo-200",
    LISTENING: "bg-teal-100 text-teal-700 border-teal-200",
    WRITING: "bg-emerald-100 text-emerald-700 border-emerald-200",
    SPEAKING: "bg-amber-100 text-amber-700 border-amber-200",
  };
  const skillIcon: Record<string, string> = {
    READING: "menu_book",
    LISTENING: "headphones",
    WRITING: "edit_note",
    SPEAKING: "mic",
  };

  // ─── Result calculations ──────────────────────────────────────────────────
  let band = "—", correctCount = 0, total = 0, pct = 0, scoreColor = "", scoreBg = "", ringColor = "#e2e8f0", ringPct = 0;
  let details: any[] = [];

  if (isResultMode && resultData) {
    const rawScore = resultData.rawScoresBySkill || {};
    correctCount = rawScore.correct ?? 0;
    total = rawScore.total ?? 0;
    pct = rawScore.percentage ?? (total > 0 ? Math.round((correctCount / total) * 100) : 0);
    const bandScore = rawScore.bandScore ?? resultData.overallScaledScore ?? null;
    band = bandScore != null ? bandScore.toFixed(1) : "—";
    const bandNum = bandScore ?? 0;
    scoreColor = bandNum >= 7 ? "text-green-600" : bandNum >= 5 ? "text-amber-600" : "text-red-600";
    scoreBg = bandNum >= 7 ? "bg-green-50 border-green-200" : bandNum >= 5 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";
    ringColor = bandNum >= 7 ? "#16a34a" : bandNum >= 5 ? "#d97706" : "#dc2626";
    ringPct = bandNum > 0 ? (bandNum / 9) * 100 : 0;

    details = (resultData.userAnswers || []).map((ua: any) => {
      const q = ua.question || {};
      const answerData = q.answer as any;
      const contentData = q.content as any;
      let correctAnswer = "";
      if (q.questionType === "MULTIPLE_CHOICE") {
        correctAnswer = (contentData?.options || [])[answerData?.correctIndex] || "";
      } else if (q.questionType === "MULTIPLE_CHOICE_MULTI_ANSWER") {
        const options = contentData?.options || [];
        const indices = answerData?.correctIndices || [];
        correctAnswer = indices.map((i: number) => String.fromCharCode(65 + i) + '. ' + options[i]).join(', ');
      } else if (q.questionType === "GAP_FILL" || q.questionType === "MATCHING" || q.questionType === "SHORT_ANSWER") {
        correctAnswer = answerData?.text?.[0] || answerData?.correctAnswer || "";
      } else if (q.questionType === "TRUE_FALSE_NOT_GIVEN" || q.questionType === "YES_NO_NOT_GIVEN") {
        correctAnswer = answerData?.correctAnswer || "";
      }
      return {
        questionOrder: q.questionOrder,
        questionText: contentData?.text || q.questionText || "",
        questionType: q.questionType,
        userAnswer: ua.answerText || "(no answer)",
        correctAnswer,
        isCorrect: ua.isCorrect,
        explanation: q.explanation || null,
      };
    });
  }

  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (ringPct / 100) * circumference;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center px-6 justify-between">
        <Link to="/exam" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Exam Center
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-500">{testTitle}</span>
          {skills.map((s: string) => (
            <span key={s} className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase border ${skillColor[s] || "bg-slate-100 text-slate-600"}`}>
              {s}
            </span>
          ))}
        </div>
        {isResultMode && (
          <Link to="/exam/history" className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">history</span>
            Lịch sử
          </Link>
        )}
      </header>

      <div className="max-w-5xl mx-auto p-8">

        {/* ═══════ RESULT MODE ═══════ */}
        {isResultMode && resultData ? (
          <>
            {/* Score Summary */}
            <div className={`rounded-2xl border shadow-sm p-8 mb-8 ${scoreBg}`}>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-36 h-36 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                    <circle cx="60" cy="60" r="54" fill="none" stroke={ringColor} strokeWidth="8"
                      strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
                      style={{ transition: "stroke-dashoffset 1s ease-in-out" }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-black ${scoreColor}`}>{band}</span>
                    <span className="text-xs text-slate-400">Band</span>
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Hoàn thành bài thi! 🎉</h2>
                  <p className="text-sm text-slate-500 mb-4">{testTitle}</p>
                  <div className="flex flex-wrap items-center gap-6 justify-center md:justify-start">
                    <div>
                      <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Đúng</p>
                      <p className="text-2xl font-black text-slate-800">{correctCount}<span className="text-base text-slate-400 font-medium">/{total}</span></p>
                    </div>
                    <div className="w-px h-10 bg-slate-200 hidden md:block" />
                    <div>
                      <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Band Score</p>
                      <p className={`text-2xl font-black ${scoreColor}`}>{band}</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200 hidden md:block" />
                    <div>
                      <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Độ chính xác</p>
                      <p className="text-2xl font-black text-slate-800">{pct}%</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200 hidden md:block" />
                    <div>
                      <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Sai</p>
                      <p className="text-2xl font-black text-red-600">{total - correctCount}</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200 hidden md:block" />
                    <div>
                      <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Thời gian</p>
                      <p className="text-sm font-medium text-slate-600">
                        {resultData.completedAt ? new Date(resultData.completedAt).toLocaleString("vi-VN") : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Answer Review Table */}
            {details.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600">fact_check</span>
                    Chi tiết đáp án
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">So sánh đáp án của bạn với đáp án đúng</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 text-left font-bold text-slate-500 text-xs uppercase tracking-wider w-12">Q#</th>
                        <th className="px-4 py-3 text-left font-bold text-slate-500 text-xs uppercase tracking-wider">Câu hỏi</th>
                        <th className="px-4 py-3 text-left font-bold text-slate-500 text-xs uppercase tracking-wider w-24">Loại</th>
                        <th className="px-4 py-3 text-left font-bold text-slate-500 text-xs uppercase tracking-wider">Đáp án của bạn</th>
                        <th className="px-4 py-3 text-left font-bold text-slate-500 text-xs uppercase tracking-wider">Đáp án đúng</th>
                        <th className="px-4 py-3 text-center font-bold text-slate-500 text-xs uppercase tracking-wider w-16">KQ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.map((d: any, i: number) => (
                        <tr key={i} className={`border-b border-slate-100 transition-colors ${d.isCorrect ? "hover:bg-green-50/50" : "hover:bg-red-50/50"}`}>
                          <td className="px-4 py-3 font-bold text-indigo-600">{d.questionOrder || i + 1}</td>
                          <td className="px-4 py-3 text-slate-700 max-w-xs">
                            <span className="line-clamp-2">{d.questionText || `Question ${i + 1}`}</span>
                            {d.explanation && <p className="text-xs text-slate-400 mt-1 italic line-clamp-1">💡 {d.explanation}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              (d.questionType === 'MULTIPLE_CHOICE' || d.questionType === 'MULTIPLE_CHOICE_MULTI_ANSWER') ? 'bg-blue-100 text-blue-600'
                              : (d.questionType === 'TRUE_FALSE_NOT_GIVEN' || d.questionType === 'YES_NO_NOT_GIVEN') ? 'bg-purple-100 text-purple-600'
                              : 'bg-orange-100 text-orange-600'
                            }`}>
                              {d.questionType === 'MULTIPLE_CHOICE' ? 'MCQ'
                                : d.questionType === 'MULTIPLE_CHOICE_MULTI_ANSWER' ? 'MCQ (Multi)'
                                : d.questionType === 'TRUE_FALSE_NOT_GIVEN' ? 'T/F/NG'
                                : d.questionType === 'YES_NO_NOT_GIVEN' ? 'Y/N/NG'
                                : d.questionType === 'GAP_FILL' ? 'Fill'
                                : d.questionType === 'SHORT_ANSWER' ? 'Short Ans'
                                : d.questionType}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-semibold ${d.isCorrect ? "text-green-700" : "text-red-700"}`}>
                              {d.userAnswer || "(no answer)"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-green-700">{d.correctAnswer}</td>
                          <td className="px-4 py-3 text-center">
                            {d.isCorrect ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100">
                                <span className="material-symbols-outlined text-green-600 text-[18px]">check</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100">
                                <span className="material-symbols-outlined text-red-600 text-[18px]">close</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ═══════ OVERVIEW MODE ═══════ */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
            {/* Banner */}
            <div className="h-32 bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-500 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,_white,_transparent_70%)]" />
              <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white drop-shadow-sm">{testTitle}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    {skills.map((s: string) => (
                      <span key={s} className="flex items-center gap-1 text-white/80 text-xs font-medium">
                        <span className="material-symbols-outlined text-[16px]">{skillIcon[s] || "quiz"}</span>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                {test?.practiceCount != null && test.practiceCount > 0 && (
                  <span className="text-xs text-white/70 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                    {test.practiceCount} lượt luyện
                  </span>
                )}
              </div>
            </div>

            <div className="p-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center bg-slate-50 rounded-xl p-4">
                  <span className="material-symbols-outlined text-indigo-500 text-2xl mb-1 block">timer</span>
                  <p className="text-2xl font-black text-slate-800">{test?.durationInMinutes || "—"}</p>
                  <p className="text-xs text-slate-400 font-medium">phút</p>
                </div>
                <div className="text-center bg-slate-50 rounded-xl p-4">
                  <span className="material-symbols-outlined text-indigo-500 text-2xl mb-1 block">help</span>
                  <p className="text-2xl font-black text-slate-800">{totalQuestions}</p>
                  <p className="text-xs text-slate-400 font-medium">câu hỏi</p>
                </div>
                <div className="text-center bg-slate-50 rounded-xl p-4">
                  <span className="material-symbols-outlined text-indigo-500 text-2xl mb-1 block">category</span>
                  <p className="text-2xl font-black text-slate-800">{test?.sections.length || 0}</p>
                  <p className="text-xs text-slate-400 font-medium">phần</p>
                </div>
              </div>

              {/* Sections */}
              {test && test.sections.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-indigo-500">list</span>
                    Cấu trúc bài thi
                  </h3>
                  <div className="space-y-2">
                    {test.sections.map((sec, idx) => (
                      <div key={sec.id} className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
                        <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                        <span className="text-sm text-slate-700 font-medium flex-1">{sec.title}</span>
                        <span className="text-xs text-slate-400">{sec.totalQuestions || sec.questions?.length || 0} câu</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Start button */}
              <button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all text-lg flex items-center justify-center gap-2 cursor-pointer"
                onClick={() => navigate(`/exam/test/${testId}`)}
              >
                <span className="material-symbols-outlined text-[22px]">play_arrow</span>
                Bắt đầu làm bài
              </button>
              <p className="text-xs text-slate-400 text-center mt-2">
                Thời gian sẽ bắt đầu đếm ngược khi bạn vào bài thi
              </p>
            </div>
          </div>
        )}

        {/* ═══════ DISCUSSION (always shown) ═══════ */}
        {testId && (
          <DiscussionSection
            fetchComments={fetchTestComments}
            postComment={postTestComment}
            title="Thảo luận"
            subtitle="Chia sẻ kinh nghiệm, hỏi đáp về bài thi này"
          />
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link to="/exam" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
            ← Exam Center
          </Link>
          {isResultMode && (
            <Link to="/exam/history" className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-bold border-2 border-indigo-200 hover:bg-indigo-50 transition-colors">
              📊 Lịch sử làm bài
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
