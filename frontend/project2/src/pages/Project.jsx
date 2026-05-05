// frontend/src/pages/Project.jsx

import apiClient from "../utils/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";

const PAGE_SIZE = 8;

export default function ProjectsManager({ onBack }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [techFilter, setTechFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("latest");
  const [page, setPage] = useState(1);

  // ── Fetch projects ───────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error: err } = await apiClient.get("/api/projects");
        if (cancelled) return;
        if (err) {
          setError(err);
          setProjects([]);
        } else {
          setProjects(data || []);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError("Could not load projects");
          setProjects([]);
        }
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Debounce search ──────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // ── All unique techs ─────────────────────────────────────
  const allTechs = useMemo(() => {
    const set = new Set();
    projects.forEach((p) => (p.technologies || []).forEach((t) => set.add(t)));
    return ["All", ...Array.from(set).sort()];
  }, [projects]);

  // ── Filtered + sorted list ───────────────────────────────
  const filtered = useMemo(() => {
    let list = [...projects];
    if (debounced) {
      const q = debounced.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          (p.technologies || []).some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (techFilter !== "All") {
      list = list.filter((p) => (p.technologies || []).includes(techFilter));
    }
    list.sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return sortOrder === "latest" ? db - da : da - db;
    });
    return list;
  }, [projects, debounced, techFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const handleTechFilter = useCallback((v) => {
    setTechFilter(v);
    setPage(1);
  }, []);
  const handleSort = useCallback((v) => {
    setSortOrder(v);
    setPage(1);
  }, []);

  // ✅ FIX: Opens live link in new tab — no internal navigation
  const viewProject = useCallback((liveLink) => {
    if (!liveLink) return;
    window.open(liveLink, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Syne:wght@400;700;800&display=swap');
        * { box-sizing: border-box; }
        body { background:#040c10; font-family:'Space Grotesk',sans-serif; color:#e0fff8; margin:0; }
        input::placeholder { color:rgba(180,240,225,0.35); }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(10,255,178,0.2); border-radius:3px; }
        @keyframes skPulse { 0%,100%{opacity:0.45;} 50%{opacity:0.85;} }
        @keyframes fadeIn  { from{opacity:0;} to{opacity:1;} }
        @keyframes headerIn { from{opacity:0;transform:translateY(-18px);} to{opacity:1;transform:none;} }
      `}</style>

      {/* Back button */}
      <motion.button
        onClick={onBack}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed cursor-pointer top-5 left-5 z-[9999] px-5 py-2.5 text-sm font-semibold tracking-wide text-emerald-300 border border-emerald-400/30 rounded-xl backdrop-blur-xl bg-black/40 hover:bg-black/60 hover:border-emerald-400/60 transition-all duration-300 shadow-lg shadow-emerald-500/10"
      >
        ← Back
      </motion.button>

      <AnimatedBackground />

      <div className="fixed inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_at_60%_30%,rgba(0,60,50,0.32)_0%,transparent_68%),radial-gradient(ellipse_at_10%_80%,rgba(0,30,50,0.28)_0%,transparent_58%)]" />

      <div className="relative z-10 min-h-screen flex flex-col items-center px-4 pt-20 pb-20">
        {/* Header */}
        <div className="w-full max-w-[720px] mb-8 animate-[headerIn_0.5s_ease]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0affb2] opacity-80">
            Selected Work
          </span>
          <h1 className="font-['Syne',sans-serif] text-[clamp(26px,5vw,38px)] font-extrabold tracking-[-0.02em] mt-1 mb-0 bg-gradient-to-r from-[#0affb2] to-[#00e5ff] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
            Portfolio Projects
          </h1>
          <div className="mt-[6px] h-[2px] w-12 rounded-sm bg-gradient-to-r from-[#0affb2] to-transparent" />
        </div>

        {/* Controls */}
        <div className="w-full max-w-[720px] mb-6 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="flex-1 bg-[rgba(10,38,32,0.7)] border border-emerald-400/20 rounded-xl px-4 py-2.5 text-sm text-emerald-100 placeholder-emerald-400/35 focus:border-emerald-400/50 focus:outline-none transition-colors"
          />
          <select
            value={techFilter}
            onChange={(e) => handleTechFilter(e.target.value)}
            className="bg-[rgba(10,38,32,0.7)] border border-emerald-400/20 rounded-xl px-4 py-2.5 text-sm text-emerald-100 focus:border-emerald-400/50 focus:outline-none transition-colors cursor-pointer"
          >
            {allTechs.map((t) => (
              <option key={t} value={t} className="bg-[#040c10]">
                {t}
              </option>
            ))}
          </select>
          <select
            value={sortOrder}
            onChange={(e) => handleSort(e.target.value)}
            className="bg-[rgba(10,38,32,0.7)] border border-emerald-400/20 rounded-xl px-4 py-2.5 text-sm text-emerald-100 focus:border-emerald-400/50 focus:outline-none transition-colors cursor-pointer"
          >
            <option value="latest" className="bg-[#040c10]">
              Latest
            </option>
            <option value="oldest" className="bg-[#040c10]">
              Oldest
            </option>
          </select>
        </div>

        {/* Result count */}
        <div className="w-full max-w-[720px] mb-4 flex items-center justify-between">
          <h3 className="font-['Syne',sans-serif] text-[13px] font-bold uppercase tracking-[0.1em] text-[rgba(180,240,225,0.45)]">
            Projects
          </h3>
          {!loading && (
            <span className="rounded-[20px] border border-[rgba(10,255,178,0.2)] bg-[rgba(10,255,178,0.12)] px-[10px] py-[2px] text-[12px] font-bold text-[#0affb2]">
              {filtered.length}
            </span>
          )}
        </div>

        {/* List */}
        <div className="w-full max-w-[720px] animate-[fadeIn_0.4s_0.2s_both_ease]">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[0, 0.15, 0.3, 0.45].map((d, i) => (
                <SkeletonCard key={i} delay={d} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400/80 font-mono text-sm">
              {error}
            </div>
          ) : paginated.length === 0 ? (
            <EmptyState hasSearch={!!debounced || techFilter !== "All"} />
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid md:grid-cols-2 gap-6">
                {paginated.map((p, i) => (
                  <ProjectCard
                    key={p._id || i}
                    project={p}
                    index={i}
                    onView={() => viewProject(p.liveLink || p.link)}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="mt-10 flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl border border-emerald-400/20 text-emerald-300 text-sm disabled:opacity-30 hover:border-emerald-400/50 transition-colors"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-9 h-9 rounded-xl border text-sm font-mono transition-colors ${
                  n === page
                    ? "border-emerald-400 bg-emerald-400/20 text-emerald-300"
                    : "border-emerald-400/20 text-emerald-400/60 hover:border-emerald-400/50"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl border border-emerald-400/20 text-emerald-300 text-sm disabled:opacity-30 hover:border-emerald-400/50 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── PROJECT CARD ─────────────────────────────────────────────────────────────
function ProjectCard({ project: p, index, onView }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const hasLink = !!(p.liveLink || p.link);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        delay: index * 0.06,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ scale: 1.03, rotateX: 2, rotateY: -2 }}
      className="group relative rounded-2xl overflow-hidden border border-emerald-400/20 bg-white/5 backdrop-blur-xl flex flex-col"
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Image */}
      <div className="relative h-[200px] overflow-hidden bg-emerald-900/20">
        {!imgLoaded && (
          <div className="absolute inset-0 animate-[skPulse_1.6s_ease-in-out_infinite] bg-emerald-900/30" />
        )}
        <img
          src={p.image || `https://picsum.photos/seed/${p._id}/600/400`}
          alt={p.title}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        {(p.technologies || []).length > 0 && (
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
            {(p.technologies || []).slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-[9px] px-2 py-0.5 bg-black/60 border border-emerald-400/30 text-emerald-300 rounded-full font-mono uppercase tracking-wider"
              >
                {t}
              </span>
            ))}
            {(p.technologies || []).length > 3 && (
              <span className="text-[9px] px-2 py-0.5 bg-black/60 border border-emerald-400/30 text-emerald-300 rounded-full font-mono">
                +{(p.technologies || []).length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        <h3 className="text-lg font-semibold text-white leading-tight">
          {p.title}
        </h3>
        <p className="text-sm text-emerald-100/60 leading-relaxed flex-1 line-clamp-3">
          {p.description || "No description available"}
        </p>
        <div className="flex items-center gap-3 pt-1">
          {/* ✅ FIX: opens external link — no navigate() */}
          <button
            onClick={onView}
            disabled={!hasLink}
            className="flex-1 py-2 rounded-xl bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-sm font-medium hover:bg-emerald-400/20 hover:border-emerald-400/60 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {hasLink ? "View Project ↗" : "No Link"}
          </button>
        </div>
      </div>

      {/* Glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="w-full h-full bg-emerald-400/5 blur-2xl" />
      </div>
    </motion.div>
  );
}

// ─── ANIMATED BACKGROUND ─────────────────────────────────────────────────────
function AnimatedBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    const particles = [];
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.4,
        alpha: Math.random() * 0.5 + 0.15,
      });
    }
    let _t = 0;
    const draw = () => {
      _t += 0.008;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x,
            dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(10,255,178,${0.07 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(10,255,178,${p.alpha})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />
  );
}

function SkeletonCard({ delay = 0 }) {
  return (
    <div
      className="h-[90px] rounded-2xl border border-[rgba(79,255,206,0.10)] bg-[rgba(10,38,32,0.7)] animate-[skPulse_1.6s_ease-in-out_infinite]"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

function EmptyState({ hasSearch }) {
  return (
    <div className="flex flex-col items-center gap-[14px] rounded-2xl border border-dashed border-[rgba(79,255,206,0.15)] px-6 py-12 text-center text-[rgba(180,240,225,0.4)] animate-[fadeIn_0.4s_ease]">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="opacity-40"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
      <p className="text-[13px] m-0">
        {hasSearch
          ? "No projects match your search ."
          : "No projects yet.."}
      </p>
    </div>
  );
}

