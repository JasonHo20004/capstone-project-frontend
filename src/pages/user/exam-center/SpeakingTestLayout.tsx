import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { aiEvaluationService } from "@/lib/api/services/user/ai-evaluation/ai-evaluation.service";

// ─── Types ───────────────────────────────────────────────────────────────────

interface QuestionData {
  id: string;
  questionText?: string;
  content?: any;
  questionOrder: number;
}

interface SectionData {
  id: string;
  title: string;
  skill?: string;
  passages: any[];
  questions: QuestionData[];
}

interface TestData {
  id: string;
  title: string;
  durationInMinutes: number | null;
  testSkills?: { skill: string }[];
  sections: SectionData[];
}

interface SpeakingTestLayoutProps {
  testData: TestData | null;
  sections: SectionData[];
  currentSectionIdx: number;
  setCurrentSectionIdx: (idx: number) => void;
  answers: Record<string, string>;
  setAnswer: (qId: string, value: string) => void;
  formatTime: (s: number) => string;
  timeLeft: number;
  goNext: () => void;
  goPrev: () => void;
  handleSubmit: () => void;
}

// ─── Per-Question Recorder ───────────────────────────────────────────────────

function QuestionRecorder({
  questionId,
  onBlobReady,
}: {
  questionId: string;
  onBlobReady: (qId: string, blob: Blob | null) => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onBlobReady(questionId, blob);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setElapsed(0);
      setAudioUrl(null);
      onBlobReady(questionId, null);

      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }, [questionId, onBlobReady]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const deleteRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setElapsed(0);
    setIsPlaying(false);
    onBlobReady(questionId, null);
  }, [audioUrl, questionId, onBlobReady]);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  const formatElapsed = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="mt-3">
      {!audioUrl ? (
        <div className="flex items-center gap-3">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              isRecording
                ? 'bg-red-500 text-white shadow-lg shadow-red-200 hover:bg-red-600'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-200 hover:shadow-lg hover:scale-[1.02]'
            }`}
          >
            <span className={`material-symbols-outlined text-[18px] ${isRecording ? 'animate-pulse' : ''}`}>
              {isRecording ? 'stop_circle' : 'mic'}
            </span>
            {isRecording ? 'Dừng ghi' : 'Ghi âm'}
          </button>

          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-[3px] h-6">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-[3px] bg-red-400 rounded-full"
                    style={{
                      animation: `waveform 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
                      height: `${12 + Math.random() * 12}px`,
                    }}
                  />
                ))}
              </div>
              <span className="text-sm font-mono text-red-500 font-bold">{formatElapsed(elapsed)}</span>
              <span className="text-[10px] text-red-400 animate-pulse">● REC</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
          <button
            onClick={togglePlayback}
            className="w-9 h-9 bg-amber-500 hover:bg-amber-600 text-white rounded-full flex items-center justify-center shadow-sm transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className={`h-full bg-amber-500 rounded-full transition-all ${isPlaying ? 'animate-pulse' : ''}`}
              style={{ width: isPlaying ? '100%' : '0%', transition: isPlaying ? `width ${elapsed}s linear` : 'none' }}
            />
          </div>

          <span className="text-xs font-mono text-slate-500">{formatElapsed(elapsed)}</span>

          <button
            onClick={deleteRecording}
            className="w-8 h-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center transition cursor-pointer"
            title="Xóa và ghi lại"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>

          <span className="text-[10px] text-green-500 font-bold">✓ Đã ghi</span>

          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        </div>
      )}

      {isRecording && (
        <style>{`
          @keyframes waveform {
            0% { height: 6px; }
            100% { height: 20px; }
          }
        `}</style>
      )}
    </div>
  );
}

// ─── Submit Progress Modal ──────────────────────────────────────────────────

function SubmitProgress({
  steps,
  currentStep,
  error,
}: {
  steps: string[];
  currentStep: number;
  error: string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          {error ? (
            <span className="material-symbols-outlined text-5xl text-red-500">error</span>
          ) : currentStep >= steps.length ? (
            <span className="material-symbols-outlined text-5xl text-green-500">check_circle</span>
          ) : (
            <div className="w-14 h-14 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto" />
          )}
        </div>
        <h3 className="text-lg font-bold text-slate-800 text-center mb-4">
          {error ? 'Có lỗi xảy ra' : currentStep >= steps.length ? 'Hoàn tất!' : 'Đang xử lý...'}
        </h3>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4">{error}</p>
        )}

        <div className="space-y-2">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {idx < currentStep ? (
                <span className="material-symbols-outlined text-green-500 text-[18px]">check_circle</span>
              ) : idx === currentStep && !error ? (
                <div className="w-[18px] h-[18px] border-2 border-amber-400 border-t-amber-600 rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-slate-300 text-[18px]">radio_button_unchecked</span>
              )}
              <span className={`text-sm ${idx < currentStep ? 'text-green-700 font-medium' : idx === currentStep ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Layout ─────────────────────────────────────────────────────────────

export default function SpeakingTestLayout({
  testData,
  sections,
  currentSectionIdx,
  setCurrentSectionIdx,
  answers,
  setAnswer,
  formatTime,
  timeLeft,
  goNext,
  goPrev,
}: SpeakingTestLayoutProps) {
  const navigate = useNavigate();
  const speakingSections = sections.map((sec, idx) => {
    const partMatch = sec.title?.match(/Part\s*(\d)/i);
    const partNum = partMatch ? parseInt(partMatch[1]) : idx + 1;
    return { ...sec, partNum, sectionIdx: idx };
  });
  const activeSpeakingSection = speakingSections[currentSectionIdx] || speakingSections[0];
  const speakingQuestions = activeSpeakingSection?.questions || [];
  const cueCardQ = activeSpeakingSection.partNum === 2 ? speakingQuestions[0] : null;
  const cueCardContent = cueCardQ?.content as any;
  const [showNotes, setShowNotes] = useState<Record<string, boolean>>({});

  // Audio blobs per question
  const blobsRef = useRef<Record<string, Blob>>({});
  const [recordedCount, setRecordedCount] = useState(0);

  // Submit flow state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const allQuestions = sections.flatMap(s => s.questions);

  const handleBlobReady = useCallback((qId: string, blob: Blob | null) => {
    if (blob) {
      blobsRef.current[qId] = blob;
    } else {
      delete blobsRef.current[qId];
    }
    setRecordedCount(Object.keys(blobsRef.current).length);
  }, []);

  // ─── Full Submit Flow ──────────────────────────────────────────────────────
  const handleSpeakingSubmit = useCallback(async () => {
    const blobs = blobsRef.current;
    const questionIds = Object.keys(blobs);

    if (questionIds.length === 0) {
      setSubmitError("Bạn chưa ghi âm câu nào. Hãy ghi âm ít nhất 1 câu trả lời.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStep(0);
    setSubmitError(null);

    try {
      // Extract userId
      let userId = 'anonymous';
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.sub || payload.userId || payload.id || 'anonymous';
        }
      } catch {}

      // Step 1: Get presigned URLs and upload each blob to S3
      setSubmitStep(0);
      const uploadedUrls: Record<string, string> = {};

      for (const qId of questionIds) {
        const blob = blobs[qId];
        // Get presigned URL
        const urlResp = await aiEvaluationService.getSpeakingUploadUrl();
        const { uploadUrl, publicUrl } = urlResp.data!;

        // Upload directly to S3
        await fetch(uploadUrl, {
          method: 'PUT',
          body: blob,
          headers: { 'Content-Type': 'audio/webm' },
        });

        uploadedUrls[qId] = publicUrl;
      }

      // Step 2: Submit for AI evaluation (use first recorded audio for now)
      setSubmitStep(1);
      const firstUrl = Object.values(uploadedUrls)[0];

      const evalResp = await aiEvaluationService.submitSpeakingEvaluation({
        userId,
        audioUrl: firstUrl,
        questionId: questionIds[0],
      });

      const evaluationId = evalResp.data?.evaluationId;
      if (!evaluationId) throw new Error("Không nhận được evaluationId");

      // Step 3: Poll for result
      setSubmitStep(2);
      let attempts = 0;
      const maxAttempts = 60; // ~2 minutes

      while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 3000));
        const result = await aiEvaluationService.getSpeakingEvaluation(evaluationId);
        const status = result.data?.status;

        if (status === 'COMPLETED' || status === 'FAILED') {
          setSubmitStep(3);

          // Small delay to show completion
          await new Promise(r => setTimeout(r, 1000));

          // Navigate to result
          navigate(`/exam/speaking-result/${evaluationId}`);
          return;
        }
        attempts++;
      }

      // Timeout
      setSubmitStep(3);
      setSubmitError("Chấm bài quá lâu. Bạn có thể xem kết quả sau ở trang Lịch sử.");
      setTimeout(() => navigate('/exam/speaking-history'), 3000);

    } catch (err: any) {
      console.error("Submit speaking error:", err);
      setSubmitError(err.message || "Đã có lỗi xảy ra khi nộp bài.");
    }
  }, [navigate]);

  const submitSteps = [
    "Đang upload audio lên server...",
    "Đang gửi cho AI Examiner...",
    "AI đang chấm bài (30-60 giây)...",
    "Hoàn tất!",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-50 flex flex-col">
      {/* Submit Progress Modal */}
      {isSubmitting && (
        <SubmitProgress
          steps={submitSteps}
          currentStep={submitStep}
          error={submitError}
        />
      )}

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link to="/exam" className="text-slate-400 hover:text-slate-600 transition">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <span className="material-symbols-outlined text-[18px]">mic</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{testData?.title}</h1>
              <p className="text-[10px] text-slate-500">{activeSpeakingSection?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {recordedCount > 0 && (
              <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold border border-green-200">
                {recordedCount}/{allQuestions.length} đã ghi
              </span>
            )}
            <span className="text-xs text-slate-500 bg-amber-50 px-2.5 py-1 rounded-full font-bold border border-amber-200">SPEAKING</span>
            <span className="text-sm font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">{formatTime(timeLeft)}</span>
          </div>
        </div>
        {/* Part tabs */}
        <div className="max-w-4xl mx-auto px-6 pb-2 flex items-center gap-1">
          {speakingSections.map((sec) => (
            <button
              key={sec.sectionIdx}
              onClick={() => setCurrentSectionIdx(sec.sectionIdx)}
              className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                currentSectionIdx === sec.sectionIdx
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              Part {sec.partNum}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {/* Part 2 — Cue Card */}
        {activeSpeakingSection.partNum === 2 && cueCardContent && (
          <div className="mb-8 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl border-2 border-teal-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-teal-600">credit_card</span>
              <span className="font-bold text-teal-700">Topic Card</span>
            </div>
            <p className="text-lg font-semibold text-slate-800 mb-4">
              {cueCardContent.cueCardTopic || cueCardQ?.questionText}
            </p>
            {cueCardContent.bulletPoints?.filter(Boolean).length > 0 && (
              <div className="space-y-1.5 mb-3">
                <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">You should say:</p>
                {cueCardContent.bulletPoints.filter(Boolean).map((b: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-teal-500 mt-0.5">•</span>
                    <span className="text-sm text-slate-700">{b}</span>
                  </div>
                ))}
              </div>
            )}
            {cueCardContent.finalPrompt && (
              <p className="text-sm text-slate-600 italic border-t border-teal-200 pt-3 mt-3">
                {cueCardContent.finalPrompt}
              </p>
            )}
            <div className="mt-4 flex items-center gap-2 text-xs text-teal-600">
              <span className="material-symbols-outlined text-[14px]">timer</span>
              Preparation: 1 minute · Speaking: 1–2 minutes
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-4">
          {(activeSpeakingSection.partNum === 2 ? [] : speakingQuestions).map((q, idx) => (
            <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold text-sm shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-base font-medium text-slate-800">{q.questionText}</p>

                  <QuestionRecorder questionId={q.id} onBlobReady={handleBlobReady} />

                  <button
                    onClick={() => setShowNotes(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                    className="mt-2 text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer transition"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit_note</span>
                    {showNotes[q.id] ? 'Ẩn ghi chú' : 'Ghi chú'}
                  </button>

                  {showNotes[q.id] && (
                    <textarea
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      placeholder="Ghi chú thêm..."
                      rows={2}
                      className="w-full mt-2 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition placeholder:text-slate-400"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Part 2 — Record + Notes */}
          {activeSpeakingSection.partNum === 2 && cueCardQ && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <p className="text-sm font-bold text-slate-600 mb-1">Ghi âm bài nói của bạn</p>
              <p className="text-xs text-slate-400 mb-3">Nói trong 1–2 phút theo cue card ở trên</p>
              <QuestionRecorder questionId={cueCardQ.id} onBlobReady={handleBlobReady} />

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowNotes(prev => ({ ...prev, [cueCardQ.id]: !prev[cueCardQ.id] }))}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer transition"
                >
                  <span className="material-symbols-outlined text-[14px]">edit_note</span>
                  {showNotes[cueCardQ.id] ? 'Ẩn ghi chú' : 'Ghi chú outline'}
                </button>
                {showNotes[cueCardQ.id] && (
                  <textarea
                    value={answers[cueCardQ.id] || ''}
                    onChange={(e) => setAnswer(cueCardQ.id, e.target.value)}
                    placeholder="Ghi chú ý chính hoặc outline..."
                    rows={4}
                    className="w-full mt-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition placeholder:text-slate-400"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={goPrev}
            disabled={currentSectionIdx === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-30 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Part trước
          </button>
          {currentSectionIdx < sections.length - 1 ? (
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-sm transition cursor-pointer"
            >
              Part tiếp
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={handleSpeakingSubmit}
              disabled={recordedCount === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-green-600 text-white hover:bg-green-700 shadow-sm transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Nộp bài ({recordedCount}/{allQuestions.length} đã ghi)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
