import {
  useRef,
  useMemo,
  useEffect,
  useState,
  Suspense,
  Component,
  type ReactNode,
  type ErrorInfo,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { cn } from '@/lib/utils';

/**
 * PenguinHero3D — the brand mascot for "Penguin Guided E-Learning".
 * Built entirely from three.js primitives (no external model/asset to load),
 * so it ships in the bundle with zero network cost. Mirrors the proven
 * Canvas / error-boundary / useFrame patterns from AIAvatar3D.
 *
 * Palette is locked to the design tokens: navy body (primary-dark),
 * orange beak & feet (secondary), blue + orange rim glow.
 */

class ThreeErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { errored: boolean }
> {
  state = { errored: false };
  static getDerivedStateFromError() {
    return { errored: true };
  }
  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('[PenguinHero3D]', err, info);
  }
  render() {
    return this.state.errored ? this.props.fallback : this.props.children;
  }
}

const NAVY = '#0b1e3b'; // deep navy body
const NAVY_HI = '#16315c'; // lit navy
const BELLY = '#f3f7ff'; // off-white belly
const ORANGE = '#fe9400'; // secondary — beak & feet
const ORANGE_HI = '#ffb874';
const CAP = '#0058bc'; // primary — graduation cap
const BLUE_GLOW = '#2b86ff';

// ─── Penguin ─────────────────────────────────────────────────────────────────

function Penguin({ reduced }: { reduced: boolean }) {
  const root = useRef<THREE.Group>(null); // bob + breathe
  const tilt = useRef<THREE.Group>(null); // mouse-follow gaze
  const leftWing = useRef<THREE.Group>(null);
  const rightWing = useRef<THREE.Group>(null);
  const leftEye = useRef<THREE.Mesh>(null);
  const rightEye = useRef<THREE.Mesh>(null);
  const tassel = useRef<THREE.Mesh>(null);

  const { mouse } = useThree();

  const blink = useRef({ next: 0, closing: 0 });
  useEffect(() => {
    blink.current.next = performance.now() + 2200 + Math.random() * 2600;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (root.current) {
      // Idle bob + gentle breathing scale
      root.current.position.y = reduced ? 0 : Math.sin(t * 1.4) * 0.07;
      const breathe = reduced ? 1 : 1 + Math.sin(t * 1.4) * 0.012;
      root.current.scale.set(breathe, 2 - breathe, breathe);
    }

    if (tilt.current) {
      // Look toward the cursor
      const ty = reduced ? 0 : mouse.x * 0.5;
      const tx = reduced ? 0 : -mouse.y * 0.28;
      tilt.current.rotation.y += (ty - tilt.current.rotation.y) * 0.06;
      tilt.current.rotation.x += (tx - tilt.current.rotation.x) * 0.06;
    }

    // Wing flap
    if (!reduced) {
      const flap = Math.sin(t * 2.4) * 0.22;
      if (leftWing.current) leftWing.current.rotation.z = 0.5 + flap;
      if (rightWing.current) rightWing.current.rotation.z = -0.5 - flap;
      // Tassel sway
      if (tassel.current) tassel.current.position.x = 0.62 + Math.sin(t * 2) * 0.04;
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
    <group ref={root} position={[0, 0, 0]}>
      <group ref={tilt}>
        {/* Body — egg-shaped navy */}
        <mesh scale={[1, 1.22, 0.92]} castShadow>
          <sphereGeometry args={[1, 48, 48]} />
          <meshStandardMaterial color={NAVY} roughness={0.45} metalness={0.15} />
        </mesh>

        {/* Subtle blue sheen on the back/top */}
        <mesh scale={[1.004, 1.224, 0.924]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial
            color={NAVY_HI}
            emissive={BLUE_GLOW}
            emissiveIntensity={0.12}
            transparent
            opacity={0.25}
            depthWrite={false}
          />
        </mesh>

        {/* White belly — a flattened sphere pushed forward */}
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

        {/* Beak — orange cone pointing forward */}
        <mesh position={[0, 0.24, 0.92]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.17, 0.4, 24]} />
          <meshStandardMaterial color={ORANGE} emissive={ORANGE} emissiveIntensity={0.12} roughness={0.5} />
        </mesh>

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
          {/* base (head-hugging band) */}
          <mesh position={[0, -0.04, 0]} scale={[0.5, 0.18, 0.5]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshStandardMaterial color={CAP} roughness={0.4} metalness={0.2} />
          </mesh>
          {/* mortarboard */}
          <mesh position={[0, 0.08, 0]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[0.92, 0.06, 0.92]} />
            <meshStandardMaterial color={CAP} emissive={CAP} emissiveIntensity={0.15} roughness={0.35} metalness={0.25} />
          </mesh>
          {/* button */}
          <mesh position={[0, 0.13, 0]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial color={ORANGE_HI} emissive={ORANGE} emissiveIntensity={0.4} toneMapped={false} />
          </mesh>
          {/* tassel cord + bead */}
          <mesh ref={tassel} position={[0.62, 0.02, 0]}>
            <sphereGeometry args={[0.07, 14, 14]} />
            <meshStandardMaterial color={ORANGE} emissive={ORANGE} emissiveIntensity={0.5} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ─── Floating knowledge particles ──────────────────────────────────────────────

function Sparkles({ count = 60 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.2 + Math.random() * 2.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI - Math.PI / 2;
      pos[i * 3] = r * Math.cos(theta) * Math.cos(phi);
      pos[i * 3 + 1] = r * Math.sin(phi) * 0.8;
      pos[i * 3 + 2] = r * Math.sin(theta) * Math.cos(phi);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.05;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color={ORANGE_HI} size={0.045} transparent opacity={0.75} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────────

function Scene({ reduced }: { reduced: boolean }) {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 5, 4]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-4, 1, 3]} intensity={1.4} color={BLUE_GLOW} />
      <pointLight position={[3, -2, 4]} intensity={1.0} color={ORANGE} />
      <Penguin reduced={reduced} />
      <Sparkles />
    </>
  );
}

// ─── 2D fallback (no WebGL / errored) ───────────────────────────────────────────

function PenguinFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <span className="text-[8rem] drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]">🐧</span>
    </div>
  );
}

// ─── Public ──────────────────────────────────────────────────────────────────────

export function PenguinHero3D({ className }: { className?: string }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // Pause the render loop while the mascot is scrolled out of view so an
  // off-screen decorative canvas costs no GPU/battery.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '120px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Reduced-motion → render a single static frame; otherwise only animate
  // while on-screen.
  const frameloop: 'always' | 'demand' | 'never' = reduced
    ? 'demand'
    : inView
      ? 'always'
      : 'never';

  return (
    <div ref={wrapRef} className={cn('relative', className)} aria-label="Penguin mascot" role="img">
      <ThreeErrorBoundary fallback={<PenguinFallback />}>
        <Canvas
          frameloop={frameloop}
          camera={{ position: [0, 0.1, 4.6], fov: 42 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <Scene reduced={reduced} />
          </Suspense>
        </Canvas>
      </ThreeErrorBoundary>
    </div>
  );
}

export default PenguinHero3D;
