import { Server, Socket } from "socket.io";
import { checkWinCondition, countInitialFilledCells, generateSudoku, SudokuBoard } from "@nbg/shared";
import type { ClientToServerEvents, ServerToClientEvents, SudokuGrid } from "@nbg/shared";

interface RoomState {
  board: SudokuBoard;
  currentGrid: SudokuGrid;
  players: Set<string>;
  filledCells: number;
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
          filledCells: countInitialFilledCells(board.initial),
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

      const size = room.board.initial.length;

      if (!Number.isInteger(r) || r < 0 || r >= size) return;
      if (!Number.isInteger(c) || c < 0 || c >= size) return;
      if (!Number.isInteger(v) || v < 0 || v > size) return;

      if (room.board.initial[r][c] !== 0) return;

      const prevValue = room.currentGrid[r][c];

      if (prevValue === 0 && v !== 0) {
        room.filledCells++;
      } else if (prevValue !== 0 && v === 0) {
        room.filledCells--;
      }

      room.currentGrid[r][c] = v;
      socket.to(roomId).emit("cell-updated", { r, c, v });

      const totalCells = size * size;
      if (room.filledCells === totalCells) {
        if (checkWinCondition(room.currentGrid, room.board.solution)) {
          console.log(`🏆 Room ${roomId} solved!`);
          io.to(roomId).emit("game-won");
        }
      }
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

    socket.on("restart-game", (roomId, difficulty) => {
      const room = rooms.get(roomId);
      if (!room) return;

      console.log(`🔄 [Backend] Restarting game for room ${roomId}`);

      const board = generateSudoku(difficulty);

      room.board = board;
      room.currentGrid = board.initial.map(row => [...row]);
      room.filledCells = countInitialFilledCells(board.initial);

      io.to(roomId).emit("game-started", {
        board: room.board,
        currentGrid: room.currentGrid
      });
    });
  });
};