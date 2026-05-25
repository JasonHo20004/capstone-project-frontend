import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  useStartSpeakingSession,
  useRespondToSpeaking,
  useFinishSpeaking,
  useSpeakingSessionResult,
} from "@/hooks/api/use-ai-evaluation";
import { aiEvaluationService } from "@/lib/api/services/user/ai-evaluation/ai-evaluation.service";
import {
  TOPIC_ICON_MAP,
  getUserId,
  formatTime,
  getBandColor,
  PART2_MAX_SECONDS,
  PART2_WARN_SECONDS,
  PART2_PREP_SECONDS,
} from "./speaking-utils";
import type {
  ConversationTurn,
  Screen,
  TopicDisplay,
  VocabSuggestion,
} from "./speaking-utils";
import {
  Waveform,
  VolumeMeter,
  Countdown,
  Part2Timer,
} from "./SpeakingComponents";
import { useSubscription } from "@/context/SubscriptionContext";
import { useNavigate } from "react-router-dom";

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function SpeakingTestContent() {
  // ─── Screen State ─────────────────────────────────────────────────────────
  const [screen, setScreen] = useState<Screen>("topic");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [currentPart, setCurrentPart] = useState(1);
  const [currentStep, setCurrentStep] = useState(0);

  // ─── Conversation ─────────────────────────────────────────────────────────
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [cueCard, setCueCard] = useState<{ topic: string; bulletPoints: string[]; finalPrompt: string } | null>(null);
  const [prepTimer, setPrepTimer] = useState<number | null>(null);

  // ─── Recording ────────────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [pendingAudioUrl, setPendingAudioUrl] = useState<string | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
  const [micCheckStream, setMicCheckStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ─── Vocab Tips ───────────────────────────────────────────────────────────
  const [vocabSuggestions, setVocabSuggestions] = useState<VocabSuggestion[]>([]);
  const [vocabLoading, setVocabLoading] = useState(false);
  const [showVocabPanel, setShowVocabPanel] = useState(false);

  // ─── Notes ────────────────────────────────────────────────────────────────
  const [showNotes, setShowNotes] = useState(false);
  const [userNotes, setUserNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  // ─── Hooks ────────────────────────────────────────────────────────────────
  const startSession = useStartSpeakingSession();
  const respondToSpeaking = useRespondToSpeaking();
  const finishSpeaking = useFinishSpeaking();
  const { hasFeature } = useSubscription();
  const navigate = useNavigate();
  const isPro = hasFeature("ai_speaking");
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { data: result } = useSpeakingSessionResult(
    screen === "grading" ? sessionId : null
  );

  // ─── DB Topics Query ──────────────────────────────────────────────────────
  const { data: dbTopicsRes } = useQuery({
    queryKey: ["speaking-topics-active"],
    queryFn: () => aiEvaluationService.listSpeakingTopics(true),
  });

  const displayTopics: TopicDisplay[] = useMemo(() => {
    const dbTopics = (dbTopicsRes?.data as any[]) || [];
    return dbTopics.map((t: any) => ({
      name: t.title,
      icon: TOPIC_ICON_MAP[t.title]?.icon || "topic",
      color: TOPIC_ICON_MAP[t.title]?.color || "from-slate-500 to-slate-600",
      fromDb: true,
      isPremium: t.isPremium ?? false,
    }));
  }, [dbTopicsRes]);

  // ─── Auto-scroll chat ────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, isProcessing]);

  // ─── Part 2 prep timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (prepTimer === null || prepTimer <= 0) return;
    const interval = setInterval(() => {
      setPrepTimer(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [prepTimer]);

  // ─── Result watcher ──────────────────────────────────────────────────────
  useEffect(() => {
    if (result && result.status === "COMPLETED") {
      setScreen("result");
    }
  }, [result]);

  // ─── Recording Timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
    } else if (!isRecording) {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording, isPaused]);

  // ─── Start Session Handler ───────────────────────────────────────────────
  const handleStartSession = useCallback(async (selectedTopic?: string) => {
    const userId = getUserId();
    try {
      const res = await startSession.mutateAsync({ userId, topic: selectedTopic });
      const data = res.data as any;
      setSessionId(data.sessionId);
      const finalTopic = data.topic || selectedTopic || "Random";
      setTopic(finalTopic);
      setCurrentPart(data.currentPart || 1);
      setCurrentStep(data.currentStep || 0);
      if (data.cueCard) setCueCard(data.cueCard);

      const firstQuestion = data.examinerQuestion || data.question;
      if (firstQuestion) {
        setTurns([{
          role: "examiner",
          content: firstQuestion,
          timestamp: new Date().toISOString(),
        }]);
      }

      setVocabLoading(true);
      aiEvaluationService.getSpeakingVocabSuggestions(finalTopic)
        .then(r => {
          const vocab = (r.data as any)?.vocabulary || [];
          setVocabSuggestions(vocab);
        })
        .catch(() => { /* non-blocking */ })
        .finally(() => setVocabLoading(false));

      setScreen("mic-check");
    } catch (err) {
      console.error("Failed to start session:", err);
    }
  }, [startSession]);

  // ─── Mic Check Handler ───────────────────────────────────────────────────
  const initMicCheck = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicCheckStream(stream);
    } catch (err) {
      console.error("Mic access error:", err);
    }
  }, []);

  const proceedToConversation = useCallback(() => {
    if (micCheckStream) {
      micCheckStream.getTracks().forEach(t => t.stop());
      setMicCheckStream(null);
    }
    setScreen("conversation");
  }, [micCheckStream]);

  useEffect(() => {
    if (screen === "mic-check" && !micCheckStream) {
      initMicCheck();
    }
  }, [screen, micCheckStream, initMicCheck]);

  useEffect(() => {
    return () => {
      if (micCheckStream) {
        micCheckStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [micCheckStream]);

  // ─── Audio Recording ─────────────────────────────────────────────────────
  const beginActualRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLiveStream(stream);
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setPendingBlob(blob);
        setPendingAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        setLiveStream(null);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      console.error("Mic access error:", err);
    }
  }, []);

  const startRecording = useCallback(() => {
    setShowCountdown(true);
  }, []);

  const handleCountdownDone = useCallback(() => {
    setShowCountdown(false);
    beginActualRecording();
  }, [beginActualRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording" || mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (!rec) return;
    if (rec.state === "recording") {
      rec.pause();
      setIsPaused(true);
    } else if (rec.state === "paused") {
      rec.resume();
      setIsPaused(false);
    }
  }, []);

  // ─── Send Audio (S3 upload flow) ─────────────────────────────────────────
  const sendAudioResponse = useCallback(async () => {
    if (!pendingBlob || !sessionId) return;
    setIsProcessing(true);

    try {
      const uploadRes = await aiEvaluationService.getSpeakingUploadUrl();
      const { uploadUrl, publicUrl } = (uploadRes.data as any);

      await fetch(uploadUrl, {
        method: "PUT",
        body: pendingBlob,
        headers: { "Content-Type": "audio/webm" },
      });

      setTurns(prev => [...prev, {
        role: "candidate" as const,
        content: "(Audio response)",
        audioUrl: pendingAudioUrl || undefined,
        timestamp: new Date().toISOString(),
      }]);
      setPendingBlob(null);
      setPendingAudioUrl(null);

      const res = await respondToSpeaking.mutateAsync({
        sessionId,
        audioUrl: publicUrl,
        mimeType: "audio/webm",
      });
      const data = res.data as any;

      if (data.finished) {
        setScreen("grading");
      } else {
        if (data.currentPart) setCurrentPart(data.currentPart);
        if (data.currentStep !== undefined) setCurrentStep(data.currentStep);
        if (data.cueCard) {
          setCueCard(data.cueCard);
          setPrepTimer(PART2_PREP_SECONDS);
        }
        if (data.examinerResponse) {
          setTurns(prev => [...prev, {
            role: "examiner",
            content: data.examinerResponse,
            timestamp: new Date().toISOString(),
          }]);
          setUserNotes("");
          setShowNotes(false);
        }
        if (data.transcript) {
          setTurns(prev => {
            const updated = [...prev];
            let lastCandidateIdx = -1;
            for (let j = updated.length - 1; j >= 0; j--) {
              if (updated[j].role === "candidate") { lastCandidateIdx = j; break; }
            }
            if (lastCandidateIdx >= 0) {
              updated[lastCandidateIdx] = { ...updated[lastCandidateIdx], content: data.transcript };
            }
            return updated;
          });
        }
      }
    } catch (err) {
      console.error("Send audio error:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [pendingBlob, pendingAudioUrl, sessionId, respondToSpeaking]);

  // Auto-send when blob is ready
  useEffect(() => {
    if (pendingBlob && sessionId) {
      sendAudioResponse();
    }
  }, [pendingBlob]);

  // ─── Finish Early ────────────────────────────────────────────────────────
  const handleFinishEarly = useCallback(async () => {
    if (!sessionId) return;
    try {
      await finishSpeaking.mutateAsync(sessionId);
      setScreen("grading");
    } catch (err) {
      console.error("Finish error:", err);
    }
  }, [sessionId, finishSpeaking]);

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 1: TOPIC SELECTION
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === "topic") {
    return (
      <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-900">
        <header className="h-20 flex items-center justify-between px-8 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <Link to="/exam" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <span className="material-symbols-outlined">mic</span>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-slate-900">IELTS Speaking Workshop</h1>
              <p className="text-xs text-slate-500">Interactive AI Examiner</p>
            </div>
          </Link>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Chọn chủ đề Speaking</h2>
            <p className="text-slate-500 max-w-lg mx-auto">AI Examiner sẽ hỏi bạn theo format IELTS Speaking thật: Part 1 → Part 2 → Part 3</p>
          </div>

          <div className="text-center mb-8">
            <button
              onClick={() => handleStartSession()}
              disabled={startSession.isPending}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-amber-500/20 hover:scale-105 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">shuffle</span>
              {startSession.isPending ? "Đang khởi tạo..." : "Chủ đề ngẫu nhiên"}
            </button>
          </div>

          <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">hoặc chọn một chủ đề</div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {displayTopics.map((t) => (
              <button
                key={t.name}
                onClick={() => {
                  if (t.isPremium && !isPro) {
                    setShowUpgradeDialog(true);
                    return;
                  }
                  handleStartSession(t.name);
                }}
                disabled={startSession.isPending}
                className={`group relative bg-white rounded-xl border p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all text-left disabled:opacity-50 cursor-pointer overflow-hidden ${
                  t.isPremium ? "border-amber-200 ring-1 ring-amber-100" : "border-slate-200"
                }`}
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${t.color} rounded-lg flex items-center justify-center text-white mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
                </div>
                <p className="text-xs font-bold text-slate-700 leading-tight">{t.name}</p>
                {t.isPremium && (
                  <span className="absolute top-2 right-2 flex items-center gap-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                    <span className="material-symbols-outlined text-[12px]">diamond</span>
                    PRO
                  </span>
                )}
                {!t.isPremium && t.fromDb && (
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full" title="Admin-created" />
                )}
              </button>
            ))}
          </div>

          {/* Premium Upgrade Dialog */}
          {showUpgradeDialog && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowUpgradeDialog(false)}>
              <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200/50">
                  <span className="material-symbols-outlined text-white text-[28px]">diamond</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Chủ đề PRO</h3>
                <p className="text-sm text-slate-500 mb-6">Chủ đề này dành cho gói Pro. Nâng cấp để truy cập tất cả chủ đề Speaking.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUpgradeDialog(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={() => navigate("/#pricing")}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-200/30 hover:scale-105 transition-all cursor-pointer"
                  >
                    Nâng cấp Pro
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 1.5: MIC CHECK (test mic + show vocab tips before starting)
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === "mic-check") {
    return (
      <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-900">
        <header className="h-20 flex items-center justify-between px-4 sm:px-8 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (micCheckStream) micCheckStream.getTracks().forEach(t => t.stop());
                setMicCheckStream(null);
                setScreen("topic");
              }}
              className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500 cursor-pointer"
              title="Quay lại"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <span className="material-symbols-outlined">mic</span>
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-slate-900">Kiểm tra mic & Chuẩn bị</h1>
              <p className="text-xs text-slate-500">Chủ đề: {topic}</p>
            </div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Mic Test */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">graphic_eq</span>
                Test microphone
              </h2>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                micCheckStream ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
              }`}>
                {micCheckStream ? "Mic OK" : "Đang chờ quyền..."}
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-4">Hãy nói thử vài câu — nếu thanh dưới chuyển sang xanh/cam là mic đang hoạt động tốt.</p>
            <VolumeMeter stream={micCheckStream} />
            {!micCheckStream && (
              <button
                onClick={initMicCheck}
                className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
              >
                Cấp quyền microphone
              </button>
            )}
          </div>

          {/* Vocab Tips */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">lightbulb</span>
                Từ vựng band 7+ cho chủ đề này
              </h2>
              {vocabLoading && (
                <div className="w-5 h-5 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
              )}
            </div>
            <p className="text-sm text-slate-500 mb-4">Cố gắng dùng những từ này khi nói — AI Examiner sẽ cộng điểm Lexical Resource.</p>
            {vocabLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : vocabSuggestions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vocabSuggestions.map((v, i) => (
                  <div key={i} className="border border-amber-200 bg-amber-50/50 rounded-xl p-4">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="font-black text-amber-700 text-sm">{v.word}</span>
                      <span className="text-[10px] text-amber-600 font-bold">B7+</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{v.meaning}</p>
                    <p className="text-xs italic text-slate-500 leading-relaxed">"{v.example}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Chưa có gợi ý — bạn vẫn có thể bắt đầu bài thi.</p>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
            <h3 className="text-sm font-black text-indigo-900 mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">info</span>
              Hướng dẫn nhanh
            </h3>
            <ul className="text-xs text-indigo-900/80 space-y-1.5 leading-relaxed">
              <li>• <b>Part 1</b>: 4-5 câu hỏi cá nhân, mỗi câu trả lời ~30 giây</li>
              <li>• <b>Part 2</b>: 1 cue card — bạn có <b>1 phút chuẩn bị</b>, sau đó nói liên tục <b>1-2 phút</b></li>
              <li>• <b>Part 3</b>: Câu hỏi mở thảo luận, mỗi câu trả lời 45-60 giây</li>
              <li>• Bạn có thể <b>tạm dừng</b> hoặc <b>kết thúc sớm</b> bất cứ lúc nào</li>
            </ul>
          </div>

          <button
            onClick={proceedToConversation}
            disabled={!micCheckStream}
            className="w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-amber-500/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">play_arrow</span>
            Bắt đầu thi Speaking
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 2: CONVERSATION
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === "conversation") {
    const partLabels: Record<number, string> = {
      1: "Part 1 — Introduction & Interview",
      2: "Part 2 — Individual Long Turn",
      3: "Part 3 — Two-way Discussion",
    };

    return (
      <div className="bg-slate-50 h-screen flex flex-col font-sans text-slate-900 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-3 sm:px-6 border-b border-slate-200 bg-white shrink-0 shadow-sm z-10 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[18px]">mic</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-black text-slate-800 tracking-tight truncate">{topic}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">{partLabels[currentPart] || `Part ${currentPart}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map(p => (
                <div key={p} className={`w-10 h-2 rounded-full transition-all duration-500 ${
                  p < currentPart ? "bg-emerald-500 shadow-sm" : p === currentPart ? "bg-amber-500 shadow-sm" : "bg-slate-200"
                }`} title={`Part ${p}`} />
              ))}
            </div>
            {vocabSuggestions.length > 0 && (
              <button
                onClick={() => setShowVocabPanel(!showVocabPanel)}
                className={`hidden sm:inline-flex text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shadow-sm items-center gap-1 ${
                  showVocabPanel
                    ? "bg-amber-500 text-white border-amber-500"
                    : "text-amber-600 hover:bg-amber-50 border-amber-200"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                Mẹo từ vựng
              </button>
            )}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shadow-sm ${
                showHistory
                  ? "bg-indigo-500 text-white border-indigo-500"
                  : "text-indigo-600 hover:bg-indigo-50 border-indigo-200"
              }`}
            >
              <span className="hidden sm:inline">{showHistory ? "Ẩn" : "Xem"} Transcript</span>
              <span className="sm:hidden material-symbols-outlined text-[16px]">history</span>
            </button>
            <button
              onClick={handleFinishEarly}
              className="text-xs font-bold text-red-500 hover:text-white px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-500 transition-all cursor-pointer shadow-sm"
            >
              <span className="hidden sm:inline">Kết thúc sớm</span>
              <span className="sm:hidden material-symbols-outlined text-[16px]">stop_circle</span>
            </button>
          </div>
        </header>

        <div className={`flex-1 flex flex-col p-4 sm:p-8 bg-white overflow-y-auto w-full relative ${showHistory || showVocabPanel ? 'justify-start' : 'items-center justify-center'}`}>
          <div className="absolute inset-0 bg-[radial-gradient(#f1f5f9_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>
          
          {showVocabPanel && vocabSuggestions.length > 0 && (
            <div className="w-full max-w-3xl mx-auto mb-8 border border-amber-200 rounded-3xl bg-amber-50/60 backdrop-blur-sm p-6 shadow-inner z-20 animate-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-4 border-b border-amber-200 pb-3">
                <h3 className="font-black text-slate-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500">lightbulb</span>
                  Từ vựng band 7+
                </h3>
                <button onClick={() => setShowVocabPanel(false)} className="text-slate-400 hover:text-red-500 transition-colors w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center cursor-pointer">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-1">
                {vocabSuggestions.map((v, i) => (
                  <div key={i} className="border border-amber-200 bg-white rounded-xl p-3">
                    <p className="font-black text-amber-700 text-sm mb-1">{v.word}</p>
                    <p className="text-xs text-slate-600 mb-1.5">{v.meaning}</p>
                    <p className="text-xs italic text-slate-500">"{v.example}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showHistory && (
            <div className="w-full max-w-3xl mx-auto mb-8 border border-slate-200 rounded-3xl bg-slate-50/80 backdrop-blur-sm p-6 shadow-inner z-20 animate-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
                <h3 className="font-black text-slate-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-500">history</span>
                  Lịch sử hội thoại & Bóc băng (Transcripts)
                </h3>
                <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-red-500 transition-colors w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center cursor-pointer">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {turns.map((turn, i) => (
                  <div key={i} className={`flex ${turn.role === "candidate" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                      turn.role === "examiner"
                        ? "bg-white border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]"
                        : "bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 shadow-[0_2px_10px_-4px_rgba(79,70,229,0.1)]"
                    }`}>
                      <p className={`text-[10px] font-black uppercase tracking-wider mb-2 ${
                        turn.role === "examiner" ? "text-slate-400" : "text-indigo-600"
                      }`}>
                        {turn.role === "examiner" ? "Examiner" : "You (Detected Speech)"}
                      </p>
                      <p className="text-sm leading-relaxed text-slate-700">{turn.content}</p>
                      {turn.audioUrl && (
                        <audio src={turn.audioUrl} controls className="mt-3 h-10 w-full opacity-90 rounded-lg" />
                      )}
                    </div>
                  </div>
                ))}
                {turns.length === 0 && <p className="text-slate-400 text-sm font-medium text-center py-4">Chưa có đoạn hội thoại nào.</p>}
              </div>
            </div>
          )}

          <div className="z-10 w-full flex flex-col items-center transition-all">
            {isProcessing ? (
              <div className="text-center flex flex-col items-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 shadow-inner relative overflow-hidden">
                  <div className="absolute inset-0 bg-amber-100/50 animate-pulse"></div>
                  <div className="flex gap-1.5 relative z-10">
                    <span className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Examiner đang phân tích...</h3>
                <p className="text-sm font-medium text-slate-500">Chuẩn bị câu hỏi tiếp theo</p>
              </div>
            ) : (
              <div className="w-full max-w-3xl mx-auto text-center">
                {currentPart === 2 && cueCard ? (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-5 sm:p-10 mb-4 w-full relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700 fade-in">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500" />

                    <div className="flex items-center justify-between mb-5 sm:mb-8 pb-4 sm:pb-6 border-b border-slate-100 gap-2 flex-wrap">
                      <span className="bg-amber-100 text-amber-700 text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl">Part 2 — Cue Card</span>
                      {prepTimer !== null && prepTimer > 0 && (
                        <span className="flex items-center gap-2 text-sm font-mono font-black text-red-600 bg-red-50 border border-red-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl animate-pulse">
                          <span className="material-symbols-outlined text-[18px]">timer</span>
                          Prep 00:{prepTimer.toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mb-6 sm:mb-10 leading-tight text-left">{cueCard.topic}</h3>

                    <div className="text-left space-y-4 sm:space-y-6 bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-100">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">You should say:</p>
                      <ul className="space-y-3 sm:space-y-5">
                        {cueCard.bulletPoints.map((bp, i) => (
                          <li key={i} className="text-base sm:text-lg text-slate-700 flex items-start gap-3 sm:gap-4">
                            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs sm:text-sm font-black shadow-md shadow-amber-500/20">{i + 1}</span>
                            <span className="font-medium leading-relaxed">{bp}</span>
                          </li>
                        ))}
                      </ul>
                      {cueCard.finalPrompt && (
                        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200">
                          <p className="text-base sm:text-lg text-slate-800 font-bold flex items-start gap-3">
                            <span className="material-symbols-outlined text-amber-500 mt-1">forum</span>
                            {cueCard.finalPrompt}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (() => {
                  const currentExaminerQuestion = [...turns].filter(t => t.role === 'examiner').pop();
                  return currentExaminerQuestion ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full flex flex-col items-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-indigo-500/30 -rotate-3 hover:rotate-0 transition-transform">
                        <span className="material-symbols-outlined text-[32px]">record_voice_over</span>
                      </div>
                      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 leading-tight tracking-tight mb-8">
                        "{currentExaminerQuestion.content}"
                      </h2>
                    </div>
                  ) : null;
                })()}

                <div className="w-full max-w-3xl mx-auto mt-8">
                  <div className="flex flex-col items-start animate-in fade-in duration-500">
                    <button 
                      onClick={() => setShowNotes(!showNotes)}
                      className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-3 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">{showNotes ? "visibility_off" : "notes"}</span>
                      {showNotes ? "Ẩn ghi chú" : "Ghi chú thêm..."}
                    </button>
                    
                    {showNotes && (
                      <div className="w-full animate-in slide-in-from-top-2 duration-300">
                        <textarea
                          value={userNotes}
                          onChange={(e) => setUserNotes(e.target.value)}
                          placeholder="Gõ nháp / script của bạn vào đây..."
                          className="w-full min-h-[120px] bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl p-4 text-slate-700 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] resize-y outline-none transition-all placeholder:text-slate-400"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-4 sm:px-6 py-6 sm:py-8 shrink-0 relative z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="max-w-2xl mx-auto flex flex-col items-center justify-center gap-4">
            {isRecording ? (
              <div className="flex flex-col items-center w-full animate-in zoom-in duration-300 gap-4">
                {currentPart === 2 ? (
                  <Part2Timer
                    seconds={recordingTime}
                    max={PART2_MAX_SECONDS}
                    warnAt={PART2_WARN_SECONDS}
                  />
                ) : (
                  <span className={`text-xl font-mono font-black px-6 py-2 rounded-2xl border shadow-sm ${
                    isPaused
                      ? "text-slate-500 bg-slate-50 border-slate-200"
                      : "text-red-600 bg-red-50 border-red-100 animate-pulse"
                  }`}>
                    {isPaused ? "PAUSED" : formatTime(recordingTime)}
                  </span>
                )}

                <div className="w-full max-w-md">
                  <Waveform
                    stream={liveStream}
                    active={isRecording && !isPaused}
                    height={64}
                    color={isPaused ? "#94a3b8" : "#ef4444"}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePause}
                    className="w-14 h-14 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-700 shadow transition-all hover:scale-105 cursor-pointer border-2 border-white"
                    title={isPaused ? "Tiếp tục" : "Tạm dừng"}
                  >
                    <span className="material-symbols-outlined text-[26px]">
                      {isPaused ? "play_arrow" : "pause"}
                    </span>
                  </button>
                  <button
                    onClick={stopRecording}
                    className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-red-500/40 transition-all hover:scale-105 cursor-pointer border-4 border-white"
                  >
                    <span className="material-symbols-outlined text-[36px]">stop</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center">
                  {isPaused ? "Đang tạm dừng" : "Nhấn STOP để kết thúc"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <button
                  onClick={startRecording}
                  disabled={isProcessing}
                  className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-amber-500/30 transition-all hover:scale-110 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer border-4 border-white"
                >
                  <span className="material-symbols-outlined text-[36px]">mic</span>
                </button>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-5">
                  {isProcessing ? "Vui lòng đợi..." : "Nhấn để bắt đầu trả lời"}
                </p>
              </div>
            )}
          </div>
        </div>

        {showCountdown && <Countdown from={3} onDone={handleCountdownDone} />}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 3: GRADING
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === "grading") {
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

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 4: RESULT
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === "result" && result) {
    const r = result as any;
    const scores = r.scores || {};

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
            <p className={`text-5xl font-black ${getBandColor(scores.overall)}`}>
              {scores.overall?.toFixed(1) || "N/A"}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { key: "fluency", label: "Fluency & Coherence", icon: "waves" },
              { key: "lexical", label: "Lexical Resource", icon: "dictionary" },
              { key: "grammar", label: "Grammar Range", icon: "spellcheck" },
              { key: "pronunciation", label: "Pronunciation", icon: "record_voice_over" },
            ].map(({ key, label, icon }) => (
              <div key={key} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <span className="material-symbols-outlined text-slate-400 text-[20px] mb-1 block">{icon}</span>
                <p className={`text-2xl font-black ${getBandColor(scores[key])}`}>
                  {scores[key]?.toFixed(1) || "—"}
                </p>
                <p className="text-[10px] font-bold text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {r.feedback && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-[18px]">lightbulb</span>
                Nhận xét chi tiết
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{r.feedback}</p>
            </div>
          )}

          {turns.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mt-6">
              <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-[18px]">history</span>
                Bản dịch băng ghi âm (Transcript)
              </h3>
              <div className="space-y-4">
                {turns.map((turn, idx) => (
                  <div key={idx} className={`p-4 rounded-xl ${turn.role === 'examiner' ? 'bg-slate-50 border border-slate-100' : 'bg-indigo-50 border border-indigo-100'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${turn.role === 'examiner' ? 'text-slate-500' : 'text-indigo-600'}`}>
                        {turn.role === 'examiner' ? 'Examiner' : 'You (Detected Speech)'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{turn.content}</p>
                    {turn.audioUrl && (
                      <audio src={turn.audioUrl} controls className="mt-3 h-8 w-full opacity-80" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center mt-8">
            <button
              onClick={() => {
                setScreen("topic");
                setSessionId(null);
                setTurns([]);
                setCueCard(null);
                setPrepTimer(null);
                setCurrentPart(1);
                setCurrentStep(0);
                setVocabSuggestions([]);
                setShowVocabPanel(false);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">replay</span>
              Luyện tiếp
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function SpeakingTest() {
  return <SpeakingTestContent />;
}
