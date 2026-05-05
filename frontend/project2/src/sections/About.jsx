/*** About.jsx*/

import {
  motion,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
} from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Float } from "@react-three/drei";
import { Suspense, useRef, useState, useEffect } from "react";

/* ══════════════════════════════════════════════════════════════
   MODULE-LEVEL STABLE DATA
══════════════════════════════════════════════════════════════ */
const _ORB_DATA = [
  { position: [-3.5, 1, -2], color: "#00ffc8", speed: 0.6 },
  { position: [3.5, -1, -3], color: "#7b5ea7", speed: 0.4 },
  { position: [1, 2.5, -4], color: "#00bfff", speed: 0.8 },
];

/* ══════════════════════════════════════════════════════════════
   3D — FLOATING ORB
══════════════════════════════════════════════════════════════ */
function FloatingOrb({ position, color, speed }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    ref.current.position.y = position[1] + Math.sin(t) * 0.4;
    ref.current.rotation.x = t * 0.3;
    ref.current.rotation.z = t * 0.2;
  });
  return (
    <Float speed={speed * 0.5} floatIntensity={1.5}>
      <mesh ref={ref} position={position}>
        <icosahedronGeometry args={[2, 1]} />
        <meshStandardMaterial
          emissive={color}
          emissiveIntensity={0.35}
          wireframe
          transparent
          opacity={0.22}
        />
      </mesh>
    </Float>
  );
}

/* ══════════════════════════════════════════════════════════════
   3D — ABOUT SCENE
══════════════════════════════════════════════════════════════ */
function AboutScene() {
  return (
    <>
      <ambientLight intensity={0.3} color="#0d2030" />
      <directionalLight position={[1, 5, 5]} intensity={1.2} color="#00ffc8" />
      <Stars radius={60} depth={40} count={2500} factor={3} fade speed={0.5} />
      {_ORB_DATA.map((o, i) => (
        <FloatingOrb key={i} {...o} />
      ))}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAGNETIC BUTTON
══════════════════════════════════════════════════════════════ */
function MagneticButton({ children, onClick, variant = "primary" }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 18 });
  const sy = useSpring(y, { stiffness: 250, damping: 18 });
  const [hovered, setHovered] = useState(false);
  const isPrimary = variant === "primary";

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.3);
        y.set((e.clientY - r.top - r.height / 2) * 0.3);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
        setHovered(false);
      }}
      onHoverStart={() => setHovered(true)}
    >
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.97 }}
        className={`relative overflow-hidden px-6 py-3 rounded-sm font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
          isPrimary
            ? "border border-emerald-400/70 bg-emerald-400/[0.06] text-emerald-400 hover:bg-emerald-400/20 shadow-[0_0_20px_rgba(0,255,200,0.1)]"
            : "border border-emerald-400/20 bg-transparent text-emerald-400/70 hover:bg-emerald-400/[0.06] hover:text-emerald-400"
        }`}
      >
        <motion.span
          className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: hovered ? "100%" : "-100%" }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        {children}
      </motion.button>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SCROLL REVEAL
══════════════════════════════════════════════════════════════ */
function Reveal({ children, delay = 0, direction = "up" }) {
  const variants = {
    up: { initial: { opacity: 0, y: 50 }, animate: { opacity: 1, y: 0 } },
    left: { initial: { opacity: 0, x: -40 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 } },
  };
  const v = variants[direction] || variants.up;
  return (
    <motion.div
      initial={v.initial}
      whileInView={v.animate}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   STAT COUNTER
══════════════════════════════════════════════════════════════ */
function StatCounter({ value, label, delay }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) setStarted(true);
      },
      { threshold: 0.5 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const num = parseInt(value);
    const step = num / (1500 / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, num);
      setCount(Math.floor(current));
      if (current >= num) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [started, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      <div
        className="font-black text-3xl sm:text-4xl bg-gradient-to-br from-white to-emerald-400 bg-clip-text text-transparent"
        style={{
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          fontFamily: "'Syne', sans-serif",
        }}
      >
        {count}
        {value.includes("+") ? "+" : ""}
      </div>
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-400/50 mt-1">
        {label}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   INFO CARD
══════════════════════════════════════════════════════════════ */
const COLOR_MAP = {
  emerald: {
    border: "hover:border-emerald-400/40",
    icon: "text-emerald-400",
    scan: "via-emerald-400/30",
  },
  purple: {
    border: "hover:border-purple-400/40",
    icon: "text-purple-400",
    scan: "via-purple-400/30",
  },
  blue: {
    border: "hover:border-blue-400/40",
    icon: "text-blue-400",
    scan: "via-blue-400/30",
  },
  cyan: {
    border: "hover:border-cyan-400/40",
    icon: "text-cyan-400",
    scan: "via-cyan-400/30",
  },
};

function InfoCard({ icon, title, text, delay, accentColor = "emerald" }) {
  const [hovered, setHovered] = useState(false);
  const c = COLOR_MAP[accentColor] || COLOR_MAP.emerald;
  return (
    <Reveal delay={delay}>
      <motion.div
        className={`group relative p-5 sm:p-6 rounded-xl border border-emerald-400/[0.08] bg-white/[0.02] backdrop-blur-md overflow-hidden transition-all duration-300 ${c.border}`}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileHover={{ y: -5, scale: 1.01 }}
        transition={{ duration: 0.25 }}
      >
        <motion.div
          className={`absolute inset-x-0 h-px bg-gradient-to-r from-transparent ${c.scan} to-transparent pointer-events-none`}
          animate={{ y: hovered ? [0, 200, 0] : 0 }}
          transition={{ duration: 2, repeat: hovered ? Infinity : 0 }}
        />
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-emerald-400/15 rounded-tr-xl pointer-events-none" />
        <div className={`text-2xl mb-3 ${c.icon}`}>{icon}</div>
        <h3
          className="text-sm sm:text-base font-bold mb-2 text-emerald-100/90 tracking-tight"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          {title}
        </h3>
        <p className="text-xs sm:text-[13px] leading-relaxed text-emerald-200/50">
          {text}
        </p>
      </motion.div>
    </Reveal>
  );
}

/* ══════════════════════════════════════════════════════════════
   TIMELINE ITEM
══════════════════════════════════════════════════════════════ */
function TimelineItem({ year, title, desc, delay }) {
  return (
    <Reveal delay={delay} direction="left">
      <div className="relative flex gap-4 sm:gap-6 pb-8 last:pb-0">
        <div className="flex flex-col items-center">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(0,255,200,0.6)] mt-1 shrink-0" />
          <div className="w-px flex-1 bg-gradient-to-b from-emerald-400/40 to-transparent mt-1" />
        </div>
        <div className="flex-1 pb-2">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-400/50 mb-1">
            {year}
          </div>
          <div
            className="text-sm font-bold text-emerald-100/90 mb-1"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {title}
          </div>
          <div className="text-xs text-emerald-200/45 leading-relaxed">
            {desc}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ══════════════════════════════════════════════════════════════
   SKILL TAG
══════════════════════════════════════════════════════════════ */
const SKILL_COLORS = {
  React: "hover:border-sky-400/60    hover:text-sky-400    hover:bg-sky-400/10",
  "Next.js":
    "hover:border-slate-300/60  hover:text-slate-300  hover:bg-slate-300/10",
  "Meta Ads":
    "hover:border-blue-500/60   hover:text-blue-500   hover:bg-blue-500/10",
  "Tailwind CSS":
    "hover:border-cyan-400/60   hover:text-cyan-400   hover:bg-cyan-400/10",
  "Three.js":
    "hover:border-orange-400/60 hover:text-orange-400 hover:bg-orange-400/10",
  Python:
    "hover:border-yellow-400/60 hover:text-yellow-400 hover:bg-yellow-400/10",
  "Framer Motion":
    "hover:border-purple-400/60 hover:text-purple-400 hover:bg-purple-400/10",
  WordPress:
    "hover:border-blue-400/60   hover:text-blue-400   hover:bg-blue-400/10",
  Funnels:
    "hover:border-green-400/60  hover:text-green-400  hover:bg-green-400/10",
  Automation:
    "hover:border-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-400/10",
};

function SkillTag({ label, delay }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.7 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.03] font-mono text-[9px] uppercase tracking-[0.15em] text-emerald-400/55 cursor-default select-none transition-all duration-200 ${SKILL_COLORS[label] || "hover:border-emerald-400/60 hover:text-emerald-400"}`}
    >
      <span className="w-1 h-1 rounded-full bg-emerald-400/40" />
      {label}
    </motion.span>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION DIVIDER
══════════════════════════════════════════════════════════════ */
function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-4 my-10 sm:my-14">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-emerald-400/15" />
      <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-emerald-400/30">
        {label}
      </span>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-emerald-400/15" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════════════ */
const CARDS = [
  {
    icon: "⚡",
    title: "Digital Systems",
    text: "Building revenue-generating systems at scale — digital products, affiliate funnels, and automated pipelines.",
    accentColor: "emerald",
  },
  {
    icon: "🎯",
    title: "Meta Ads & Growth",
    text: "Precision audience targeting, creative optimization, and conversion-driven paid media on Meta platforms.",
    accentColor: "blue",
  },
  {
    icon: "🧱",
    title: "Frontend Engineering",
    text: "React, Three.js, Framer Motion — crafting immersive, high-performance interfaces that convert.",
    accentColor: "purple",
  },
  {
    icon: "🤖",
    title: "Automation & Scale",
    text: "WhatsApp automation, drip sequences, and system design that works while you sleep.",
    accentColor: "cyan",
  },
];

const TIMELINE = [
  {
    year: "2026",
    title: "Kabir Digital Matrix — Brand Launch",
    desc: "Launched full brand ecosystem: digital products, affiliate systems, portfolio site, and Meta Ads infrastructure.",
  },
  {
    year: "2025",
    title: "React + Three.js Mastery",
    desc: "Shipped multiple immersive 3D web experiences — dark luxury e-commerce, portfolio sites, animated product UIs.",
  },
  {
    year: "2024",
    title: "Digital Product Sales",
    desc: "Started monetizing digital knowledge assets via WhatsApp funnels and landing pages.",
  },
  {
    year: "2023",
    title: "Frontend Development",
    desc: "Deep dive into React ecosystem — Vite, Tailwind CSS, advanced component architecture.",
  },
];

const SKILLS = [
  "React",
  "Next.js",
  "Three.js",
  "Framer Motion",
  "Tailwind CSS",
  "Meta Ads",
  "Python",
  "WordPress",
  "Funnels",
  "Automation",
];
const STATS = [
  { value: "3+", label: "Years Building" },
  { value: "20+", label: "Projects Shipped" },
  { value: "5", label: "Hours Daily" },
  { value: "100+", label: "Skills Stacked" },
];

/* ══════════════════════════════════════════════════════════════
   MAIN EXPORT
   Props: onProjectClick (optional — from parent)
══════════════════════════════════════════════════════════════ */
export default function About({  onProjectClick }) {
  // ✅ FIX 1 — containerRef declared
  const containerRef = useRef(null);

  // ✅ FIX 2 — scrollYProgress declared via useScroll targeting the section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // ✅ FIX 3 — headerY/headerOpacity now reference the declared scrollYProgress
  const headerY = useTransform(scrollYProgress, [0, 0.3], [0, -30]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.6]);

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Syne+Mono&display=swap');`}</style>

      <div
        ref={containerRef}
        className="relative overflow-x-hidden text-[#cce8e0]"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        {/*
         * ── 3D BACKGROUND ──
         * `absolute` (not `fixed`) — strictly contained to this section.
         */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Canvas camera={{ position: [0, 0, 6], fov: 60 }} dpr={[1, 1.5]}>
            <Suspense fallback={null}>
              <AboutScene />
            </Suspense>
          </Canvas>
        </div>

        {/* Overlays */}
        <div className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(3,10,14,0.85)_100%)]" />
        <div className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_at_75%_20%,rgba(0,60,48,0.18)_0%,transparent_55%),radial-gradient(ellipse_at_12%_85%,rgba(45,8,80,0.15)_0%,transparent_50%)]" />

        {/* Corner accents */}
        <div className="absolute top-3 left-3  z-[10] size-8 sm:size-10 border-l border-t border-emerald-400/20 pointer-events-none" />
        <div className="absolute bottom-3 right-3 z-[10] size-8 sm:size-10 border-r border-b border-emerald-400/20 pointer-events-none" />

        {/* Content */}
        <div className="relative z-[5] px-5 sm:px-8 md:px-12 py-10 sm:py-16 max-w-5xl mx-auto">
          {/* HEADER */}
          <motion.div
            style={{ y: headerY, opacity: headerOpacity }}
            className="mb-10 sm:mb-14"
          >
            <motion.p
              className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-emerald-400/60 mb-3"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              ◈ System Profile
            </motion.p>
            <motion.h2
              className="font-black leading-[0.9] bg-gradient-to-br from-white via-emerald-100 to-emerald-400 bg-clip-text text-[clamp(36px,8vw,72px)] mb-4"
              style={{
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
              initial={{ opacity: 0, y: 50, skewY: 3 }}
              whileInView={{ opacity: 1, y: 0, skewY: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: 0.35,
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <span className="block">HUMAYAN</span>
              <span className="block text-emerald-400/80">KABIR</span>
            </motion.h2>
            <motion.p
              className="max-w-lg text-sm sm:text-base leading-relaxed text-emerald-200/50"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.55, duration: 0.7 }}
            >
              Fullstack developer & digital entrepreneur building scalable,
              revenue-generating systems. Based in West Bengal, India —
              operating globally under{" "}
              <span className="text-emerald-400/80 font-semibold">
                Kabir Digital Matrix
              </span>
              .
            </motion.p>
          </motion.div>

          {/* STATS */}
          <Reveal delay={0.1}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-2 p-5 sm:p-6 rounded-xl border border-emerald-400/[0.08] bg-white/[0.02] backdrop-blur-md">
              {STATS.map((s, i) => (
                <StatCounter
                  key={s.label}
                  value={s.value}
                  label={s.label}
                  delay={0.1 + i * 0.08}
                />
              ))}
            </div>
          </Reveal>

          <SectionDivider label="What I Build" />

          {/* CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-2">
            {CARDS.map((card, i) => (
              <InfoCard key={card.title} {...card} delay={i * 0.08} />
            ))}
          </div>

          <SectionDivider label="Journey" />

          {/* TIMELINE + SKILLS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            <div>
              <Reveal>
                <h3 className="font-bold text-base sm:text-lg text-emerald-100/80 mb-6 flex items-center gap-3">
                  <span className="w-4 h-px bg-emerald-400/50" />
                  Timeline
                </h3>
              </Reveal>
              {TIMELINE.map((item, i) => (
                <TimelineItem key={item.year} {...item} delay={i * 0.1} />
              ))}
            </div>
            <div>
              <Reveal>
                <h3 className="font-bold text-base sm:text-lg text-emerald-100/80 mb-6 flex items-center gap-3">
                  <span className="w-4 h-px bg-emerald-400/50" />
                  Tech Stack
                </h3>
              </Reveal>
              <div className="flex flex-wrap gap-2 mb-8">
                {SKILLS.map((skill, i) => (
                  <SkillTag key={skill} label={skill} delay={i * 0.05} />
                ))}
              </div>
              <Reveal delay={0.3}>
                <div className="relative p-5 rounded-xl border border-emerald-400/[0.08] bg-white/[0.02] backdrop-blur-md overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
                  <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-emerald-400/40 mb-2">
                    Operating Principle
                  </p>
                  <p className="text-sm leading-relaxed text-emerald-200/55 italic">
                    "Efficiency over effort. Systems over hustle. Build once,
                    scale forever."
                  </p>
                </div>
              </Reveal>
            </div>
          </div>

          <SectionDivider label="Connect" />

          {/* CTA */}
          <Reveal>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <MagneticButton
                onClick={onProjectClick}
                variant="secondary"
                delay={1.35}
              >
                {" "}
                View Projects →
              </MagneticButton>
            </div>
          </Reveal>

          {/* FOOTER TAG */}
          <motion.div
            className="mt-12 sm:mt-16 flex items-center justify-between"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.0, duration: 1 }}
          >
            <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.15em] text-emerald-400/20">
              23°32′N 87°19′E — WEST BENGAL, IN
            </span>
            <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.15em] text-emerald-400/20">
              KDM — v3.0.0
            </span>
          </motion.div>
        </div>
      </div>
    </>
  );
}
