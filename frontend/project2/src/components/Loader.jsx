/**
 * Loader.jsx — Kabir Digital Matrix Portfolio
 * Premium cosmic loading screen
 * Fully consistent with Hero.jsx / App.jsx design system
 *
 * Design System:
 *   - Background: #030c0e
 *   - Accent:     #00ffc8 (emerald-400 equivalent)
 *   - Secondary:  #7b5ea7
 *   - Font:       Syne + Syne Mono
 *   - Tech:       React Three Fiber · Framer Motion · Tailwind CSS
 */

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

/* ══════════════════════════════════════════════════════════════
   MODULE-LEVEL RANDOMS  (never inside render)
══════════════════════════════════════════════════════════════ */
const _NEBULA = Array.from({ length: 120 }, () => ({
  x: (Math.random() - 0.5) * 20,
  y: (Math.random() - 0.5) * 12,
  z: (Math.random() - 0.5) * 6 - 3,
  teal: Math.random() > 0.5,
}));

const _RING_PARAMS = [
  { r: 1.6, tube: 0.018, tilt: Math.PI / 3, phase: 0, spd: 0.25, op: 0.55 },
  {
    r: 2.2,
    tube: 0.012,
    tilt: Math.PI / 2.2,
    phase: Math.PI / 3,
    spd: 0.18,
    op: 0.4,
  },
  {
    r: 2.9,
    tube: 0.008,
    tilt: Math.PI / 1.8,
    phase: Math.PI / 2,
    spd: 0.12,
    op: 0.28,
  },
  {
    r: 3.7,
    tube: 0.005,
    tilt: Math.PI / 2.8,
    phase: Math.PI,
    spd: 0.08,
    op: 0.16,
  },
];

/* ══════════════════════════════════════════════════════════════
   3D — NEBULA DUST
══════════════════════════════════════════════════════════════ */
function NebulaDust() {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(_NEBULA.length * 3);
    _NEBULA.forEach((p, i) => {
      arr[i * 3] = p.x;
      arr[i * 3 + 1] = p.y;
      arr[i * 3 + 2] = p.z;
    });
    return arr;
  }, []);

  const colors = useMemo(() => {
    const arr = new Float32Array(_NEBULA.length * 3);
    _NEBULA.forEach((p, i) => {
      arr[i * 3] = p.teal ? 0 : 0.28;
      arr[i * 3 + 1] = p.teal ? 1 : 0.37;
      arr[i * 3 + 2] = p.teal ? 0.8 : 0.65;
    });
    return arr;
  }, []);

  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 0.05;
    ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.03) * 0.08;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  );
}

/* ══════════════════════════════════════════════════════════════
   3D — CORE ORB  (pulsing central sphere)
══════════════════════════════════════════════════════════════ */
function CoreOrb() {
  const innerRef = useRef();
  const outerRef = useRef();
  const glowRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    innerRef.current.rotation.y = t * 0.4;
    innerRef.current.rotation.x = t * 0.22;
    outerRef.current.rotation.y = -t * 0.18;
    outerRef.current.rotation.z = t * 0.14;

    // Pulse scale
    const pulse = 1 + Math.sin(t * 2.2) * 0.06;
    glowRef.current.scale.setScalar(pulse);
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Inner solid core */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[0.55, 2]} />
        <meshStandardMaterial
          color="#001a14"
          emissive="#00ffc8"
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.9}
          wireframe={false}
        />
      </mesh>

      {/* Wireframe cage */}
      <mesh ref={outerRef}>
        <icosahedronGeometry args={[0.85, 1]} />
        <meshBasicMaterial
          color="#00ffc8"
          wireframe
          transparent
          opacity={0.18}
        />
      </mesh>

      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.1, 16, 16]} />
        <meshBasicMaterial
          color="#00ffc8"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Point light at core */}
      <pointLight color="#00ffc8" intensity={8} distance={6} />
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════
   3D — TRANSMISSION RINGS
══════════════════════════════════════════════════════════════ */
function TransmissionRings() {
  const groupRef = useRef();
  const ringRefs = useRef(_RING_PARAMS.map(() => ({ ref: null })));

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.06;
    _RING_PARAMS.forEach((p, i) => {
      if (ringRefs.current[i].ref) {
        ringRefs.current[i].ref.rotation.z = t * p.spd + p.phase;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {_RING_PARAMS.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => (ringRefs.current[i].ref = el)}
          rotation={[p.tilt, p.phase, 0]}
        >
          <torusGeometry args={[p.r, p.tube, 10, 90]} />
          <meshStandardMaterial
            color="#00ffc8"
            emissive="#00ffc8"
            emissiveIntensity={0.6}
            transparent
            opacity={p.op}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════
   3D — FULL SCENE
══════════════════════════════════════════════════════════════ */
function LoaderScene() {
  return (
    <>
      <ambientLight intensity={0.15} color="#0d2030" />
      <directionalLight position={[3, 4, 3]} intensity={0.3} color="#ffffff" />
      <Stars
        radius={60}
        depth={50}
        count={3500}
        factor={3}
        saturation={0.15}
        fade
        speed={0.4}
      />
      <NebulaDust />
      <CoreOrb />
      <TransmissionRings />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   PROGRESS BAR
══════════════════════════════════════════════════════════════ */
function ProgressBar({ progress }) {
  return (
    <div className="relative w-48 sm:w-64 h-px bg-emerald-400/10 overflow-visible">
      {/* Track shimmer */}
      <div className="absolute inset-0 bg-emerald-400/[0.06]" />
      {/* Fill */}
      <motion.div
        className="absolute top-0 left-0 h-full bg-emerald-400"
        style={{ width: `${progress}%` }}
        transition={{ duration: 0.1, ease: "linear" }}
      />
      {/* Glow tip */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#00ffc8,0_0_24px_rgba(0,255,200,0.5)]"
        style={{ left: `calc(${progress}% - 4px)` }}
        transition={{ duration: 0.1, ease: "linear" }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SCANNING LINE EFFECT
══════════════════════════════════════════════════════════════ */
function ScanLine() {
  return (
    <motion.div
      className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent pointer-events-none z-[20]"
      initial={{ y: 0 }}
      animate={{ y: ["0%", "100vh"] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
    />
  );
}

/* ══════════════════════════════════════════════════════════════
   GLITCH TEXT  (identical pattern to Hero.jsx)
══════════════════════════════════════════════════════════════ */
function GlitchText({ text, className = "" }) {
  const [glitch, setGlitch] = useState(false);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    let tid;
    const schedule = () => {
      tid = setTimeout(
        () => {
          setDir(Math.random() > 0.5 ? 1 : -1);
          setGlitch(true);
          setTimeout(() => {
            setGlitch(false);
            schedule();
          }, 110);
        },
        2200 + Math.random() * 1800,
      );
    };
    schedule();
    return () => clearTimeout(tid);
  }, []);

  return (
    <span
      className={`relative inline-block transition-[filter,transform] duration-[40ms] ${className}`}
      style={{
        filter: glitch
          ? "drop-shadow(2px 0 #00ffc8) drop-shadow(-2px 0 #7b5ea7)"
          : "none",
        transform: glitch ? `translateX(${dir * 2}px)` : "none",
      }}
    >
      {text}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   BOOT SEQUENCE TEXT  (cycling mono lines)
══════════════════════════════════════════════════════════════ */
const BOOT_LINES = [
  "INITIALIZING SYSTEM..",
  "LOADING ASSETS........",
  "COMPILING SHADERS.....",
  "SYNCING MODULES.......",
  "MOUNTING INTERFACE....",
  "SYSTEM ONLINE ✓",
];

function BootSequence() {
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    if (lineIdx >= BOOT_LINES.length - 1) return;
    const tid = setTimeout(
      () => setLineIdx((i) => i + 1),
      220 + Math.random() * 120,
    );
    return () => clearTimeout(tid);
  }, [lineIdx]);

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={lineIdx}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 0.55, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18 }}
        className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-emerald-400"
        style={{ fontFamily: "'Syne Mono', monospace" }}
      >
        {BOOT_LINES[lineIdx]}
      </motion.p>
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════════
   CORNER ACCENTS  (identical to Hero.jsx)
══════════════════════════════════════════════════════════════ */
function CornerAccents() {
  return (
    <>
      <div className="absolute top-4 left-4 sm:top-5 sm:left-5 size-10 sm:size-14 border-l border-t border-emerald-400/20 pointer-events-none" />
      <div className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 size-10 sm:size-14 border-r border-b border-emerald-400/20 pointer-events-none" />
      <div className="absolute top-4 right-4 sm:top-5 sm:right-5 size-5 sm:size-6 border-r border-t border-emerald-400/10 pointer-events-none" />
      <div className="absolute bottom-4 left-4 sm:bottom-5 sm:left-5 size-5 sm:size-6 border-l border-b border-emerald-400/10 pointer-events-none" />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════ */
export default function Loader() {
  const [progress, setProgress] = useState(0);

  // Simulate smooth progress toward 100 within ~1.3s
  useEffect(() => {
    let raf;
    let val = 0;
    const tick = () => {
      val = Math.min(val + (100 - val) * 0.045 + 0.4, 99);
      setProgress(Math.floor(val));
      if (val < 99) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Snap to 100 just before unmount
    const t = setTimeout(() => setProgress(100), 1350);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Syne+Mono&display=swap');
      `}</style>

      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#030c0e]"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        {/* ── BACKGROUND OVERLAYS (identical to Hero) ── */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(3,10,14,0.82)_100%)] pointer-events-none z-[1]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_20%,rgba(0,60,48,0.18)_0%,transparent_55%),radial-gradient(ellipse_at_12%_85%,rgba(45,8,80,0.16)_0%,transparent_50%)] pointer-events-none z-[1]" />

        {/* ── SCANLINE ── */}
        <div className="absolute inset-0 overflow-hidden z-[2] pointer-events-none">
          <ScanLine />
        </div>

        {/* ── 3D CANVAS ── */}
        <div className="absolute inset-0 z-0">
          <Canvas
            camera={{ position: [0, 0, 7], fov: 52 }}
            gl={{ antialias: true, alpha: true }}
            dpr={[1, 1.5]}
          >
            <LoaderScene />
          </Canvas>
        </div>

        {/* ── CORNER ACCENTS ── */}
        <div className="absolute inset-0 z-[5] pointer-events-none">
          <CornerAccents />
        </div>

        {/* ── SIDE LABEL (same as Hero) ── */}
        <div className="hidden lg:block absolute right-6 top-1/2 z-[10] pointer-events-none -translate-y-1/2 rotate-90 origin-center whitespace-nowrap font-mono text-[8px] tracking-[0.25em] text-emerald-400/[0.18]">
          Kabir Digital Matrix — System Boot v2.0
        </div>

        {/* ── CENTRE UI ── */}
        <div className="relative z-[10] flex flex-col items-center gap-6 sm:gap-8 px-4 text-center">
          {/* Brand eyebrow */}
          <motion.p
            className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-emerald-400/60"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.15,
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            ◈ Kabir Digital Matrix
          </motion.p>

          {/* Main logotype */}
          <motion.div
            initial={{ opacity: 0, y: 30, skewY: 3 }}
            animate={{ opacity: 1, y: 0, skewY: 0 }}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1
              className="
                font-black leading-[0.88]
                bg-gradient-to-br from-white via-emerald-100 to-emerald-400
                bg-clip-text text-transparent
                [-webkit-text-fill-color:transparent]
                text-[clamp(28px,8vw,64px)]
                tracking-tight
              "
              style={{
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              <span className="block">
                <GlitchText text="LOADING" />
              </span>
              <span className="block text-emerald-400/70 text-[0.7em]">
                SYSTEM
              </span>
            </h1>
          </motion.div>

          {/* Progress section */}
          <motion.div
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.6 }}
          >
            <ProgressBar progress={progress} />

            {/* Percentage */}
            <div className="flex items-center gap-3">
              <motion.span
                className="font-mono text-[11px] sm:text-[13px] text-emerald-400/80 tabular-nums"
                style={{ fontFamily: "'Syne Mono', monospace" }}
              >
                {String(progress).padStart(3, "0")}%
              </motion.span>
              <span className="h-3 w-px bg-emerald-400/20" />
              <BootSequence />
            </div>
          </motion.div>

          {/* Pulsing status dot */}
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <motion.span
              className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#00ffc8,0_0_20px_rgba(0,255,200,0.4)]"
              animate={{ scale: [1, 1.9, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-400/40">
              Initializing Portfolio
            </span>
          </motion.div>
        </div>

        {/* ── BOTTOM COORDINATES (identical to Hero footer) ── */}
        <motion.div
          className="absolute bottom-5 left-0 right-0 z-[10] flex justify-between px-5 sm:px-8 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.15em] text-emerald-400/20">
            23°32′N 87°19′E — WEST BENGAL, IN
          </span>
          <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.15em] text-emerald-400/20">
            KDM — v2.0.0
          </span>
        </motion.div>
      </div>
    </>
  );
}
