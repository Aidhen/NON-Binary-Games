import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@nbg/shared";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io("http://localhost:4000", {
      autoConnect: false,
      reconnectionAttempts: 5,
    });
  }
  return socket;
};