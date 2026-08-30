import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@nbg/shared";

// Usiamo il casting per mantenere la tipizzazione forte tra client e server
let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io("http://localhost:4000", {
      autoConnect: false, // La connessione la gestiamo manualmente nel componente
      reconnectionAttempts: 5,
    });
  }
  return socket;
};