import { Server } from "socket.io";
import { setupSocketHandlers } from "./src/sockets/event";
import { addressResolverFromEnv, applyConnectionLimits, MAX_MESSAGE_BYTES } from "./src/sockets/connectionLimits";
import { createHttpServer, installCrashLogging, parsePort, resolveAllowedOrigin, shutdown } from "./src/server";
import { logger } from "./src/logger";

const allowedOrigin = resolveAllowedOrigin();
if (!allowedOrigin) {
  logger.error("FRONTEND_URL is missing or is not an http(s) URL: it is the only origin allowed to connect in production, so the server does not start.");
  process.exit(1);
}
const port = parsePort(process.env.PORT);

installCrashLogging();

const httpServer = createHttpServer();

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: MAX_MESSAGE_BYTES
});

const addressOf = addressResolverFromEnv();
if (!addressOf) logger.warn("Limits on connections are off, they need to know the address of each player: set CLIENT_IP_HEADER (or LIMIT_BY_PEER_ADDRESS=true when there is no proxy).");
applyConnectionLimits(io, addressOf);
setupSocketHandlers(io);

io.on("connection", (socket) => {
  logger.info(`User connected: ${socket.id}`);

  socket.on("disconnect", () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

httpServer.listen(port, () => {
  logger.info(`Socket.io server listening on port ${port}`);
});

process.once("SIGTERM", () => shutdown(io, "SIGTERM"));
process.once("SIGINT", () => shutdown(io, "SIGINT"));
