import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@nbg/shared";
import { getPlayerId } from "./playerId";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
      autoConnect: false,
      auth: { playerId: getPlayerId() },
      reconnectionAttempts: Infinity,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
};