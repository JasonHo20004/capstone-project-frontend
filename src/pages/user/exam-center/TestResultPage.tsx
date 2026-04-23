import { useState, useEffect, useCallback, Fragment } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "@/lib/api/config";
import DiscussionSection from "@/components/DiscussionSection";
import AiTutorPanel from "@/components/AiTutorPanel";
import { assessmentService } from "@/lib/api/services/user/assessment/assessment.service";

interface QuestionDetail {
  questionId: string;
  questionOrder: number;
  questionText: string;
  questionType: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string | null;
  options?: string[];
  content?: any;
}

export default function TestResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [passage, setPassage] = useState("");
  const [tutorOpen, setTutorOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<{
    questionId: string;
    questionText: string;
    questionType: string;
    options: string[];
    correctAnswer: string;
    userAnswer: string;
    questionOrder: number;
  } | null>(null);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({});

  const fetchResultComments = useCallback(async (page: number, limit: number) => {
    if (!data?.testId) return { comments: [], total: 0 };
    const res = await assessmentService.getTestComments(data.testId, page, limit);
    return { comments: res.data?.comments ?? [], total: res.data?.total ?? 0 };
  }, [data?.testId]);

  const postResultComment = useCallback(async (content: string, parentCommentId?: string) => {
    if (!data?.testId) return;
    return assessmentService.postTestComment(data.testId, content, parentCommentId);
  }, [data?.testId]);

  useEffect(() => {
    if (!sessionId) return;
    apiClient.get(`/tests/attempts/${sessionId}`)
      .then(r => setData(r.data?.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Fetch passage from test data
  useEffect(() => {
    if (!data?.testId) return;
    apiClient.get(`/tests/${data.testId}`)
      .then(r => {
        const test = r.data?.data;
        if (test?.sections) {
          const allPassages = test.sections
            .flatMap((s: any) => (s.passages || []).map((p: any) => p.content))
            .filter(Boolean);
          setPassage(allPassages.join("\n\n---\n\n"));
        }
      })
      .catch(console.error);
  }, [data?.testId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="text-slate-500">Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-5xl text-slate-300">error_outline</span>
          <p className="text-slate-500 text-lg">Không tìm thấy kết quả</p>
          <Link to="/exam" className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            ← Exam Center
          </Link>
        </div>
      </div>
    );
  }

  // Parse score
  const rawScore = data.rawScoresBySkill || {};
  const correctCount = rawScore.correct ?? 0;
  const total = rawScore.total ?? 0;
  const pct = rawScore.percentage ?? (total > 0 ? Math.round((correctCount / total) * 100) : 0);
  const bandScore = rawScore.bandScore ?? data.overallScaledScore ?? null;
  const band = bandScore != null ? bandScore.toFixed(1) : "—";
  const testTitle = data.test?.title || "Bài thi";
  const skills = data.test?.testSkills?.map((s: any) => s.skill) || [];
  const isListeningTest = skills.includes("LISTENING");
  const tutorPassage = passage || (isListeningTest ? "[LISTENING]" : "");

  const bandNum = bandScore ?? 0;
  const scoreColor = bandNum >= 7 ? "text-green-600" : bandNum >= 5 ? "text-amber-600" : "text-red-600";
  const scoreBg = bandNum >= 7 ? "bg-green-50 border-green-200" : bandNum >= 5 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";
  const ringColor = bandNum >= 7 ? "#16a34a" : bandNum >= 5 ? "#d97706" : "#dc2626";
  const ringPct = bandNum > 0 ? (bandNum / 9) * 100 : 0;
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (ringPct / 100) * circumference;

  // Build details from userAnswers
  const details: QuestionDetail[] = (data.userAnswers || []).map((ua: any) => {
    const q = ua.question || {};
    const answerData = q.answer as any;
    const contentData = q.content as any;
    let correctAnswer = "";
    const options: string[] = contentData?.options || [];

    if (q.questionType === "MULTIPLE_CHOICE") {
      correctAnswer = options[answerData?.correctIndex] || "";
    } else if (q.questionType === "MULTIPLE_CHOICE_MULTI_ANSWER") {
      const indices = answerData?.correctIndices || [];
      correctAnswer = indices.map((i: number) => String.fromCharCode(65 + i) + '. ' + options[i]).join(', ');
    } else if (q.questionType === "GAP_FILL" || q.questionType === "MATCHING" || q.questionType === "SHORT_ANSWER") {
      correctAnswer = answerData?.text?.[0] || answerData?.correctAnswer || "";
    } else if (q.questionType === "TRUE_FALSE_NOT_GIVEN" || q.questionType === "YES_NO_NOT_GIVEN") {
      correctAnswer = answerData?.correctAnswer || "";
    }

    return {
      questionId: ua.questionId,
      questionOrder: q.questionOrder,
      questionText: contentData?.text || q.questionText || "",
      questionType: q.questionType,
      userAnswer: ua.answerText || "(no answer)",
      correctAnswer,
      isCorrect: ua.isCorrect,
      explanation: q.explanation || null,
      options,
      content: contentData,
    };
  });

  const wrongCount = details.filter(d => !d.isCorrect).length;

  const handleExplainClick = (d: QuestionDetail) => {
    setSelectedQuestion({
      questionId: d.questionId,
      questionText: d.questionText || `Question ${d.questionOrder}`,
      questionType: d.questionType,
      options: d.options || [],
      correctAnswer: d.correctAnswer,
      userAnswer: d.userAnswer,
      questionOrder: d.questionOrder,
    });
    setTutorOpen(true);
  };

  const toggleExplanation = (qOrder: number) => {
    setExpandedExplanations(prev => ({ ...prev, [qOrder]: !prev[qOrder] }));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center px-6 justify-between">
        <Link to="/exam" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Exam Center
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-500">{testTitle}</span>
          {skills.map((s: string) =>
            <span key={s} className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
              s === "LISTENING" ? "bg-teal-100 text-teal-700" : "bg-indigo-100 text-indigo-700"
            }`}>{s}</span>
          )}
        </div>
        <Link to="/exam/history" className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">history</span>
          Lịch sử
        </Link>
      </header>

      <div className="max-w-5xl mx-auto p-8">
        {/* Score Summary */}
        <div className={`rounded-2xl border shadow-sm p-8 mb-8 ${scoreBg}`}>
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Score Ring */}
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

            {/* Stats */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Test Completed! 🎉</h2>
              <p className="text-sm text-slate-500 mb-4">{testTitle}</p>
              <div className="flex flex-wrap items-center gap-6 justify-center md:justify-start">
                <div>
                  <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Correct</p>
                  <p className="text-2xl font-black text-slate-800">{correctCount}<span className="text-base text-slate-400 font-medium">/{total}</span></p>
                </div>
                <div className="w-px h-10 bg-slate-200 hidden md:block"></div>
                <div>
                  <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Band Score</p>
                  <p className={`text-2xl font-black ${scoreColor}`}>{band}</p>
                </div>
                <div className="w-px h-10 bg-slate-200 hidden md:block"></div>
                <div>
                  <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Accuracy</p>
                  <p className="text-2xl font-black text-slate-800">{pct}%</p>
                </div>
                <div className="w-px h-10 bg-slate-200 hidden md:block"></div>
                <div>
                  <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Wrong</p>
                  <p className="text-2xl font-black text-red-600">{total - correctCount}</p>
                </div>
                <div className="w-px h-10 bg-slate-200 hidden md:block"></div>
                <div>
                  <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Thời gian</p>
                  <p className="text-sm font-medium text-slate-600">
                    {data.completedAt ? new Date(data.completedAt).toLocaleString("vi-VN") : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answer Review Table */}
        {details.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600">fact_check</span>
                  Answer Review
                </h3>
                <p className="text-xs text-slate-400 mt-1">So sánh đáp án của bạn với đáp án đúng</p>
              </div>
              {wrongCount > 0 && tutorPassage && (
                <button
                  onClick={() => { setSelectedQuestion(null); setTutorOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 text-white text-sm font-bold rounded-xl hover:from-indigo-700 hover:to-sky-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl"
                >
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                  🤖 AI Tutor ({wrongCount} câu sai)
                </button>
              )}
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
                    <th className="px-4 py-3 text-center font-bold text-slate-500 text-xs uppercase tracking-wider w-20">AI</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((d: QuestionDetail, i: number) => (
                    <Fragment key={d.questionId || i}>
                      <tr
                        className={`border-b border-slate-100 transition-colors ${d.isCorrect ? "hover:bg-green-50/50" : "hover:bg-red-50/50"}`}>
                        <td className="px-4 py-3 font-bold text-indigo-600">{d.questionOrder || i + 1}</td>
                        <td className="px-4 py-3 text-slate-700 max-w-xs">
                          <span className="line-clamp-2">{d.questionText || `Question ${i + 1}`}</span>
                          {d.explanation && (
                            <button
                              onClick={() => toggleExplanation(d.questionOrder || i)}
                              className="text-xs text-indigo-500 hover:text-indigo-700 mt-1 flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {expandedExplanations[d.questionOrder || i] ? "expand_less" : "lightbulb"}
                              </span>
                              {expandedExplanations[d.questionOrder || i] ? "Ẩn" : "Lời giải"}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            (d.questionType === 'MULTIPLE_CHOICE' || d.questionType === 'MULTIPLE_CHOICE_MULTI_ANSWER') ? 'bg-blue-100 text-blue-600'
                            : (d.questionType === 'TRUE_FALSE_NOT_GIVEN' || d.questionType === 'YES_NO_NOT_GIVEN') ? 'bg-teal-100 text-teal-600'
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
                        <td className="px-4 py-3 text-center">
                          {!d.isCorrect && tutorPassage && (
                            <button
                              onClick={() => handleExplainClick(d)}
                              className="group relative inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-600 transition-all duration-200"
                              title="AI Giải thích"
                            >
                              <span className="material-symbols-outlined text-indigo-600 group-hover:text-white text-[18px] transition-colors">
                                psychology
                              </span>
                            </button>
                          )}
                        </td>
                      </tr>
                      {/* Expandable explanation row */}
                      {d.explanation && expandedExplanations[d.questionOrder || i] && (
                        <tr key={`exp-${i}`} className="bg-amber-50/50">
                          <td colSpan={7} className="px-6 py-3">
                            <div className="flex items-start gap-2 text-sm text-amber-800">
                              <span className="material-symbols-outlined text-amber-500 text-[16px] mt-0.5 shrink-0">lightbulb</span>
                              <span>{d.explanation}</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Discussion Section */}
        {data?.testId && (
          <DiscussionSection
            fetchComments={fetchResultComments}
            postComment={postResultComment}
            title="Thảo luận"
            subtitle="Chia sẻ kinh nghiệm, hỏi đáp về bài thi này"
          />
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link to="/exam" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
            ← Exam Center
          </Link>
          <Link to="/exam/history" className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-bold border-2 border-indigo-200 hover:bg-indigo-50 transition-colors">
            📊 Lịch sử làm bài
          </Link>
        </div>
      </div>

      {/* Floating AI Tutor Button */}
      {passage && wrongCount > 0 && !tutorOpen && (
        <button
          onClick={() => { setSelectedQuestion(null); setTutorOpen(true); }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-sky-600 text-white rounded-2xl font-bold shadow-2xl shadow-indigo-300 hover:shadow-xl hover:scale-105 transition-all duration-200 group"
        >
          <span className="material-symbols-outlined text-[22px] group-hover:animate-pulse">psychology</span>
          <span className="text-sm">AI Tutor</span>
          <span className="w-5 h-5 rounded-full bg-white/20 text-[11px] font-bold flex items-center justify-center">
            {wrongCount}
          </span>
        </button>
      )}

      {/* AI Tutor Panel */}
      <AiTutorPanel
        isOpen={tutorOpen}
        onClose={() => { setTutorOpen(false); setSelectedQuestion(null); }}
        passage={tutorPassage}
        question={selectedQuestion}
        practiceSessionId={sessionId || ""}
        testTitle={testTitle}
        testSkill={isListeningTest ? "LISTENING" : "READING"}
      />
    </div>
  );
}
