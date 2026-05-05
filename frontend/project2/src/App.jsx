// App.jsx
import { UIProvider } from "./context/UIContext";
import { useUI } from "./context/useUI";
import {
  useState,
  useEffect,
  useCallback,
  lazy,
  Suspense,
  Component,
} from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";

import {
  ROUTES_CONFIG,
  preloadRoute,
  preloadAllRoutes,
} from "./utils/preloadRoute";

import Loader from "./components/Loader";
import Toaster from "./components/Toaster";

const Hero = lazy(() => import("./components/Hero"));
const About = lazy(() => import("./sections/About"));
const Testimonials = lazy(() => import("./sections/Testimonials"));
const Admin = lazy(() => import("./pages/Admin"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));

const EASE_EXPO = [0.22, 1, 0.36, 1];
const DUR_FAST = 0.35;
const DUR_MED = 0.55;
const DUR_SLOW = 0.75;

/* ── ERROR BOUNDARY ─────────────────────────────────────────── */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error("[ErrorBoundary]", error, info);
  }
  render() {
    if (this.state.hasError)
      return (
        <div className="flex items-center justify-center min-h-[40vh] bg-[#030c0e] text-emerald-400/60 font-mono text-xs text-center px-6">
          <div className="space-y-3">
            <div className="text-2xl">⚠</div>
            <p className="uppercase tracking-widest">Component Error</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 border border-emerald-400/20 rounded text-[10px] hover:border-emerald-400/40 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    return this.props.children;
  }
}

/* ── PROTECTED ROUTE ────────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("adminToken");
  if (!token) return <Navigate to="/" replace />;
  return children;
}

/* ── GLOBAL CURSOR ──────────────────────────────────────────── */
function GlobalCursor() {
  const shouldReduce = useReducedMotion();
  const cursorX = useMotionValue(-200);
  const cursorY = useMotionValue(-200);
  const smoothX = useSpring(cursorX, {
    damping: 28,
    stiffness: 220,
    mass: 0.5,
  });
  const smoothY = useSpring(cursorY, {
    damping: 28,
    stiffness: 220,
    mass: 0.5,
  });
  const [cursorState, setCursorState] = useState("default");

  useEffect(() => {
    if (shouldReduce) return;
    let rafId,
      mx = -200,
      my = -200;
    const onMove = (e) => {
      mx = e.clientX - 16;
      my = e.clientY - 16;
    };
    const tick = () => {
      cursorX.set(mx);
      cursorY.set(my);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    const onOver = (e) => {
      const t = e.target;
      if (t.closest("button, a, [role='button']")) setCursorState("hover");
      else if (t.closest("input, textarea")) setCursorState("text");
      else setCursorState("default");
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("pointerover", onOver);
    };
  }, [shouldReduce, cursorX, cursorY]);

  if (shouldReduce) return null;

  const cursorScale =
    cursorState === "hover" ? 1.9 : cursorState === "text" ? 0.5 : 1;
  const borderColor =
    cursorState === "hover" ? "#00ffc8" : "rgba(10,255,178,0.55)";
  const boxShadow =
    cursorState === "hover"
      ? "0 0 22px rgba(0,255,200,0.7)"
      : "0 0 8px rgba(0,255,200,0.18)";

  return (
    <motion.div
      className="fixed z-[99999] pointer-events-none hidden md:block"
      style={{ x: smoothX, y: smoothY }}
    >
      <motion.div
        animate={{ scale: cursorScale, borderColor }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
        className="w-8 h-8 rounded-full border"
        style={{ boxShadow }}
      />
    </motion.div>
  );
}

/* ── OVERLAY PANEL ──────────────────────────────────────────── */
const overlayBgProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DUR_MED, ease: EASE_EXPO },
};
const overlayCardProps = {
  initial: { y: 80, opacity: 0, scale: 0.94 },
  animate: { y: 0, opacity: 1, scale: 1 },
  exit: { y: 60, opacity: 0, scale: 0.96 },
  transition: { duration: DUR_MED, ease: EASE_EXPO },
};

function OverlayPanel({ children, onClose }) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const { releaseLock } = useUI();

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h, { passive: true });
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleClose = useCallback(() => {
    releaseLock(DUR_MED * 1000);
    onClose();
  }, [onClose, releaseLock]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
      {...overlayBgProps}
      aria-modal="true"
      role="dialog"
    >
      <motion.div
        className="absolute inset-0 cursor-pointer"
        onClick={handleClose}
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,40,30,0.55), rgba(3,10,14,0.96))",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
        }}
      />
      <motion.div
        className="relative z-[101] w-full max-w-5xl rounded-3xl max-h-[88vh] overflow-y-auto"
        {...overlayCardProps}
        drag={isMobile ? "y" : false}
        dragConstraints={{ top: 0, bottom: 280 }}
        dragElastic={{ top: 0, bottom: 0.35 }}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100 && info.velocity.y > 400) handleClose();
        }}
        onClick={(e) => e.stopPropagation()}
        style={{ willChange: "transform" }}
      >
        {isMobile && (
          <div className="flex justify-center pt-3 pb-1 sticky top-0 z-10">
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>
        )}
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ── BACKGROUND STAGE ───────────────────────────────────────── */
function BackgroundStage({ children, dimmed }) {
  return (
    <motion.div
      animate={{
        scale: dimmed ? 0.93 : 1,
        filter: dimmed
          ? "blur(7px) brightness(0.45) saturate(0.7)"
          : "blur(0px) brightness(1) saturate(1)",
      }}
      transition={{ duration: DUR_SLOW, ease: EASE_EXPO }}
      style={{ transformOrigin: "center center" }}
    >
      {children}
    </motion.div>
  );
}

/* ── LOADERS ────────────────────────────────────────────────── */
function OverlayLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh] bg-[#030c0e]">
      <div className="flex flex-col items-center gap-4">
        <motion.span
          className="size-8 rounded-full border border-emerald-400/30 border-t-emerald-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-emerald-400/40">
          Loading…
        </span>
      </div>
    </div>
  );
}

function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-32 bg-[#030c0e]">
      <motion.span
        className="size-6 rounded-full border border-emerald-400/20 border-t-emerald-400/60"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

function FullPageLoader() {
  return (
    <div className="min-h-screen bg-[#030c0e] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <motion.span
          className="size-8 rounded-full border border-emerald-400/30 border-t-emerald-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-emerald-400/40">
          Loading…
        </span>
      </div>
    </div>
  );
}

/* ── PORTFOLIO HOME ─────────────────────────────────────────── */
function PortfolioHome() {
  const location = useLocation();
  const navigate = useNavigate();
  const { overlayOpen, setOverlayOpen, acquireLock, releaseLock } = useUI();

  const currentPath = location.pathname;
  const activeRoute = ROUTES_CONFIG.find((r) => r.path === currentPath);
  const isOverlay = !!activeRoute;
  const ActiveComponent = activeRoute?.component ?? null;

  useEffect(() => {
    setOverlayOpen(isOverlay);
  }, [isOverlay, setOverlayOpen]);

  useEffect(() => {
    const id = requestIdleCallback(() => preloadAllRoutes());
    return () => cancelIdleCallback(id);
  }, []);

  const go = useCallback(
    (path) => {
      if (!acquireLock()) return;
      preloadRoute(path);
      requestAnimationFrame(() => {
        navigate(path);
        releaseLock((DUR_MED + DUR_FAST) * 1000);
      });
    },
    [acquireLock, releaseLock, navigate],
  );

  const close = useCallback(() => {
    if (!acquireLock()) return;
    navigate("/");
    releaseLock(DUR_MED * 1000);
  }, [acquireLock, releaseLock, navigate]);

  const goAdmin = useCallback(() => {
    try {
      navigate("/admin");
    } catch {
      window.location.href = "/admin";
    }
  }, [navigate]);

  return (
    <>
      <BackgroundStage dimmed={overlayOpen}>
        <ErrorBoundary>
          <Suspense fallback={<SectionLoader />}>
            <Hero
              isActive={!overlayOpen}
              
              onAdminClick={goAdmin}
              onProjectClick={() => go("/project")}
            />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<SectionLoader />}>
            <About onProjectClick={() => go("/project")} />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<SectionLoader />}>
            <Testimonials onContactClick={() => go("/contact")} />
          </Suspense>
        </ErrorBoundary>
      </BackgroundStage>

      <AnimatePresence mode="wait">
        {ActiveComponent && (
          <OverlayPanel key={currentPath} onClose={close}>
            <ErrorBoundary>
              <Suspense fallback={<OverlayLoader />}>
                <ActiveComponent onBack={close} />
              </Suspense>
            </ErrorBoundary>
          </OverlayPanel>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── ROOT APP ───────────────────────────────────────────────── */
export default function App() {
  const [appReady, setAppReady] = useState(false);
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    preloadAllRoutes();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setAppReady(true), shouldReduce ? 0 : 1500);
    return () => clearTimeout(t);
  }, [shouldReduce]);

  return (
    <BrowserRouter>
      <UIProvider>
        <Toaster />
        <GlobalCursor />

        <AnimatePresence mode="wait">
          {!appReady && (
            <motion.div
              key="loader"
              className="fixed inset-0 z-[9999]"
              initial={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: { duration: DUR_MED, ease: EASE_EXPO },
              }}
            >
              <Loader />
            </motion.div>
          )}
        </AnimatePresence>

        {appReady && (
          <div
            className="bg-[#030c0e] min-h-screen overflow-x-hidden overflow-y-auto"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            <ErrorBoundary>
              <Routes>
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Suspense
                          fallback={
                            <div className="min-h-screen bg-[#030a0e]" />
                          }
                        >
                          <Admin />
                        </Suspense>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/project-detail/:id"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={<FullPageLoader />}>
                        <ProjectDetail />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route path="*" element={<PortfolioHome />} />
              </Routes>
            </ErrorBoundary>
          </div>
        )}
      </UIProvider>
    </BrowserRouter>
  );
}
