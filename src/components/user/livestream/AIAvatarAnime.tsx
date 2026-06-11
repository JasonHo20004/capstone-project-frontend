import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AIAvatarAnimeProps {
  isSpeaking: boolean;
  isThinking?: boolean;
  className?: string;
  name?: string;
  audioVolume?: number;
}

export function AIAvatarAnime({
  isSpeaking,
  isThinking = false,
  className,
  name = 'AI Sensei',
  audioVolume = 0,
}: AIAvatarAnimeProps) {
  const [pulse, setPulse] = useState(1);

  // Dynamic pulsing effect based on speaking state and audio volume
  useEffect(() => {
    if (isSpeaking) {
      // If we have real audio volume, use it to scale the orb (1.0 to ~1.4)
      if (audioVolume > 0) {
        setPulse(1 + audioVolume * 0.4);
      } else {
        // Fallback: slight random pulsing if no audio data
        const interval = setInterval(() => {
          setPulse(1 + Math.random() * 0.15);
        }, 100);
        return () => clearInterval(interval);
      }
    } else {
      setPulse(1);
    }
  }, [isSpeaking, audioVolume]);

  const stateClass = isSpeaking 
    ? "speaking" 
    : isThinking 
      ? "thinking" 
      : "idle";

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden rounded-2xl select-none bg-zinc-950',
        className
      )}
    >
      {/* Background subtle glow */}
      <div 
        className={cn("absolute inset-0 transition-opacity duration-700 opacity-20", isSpeaking ? "bg-fuchsia-900/40" : isThinking ? "bg-blue-900/40" : "bg-indigo-900/40")}
        style={{ filter: 'blur(40px)' }}
      />

      <div 
        className="orb-container relative w-48 h-48 flex items-center justify-center"
        style={{ transform: `scale(${pulse})`, transition: 'transform 0.1s ease-out' }}
      >
        <div className={cn("orb-layer layer-1", stateClass)}></div>
        <div className={cn("orb-layer layer-2", stateClass)}></div>
        <div className={cn("orb-layer layer-3", stateClass)}></div>
        <div className={cn("orb-layer layer-core", stateClass)}></div>

        {/* Mouth / Waveform */}
        {isSpeaking && (
          <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-90 z-10 drop-shadow-md">
            <div className="w-1.5 bg-white rounded-full transition-all duration-75" style={{ height: `${12 + audioVolume * 40}px` }} />
            <div className="w-1.5 bg-white rounded-full transition-all duration-75" style={{ height: `${16 + audioVolume * 60}px` }} />
            <div className="w-1.5 bg-white rounded-full transition-all duration-75" style={{ height: `${20 + audioVolume * 80}px` }} />
            <div className="w-1.5 bg-white rounded-full transition-all duration-75" style={{ height: `${16 + audioVolume * 60}px` }} />
            <div className="w-1.5 bg-white rounded-full transition-all duration-75" style={{ height: `${12 + audioVolume * 40}px` }} />
          </div>
        )}
      </div>

      {/* ── Name badge ── */}
      <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-1 pointer-events-none">
        <span
          className="text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg"
          style={{
            background: 'rgba(24, 24, 27, 0.7)',
            color: '#f4f4f5',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            letterSpacing: '0.05em'
          }}
        >
          {name}
        </span>

        {isThinking && !isSpeaking && (
          <span className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest font-bold animate-pulse">
            Processing
          </span>
        )}
      </div>

      <style>{`
        .orb-layer {
          position: absolute;
          border-radius: 50%;
          mix-blend-mode: screen;
          filter: blur(12px);
          transition: all 0.5s ease;
          animation: fluid-rotate 8s linear infinite;
        }

        .layer-1 {
          width: 60%;
          height: 60%;
          background: #4f46e5;
          animation-duration: 6s;
          animation-direction: reverse;
          border-radius: 45% 55% 40% 60% / 55% 45% 60% 40%;
        }

        .layer-2 {
          width: 70%;
          height: 70%;
          background: #9333ea;
          animation-duration: 9s;
          border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
        }

        .layer-3 {
          width: 55%;
          height: 55%;
          background: #06b6d4;
          animation-duration: 5s;
          border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
        }

        .layer-core {
          width: 35%;
          height: 35%;
          background: #ffffff;
          filter: blur(4px);
          animation: fluid-rotate 4s linear infinite;
        }

        /* States */
        .speaking.layer-1 { background: #ec4899; }
        .speaking.layer-2 { background: #8b5cf6; width: 85%; height: 85%; animation-duration: 4s; }
        .speaking.layer-3 { background: #f43f5e; width: 65%; height: 65%; animation-duration: 3s; }
        .speaking.layer-core { transform: scale(1.1); }

        .thinking.layer-1 { background: #0284c7; }
        .thinking.layer-2 { background: #3b82f6; width: 60%; height: 60%; animation-duration: 6s; }
        .thinking.layer-3 { background: #0ea5e9; width: 50%; height: 50%; filter: blur(16px); }

        .idle.layer-1 { background: #4f46e5; opacity: 0.6; }
        .idle.layer-2 { background: #7c3aed; opacity: 0.6; width: 65%; height: 65%; }
        .idle.layer-3 { background: #3b82f6; opacity: 0.5; width: 50%; height: 50%; }
        .idle.layer-core { opacity: 0.7; width: 25%; height: 25%; }

        @keyframes fluid-rotate {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.05); }
          100% { transform: rotate(360deg) scale(1); }
        }
      `}</style>
    </div>
  );
}
