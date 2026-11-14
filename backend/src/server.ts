import { createServer } from "node:http";
import type { Server as HttpServer } from "node:http";
import type { Server } from "socket.io";
import { logger } from "./logger";

export const DEFAULT_PORT = 4000;
export const DEFAULT_FRONTEND_URL = "http://localhost:3000";
export const SHUTDOWN_TIMEOUT_MS = 10_000;

/** Falls back to the default port when PORT is missing or is not a valid port number. */
export const parsePort = (value: string | undefined): number => {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : DEFAULT_PORT;
};

/**
 * The origin the browser is allowed to connect from (CORS). The browser sends only the origin (no path, no
 * trailing slash) and the comparison is an exact one, so whatever is configured is reduced to that: a URL
 * copied with a final slash would otherwise match no browser and fail without a message.
 *
 * Nothing usable is a mistake that must not hide: the caller refuses to start. That includes a value that is
 * not an http(s) URL and, in production, a missing one (there is no default there). Render sets RENDER=true on
 * its services, so the check does not depend on NODE_ENV alone.
 */
export const resolveAllowedOrigin = (env: NodeJS.ProcessEnv = process.env): string | undefined => {
  const value = env.FRONTEND_URL?.trim();
  if (value) {
    try {
      const { protocol, origin } = new URL(value);
      return protocol === "http:" || protocol === "https:" ? origin : undefined;
    } catch {
      return undefined;
    }
  }
  return env.NODE_ENV === "production" || env.RENDER === "true" ? undefined : DEFAULT_FRONTEND_URL;
};

/**
 * Plain HTTP server that Socket.IO attaches to.
 * GET /healthz is for the hosting platform's health check; everything else that
 * is not a Socket.IO request is a 404.
 */
export const createHttpServer = (): HttpServer =>
  createServer((req, res) => {
    if (req.method === "GET" && req.url === "/healthz") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
      return;
    }

    res.writeHead(404);
    res.end();
  });

/**
 * Leaves a line in the log before the process stops on an exception nothing caught. Without it the cause
 * is only in the platform's raw output; the exit code stays the one Node uses by itself.
 */
export const installCrashLogging = (proc: NodeJS.Process = process, exit: (code: number) => void = process.exit) => {
  proc.on("uncaughtException", (error) => {
    logger.error("Uncaught exception, shutting down", error);
    exit(1);
  });
};

/**
 * Closes the server cleanly: connected clients are disconnected, then the process exits.
 * The timeout is a safety net in case a connection refuses to close.
 */
export const shutdown = (io: Server, signal: string, exit: (code: number) => void = process.exit) => {
  logger.info(`${signal} received, shutting down`);

  const timer = setTimeout(() => {
    logger.error("Shutdown timed out, forcing exit");
    exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  timer.unref();

  void io.close(() => {
    clearTimeout(timer);
    logger.info("Server closed");
    exit(0);
  });
};
