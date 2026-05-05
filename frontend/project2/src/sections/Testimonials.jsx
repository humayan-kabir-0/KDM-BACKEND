/**
 * Testimonials.jsx — Kabir Digital Matrix Portfolio
 *
 * FIXES vs original:
 *   1. Canvas is `absolute` (not `fixed`) — strictly contained to this section
 *   2. Removed `overflow: hidden` from the outermost container that was clipping
 *      the 3D background on tall viewports
 *   3. Module-level randoms stable (no re-declaration on render)
 *
 * Place at: src/sections/Testimonials.jsx
 */

import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Float } from "@react-three/drei";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
} from "framer-motion";

/* ══════════════════════════════════════════════════════════════
   MODULE-LEVEL STABLE DATA
══════════════════════════════════════════════════════════════ */
const _NEBULA_POS = Array.from({ length: 120 }, () => [
  (Math.random() - 0.5) * 22,
  (Math.random() - 0.5) * 12,
  (Math.random() - 0.5) * 8 - 4,
]);
const _NEBULA_TEAL = Array.from({ length: 120 }, () => Math.random() > 0.5);
const _ORB_DATA = [
  { position: [-4, 1.5, -3], color: "#00ffc8", speed: 0.5 },
  { position: [4.5, -1, -4], color: "#7b5ea7", speed: 0.35 },
  { position: [0, 3, -5], color: "#00bfff", speed: 0.65 },
];

/* ══════════════════════════════════════════════════════════════
   3D — NEBULA
══════════════════════════════════════════════════════════════ */
function Nebula({ count = 120 }) {
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
      arr[i * 3] = t ? 0 : 0.3;
      arr[i * 3 + 1] = t ? 1 : 0.9;
      arr[i * 3 + 2] = t ? 0.8 : 0.5;
    }
    return arr;
  }, [count]);
  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 0.04;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  );
}

/* ══════════════════════════════════════════════════════════════
   3D — FLOATING ORB
══════════════════════════════════════════════════════════════ */
function FloatingOrb({ position, color, speed }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    ref.current.position.y = position[1] + Math.sin(t) * 0.35;
    ref.current.rotation.x = t * 0.25;
    ref.current.rotation.z = t * 0.18;
  });
  return (
    <Float speed={speed * 0.5} floatIntensity={1.2}>
      <mesh ref={ref} position={position}>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshStandardMaterial
          emissive={color}
          emissiveIntensity={0.3}
          wireframe
          transparent
          opacity={0.18}
        />
      </mesh>
    </Float>
  );
}

/* ══════════════════════════════════════════════════════════════
   3D — SCENE
══════════════════════════════════════════════════════════════ */
function TestimonialsScene() {
  return (
    <>
      <ambientLight intensity={0.25} color="#0d2030" />
      <directionalLight position={[1, 5, 5]} intensity={1.0} color="#00ffc8" />
      <Stars
        radius={70}
        depth={50}
        count={3500}
        factor={3}
        saturation={0.2}
        fade
        speed={0.4}
      />
      <Suspense fallback={null}>
        <Nebula />
        {_ORB_DATA.map((o, i) => (
          <FloatingOrb key={i} {...o} />
        ))}
      </Suspense>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAGNETIC BUTTON
══════════════════════════════════════════════════════════════ */
function MagneticButton({ children, onClick, className = "" }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 280, damping: 18 });
  const sy = useSpring(y, { stiffness: 280, damping: 18 });
  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.32);
        y.set((e.clientY - r.top - r.height / 2) * 0.32);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ x: sx, y: sy }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SCROLL REVEAL
══════════════════════════════════════════════════════════════ */
function Reveal({ children, delay = 0, direction = "up" }) {
  const v = {
    up: { initial: { opacity: 0, y: 48 }, animate: { opacity: 1, y: 0 } },
    left: { initial: { opacity: 0, x: -36 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: 36 }, animate: { opacity: 1, x: 0 } },
    scale: {
      initial: { opacity: 0, scale: 0.88 },
      animate: { opacity: 1, scale: 1 },
    },
  }[direction] || {
    initial: { opacity: 0, y: 48 },
    animate: { opacity: 1, y: 0 },
  };
  return (
    <motion.div
      initial={v.initial}
      whileInView={v.animate}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
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
   STAR RATING
══════════════════════════════════════════════════════════════ */
function StarRating({ count = 5 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{
            delay: i * 0.06,
            duration: 0.3,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="text-emerald-400 text-[11px]"
        >
          ★
        </motion.span>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TESTIMONIAL CARD
══════════════════════════════════════════════════════════════ */
function TestimonialCard({
  quote,
  name,
  role,
  company,
  rating = 5,
  index,
  isActive,
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{
        scale: isActive ? 1 : 0.93,
        opacity: isActive ? 1 : 0.5,
        y: isActive ? 0 : 12,
      }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`relative p-6 sm:p-7 rounded-xl border backdrop-blur-md overflow-hidden transition-colors duration-300 select-none ${
        isActive
          ? hovered
            ? "border-emerald-400/35 bg-white/[0.04]"
            : "border-emerald-400/15 bg-white/[0.025]"
          : "border-emerald-400/[0.06] bg-white/[0.01]"
      }`}
    >
      <motion.div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent pointer-events-none"
        animate={{ y: hovered ? [0, 260, 0] : 0 }}
        transition={{ duration: 2.2, repeat: hovered ? Infinity : 0 }}
      />
      {isActive && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
      )}
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-emerald-400/15 rounded-tr-xl pointer-events-none" />
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-emerald-400/35">
          {String(index + 1).padStart(2, "0")} / testimonial
        </span>
        <StarRating count={rating} />
      </div>
      <div className="font-mono text-emerald-400/25 text-3xl leading-none mb-3 select-none">
        "
      </div>
      <p className="text-sm sm:text-[14px] leading-relaxed text-emerald-100/65 mb-6 italic tracking-wide">
        {quote}
      </p>
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-full bg-emerald-400/[0.08] border border-emerald-400/20 flex items-center justify-center font-mono text-[11px] text-emerald-400/70 shrink-0">
          {name[0]}
        </div>
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-300/80">
            {name}
          </div>
          <div className="font-mono text-[9px] text-emerald-400/40 tracking-wide mt-0.5">
            {role}
            {company && (
              <span className="text-emerald-400/25"> · {company}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   FEATURED CARD
══════════════════════════════════════════════════════════════ */
function FeaturedCard({ quote, name, role, company, rating }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative p-7 sm:p-10 rounded-2xl border border-emerald-400/20 bg-white/[0.03] backdrop-blur-md overflow-hidden"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent pointer-events-none"
        animate={{ y: hovered ? [0, 300, 0] : 0 }}
        transition={{ duration: 2.5, repeat: hovered ? Infinity : 0 }}
      />
      <div className="absolute inset-x-0 top-0    h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/15 to-transparent" />
      <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-emerald-400/20 rounded-tr-2xl pointer-events-none" />
      <div className="flex items-start justify-between mb-6">
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-emerald-400/40">
          Featured Testimonial
        </span>
        <StarRating count={rating} />
      </div>
      <div className="font-mono text-emerald-400/20 text-5xl leading-none mb-4 select-none">
        "
      </div>
      <p className="text-base sm:text-lg lg:text-xl leading-relaxed text-emerald-100/75 mb-8 italic font-light tracking-wide max-w-2xl">
        {quote}
      </p>
      <div className="flex items-center gap-4">
        <div className="size-11 rounded-full bg-emerald-400/[0.1] border border-emerald-400/25 flex items-center justify-center font-mono text-sm text-emerald-400/80">
          {name[0]}
        </div>
        <div>
          <div
            className="font-mono text-[12px] uppercase tracking-[0.2em] text-emerald-300/85"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {name}
          </div>
          <div className="font-mono text-[10px] text-emerald-400/45 tracking-wide mt-0.5">
            {role}
            {company && (
              <span className="text-emerald-400/25"> · {company}</span>
            )}
          </div>
        </div>
      </div>
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
      ([e]) => {
        if (e.isIntersecting && !started) setStarted(true);
      },
      { threshold: 0.5 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const num = parseInt(value);
    const step = num / (1400 / 16);
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
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      <div
        className="font-black text-2xl sm:text-3xl bg-gradient-to-br from-white to-emerald-400 bg-clip-text text-transparent"
        style={{
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          fontFamily: "'Syne', sans-serif",
        }}
      >
        {count}
        {value.includes("+") ? "+" : ""}
        {value.includes("%") ? "%" : ""}
      </div>
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-400/50 mt-1">
        {label}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════════════ */
const FEATURED = {
  quote:
    "Humayan built a full digital infrastructure — funnel, automation, and paid media — that cut our CPL by 40% in the first month. Not just a developer; he thinks like a growth strategist.",
  name: "Arjun Sharma",
  role: "Co-Founder",
  company: "GrowthLab IN",
  rating: 5,
};
const TESTIMONIALS = [
  {
    quote:
      "The UI + automation combo is insane. Clean code, zero hand-holding needed. Shipped ahead of schedule.",
    name: "Aman Khan",
    role: "Digital Marketer",
    company: "Velo Media",
    rating: 5,
  },
  {
    quote:
      "My sales improved by 60% after deploying his funnel system. He understood conversion architecture immediately.",
    name: "Sneha Das",
    role: "Ecom Owner",
    company: "Studio Kira",
    rating: 5,
  },
  {
    quote:
      "Rare combination of technical depth and design sensibility. The 3D portfolio blew our client away.",
    name: "Priya Mehta",
    role: "Agency Lead",
    company: "Pixel Forge",
    rating: 5,
  },
  {
    quote:
      "Fast, sharp, and technical. WhatsApp automation pipeline running 24/7 with zero failures since launch.",
    name: "Rakib Hossain",
    role: "SaaS Founder",
    company: "AutoStack",
    rating: 5,
  },
  {
    quote:
      "Transformed our lead generation with one React + Meta Ads system. Exceptional precision and reliability.",
    name: "Vikram Nair",
    role: "Marketing Director",
    company: "Reach Digital",
    rating: 5,
  },
  {
    quote:
      "He built our entire affiliate funnel ecosystem in two weeks. Revenue doubled in the first month.",
    name: "Rahul Verma",
    role: "Startup Founder",
    company: "LaunchPad",
    rating: 5,
  },
];
const STATS = [
  { value: "40+", label: "Happy Clients" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "24", label: "Hrs Response Time" },
  { value: "20+", label: "Projects Shipped" },
];

/* ══════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════ */
export default function Testimonials({ onContactClick}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  // Autoplay carousel
  useEffect(() => {
    if (!autoplay) return;
    intervalRef.current = setInterval(
      () => setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length),
      4000,
    );
    return () => clearInterval(intervalRef.current);
  }, [autoplay]);

  const goTo = (i) => {
    setActiveIndex(i);
    setAutoplay(false);
    clearInterval(intervalRef.current);
  };
  const prev = () =>
    goTo((activeIndex - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  const next = () => goTo((activeIndex + 1) % TESTIMONIALS.length);

  const visibleIndices = [
    (activeIndex - 1 + TESTIMONIALS.length) % TESTIMONIALS.length,
    activeIndex,
    (activeIndex + 1) % TESTIMONIALS.length,
  ];

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
         * `absolute` — strictly contained to this section. No fixed bleed.
         */}
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ y: bgY }}
        >
          <Canvas camera={{ position: [0, 0, 6], fov: 60 }} dpr={[1, 1.5]}>
            <Suspense fallback={null}>
              <TestimonialsScene />
            </Suspense>
          </Canvas>
        </motion.div>

        {/* Overlays */}
        <div className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(3,10,14,0.85)_100%)]" />
        <div className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_at_75%_20%,rgba(0,60,48,0.18)_0%,transparent_55%),radial-gradient(ellipse_at_12%_85%,rgba(45,8,80,0.15)_0%,transparent_50%)]" />

        {/* Corner accents */}
        <div className="absolute top-3 left-3   z-[10] size-8 sm:size-10 border-l border-t border-emerald-400/20 pointer-events-none" />
        <div className="absolute bottom-3 right-3 z-[10] size-8 sm:size-10 border-r border-b border-emerald-400/20 pointer-events-none" />

        {/* Content */}
        <div className="relative z-[5] px-5 sm:px-8 md:px-12 py-16 sm:py-24 max-w-6xl mx-auto">
          {/* HEADER */}
          <Reveal delay={0.05}>
            <div className="mb-10 sm:mb-14">
              <motion.p
                className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-emerald-400/70 mb-3 flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <motion.span
                  className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#00ffc8]"
                  animate={{ scale: [1, 1.8, 1], opacity: [1, 0.5, 1] }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                Social Proof
              </motion.p>
              <motion.h2
                className="font-black leading-[0.92] bg-gradient-to-br from-white via-emerald-100 to-emerald-400 bg-clip-text text-[clamp(32px,7vw,68px)] mb-4"
                style={{
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
                initial={{ opacity: 0, y: 48, skewY: 2 }}
                whileInView={{ opacity: 1, y: 0, skewY: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: 0.3,
                  duration: 0.85,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <span className="block">WHAT</span>
                <span className="block text-emerald-400/80">CLIENTS</span>
                <span className="block">SAY</span>
              </motion.h2>
              <motion.p
                className="max-w-sm sm:max-w-md text-sm sm:text-[15px] leading-relaxed text-emerald-200/40"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.7 }}
              >
                Real results from real collaborations. Every project, every
                system, every metric — built with precision.
              </motion.p>
            </div>
          </Reveal>

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

          <SectionDivider label="Featured" />

          <Reveal delay={0.15}>
            <FeaturedCard {...FEATURED} />
          </Reveal>

          <SectionDivider label="All Reviews" />

          {/* CAROUSEL */}
          <Reveal delay={0.1}>
            <div className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                {visibleIndices.map((dataIdx, slotIdx) => (
                  <TestimonialCard
                    key={`${dataIdx}-${slotIdx}`}
                    {...TESTIMONIALS[dataIdx]}
                    index={dataIdx}
                    isActive={slotIdx === 1}
                  />
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {TESTIMONIALS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === activeIndex
                          ? "w-5 h-1.5 bg-emerald-400 shadow-[0_0_8px_rgba(0,255,200,0.6)]"
                          : "w-1.5 h-1.5 bg-emerald-400/25 hover:bg-emerald-400/50"
                      }`}
                      aria-label={`Go to testimonial ${i + 1}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <MagneticButton onClick={prev}>
                    <button
                      className="font-mono text-[10px] uppercase tracking-[0.18em] px-4 py-2 rounded-sm border border-emerald-400/20 text-emerald-400/55 hover:border-emerald-400/40 hover:text-emerald-400/90 hover:bg-emerald-400/[0.06] transition-all duration-200"
                      aria-label="Previous"
                    >
                      ← Prev
                    </button>
                  </MagneticButton>
                  <MagneticButton onClick={next}>
                    <button
                      className="font-mono text-[10px] uppercase tracking-[0.18em] px-4 py-2 rounded-sm border border-emerald-400/70 bg-emerald-400/[0.06] text-emerald-400 hover:bg-emerald-400/20 shadow-[0_0_18px_rgba(0,255,200,0.1)] transition-all duration-300"
                      aria-label="Next"
                    >
                      Next →
                    </button>
                  </MagneticButton>
                </div>
              </div>

              {/* Autoplay toggle */}
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => setAutoplay((p) => !p)}
                  className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-400/35 hover:text-emerald-400/65 transition-colors duration-200"
                >
                  <span
                    className={`size-1.5 rounded-full transition-colors duration-300 ${autoplay ? "bg-emerald-400 shadow-[0_0_6px_#00ffc8]" : "bg-emerald-400/25"}`}
                  />
                  {autoplay ? "Autoplay On" : "Autoplay Off"}
                </button>
              </div>
            </div>
          </Reveal>

          <SectionDivider label="Connect" />

          {/* BOTTOM CTA */}
          <Reveal delay={0.1}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-emerald-400/40 mb-1">
                  Ready to join them?
                </p>
                <p className="text-sm text-emerald-200/50 max-w-xs leading-relaxed">
                  Let's build something that your clients will rave about.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 sm:ml-auto">
                

                <MagneticButton>
                  <button
                    onClick={onContactClick}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] font-mono text-emerald-400 rounded-sm border border-emerald-400/70 bg-emerald-400/[0.06] hover:bg-emerald-400/20 shadow-[0_0_18px_rgba(0,255,200,0.1)] transition-all duration-300"
                  >
                    CONTACT →
                  </button>
                </MagneticButton>
              </div>
            </div>
          </Reveal>

          {/* Footer tag */}
          <motion.div
            className="mt-12 sm:mt-16 flex items-center justify-between"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8, duration: 1 }}
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




