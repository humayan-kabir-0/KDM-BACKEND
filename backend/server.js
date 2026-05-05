// backend/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import logger from "./utils/logger.js";

import authRoutes from "./routes/authRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";

/* ── Environment validation ─────────────────────────────────── */
const REQUIRED = [
  "MONGO_URI",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  logger.fatal(`Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  logger.fatal("JWT_SECRET must be at least 32 characters");
  process.exit(1);
}

/* ── App setup ──────────────────────────────────────────────── */
const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

/* ── CORS ───────────────────────────────────────────────────── */
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

if (!allowedOrigins.length) {
  logger.fatal(
    "CORS_ORIGINS is not set in .env — server will not accept any browser requests",
  );
  process.exit(1);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      logger.warn({ origin }, "CORS blocked request");
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));

/* ── Request logger ─────────────────────────────────────────── */
app.use((req, _res, next) => {
  logger.info({ method: req.method, path: req.path }, "incoming request");
  next();
});

/* ── Health check ───────────────────────────────────────────── */
const startTime = Date.now();

app.get("/health", async (_, res) => {
  const dbState = mongoose.connection.readyState;
  const dbLabel =
    ["disconnected", "connected", "connecting", "disconnecting"][dbState] ??
    "unknown";
  let dbPingMs = null;

  try {
    const t0 = Date.now();
    await mongoose.connection.db.admin().ping();
    dbPingMs = Date.now() - t0;
  } catch {
    /* ping failed */
  }

  const healthy = dbState === 1 && dbPingMs !== null;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    uptime: `${Math.floor((Date.now() - startTime) / 1000)}s`,
    timestamp: new Date().toISOString(),
    services: { mongodb: { state: dbLabel, pingMs: dbPingMs ?? "timeout" } },
    env: process.env.NODE_ENV || "development",
  });
});

/* ── Routes ─────────────────────────────────────────────────── */
app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/projects", projectRoutes);
app.use("/contact", contactRoutes);

/* ── 404 ────────────────────────────────────────────────────── */
app.use((req, res) => {
  logger.warn({ method: req.method, path: req.path }, "404 not found");
  res
    .status(404)
    .json({ message: `Route not found: ${req.method} ${req.path}` });
});

/* ── Global error handler ───────────────────────────────────── */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  logger.error({ err, method: req.method, path: req.path }, "unhandled error");
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal server error" });
});

/* ── Graceful shutdown ──────────────────────────────────────── */
async function shutdown(signal) {
  logger.info(`${signal} received — shutting down`);
  await mongoose.connection.close();
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

/* ── Fixed port — no auto-increment ────────────────────────────
   If PORT is already in use the server exits immediately with a
   clear message. Kill the occupying process or change PORT in .env.
─────────────────────────────────────────────────────────────── */
function startServer() {
  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running  → http://localhost:${PORT}`);
    logger.info(`Health check    → http://localhost:${PORT}/health`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      logger.fatal(
        `Port ${PORT} is already in use. ` +
          `Kill the process occupying it or change PORT in backend/.env, then restart.`,
      );
    } else {
      logger.fatal({ err }, "Server startup error");
    }
    process.exit(1);
  });
}

/* ── Connect DB then start ──────────────────────────────────── */
(async () => {
  try {
    await connectDB();
    startServer();
  } catch (err) {
    logger.fatal({ err }, "Failed to connect to MongoDB");
    process.exit(1);
  }
})();
