import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@nbg/shared";
import { getPlayerId } from "./playerId";
import { backendUrl } from "./backendUrl";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const getSocket = () => {
  socket ??= io(backendUrl(), {
    autoConnect: false,
    auth: { playerId: getPlayerId() },
    reconnectionAttempts: Infinity,
    reconnectionDelayMax: 5000,
  });
  return socket;
};