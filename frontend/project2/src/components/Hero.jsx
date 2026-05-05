// Hero.jsx
import {
  useScroll,
  useTransform,
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { useState, useEffect, Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import BlackHole from "./BlackHole";

const _ASTEROID = Array.from({ length: 260 }, () => ({
  jitter: Math.random() * 0.18,
  rOff: Math.random() - 0.5,
  yOff: (Math.random() - 0.5) * 0.45,
  size: Math.random() * 0.07 + 0.025,
  spd: 0.018 + Math.random() * 0.012,
}));

const _NEBULA_POS = Array.from({ length: 180 }, () => [
  (Math.random() - 0.5) * 22,
  (Math.random() - 0.5) * 12,
  (Math.random() - 0.5) * 8 - 4,
]);
const _NEBULA_TEAL = Array.from({ length: 180 }, () => Math.random() > 0.5);

function Planet({ position = [4, 0.5, -3] }) {
  const meshRef = useRef();
  const ringRef = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    meshRef.current.rotation.y = t * 0.08;
    meshRef.current.rotation.x = Math.sin(t * 0.12) * 0.08;
    ringRef.current.rotation.z = t * 0.04;
  });
  return (
    <Float speed={0.6} rotationIntensity={0.15} floatIntensity={6}>
      <group position={position}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[1.4, 64, 64]} />
          <MeshDistortMaterial
            color="#0b0f1a"
            emissive="#111827"
            emissiveIntensity={0.4}
            distort={0}
            speed={2}
            roughness={0.8}
            metalness={0.6}
          />
        </mesh>
        <mesh scale={1.08}>
          <sphereGeometry args={[1.4, 32, 32]} />
          <meshBasicMaterial
            color="#00ffc8"
            transparent
            opacity={0.012}
            side={THREE.BackSide}
          />
        </mesh>
        <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0.3, 0]}>
          <torusGeometry args={[2.3, 0.06, 8, 120]} />
          <meshBasicMaterial color="#1a0f0b" transparent opacity={0.5} />
        </mesh>
        <mesh rotation={[Math.PI / 2.2, 0, 0]}>
          <torusGeometry args={[2.6, 0.03, 8, 120]} />
          <meshBasicMaterial color="#7b5ea7" transparent opacity={0.3} />
        </mesh>
        <pointLight color="#0a0a0a" intensity={12} distance={6} />
      </group>
    </Float>
  );
}

function Moon({ parentPos = [4, 0.5, -3] }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    ref.current.position.x = parentPos[0] + Math.cos(t * 0.7) * 4.5;
    ref.current.position.y = parentPos[1] + Math.sin(t * 0.7) * 1;
    ref.current.position.z = parentPos[2] + Math.sin(t * 0.7) * 0.9;
    ref.current.rotation.y += 0.01;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.4, 44, 44]} />
      <meshStandardMaterial
        color="#081520"
        roughness={0.9}
        metalness={0.4}
        emissive="#1B4F72"
        emissiveIntensity={0.01}
      />
    </mesh>
  );
}

function AsteroidBelt({ count = 260, radius = 7, spread = 25 }) {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const rng = _ASTEROID[i % _ASTEROID.length];
        return {
          angle: (i / count) * Math.PI * 3 + rng.jitter,
          r: radius + rng.rOff * spread,
          y: rng.yOff,
          size: rng.size,
          speed: rng.spd,
        };
      }),
    [count, radius, spread],
  );
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    data.forEach((d, i) => {
      const a = d.angle + t * d.speed;
      dummy.position.set(Math.cos(a) * d.r, d.y, Math.sin(a) * d.r * 0.3);
      dummy.scale.setScalar(d.size);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[null, null, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#2c2c2c"
        emissive="#2C2C2C"
        emissiveIntensity={0.1}
        roughness={0.95}
        metalness={0.4}
      />
    </instancedMesh>
  );
}

function Nebula({ count = 180 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = _NEBULA_POS[i][0];
      arr[i * 3 + 1] = _NEBULA_POS[i][1];
      arr[i * 3 + 2] = _NEBULA_POS[i][2];
    }
    return arr;
  }, [count]);
  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = _NEBULA_TEAL[i];
      arr[i * 3] = t ? 0 : 0.4;
      arr[i * 3 + 1] = t ? 1 : 1;
      arr[i * 3 + 2] = t ? 0.78 : 0.5;
    }
    return arr;
  }, [count]);
  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 0.06;
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

function CameraRig() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });
  const camRef = useRef();
  useEffect(() => {
    camRef.current = camera;
  }, [camera]);
  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  useFrame(() => {
    const cam = camRef.current;
    cam.position.x += (mouse.current.x * 0.6 - cam.position.x) * 0.03;
    cam.position.y += (mouse.current.y * 0.3 - cam.position.y) * 0.03;
    cam.lookAt(0, 0, 0);
  });
  return null;
}

function SpaceScene() {
  return (
    <>
      <CameraRig />
      <ambientLight intensity={0.25} color="#0d2030" />
      <directionalLight position={[5, 5, 5]} intensity={0.4} color="#ffffff" />
      <Stars
        radius={80}
        depth={60}
        count={5000}
        factor={3}
        saturation={0.2}
        fade
        speed={0.1}
      />
      <Suspense fallback={null}>
        <Nebula />
        <Planet position={[2.9, 0.1, -2.8]} />
        <Moon parentPos={[2.9, 0.1, -2.8]} />
        <BlackHole position={[-3, -1, -1]} />
        <AsteroidBelt count={260} radius={7} />
      </Suspense>
    </>
  );
}

function MagneticButton({ children, className = "" }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 20 });
  const sy = useSpring(y, { stiffness: 300, damping: 20 });
  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.35);
        y.set((e.clientY - r.top - r.height / 2) * 0.35);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ x: sx, y: sy }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const SKILL_META = {
  React: {
    tw: "hover:border-sky-400 hover:text-sky-400 hover:bg-sky-400/10",
    dot: "group-hover:bg-sky-400",
  },
  "Node.js": {
    tw: "hover:border-green-400 hover:text-green-400 hover:bg-green-400/10",
    dot: "group-hover:bg-green-400",
  },
  Python: {
    tw: "hover:border-yellow-400 hover:text-yellow-400 hover:bg-yellow-400/10",
    dot: "group-hover:bg-yellow-400",
  },
  PostgreSQL: {
    tw: "hover:border-blue-500 hover:text-blue-500 hover:bg-blue-500/10",
    dot: "group-hover:bg-blue-500",
  },
  Docker: {
    tw: "hover:border-blue-400 hover:text-blue-400 hover:bg-blue-400/10",
    dot: "group-hover:bg-blue-400",
  },
  AWS: {
    tw: "hover:border-orange-400 hover:text-orange-400 hover:bg-orange-400/10",
    dot: "group-hover:bg-orange-400",
  },
  TypeScript: {
    tw: "hover:border-blue-500 hover:text-blue-500 hover:bg-blue-500/10",
    dot: "group-hover:bg-blue-500",
  },
  GraphQL: {
    tw: "hover:border-pink-500 hover:text-pink-500 hover:bg-pink-500/10",
    dot: "group-hover:bg-pink-500",
  },
};

function SkillBadge({ label, index }) {
  const meta = SKILL_META[label] || {
    tw: "hover:border-emerald-400 hover:text-emerald-400 hover:bg-emerald-400/10",
    dot: "group-hover:bg-emerald-400",
  };
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.6, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: 1.1 + index * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`group inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 rounded-full border border-emerald-400/20 bg-emerald-400/[0.04] text-[9px] sm:text-[10px] uppercase tracking-widest font-mono text-emerald-400/65 cursor-default select-none transition-all duration-200 ${meta.tw}`}
    >
      <span
        className={`size-1.5 rounded-full bg-emerald-400/40 transition-colors duration-200 ${meta.dot}`}
      />
      {label}
    </motion.span>
  );
}

function CTAButton({ children, onClick, variant = "primary", delay = 0 }) {
  const [hovered, setHovered] = useState(false);
  const isPrimary = variant === "primary";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <MagneticButton>
        <motion.button
          onClick={onClick}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          className={`relative inline-flex items-center gap-2 overflow-hidden px-5 py-2.5 sm:px-7 sm:py-3 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] font-mono text-emerald-400 rounded-sm transition-all duration-300 ${isPrimary ? "border border-emerald-400/70 bg-emerald-400/[0.06] shadow-[0_0_18px_rgba(0,255,200,0.1)] hover:bg-emerald-400/20 hover:shadow-[0_0_32px_rgba(0,255,200,0.2)]" : "border border-emerald-400/20 bg-transparent hover:bg-emerald-400/[0.06]"}`}
        >
          <motion.span
            className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-emerald-400/[0.08] to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: hovered ? "100%" : "-100%" }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
          {children}
        </motion.button>
      </MagneticButton>
    </motion.div>
  );
}

function StatusDot() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2.0, duration: 0.8 }}
      className="flex items-center gap-2"
    >
      <motion.span
        className="size-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#00ffc8,0_0_20px_rgba(0,255,200,0.4)]"
        animate={{ scale: [1, 2, 1], opacity: [1, 0.5, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400/55">
        — Available for work —
      </span>
    </motion.div>
  );
}

function NavLink({ label, delay, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.li
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="list-none"
    >
      <motion.button
        onClick={onClick}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        className={`relative font-mono text-[10px] uppercase tracking-[0.2em] flex flex-col overflow-hidden transition-colors duration-200 ${hovered ? "text-emerald-400" : "text-emerald-200/40"}`}
      >
        {label}
        <motion.span
          className="absolute bottom-0 left-0 h-px bg-emerald-400"
          animate={{ width: hovered ? "100%" : "0%" }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </motion.button>
    </motion.li>
  );
}

function RevealOnScroll({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

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
          }, 120);
        },
        4500 + Math.random() * 2000,
      );
    };
    schedule();
    return () => clearTimeout(tid);
  }, []);
  return (
    <span
      className={`relative inline-block transition-[filter,transform] duration-[50ms] ${className}`}
      style={{
        filter: glitch
          ? "drop-shadow(2px 0 #00ffc8) drop-shadow(-2px 0 #7b5ea7)"
          : "none",
        transform: glitch ? `translateX(${dir}px)` : "none",
      }}
    >
      {text}
    </span>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-4 my-12 sm:my-16">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-emerald-400/15" />
      <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-emerald-400/25">
        ◈
      </span>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-emerald-400/15" />
    </div>
  );
}

function WorkCard({ title, tags, year, description, index }) {
  const [hovered, setHovered] = useState(false);
  return (
    <RevealOnScroll delay={index * 0.1}>
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        className={`group relative p-5 sm:p-6 rounded overflow-hidden border transition-all duration-300 backdrop-blur-sm ${hovered ? "border-emerald-400/30 bg-emerald-400/[0.04]" : "border-emerald-400/[0.08] bg-slate-950/60"}`}
      >
        <motion.div
          className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent pointer-events-none"
          animate={{ y: hovered ? [0, 220, 0] : 0 }}
          transition={{ duration: 1.8, repeat: hovered ? Infinity : 0 }}
        />
        <div className="flex items-start justify-between mb-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-emerald-400/35">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-400/30">
            {year}
          </span>
        </div>
        <h3
          className={`font-bold text-base sm:text-lg mb-2 tracking-tight transition-colors duration-200 ${hovered ? "text-white" : "text-emerald-100/85"}`}
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          {title}
        </h3>
        <p className="text-xs sm:text-[13px] leading-relaxed mb-4 text-emerald-200/40">
          {description}
        </p>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-sm border border-emerald-400/15 text-emerald-400/50"
            >
              {tag}
            </span>
          ))}
        </div>
        <motion.span
          className="absolute bottom-5 right-5 font-mono text-emerald-400/40 text-sm"
          animate={{ x: hovered ? 4 : 0, opacity: hovered ? 1 : 0.3 }}
          transition={{ duration: 0.2 }}
        >
          →
        </motion.span>
      </motion.div>
    </RevealOnScroll>
  );
}

function Tilt({ children }) {
  const ref = useRef(null);
  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.transform = `perspective(800px) rotateX(${-(e.clientY - rect.top - rect.height / 2) / 12}deg) rotateY(${(e.clientX - rect.left - rect.width / 2) / 12}deg) scale(1.04)`;
  };
  const reset = () => {
    ref.current.style.transform =
      "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)";
  };
  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className="transition-transform duration-200"
    >
      {children}
    </div>
  );
}

const SKILLS = [
  "React",
  "Node.js",
  "Python",
  "PostgreSQL",
  "Docker",
  "AWS",
  "TypeScript",
  "GraphQL",
];

const PROJECTS = [
  {
    title: "Nebula CMS",
    tags: ["React", "Node.js", "PostgreSQL"],
    year: "2025",
    description:
      "Headless CMS built for scale. Real-time collaboration, granular permissions, and an extensible plugin ecosystem.",
  },
  {
    title: "Orbit Analytics",
    tags: ["Python", "AWS", "GraphQL"],
    year: "2025",
    description:
      "Event-driven pipeline processing 40M+ events/day. Live dashboards with sub-second latency via materialized views.",
  },
  {
    title: "Void Commerce",
    tags: ["TypeScript", "Docker", "Redis"],
    year: "2024",
    description:
      "High-throughput e-commerce API serving 120k req/min. Microservices with zero-downtime deployments.",
  },
  {
    title: "Parallax OS",
    tags: ["React", "WebGL", "Three.js"],
    year: "2024",
    description:
      "Browser-based OS shell. Window management, virtual file system, and GPU-accelerated compositor.",
  },
];

export default function Hero({
  isActive = true,
  onContactClick,
  onAdminClick = () => {},
  onProjectClick,
}) {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const scale = useTransform(scrollY, [0, 400], [1, 0.85]);
  const depth = useTransform(scrollY, [0, 500], [0, -300]);
  const heroY = useTransform(scrollY, [0, 500], [0, -200]);

  // ✅ Admin button visibility — reactive to localStorage token
  const [isAdmin, setIsAdmin] = useState(
    () => !!localStorage.getItem("adminToken"),
  );

  useEffect(() => {
    const checkAdmin = () => setIsAdmin(!!localStorage.getItem("adminToken"));
    window.addEventListener("storage", checkAdmin);
    // Also poll on focus — catches same-tab logout
    window.addEventListener("focus", checkAdmin);
    return () => {
      window.removeEventListener("storage", checkAdmin);
      window.removeEventListener("focus", checkAdmin);
    };
  }, []);

  return (
    <section
      className="relative w-full min-h-screen overflow-hidden"
      style={{ fontFamily: "'Syne', sans-serif", color: "#cce8e0" }}
    >
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 55 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
          frameloop={isActive ? "always" : "demand"}
        >
          <SpaceScene />
        </Canvas>
      </div>

      <div className="absolute inset-0 z-[2] pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(3,10,14,0.75)_100%)]" />
      <div className="absolute inset-0 z-0   pointer-events-none bg-[radial-gradient(ellipse_at_75%_20%,rgba(0,60,48,0.22)_0%,transparent_55%),radial-gradient(ellipse_at_12%_85%,rgba(45,8,80,0.2)_0%,transparent_50%)]" />

      <div className="absolute top-4    left-4   sm:top-5 sm:left-5   z-[15] size-10 sm:size-14 border-l border-t border-emerald-400/20 pointer-events-none" />
      <div className="absolute bottom-4 right-4  sm:bottom-5 sm:right-5 z-[15] size-10 sm:size-14 border-r border-b border-emerald-400/20 pointer-events-none" />
      <div className="absolute top-4    right-4  sm:top-5 sm:right-5   z-[15] size-5  sm:size-6  border-r border-t border-emerald-400/10 pointer-events-none" />
      <div className="absolute bottom-4 left-4   sm:bottom-5 sm:left-5  z-[15] size-5  sm:size-6  border-l border-b border-emerald-400/10 pointer-events-none" />

      <div className="hidden lg:block absolute right-6 xl:right-8 top-1/2 z-[15] pointer-events-none -translate-y-1/2 rotate-90 origin-center whitespace-nowrap font-mono text-[8px] tracking-[0.25em] text-emerald-400/[0.18]">
        Humayan Kabir — Portfolio System v3.0
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        <motion.nav
          style={{ y: y1 }}
          className="flex items-center justify-between px-5 sm:px-8 md:px-12 lg:px-16 pt-6 sm:pt-7"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-400/50 hover:text-emerald-400 transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
          >
            HK.Portfolio
          </motion.div>
          <ul className="hidden md:flex items-center gap-6 lg:gap-8 list-none p-0 m-0">
            <NavLink label="Work" delay={0.2} onClick={onProjectClick} />
            <NavLink
              label="About"
              delay={0.28}
              onClick={() =>
                document
                  .getElementById("about")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            />
            <NavLink label="Contact" delay={0.36} onClick={onContactClick} />
          </ul>
          <button
            className="md:hidden flex flex-col gap-1.5 p-1"
            aria-label="Menu"
          >
            <span className="block h-px w-3.5 bg-emerald-400/50" />
            <span className="block h-px w-5   bg-emerald-400/50" />
            <span className="block h-px w-3.5 bg-emerald-400/50" />
          </button>
        </motion.nav>

        <motion.section className="flex-1 flex flex-col justify-center px-5 sm:px-8 md:px-12 lg:px-16 py-16 sm:py-20 lg:py-24 w-full max-w-full lg:max-w-3xl overflow-visible">
          <motion.p
            style={{ y: y1 }}
            className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.28em] mb-4 sm:mb-5 text-emerald-400/80"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 0.9, x: 0 }}
            transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            ◈ Full Stack Developer
          </motion.p>

          <div className="mb-5 sm:mb-6 overflow-visible">
            <motion.h1
              className="font-black leading-tight overflow-visible bg-gradient-to-br from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent text-[clamp(32px,9vw,85px)] [-webkit-text-fill-color:transparent]"
              style={{
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                y: y1,
                scale,
              }}
              initial={{ opacity: 0, y: 70, skewY: 4 }}
              animate={{ opacity: 1, y: 0, skewY: 0 }}
              transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="block"></span>
              <span className="block">KABIR</span>
              <span className="block">DIGITAL</span>
              <span className="block">MATRIX</span>
            </motion.h1>
          </div>

          <motion.p
            style={{ y: y1 }}
            className="mb-7 sm:mb-8 max-w-sm sm:max-w-md leading-relaxed text-sm sm:text-base lg:text-[17px] text-emerald-200/45 tracking-[0.01em]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            Fullstack Web Developer & UI/UX Designer — proficient in JavaScript,
            Python, React, Next.js & Meta Ads. Delivering scalable,
            high-performance digital solutions with design & technical
            precision.
          </motion.p>

          <motion.div
            style={{ y: heroY }}
            className="flex flex-wrap gap-1.5 sm:gap-2 mb-8 sm:mb-10"
          >
            {SKILLS.map((s, i) => (
              <SkillBadge key={s} label={s} index={i} />
            ))}
          </motion.div>

          <motion.div
            style={{ y: y1 }}
            className="flex flex-wrap gap-3 sm:gap-4 mb-8 sm:mb-10"
          >
            <Tilt>
              <div className="flex gap-3">
                {/* ✅ ADMIN button — only visible when logged in */}
                {isAdmin && (
                  <CTAButton
                    onClick={onAdminClick}
                    variant="secondary"
                    delay={1.6}
                  >
                    ADMIN
                  </CTAButton>
                )}
              </div>
            </Tilt>
          </motion.div>

          <StatusDot />
        </motion.section>

        <motion.section
          style={{ y: depth }}
          className="px-5 sm:px-8 md:px-12 lg:px-16 pb-16"
        >
          <Divider />
          <RevealOnScroll>
            <div className="flex items-center gap-4 mb-8 sm:mb-10">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-emerald-400/35">
                Selected Work
              </span>
              <div className="flex-1 h-px bg-emerald-400/[0.08]" />
            </div>
          </RevealOnScroll>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {PROJECTS.map((p, i) => (
              <WorkCard key={p.title} {...p} index={i} />
            ))}
          </div>
        </motion.section>

        <motion.footer
          style={{ y: y1 }}
          className="px-5 sm:px-8 md:px-12 lg:px-16 py-5 sm:py-6 border-t border-emerald-400/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 1 }}
        >
          <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.15em] text-emerald-400/22">
            23°32′N 87°19′E — MURSHIDABAD, IN
          </span>
          <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.15em] text-emerald-400/22">
            2026 — v3.0.0
          </span>
        </motion.footer>
      </div>
    </section>
  );
}








