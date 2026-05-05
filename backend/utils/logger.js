// backend/utils/logger.js
// Install once: npm install pino pino-pretty
//
// Development → colourised human-readable output via pino-pretty
// Production  → newline-delimited JSON (Datadog, Logtail, Papertrail, etc.)
//
// Usage:
//   import logger from "../utils/logger.js";
//   logger.info("server started");
//   logger.error({ err }, "something broke");
//   logger.warn({ origin }, "CORS blocked");
//   logger.fatal("missing env var");

import pino from "pino";

const isDev = (process.env.NODE_ENV || "development") !== "production";

const logger = pino(
  {
    level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
    base: {
      service: "kdm-backend",
      env: process.env.NODE_ENV || "development",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
  },
  isDev
    ? pino.transport({
        target: "pino-pretty",
        options: { colorize: true, ignore: "pid,hostname,service,env" },
      })
    : undefined,
);

export default logger;
