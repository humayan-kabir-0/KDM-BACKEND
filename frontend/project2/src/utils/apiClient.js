// frontend/src/utils/apiClient.js
//
// VITE_API_URL is required — no silent fallback.
// Set it in your frontend .env file (project root, not backend/):
//   VITE_API_URL=http://localhost:5000
//
// If it is missing the module throws immediately so the problem
// is visible at startup rather than as a cryptic network error.

const BASE_URL = import.meta.env.VITE_API_URL;

if (!BASE_URL) {
  throw new Error(
    "[apiClient] VITE_API_URL is not set.\n" +
      "Add VITE_API_URL=http://localhost:5000 to your frontend .env file and restart Vite.",
  );
}

const MAX_RETRIES = 2;

// ── Token helpers ─────────────────────────────────────────────
export function getToken() {
  return localStorage.getItem("adminToken");
}
export function setToken(token) {
  localStorage.setItem("adminToken", token);
}
export function clearToken() {
  localStorage.removeItem("adminToken");
}

// ── Unauthorized callback ─────────────────────────────────────
let _onUnauthorized = null;
export function registerUnauthorizedHandler(fn) {
  _onUnauthorized = fn;
}

// ── Core request ──────────────────────────────────────────────
async function request(method, path, body = null, attempt = 0) {
  const isFormData = body instanceof FormData;
  const token = getToken();

  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const config = { method, headers };
  if (body !== null && body !== undefined) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const fullPath = path.startsWith("/") ? path : `/${path}`;

  try {
    const res = await fetch(`${BASE_URL}${fullPath}`, config);

    if (res.status === 401) {
      clearToken();
      if (_onUnauthorized) _onUnauthorized();
      return {
        data: null,
        error: "Session expired. Please log in again.",
        status: 401,
      };
    }

    let data = null;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try {
        data = await res.json();
      } catch {
        /* ignore */
      }
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      const msg =
        typeof data === "object" && data?.message
          ? data.message
          : `HTTP ${res.status}`;
      return { data: null, error: msg, status: res.status };
    }

    return { data, error: null, status: res.status };
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      return request(method, path, body, attempt + 1);
    }
    console.error(`[apiClient] ${method} ${fullPath} failed:`, err.message);
    return {
      data: null,
      error: `Cannot reach ${BASE_URL}. Ensure the backend is running and VITE_API_URL is correct.`,
      status: 0,
    };
  }
}

// ── Public API ────────────────────────────────────────────────
const apiClient = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),
};

export default apiClient;





