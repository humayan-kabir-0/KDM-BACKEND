// Admin.jsx
import { toast } from "../utils/toastStore";
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  Component,
} from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import apiClient, { setToken, clearToken } from "../utils/apiClient";

const E = [0.22, 1, 0.36, 1];

const PARTICLE_COUNT = 88;
const _startPos = new Float32Array(PARTICLE_COUNT * 3);
for (let i = 0; i < PARTICLE_COUNT; i++) {
  _startPos[i * 3] = (Math.random() - 0.5) * 18;
  _startPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
  _startPos[i * 3 + 2] = (Math.random() - 0.5) * 5 - 2;
}
const _vel = Array.from({ length: PARTICLE_COUNT }, () => ({
  x: (Math.random() - 0.5) * 0.007,
  y: (Math.random() - 0.5) * 0.007,
  z: (Math.random() - 0.5) * 0.003,
}));
const _pairs = [];
for (let i = 0; i < PARTICLE_COUNT; i++) {
  for (let j = i + 1; j < PARTICLE_COUNT; j++) {
    const dx = _startPos[i * 3] - _startPos[j * 3];
    const dy = _startPos[i * 3 + 1] - _startPos[j * 3 + 1];
    const dz = _startPos[i * 3 + 2] - _startPos[j * 3 + 2];
    if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 3.8) _pairs.push(i, j);
  }
}
const _pointGeo = (() => {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    "position",
    new THREE.BufferAttribute(Float32Array.from(_startPos), 3),
  );
  return geo;
})();
const _lineGeo = (() => {
  if (_pairs.length === 0) return null;
  const arr = new Float32Array(_pairs.length * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  return geo;
})();

function ParticleField() {
  const pointsRef = useRef();
  const linesRef = useRef();
  const live = useRef(Float32Array.from(_startPos));
  useFrame(() => {
    const p = live.current;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const xi = i * 3,
        yi = xi + 1,
        zi = xi + 2;
      p[xi] += _vel[i].x;
      p[yi] += _vel[i].y;
      p[zi] += _vel[i].z;
      if (p[xi] > 9.5 || p[xi] < -9.5) _vel[i].x *= -1;
      if (p[yi] > 5.5 || p[yi] < -5.5) _vel[i].y *= -1;
      if (p[zi] > 0.5 || p[zi] < -5.5) _vel[i].z *= -1;
    }
    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.array.set(p);
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
    if (linesRef.current && _lineGeo) {
      const la = _lineGeo.attributes.position.array;
      for (let c = 0; c < _pairs.length; c += 2) {
        const a = _pairs[c] * 3,
          b = _pairs[c + 1] * 3,
          base = c * 3;
        la[base] = p[a];
        la[base + 1] = p[a + 1];
        la[base + 2] = p[a + 2];
        la[base + 3] = p[b];
        la[base + 4] = p[b + 1];
        la[base + 5] = p[b + 2];
      }
      _lineGeo.attributes.position.needsUpdate = true;
    }
  });
  return (
    <>
      <points ref={pointsRef} geometry={_pointGeo}>
        <pointsMaterial
          color="#0affb2"
          size={0.05}
          sizeAttenuation
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </points>
      {_lineGeo && (
        <lineSegments ref={linesRef} geometry={_lineGeo}>
          <lineBasicMaterial
            color="#0affb2"
            transparent
            opacity={0.07}
            depthWrite={false}
          />
        </lineSegments>
      )}
      <ambientLight intensity={0.12} color="#001510" />
      <pointLight
        position={[5, 3, 2]}
        intensity={0.45}
        color="#0affb2"
        distance={16}
      />
    </>
  );
}

function AdminBackground() {
  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 7], fov: 58 }}
        gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
        dpr={[1, 1.5]}
        frameloop="always"
      >
        <ParticleField />
      </Canvas>
    </div>
  );
}

class TabErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(e) {
    return { error: e.message };
  }
  render() {
    if (this.state.error)
      return (
        <div className="py-16 text-center text-red-400/70 text-sm space-y-3">
          <p className="font-mono text-xs text-red-400/40 uppercase tracking-widest">
            Section Error
          </p>
          <p>{this.state.error}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-4 py-1.5 border border-red-500/30 rounded-lg text-xs hover:bg-red-500/10 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    return this.props.children;
  }
}

function ConfirmModal({ open, title, description, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return;
    const fn = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onCancel]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[500] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ ease: E, duration: 0.22 }}
          >
            <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
            <p className="text-gray-400 text-sm mb-6">{description}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse bg-gray-800 rounded-lg ${className}`} />
  );
}

function SkeletonCard() {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 space-y-3">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    setError("");
    const { data, error: err } = await apiClient.post("/api/auth/login", {
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    if (data?.token) onLogin(data.token);
    else setError("No token received from server");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 relative overflow-hidden">
      <AdminBackground />
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: E, duration: 0.45 }}
        className="relative z-10 bg-gray-900/90 border border-gray-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl backdrop-blur-sm"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 mb-3">
            <svg
              className="w-5 h-5 text-indigo-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">Kabir Digital Matrix</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <motion.span
                  className="size-4 rounded-full border-2 border-white/30 border-t-white"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 0.7,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function ProjectsTab() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    image: null,
    link: "",
    technologies: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    apiClient.get("/api/projects").then(({ data, error }) => {
      if (cancelled) return;
      setLoading(false);
      if (error) {
        toast(error, "error");
        return;
      }
      setProjects(data || []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    apiClient.get("/api/projects").then(({ data, error }) => {
      setLoading(false);
      if (error) {
        toast(error, "error");
        return;
      }
      setProjects(data || []);
    });
  }, []);

  const validateForm = (f) => {
    const e = {};
    if (!f.title.trim()) e.title = "Title is required";
    if (!f.description.trim()) e.description = "Description is required";
    return e;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const errs = validateForm(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    if (!form.image) {
      toast("Image is required", "error");
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append("title", form.title.trim());
    formData.append("description", form.description.trim());
    formData.append("link", form.link.trim());
    formData.append("image", form.image);
    formData.append(
      "technologies",
      JSON.stringify(
        form.technologies
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      ),
    );

    const tempId = `temp-${Date.now()}`;
    setProjects((prev) => [
      {
        _id: tempId,
        title: form.title.trim(),
        description: form.description.trim(),
        image: URL.createObjectURL(form.image),
        technologies: form.technologies
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        _optimistic: true,
      },
      ...prev,
    ]);

    const { data, error } = await apiClient.post("/api/projects", formData);
    setSaving(false);
    if (error) {
      setProjects((prev) => prev.filter((p) => p._id !== tempId));
      toast(error, "error");
      return;
    }
    setProjects((prev) => prev.map((p) => (p._id === tempId ? data : p)));
    setForm({
      title: "",
      description: "",
      image: null,
      link: "",
      technologies: "",
    });
    setErrors({});
    toast("Project added ✓");
  };

  const handleDelete = async (id) => {
    setConfirm(null);
    setProjects((prev) => prev.filter((p) => p._id !== id));
    const { error } = await apiClient.delete(`/api/projects/${id}`);
    if (error) {
      toast(error, "error");
      refetch();
    } else toast("Project deleted ✓");
  };

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          !debouncedSearch ||
          p.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          p.description?.toLowerCase().includes(debouncedSearch.toLowerCase()),
      ),
    [projects, debouncedSearch],
  );

  const FIELDS = [
    {
      key: "title",
      label: "Title *",
      type: "text",
      placeholder: "Project name",
    },
    {
      key: "link",
      label: "Live Link",
      type: "text",
      placeholder: "https://...",
    },
    {
      key: "technologies",
      label: "Tech (comma separated)",
      type: "text",
      placeholder: "React, Node.js, Tailwind",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
        <h2 className="text-white font-semibold text-base mb-5 flex items-center gap-2">
          <span className="size-2 rounded-full bg-indigo-400 inline-block" />
          Add New Project
        </h2>
        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {FIELDS.map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">
                {label}
              </label>
              <input
                type={type}
                name={key}
                value={form[key] || ""}
                placeholder={placeholder}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, [key]: e.target.value }));
                  setErrors((prev) => ({ ...prev, [key]: "" }));
                }}
                className={`w-full bg-gray-900 border ${errors[key] ? "border-red-500" : "border-gray-600"} rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:border-indigo-500 focus:outline-none transition-colors`}
              />
              {errors[key] && (
                <p className="text-red-400 text-xs mt-1">{errors[key]}</p>
              )}
            </div>
          ))}
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">
              Description *
            </label>
            <textarea
              value={form.description}
              placeholder="Short project description..."
              rows={3}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, description: e.target.value }));
                setErrors((prev) => ({ ...prev, description: "" }));
              }}
              className={`w-full bg-gray-900 border ${errors.description ? "border-red-500" : "border-gray-600"} rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:border-indigo-500 focus:outline-none transition-colors resize-none`}
            />
            {errors.description && (
              <p className="text-red-400 text-xs mt-1">{errors.description}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">
              Upload Image *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  image: e.target.files[0] || null,
                }))
              }
              className="text-gray-400 text-sm"
            />
            {form.image && (
              <p className="text-xs text-gray-400 mt-1">
                Selected: {form.image.name}
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <motion.span
                    className="size-3.5 rounded-full border-2 border-white/30 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.7,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  Adding…
                </>
              ) : (
                "Add Project"
              )}
            </button>
          </div>
        </form>
      </div>

      <div>
        <div className="flex items-center gap-4 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="flex-1 max-w-xs bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
          />
          <span className="text-gray-500 text-sm">
            {filtered.length} project{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-3">📁</div>
            <p className="text-sm">
              {search
                ? "No projects match your search."
                : "No projects yet. Add your first one above."}
            </p>
          </div>
        ) : (
          <motion.div
            className="grid md:grid-cols-2 gap-4"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          >
            {filtered.map((p) => (
              <motion.div
                key={p._id}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0 },
                }}
                className={`bg-gray-800/50 border ${p._optimistic ? "border-indigo-500/40 opacity-70" : "border-gray-700"} rounded-xl p-5 flex flex-col gap-3`}
              >
                {p.image && (
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-white font-semibold text-sm leading-tight flex-1">
                    {p.title}
                  </h3>
                  <button
                    onClick={() => setConfirm({ id: p._id, title: p.title })}
                    disabled={p._optimistic}
                    className="text-gray-500 hover:text-red-400 transition-colors text-xs flex-shrink-0 disabled:opacity-30"
                  >
                    ✕ Delete
                  </button>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
                  {p.description}
                </p>
                {p.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {p.technologies.map((t, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {p.link && (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 text-xs hover:underline"
                  >
                    View live →
                  </a>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      <ConfirmModal
        open={!!confirm}
        title="Delete project?"
        description={`"${confirm?.title}" will be permanently deleted.`}
        onConfirm={() => handleDelete(confirm.id)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function ContactsTab() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    apiClient.get("/api/contact").then(({ data, error }) => {
      if (cancelled) return;
      setLoading(false);
      if (error) {
        toast(error, "error");
        return;
      }
      setContacts(data || []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    apiClient.get("/api/contact").then(({ data, error }) => {
      setLoading(false);
      if (error) {
        toast(error, "error");
        return;
      }
      setContacts(data || []);
    });
  }, []);

  const markRead = useCallback(async (id) => {
    setContacts((prev) =>
      prev.map((c) => (c._id === id ? { ...c, isRead: true } : c)),
    );
    await apiClient.patch(`/api/contact/${id}/read`, null);
  }, []);
  const openMessage = useCallback(
    (c) => {
      setSelected(c);
      if (!c.isRead) markRead(c._id);
    },
    [markRead],
  );

  const handleDelete = async (id) => {
    setConfirm(null);
    if (selected?._id === id) setSelected(null);
    setContacts((prev) => prev.filter((c) => c._id !== id));
    const { error } = await apiClient.delete(`/api/contact/${id}`);
    if (error) {
      toast(error, "error");
      refetch();
    } else toast("Message deleted ✓");
  };

  const unread = useMemo(
    () => contacts.filter((c) => !c.isRead).length,
    [contacts],
  );
  const filtered = useMemo(
    () =>
      contacts.filter(
        (c) =>
          !debouncedSearch ||
          c.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          c.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          c.message?.toLowerCase().includes(debouncedSearch.toLowerCase()),
      ),
    [contacts, debouncedSearch],
  );

  return (
    <div className="flex gap-4 h-full min-h-[60vh]">
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="flex-1 max-w-xs bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
          />
          {unread > 0 && (
            <span className="text-xs bg-indigo-500 text-white px-2.5 py-1 rounded-full font-medium">
              {unread} unread
            </span>
          )}
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-3">✉️</div>
            <p className="text-sm">
              {search
                ? "No messages match your search."
                : "No messages received yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              <motion.div
                key={c._id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => openMessage(c)}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${selected?._id === c._id ? "border-indigo-500 bg-indigo-500/10" : c.isRead ? "border-gray-700 bg-gray-800/30 hover:border-gray-600" : "border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/50"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {!c.isRead && (
                      <span className="size-2 rounded-full bg-indigo-400 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm font-medium truncate ${c.isRead ? "text-gray-300" : "text-white"}`}
                    >
                      {c.name || "Anonymous"}
                    </span>
                  </div>
                  <span className="text-gray-500 text-xs flex-shrink-0">
                    {c.createdAt
                      ? new Date(c.createdAt).toLocaleDateString()
                      : ""}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-1 truncate">{c.email}</p>
                <p className="text-gray-400 text-xs mt-1 line-clamp-1">
                  {c.message}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ ease: E, duration: 0.22 }}
            className="w-full max-w-sm bg-gray-800/60 border border-gray-700 rounded-2xl p-6 flex flex-col gap-4 flex-shrink-0"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-white font-semibold">{selected.name}</h3>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-gray-300 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="space-y-1">
              <p className="text-indigo-400 text-sm">{selected.email}</p>
              <p className="text-gray-500 text-xs">
                {selected.createdAt
                  ? new Date(selected.createdAt).toLocaleString()
                  : ""}
              </p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 flex-1">
              <p className="text-gray-300 text-sm leading-relaxed">
                {selected.message}
              </p>
            </div>
            <button
              onClick={() =>
                setConfirm({ id: selected._id, name: selected.name })
              }
              className="w-full py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 text-red-400 text-sm rounded-lg transition-colors"
            >
              Delete Message
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmModal
        open={!!confirm}
        title="Delete message?"
        description={`Message from "${confirm?.name}" will be permanently deleted.`}
        onConfirm={() => handleDelete(confirm.id)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function DashboardTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiClient.get("/api/projects"),
      apiClient.get("/api/contact"),
    ]).then(
      ([{ data: projects, error: pe }, { data: contacts, error: ce }]) => {
        if (cancelled) return;
        if (pe || ce) {
          setFetchError(pe || ce);
          setLoading(false);
          return;
        }
        setStats({
          projects: Array.isArray(projects) ? projects.length : 0,
          contacts: Array.isArray(contacts) ? contacts.length : 0,
          unread: Array.isArray(contacts)
            ? contacts.filter((c) => !c.isRead).length
            : 0,
        });
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (fetchError)
    return (
      <div className="py-16 text-center text-red-400/70 text-sm">
        <p>Failed to load dashboard.</p>
        <p className="text-xs text-gray-600 mt-1">{fetchError}</p>
      </div>
    );

  const cards = [
    {
      label: "Total Projects",
      value: stats?.projects,
      icon: "📁",
      color: "text-indigo-400",
    },
    {
      label: "Total Messages",
      value: stats?.contacts,
      icon: "✉️",
      color: "text-emerald-400",
    },
    {
      label: "Unread Messages",
      value: stats?.unread,
      icon: "🔔",
      color: "text-amber-400",
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-white font-semibold text-lg">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6"
          >
            <div className="text-3xl mb-3">{c.icon}</div>
            {loading ? (
              <Skeleton className="h-9 w-16 mb-1" />
            ) : (
              <p className={`text-4xl font-black ${c.color}`}>{c.value}</p>
            )}
            <p className="text-gray-400 text-sm mt-1">{c.label}</p>
          </motion.div>
        ))}
      </div>
      <div className="bg-gray-800/30 border border-gray-700 rounded-2xl p-6">
        <p className="text-gray-500 text-sm">
          Activity log coming soon — all create, update, delete operations will
          be recorded here with timestamp and actor.
        </p>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
    >
      <span className="text-base">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge > 0 && (
        <span className="text-[10px] bg-amber-500 text-black font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {badge}
        </span>
      )}
    </button>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [token, setTokenState] = useState(() =>
    localStorage.getItem("adminToken"),
  );
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024,
  );

  useEffect(() => {
    const h = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", h, { passive: true });
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    apiClient.get("/api/contact").then(({ data }) => {
      if (cancelled) return;
      if (Array.isArray(data))
        setUnreadCount(data.filter((c) => !c.isRead).length);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // ✅ On login: store token AND dispatch storage event so Hero re-checks
  const handleLogin = useCallback((t) => {
    setToken(t);
    setTokenState(t);
    // Trigger storage event for same-tab listeners
    window.dispatchEvent(new Event("storage"));
  }, []);

  // ✅ On logout: clear token AND dispatch storage event so Hero hides button
  const handleLogout = useCallback(() => {
    clearToken();
    setTokenState(null);
    window.dispatchEvent(new Event("storage"));
    toast("Logged out", "info");
    navigate("/");
  }, [navigate]);

  const tabContent = useMemo(
    () => ({
      dashboard: <DashboardTab />,
      projects: <ProjectsTab />,
      contacts: <ContactsTab />,
    }),
    [],
  );

  const NAV_ITEMS = [
    { key: "dashboard", icon: "📊", label: "Dashboard" },
    { key: "projects", icon: "📁", label: "Projects" },
    { key: "contacts", icon: "✉️", label: "Messages", badge: unreadCount },
  ];

  if (!token) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div
      className="min-h-screen bg-gray-950 flex relative overflow-hidden"
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
    >
      <AdminBackground />
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      <motion.aside
        className="fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900/95 border-r border-gray-800 flex flex-col p-4 gap-1 backdrop-blur-sm"
        initial={false}
        animate={{ x: isDesktop || sidebarOpen ? 0 : "-256px" }}
        transition={{ ease: E, duration: 0.22 }}
      >
        <div className="flex items-center gap-3 px-4 py-3 mb-4 border-b border-gray-800">
          <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            K
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">
              KDM Admin
            </p>
            <p className="text-gray-500 text-xs">Dashboard</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.key}
              {...item}
              active={activeTab === item.key}
              onClick={() => {
                setActiveTab(item.key);
                setSidebarOpen(false);
              }}
            />
          ))}
        </nav>
        <div className="border-t border-gray-800 pt-4 space-y-1">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <span>←</span> Portfolio
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </motion.aside>
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="bg-gray-900/80 border-b border-gray-800 px-6 py-4 flex items-center gap-4 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="lg:hidden text-gray-400 hover:text-white transition-colors p-1"
          >
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div>
            <h1 className="text-white font-semibold text-base capitalize">
              {activeTab}
            </h1>
            <p className="text-gray-500 text-xs">Kabir Digital Matrix</p>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ ease: E, duration: 0.22 }}
            >
              <TabErrorBoundary key={activeTab}>
                {tabContent[activeTab]}
              </TabErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
