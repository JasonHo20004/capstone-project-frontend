import { useRef, useMemo, useEffect, Suspense, Component, type ReactNode, type ErrorInfo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { AIAvatarAnime } from './AIAvatarAnime';

class ThreeErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { errored: boolean }> {
  state = { errored: false };
  static getDerivedStateFromError() { return { errored: true }; }
  componentDidCatch(err: Error, info: ErrorInfo) { console.error('[AIAvatar3D]', err, info); }
  render() { return this.state.errored ? this.props.fallback : this.props.children; }
}

interface AIAvatar3DProps {
  isSpeaking: boolean;
  isThinking?: boolean;
  className?: string;
  /** Shown on the badge below the character (mirror of AIAvatarAnime). */
  name?: string;
  /** Live TTS amplitude 0..1 from the Web Audio analyser — drives the beak
   *  and aura. Falls back to a sine-wave chatter when absent (e.g. replay). */
  audioVolume?: number;
  accentColor?: string;
}

interface CharacterProps {
  isSpeaking: boolean;
  isThinking: boolean;
  accentColor: string;
  audioVolume: number;
}

// Penguin palette — matches the brand mascot in PenguinHero3D.
const NAVY = '#0b1e3b';
const NAVY_HI = '#16315c';
const BELLY = '#f3f7ff';
const ORANGE = '#fe9400';
const ORANGE_HI = '#ffb874';
const CAP = '#0058bc';

// ─── Penguin "PenguinTeacher" ─────────────────────────────────────────────────────
// The brand penguin, wired to react to the live TTS like the old hologram did:
// the beak opens with the voice amplitude, the wings flap faster while speaking,
// an aura behind the body breathes with the audio, and it tilts/wobbles while
// thinking. Geometry mirrors PenguinHero3D so the two stay on-brand.

function PenguinCharacter({ isSpeaking, isThinking, accentColor, audioVolume }: CharacterProps) {
  const root = useRef<THREE.Group>(null);   // idle bob + breathe
  const tilt = useRef<THREE.Group>(null);   // mouse-follow gaze + thinking wobble
  const leftWing = useRef<THREE.Group>(null);
  const rightWing = useRef<THREE.Group>(null);
  const leftEye = useRef<THREE.Mesh>(null);
  const rightEye = useRef<THREE.Mesh>(null);
  const lowerBeak = useRef<THREE.Group>(null); // hinges open to "talk"
  const aura = useRef<THREE.Mesh>(null);
  const sheen = useRef<THREE.Mesh>(null);
  const tassel = useRef<THREE.Mesh>(null);

  const { mouse } = useThree();
  const accent = useMemo(() => new THREE.Color(accentColor), [accentColor]);

  const blink = useRef({ next: 0, closing: 0 });
  useEffect(() => {
    blink.current.next = performance.now() + 2200 + Math.random() * 2600;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Idle bob + gentle breathing
    if (root.current) {
      root.current.position.y = -0.15 + Math.sin(t * 1.4) * 0.07;
      const breathe = 1 + Math.sin(t * 1.4) * 0.012;
      root.current.scale.set(breathe, 2 - breathe, breathe);
    }

    // Gaze toward cursor + thinking wobble
    if (tilt.current) {
      const ty = mouse.x * 0.5;
      const tx = -mouse.y * 0.28;
      tilt.current.rotation.y += (ty - tilt.current.rotation.y) * 0.06;
      tilt.current.rotation.x += (tx - tilt.current.rotation.x) * 0.06;
      const targetZ = isThinking ? Math.sin(t * 1.5) * 0.12 : 0;
      tilt.current.rotation.z += (targetZ - tilt.current.rotation.z) * 0.08;
    }

    // Wing flap — faster + wider while speaking
    const flapSpeed = isSpeaking ? 5 : 2.4;
    const flapAmt = isSpeaking ? 0.4 : 0.22;
    const flap = Math.sin(t * flapSpeed) * flapAmt;
    if (leftWing.current) leftWing.current.rotation.z = 0.5 + flap;
    if (rightWing.current) rightWing.current.rotation.z = -0.5 - flap;
    if (tassel.current) tassel.current.position.x = 0.62 + Math.sin(t * 2) * 0.04;

    // Beak "talking" — driven by real audio amplitude when present, else a
    // layered sine chatter (replay / muted). 0 = closed, ~0.6 rad = wide open.
    if (lowerBeak.current) {
      let target = 0;
      if (isSpeaking) {
        if (audioVolume > 0.01) {
          target = Math.max(0.08, Math.min(0.6, 0.12 + audioVolume * 0.9));
        } else {
          const v = 0.28 + 0.18 * Math.sin(t * 14) + 0.1 * Math.sin(t * 23 + 1.1);
          target = Math.max(0.08, Math.min(0.6, v));
        }
      } else if (isThinking) {
        target = 0.05 + Math.abs(Math.sin(t * 2)) * 0.04;
      }
      lowerBeak.current.rotation.x += (target - lowerBeak.current.rotation.x) * 0.45;
    }

    // Aura behind the body — breathes with the voice
    if (aura.current) {
      const pulse = isSpeaking ? 0.1 : 0.04;
      const speed = isSpeaking ? 6 : 2;
      aura.current.scale.setScalar(1.5 + Math.sin(t * speed) * pulse + audioVolume * 0.18);
      const mat = aura.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isSpeaking ? 0.9 + audioVolume * 1.2 + Math.sin(t * speed) * 0.25 : 0.45;
    }

    // Body sheen brightens slightly while speaking/thinking
    if (sheen.current) {
      const mat = sheen.current.material as THREE.MeshStandardMaterial;
      const target = isSpeaking ? 0.45 + audioVolume * 0.4 : isThinking ? 0.3 : 0.14;
      mat.emissiveIntensity += (target - mat.emissiveIntensity) * 0.1;
    }

    // Blink
    const now = performance.now();
    const b = blink.current;
    if (now > b.next && b.closing === 0) b.closing = now;
    if (b.closing > 0) {
      const e = now - b.closing;
      const s = e < 70 ? Math.max(0.08, 1 - e / 70) : Math.min(1, (e - 70) / 70);
      if (leftEye.current) leftEye.current.scale.y = s;
      if (rightEye.current) rightEye.current.scale.y = s;
      if (e > 150) {
        b.closing = 0;
        b.next = now + 2600 + Math.random() * 3200;
      }
    }
  });

  return (
    <group ref={root}>
      {/* Aura glow behind the penguin */}
      <mesh ref={aura} position={[0, 0.1, -0.6]}>
        <sphereGeometry args={[1.3, 32, 32]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.45} transparent opacity={0.16} depthWrite={false} />
      </mesh>

      <group ref={tilt}>
        {/* Body — egg-shaped navy */}
        <mesh scale={[1, 1.22, 0.92]}>
          <sphereGeometry args={[1, 48, 48]} />
          <meshStandardMaterial color={NAVY} roughness={0.45} metalness={0.15} />
        </mesh>

        {/* Blue sheen on the body — also the speaking/thinking glow */}
        <mesh ref={sheen} scale={[1.004, 1.224, 0.924]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color={NAVY_HI} emissive={accent} emissiveIntensity={0.14} transparent opacity={0.28} depthWrite={false} />
        </mesh>

        {/* White belly */}
        <mesh position={[0, -0.12, 0.46]} scale={[0.78, 0.96, 0.55]}>
          <sphereGeometry args={[1, 40, 40]} />
          <meshStandardMaterial color={BELLY} roughness={0.6} metalness={0.05} />
        </mesh>

        {/* Eyes (white) */}
        <mesh ref={leftEye} position={[-0.3, 0.46, 0.78]}>
          <sphereGeometry args={[0.17, 28, 28]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        <mesh ref={rightEye} position={[0.3, 0.46, 0.78]}>
          <sphereGeometry args={[0.17, 28, 28]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        {/* Pupils */}
        <mesh position={[-0.28, 0.45, 0.93]}>
          <sphereGeometry args={[0.085, 20, 20]} />
          <meshStandardMaterial color="#0a1222" roughness={0.2} />
        </mesh>
        <mesh position={[0.32, 0.45, 0.93]}>
          <sphereGeometry args={[0.085, 20, 20]} />
          <meshStandardMaterial color="#0a1222" roughness={0.2} />
        </mesh>
        {/* Eye catch-lights */}
        <mesh position={[-0.25, 0.5, 0.99]}>
          <sphereGeometry args={[0.03, 10, 10]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <mesh position={[0.35, 0.5, 0.99]}>
          <sphereGeometry args={[0.03, 10, 10]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>

        {/* Beak — upper (fixed) + lower (hinges open to talk) */}
        <mesh position={[0, 0.26, 0.92]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.17, 0.34, 24]} />
          <meshStandardMaterial color={ORANGE} emissive={ORANGE} emissiveIntensity={0.12} roughness={0.5} />
        </mesh>
        <group ref={lowerBeak} position={[0, 0.2, 0.86]}>
          <mesh position={[0, -0.02, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.15, 0.3, 24]} />
            <meshStandardMaterial color={ORANGE_HI} emissive={ORANGE} emissiveIntensity={0.1} roughness={0.55} />
          </mesh>
        </group>

        {/* Wings — flattened navy paddles that flap */}
        <group ref={leftWing} position={[-0.92, 0.12, 0]} rotation={[0, 0, 0.5]}>
          <mesh position={[-0.18, -0.35, 0]} scale={[0.26, 0.78, 0.5]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshStandardMaterial color={NAVY} roughness={0.5} metalness={0.15} />
          </mesh>
        </group>
        <group ref={rightWing} position={[0.92, 0.12, 0]} rotation={[0, 0, -0.5]}>
          <mesh position={[0.18, -0.35, 0]} scale={[0.26, 0.78, 0.5]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshStandardMaterial color={NAVY} roughness={0.5} metalness={0.15} />
          </mesh>
        </group>

        {/* Feet — orange */}
        <mesh position={[-0.34, -1.18, 0.36]} rotation={[0.3, 0, 0]} scale={[0.34, 0.16, 0.5]}>
          <sphereGeometry args={[1, 20, 20]} />
          <meshStandardMaterial color={ORANGE} roughness={0.6} />
        </mesh>
        <mesh position={[0.34, -1.18, 0.36]} rotation={[0.3, 0, 0]} scale={[0.34, 0.16, 0.5]}>
          <sphereGeometry args={[1, 20, 20]} />
          <meshStandardMaterial color={ORANGE} roughness={0.6} />
        </mesh>

        {/* Graduation cap — ties the mascot to learning */}
        <group position={[0, 1.16, 0.02]}>
          <mesh position={[0, -0.04, 0]} scale={[0.5, 0.18, 0.5]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshStandardMaterial color={CAP} roughness={0.4} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.08, 0]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[0.92, 0.06, 0.92]} />
            <meshStandardMaterial color={CAP} emissive={CAP} emissiveIntensity={0.15} roughness={0.35} metalness={0.25} />
          </mesh>
          <mesh position={[0, 0.13, 0]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial color={ORANGE_HI} emissive={ORANGE} emissiveIntensity={0.4} toneMapped={false} />
          </mesh>
          <mesh ref={tassel} position={[0.62, 0.02, 0]}>
            <sphereGeometry args={[0.07, 14, 14]} />
            <meshStandardMaterial color={ORANGE} emissive={ORANGE} emissiveIntensity={0.5} toneMapped={false} />
          </mesh>
        </group>
      </group>

      {/* Thinking dots above the cap. Kept low enough that the dots' bob never
          pokes past the top of the canvas (~y 1.82 at this camera) — at y=1.7
          the peak of the bounce was clipped by the top edge / rounded corner. */}
      {isThinking && (
        <group position={[0.55, 1.35, 0]}>
          <ThinkingDot offset={0} x={0} />
          <ThinkingDot offset={0.35} x={0.25} />
          <ThinkingDot offset={0.7} x={0.5} />
        </group>
      )}
    </group>
  );
}

function ThinkingDot({ offset, x }: { offset: number; x: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + offset;
    ref.current.position.y = 0.1 + Math.abs(Math.sin(t * 3)) * 0.18;
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 1.4 + Math.sin(t * 3) * 0.6;
  });
  return (
    <mesh ref={ref} position={[x, 0, 0]}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial color="#9be7ff" emissive="#5cd2ff" emissiveIntensity={1.5} toneMapped={false} />
    </mesh>
  );
}

// ─── Particle field ──────────────────────────────────────────────────────────

function ParticleField({ count = 80, accentColor }: { count?: number; accentColor: string }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2 + Math.random() * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI - Math.PI / 2;
      positions[i * 3] = r * Math.cos(theta) * Math.cos(phi);
      positions[i * 3 + 1] = r * Math.sin(phi);
      positions[i * 3 + 2] = r * Math.sin(theta) * Math.cos(phi);
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.06;
    ref.current.rotation.x += delta * 0.02;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color={accentColor} size={0.04} transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ─── Scene ───────────────────────────────────────────────────────────────────

function Scene({ isSpeaking, isThinking, accentColor, audioVolume }: CharacterProps) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={1.4} color="#ffffff" />
      <pointLight position={[-4, 1, 3]} intensity={1.2} color={accentColor} />
      <pointLight position={[3, -2, 4]} intensity={0.9} color={ORANGE} />
      <PenguinCharacter isSpeaking={isSpeaking} isThinking={isThinking} accentColor={accentColor} audioVolume={audioVolume} />
      <ParticleField accentColor={accentColor} />
    </>
  );
}

// ─── Public component ────────────────────────────────────────────────────────

export function AIAvatar3D({
  isSpeaking,
  isThinking = false,
  className,
  name = 'PenguinTeacher',
  audioVolume = 0,
  accentColor = '#7dd3fc',
}: AIAvatar3DProps) {
  // prefers-reduced-motion → serve the calmer 2D penguin instead of a constantly
  // animating WebGL scene. Also the fallback when WebGL fails (boundary below).
  const reduceMotion = useMemo(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    [],
  );
  const fallback = (
    <AIAvatarAnime
      isSpeaking={isSpeaking}
      isThinking={isThinking}
      audioVolume={audioVolume}
      className={className}
      name={name}
    />
  );
  if (reduceMotion) return fallback;

  return (
    <ThreeErrorBoundary fallback={fallback}>
      {/* Same dark card + ambient glow as the 2D penguin so the two variants are
          visually interchangeable (Suspense/error swaps don't "jump"). */}
      <div
        className={cn(
          'relative flex flex-col items-center justify-center overflow-hidden rounded-2xl select-none bg-zinc-950',
          className,
        )}
        aria-label={name || 'AI teacher'}
        role="img"
      >
        <div
          className={cn(
            'absolute inset-0 transition-opacity duration-700 opacity-20',
            isSpeaking ? 'bg-fuchsia-900/40' : isThinking ? 'bg-blue-900/40' : 'bg-indigo-900/40',
          )}
          style={{ filter: 'blur(40px)' }}
        />

        <Canvas
          camera={{ position: [0, 0, 5], fov: 40 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <Scene
              isSpeaking={isSpeaking}
              isThinking={isThinking}
              accentColor={accentColor}
              audioVolume={audioVolume}
            />
          </Suspense>
        </Canvas>

        {/* Name badge — mirror of AIAvatarAnime's */}
        {name && (
          <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-1 pointer-events-none">
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
          </div>
        )}
      </div>
    </ThreeErrorBoundary>
  );
}

// Default export so pages can React.lazy() this component and keep three.js
// out of their main chunk (same convention as PenguinHero3D).
export default AIAvatar3D;
