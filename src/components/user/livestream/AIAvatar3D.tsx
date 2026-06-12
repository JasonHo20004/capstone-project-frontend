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
  /** Live TTS amplitude 0..1 from the Web Audio analyser — drives the mouth
   *  and halo. Falls back to a sine-wave mouth when absent (e.g. replay). */
  audioVolume?: number;
  accentColor?: string;
}

interface CharacterProps {
  isSpeaking: boolean;
  isThinking: boolean;
  accentColor: string;
  audioVolume: number;
}

// ─── Hologram Character ──────────────────────────────────────────────────────

function HoloCharacter({ isSpeaking, isThinking, accentColor, audioVolume }: CharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);

  const { mouse } = useThree();

  const accent = useMemo(() => new THREE.Color(accentColor), [accentColor]);
  const idleEmissive = useMemo(() => accent.clone().multiplyScalar(0.8), [accent]);
  const speakingEmissive = useMemo(() => accent.clone().multiplyScalar(1.6), [accent]);

  const blinkRef = useRef({ next: 0, closing: 0 });
  useEffect(() => {
    blinkRef.current.next = performance.now() + 2000 + Math.random() * 3000;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!groupRef.current) return;

    // Idle float
    groupRef.current.position.y = Math.sin(t * 1.2) * 0.06;

    // Mouse-follow gaze
    const targetY = mouse.x * 0.35;
    const targetX = -mouse.y * 0.2;
    groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.05;
    groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.05;

    // Thinking tilt
    if (isThinking) {
      groupRef.current.rotation.z = Math.sin(t * 1.5) * 0.1;
    } else {
      groupRef.current.rotation.z += (0 - groupRef.current.rotation.z) * 0.08;
    }

    // Halo pulse — real TTS amplitude makes it breathe with the voice
    if (haloRef.current) {
      const pulse = isSpeaking ? 0.12 : 0.04;
      const speed = isSpeaking ? 6 : 2;
      haloRef.current.scale.setScalar(1.35 + Math.sin(t * speed) * pulse + audioVolume * 0.15);
      const mat = haloRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isSpeaking
        ? 1.2 + audioVolume * 1.2 + Math.sin(t * speed) * 0.3
        : 0.6;
    }

    // Head emissive
    if (headRef.current) {
      const mat = headRef.current.material as THREE.MeshStandardMaterial;
      const target = isSpeaking ? 0.75 + audioVolume * 0.5 : isThinking ? 0.7 : 0.55;
      mat.emissiveIntensity += (target - mat.emissiveIntensity) * 0.1;
      mat.emissive.copy(isSpeaking ? speakingEmissive : idleEmissive);
    }

    // Mouth animation — driven by the real audio amplitude when the analyser
    // provides it (live room); otherwise a layered sine wave (replay, muted).
    if (mouthRef.current) {
      let target = 0.15;
      if (isSpeaking) {
        if (audioVolume > 0.01) {
          target = Math.max(0.2, Math.min(1.4, 0.25 + audioVolume * 1.6 + 0.08 * Math.sin(t * 18)));
        } else {
          const v = 0.55 + 0.35 * Math.sin(t * 14) + 0.25 * Math.sin(t * 23 + 1.3) + 0.15 * Math.sin(t * 9 + 0.7);
          target = Math.max(0.2, Math.min(1.4, v));
        }
      } else if (isThinking) {
        target = 0.2 + Math.abs(Math.sin(t * 2)) * 0.05;
      }
      mouthRef.current.scale.y += (target - mouthRef.current.scale.y) * 0.45;
    }

    // Blink
    const now = performance.now();
    const blink = blinkRef.current;
    if (now > blink.next && blink.closing === 0) blink.closing = now;
    if (blink.closing > 0) {
      const elapsed = now - blink.closing;
      const eyeScale = elapsed < 80 ? Math.max(0.1, 1 - elapsed / 80) : Math.min(1, (elapsed - 80) / 80);
      if (leftEyeRef.current) leftEyeRef.current.scale.y = eyeScale;
      if (rightEyeRef.current) rightEyeRef.current.scale.y = eyeScale;
      if (elapsed > 160) {
        blink.closing = 0;
        blink.next = now + 2500 + Math.random() * 3500;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Halo glow */}
      <mesh ref={haloRef} position={[0, 0, -0.4]}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} transparent opacity={0.18} depthWrite={false} />
      </mesh>

      {/* Head */}
      <mesh ref={headRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color="#0a0e2a" emissive={idleEmissive} emissiveIntensity={0.55} roughness={0.35} metalness={0.6} />
      </mesh>

      {/* Wireframe overlay */}
      <mesh>
        <sphereGeometry args={[1.005, 24, 24]} />
        <meshBasicMaterial color={accent} wireframe transparent opacity={0.22} />
      </mesh>

      {/* Left eye */}
      <mesh ref={leftEyeRef} position={[-0.32, 0.12, 0.86]}>
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshStandardMaterial color="#ffffff" emissive="#bdf6ff" emissiveIntensity={2.6} toneMapped={false} />
      </mesh>

      {/* Right eye */}
      <mesh ref={rightEyeRef} position={[0.32, 0.12, 0.86]}>
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshStandardMaterial color="#ffffff" emissive="#bdf6ff" emissiveIntensity={2.6} toneMapped={false} />
      </mesh>

      {/* Mouth — cylinder instead of capsule for wider compatibility */}
      <mesh ref={mouthRef} position={[0, -0.35, 0.88]} scale={[0.55, 0.15, 0.1]}>
        <cylinderGeometry args={[0.22, 0.22, 1, 16]} />
        <meshStandardMaterial color="#10182a" emissive={accent} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>

      {/* Thinking dots */}
      {isThinking && (
        <group position={[0.7, 1.1, 0]}>
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
      <ambientLight intensity={0.4} />
      <pointLight position={[3, 4, 4]} intensity={1.2} color={accentColor} />
      <pointLight position={[-3, -2, 3]} intensity={0.6} color="#ff5cd2" />
      <directionalLight position={[0, 5, 5]} intensity={0.5} />
      <HoloCharacter isSpeaking={isSpeaking} isThinking={isThinking} accentColor={accentColor} audioVolume={audioVolume} />
      <ParticleField accentColor={accentColor} />
    </>
  );
}

// ─── Public component ────────────────────────────────────────────────────────

export function AIAvatar3D({
  isSpeaking,
  isThinking = false,
  className,
  name = 'AI Sensei',
  audioVolume = 0,
  accentColor = '#7dd3fc',
}: AIAvatar3DProps) {
  // prefers-reduced-motion → serve the calmer 2D orb instead of a constantly
  // animating WebGL scene. Also the fallback when WebGL fails (boundary below).
  const reduceMotion = useMemo(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    [],
  );
  const orbFallback = (
    <AIAvatarAnime
      isSpeaking={isSpeaking}
      isThinking={isThinking}
      audioVolume={audioVolume}
      className={className}
      name={name}
    />
  );
  if (reduceMotion) return orbFallback;

  return (
    <ThreeErrorBoundary fallback={orbFallback}>
      {/* Same dark card + ambient glow as the 2D orb so the two variants are
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
          camera={{ position: [0, 0, 3.2], fov: 38 }}
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
