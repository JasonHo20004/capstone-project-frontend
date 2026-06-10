import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("exam");
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
          {error ? t("speakingTestLayout.submitModal.error") : currentStep >= steps.length ? t("speakingTestLayout.submitModal.done") : t("speakingTestLayout.submitModal.processing")}
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
  const { t } = useTranslation("exam");

  // ─── Section / Part config ─────────────────────────────────────────────────
  const speakingSections = sections.map((sec, idx) => {
    const partMatch = sec.title?.match(/Part\s*(\d)/i);
    const partNum = partMatch ? parseInt(partMatch[1]) : idx + 1;
    return { ...sec, partNum, sectionIdx: idx };
  });
  const activeSpeakingSection = speakingSections[currentSectionIdx] || speakingSections[0];
  const speakingQuestions = activeSpeakingSection?.questions || [];
  const cueCardQ = activeSpeakingSection.partNum === 2 ? speakingQuestions[0] : null;
  const cueCardContent = cueCardQ?.content as any;

  // ─── One-question-at-a-time state ──────────────────────────────────────────
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const questionsForPart = activeSpeakingSection.partNum === 2 ? [] : speakingQuestions;
  const currentQuestion = questionsForPart[activeQuestionIdx];

  // Reset question index on part change
  useEffect(() => {
    setActiveQuestionIdx(0);
  }, [currentSectionIdx]);

  // ─── Recording state ──────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);

  // ─── Recorded data tracking ───────────────────────────────────────────────
  const blobsRef = useRef<Record<string, Blob>>({});
  const [recordedCount, setRecordedCount] = useState(0);
  const [recordedMap, setRecordedMap] = useState<Record<string, boolean>>({});
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});

  // ─── Playback state ───────────────────────────────────────────────────────
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ─── Notes ────────────────────────────────────────────────────────────────
  const [showNotes, setShowNotes] = useState(false);

  // ─── Part 2 Prep Timer ────────────────────────────────────────────────────
  const [prepTimeLeft, setPrepTimeLeft] = useState(60);
  const [isPrepRunning, setIsPrepRunning] = useState(false);

  useEffect(() => {
    if (activeSpeakingSection.partNum === 2) {
      setPrepTimeLeft(60);
      setIsPrepRunning(true);
    } else {
      setIsPrepRunning(false);
    }
  }, [activeSpeakingSection.partNum]);

  useEffect(() => {
    if (!isPrepRunning || prepTimeLeft <= 0) {
      if (prepTimeLeft === 0) setIsPrepRunning(false);
      return;
    }
    const timer = setInterval(() => {
      setPrepTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPrepRunning, prepTimeLeft]);

  // ─── Recording Timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const formatElapsed = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ─── Start Recording ─────────────────────────────────────────────────────
  const startRecording = useCallback(async (questionId: string) => {
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
        blobsRef.current[questionId] = blob;
        setRecordedCount(Object.keys(blobsRef.current).length);
        setRecordedMap(prev => ({ ...prev, [questionId]: true }));
        setAudioUrls(prev => ({ ...prev, [questionId]: url }));
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      // Start speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.onresult = (e: any) => {
          let t = "";
          for (let i = 0; i < e.results.length; i++) {
            t += e.results[i][0].transcript + " ";
          }
          setTranscripts(prev => ({ ...prev, [questionId]: t }));
        };
        recognition.onerror = () => {};
        recognition.start();
        recognitionRef.current = recognition;
      }

      // Remove old recording for this question
      delete blobsRef.current[questionId];
      setRecordedMap(prev => ({ ...prev, [questionId]: false }));
      if (audioUrls[questionId]) {
        URL.revokeObjectURL(audioUrls[questionId]);
        setAudioUrls(prev => { const n = { ...prev }; delete n[questionId]; return n; });
      }
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }, [audioUrls]);

  // ─── Stop Recording ──────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsRecording(false);
  }, []);

  // ─── Delete a recording ──────────────────────────────────────────────────
  const deleteRecording = useCallback((questionId: string) => {
    delete blobsRef.current[questionId];
    setRecordedCount(Object.keys(blobsRef.current).length);
    setRecordedMap(prev => ({ ...prev, [questionId]: false }));
    if (audioUrls[questionId]) {
      URL.revokeObjectURL(audioUrls[questionId]);
      setAudioUrls(prev => { const n = { ...prev }; delete n[questionId]; return n; });
    }
    setTranscripts(prev => { const n = { ...prev }; delete n[questionId]; return n; });
  }, [audioUrls]);

  // ─── Navigation helpers ───────────────────────────────────────────────────
  const goToNextQuestion = useCallback(() => {
    if (activeQuestionIdx < questionsForPart.length - 1) {
      setActiveQuestionIdx(prev => prev + 1);
    }
  }, [activeQuestionIdx, questionsForPart.length]);

  const goToPrevQuestion = useCallback(() => {
    if (activeQuestionIdx > 0) {
      setActiveQuestionIdx(prev => prev - 1);
    }
  }, [activeQuestionIdx]);

  // Stop recording (no auto-advance — user navigates manually)
  const stopAndFinish = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  // ─── Submit flow ──────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const allQuestions = sections.flatMap(s => s.questions);

  const handleSpeakingSubmit = useCallback(async () => {
    const blobs = blobsRef.current;
    const questionIds = Object.keys(blobs);

    if (questionIds.length === 0) {
      setSubmitError(t("speakingTestLayout.errors.noRecording"));
      return;
    }

    setIsSubmitting(true);
    setSubmitStep(0);
    setSubmitError(null);

    try {
      let userId = 'anonymous';
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.sub || payload.userId || payload.id || 'anonymous';
        }
      } catch {}

      setSubmitStep(0);
      const uploadedUrls: Record<string, string> = {};

      for (const qId of questionIds) {
        const blob = blobs[qId];
        const urlResp = await aiEvaluationService.getSpeakingUploadUrl();
        const { uploadUrl, publicUrl } = urlResp.data!;

        await fetch(uploadUrl, {
          method: 'PUT',
          body: blob,
          headers: { 'Content-Type': 'audio/webm' },
        });

        uploadedUrls[qId] = publicUrl;
      }

      setSubmitStep(1);
      const firstUrl = Object.values(uploadedUrls)[0];

      const evalResp = await aiEvaluationService.submitSpeakingEvaluation({
        userId,
        audioUrl: firstUrl,
        questionId: questionIds[0],
      });

      const evaluationId = evalResp.data?.evaluationId;
      if (!evaluationId) throw new Error(t("speakingTestLayout.errors.noEvaluationId"));

      setSubmitStep(2);
      let attempts = 0;
      // ~4 min at 3s/poll. Grading now runs Whisper STT + Gemini Pro multimodal
      // (slower than Flash) and the worker is concurrency:1, so allow more time
      // before giving up and sending the user to History.
      const maxAttempts = 80;

      while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 3000));
        const result = await aiEvaluationService.getSpeakingEvaluation(evaluationId);
        const status = result.data?.status;

        if (status === 'COMPLETED' || status === 'FAILED') {
          setSubmitStep(3);
          await new Promise(r => setTimeout(r, 1000));
          navigate(`/exam/speaking-result/${evaluationId}`);
          return;
        }
        attempts++;
      }

      setSubmitStep(3);
      setSubmitError(t("speakingTestLayout.errors.gradingTimeout"));
      setTimeout(() => navigate('/exam/speaking-history'), 3000);

    } catch (err: any) {
      console.error("Submit speaking error:", err);
      setSubmitError(err.message || t("speakingTestLayout.errors.submitFailed"));
    }
  }, [navigate, t]);

  const submitSteps = [
    t("speakingTestLayout.steps.upload"),
    t("speakingTestLayout.steps.sendAi"),
    t("speakingTestLayout.steps.grading"),
    t("speakingTestLayout.steps.done"),
  ];

  // ─── Determine the current question ID for recording ──────────────────────
  const activeQId = activeSpeakingSection.partNum === 2 && cueCardQ ? cueCardQ.id : currentQuestion?.id;
  const isCurrentRecorded = activeQId ? !!recordedMap[activeQId] : false;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Submit Progress Modal */}
      {isSubmitting && (
        <SubmitProgress
          steps={submitSteps}
          currentStep={submitStep}
          error={submitError}
        />
      )}

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <Link to="/exam" className="text-slate-400 hover:text-slate-600 transition">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-sm">
            <span className="material-symbols-outlined text-[18px]">mic</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 tracking-tight">{testData?.title}</h1>
            <p className="text-[10px] text-slate-500 font-medium">{activeSpeakingSection?.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {recordedCount > 0 && (
            <span className="text-[10px] text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-bold border border-green-200">
              {t("speakingTestLayout.recordedCount", { count: recordedCount, total: allQuestions.length })}
            </span>
          )}
          <span className="text-xs text-slate-500 bg-amber-50 px-2.5 py-1 rounded-full font-bold border border-amber-200">{t("speakingTestLayout.skillBadge")}</span>
          <span className="text-sm font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">{formatTime(timeLeft)}</span>
        </div>
      </header>

      {/* ─── Part Tabs ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-6">
        <div className="max-w-3xl mx-auto flex items-center gap-1 py-2">
          {speakingSections.map((sec) => (
            <button
              key={sec.sectionIdx}
              onClick={() => setCurrentSectionIdx(sec.sectionIdx)}
              className={`px-5 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                currentSectionIdx === sec.sectionIdx
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {t("speakingTestLayout.part", { num: sec.partNum })}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-y-auto">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>

        <div className="z-10 w-full max-w-3xl mx-auto">

          {/* ═════════════ Part 1 & 3: One question at a time ═════════════ */}
          {activeSpeakingSection.partNum !== 2 && currentQuestion && (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500" key={currentQuestion.id}>
              {/* Progress dots */}
              <div className="flex items-center gap-2 mb-8">
                {questionsForPart.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveQuestionIdx(i)}
                    className={`transition-all cursor-pointer ${
                      i === activeQuestionIdx
                        ? 'w-8 h-3 bg-amber-500 rounded-full shadow-md shadow-amber-300'
                        : recordedMap[questionsForPart[i].id]
                        ? 'w-3 h-3 bg-emerald-400 rounded-full'
                        : 'w-3 h-3 bg-slate-200 rounded-full hover:bg-slate-300'
                    }`}
                    title={t("speakingTestLayout.questionTitle", { num: i + 1 })}
                  />
                ))}
              </div>

              {/* Question number badge */}
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-amber-500/20 -rotate-3">
                <span className="text-xl font-black">{activeQuestionIdx + 1}</span>
              </div>

              {/* Examiner icon */}
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-indigo-400 text-[20px]">record_voice_over</span>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{t("speakingTestLayout.examinerAsks")}</span>
              </div>

              {/* THE QUESTION - big and centered */}
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 leading-snug tracking-tight text-center mb-6 max-w-2xl">
                "{currentQuestion.questionText}"
              </h2>

              {/* Recorded indicator */}
              {isCurrentRecorded && !isRecording && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 mb-4 animate-in fade-in duration-300">
                  <span className="material-symbols-outlined text-emerald-500 text-[20px]">check_circle</span>
                  <span className="text-sm font-bold text-emerald-700">{t("speakingTestLayout.recorded")}</span>
                  {audioUrls[currentQuestion.id] && (
                    <button
                      onClick={() => {
                        if (playingId === currentQuestion.id) {
                          audioRef.current?.pause();
                          setPlayingId(null);
                        } else {
                          if (audioRef.current) {
                            audioRef.current.src = audioUrls[currentQuestion.id];
                            audioRef.current.play();
                            setPlayingId(currentQuestion.id);
                          }
                        }
                      }}
                      className="ml-2 text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {playingId === currentQuestion.id ? 'pause' : 'play_arrow'}
                      </span>
                      {t("speakingTestLayout.replay")}
                    </button>
                  )}
                  <button
                    onClick={() => deleteRecording(currentQuestion.id)}
                    className="ml-auto text-xs font-bold text-red-400 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                    {t("speakingTestLayout.reRecord")}
                  </button>
                </div>
              )}

              {/* Transcript preview */}
              {transcripts[currentQuestion.id] && (
                <div className="w-full max-w-xl bg-indigo-50/60 border border-indigo-100 rounded-xl px-5 py-3 mb-4">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">{t("speakingTestLayout.transcriptLabel")}</p>
                  <p className="text-sm text-slate-600 italic leading-relaxed">"{transcripts[currentQuestion.id]}"</p>
                </div>
              )}

              {/* Notes toggle */}
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-indigo-500 transition mb-3 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">{showNotes ? "visibility_off" : "edit_note"}</span>
                {showNotes ? t("speakingTestLayout.hideNotes") : t("speakingTestLayout.quickNotes")}
              </button>

              {showNotes && (
                <div className="w-full max-w-xl animate-in slide-in-from-top-2 duration-300">
                  <textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                    placeholder={t("speakingTestLayout.notesPlaceholderP1")}
                    rows={3}
                    className="w-full bg-white border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all placeholder:text-slate-400 shadow-sm"
                  />
                </div>
              )}

              {/* Question navigation (sub-question level) */}
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={goToPrevQuestion}
                  disabled={activeQuestionIdx === 0}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition cursor-pointer disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                  {t("speakingTestLayout.prevQuestion")}
                </button>
                <span className="text-xs font-bold text-slate-400">{activeQuestionIdx + 1} / {questionsForPart.length}</span>
                <button
                  onClick={goToNextQuestion}
                  disabled={activeQuestionIdx === questionsForPart.length - 1}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition cursor-pointer disabled:cursor-not-allowed"
                >
                  {t("speakingTestLayout.nextQuestion")}
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* ═════════════ Part 2: Cue Card ═════════════ */}
          {activeSpeakingSection.partNum === 2 && cueCardContent && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 w-full">
              <div className="bg-white rounded-[28px] border border-slate-200 shadow-xl shadow-slate-200/40 p-8 sm:p-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 to-cyan-500" />

                <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-100">
                  <span className="bg-teal-100 text-teal-700 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl">{t("speakingTestLayout.cueCardBadge")}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest leading-none mb-1">{t("speakingTestLayout.prepTime")}</span>
                      <span className={`text-2xl leading-none font-mono font-black ${
                        prepTimeLeft === 0 ? 'text-red-500'
                        : prepTimeLeft <= 10 ? 'text-orange-500 animate-pulse'
                        : 'text-teal-600'
                      }`}>
                        00:{prepTimeLeft.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <button
                      onClick={() => { setPrepTimeLeft(60); setIsPrepRunning(true); }}
                      className="w-9 h-9 rounded-full bg-teal-50 text-teal-600 hover:bg-teal-100 flex items-center justify-center transition cursor-pointer"
                      title="Reset"
                    >
                      <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                    </button>
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mb-8 leading-tight">
                  {cueCardContent.cueCardTopic || cueCardQ?.questionText}
                </h3>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-5">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t("speakingTestLayout.youShouldSay")}</p>
                  <ul className="space-y-4">
                    {cueCardContent.bulletPoints?.filter(Boolean).map((bp: string, i: number) => (
                      <li key={i} className="text-base text-slate-700 flex items-start gap-3">
                        <span className="w-7 h-7 rounded-full bg-teal-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-sm font-black shadow-md shadow-teal-500/20">{i + 1}</span>
                        <span className="font-medium leading-relaxed">{bp}</span>
                      </li>
                    ))}
                  </ul>
                  {cueCardContent.finalPrompt && (
                    <div className="mt-6 pt-5 border-t border-slate-200">
                      <p className="text-base text-slate-800 font-bold flex items-start gap-2">
                        <span className="material-symbols-outlined text-teal-500 mt-0.5">forum</span>
                        {cueCardContent.finalPrompt}
                      </p>
                    </div>
                  )}
                </div>

                {/* Cue card recording status */}
                {isCurrentRecorded && !isRecording && (
                  <div className="mt-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3">
                    <span className="material-symbols-outlined text-emerald-500 text-[20px]">check_circle</span>
                    <span className="text-sm font-bold text-emerald-700">{t("speakingTestLayout.recorded")}</span>
                    {audioUrls[cueCardQ!.id] && (
                      <button
                        onClick={() => {
                          if (playingId === cueCardQ!.id) {
                            audioRef.current?.pause();
                            setPlayingId(null);
                          } else {
                            if (audioRef.current) {
                              audioRef.current.src = audioUrls[cueCardQ!.id];
                              audioRef.current.play();
                              setPlayingId(cueCardQ!.id);
                            }
                          }
                        }}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">{playingId === cueCardQ!.id ? 'pause' : 'play_arrow'}</span>
                        {t("speakingTestLayout.replay")}
                      </button>
                    )}
                    <button
                      onClick={() => deleteRecording(cueCardQ!.id)}
                      className="ml-auto text-xs font-bold text-red-400 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                      {t("speakingTestLayout.reRecord")}
                    </button>
                  </div>
                )}

                {/* Notes */}
                <div className="mt-4">
                  <button
                    onClick={() => setShowNotes(!showNotes)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-teal-600 transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">{showNotes ? "visibility_off" : "edit_note"}</span>
                    {showNotes ? t("speakingTestLayout.hideNotes") : t("speakingTestLayout.outlineNotes")}
                  </button>
                  {showNotes && cueCardQ && (
                    <textarea
                      value={answers[cueCardQ.id] || ''}
                      onChange={(e) => setAnswer(cueCardQ.id, e.target.value)}
                      placeholder={t("speakingTestLayout.notesPlaceholderP2")}
                      rows={4}
                      className="w-full mt-2 bg-white border border-slate-200 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all placeholder:text-slate-400 shadow-sm"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Bottom Recording Bar ──────────────────────────────────────────── */}
      <div className="border-t border-slate-200 bg-white px-6 py-6 shrink-0 relative z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          {/* Left: Part navigation */}
          <button
            onClick={goPrev}
            disabled={currentSectionIdx === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition cursor-pointer disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            {t("speakingTestLayout.prevPart")}
          </button>

          {/* Center: Recording button */}
          <div className="flex flex-col items-center">
            {isRecording ? (
              <div className="flex items-center gap-5 animate-in zoom-in duration-300">
                {/* Waveform */}
                <div className="flex items-center gap-[3px] h-8">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className="w-[3px] bg-red-400 rounded-full"
                      style={{
                        animation: `waveform 0.7s ease-in-out ${i * 0.08}s infinite alternate`,
                        height: `${10 + Math.random() * 18}px`,
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={stopAndFinish}
                  className="relative w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-red-500/30 transition-all hover:scale-105 cursor-pointer border-4 border-white"
                >
                  <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-20" />
                  <span className="material-symbols-outlined text-[28px] relative z-10">stop</span>
                </button>
                <div className="flex flex-col items-start">
                  <span className="text-lg font-mono font-black text-red-500">{formatElapsed(recordingTime)}</span>
                  <span className="text-[10px] text-red-400 font-bold animate-pulse">{t("speakingTestLayout.recording")}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <button
                  onClick={() => { if (activeQId) startRecording(activeQId); }}
                  disabled={!activeQId}
                  className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-amber-500/25 transition-all hover:scale-110 disabled:opacity-40 cursor-pointer border-4 border-white"
                >
                  <span className="material-symbols-outlined text-[28px]">mic</span>
                </button>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
                  {isCurrentRecorded ? t("speakingTestLayout.tapToReRecord") : t("speakingTestLayout.tapToAnswer")}
                </p>
              </div>
            )}
          </div>

          {/* Right: Next part or Submit */}
          {currentSectionIdx < sections.length - 1 ? (
            <button
              onClick={goNext}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-amber-500 text-white rounded-xl hover:bg-amber-600 shadow-sm transition cursor-pointer"
            >
              {t("speakingTestLayout.nextPart")}
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={handleSpeakingSubmit}
              disabled={recordedCount === 0}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-sm transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              {t("speakingTestLayout.submit")}
            </button>
          )}
        </div>
      </div>

      {/* Hidden audio player */}
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />

      {/* Waveform animation */}
      {isRecording && (
        <style>{`
          @keyframes waveform {
            0% { height: 6px; }
            100% { height: 24px; }
          }
        `}</style>
      )}
    </div>
  );
}
