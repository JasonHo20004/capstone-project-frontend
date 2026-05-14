import { useEffect, useRef, useState } from "react";
import { formatTime } from "./speaking-utils";

interface WaveformProps {
  stream: MediaStream | null;
  active: boolean;
  height?: number;
  color?: string;
}

export function Waveform({
  stream,
  active,
  height = 80,
  color = "#ef4444",
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || !active) return;

    const AC = window.AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = new AC();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);

    const bufLen = analyser.frequencyBinCount;
    const data = new Uint8Array(bufLen);

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const c = canvas.getContext("2d");
      if (!c) return;

      const W = canvas.width;
      const H = canvas.height;

      analyser.getByteFrequencyData(data);
      c.clearRect(0, 0, W, H);

      const bars = 40;
      const slice = Math.floor(bufLen / bars);
      const barW = (W / bars) * 0.7;
      const gap = (W / bars) * 0.3;

      for (let i = 0; i < bars; i++) {
        let sum = 0;
        for (let j = 0; j < slice; j++) sum += data[i * slice + j];
        const avg = sum / slice;
        const barH = Math.max(2, (avg / 255) * H * 0.9);
        const x = i * (barW + gap);
        const y = (H - barH) / 2;
        c.fillStyle = color;
        c.fillRect(x, y, barW, barH);
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try { src.disconnect(); } catch { /* ignore */ }
      try { analyser.disconnect(); } catch { /* ignore */ }
      ctx.close().catch(() => { /* ignore */ });
    };
  }, [stream, active, color]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={height}
      style={{ width: "100%", height }}
      className="rounded-xl bg-slate-50"
    />
  );
}

interface VolumeMeterProps {
  stream: MediaStream | null;
}

export function VolumeMeter({ stream }: VolumeMeterProps) {
  const [level, setLevel] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream) return;
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = new AC();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    const buf = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i];
      const avg = sum / buf.length;
      setLevel(Math.min(100, (avg / 128) * 100));
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try { src.disconnect(); } catch { /* ignore */ }
      try { analyser.disconnect(); } catch { /* ignore */ }
      ctx.close().catch(() => { /* ignore */ });
    };
  }, [stream]);

  const color =
    level < 5 ? "bg-slate-300" :
    level < 20 ? "bg-emerald-500" :
    level < 60 ? "bg-amber-500" :
    "bg-red-500";

  return (
    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
      <div
        className={`h-full transition-all duration-75 ${color}`}
        style={{ width: `${level}%` }}
      />
    </div>
  );
}

interface CountdownProps {
  from?: number;
  onDone: () => void;
}

export function Countdown({ from = 3, onDone }: CountdownProps) {
  const [n, setN] = useState(from);
  useEffect(() => {
    if (n <= 0) {
      const t = setTimeout(onDone, 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN((p) => p - 1), 800);
    return () => clearTimeout(t);
  }, [n, onDone]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center">
        <div
          key={n}
          className="text-9xl font-black text-white animate-in zoom-in-50 duration-300"
          style={{ textShadow: "0 0 60px rgba(255,255,255,0.4)" }}
        >
          {n > 0 ? n : "GO"}
        </div>
        <p className="text-white/70 text-sm mt-4 font-bold tracking-widest uppercase">
          {n > 0 ? "Chuẩn bị..." : "Bắt đầu nói!"}
        </p>
      </div>
    </div>
  );
}

interface Part2TimerProps {
  seconds: number;
  max: number;
  warnAt: number;
}

export function Part2Timer({ seconds, max, warnAt }: Part2TimerProps) {
  const remaining = Math.max(0, max - seconds);
  const isWarn = remaining <= warnAt && remaining > 0;
  const isOver = seconds >= max;

  const color = isOver
    ? "text-red-700 bg-red-100 border-red-300 animate-pulse"
    : isWarn
    ? "text-amber-700 bg-amber-100 border-amber-300"
    : "text-emerald-700 bg-emerald-50 border-emerald-200";

  const label = isOver
    ? "Quá thời gian! Nên kết thúc."
    : isWarn
    ? `Còn ${remaining}s - chuẩn bị kết bài`
    : `Đang nói...`;

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-2 text-sm font-mono font-black px-4 py-2 rounded-xl border ${color}`}
    >
      <span className="material-symbols-outlined text-[18px]">timer</span>
      {formatTime(seconds)} / {formatTime(max)}
      <span className="text-[10px] font-bold ml-2 opacity-80">{label}</span>
    </div>
  );
}
