import { Server, Socket, DefaultEventsMap } from "socket.io";
import { cellUpdateArgsSchema, checkWinCondition, countInitialFilledCells, generateSudoku, joinRoomArgsSchema, restartGameArgsSchema, selectCellArgsSchema, SudokuBoard, toggleNoteArgsSchema } from "@nbg/shared";
import type { ClientToServerEvents, ServerToClientEvents, SocketData, SudokuGrid, NotesGrid, DifficultyLevel } from "@nbg/shared";
import { safeHandler } from "./safeHandler";

interface RoomState {
  board: SudokuBoard;
  difficulty: DifficultyLevel;
  currentGrid: SudokuGrid;
  players: Set<string>;
  filledCells: number;
  notesGrid: NotesGrid;
}

type GameServer = Server<ClientToServerEvents, ServerToClientEvents, DefaultEventsMap, SocketData>;
type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, DefaultEventsMap, SocketData>;

export const rooms = new Map<string, RoomState>();

/**
 * Removes the socket from the room it is currently in (if any).
 * Used both when the socket moves to another room and when it disconnects.
 */
const leaveCurrentRoom = (socket: GameSocket) => {
  const roomId = socket.data.roomId;
  if (!roomId) return;

  socket.data.roomId = undefined;
  void socket.leave(roomId);

  const room = rooms.get(roomId);
  if (!room) return;

  room.players.delete(socket.id);
  socket.to(roomId).emit("player-disconnected", socket.id);

  if (room.players.size === 0) {
    rooms.delete(roomId);
  }
};

/**
 * The room a socket acts on is the one it joined, never a client-supplied id:
 * a socket that has not joined a room cannot touch any room.
 */
const getCurrentRoom = (socket: GameSocket) => {
  const roomId = socket.data.roomId;
  if (!roomId) return undefined;

  const room = rooms.get(roomId);
  if (!room) return undefined;

  return { roomId, room };
};

export const setupSocketHandlers = (io: GameServer) => {
  io.on("connection", (socket: GameSocket) => {

    socket.on("join-room", safeHandler(joinRoomArgsSchema, (roomId, difficulty) => {
      if (socket.data.roomId !== roomId) {
        leaveCurrentRoom(socket);
      }

      void socket.join(roomId);
      socket.data.roomId = roomId;

      let room = rooms.get(roomId);

      if (!room) {
        const board = generateSudoku(difficulty);

        room = {
          board,
          difficulty,
          currentGrid: board.initial.map(row => [...row]),
          players: new Set(),
          filledCells: countInitialFilledCells(board.initial),
          notesGrid: {},
        };
        rooms.set(roomId, room);
      }

      room.players.add(socket.id);

      socket.emit("game-started", {
        board: room.board,
        difficulty: room.difficulty,
        currentGrid: room.currentGrid,
        notesGrid: room.notesGrid
      });
    }));

    socket.on("cell-update", safeHandler(cellUpdateArgsSchema, ({ r, c, v }) => {
      const current = getCurrentRoom(socket);
      if (!current) return;
      const { roomId, room } = current;

      const size = room.board.initial.length;

      if (r >= size || c >= size || v > size) return;

      if (room.board.initial[r][c] !== 0) return;

      const prevValue = room.currentGrid[r][c];

      if (prevValue === v) return;

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
          io.to(roomId).emit("game-won");
        }
      }
    }));

    socket.on("select-cell", safeHandler(selectCellArgsSchema, ({ r, c }) => {
      const current = getCurrentRoom(socket);
      if (!current) return;
      const { roomId, room } = current;

      const size = room.board.size;
      if ((r !== null && r >= size) || (c !== null && c >= size)) return;

      socket.to(roomId).emit("player-selected-cell", { playerId: socket.id, r, c });
    }));

    socket.on("disconnect", () => {
      leaveCurrentRoom(socket);
    });

    socket.on("restart-game", safeHandler(restartGameArgsSchema, (difficulty) => {
      const current = getCurrentRoom(socket);
      if (!current) return;
      const { roomId, room } = current;

      const board = generateSudoku(difficulty);

      room.board = board;
      room.difficulty = difficulty;
      room.currentGrid = board.initial.map(row => [...row]);
      room.filledCells = countInitialFilledCells(board.initial);
      room.notesGrid = {};

      io.to(roomId).emit("game-started", {
        board: room.board,
        difficulty: room.difficulty,
        currentGrid: room.currentGrid,
        notesGrid: room.notesGrid
      });
    }));

    socket.on("toggle-note", safeHandler(toggleNoteArgsSchema, ({ r, c, v }) => {
      const current = getCurrentRoom(socket);
      if (!current) return;
      const { roomId, room } = current;

      const size = room.board.size;

      if (r >= size || c >= size || v > size) return;

      const cellKey = `${r}-${c}`;
      if (!room.notesGrid[cellKey]) {
        room.notesGrid[cellKey] = {};
      }

      let assignedPlayerId: string | null = null;

      if (room.notesGrid[cellKey][v]) {
        delete room.notesGrid[cellKey][v];

        if (Object.keys(room.notesGrid[cellKey]).length === 0) {
          delete room.notesGrid[cellKey];
        }
      } else {
        room.notesGrid[cellKey][v] = socket.id;
        assignedPlayerId = socket.id;
      }

      io.to(roomId).emit("note-toggled", { r, c, v, playerId: assignedPlayerId });
    }));
  });
};
