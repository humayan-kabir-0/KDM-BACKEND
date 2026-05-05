// BlackHole.jsx — Kabir Digital Matrix | v5.0
//
// Drop-in for Hero.jsx SpaceScene. Must render inside an existing <Canvas>.
// Also exports <BlackHoleScene> for standalone canvas usage.
//
// Architecture:
//   - Zero GC pressure per frame: all allocations are module-level or useMemo
//   - Instanced meshes for particles and jets
//   - Custom GLSL shaders: event-horizon Fresnel rim + accretion disk with
//     temperature gradient, Doppler brightening, and turbulent noise
//   - Enhanced planetary system: 3 distinct bodies (gas giant, rocky, ice world)
//   - MeshStandardMaterial with emissive + roughness/metalness for PBR-quality look
//   - Cinematic lighting: point corona, rim light, ambient, directional key
//   - Cinematic entry system: fade-in, scale-up, progressive particle visibility
//   - Mouse interaction: lerp-based rotation tracking with camera parallax
//   - Energy system: reactive glow/speed intensity driven by time + interaction
//   - Click transformation: collapse mode with zoom, acceleration, visual shift
//   - Lazy frame-skip option for low-end device support
//   - Error-safe: all refs are null-checked before mutation


import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useMemo, useState, useCallback, useEffect } from "react";
/* ═══════════════════════════════════════════════════════════════
   EASING + MATH UTILITIES
═══════════════════════════════════════════════════════════════ */

/** Sinusoidal orbit modulation for subtle, breathing orbital speed */
const breathe = (t, freq = 0.12, amp = 0.08) =>
  1.0 + amp * Math.sin(t * freq * Math.PI * 2);

/** Linear interpolation */
const lerp = (a, b, t) => a + (b - a) * t;

/** Clamp value between min and max */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/* ═══════════════════════════════════════════════════════════════
   SEEDED PSEUDO-RANDOM NUMBER GENERATOR
   Deterministic: eliminates Math.random() from render/init paths.
   Uses a simple mulberry32 algorithm.
═══════════════════════════════════════════════════════════════ */
function createSeededRandom(seed = 42) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ═══════════════════════════════════════════════════════════════
   GLSL — EVENT HORIZON: Fresnel photon-sphere rim
   Simulates gravitational lensing glow at the Schwarzschild radius.
═══════════════════════════════════════════════════════════════ */
const rimVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir   = normalize(-mvPos.xyz);
    vNormal    = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const rimFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3  uColor;
  uniform float uEnergy;

  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float ndv     = abs(dot(vNormal, vViewDir));
    float fresnel = pow(1.0 - ndv, 3.8);

    float ring  = smoothstep(0.58, 0.70, fresnel)
                * (1.0 - smoothstep(0.70, 0.86, fresnel));

    float pulse = 0.82
      + 0.10 * sin(uTime * 1.4)
      + 0.05 * sin(uTime * 3.7 + 1.1)
      + 0.03 * sin(uTime * 8.2 + 2.4);

    float energyBoost = 1.0 + uEnergy * 1.8;
    float glow  = (fresnel * pulse + ring * 18.0) * energyBoost;
    gl_FragColor = vec4(uColor * glow, glow * 0.94);
  }
`;

/* ═══════════════════════════════════════════════════════════════
   GLSL — ACCRETION DISK
═══════════════════════════════════════════════════════════════ */
const diskVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const diskFrag = /* glsl */ `
  uniform float uTime;
  uniform float uInnerR;
  uniform float uOuterR;
  uniform float uEnergy;

  varying vec2 vUv;

  float hash(vec2 p) {
    p  = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),               hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), f.x),
      f.y
    );
  }

  void main() {
    vec2  c = vUv - 0.5;
    float r = length(c) * 2.0;
    float theta = atan(c.y, c.x);

    if (r < 0.26 || r > 1.03) discard;

    float t = clamp((r - 0.26) / (1.03 - 0.26), 0.0, 1.0);

    vec3 innerC = vec3(1.00, 0.88, 0.72);
    vec3 midC   = vec3(1.00, 0.28, 0.04);
    vec3 outerC = vec3(0.28, 0.00, 0.00);
    vec3 col    = t < 0.45
      ? mix(innerC, midC,   t / 0.45)
      : mix(midC,   outerC, (t - 0.45) / 0.55);

    // Energy shifts disk toward hotter blue-white at high energy
    vec3 energyCol = mix(col, vec3(0.7, 0.9, 1.0), uEnergy * 0.35);

    float speedMult = 1.0 + uEnergy * 1.5;
    float doppler = 0.68 + 0.32 * cos(theta - uTime * 0.52 * speedMult);

    float swirl = theta / (2.0 * 3.14159) + uTime * (0.10 + 0.09 * (1.0 - t)) * speedMult;
    float n1    = noise(vec2(swirl * 9.0 + r * 3.2, uTime * 0.25));
    float n2    = noise(vec2(swirl * 18.0 - r * 4.5, uTime * 0.16 + 6.3));
    float turb  = 0.50 + 0.50 * (n1 * 0.62 + n2 * 0.38);

    float bri  = pow(1.0 - t, 0.55) * (0.28 + 0.72 * turb) * doppler;
    bri       *= smoothstep(0.0,  0.07, r - 0.26);
    bri       *= smoothstep(1.04, 0.88, r);
    bri       *= 1.0 + uEnergy * 0.8;

    gl_FragColor = vec4(energyCol * bri * 4.6, bri * 1.95);
  }
`;

/* ═══════════════════════════════════════════════════════════════
   GLSL — PLANET ATMOSPHERE: Fresnel atmospheric scattering rim
═══════════════════════════════════════════════════════════════ */
const atmVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    vNormal  = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;

const atmFrag = /* glsl */ `
  uniform vec3  uAtmColor;
  uniform float uIntensity;
  varying vec3  vNormal;
  varying vec3  vViewDir;

  void main() {
    float rim   = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.8);
    float alpha = rim * uIntensity;
    gl_FragColor = vec4(uAtmColor * rim, alpha);
  }
`;

/* ═══════════════════════════════════════════════════════════════
   MODULE-LEVEL PARTICLE DATA  (seeded deterministic — never random in render)
═══════════════════════════════════════════════════════════════ */
const PARTICLE_COUNT = 280;

const _initParticles = (() => {
  const rng = createSeededRandom(1337);
  const phase = new Float32Array(PARTICLE_COUNT);
  const speed = new Float32Array(PARTICLE_COUNT);
  const radii = new Float32Array(PARTICLE_COUNT);
  const ySprd = new Float32Array(PARTICLE_COUNT);
  const sizes = new Float32Array(PARTICLE_COUNT);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    phase[i] = rng() * Math.PI * 2;
    speed[i] = 0.035 + rng() * 0.085;
    radii[i] = 1.05 + rng() * 2.3;
    ySprd[i] = (rng() - 0.5) * 0.2;
    sizes[i] = 0.014 + rng() * 0.028;
  }
  return { phase, speed, radii, ySprd, sizes };
})();

const _ptPhase = _initParticles.phase;
const _ptSpeed = _initParticles.speed;
const _ptRadii = _initParticles.radii;
const _ptYSprd = _initParticles.ySprd;
const _ptSizes = _initParticles.sizes;

const JET_COUNT = 72;

const _initJets = (() => {
  const rng = createSeededRandom(9999);
  const phase = new Float32Array(JET_COUNT);
  const radius = new Float32Array(JET_COUNT);
  const speed = new Float32Array(JET_COUNT);
  const sign = new Int8Array(JET_COUNT);
  for (let i = 0; i < JET_COUNT; i++) {
    phase[i] = rng() * Math.PI * 2;
    radius[i] = rng() * 0.1;
    speed[i] = 0.38 + rng() * 0.52;
    sign[i] = i % 2 === 0 ? 1 : -1;
  }
  return { phase, radius, speed, sign };
})();

const _jtPhase = _initJets.phase;
const _jtRadius = _initJets.radius;
const _jtSpeed = _initJets.speed;
const _jtSign = _initJets.sign;

/* ═══════════════════════════════════════════════════════════════
   ACCRETION DISK
═══════════════════════════════════════════════════════════════ */
function AccretionDisk({ innerR = 0.66, outerR = 2.55, energyRef }) {
  const matRef = useRef();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uInnerR: { value: innerR },
      uOuterR: { value: outerR },
      uEnergy: { value: 0 },
    }),
    [innerR, outerR],
  );

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    matRef.current.uniforms.uEnergy.value = energyRef ? energyRef.current : 0;
  });

  return (
    <mesh rotation={[Math.PI * 0.5 + 0.17, 0, 0]}>
      <planeGeometry args={[outerR * 4.2, outerR * 4.2, 80, 80]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={diskVert}
        fragmentShader={diskFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EVENT HORIZON — singularity core + Fresnel photon-sphere rim
═══════════════════════════════════════════════════════════════ */
function EventHorizon({ radius = 0.54, energyRef }) {
  const rimRef = useRef();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0.52, 0.88, 1.0) },
      uEnergy: { value: 0 },
    }),
    [],
  );

  useFrame(({ clock }) => {
    if (!rimRef.current) return;
    rimRef.current.uniforms.uTime.value = clock.getElapsedTime();
    rimRef.current.uniforms.uEnergy.value = energyRef ? energyRef.current : 0;
  });

  return (
    <group>
      <mesh renderOrder={1}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial color={0x000000} depthWrite />
      </mesh>

      <mesh renderOrder={4}>
        <sphereGeometry args={[radius * 1.34, 64, 64]} />
        <shaderMaterial
          ref={rimRef}
          vertexShader={rimVert}
          fragmentShader={rimFrag}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.FrontSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════
   INFALLING PARTICLES — logarithmic spiral infall
═══════════════════════════════════════════════════════════════ */
function InfallParticles({ energyRef, visibilityRef }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = clock.getElapsedTime();
    const energy = energyRef ? energyRef.current : 0;
    const visible = visibilityRef ? visibilityRef.current : 1;
    const speedMul = 1.0 + energy * 2.0;
    const threshold = Math.floor(visible * PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      if (i >= threshold) {
        // Hide particle by scaling to zero
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }

      const phase = _ptPhase[i];
      const speed = _ptSpeed[i] * speedMul;
      const baseR = _ptRadii[i];

      const cycle = (t * speed + phase) % (Math.PI * 2);
      const frac = cycle / (Math.PI * 2);

      const r = baseR * (1.0 - frac) + 0.6 * frac;
      const angVel = (speed * 4.5) / (r * r + 0.08);
      const angle = phase + t * angVel;

      dummy.position.set(
        Math.cos(angle) * r,
        _ptYSprd[i] * (1.0 - frac * 0.75),
        Math.sin(angle) * r * 0.25,
      );
      dummy.scale.setScalar(_ptSizes[i] * (0.12 + 0.88 * (1.0 - frac)));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, PARTICLE_COUNT]}
      renderOrder={3}
    >
      <dodecahedronGeometry args={[1, 0]} />
      <meshBasicMaterial
        color={new THREE.Color(1.0, 0.68, 0.22)}
        transparent
        opacity={0.68}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

/* ═══════════════════════════════════════════════════════════════
   POLAR JETS — relativistic blue-shifted particle streams
═══════════════════════════════════════════════════════════════ */
function PolarJets({ energyRef }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = clock.getElapsedTime();
    const energy = energyRef ? energyRef.current : 0;
    const speedMul = 1.0 + energy * 2.5;

    for (let i = 0; i < JET_COUNT; i++) {
      const phase = _jtPhase[i];
      const baseR = _jtRadius[i];
      const spd = _jtSpeed[i] * speedMul;
      const sign = _jtSign[i];
      const frac = ((t * spd + phase) % (Math.PI * 2)) / (Math.PI * 2);
      const height = sign * frac * 3.0;
      const spread = baseR * (1.0 + frac * 1.5);
      const angle = phase + t * 0.55;

      dummy.position.set(
        Math.cos(angle) * spread,
        height,
        Math.sin(angle) * spread,
      );
      dummy.scale.setScalar(0.013 + 0.022 * (1.0 - frac));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, JET_COUNT]} renderOrder={3}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color={new THREE.Color(0.44, 0.76, 1.0)}
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

/* ═══════════════════════════════════════════════════════════════
   X-RAY CORONA — pulsing plasma halo above poles
═══════════════════════════════════════════════════════════════ */
function Corona({ radius = 0.54, energyRef }) {
  const meshRef = useRef();
  const lightRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const energy = energyRef ? energyRef.current : 0;

    const flicker =
      0.55 +
      0.45 *
        (Math.sin(t * 3.2) * 0.5 +
          Math.sin(t * 7.6) * 0.3 +
          Math.sin(t * 14.1) * 0.2);

    const intensityBoost = 1.0 + energy * 2.2;
    if (meshRef.current)
      meshRef.current.material.opacity = 0.16 * flicker * intensityBoost;
    if (lightRef.current)
      lightRef.current.intensity = 1.6 * flicker * intensityBoost;
  });

  return (
    <group>
      <mesh ref={meshRef} renderOrder={4}>
        <sphereGeometry args={[radius * 1.75, 24, 24]} />
        <meshBasicMaterial
          color={new THREE.Color(0.92, 0.52, 1.0)}
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        color="#ff7733"
        intensity={1.6}
        distance={8}
        decay={2.2}
      />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ATMOSPHERE HALO — reusable per-planet atmospheric rim shader
═══════════════════════════════════════════════════════════════ */
function AtmosphereHalo({ color, radius, intensity = 0.55 }) {
  const uniforms = useMemo(
    () => ({
      uAtmColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
    }),
    [color, intensity],
  );

  return (
    <mesh scale={1.1} renderOrder={2}>
      <sphereGeometry args={[radius, 32, 32]} />
      <shaderMaterial
        vertexShader={atmVert}
        fragmentShader={atmFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GAS GIANT — large banded planet with dual ring system
═══════════════════════════════════════════════════════════════ */
function GasGiant({ position = [4.2, 0.4, -3.2] }) {
  const bodyRef = useRef();
  const ring1Ref = useRef();
  const groupRef = useRef();

  const bandTexture = useMemo(() => {
    const rng = createSeededRandom(1111);
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0.0, "#1a0d05");
    grad.addColorStop(0.1, "#3b1a08");
    grad.addColorStop(0.2, "#5c2d12");
    grad.addColorStop(0.3, "#7a3a18");
    grad.addColorStop(0.38, "#c26520");
    grad.addColorStop(0.44, "#e88833");
    grad.addColorStop(0.5, "#c26520");
    grad.addColorStop(0.56, "#a04515");
    grad.addColorStop(0.65, "#6b2e10");
    grad.addColorStop(0.72, "#3e1a08");
    grad.addColorStop(0.82, "#5c2d12");
    grad.addColorStop(0.9, "#2a1006");
    grad.addColorStop(1.0, "#0f0602");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y += 2) {
      const alpha = 0.04 + rng() * 0.06;
      ctx.fillStyle = `rgba(255, 200, 120, ${alpha})`;
      ctx.fillRect(0, y, size, 1 + Math.floor(rng() * 3));
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 1);
    return tex;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (bodyRef.current) {
      bodyRef.current.rotation.y = t * 0.075 * breathe(t, 0.04, 0.06);
      bodyRef.current.rotation.x = Math.sin(t * 0.11) * 0.06;
    }
    if (ring1Ref.current) ring1Ref.current.rotation.z = t * 0.038;
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t * 0.28) * 0.14;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh ref={bodyRef} castShadow>
        <sphereGeometry args={[1.45, 64, 64]} />
        <meshStandardMaterial
          map={bandTexture}
          roughness={0.72}
          metalness={0.18}
          emissive={new THREE.Color(0.18, 0.07, 0.01)}
          emissiveIntensity={0.25}
        />
      </mesh>
      <AtmosphereHalo color="#d4681a" radius={1.45} intensity={0.48} />
      <mesh ref={ring1Ref} rotation={[Math.PI / 2.6, 0.28, 0]}>
        <torusGeometry args={[2.35, 0.065, 6, 128]} />
        <meshStandardMaterial
          color="#8b4513"
          roughness={0.9}
          metalness={0.15}
          emissive={new THREE.Color(0.25, 0.1, 0.02)}
          emissiveIntensity={0.35}
          transparent
          opacity={0.72}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[2.75, 0.028, 4, 160]} />
        <meshStandardMaterial
          color="#5a3020"
          roughness={1.0}
          emissive={new THREE.Color(0.12, 0.04, 0.01)}
          emissiveIntensity={0.2}
          transparent
          opacity={0.45}
        />
      </mesh>
      <pointLight color="#1a4080" intensity={0.9} distance={5} decay={2} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROCKY PLANET — mid-range volcanic body
═══════════════════════════════════════════════════════════════ */
function RockyPlanet({ position = [1.8, 2.2, -5.5] }) {
  const bodyRef = useRef();
  const groupRef = useRef();

  const { surfaceTex, roughTex } = useMemo(() => {
    const rng = createSeededRandom(2222);
    const size = 256;

    const c1 = document.createElement("canvas");
    c1.width = size;
    c1.height = size;
    const g1 = c1.getContext("2d");
    g1.fillStyle = "#2a1005";
    g1.fillRect(0, 0, size, size);

    for (let i = 0; i < 1200; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const r = rng() * 6 + 1;
      const v = Math.floor(rng() * 60 + 20);
      g1.beginPath();
      g1.arc(x, y, r, 0, Math.PI * 2);
      g1.fillStyle = `rgb(${v + 30}, ${v}, ${v - 10})`;
      g1.fill();
    }

    for (let i = 0; i < 30; i++) {
      g1.beginPath();
      g1.moveTo(rng() * size, rng() * size);
      g1.lineTo(rng() * size, rng() * size);
      g1.strokeStyle = `rgba(200, 80, 10, ${0.3 + rng() * 0.3})`;
      g1.lineWidth = rng() * 2 + 0.5;
      g1.stroke();
    }

    const surfaceTex = new THREE.CanvasTexture(c1);

    const c2 = document.createElement("canvas");
    c2.width = size;
    c2.height = size;
    const g2 = c2.getContext("2d");
    g2.fillStyle = "#777";
    g2.fillRect(0, 0, size, size);
    for (let i = 0; i < 400; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const v = Math.floor(rng() * 200 + 30);
      g2.beginPath();
      g2.arc(x, y, rng() * 12 + 2, 0, Math.PI * 2);
      g2.fillStyle = `rgb(${v}, ${v}, ${v})`;
      g2.fill();
    }
    const roughTex = new THREE.CanvasTexture(c2);

    return { surfaceTex, roughTex };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (bodyRef.current) {
      bodyRef.current.rotation.y = t * 0.035;
      bodyRef.current.rotation.x = Math.sin(t * 0.06) * 0.04;
    }
    if (groupRef.current) {
      groupRef.current.position.y =
        position[1] + Math.sin(t * 0.34 + 1.2) * 0.1;
      groupRef.current.position.x =
        position[0] + Math.sin(t * 0.16 + 0.5) * 0.06;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh ref={bodyRef} castShadow>
        <sphereGeometry args={[0.82, 48, 48]} />
        <meshStandardMaterial
          map={surfaceTex}
          roughnessMap={roughTex}
          roughness={0.88}
          metalness={0.1}
          emissive={new THREE.Color(0.35, 0.08, 0.01)}
          emissiveIntensity={0.4}
        />
      </mesh>
      <AtmosphereHalo color="#ff5500" radius={0.82} intensity={0.38} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ICE WORLD — distant icy body with teal subsurface glow
═══════════════════════════════════════════════════════════════ */
function IceWorld({ position = [-2.2, 3.0, -7.0] }) {
  const bodyRef = useRef();
  const groupRef = useRef();

  const iceTex = useMemo(() => {
    const rng = createSeededRandom(3333);
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#c8e8f0";
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 80; i++) {
      ctx.beginPath();
      ctx.moveTo(rng() * size, rng() * size);
      const steps = Math.floor(rng() * 6 + 3);
      for (let s = 0; s < steps; s++) {
        ctx.lineTo(rng() * size, rng() * size);
      }
      ctx.strokeStyle = `rgba(10, 120, 160, ${0.15 + rng() * 0.2})`;
      ctx.lineWidth = rng() * 1.5 + 0.3;
      ctx.stroke();
    }

    for (let i = 0; i < 600; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const a = 0.04 + rng() * 0.08;
      ctx.beginPath();
      ctx.arc(x, y, rng() * 8 + 1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 200, 240, ${a})`;
      ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (bodyRef.current) {
      bodyRef.current.rotation.y = t * 0.022;
    }
    if (groupRef.current) {
      groupRef.current.position.y =
        position[1] + Math.sin(t * 0.19 + 2.1) * 0.12;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh ref={bodyRef} castShadow>
        <sphereGeometry args={[0.62, 44, 44]} />
        <meshStandardMaterial
          map={iceTex}
          roughness={0.45}
          metalness={0.3}
          emissive={new THREE.Color(0.0, 0.22, 0.3)}
          emissiveIntensity={0.2}
        />
      </mesh>
      <AtmosphereHalo color="#00e5ff" radius={0.62} intensity={0.55} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOON — orbits the gas giant
═══════════════════════════════════════════════════════════════ */
function Moon({ parentPos = [4.2, 0.4, -3.2] }) {
  const ref = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const r = 3.6;
    if (!ref.current) return;
    ref.current.position.x = parentPos[0] + Math.cos(t * 0.62) * r;
    ref.current.position.y = parentPos[1] + Math.sin(t * 0.62) * 0.85;
    ref.current.position.z = parentPos[2] + Math.sin(t * 0.62) * r * 0.3;
    ref.current.rotation.y += 0.008;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.34, 32, 32]} />
      <meshStandardMaterial
        color="#404858"
        roughness={0.92}
        metalness={0.22}
        emissive="#112030"
        emissiveIntensity={0.08}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CINEMATIC LIGHTING RIG
═══════════════════════════════════════════════════════════════ */
function LightingRig() {
  const keyRef = useRef();
  const rimRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (keyRef.current)
      keyRef.current.intensity = 0.42 + 0.04 * Math.sin(t * 0.22);
    if (rimRef.current)
      rimRef.current.intensity = 0.28 + 0.04 * Math.sin(t * 0.22 + Math.PI);
  });

  return (
    <>
      <ambientLight color="#041814" intensity={0.22} />
      <directionalLight
        ref={keyRef}
        position={[6, 8, 4]}
        color="#ffe8c8"
        intensity={0.42}
        castShadow={false}
      />
      <directionalLight
        ref={rimRef}
        position={[-4, -3, -6]}
        color="#80c8ff"
        intensity={0.28}
      />
      <pointLight
        position={[0, -8, -2]}
        color="#3a1060"
        intensity={0.55}
        distance={18}
        decay={2}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CAMERA CONTROLLER
═══════════════════════════════════════════════════════════════ */


function CameraController({ modeRef, mouseRef }) {
  const targetPos = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const currentPos = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame(({ camera }) => {

    const mode = modeRef.current;

    const mouse = mouseRef.current;

    // Increased Z distance + slight upward shift using Y offset
    if (mode === "idle") {
      targetPos.set(mouse.x * 4, mouse.y * 0.3 + 1.2, 15);
    } else if (mode === "hover") {
      targetPos.set(mouse.x * 0.5, mouse.y * 0.4 + 1.2, 95);
    } else if (mode === "focus") {
      targetPos.set(mouse.x * 0.2, mouse.y * 0.2 + 1.2, 88);
    } else if (mode === "collapse") {
      targetPos.set(mouse.x * 0.1, mouse.y * 0.1 + 1.2, 68);
    }

    const lerpSpeed = mode === "collapse" ? 0.035 : 0.6;
    currentPos.lerp(targetPos, lerpSpeed);
    camera.position.lerp(currentPos, 0.12);
    camera.lookAt(-2, -3.5, 0);
  });

  return null;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT — BlackHole
   Integrates:
     • Cinematic intro (fade-in, scale-up, particle reveal)
     • Mouse interaction (lerp-based group rotation)
     • Energy system (time + interaction driven 0→1)
     • Click transformation (collapse mode)
═══════════════════════════════════════════════════════════════ */
export default function BlackHole({ position = [-3, -1, -1] }) {
  const groupRef = useRef();

  // ── Cinematic entry state ──
  const introProgress = useRef(0); // 0 → 1 over ~2.5s
  const introScale = useRef(0.01); // Starts tiny, scales up
  const particleReveal = useRef(0); // Progressive particle visibility

  // ── Mouse tracking ──
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRotY = useRef(0);
  const targetRotX = useRef(0);

  // ── Energy system ──
  const energyRef = useRef(0); // 0 → 1, drives glow/speed

  // ── Interaction mode ──
  const [mode, setMode] = useState("idle");
  const modeRef = useRef("idle");
  // Sync modeRef with mode state for useFrame access


  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // ── Collapse state ──
  const collapseProgress = useRef(0);

  const handlePointerMove = useCallback((e) => {
    // Normalize to [-1, 1]
    mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    if (modeRef.current === "idle") setMode("hover");
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (modeRef.current === "hover") setMode("idle");
  }, []);

  const handleClick = useCallback(() => {
    if (modeRef.current !== "collapse") {
      setMode("collapse");
      collapseProgress.current = 0;
    } else {
      setMode("idle");
    }
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const grp = groupRef.current;
    if (!grp) return;

    // ── Cinematic intro ──
    if (introProgress.current < 1.0) {
      introProgress.current = clamp(introProgress.current + 0.006, 0, 1);
      const ease =
        introProgress.current < 0.5
          ? 2 * introProgress.current * introProgress.current
          : 1 - Math.pow(-2 * introProgress.current + 2, 2) / 2;
      introScale.current = lerp(0.01, 1.0, ease);
      particleReveal.current = clamp(introProgress.current * 1.4 - 0.3, 0, 1);
      grp.scale.setScalar(introScale.current);
    } else {
      grp.scale.setScalar(1.0);
      particleReveal.current = 1.0;
    }

    // ── Mouse interaction — lerp rotation ──
    const mouse = mouseRef.current;
    const rotSpeed = modeRef.current === "collapse" ? 0.015 : 0.04;
    targetRotY.current = lerp(targetRotY.current, mouse.x * 0.35, rotSpeed);
    targetRotX.current = lerp(targetRotX.current, mouse.y * 0.2, rotSpeed);

    // ── Base idle sway + mouse-driven rotation ──
    grp.rotation.y = t * 0.018 + targetRotY.current;
    grp.rotation.z = Math.sin(t * 0.07) * 0.035;
    grp.rotation.x = targetRotX.current * 0.5;

    // ── Energy system — builds over time + spikes on collapse ──
    const baseEnergy = clamp(t * 0.012, 0, 0.6); // Slowly grows
    const collapseBoost =
      modeRef.current === "collapse"
        ? clamp(collapseProgress.current, 0, 0.4)
        : 0;
    energyRef.current = clamp(baseEnergy + collapseBoost, 0, 1.0);

    // ── Collapse progression ──
    if (modeRef.current === "collapse") {
      collapseProgress.current = clamp(collapseProgress.current + 0.008, 0, 1);
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
    >
      

{/* controller  */}


      <CameraController modeRef={modeRef} mouseRef={mouseRef} />
      <EventHorizon radius={1} energyRef={energyRef} />
      <AccretionDisk innerR={0.1} outerR={4} energyRef={energyRef} />
      <InfallParticles energyRef={energyRef} visibilityRef={particleReveal} />
      <PolarJets energyRef={energyRef} />
      <Corona radius={1.2} energyRef={energyRef} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STANDALONE SCENE — drop-in for own <Canvas>
   Includes full planetary system + lighting.
═══════════════════════════════════════════════════════════════ */
export function BlackHoleScene() {
  return (
    <>
      <color attach="background" args={["#030c0e"]} />
      <LightingRig />
      <BlackHole position={[0, 0, 0]} />
      <GasGiant position={[5.5, 0.5, -3.5]} />
      <RockyPlanet position={[2.2, 2.5, -5.5]} />
      <IceWorld position={[-3.0, 3.2, -7.0]} />
      <Moon parentPos={[5.5, 0.5, -3.5]} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PLANET SYSTEM — export for use directly inside SpaceScene
   Drop this component next to <BlackHole> in Hero's SpaceScene.
═══════════════════════════════════════════════════════════════ */
export function PlanetSystem() {
  return (
    <>
      <LightingRig />
      <GasGiant position={[4.2, 0.4, -3.2]} />
      <RockyPlanet position={[1.8, 2.2, -5.5]} />
      <IceWorld position={[-2.2, 3.0, -7.0]} />
      <Moon parentPos={[4.2, 0.4, -3.2]} />
    </>
  );
}





