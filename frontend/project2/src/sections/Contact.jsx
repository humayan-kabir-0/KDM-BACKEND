/**
 * Contact.jsx — Kabir Digital Matrix Portfolio
 *
 * FIXES vs original:
 *   1. Canvas is `absolute` — strictly contained, no fixed bleed into other sections
 *   2. Corner accents are `absolute` (not `fixed`) — scoped to this component
 *   3. Side label is `absolute` — scoped to this component
 *   4. Accepts `onBack` prop from OverlayPanel for proper overlay-aware navigation
 *   5. Fixed opacity values that were numbers > 1 in meshBasicMaterial (invalid)
 *   6. Removed `useInView` import (was imported but unused)
 *
 * Place at: src/sections/Contact.jsx
 */
import apiClient from "../utils/apiClient";
import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
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
const _NEBULA_POS = Array.from({ length: 140 }, () => [
  (Math.random() - 0.5) * 24,
  (Math.random() - 0.5) * 14,
  (Math.random() - 0.5) * 8 - 4,
]);
const _NEBULA_TEAL = Array.from({ length: 140 }, () => Math.random() > 0.5);
const _RING_DATA = Array.from({ length: 5 }, (_, i) => ({
  radius: 1.8 + i * 0.55,
  tube: 0.012 + i * 0.004,
  speed: 0.06 + i * 0.025,
  tilt: Math.PI / 3 + i * 0.22,
  phase: (i / 5) * Math.PI * 2,
  opacity: 0.35 - i * 0.05,
}));

/* ══════════════════════════════════════════════════════════════
   3D — NEBULA
══════════════════════════════════════════════════════════════ */
function Nebula({ count = 140 }) {
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
        size={0.05}
        vertexColors
        transparent
        opacity={1}
        sizeAttenuation
      />
    </points>
  );
}

/* ══════════════════════════════════════════════════════════════
   3D — CONTACT ORBS
══════════════════════════════════════════════════════════════ */
function ContactOrb({ position, color, emissive, size = 1.0, speed = 0.05 }) {
  const mesh = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    mesh.current.rotation.y = t * speed;
    mesh.current.rotation.x = Math.sin(t * speed * 0.6) * 0.12;
  });
  return (
    <Float speed={0.5} rotationIntensity={0.1} floatIntensity={5}>
      <mesh ref={mesh} position={position}>
        <sphereGeometry args={[size, 48, 48]} />
        <MeshDistortMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.5}
          distort={0.25}
          speed={1.5}
          roughness={0.75}
          metalness={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>
    </Float>
  );
}

/* ══════════════════════════════════════════════════════════════
   3D — TRANSMISSION RINGS
══════════════════════════════════════════════════════════════ */
function TransmissionRings() {
  const group = useRef();
  useFrame(({ clock }) => {
    group.current.rotation.y = clock.getElapsedTime() * 0.06;
  });
  return (
    <group ref={group} position={[-3.5, -0.5, -2]}>
      {_RING_DATA.map((d, i) => (
        <mesh key={i} rotation={[d.tilt, d.phase, 0]}>
          <torusGeometry args={[d.radius, d.tube, 12, 90]} />
          <meshStandardMaterial
            color="#00ffc8"
            emissive="#00ffc8"
            emissiveIntensity={0.5}
            transparent
            opacity={d.opacity}
          />
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial
          color="#00ffc8"
          emissive="#00ffc8"
          emissiveIntensity={3}
        />
      </mesh>
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════
   3D — CAMERA RIG
══════════════════════════════════════════════════════════════ */
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
    cam.position.x += (mouse.current.x * 0.5 - cam.position.x) * 0.03;
    cam.position.y += (mouse.current.y * 0.25 - cam.position.y) * 0.03;
    cam.lookAt(0, 0, 0);
  });
  return null;
}

/* ══════════════════════════════════════════════════════════════
   3D — CONTACT SCENE
══════════════════════════════════════════════════════════════ */
function ContactScene() {
  return (
    <>
      <CameraRig />
      <ambientLight intensity={0.2} color="#0d2030" />
      <directionalLight position={[4, 4, 4]} intensity={0.35} color="#ffffff" />
      <pointLight
        position={[-4, 0, -2]}
        intensity={6}
        color="#00ffc8"
        distance={4}
      />
      <Stars
        radius={80}
        depth={60}
        count={4500}
        factor={3}
        saturation={0.2}
        fade
        speed={0.5}
      />
      <Suspense fallback={null}>
        <Nebula />
        <ContactOrb
          position={[4, 0.8, -3.5]}
          color="#0b1520"
          emissive="#0a2030"
          size={1.3}
          speed={0.06}
        />
        <ContactOrb
          position={[-5, -1.5, -5]}
          color="#0a1a12"
          emissive="#002a18"
          size={0.8}
          speed={0.09}
        />
        <TransmissionRings />
      </Suspense>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAGNETIC BUTTON
══════════════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════════════
   REVEAL ON SCROLL
══════════════════════════════════════════════════════════════ */
function RevealOnScroll({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CONTACT INFO ITEM
══════════════════════════════════════════════════════════════ */
function ContactInfoItem({ icon, label, value, href, delay }) {
  const [hovered, setHovered] = useState(false);
  const Tag = href ? "a" : "div";
  return (
    <RevealOnScroll delay={delay}>
      <Tag
        href={href}
        target={href ? "_blank" : undefined}
        rel={href ? "noopener noreferrer" : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ display: "flex" }}
        className={`group flex items-center gap-3 p-3 sm:p-4 rounded border transition-all duration-300 no-underline ${hovered ? "border-emerald-400/30 bg-emerald-400/[0.04]" : "border-emerald-400/[0.08] bg-transparent"}`}
      >
        <span
          className={`font-mono text-base sm:text-lg transition-colors duration-200 ${hovered ? "text-emerald-400" : "text-emerald-400/40"}`}
        >
          {icon}
        </span>
        <div className="flex flex-col min-w-0">
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-emerald-400/35 mb-0.5">
            {label}
          </span>
          <span
            className={`font-mono text-[11px] sm:text-xs tracking-wide truncate transition-colors duration-200 ${hovered ? "text-emerald-300" : "text-emerald-200/55"}`}
          >
            {value}
          </span>
        </div>
        {href && (
          <motion.span
            className="ml-auto font-mono text-emerald-400/40 text-xs"
            animate={{ x: hovered ? 3 : 0, opacity: hovered ? 1 : 0.3 }}
            transition={{ duration: 0.2 }}
          >
            →
          </motion.span>
        )}
      </Tag>
    </RevealOnScroll>
  );
}

/* ══════════════════════════════════════════════════════════════
   FORM FIELD
══════════════════════════════════════════════════════════════ */
function FormField({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  isValid,
  isTouched,
  autoComplete,
  isTextarea = false,
}) {
  const [focused, setFocused] = useState(false);
  const Tag = isTextarea ? "textarea" : "input";
  const borderClass =
    error && isTouched
      ? "border-red-500/50 focus:border-red-400/70"
      : isValid
        ? "border-emerald-400/35 focus:border-emerald-400/55"
        : "border-emerald-400/[0.12] focus:border-emerald-400/40";

  return (
    <motion.div
      className="flex flex-col gap-1.5"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <label
        htmlFor={id}
        className={`font-mono text-[9px] uppercase tracking-[0.22em] transition-colors duration-200 ${focused ? "text-emerald-400/80" : "text-emerald-400/35"}`}
      >
        {label}
      </label>
      <div className="relative">
        <Tag
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={(e) => {
            setFocused(false);
            onBlur(e);
          }}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!(error && isTouched)}
          rows={isTextarea ? 5 : undefined}
          className={`w-full bg-slate-950/60 backdrop-blur-sm border rounded text-emerald-100/85 placeholder-emerald-400/[0.18] font-mono text-[12px] sm:text-[13px] tracking-wide outline-none transition-all duration-250 resize-none ${isTextarea ? "leading-relaxed py-3 px-4 min-h-[120px]" : "py-2.5 px-3 sm:py-3 sm:px-4"} ${borderClass}`}
          style={{ fontFamily: "'Syne Mono', monospace" }}
        />
        {isValid && !isTextarea && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-emerald-400 text-xs pointer-events-none"
          >
            ✓
          </motion.span>
        )}
      </div>
      <AnimatePresence>
        {error && isTouched && (
          <motion.span
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 font-mono text-[10px] text-red-400/80"
          >
            <span>⚠</span>
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   VALIDATION
══════════════════════════════════════════════════════════════ */
const FIELDS_DEF = [
  {
    name: "name",
    label: "Full Name",
    type: "text",
    placeholder: "Your name",
    autoComplete: "name",
  },
  {
    name: "email",
    label: "Email Address",
    type: "email",
    placeholder: "your@email.com",
    autoComplete: "email",
  },
];

const validate = (form) => {
  const e = {};
  if (!form.name.trim()) e.name = "Name is required";
  if (!form.email.trim()) e.email = "Email is required";
  else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
  if (!form.message.trim()) e.message = "Message cannot be empty";
  else if (form.message.trim().length < 10)
    e.message = "At least 10 characters";
  return e;
};

const INIT_FORM = { name: "", email: "", message: "" };

/* ══════════════════════════════════════════════════════════════
   CONTACT INFO DATA
══════════════════════════════════════════════════════════════ */
const CONTACT_INFO = [
  {
    icon: "✉",
    label: "Email",
    value: "humayunavengers@gmail.com",
    href: "mailto:humayunavengers@gmail.com",
  },
  { icon: "📍", label: "Location", value: "West Bengal, IN", href: null },
  {
    icon: "🌐",
    label: "Website",
    value: "kabirdigitalmatrix.com",
    href: "https://kabirdigitalmatrix.com",
  },
  { icon: "⏱", label: "Response", value: "Within 24 hours", href: null },
];

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   Props: onBack — from OverlayPanel close handler
══════════════════════════════════════════════════════════════ */
export default function Contact({ onBack }) {
  const containerRef = useRef(null);
  const successRef = useRef(null);
  const [form, setForm] = useState(INIT_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [charCount, setCharCount] = useState(0);
  const [status, setStatus] = useState({
    loading: false,
    success: false,
    error: "",
  });

  const { scrollY } = useScroll();
  // Canvas fades to 35% opacity as user scrolls down into the form
  const canvasOpacity = useTransform(scrollY, [0, 300], [1, 0.35]);

  useEffect(() => {
    if (status.success && successRef.current) successRef.current.focus();
  }, [status.success]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "message") setCharCount(value.length);
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const newErr = validate({ ...form, [name]: value });
      setErrors((prev) => ({ ...prev, [name]: newErr[name] || "" }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const newErr = validate(form);
    setErrors((prev) => ({ ...prev, [name]: newErr[name] || "" }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const allTouched = { name: true, email: true, message: true };
  setTouched(allTouched);

  const newErr = validate(form);
  if (Object.keys(newErr).length > 0) {
    setErrors(newErr);
    return;
  }

  try {
    setStatus({ loading: true, success: false, error: "" });

const { error: err } = await apiClient.post("/api/contact", form);

    if (err) throw new Error(err);

    setStatus({ loading: false, success: true, error: "" });
    setForm(INIT_FORM);
    setTouched({});
    setErrors({});
    setCharCount(0);
  } catch (err) {
    setStatus({
      loading: false,
      success: false,
      error: err.message || "Failed to send. Please try again.",
    });
  }
};

  const handleReset = () => {
    setStatus({ loading: false, success: false, error: "" });
    setForm(INIT_FORM);
    setTouched({});
    setErrors({});
    setCharCount(0);
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Syne+Mono&display=swap');`}</style>

      <div
        ref={containerRef}
        className="relative min-h-screen overflow-x-hidden"
        style={{
          fontFamily: "'Syne', sans-serif",
          color: "#cce8e0",
          background: "#030c0e",
        }}
      >
        {/*
         * ── 3D CANVAS ──
         * `absolute` (not `fixed`) — strictly contained within this component.
         * The overlay scroll container clips it at the boundary.
         */}
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ opacity: canvasOpacity }}
        >
          <Canvas
            camera={{ position: [0, 0, 8], fov: 55 }}
            gl={{ antialias: true, alpha: true }}
            dpr={[1, 1.5]}
          >
            <ContactScene />
          </Canvas>
        </motion.div>

        {/* Overlays */}
        <div className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(3,10,14,0.78)_100%)]" />
        <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_75%_20%,rgba(0,60,48,0.2)_0%,transparent_55%),radial-gradient(ellipse_at_12%_85%,rgba(45,8,80,0.18)_0%,transparent_50%)]" />

        {/*
         * Corner accents are `absolute` to this component, not `fixed` to viewport.
         * This prevents them from appearing over other sections.
         */}
        <div className="absolute top-4 left-4   sm:top-5 sm:left-5   z-[15] size-10 sm:size-14 border-l border-t border-emerald-400/20 pointer-events-none" />
        <div className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 z-[15] size-10 sm:size-14 border-r border-b border-emerald-400/20 pointer-events-none" />
        <div className="absolute top-4 right-4   sm:top-5 sm:right-5   z-[15] size-5 sm:size-6  border-r border-t border-emerald-400/10 pointer-events-none" />
        <div className="absolute bottom-4 left-4  sm:bottom-5 sm:left-5  z-[15] size-5 sm:size-6  border-l border-b border-emerald-400/10 pointer-events-none" />

        {/* Side label — absolute to component */}
        <div className="hidden lg:block absolute right-6 xl:right-8 top-1/2 z-[15] pointer-events-none -translate-y-1/2 rotate-90 origin-center whitespace-nowrap font-mono text-[8px] tracking-[0.25em] text-emerald-400/[0.18]">
          Humayan Kabir — Contact Transmission
        </div>

        {/* CONTENT */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* NAV */}
          <motion.nav
            className="flex items-center justify-between px-5 sm:px-8 md:px-12 lg:px-16 pt-6 sm:pt-7"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.button
              onClick={onBack}
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-400/50 hover:text-emerald-400 transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
            >
              ← HK.Portfolio
            </motion.button>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400/30">
              Contact
            </span>
          </motion.nav>

          {/* MAIN */}
          <main
            id="contact"
            className="flex-1 px-5 sm:px-8 md:px-12 lg:px-16 py-14 sm:py-20 lg:py-24 w-full max-w-5xl mx-auto"
          >
            {/* HEADER */}
            <RevealOnScroll>
              <div className="mb-10 sm:mb-14">
                <motion.p
                  className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.28em] mb-4 text-emerald-400/80 flex items-center gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 0.9, x: 0 }}
                  transition={{
                    delay: 0.3,
                    duration: 0.7,
                    ease: [0.22, 1, 0.36, 1],
                  }}
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
                  Transmission Channel Open
                </motion.p>
                <motion.h1
                  className="font-black leading-tight bg-gradient-to-br from-white via-emerald-100 to-emerald-400 bg-clip-text text-[clamp(30px,7vw,72px)] mb-4"
                  style={{
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                  initial={{ opacity: 0, y: 50, skewY: 3 }}
                  animate={{ opacity: 1, y: 0, skewY: 0 }}
                  transition={{
                    delay: 0.5,
                    duration: 0.9,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <span className="block">LET'S BUILD</span>
                  <span className="block text-emerald-400/80">SOMETHING</span>
                  <span className="block">REMARKABLE</span>
                </motion.h1>
                <motion.p
                  className="max-w-sm sm:max-w-md text-sm sm:text-[15px] leading-relaxed text-emerald-200/40"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75, duration: 0.7 }}
                >
                  Have a project in mind or want to collaborate? Send a
                  transmission and I'll respond within 24 hours.
                </motion.p>
              </div>
            </RevealOnScroll>

            {/* TWO-COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 xl:gap-16 items-start">
              {/* LEFT — CONTACT INFO */}
              <div className="flex flex-col gap-3 order-2 lg:order-1">
                <RevealOnScroll>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-emerald-400/35">
                      Direct channels
                    </span>
                    <div className="flex-1 h-px bg-emerald-400/[0.08]" />
                  </div>
                </RevealOnScroll>

                {CONTACT_INFO.map((item, i) => (
                  <ContactInfoItem
                    key={item.label}
                    {...item}
                    delay={i * 0.08}
                  />
                ))}

                <RevealOnScroll delay={0.4}>
                  <div className="mt-4 p-4 rounded border border-emerald-400/[0.08] bg-emerald-400/[0.02]">
                    <div className="flex items-center gap-2 mb-3">
                      <motion.span
                        className="size-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#00ffc8,0_0_20px_rgba(0,255,200,0.4)]"
                        animate={{ scale: [1, 2, 1], opacity: [1, 0.5, 1] }}
                        transition={{
                          duration: 2.2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400/55">
                        Available for work
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-emerald-200/35 leading-relaxed tracking-wide">
                      Open to freelance projects, collaborations, and full-time
                      opportunities. Specializing in React, Node.js, Meta Ads &
                      digital systems.
                    </p>
                  </div>
                </RevealOnScroll>

                <RevealOnScroll delay={0.5}>
                  <div className="flex items-center gap-3 mt-2">
                    {[
                      {
                        label: "GitHub",
                        href: "https://github.com/humayan-kabir-0",
                      },
                      {
                        label: "LinkedIn",
                        href: "https://www.linkedin.com/in/humayan-kabir",
                      },
                      {
                        label: "Discord",
                        href: "https://discord.com/users/1435275397531959368",
                      },
                    ].map((s) => (
                      <MagneticButton key={s.label}>
                        <a
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-sm border border-emerald-400/15 text-emerald-400/45 hover:border-emerald-400/35 hover:text-emerald-400/80 hover:bg-emerald-400/[0.05] transition-all duration-200 no-underline"
                        >
                          {s.label}
                        </a>
                      </MagneticButton>
                    ))}
                  </div>
                </RevealOnScroll>
              </div>

              {/* RIGHT — FORM */}
              <div className="order-1 lg:order-2">
                <RevealOnScroll delay={0.1}>
                  <div className="relative rounded overflow-hidden border border-emerald-400/[0.1] bg-slate-950/55 backdrop-blur-md p-5 sm:p-7">
                    <div className="absolute inset-x-0 top-0    h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
                    <div className="flex items-center justify-between mb-5 sm:mb-6">
                      <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-emerald-400/35">
                        Transmission Form
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-400/25">
                        01 / 01
                      </span>
                    </div>

                    <AnimatePresence mode="wait">
                      {status.success ? (
                        /* SUCCESS STATE */
                        <motion.div
                          key="success"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{
                            duration: 0.4,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="text-center py-6 sm:py-10"
                          role="status"
                          aria-live="polite"
                          tabIndex={-1}
                          ref={successRef}
                        >
                          <div className="relative w-16 h-16 mx-auto mb-6">
                            <motion.div
                              className="absolute inset-0 rounded-full border border-emerald-400/40"
                              animate={{
                                scale: [1, 1.4, 1],
                                opacity: [0.6, 0, 0.6],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeOut",
                              }}
                            />
                            <div className="w-16 h-16 rounded-full border border-emerald-400/30 bg-emerald-400/[0.06] flex items-center justify-center">
                              <motion.span
                                className="font-mono text-emerald-400 text-xl"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                  delay: 0.2,
                                  type: "spring",
                                  stiffness: 200,
                                }}
                              >
                                ✓
                              </motion.span>
                            </div>
                          </div>
                          <h3
                            className="font-black text-xl sm:text-2xl mb-2 bg-gradient-to-r from-white to-emerald-300 bg-clip-text"
                            style={{
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              backgroundClip: "text",
                            }}
                          >
                            Transmission Received
                          </h3>
                          <p className="font-mono text-[12px] text-emerald-200/40 leading-relaxed max-w-xs mx-auto mb-6 tracking-wide">
                            Signal acquired. I'll process your message and
                            respond within 24 hours.
                          </p>
                          <MagneticButton>
                            <button
                              onClick={handleReset}
                              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] px-4 py-2 rounded-sm border border-emerald-400/20 text-emerald-400/55 hover:border-emerald-400/35 hover:text-emerald-400/80 hover:bg-emerald-400/[0.05] transition-all duration-200"
                            >
                              ↩ New Transmission
                            </button>
                          </MagneticButton>
                        </motion.div>
                      ) : (
                        /* FORM STATE */
                        <motion.form
                          key="form"
                          onSubmit={handleSubmit}
                          noValidate
                          aria-label="Contact form"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex flex-col gap-4"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {FIELDS_DEF.map((f) => (
                              <FormField
                                key={f.name}
                                id={f.name}
                                label={f.label}
                                type={f.type}
                                placeholder={f.placeholder}
                                value={form[f.name]}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={errors[f.name]}
                                isValid={
                                  touched[f.name] &&
                                  !errors[f.name] &&
                                  !!form[f.name]
                                }
                                isTouched={!!touched[f.name]}
                                autoComplete={f.autoComplete}
                              />
                            ))}
                          </div>
                          <FormField
                            id="message"
                            label="Message"
                            placeholder="Write about your project, timeline, or collaboration idea..."
                            value={form.message}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.message}
                            isValid={
                              touched.message &&
                              !errors.message &&
                              !!form.message
                            }
                            isTouched={!!touched.message}
                            isTextarea
                          />
                          <div className="flex justify-end -mt-2">
                            <span
                              className={`font-mono text-[10px] transition-colors duration-200 ${charCount > 450 ? "text-yellow-400/60" : "text-emerald-400/25"}`}
                            >
                              {charCount > 0 ? `${charCount} chars` : ""}
                            </span>
                          </div>

                          <AnimatePresence>
                            {status.error && (
                              <motion.div
                                role="alert"
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="flex items-start gap-2.5 p-3 rounded border border-red-500/20 bg-red-500/[0.06] font-mono text-[11px] text-red-400/80 leading-relaxed"
                              >
                                <span className="flex-shrink-0 mt-0.5">⚠</span>
                                <span>{status.error}</span>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <MagneticButton>
                            <motion.button
                              type="submit"
                              disabled={status.loading}
                              whileHover={
                                !status.loading ? { scale: 1.01 } : {}
                              }
                              whileTap={!status.loading ? { scale: 0.98 } : {}}
                              className="relative w-full overflow-hidden inline-flex items-center justify-center gap-2 px-6 py-3 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] font-mono text-emerald-400 rounded-sm border border-emerald-400/70 bg-emerald-400/[0.06] shadow-[0_0_18px_rgba(0,255,200,0.1)] hover:bg-emerald-400/20 hover:shadow-[0_0_32px_rgba(0,255,200,0.2)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-busy={status.loading}
                            >
                              {status.loading ? (
                                <>
                                  <motion.span
                                    className="size-3.5 rounded-full border border-emerald-400/30 border-t-emerald-400"
                                    animate={{ rotate: 360 }}
                                    transition={{
                                      duration: 0.7,
                                      repeat: Infinity,
                                      ease: "linear",
                                    }}
                                  />
                                  Transmitting…
                                </>
                              ) : (
                                "Send Transmission →"
                              )}
                            </motion.button>
                          </MagneticButton>

                          <p className="font-mono text-[9px] text-emerald-400/20 text-center tracking-wide">
                            Encrypted · No spam · Response within 24h
                          </p>
                        </motion.form>
                      )}
                    </AnimatePresence>

                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/15 to-transparent" />
                  </div>
                </RevealOnScroll>
              </div>
            </div>
          </main>

          {/* FOOTER */}
          <motion.footer
            className="px-5 sm:px-8 md:px-12 lg:px-16 py-5 sm:py-6 border-t border-emerald-400/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 1 }}
          >
            <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.15em] text-emerald-400/22">
              23°32′N 87°19′E — INDIA
            </span>
            <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.15em] text-emerald-400/22">
              2026 — v3.0.0
            </span>
          </motion.footer>
        </div>
      </div>
    </>
  );
}







 