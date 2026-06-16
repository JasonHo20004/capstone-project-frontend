import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AIAvatarAnimeProps {
  isSpeaking: boolean;
  isThinking?: boolean;
  className?: string;
  name?: string;
  audioVolume?: number;
}

/**
 * 2D penguin "PenguinTeacher" — the lightweight counterpart to the 3D AIAvatar3D.
 * Used as the small slide-corner PIP during a lesson and as the reduced-motion /
 * WebGL fallback for the 3D mascot, so it stays on-brand (a penguin) everywhere.
 *
 * The penguin is the 🐧 emoji drawn inside a viewBox'd SVG, which scales cleanly
 * to any container size (tiny PIP → large fallback). It bobs gently, pulses with
 * the live TTS amplitude, opens a little "speaking" waveform under the beak, and
 * tilts while thinking.
 */
export function AIAvatarAnime({
  isSpeaking,
  isThinking = false,
  className,
  name = 'PenguinTeacher',
  audioVolume = 0,
}: AIAvatarAnimeProps) {
  const [pulse, setPulse] = useState(1);

  // Pulse with real audio amplitude; gentle random pulse when speaking without
  // an analyser (replay); steady at rest.
  useEffect(() => {
    if (isSpeaking) {
      if (audioVolume > 0) {
        setPulse(1 + audioVolume * 0.18);
      } else {
        const interval = setInterval(() => setPulse(1 + Math.random() * 0.08), 100);
        return () => clearInterval(interval);
      }
    } else {
      setPulse(1);
    }
  }, [isSpeaking, audioVolume]);

  const stateClass = isSpeaking ? 'speaking' : isThinking ? 'thinking' : 'idle';

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden rounded-2xl select-none bg-zinc-950',
        className,
      )}
      aria-label={name || 'AI teacher'}
      role="img"
    >
      {/* Background glow — colour follows state, same as the 3D card */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-700 opacity-25',
          isSpeaking ? 'bg-fuchsia-900/40' : isThinking ? 'bg-blue-900/40' : 'bg-indigo-900/40',
        )}
        style={{ filter: 'blur(40px)' }}
      />

      {/* Soft aura ring behind the penguin, breathing with the voice */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="rounded-full"
          style={{
            width: '64%',
            height: '64%',
            background:
              'radial-gradient(circle, rgba(43,134,255,0.45) 0%, rgba(43,134,255,0.12) 55%, transparent 70%)',
            transform: `scale(${pulse})`,
            transition: 'transform 0.12s ease-out',
            filter: 'blur(6px)',
          }}
        />
      </div>

      {/* Penguin — emoji in a viewBox so it scales to any container size */}
      <div
        className="relative w-full h-full flex items-center justify-center"
        style={{ transform: `scale(${pulse})`, transition: 'transform 0.12s ease-out' }}
      >
        <svg
          viewBox="0 0 100 100"
          className={cn('penguin', stateClass)}
          style={{ width: '74%', height: '74%', overflow: 'visible' }}
          aria-hidden="true"
        >
          <text
            x="50"
            y="54"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="70"
            style={{ filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.45))' }}
          >
            🐧
          </text>
        </svg>

        {/* Speaking waveform — a little "voice" under the beak */}
        {isSpeaking && (
          <div className="absolute left-0 right-0 bottom-[18%] flex items-end justify-center gap-1 opacity-90 z-10 drop-shadow-md">
            <div className="w-1 bg-cyan-200 rounded-full transition-all duration-75" style={{ height: `${4 + audioVolume * 14}px` }} />
            <div className="w-1 bg-cyan-100 rounded-full transition-all duration-75" style={{ height: `${6 + audioVolume * 22}px` }} />
            <div className="w-1 bg-white rounded-full transition-all duration-75" style={{ height: `${8 + audioVolume * 30}px` }} />
            <div className="w-1 bg-cyan-100 rounded-full transition-all duration-75" style={{ height: `${6 + audioVolume * 22}px` }} />
            <div className="w-1 bg-cyan-200 rounded-full transition-all duration-75" style={{ height: `${4 + audioVolume * 14}px` }} />
          </div>
        )}
      </div>

      {/* Name badge + thinking status */}
      <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-1 pointer-events-none">
        {name && (
          <span
            className="text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg"
            style={{
              background: 'rgba(24, 24, 27, 0.7)',
              color: '#f4f4f5',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.08)',
              letterSpacing: '0.05em',
            }}
          >
            {name}
          </span>
        )}

        {isThinking && !isSpeaking && (
          <span className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest font-bold animate-pulse">
            Processing
          </span>
        )}
      </div>

      <style>{`
        .penguin {
          transform-origin: 50% 60%;
          animation: penguin-bob 3.2s ease-in-out infinite;
        }
        .penguin.speaking { animation-duration: 1.8s; }
        .penguin.thinking { animation: penguin-think 2.4s ease-in-out infinite; }

        @keyframes penguin-bob {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-3%) rotate(0deg); }
        }
        @keyframes penguin-think {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50%      { transform: translateY(-2%) rotate(4deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .penguin { animation: none; }
        }
      `}</style>
    </div>
  );
}
