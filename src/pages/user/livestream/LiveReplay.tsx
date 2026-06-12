import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AIAvatarAnime } from "@/components/user/livestream/AIAvatarAnime";
import { LessonSlide } from "@/components/user/livestream/LessonSlide";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Play, Pause, RotateCcw, Volume2, BookOpen, MessageSquare, Check, PlaySquare,
  Zap, Swords, Users,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Routes through the api-gateway (proxies /api/livestream/* to rag-service).
const API_BASE = import.meta.env.VITE_GATEWAY_URL ?? "http://localhost:3000";

interface ReplayQuiz {
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
  counts?: number[];
  total_answered?: number;
}

interface ReplayBattle {
  phrase: string;
  participants?: number;
  leaderboard?: { user_id: string; user_name: string; score: number }[];
}

interface ReplaySection {
  index: number;
  title: string;
  content: string;
  audio_url: string;
  duration: number;
  // Slide payload — same shape the live room renders, so replay looks identical.
  key_points?: string[];
  keywords?: { term: string; meaning: string }[];
  example?: string;
  practice_phrase?: string;
  image_url?: string;
  // Room events that ran after this slide, kept in the recording.
  quiz?: ReplayQuiz;
  battle?: ReplayBattle;
}

interface ReplayQA {
  user_name: string;
  question: string;
  answer: string;
  audio_url: string;
}

interface Recording {
  room_id: string;
  topic: string;
  level: string;
  level_label: string;
  host_name: string;
  completed_at: string;
  sections: ReplaySection[];
  qa: ReplayQA[];
}

const LEVEL_COLORS: Record<string, string> = {
  beginner:     'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced:     'bg-violet-100 text-violet-700',
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function LiveReplay() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("livestream");

  const [recording, setRecording] = useState<Recording | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentSection, setCurrentSection] = useState(-1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qaAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/livestream/recordings/${roomId}`)
      .then((r) => {
        if (!r.ok) throw new Error("notFound"); // localized at render time
        return r.json();
      })
      .then(setRecording)
      .catch(() => setError("notFound"))
      .finally(() => setLoading(false));
  }, [roomId]);

  useEffect(() => {
    return () => {
      stopTimer();
      audioRef.current?.pause();
      qaAudioRef.current?.pause();
    };
  }, []);

  function startTimer() {
    stopTimer();
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function playSection(index: number, rec: Recording) {
    if (index >= rec.sections.length) {
      setCurrentSection(-1);
      setIsSpeaking(false);
      stopTimer();
      return;
    }

    const section = rec.sections[index];
    setCurrentSection(index);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(section.audio_url);
    audioRef.current = audio;

    audio.onplay = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      startTimer();
    };
    audio.onpause = () => {
      setIsSpeaking(false);
      stopTimer();
    };
    audio.onended = () => {
      setIsSpeaking(false);
      stopTimer();
      playSection(index + 1, rec);
    };
    audio.onerror = () => {
      setIsSpeaking(false);
      stopTimer();
      playSection(index + 1, rec);
    };

    audio.play().catch(() => {});
  }

  function handlePlay() {
    if (!recording) return;
    if (isPaused && audioRef.current) {
      audioRef.current.play().catch(() => {});
      setIsPaused(false);
    } else {
      setElapsed(0);
      playSection(0, recording);
    }
  }

  function handlePause() {
    audioRef.current?.pause();
    setIsPaused(true);
    setIsSpeaking(false);
    stopTimer();
  }

  function handleRestart() {
    audioRef.current?.pause();
    setElapsed(0);
    setCurrentSection(-1);
    setIsSpeaking(false);
    setIsPaused(false);
    stopTimer();
    if (recording) playSection(0, recording);
  }

  function jumpToSection(index: number) {
    if (!recording) return;
    audioRef.current?.pause();
    stopTimer();
    setElapsed(recording.sections.slice(0, index).reduce((a, s) => a + s.duration, 0));
    playSection(index, recording);
  }

  // Click-to-seek on the progress bar: map the click position to the section
  // whose cumulative duration contains that point, then jump there.
  function seekToFraction(fraction: number) {
    if (!recording) return;
    const total = recording.sections.reduce((a, s) => a + s.duration, 0);
    if (total <= 0) return;
    const target = Math.max(0, Math.min(1, fraction)) * total;
    let acc = 0;
    for (let i = 0; i < recording.sections.length; i++) {
      acc += recording.sections[i].duration;
      if (target <= acc) { jumpToSection(i); return; }
    }
    jumpToSection(recording.sections.length - 1);
  }

  function playQAAnswer(qa: ReplayQA) {
    // Pause the lesson narration first so the two clips don't play over each
    // other; the user can resume the lesson with the Play button afterwards.
    if (audioRef.current && !audioRef.current.paused) handlePause();
    qaAudioRef.current?.pause();
    const audio = new Audio(qa.audio_url);
    qaAudioRef.current = audio;
    audio.play().catch(() => {});
  }

  const totalDuration = recording?.sections.reduce((a, s) => a + s.duration, 0) ?? 0;
  const progress = totalDuration > 0 ? Math.min((elapsed / totalDuration) * 100, 100) : 0;
  const activeSection =
    recording && currentSection >= 0 && currentSection < recording.sections.length
      ? recording.sections[currentSection]
      : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-slate-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !recording) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-slate-50">
        <div className="text-center space-y-4">
          <p className="text-rose-500 text-lg">{t("replay.notFound")}</p>
          <Button variant="outline" onClick={() => navigate("/live")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> {t("replay.backToRooms")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50">
      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shrink-0">
        <button
          onClick={() => navigate("/live")}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label={t("replay.back")}
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-semibold text-slate-900 truncate text-sm">{recording.topic}</h1>
            <Badge variant="outline" className={cn("text-xs", LEVEL_COLORS[recording.level])}>
              {recording.level_label}
            </Badge>
            <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              <PlaySquare className="w-3 h-3" /> {t("replay.badge")}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t("replay.recordedBy", {
              name: recording.host_name,
              date: new Date(recording.completed_at).toLocaleDateString(
                i18n.language === "vi" ? "vi-VN" : "en-US",
                { year: "numeric", month: "long", day: "numeric" },
              ),
            })}
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: stage (slide + avatar) + section list + controls */}
        <div className="flex flex-col flex-1 min-w-0 lg:w-[58%] border-r border-slate-200 overflow-hidden">
          {/* Scrollable stage + sections */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {/* Stage */}
            <div className="bg-gradient-to-b from-indigo-50 to-white px-3 pt-3 pb-3 border-b border-slate-100">
              {activeSection ? (
                <>
                  <LessonSlide
                    chunk={activeSection}
                    index={currentSection}
                    total={recording.sections.length}
                    active={true}
                    ragBase={API_BASE}
                    avatarSlot={
                      <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 border-white shadow-xl bg-white/30 backdrop-blur-sm">
                        <AIAvatarAnime isSpeaking={isSpeaking} className="w-full h-full" name="" />
                      </div>
                    }
                  />

                  {/* Quiz checkpoint that ran after this slide — static recap
                      of the question, the room's votes and the explanation */}
                  {activeSection.quiz && (
                    <div className="mt-3 rounded-xl border border-indigo-100 bg-white p-3 space-y-2">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                        <Zap className="w-3 h-3" />
                        {t("replay.quizTitle")}
                        {(activeSection.quiz.total_answered ?? 0) > 0 && (
                          <span className="ml-auto flex items-center gap-1 font-medium normal-case tracking-normal text-slate-400">
                            <Users className="w-3 h-3" />
                            {t("replay.quizAnswered", { count: activeSection.quiz.total_answered })}
                          </span>
                        )}
                      </p>
                      <p className="text-sm font-semibold text-slate-800">{activeSection.quiz.question}</p>
                      <div className="space-y-1">
                        {activeSection.quiz.options.map((opt, i) => {
                          const isCorrect = i === activeSection.quiz!.correct_index;
                          const count = activeSection.quiz!.counts?.[i] ?? 0;
                          return (
                            <div
                              key={i}
                              className={cn(
                                "flex items-center gap-2 text-xs rounded-lg px-2 py-1",
                                isCorrect
                                  ? "bg-emerald-50 ring-1 ring-emerald-200 text-emerald-800 font-semibold"
                                  : "bg-slate-50 text-slate-600",
                              )}
                            >
                              {isCorrect && <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />}
                              <span className="flex-1 leading-tight">{opt}</span>
                              <span className="tabular-nums text-slate-400 shrink-0">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                      {activeSection.quiz.explanation && (
                        <p className="text-xs text-slate-500 leading-relaxed">{activeSection.quiz.explanation}</p>
                      )}
                    </div>
                  )}

                  {/* Speaking battle that ran after this slide — final podium */}
                  {activeSection.battle && (
                    <div className="mt-3 rounded-xl border border-rose-100 bg-white p-3 space-y-2">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-500">
                        <Swords className="w-3 h-3" />
                        {t("replay.battleTitle")}
                      </p>
                      <p className="text-sm font-semibold text-slate-800">"{activeSection.battle.phrase}"</p>
                      {(activeSection.battle.leaderboard?.length ?? 0) === 0 ? (
                        <p className="text-xs text-slate-400">{t("replay.battleNoPlayers")}</p>
                      ) : (
                        <div className="space-y-1">
                          {activeSection.battle.leaderboard!.slice(0, 3).map((e, rank) => (
                            <div key={e.user_id} className="flex items-center gap-2 text-xs text-slate-700">
                              <span className="w-5 text-center shrink-0" aria-hidden>
                                {["🥇", "🥈", "🥉"][rank]}
                              </span>
                              <span className="flex-1 truncate">{e.user_name}</span>
                              <span className="tabular-nums font-bold shrink-0">{e.score}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8">
                  <AIAvatarAnime isSpeaking={isSpeaking} className="w-40 h-48" name="AI Sensei" />
                  <p className="text-sm text-slate-400">{t("replay.clickPlay")}</p>
                </div>
              )}
            </div>

            {/* Section list */}
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 bg-white/95 backdrop-blur-sm sticky top-0 z-10">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-500">{t("replay.sectionsTitle")}</span>
              <span className="ml-auto text-[10px] text-slate-400">{t("replay.slideCount", { count: recording.sections.length })}</span>
            </div>
            <div className="px-4 py-3 space-y-2">
              {recording.sections.map((section, i) => {
                const isActive = i === currentSection;
                const isDone = currentSection >= 0 && i < currentSection;
                return (
                  <button
                    key={i}
                    onClick={() => jumpToSection(i)}
                    className={cn(
                      "w-full text-left rounded-xl border p-3 transition-all",
                      isActive
                        ? "border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200 shadow-sm"
                        : "border-slate-200 bg-white hover:border-indigo-300",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0",
                          isActive
                            ? "bg-indigo-600 text-white"
                            : isDone
                              ? "bg-slate-200 text-slate-500"
                              : "bg-slate-100 text-slate-400",
                        )}
                      >
                        {isDone ? <Check size={12} /> : i + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-700 flex-1 truncate">
                        {section.title}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0 tabular-nums">
                        {formatDuration(section.duration)}
                      </span>
                    </div>
                    {!isActive && (
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 pl-7">{section.content}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Player controls — pinned at the bottom like a media player */}
          <div className="shrink-0 px-6 py-3 bg-white border-t border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-slate-400 w-12 text-right tabular-nums">
                {formatDuration(elapsed)}
              </span>
              <div
                className="flex-1 bg-slate-200 rounded-full h-1.5 cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  seekToFraction((e.clientX - rect.left) / rect.width);
                }}
                title={t("replay.seekHint")}
              >
                <div
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1.5 rounded-full transition-all pointer-events-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 w-12 tabular-nums">
                {formatDuration(totalDuration)}
              </span>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-500 hover:text-slate-800"
                onClick={handleRestart}
                aria-label={t("replay.restart")}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
              {isSpeaking && !isPaused ? (
                <Button
                  size="icon"
                  className="bg-indigo-600 hover:bg-indigo-700 rounded-full h-10 w-10"
                  onClick={handlePause}
                  aria-label={t("replay.pause")}
                >
                  <Pause className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  className="bg-indigo-600 hover:bg-indigo-700 rounded-full h-10 w-10"
                  onClick={handlePlay}
                  aria-label={t("replay.play")}
                >
                  <Play className="h-5 w-5 ml-0.5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Q&A log */}
        <div className="flex flex-col flex-1 min-w-0 lg:w-[42%] overflow-hidden bg-white">
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 shrink-0">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">
              {t("replay.qaTitle", { count: recording.qa.length })}
            </span>
          </div>

          {recording.qa.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm px-6 text-center">
              {t("replay.noQa")}
            </div>
          ) : (
            <ScrollArea className="flex-1 px-3 py-3">
              <div className="space-y-4">
                {recording.qa.map((item, i) => (
                  <div key={i} className="space-y-2">
                    {/* Question */}
                    <div className="flex justify-end">
                      <div className="max-w-[85%] bg-indigo-600 text-white rounded-2xl rounded-br-sm px-3 py-2">
                        <p className="text-[11px] font-semibold opacity-70 mb-0.5">{item.user_name}</p>
                        <p className="text-sm">{item.question}</p>
                      </div>
                    </div>
                    {/* Answer */}
                    <div className="flex gap-2 items-start">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-white text-[9px] font-bold">AI</span>
                      </div>
                      <div className="max-w-[85%] bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                        {/* Answers are generated as Markdown — render it like the
                            live chat does instead of showing raw ** and # marks */}
                        <div className="text-sm text-slate-800 leading-relaxed break-words prose prose-sm prose-slate max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.answer}</ReactMarkdown>
                        </div>
                        {item.audio_url && (
                          <button
                            onClick={() => playQAAnswer(item)}
                            className="mt-1.5 flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
                          >
                            <Volume2 className="h-3 w-3" /> {t("replay.playAudio")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
