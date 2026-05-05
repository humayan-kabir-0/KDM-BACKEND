// ProjectDetail.jsx — frontend/src/pages/ProjectDetail.jsx
// FIXES:
//   - useParams() to get :id from /project-detail/:id
//   - Fetches single project from /api/projects/:id
//   - Fetches related projects (same tech) from /api/projects
//   - Visit Live Site, Copy Link, Share, skeleton loading
//   - Scroll-based reveal animations
//   - Full error and not-found states

import { useParams, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import apiClient from "../utils/apiClient";

const EASE = [0.22, 1, 0.36, 1];

export default function ProjectDetail() {
  const { id } = useParams(); // ✅ reads /project-detail/:id
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const heroScale = useTransform(scrollY, [0, 400], [1, 1.08]);
  const heroOpacity = useTransform(scrollY, [0, 350], [1, 0.3]);

  // ── Fetch project by id ───────────────────────────────────
  useEffect(() => {
    if (!id) {
      setError("No project ID provided");
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        // Fetch single project
        const { data, error: err } = await apiClient.get(`/api/projects/${id}`);
        if (cancelled) return;
        if (err || !data) {
          setError(err || "Project not found");
          setLoading(false);
          return;
        }
        setProject(data);

        // Fetch related projects (same technology, exclude self)
        const { data: all } = await apiClient.get("/api/projects");
        if (!cancelled && Array.isArray(all)) {
          const techs = new Set(data.technologies || []);
          const rel = all
            .filter(
              (p) =>
                p._id !== data._id &&
                (p.technologies || []).some((t) => techs.has(t)),
            )
            .slice(0, 3);
          setRelated(rel);
        }
      } catch (e) {
        if (!cancelled) setError("Failed to load project");
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // ── Copy link ─────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  // ── Share ─────────────────────────────────────────────────
  const handleShare = useCallback(() => {
    if (navigator.share && project) {
      navigator
        .share({
          title: project.title,
          text: project.description,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      handleCopy();
    }
  }, [project, handleCopy]);

  // ── States ────────────────────────────────────────────────
  if (loading) return <LoadingState />;
  if (error || !project)
    return <ErrorState message={error} onBack={() => navigate("/project")} />;

  const {
    title,
    description,
    image,
    technologies = [],
    link,
    createdAt,
  } = project;
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
      })
    : null;

  return (
    <div
      className="min-h-screen bg-[#030a0e] text-[#e0fff8] overflow-x-hidden"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Syne:wght@400;700;800&display=swap');
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(10,255,178,0.2); border-radius: 3px; }
      `}</style>

      {/* ── Back button ──────────────────────────────────── */}
      <motion.button
        onClick={() => navigate(-1)}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: EASE, duration: 0.4 }}
        className="fixed top-5 left-5 z-[100] px-5 py-2 rounded-xl border border-emerald-400/30 bg-black/50 backdrop-blur-xl text-emerald-300 text-sm font-medium hover:border-emerald-400/60 hover:bg-black/70 transition-all duration-200"
      >
        ← Back
      </motion.button>

      {/* ── Action bar (top-right) ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: EASE, duration: 0.4, delay: 0.1 }}
        className="fixed top-5 right-5 z-[100] flex items-center gap-2"
      >
        <ActionBtn onClick={handleCopy} title="Copy link">
          {copied ? "✓ Copied" : "Copy Link"}
        </ActionBtn>
        <ActionBtn onClick={handleShare} title="Share">
          Share ↗
        </ActionBtn>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-400 text-black text-sm font-semibold hover:bg-emerald-300 transition-colors shadow-[0_0_20px_rgba(0,255,200,0.3)]"
          >
            Live Site ↗
          </a>
        )}
      </motion.div>

      {/* ── Hero image (parallax) ─────────────────────────── */}
      <div ref={heroRef} className="relative w-full h-[55vh] overflow-hidden">
        <motion.img
          src={image || `https://picsum.photos/seed/${id}/1400/700`}
          alt={title}
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030a0e]/40 to-[#030a0e]" />
        {/* Title overlay */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ease: EASE, duration: 0.7, delay: 0.2 }}
          className="absolute bottom-8 left-6 sm:left-12 max-w-2xl"
        >
          {formattedDate && (
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-emerald-400/60 mb-2 block">
              {formattedDate}
            </span>
          )}
          <h1
            className="font-black text-[clamp(28px,6vw,60px)] leading-tight bg-gradient-to-br from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent"
            style={{
              fontFamily: "'Syne', sans-serif",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {title}
          </h1>
        </motion.div>
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 sm:px-10 pb-24 space-y-14 -mt-4">
        {/* Tech stack */}
        {technologies.length > 0 && (
          <Reveal>
            <div>
              <SectionLabel>Tech Stack</SectionLabel>
              <div className="flex flex-wrap gap-2 mt-3">
                {technologies.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1.5 text-sm border border-emerald-400/25 rounded-xl bg-emerald-400/5 backdrop-blur text-emerald-300 font-mono"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        )}

        {/* Description */}
        <Reveal delay={0.05}>
          <div>
            <SectionLabel>About this project</SectionLabel>
            <p className="mt-3 text-emerald-100/70 text-base sm:text-lg leading-relaxed">
              {description || "No description provided for this project."}
            </p>
          </div>
        </Reveal>

        {/* CTA */}
        <Reveal delay={0.1}>
          <div className="flex flex-wrap gap-4 pt-2">
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3 rounded-xl bg-emerald-400 text-black font-semibold hover:bg-emerald-300 transition-colors shadow-[0_0_24px_rgba(0,255,200,0.3)] text-sm"
              >
                Visit Live Site ↗
              </a>
            ) : (
              <span className="px-7 py-3 rounded-xl border border-emerald-400/20 text-emerald-400/40 text-sm cursor-not-allowed">
                No live link
              </span>
            )}
            <button
              onClick={handleCopy}
              className="px-7 py-3 rounded-xl border border-emerald-400/30 text-emerald-300 font-medium hover:border-emerald-400/60 transition-colors text-sm"
            >
              {copied ? "✓ Link Copied!" : "Copy Project Link"}
            </button>
            <button
              onClick={() => navigate("/contact")}
              className="px-7 py-3 rounded-xl border border-emerald-400/20 text-emerald-300/60 hover:border-emerald-400/40 hover:text-emerald-300 transition-colors text-sm"
            >
              Work With Me →
            </button>
          </div>
        </Reveal>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-400/15 to-transparent" />

        {/* Related projects */}
        {related.length > 0 && (
          <Reveal delay={0.15}>
            <div>
              <SectionLabel>Related Projects</SectionLabel>
              <div className="mt-5 grid sm:grid-cols-3 gap-4">
                {related.map((rp) => (
                  <motion.button
                    key={rp._id}
                    onClick={() => navigate(`/project-detail/${rp._id}`)}
                    whileHover={{ scale: 1.03 }}
                    className="text-left rounded-2xl overflow-hidden border border-emerald-400/15 bg-emerald-400/5 hover:border-emerald-400/35 hover:bg-emerald-400/10 transition-all duration-200"
                  >
                    <div className="h-28 overflow-hidden">
                      <img
                        src={
                          rp.image ||
                          `https://picsum.photos/seed/${rp._id}/400/200`
                        }
                        alt={rp.title}
                        loading="lazy"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-emerald-100 leading-tight line-clamp-2">
                        {rp.title}
                      </p>
                      {(rp.technologies || []).length > 0 && (
                        <p className="text-[10px] text-emerald-400/50 font-mono mt-1">
                          {(rp.technologies || []).slice(0, 2).join(" · ")}
                        </p>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </Reveal>
        )}

        {/* Back to projects */}
        <Reveal delay={0.2}>
          <div className="flex justify-center pt-4">
            <button
              onClick={() => navigate("/project")}
              className="px-6 py-2.5 rounded-xl border border-emerald-400/20 text-emerald-400/60 text-sm hover:border-emerald-400/40 hover:text-emerald-300 transition-colors font-mono"
            >
              ← All Projects
            </button>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* ─── HELPERS ─────────────────────────────────────────────────────────────── */

function SectionLabel({ children }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400/60 font-mono">
      {children}
    </span>
  );
}

function ActionBtn({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="px-4 py-2 rounded-xl border border-emerald-400/25 bg-black/50 backdrop-blur-xl text-emerald-300 text-sm hover:border-emerald-400/50 hover:bg-black/70 transition-all duration-200"
    >
      {children}
    </button>
  );
}

function Reveal({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#030a0e] flex flex-col">
      {/* Hero skeleton */}
      <div className="w-full h-[55vh] bg-emerald-900/20 animate-pulse" />
      <div className="max-w-4xl mx-auto px-6 sm:px-10 pt-10 space-y-6 w-full">
        <div className="h-6 w-32 bg-emerald-900/40 rounded-lg animate-pulse" />
        <div className="flex gap-2">
          {[80, 100, 72].map((w, i) => (
            <div
              key={i}
              className={`h-8 w-${w} bg-emerald-900/30 rounded-xl animate-pulse`}
              style={{ width: w }}
            />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-emerald-900/30 rounded animate-pulse" />
          <div className="h-4 bg-emerald-900/30 rounded animate-pulse w-4/5" />
          <div className="h-4 bg-emerald-900/30 rounded animate-pulse w-3/5" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onBack }) {
  return (
    <div className="min-h-screen bg-[#030a0e] flex items-center justify-center px-6">
      <div className="text-center space-y-4 max-w-sm">
        <div className="text-4xl">🔍</div>
        <h2
          className="text-emerald-100 font-semibold text-xl"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Project not found
        </h2>
        <p className="text-emerald-400/50 text-sm font-mono">
          {message || "The project you're looking for doesn't exist."}
        </p>
        <button
          onClick={onBack}
          className="mt-4 px-6 py-2.5 rounded-xl border border-emerald-400/30 text-emerald-300 text-sm hover:border-emerald-400/60 transition-colors"
        >
          ← Back to Projects
        </button>
      </div>
    </div>
  );
}





