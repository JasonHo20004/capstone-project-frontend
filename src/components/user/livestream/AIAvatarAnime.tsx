import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AIAvatarAnimeProps {
  isSpeaking: boolean;
  isThinking?: boolean;
  className?: string;
  name?: string;
}

// Mouth open heights — cycles through these when speaking
const MOUTH_SEQ = [0, 1, 3, 6, 9, 11, 9, 6, 4, 8, 10, 7, 3, 1];

// Sparkle positions [left, top, delay, size-px]
const SPARKLES: [string, string, string, number][] = [
  ['12%', '16%', '0s',    4],
  ['83%', '11%', '0.7s',  3],
  ['7%',  '71%', '1.4s',  5],
  ['89%', '67%', '0.3s',  3],
  ['47%', '7%',  '1.1s',  4],
  ['21%', '87%', '1.8s',  3],
  ['79%', '81%', '0.5s',  5],
  ['93%', '37%', '2.2s',  3],
  ['4%',  '44%', '0.9s',  4],
  ['94%', '52%', '1.6s',  3],
];

// ── Shared eye shape ─────────────────────────────────────────────────────────

function AnimeEye({ cx, cy, eyeScale }: { cx: number; cy: number; eyeScale: number }) {
  // Blink: squish vertically from the top of the eye
  const pivotY = cy - 12;
  return (
    <g transform={`translate(${cx},${pivotY}) scale(1,${eyeScale}) translate(${-cx},${-pivotY})`}>
      <ellipse cx={cx} cy={cy} rx={14} ry={12} fill="white" />
      <circle  cx={cx} cy={cy + 2} r={9}   fill="url(#av-iris)" />
      <circle  cx={cx} cy={cy + 2} r={5}   fill="#060314" />
      <circle  cx={cx} cy={cy - 1} r={2.5} fill="#1e40af" opacity={0.45} />
      {/* Shine */}
      <circle cx={cx - 5} cy={cy - 3} r={3}   fill="white" opacity={0.95} />
      <circle cx={cx + 4} cy={cy + 5} r={1.5} fill="white" opacity={0.65} />
      {/* Outline on top to mask overflow */}
      <ellipse cx={cx} cy={cy} rx={14} ry={12} fill="none" stroke="#120020" strokeWidth={2} />
      {/* Upper lid / lash fill */}
      <path d={`M ${cx-14} ${cy-6} Q ${cx} ${cy-15} ${cx+14} ${cy-6}`} fill="#120020" />
      {/* Outer lash tips */}
      <line x1={cx-13} y1={cy-5} x2={cx-16} y2={cy-9} stroke="#120020" strokeWidth={1.4} strokeLinecap="round" />
      <line x1={cx+13} y1={cy-5} x2={cx+16} y2={cy-9} stroke="#120020" strokeWidth={1.4} strokeLinecap="round" />
    </g>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function AIAvatarAnime({
  isSpeaking,
  isThinking = false,
  className,
  name = 'AI Sensei',
}: AIAvatarAnimeProps) {
  const [mouthH,   setMouthH]   = useState(0);
  const [eyeScale, setEyeScale] = useState(1);
  const [floatY,   setFloatY]   = useState(0);
  const [thinkDot, setThinkDot] = useState(0);

  const animRef    = useRef<number>(0);
  const blinkRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speakRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const thinkRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const mouthIdx   = useRef(0);

  // Idle float
  useEffect(() => {
    const loop = (t: number) => { setFloatY(Math.sin(t / 950) * 7); animRef.current = requestAnimationFrame(loop); };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Blink
  useEffect(() => {
    const schedule = () => {
      blinkRef.current = setTimeout(() => {
        setEyeScale(0);
        setTimeout(() => { setEyeScale(1); schedule(); }, 140);
      }, 2600 + Math.random() * 3400);
    };
    schedule();
    return () => { if (blinkRef.current) clearTimeout(blinkRef.current); };
  }, []);

  // Speak mouth
  useEffect(() => {
    if (isSpeaking) {
      speakRef.current = setInterval(() => {
        mouthIdx.current = (mouthIdx.current + 1) % MOUTH_SEQ.length;
        setMouthH(MOUTH_SEQ[mouthIdx.current]);
      }, 85);
    } else {
      if (speakRef.current) clearInterval(speakRef.current);
      setMouthH(0);
    }
    return () => { if (speakRef.current) clearInterval(speakRef.current); };
  }, [isSpeaking]);

  // Thinking dots
  useEffect(() => {
    if (isThinking) {
      thinkRef.current = setInterval(() => setThinkDot(d => (d + 1) % 4), 400);
    } else {
      if (thinkRef.current) clearInterval(thinkRef.current);
      setThinkDot(0);
    }
    return () => { if (thinkRef.current) clearInterval(thinkRef.current); };
  }, [isThinking]);

  const accent = isThinking ? '#a855f7' : isSpeaking ? '#818cf8' : '#7c3aed';
  const glow   = isSpeaking
    ? `drop-shadow(0 0 12px ${accent}) drop-shadow(0 0 26px ${accent}88)`
    : `drop-shadow(0 0 7px ${accent}99)`;

  return (
    <div
      className={cn('relative flex flex-col items-center justify-end overflow-hidden rounded-2xl select-none', className)}
      style={{ background: 'radial-gradient(ellipse at 50% 35%, #1a0a3e 0%, #07030f 100%)' }}
    >
      {/* ── Sparkle particles ── */}
      {SPARKLES.map(([l, t, d, s], i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{ left: l, top: t, width: s, height: s, background: 'white', borderRadius: '1px', animation: `avtr-sparkle 2.8s ease-in-out ${d} infinite`, opacity: 0 }}
        />
      ))}

      {/* ── SVG character ── */}
      <svg
        viewBox="0 0 200 258"
        className="w-full"
        style={{ transform: `translateY(${floatY}px)`, filter: glow, maxHeight: '84%' }}
      >
        <defs>
          <radialGradient id="av-skin" cx="38%" cy="32%" r="68%">
            <stop offset="0%"   stopColor="#fff0df" />
            <stop offset="100%" stopColor="#f8c490" />
          </radialGradient>
          <linearGradient id="av-hair" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%"   stopColor="#9333ea" />
            <stop offset="100%" stopColor="#4c1d95" />
          </linearGradient>
          <radialGradient id="av-iris" cx="33%" cy="28%" r="72%">
            <stop offset="0%"   stopColor="#67e8f9" />
            <stop offset="45%"  stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </radialGradient>
          <radialGradient id="av-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={accent} stopOpacity="0.22" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
          <filter id="av-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.8" />
          </filter>
        </defs>

        {/* Ambient glow behind character */}
        <ellipse cx="100" cy="128" rx="82" ry="92" fill="url(#av-glow)" />

        {/* ═══ BACK HAIR ═══ */}
        <path
          d="M 38 92 Q 30 52 52 26 Q 72 4 100 1 Q 128 4 148 26 Q 170 52 162 92
             Q 157 128 154 158 Q 148 192 142 228 L 138 258 L 130 246
             Q 120 224 112 207 Q 106 220 100 236 Q 94 220 88 207
             Q 80 224 70 246 L 62 258 L 58 228 Q 52 192 46 158 Q 43 128 38 92 Z"
          fill="url(#av-hair)"
        />
        <path d="M 74 12 Q 70 38 73 66 Q 75 84 76 94" stroke="#c084fc" strokeWidth="2.8" fill="none" strokeLinecap="round" opacity="0.55" />
        <path d="M 91  5 Q 89 28 91 54 Q 92 70 93 80" stroke="#ddd6fe" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.4" />

        {/* ═══ FACE ═══ */}
        <ellipse cx="100" cy="120" rx="58" ry="65" fill="url(#av-skin)" />

        {/* Ears */}
        <ellipse cx="42"  cy="116" rx="8" ry="10" fill="url(#av-skin)" />
        <ellipse cx="158" cy="116" rx="8" ry="10" fill="url(#av-skin)" />
        <ellipse cx="42"  cy="116" rx="5" ry="7"  fill="#e8935a" opacity="0.28" />
        <ellipse cx="158" cy="116" rx="5" ry="7"  fill="#e8935a" opacity="0.28" />

        {/* ═══ EYES ═══ */}
        <AnimeEye cx={72}  cy={106} eyeScale={eyeScale} />
        <AnimeEye cx={128} cy={106} eyeScale={eyeScale} />

        {/* Eyebrows */}
        <path d="M 57  88 Q 71  83 87  86" stroke="#5b21b6" strokeWidth="2.8" fill="none" strokeLinecap="round" />
        <path d="M 113 86 Q 129 83 143 88" stroke="#5b21b6" strokeWidth="2.8" fill="none" strokeLinecap="round" />

        {/* ═══ NOSE ═══ */}
        <path d="M 96 128 Q 100 133 104 128" stroke="#d09060" strokeWidth="1.2" fill="none" strokeLinecap="round" />

        {/* ═══ BLUSH ═══ */}
        <ellipse cx="59"  cy="124" rx="13" ry="7" fill="#fb7185" opacity="0.22" filter="url(#av-soft)" />
        <ellipse cx="141" cy="124" rx="13" ry="7" fill="#fb7185" opacity="0.22" filter="url(#av-soft)" />

        {/* ═══ MOUTH ═══ */}
        <ellipse cx="100" cy="143" rx="12" ry={Math.max(1.5, mouthH + 1.5)} fill="#7b1040" />
        {mouthH > 4 && (
          <ellipse cx="100" cy="141" rx="10" ry={Math.min(3.5, mouthH / 2.8)} fill="#f8fafc" />
        )}
        {/* Upper lip */}
        <path d="M 88 140 C 93 135 107 135 112 140" stroke="#c06080" strokeWidth="1.9" fill="none" strokeLinecap="round" />
        {/* Lower lip — moves down with mouthH */}
        <path
          d={`M 88 140 C 91 ${144 + mouthH} 109 ${144 + mouthH} 112 140`}
          stroke="#d07090" strokeWidth="1.9" fill="none" strokeLinecap="round"
        />

        {/* ═══ FRONT HAIR / BANGS ═══ */}
        <path d="M 40 88 Q 43 62 58 52 Q 46 70 49 91 Z"      fill="#7c3aed" />
        <path d="M 51 54 Q 64 37 79 47 Q 66 63 68 83 Z"      fill="#8b5cf6" />
        <path d="M 78 43 Q 91 32 100 40 Q 92 57 92 76 Z"     fill="#7c3aed" />
        <path d="M 100 40 Q 109 32 122 44 Q 112 58 112 74 Z"  fill="#8b5cf6" />
        <path d="M 122 46 Q 137 37 148 54 Q 133 62 130 80 Z"  fill="#7c3aed" />
        <path d="M 150 59 Q 157 72 155 89 Q 145 68 140 76 Z"  fill="#8b5cf6" />
        <path d="M 82 46 Q 80 61 82 77"  stroke="#c4b5fd" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.42" />
        <path d="M 103 42 Q 102 57 103 72" stroke="#ddd6fe" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.35" />

        {/* ═══ HAIR ORNAMENT ═══ */}
        <g transform="translate(152,70)">
          <circle r="9"   fill="#f472b6" />
          <circle r="5.5" fill="#fb7185" />
          <circle cx="-2.5" cy="-2.5" r="2.5" fill="white" opacity="0.65" />
          {[0,45,90,135,180,225,270,315].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={0} y1={0}
                x2={Math.cos(rad) * 13} y2={Math.sin(rad) * 13}
                stroke="#f9a8d4"
                strokeWidth={i % 2 === 0 ? 1.5 : 0.8}
                strokeLinecap="round"
              />
            );
          })}
        </g>

        {/* ═══ NECK + CLOTHING ═══ */}
        <rect x="88" y="183" width="24" height="21" rx="5" fill="url(#av-skin)" />
        <path d="M 38 214 Q 74 204 88 209 L 100 234 L 112 209 Q 126 204 162 214 L 170 258 L 30 258 Z" fill="#4338ca" />
        <path d="M 88 209 L 100 234 L 112 209" stroke="white" strokeWidth="2.8" fill="none" strokeLinejoin="round" />
        <line x1="100" y1="234" x2="100" y2="258" stroke="#818cf8" strokeWidth="1.5" opacity="0.4" />

        {/* ═══ THINKING DOTS ═══ */}
        {isThinking && [0,1,2].map(i => (
          <circle
            key={i}
            cx={77 + i * 13} cy={162} r={3.5}
            fill="#a78bfa"
            opacity={i < thinkDot ? 0.9 : 0.22}
          />
        ))}
      </svg>

      {/* ── Name badge ── */}
      <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center gap-1 pointer-events-none">
        <span
          className="text-xs font-bold px-3 py-0.5 rounded-full"
          style={{
            background: 'rgba(67,56,202,0.75)',
            color: 'white',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(167,139,250,0.45)',
          }}
        >
          {name}
        </span>

        {/* Speaking audio bars */}
        {isSpeaking && (
          <div className="flex items-end gap-0.5" style={{ height: 14 }}>
            {[0.1, 0.25, 0, 0.25, 0.1].map((delay, i) => (
              <div
                key={i}
                style={{
                  width: 3, minHeight: 4, background: '#a78bfa', borderRadius: 2,
                  animation: `avtr-bar 0.55s ease-in-out ${delay}s infinite alternate`,
                }}
              />
            ))}
          </div>
        )}

        {isThinking && !isSpeaking && (
          <span className="text-xs text-violet-300 opacity-60">Đang suy nghĩ...</span>
        )}
      </div>

      {/* CSS keyframes */}
      <style>{`
        @keyframes avtr-sparkle {
          0%,100%{ opacity:0; transform:rotate(45deg) scale(.2); }
          50%    { opacity:.7; transform:rotate(45deg) scale(1); }
        }
        @keyframes avtr-bar {
          from{ height:4px; }
          to  { height:13px; }
        }
      `}</style>
    </div>
  );
}
