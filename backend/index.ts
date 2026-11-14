import { Server } from "socket.io";
import { setupSocketHandlers } from "./src/sockets/event";
import { addressResolverFromEnv, applyConnectionLimits, MAX_MESSAGE_BYTES } from "./src/sockets/connectionLimits";
import { createHttpServer, parsePort, shutdown } from "./src/server";
import { logger } from "./src/logger";

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3000";
const port = parsePort(process.env.PORT);

const httpServer = createHttpServer();

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"],
    credentials: true
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
