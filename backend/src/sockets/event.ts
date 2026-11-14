import { randomBytes } from "node:crypto";
import { Server, Socket, DefaultEventsMap } from "socket.io";
import { cellUpdateArgsSchema, playerIdSchema, checkWinCondition, countInitialFilledCells, EMOTE_COOLDOWN_MS, generateSudoku, MAX_PLAYERS_PER_ROOM, joinRoomArgsSchema, restartGameArgsSchema, selectCellArgsSchema, sendEmoteArgsSchema, setColorArgsSchema, toggleNoteArgsSchema } from "@nbg/shared";
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "@nbg/shared";
import { safeHandler } from "./safeHandler";
import { logger } from "../logger";
import { createKeyedRateLimiter, createRateLimiter } from "./rateLimiter";
import { RoomStore } from "../rooms/roomStore";
import type { RoomState } from "../rooms/roomStore";
import { assignProfile, colorIsFree, snapshotPlayers } from "../rooms/profiles";

export type GameServer = Server<ClientToServerEvents, ServerToClientEvents, DefaultEventsMap, SocketData>;
export type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, DefaultEventsMap, SocketData>;

export const rooms = new RoomStore();

/**
 * The name of a room inside Socket.IO. Every socket is already in a Socket.IO room named after its own id,
 * and a client picks the room id: without a prefix it could name the private room of another socket.
 */
const channelOf = (roomId: string) => `room:${roomId}`;

/** A player changing color tells everybody in the room: this keeps it from becoming a flicker for the others. */
export const colorLimit = { cooldownMs: 300 };

/** Tabs (sockets) one player can have open in the same room. */
export const MAX_SOCKETS_PER_PLAYER = 3;

/** Aliases kept per room: players that left are forgotten first, so a room never holds more than this. */
export const MAX_ROOM_ALIASES = 20;

/**
 * The name a player has inside one room. The id of the player is what lets them back in after a
 * dropped connection, so it must stay with the server: the other players only get this alias,
 * which is random and different in every room.
 */
const aliasOf = (room: RoomState, playerId: string): string => {
  const existing = room.aliases.get(playerId);
  if (existing) return existing;

  if (room.aliases.size >= MAX_ROOM_ALIASES) {
    for (const knownId of room.aliases.keys()) {
      if (!room.players.has(knownId)) {
        room.aliases.delete(knownId);
        room.profiles.delete(knownId);
      }
    }
  }

  const taken = new Set(room.aliases.values());
  let alias: string;
  do alias = randomBytes(6).toString("hex"); while (taken.has(alias));
  room.aliases.set(playerId, alias);
  return alias;
};

/** Per socket, all events together: far above what a player can do, low enough to stop a flood. */
export const eventLimit = { max: 40, windowMs: 1000 };

/** Per address (per socket where the address is not known): rooms that can be created. A room costs memory and a board costs CPU, so they cannot be opened in bulk, and opening a new connection does not start over. Joining a room that exists is free. */
export const roomCreationLimit = { max: 5, windowMs: 10 * 60 * 1000 };

/** Per address (per socket where the address is not known): restarts of the game, each one generates a board. A few per session is what a player does. */
export const restartLimit = { max: 6, windowMs: 60 * 1000 };

/** All sockets together: boards generated per second. Generating one blocks the event loop for every room, so this is the safety net behind the limits above. */
export const boardGenerationLimit = { max: 2, windowMs: 1000 };

/**
 * Removes the socket from the room it is currently in (if any).
 * Used both when the socket moves to another room and when it disconnects.
 */
const leaveCurrentRoom = (socket: GameSocket) => {
  const roomId = socket.data.roomId;
  if (!roomId) return;

  const { playerId, alias } = socket.data;
  socket.data.roomId = undefined;
  socket.data.alias = undefined;
  void socket.leave(channelOf(roomId));

  const room = rooms.get(roomId);
  if (!room) return;

  const sockets = room.players.get(playerId);
  sockets?.delete(socket.id);

  if (!sockets?.size) {
    room.players.delete(playerId);
    if (alias) socket.to(channelOf(roomId)).emit("player-disconnected", alias);
    socket.to(channelOf(roomId)).emit("players-updated", { players: snapshotPlayers(room) });
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
  const alias = socket.data.alias;
  if (!room || !alias) return undefined;

  return { roomId, room, alias };
};

/** The id the browser sent in the handshake, or the socket id for clients that sent none (or garbage). */
const resolvePlayerId = (socket: GameSocket): string => {
  const parsed = playerIdSchema.safeParse(socket.handshake.auth?.playerId);
  return parsed.success ? parsed.data : socket.id;
};

export const setupSocketHandlers = (io: GameServer) => {
  const allowBoardGeneration = createRateLimiter(boardGenerationLimit.max, boardGenerationLimit.windowMs);
  const allowRoomCreation = createKeyedRateLimiter(roomCreationLimit.max, roomCreationLimit.windowMs);
  const allowRestart = createKeyedRateLimiter(restartLimit.max, restartLimit.windowMs);

  io.on("connection", (socket: GameSocket) => {
    socket.data.playerId = resolvePlayerId(socket);
    const allowEvent = createRateLimiter(eventLimit.max, eventLimit.windowMs);
    const budgetKey = () => socket.data.address ?? socket.id;

    socket.on("join-room", safeHandler(joinRoomArgsSchema, (roomId, difficulty) => {
      const existingRoom = rooms.get(roomId);

      // Checked before leaving the current room, so a refused player stays where they are.
      if (!existingRoom && rooms.isFull()) {
        socket.emit("join-error", "server-full");
        return;
      }
      // Creating a room generates a board: both the budget of this address and the one of the server must allow it.
      if (!existingRoom && !(allowRoomCreation(budgetKey()) && allowBoardGeneration())) {
        socket.emit("join-error", "too-fast");
        return;
      }
      if (existingRoom && !existingRoom.players.has(socket.data.playerId) && existingRoom.players.size >= MAX_PLAYERS_PER_ROOM) {
        socket.emit("join-error", "room-full");
        return;
      }

      // Made before the player leaves their room or joins this one: if it ever fails, they stay where they were.
      const preparedBoard = existingRoom ? undefined : generateSudoku(difficulty);

      if (socket.data.roomId !== roomId) {
        leaveCurrentRoom(socket);
      }

      void socket.join(channelOf(roomId));
      socket.data.roomId = roomId;

      let room = rooms.get(roomId);
      rooms.cancelExpiry(roomId);

      if (!room) {
        const board = preparedBoard ?? generateSudoku(difficulty);

        room = {
          board,
          difficulty,
          currentGrid: board.initial.map(row => [...row]),
          players: new Map(),
          filledCells: countInitialFilledCells(board.initial),
          notesGrid: {},
          aliases: new Map(),
          profiles: new Map(),
          played: false,
        };
        rooms.set(roomId, room);
      }

      // After a dropped connection the old socket stays until the ping timeout. When a player is over the
      // limit the oldest tab goes, so that a bad network does not lock them out of their own room.
      const ownSockets = room.players.get(socket.data.playerId);
      if (ownSockets && !ownSockets.has(socket.id) && ownSockets.size >= MAX_SOCKETS_PER_PLAYER) {
        const oldest = ownSockets.values().next().value;
        if (oldest) io.sockets.sockets.get(oldest)?.disconnect(true);
      }

      socket.data.alias = aliasOf(room, socket.data.playerId);
      const sockets = room.players.get(socket.data.playerId) ?? new Set<string>();
      // A second tab, or a join that is repeated, changes nothing for the others: they do not need the list again.
      const isNewPlayer = sockets.size === 0;
      sockets.add(socket.id);
      room.players.set(socket.data.playerId, sockets);

      // Before the game starts, so that the player knows who they are as soon as the board is there.
      assignProfile(room, socket.data.playerId);
      socket.emit("joined-as", socket.data.alias);
      if (isNewPlayer) io.to(channelOf(roomId)).emit("players-updated", { players: snapshotPlayers(room) });
      else socket.emit("players-updated", { players: snapshotPlayers(room) });

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
      room.played = true;
      socket.to(channelOf(roomId)).emit("cell-updated", { r, c, v });
      acknowledge?.({ ok: true });

      const totalCells = size * size;
      if (room.filledCells === totalCells) {
        if (checkWinCondition(room.currentGrid, room.board.solution)) {
          io.to(channelOf(roomId)).emit("game-won");
        }
      }
    }, allowEvent));

    socket.on("select-cell", safeHandler(selectCellArgsSchema, ({ r, c }) => {
      const current = getCurrentRoom(socket);
      if (!current) return;
      const { roomId, room, alias } = current;

      const size = room.board.size;
      if ((r !== null && r >= size) || (c !== null && c >= size)) return;

      socket.to(channelOf(roomId)).emit("player-selected-cell", { alias, r, c });
    }, allowEvent));

    socket.on("disconnect", () => {
      // Not behind safeHandler (it carries no payload to parse), but it needs the same guarantee: an exception
      // escaping a listener stops the whole process, and with it every room.
      try {
        leaveCurrentRoom(socket);
      } catch (error) {
        logger.error("[socket] disconnect cleanup failed:", error);
      }
    });

    socket.on("restart-game", safeHandler(restartGameArgsSchema, (difficulty) => {
      const current = getCurrentRoom(socket);
      if (!current) return;
      const { roomId, room } = current;

      // Dropped without an answer: an error screen here would replace the game of everyone who is playing.
      if (!allowRestart(budgetKey()) || !allowBoardGeneration()) return;

      const board = generateSudoku(difficulty);

      room.board = board;
      room.played = false;
      room.difficulty = difficulty;
      room.currentGrid = board.initial.map(row => [...row]);
      room.filledCells = countInitialFilledCells(board.initial);
      room.notesGrid = {};

      io.to(channelOf(roomId)).emit("game-started", {
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
      socket.to(channelOf(current.roomId)).emit("emote-received", { alias: current.alias, emote });
    }, allowEvent));

    socket.on("set-color", safeHandler(setColorArgsSchema, (color) => {
      const current = getCurrentRoom(socket);
      if (!current) return;
      const { roomId, room } = current;

      const profile = room.profiles.get(socket.data.playerId);
      if (!profile) return;

      // Kept on the player, not on the socket: another tab does not get a cooldown of its own.
      const now = Date.now();
      if (profile.lastColorAt !== undefined && now - profile.lastColorAt < colorLimit.cooldownMs) return;
      profile.lastColorAt = now;

      if (profile.color === color) return;

      // Somebody else has it: the player who asked is shown the real state again, the others have nothing to learn.
      if (!colorIsFree(room, socket.data.playerId, color)) {
        socket.emit("players-updated", { players: snapshotPlayers(room) });
        return;
      }

      profile.color = color;
      io.to(channelOf(roomId)).emit("players-updated", { players: snapshotPlayers(room) });
    }, allowEvent));

    socket.on("toggle-note", safeHandler(toggleNoteArgsSchema, ({ r, c, v }) => {
      const current = getCurrentRoom(socket);
      if (!current) return;
      const { roomId, room, alias } = current;

      const size = room.board.size;

      if (r >= size || c >= size || v > size) return;

      room.played = true;

      const cellKey = `${r}-${c}`;
      if (!room.notesGrid[cellKey]) {
        room.notesGrid[cellKey] = {};
      }

      let assignedAlias: string | null = null;

      if (room.notesGrid[cellKey][v]) {
        delete room.notesGrid[cellKey][v];

        if (Object.keys(room.notesGrid[cellKey]).length === 0) {
          delete room.notesGrid[cellKey];
        }
      } else {
        room.notesGrid[cellKey][v] = alias;
        assignedAlias = alias;
      }

      io.to(channelOf(roomId)).emit("note-toggled", { r, c, v, alias: assignedAlias });
    }, allowEvent));
  });
};
