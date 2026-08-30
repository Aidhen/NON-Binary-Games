import { Server, Socket } from "socket.io";
import { generateSudoku, SudokuBoard } from "@nbg/shared";
import type { ClientToServerEvents, ServerToClientEvents } from "@nbg/shared";

interface RoomState {
  board: SudokuBoard;
  currentGrid: number[][];
  players: Set<string>;
}

const rooms = new Map<string, RoomState>();

export const setupSocketHandlers = (io: Server<ClientToServerEvents, ServerToClientEvents>) => {

  io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {

    socket.on("join-room", (roomId, difficulty) => {
      socket.join(roomId);

      let room = rooms.get(roomId);

      if (!room) {
        const board = generateSudoku(difficulty);
        room = {
          board,
          currentGrid: board.initial.map(row => [...row]),
          players: new Set(),
        };
        rooms.set(roomId, room);
      }

      room.players.add(socket.id);

      socket.emit("game-started", {
        board: room.board,
        currentGrid: room.currentGrid
      });
    });

    socket.on("cell-update", (roomId, { r, c, v }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.currentGrid[r][c] = v;

      socket.to(roomId).emit("cell-updated", { r, c, v });
    });

    socket.on("select-cell", (roomId, { r, c }) => {
      socket.to(roomId).emit("player-selected-cell", { playerId: socket.id, r, c });
    });

    socket.on("disconnect", () => {
      for (const [roomId, room] of rooms.entries()) {
        if (room.players.has(socket.id)) {
          room.players.delete(socket.id);

          socket.to(roomId).emit("player-disconnected", socket.id);

          if (room.players.size === 0) {
            rooms.delete(roomId);
          }
          break;
        }
      }
    });
  });
};