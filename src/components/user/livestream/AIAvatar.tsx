import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AIAvatarProps {
  isSpeaking: boolean;
  isThinking?: boolean;
  className?: string;
}

export function AIAvatar({ isSpeaking, isThinking = false, className }: AIAvatarProps) {
  const eyeLeftRef = useRef<SVGEllipseElement | null>(null);
  const eyeRightRef = useRef<SVGEllipseElement | null>(null);

  // Random blink every 3–6 seconds
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        [eyeLeftRef.current, eyeRightRef.current].forEach((el) => {
          if (!el) return;
          el.style.transform = 'scaleY(0.1)';
          setTimeout(() => { if (el) el.style.transform = 'scaleY(1)'; }, 110);
        });
        schedule();
      }, 3000 + Math.random() * 3000);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Glow ring when speaking */}
      <div
        className={cn(
          'absolute inset-0 rounded-full transition-all duration-500',
          isSpeaking ? 'bg-indigo-400/25 blur-2xl scale-110 animate-pulse' : 'bg-transparent',
        )}
      />

      <svg viewBox="0 0 160 165" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
        <defs>
          <radialGradient id="av-head" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#6d28d9" />
          </radialGradient>
          <radialGradient id="av-face" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ede9fe" />
            <stop offset="100%" stopColor="#ddd6fe" />
          </radialGradient>
          <filter id="av-shadow">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#4c1d95" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Head */}
        <circle cx="80" cy="82" r="62" fill="url(#av-head)" filter="url(#av-shadow)" />

        {/* Graduation cap */}
        <polygon points="80,18 118,34 80,44 42,34" fill="#4338ca" />
        <rect x="44" y="32" width="72" height="7" rx="2" fill="#312e81" />
        <line x1="118" y1="34" x2="124" y2="53" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
        <circle cx="124" cy="56" r="3.5" fill="#fbbf24" />

        {/* Face plate */}
        <ellipse cx="80" cy="90" rx="44" ry="40" fill="url(#av-face)" />

        {/* Left eye */}
        <ellipse
          ref={eyeLeftRef}
          cx="62" cy="80" rx="9" ry="11"
          fill="white"
          style={{ transformOrigin: '62px 80px', transition: 'transform 0.09s' }}
        />
        <circle cx="64" cy="82" r="6" fill="#3730a3" />
        <circle cx="66" cy="80" r="2.5" fill="white" />

        {/* Right eye */}
        <ellipse
          ref={eyeRightRef}
          cx="98" cy="80" rx="9" ry="11"
          fill="white"
          style={{ transformOrigin: '98px 80px', transition: 'transform 0.09s' }}
        />
        <circle cx="100" cy="82" r="6" fill="#3730a3" />
        <circle cx="102" cy="80" r="2.5" fill="white" />

        {/* Eyebrows */}
        <path
          d={isThinking ? 'M53 66 Q62 60 71 66' : 'M53 68 Q62 64 71 68'}
          stroke="#4338ca" strokeWidth="3" strokeLinecap="round" fill="none"
          style={{ transition: 'all 0.3s' }}
        />
        <path
          d={isThinking ? 'M89 66 Q98 60 107 66' : 'M89 68 Q98 64 107 68'}
          stroke="#4338ca" strokeWidth="3" strokeLinecap="round" fill="none"
          style={{ transition: 'all 0.3s' }}
        />

        {/* Mouth */}
        {isThinking ? (
          <>
            <circle cx="66" cy="112" r="4" fill="#6d28d9" className="animate-bounce" style={{ animationDelay: '0ms' }} />
            <circle cx="80" cy="112" r="4" fill="#6d28d9" className="animate-bounce" style={{ animationDelay: '150ms' }} />
            <circle cx="94" cy="112" r="4" fill="#6d28d9" className="animate-bounce" style={{ animationDelay: '300ms' }} />
          </>
        ) : isSpeaking ? (
          <g style={{ transformOrigin: '80px 111px', animation: 'av-mouth 0.35s ease-in-out infinite alternate' }}>
            <rect x="60" y="104" width="40" height="14" rx="7" fill="#312e81" />
            <ellipse cx="80" cy="104" rx="20" ry="5" fill="#6d28d9" />
            <ellipse cx="80" cy="117" rx="13" ry="4" fill="#f472b6" opacity="0.55" />
          </g>
        ) : (
          <path d="M62 108 Q80 120 98 108" stroke="#4338ca" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        )}

        {/* Cheek blush */}
        <ellipse cx="51" cy="97" rx="8" ry="5" fill="#f9a8d4" opacity="0.4" />
        <ellipse cx="109" cy="97" rx="8" ry="5" fill="#f9a8d4" opacity="0.4" />

        {/* Body */}
        <ellipse cx="80" cy="156" rx="40" ry="18" fill="#4338ca" />
        <rect x="72" y="140" width="16" height="20" fill="#6d28d9" rx="3" />
        <polygon points="72,140 80,152 88,140" fill="#312e81" />
      </svg>

      {/* Sound wave bars */}
      {isSpeaking && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-[3px]">
          {[6, 10, 14, 10, 6].map((h, i) => (
            <div
              key={i}
              className="w-1.5 bg-indigo-500 rounded-full"
              style={{
                height: `${h}px`,
                animation: `av-bar 0.7s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes av-mouth {
          from { transform: scaleY(0.25); }
          to   { transform: scaleY(1); }
        }
        @keyframes av-bar {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1.4); }
        }
      `}</style>
    </div>
  );
}
