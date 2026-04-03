import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSpeakingEvaluation } from '@/hooks/api/use-ai-evaluation';

function getBandColor(band: number | null): string {
  if (!band) return "text-slate-400";
  if (band >= 8) return "text-emerald-600";
  if (band >= 7) return "text-teal-600";
  if (band >= 6) return "text-blue-600";
  if (band >= 5) return "text-amber-600";
  return "text-red-500";
}

export default function SpeakingResultPage() {
  const { evaluationId } = useParams();
  const { data: result, isLoading, error } = useSpeakingEvaluation(evaluationId || null);

  if (isLoading || (result && (result.status === 'PENDING' || result.status === 'PROCESSING'))) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-amber-500/20 animate-pulse">
            <span className="material-symbols-outlined text-[28px]">grading</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Đang chấm điểm...</h2>
          <p className="text-sm text-slate-500">AI đang phân tích bài nói của bạn</p>
          <p className="text-xs text-slate-400 mt-1">Quá trình này có thể mất 30-60 giây</p>
        </div>
      </div>
    );
  }

  if (error || !result || result.status === 'FAILED') {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center font-sans">
        <div className="text-center p-8 bg-white rounded-2xl border border-slate-200">
          <span className="material-symbols-outlined text-red-500 text-5xl mb-4 block">error</span>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Không thể tải kết quả</h2>
          <p className="text-sm text-slate-500 mb-6">Kết quả không tồn tại hoặc đã có lỗi xảy ra.</p>
          <Link to="/exam" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">
            Quay lại Exam Center
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900">
      <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[18px]">mic</span>
          </div>
          <p className="font-bold text-slate-800">Speaking Result</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/exam/speaking-history" className="text-xs font-bold text-slate-500 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition">
            Lịch sử
          </Link>
          <Link to="/exam" className="text-xs font-bold text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition">
            Quay lại
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center mb-6 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Overall Band Score</p>
          <p className={`text-5xl font-black ${getBandColor(result.overallBand)}`}>
            {result.overallBand !== null ? result.overallBand.toFixed(1) : "N/A"}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { key: "fluencyScore", label: "Fluency & Coherence", icon: "waves" },
            { key: "vocabScore", label: "Lexical Resource", icon: "dictionary" },
            { key: "grammarScore", label: "Grammar Range", icon: "spellcheck" },
            { key: "pronunciationScore", label: "Pronunciation", icon: "record_voice_over" },
          ].map(({ key, label, icon }) => (
            <div key={key} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <span className="material-symbols-outlined text-slate-400 text-[20px] mb-1 block">{icon}</span>
              <p className={`text-2xl font-black ${getBandColor((result as any)[key])}`}>
                {(result as any)[key] !== null ? (result as any)[key].toFixed(1) : "—"}
              </p>
              <p className="text-[10px] font-bold text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {result.feedback && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-[18px]">lightbulb</span>
              Nhận xét chi tiết
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{result.feedback}</p>
          </div>
        )}

        {result.transcript && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mt-6">
            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-500 text-[18px]">history</span>
              Bản dịch băng ghi âm (Transcript)
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result.transcript}</p>
            </div>
            {result.audioUrl && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 mb-2">Bản ghi âm hoàn chỉnh:</p>
                <audio src={result.audioUrl} controls className="h-10 w-full opacity-80" />
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-8">
          <Link
            to="/exam"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            Luyện tiếp các phần khác
          </Link>
        </div>
      </div>
    </div>
  );
}
