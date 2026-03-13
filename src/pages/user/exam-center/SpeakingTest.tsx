import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useSubmitSpeaking, useSpeakingEvaluation } from "@/hooks/api/use-ai-evaluation";

export default function SpeakingTest() {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "stopped">("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [maxDuration] = useState(120); // 2 minutes
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Hooks ──────────────────────────────────────────────────────────────────
  const submitSpeaking = useSubmitSpeaking();
  const { data: evaluation } = useSpeakingEvaluation(evaluationId);

  // User ID
  const getUserId = () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.userId || payload.sub || "anonymous";
      }
    } catch { /* ignore */ }
    return "anonymous";
  };

  // ─── Recording Timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (recordingState === "recording") {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration - 1) {
            stopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recordingState, maxDuration]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ─── Start Recording ───────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every 1s
      setRecordingState("recording");
      setRecordingTime(0);
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Không thể truy cập microphone. Vui lòng cấp quyền truy cập.");
    }
  }, []);

  // ─── Stop Recording ─────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecordingState("stopped");
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!audioBlob || isSubmitting) return;
    setIsSubmitting(true);

    try {
      // For now, create a temporary object URL as the "audio URL"
      // In production, this would upload to S3 via presigned URL
      const audioUrl = URL.createObjectURL(audioBlob);

      const result = await submitSpeaking.mutateAsync({
        userId: getUserId(),
        audioUrl,
      });
      setEvaluationId(result.data?.evaluationId || null);
      setShowResult(true);
    } catch (err) {
      console.error("Submit failed:", err);
      setIsSubmitting(false);
    }
  }, [audioBlob, isSubmitting, submitSpeaking]);

  // When evaluation completes
  useEffect(() => {
    if (evaluation?.status === "COMPLETED" || evaluation?.status === "FAILED") {
      setIsSubmitting(false);
    }
  }, [evaluation?.status]);

  // ─── Result Screen ─────────────────────────────────────────────────────────
  if (showResult) {
    return (
      <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-900">
        <header className="h-20 flex items-center justify-between px-8 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <span className="material-symbols-outlined">mic</span>
            </div>
            <h1 className="font-bold text-lg text-slate-900">Speaking Assessment Results</h1>
          </div>
          <Link to="/practice" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">← Back to Tests</Link>
        </header>

        <div className="max-w-3xl mx-auto p-8">
          {/* Loading */}
          {(!evaluation || evaluation.status === "PENDING" || evaluation.status === "PROCESSING") && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Đang phân tích...</h2>
              <p className="text-slate-500">AI đang nghe và chấm bài nói của bạn. Thường mất 30-60 giây.</p>
            </div>
          )}

          {/* Failed */}
          {evaluation?.status === "FAILED" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
              <span className="material-symbols-outlined text-red-500 text-5xl mb-4 block">error</span>
              <h2 className="text-xl font-bold text-red-800 mb-2">Chấm bài thất bại</h2>
              <button onClick={() => { setShowResult(false); setEvaluationId(null); setIsSubmitting(false); setAudioBlob(null); setRecordingState("idle"); }}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 mt-4">
                Thử lại
              </button>
            </div>
          )}

          {/* Completed */}
          {evaluation?.status === "COMPLETED" && (
            <div className="space-y-6">
              {/* Overall Band */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                <p className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-2">Overall Band Score</p>
                <div className="text-7xl font-black text-indigo-600 mb-4">{evaluation.overallBand}</div>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Fluency & Coherence", value: evaluation.fluencyScore, icon: "record_voice_over" },
                  { label: "Pronunciation", value: evaluation.pronunciationScore, icon: "spatial_audio" },
                  { label: "Lexical Resource", value: evaluation.vocabScore, icon: "dictionary" },
                  { label: "Grammar", value: evaluation.grammarScore, icon: "spellcheck" },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-500 text-xl">{icon}</span>
                        <span className="font-semibold text-slate-800 text-sm">{label}</span>
                      </div>
                      <span className="text-2xl font-black text-indigo-600">{value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Transcript */}
              {evaluation.transcript && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-500">subtitles</span>
                    Your Transcript
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed italic">{evaluation.transcript}</p>
                </div>
              )}

              {/* Feedback */}
              {evaluation.feedback && (
                <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-6">
                  <h3 className="font-bold text-indigo-800 mb-3">AI Feedback</h3>
                  <p className="text-sm text-indigo-700 leading-relaxed">{evaluation.feedback}</p>
                </div>
              )}

              <div className="text-center pt-4">
                <Link to="/practice" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                  Quay lại Practice
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Recording Screen ──────────────────────────────────────────────────────
  return (
    <div className="bg-[#f8fafc] h-screen flex flex-col font-sans text-slate-900 overflow-hidden relative">
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Header */}
      <header className="h-20 flex items-center justify-between px-8 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <Link to="/practice" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <span className="material-symbols-outlined">mic</span>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-slate-900">Speaking Proficiency Test</h1>
            <p className="text-xs text-slate-500">Part 2: Long Turn</p>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          {recordingState === "recording" && (
            <div className="px-4 py-2 bg-red-50 rounded-full border border-red-200 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-mono font-bold text-red-700">REC {formatTime(recordingTime)}</span>
            </div>
          )}
          {recordingState === "stopped" && (
            <div className="px-4 py-2 bg-green-50 rounded-full border border-green-200 flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-green-700">Recorded {formatTime(recordingTime)}</span>
            </div>
          )}
          {/* Time remaining indicator */}
          {recordingState === "recording" && (
            <div className="text-xs text-slate-500">
              {formatTime(maxDuration - recordingTime)} left
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 p-8">
        {/* Prompt Card */}
        <div className="max-w-2xl w-full bg-white backdrop-blur-xl border border-slate-200 rounded-3xl p-8 mb-12 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-teal-500"></div>
          <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-4">Topic Card</h2>
          <h3 className="text-2xl font-bold text-slate-900 mb-6 leading-tight">
            Describe a piece of technology you use often.
          </h3>
          <div className="space-y-3 text-slate-600 text-lg">
            {["You should say what it is", "How often you use it", "What you use it for", "And explain why it is important to you"].map(point => (
              <p key={point} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                {point}
              </p>
            ))}
          </div>
        </div>

        {/* Audio Visualizer (when recording) */}
        {recordingState === "recording" && (
          <div className="flex items-center justify-center gap-1 h-24 mb-12 w-full max-w-3xl">
            {[...Array(40)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 bg-gradient-to-t from-indigo-500 to-cyan-500 rounded-full animate-pulse"
                style={{
                  height: `${Math.max(10, Math.random() * 100)}%`,
                  animationDelay: `${i * 50}ms`,
                  animationDuration: `${300 + Math.random() * 200}ms`,
                }}
              ></div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-8">
          {recordingState === "idle" && (
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <button
                onClick={startRecording}
                className="relative w-24 h-24 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-white text-[40px]">mic</span>
              </button>
            </div>
          )}

          {recordingState === "recording" && (
            <div className="relative group">
              <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <button
                onClick={stopRecording}
                className="relative w-24 h-24 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-white text-[40px]">stop</span>
              </button>
            </div>
          )}

          {recordingState === "stopped" && (
            <div className="flex items-center gap-6">
              <button
                onClick={() => { setAudioBlob(null); setRecordingState("idle"); setRecordingTime(0); }}
                className="w-14 h-14 rounded-full bg-white hover:bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 transition-all hover:scale-105"
              >
                <span className="material-symbols-outlined text-[28px]">replay</span>
              </button>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit for AI Grading"}
              </button>
            </div>
          )}
        </div>

        {recordingState === "idle" && (
          <p className="mt-8 text-slate-500 text-sm font-medium">Click to start recording (max 2 minutes)</p>
        )}
        {recordingState === "recording" && (
          <p className="mt-8 text-red-500 text-sm font-medium animate-pulse">Recording... Click stop when finished</p>
        )}
      </main>
    </div>
  );
}
