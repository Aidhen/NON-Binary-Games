import { Server, Socket, DefaultEventsMap } from "socket.io";
import { cellUpdateArgsSchema, playerIdSchema, checkWinCondition, countInitialFilledCells, EMOTE_COOLDOWN_MS, generateSudoku, MAX_PLAYERS_PER_ROOM, joinRoomArgsSchema, restartGameArgsSchema, selectCellArgsSchema, sendEmoteArgsSchema, toggleNoteArgsSchema } from "@nbg/shared";
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "@nbg/shared";
import { safeHandler } from "./safeHandler";
import { createRateLimiter } from "./rateLimiter";
import { RoomStore } from "../rooms/roomStore";

type GameServer = Server<ClientToServerEvents, ServerToClientEvents, DefaultEventsMap, SocketData>;
type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, DefaultEventsMap, SocketData>;

export const rooms = new RoomStore();

/** Per socket, all events together: far above what a player can do, low enough to stop a flood. */
export const eventLimit = { max: 40, windowMs: 1000 };

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

  const { playerId } = socket.data;
  const sockets = room.players.get(playerId);
  sockets?.delete(socket.id);

  if (!sockets?.size) {
    room.players.delete(playerId);
    socket.to(roomId).emit("player-disconnected", playerId);
  }

  if (room.players.size === 0) {
    rooms.expireWhenEmpty(roomId);
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

/** The id the browser sent in the handshake, or the socket id for clients that sent none (or garbage). */
const resolvePlayerId = (socket: GameSocket): string => {
  const parsed = playerIdSchema.safeParse(socket.handshake.auth?.playerId);
  return parsed.success ? parsed.data : socket.id;
};

export const setupSocketHandlers = (io: GameServer) => {
  io.on("connection", (socket: GameSocket) => {
    socket.data.playerId = resolvePlayerId(socket);
    const allowEvent = createRateLimiter(eventLimit.max, eventLimit.windowMs);

    socket.on("join-room", safeHandler(joinRoomArgsSchema, (roomId, difficulty) => {
      const existingRoom = rooms.get(roomId);

      // Checked before leaving the current room, so a refused player stays where they are.
      if (!existingRoom && rooms.isFull()) {
        socket.emit("join-error", "server-full");
        return;
      }
      if (existingRoom && !existingRoom.players.has(socket.data.playerId) && existingRoom.players.size >= MAX_PLAYERS_PER_ROOM) {
        socket.emit("join-error", "room-full");
        return;
      }

      if (socket.data.roomId !== roomId) {
        leaveCurrentRoom(socket);
      }

      void socket.join(roomId);
      socket.data.roomId = roomId;

      let room = rooms.get(roomId);
      rooms.cancelExpiry(roomId);

      if (!room) {
        const board = generateSudoku(difficulty);

        room = {
          board,
          difficulty,
          currentGrid: board.initial.map(row => [...row]),
          players: new Map(),
          filledCells: countInitialFilledCells(board.initial),
          notesGrid: {},
        };
        rooms.set(roomId, room);
      }

      const sockets = room.players.get(socket.data.playerId) ?? new Set<string>();
      sockets.add(socket.id);
      room.players.set(socket.data.playerId, sockets);

      socket.emit("game-started", {
        board: room.board,
        difficulty: room.difficulty,
        currentGrid: room.currentGrid,
        notesGrid: room.notesGrid
      });
    }, allowEvent));

    socket.on("cell-update", safeHandler(cellUpdateArgsSchema, ({ r, c, v }, acknowledge?) => {
      const current = getCurrentRoom(socket);
      if (!current) {
        acknowledge?.({ ok: false });
        return;
      }
      const { roomId, room } = current;

      const size = room.board.initial.length;

      if (r >= size || c >= size || v > size) {
        acknowledge?.({ ok: false });
        return;
      }

      if (room.board.initial[r][c] !== 0) {
        acknowledge?.({ ok: false });
        return;
      }

      const prevValue = room.currentGrid[r][c];

      if (prevValue === v) {
        acknowledge?.({ ok: true });
        return;
      }

      if (prevValue === 0 && v !== 0) {
        room.filledCells++;
      } else if (prevValue !== 0 && v === 0) {
        room.filledCells--;
      }

      room.currentGrid[r][c] = v;
      socket.to(roomId).emit("cell-updated", { r, c, v });
      acknowledge?.({ ok: true });

      const totalCells = size * size;
      if (room.filledCells === totalCells) {
        if (checkWinCondition(room.currentGrid, room.board.solution)) {
          io.to(roomId).emit("game-won");
        }
      }
    }, allowEvent));

    socket.on("select-cell", safeHandler(selectCellArgsSchema, ({ r, c }) => {
      const current = getCurrentRoom(socket);
      if (!current) return;
      const { roomId, room } = current;

      const size = room.board.size;
      if ((r !== null && r >= size) || (c !== null && c >= size)) return;

      socket.to(roomId).emit("player-selected-cell", { playerId: socket.data.playerId, r, c });
    }, allowEvent));

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
    }, allowEvent));

    // Fire and forget: the sender already shows its own emote, so only the others are notified.
    // Emotes sent during the cooldown are dropped silently (the UI disables the bar for the same time).
    socket.on("send-emote", safeHandler(sendEmoteArgsSchema, (emote) => {
      const current = getCurrentRoom(socket);
      if (!current) return;

      const now = Date.now();
      const lastEmoteAt = socket.data.lastEmoteAt;
      if (lastEmoteAt !== undefined && now - lastEmoteAt < EMOTE_COOLDOWN_MS) return;

      socket.data.lastEmoteAt = now;
      socket.to(current.roomId).emit("emote-received", { playerId: socket.data.playerId, emote });
    }, allowEvent));

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
        room.notesGrid[cellKey][v] = socket.data.playerId;
        assignedPlayerId = socket.data.playerId;
      }

      io.to(roomId).emit("note-toggled", { r, c, v, playerId: assignedPlayerId });
    }, allowEvent));
  });
};
