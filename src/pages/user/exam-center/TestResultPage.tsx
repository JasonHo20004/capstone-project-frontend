import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "@/lib/api/config";

export default function TestResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    apiClient.get(`/tests/attempts/${sessionId}`)
      .then(r => setData(r.data?.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

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

  const bandNum = bandScore ?? 0;
  const scoreColor = bandNum >= 7 ? "text-green-600" : bandNum >= 5 ? "text-amber-600" : "text-red-600";
  const scoreBg = bandNum >= 7 ? "bg-green-50 border-green-200" : bandNum >= 5 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";
  const ringColor = bandNum >= 7 ? "#16a34a" : bandNum >= 5 ? "#d97706" : "#dc2626";
  const ringPct = bandNum > 0 ? (bandNum / 9) * 100 : 0; // Band 9 = 100%
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (ringPct / 100) * circumference;

  // Build details from userAnswers
  const details = (data.userAnswers || []).map((ua: any) => {
    const q = ua.question || {};
    const answerData = q.answer as any;
    const contentData = q.content as any;
    let correctAnswer = "";

    if (q.questionType === "MULTIPLE_CHOICE") {
      const options = contentData?.options || [];
      correctAnswer = options[answerData?.correctIndex] || "";
    } else if (q.questionType === "GAP_FILL" || q.questionType === "MATCHING") {
      correctAnswer = answerData?.text?.[0] || answerData?.correctAnswer || "";
    } else if (q.questionType === "TRUE_FALSE_NOT_GIVEN") {
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">fact_check</span>
                Answer Review
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
                    <tr key={i}
                      className={`border-b border-slate-100 transition-colors ${d.isCorrect ? "hover:bg-green-50/50" : "hover:bg-red-50/50"}`}>
                      <td className="px-4 py-3 font-bold text-indigo-600">{d.questionOrder || i + 1}</td>
                      <td className="px-4 py-3 text-slate-700 max-w-xs">
                        <span className="line-clamp-2">{d.questionText || `Question ${i + 1}`}</span>
                        {d.explanation && (
                          <p className="text-xs text-slate-400 mt-1 italic line-clamp-1">💡 {d.explanation}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          d.questionType === 'MULTIPLE_CHOICE' ? 'bg-blue-100 text-blue-600'
                          : d.questionType === 'TRUE_FALSE_NOT_GIVEN' ? 'bg-purple-100 text-purple-600'
                          : 'bg-orange-100 text-orange-600'
                        }`}>
                          {d.questionType === 'MULTIPLE_CHOICE' ? 'MCQ'
                            : d.questionType === 'TRUE_FALSE_NOT_GIVEN' ? 'T/F/NG'
                            : d.questionType === 'GAP_FILL' ? 'Fill'
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
    </div>
  );
}
