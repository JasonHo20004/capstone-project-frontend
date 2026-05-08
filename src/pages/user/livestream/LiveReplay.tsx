import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AIAvatar } from "@/components/user/livestream/AIAvatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Play, Pause, RotateCcw, Volume2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_RAG_SERVICE_URL ?? "http://localhost:8000";

interface ReplaySection {
  index: number;
  title: string;
  content: string;
  audio_url: string;
  duration: number;
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

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function LiveReplay() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

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
        if (!r.ok) throw new Error("Recording not found");
        return r.json();
      })
      .then(setRecording)
      .catch((e) => setError(e.message))
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

  function playQAAnswer(qa: ReplayQA) {
    qaAudioRef.current?.pause();
    const audio = new Audio(qa.audio_url);
    qaAudioRef.current = audio;
    audio.play().catch(() => {});
  }

  const totalDuration = recording?.sections.reduce((a, s) => a + s.duration, 0) ?? 0;
  const progress = totalDuration > 0 ? Math.min((elapsed / totalDuration) * 100, 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading recording…</p>
        </div>
      </div>
    );
  }

  if (error || !recording) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
        <div className="text-center space-y-4">
          <p className="text-red-400 text-lg">{error || "Recording not found"}</p>
          <Button variant="outline" onClick={() => navigate("/live")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Live Rooms
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
          onClick={() => navigate("/live")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold truncate">{recording.topic}</h1>
          <p className="text-xs text-gray-400">
            Recorded by {recording.host_name} •{" "}
            {new Date(recording.completed_at).toLocaleDateString("vi-VN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-indigo-500 text-indigo-300 shrink-0"
        >
          {recording.level_label}
        </Badge>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Avatar + Transcript */}
        <div className="flex flex-col w-[58%] border-r border-gray-800 overflow-hidden">
          {/* Avatar */}
          <div className="flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950 py-6 shrink-0">
            <AIAvatar isSpeaking={isSpeaking} isThinking={false} className="w-40 h-40" />
            <div className="mt-3 text-sm text-gray-400 h-5">
              {currentSection >= 0 && currentSection < recording.sections.length ? (
                <span className="animate-pulse">
                  {recording.sections[currentSection].title}
                </span>
              ) : (
                <span>Click Play to start replay</span>
              )}
            </div>
          </div>

          {/* Progress bar + Controls */}
          <div className="px-6 py-3 bg-gray-900 border-t border-gray-800 shrink-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-gray-400 w-12 text-right">
                {formatDuration(elapsed)}
              </span>
              <div className="flex-1 bg-gray-700 rounded-full h-1.5 cursor-pointer">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-12">
                {formatDuration(totalDuration)}
              </span>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-300 hover:text-white"
                onClick={handleRestart}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
              {isSpeaking && !isPaused ? (
                <Button
                  size="icon"
                  className="bg-indigo-600 hover:bg-indigo-700 rounded-full h-10 w-10"
                  onClick={handlePause}
                >
                  <Pause className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  className="bg-indigo-600 hover:bg-indigo-700 rounded-full h-10 w-10"
                  onClick={handlePlay}
                >
                  <Play className="h-5 w-5 ml-0.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Transcript sections */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {recording.sections.map((section, i) => (
                <button
                  key={i}
                  onClick={() => jumpToSection(i)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    currentSection === i
                      ? "bg-indigo-900/40 border-indigo-500"
                      : "bg-gray-800/50 border-gray-700 hover:border-indigo-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-indigo-300">
                      {section.title}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDuration(section.duration)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2">{section.content}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right: Q&A Log */}
        <div className="flex flex-col w-[42%] overflow-hidden">
          <div className="px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
            <h2 className="text-sm font-semibold text-gray-300">
              Q&A from this session ({recording.qa.length})
            </h2>
          </div>

          {recording.qa.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
              No questions were asked in this session.
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {recording.qa.map((item, i) => (
                  <div key={i} className="space-y-2">
                    {/* Question */}
                    <div className="flex justify-end">
                      <div className="bg-indigo-700/50 rounded-2xl rounded-tr-sm px-3 py-2 max-w-[85%]">
                        <p className="text-xs text-indigo-300 font-medium mb-0.5">
                          {item.user_name}
                        </p>
                        <p className="text-sm text-white">{item.question}</p>
                      </div>
                    </div>
                    {/* Answer */}
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-1">
                        <span className="text-xs font-bold">AI</span>
                      </div>
                      <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-3 py-2 max-w-[85%]">
                        <p className="text-sm text-gray-200">{item.answer}</p>
                        {item.audio_url && (
                          <button
                            onClick={() => playQAAnswer(item)}
                            className="mt-1.5 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                          >
                            <Volume2 className="h-3 w-3" /> Play audio
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
