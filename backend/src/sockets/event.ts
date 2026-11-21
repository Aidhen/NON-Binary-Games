import { randomBytes } from "node:crypto";
import { Server, Socket, DefaultEventsMap } from "socket.io";
import { cellUpdateArgsSchema, sudokuMistakesArgsSchema, flowerFieldCellArgsSchema, flowerFieldModeArgsSchema, playerIdSchema, wordSearchLanguageArgsSchema, wordSearchSelectArgsSchema, checkWinCondition, countInitialFilledCells, EMOTE_COOLDOWN_MS, generateSudoku, generateTakuzu, MAX_PLAYERS_PER_ROOM, TAKUZU_SYMBOLS, joinRoomArgsSchema, restartGameArgsSchema, selectCellArgsSchema, sendEmoteArgsSchema, setColorArgsSchema, toggleNoteArgsSchema, voteGameArgsSchema, voteTableArgsSchema } from "@nbg/shared";
import type { ClientToServerEvents, DifficultyLevel, GameId, GameStartedPayload, ServerToClientEvents, SocketData, SudokuStartedPayload } from "@nbg/shared";
import { safeHandler } from "./safeHandler";
import { logger } from "../logger";
import { createKeyedRateLimiter, createRateLimiter } from "./rateLimiter";
import { RoomStore } from "../rooms/roomStore";
import type { GridGame, RoomGame, RoomState, SudokuGame, TakuzuGame, ValueGridGame } from "../rooms/roomStore";
import { createFlowerField, flowerFieldStarted, isRevealable, minesOf, revealCell, setExplosive, toggleFlag } from "../rooms/flowerField";
import { createWordSearch, selectWord, wordSearchStarted } from "../rooms/wordSearch";
import { assignProfile, colorIsFree, snapshotPlayers } from "../rooms/profiles";
import { chosenGame, snapshotLobby, wantsTable } from "../rooms/lobby";

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

/** A vote tells everybody in the room: a player cannot make the boxes flicker for the others by tapping fast. */
export const voteLimit = { cooldownMs: 200 };

/** The difficulty of the Sudoku a room opens. The players pick another one from the game, with a restart. */
export const FIRST_DIFFICULTY: DifficultyLevel = 'easy';

const createSudoku = (difficulty: DifficultyLevel): SudokuGame => {
  const board = generateSudoku(difficulty);
  return {
    id: 'sudoku',
    board,
    difficulty,
    currentGrid: board.initial.map(row => [...row]),
    filledCells: countInitialFilledCells(board.initial),
    notesGrid: {},
    won: false,
  };
};

const createTakuzu = (difficulty: DifficultyLevel): TakuzuGame => {
  const board = generateTakuzu(difficulty);
  return {
    id: 'takuzu',
    board,
    difficulty,
    currentGrid: board.initial.map(row => [...row]),
    filledCells: countInitialFilledCells(board.initial),
    won: false,
  };
};

/** One entry per game: a new id in GAME_IDS does not compile until it says how its state is created. `previous` is the game the room was playing. */
const createGame: Record<GameId, (difficulty: DifficultyLevel, previous?: RoomGame) => RoomGame> = {
  sudoku: createSudoku,
  takuzu: createTakuzu,
  'flower-field': createFlowerField,
  'word-search': createWordSearch,
};

/** The solution is not sent: see SudokuStartedPayload. */
const sudokuStarted = (game: SudokuGame): SudokuStartedPayload => ({
  game: 'sudoku',
  board: { initial: game.board.initial, size: game.board.size, boxSize: game.board.boxSize },
  difficulty: game.difficulty,
  currentGrid: game.currentGrid,
  notesGrid: game.notesGrid,
});

/** The solution is not sent: see TakuzuStartedPayload. */
const takuzuStarted = (game: TakuzuGame): GameStartedPayload => ({
  game: 'takuzu',
  size: game.board.size,
  initial: game.board.initial,
  currentGrid: game.currentGrid,
  difficulty: game.difficulty,
});

/** One entry per game: what a player is told about the game the room has open. */
const gameStarted = (game: RoomGame): GameStartedPayload => {
  switch (game.id) {
    case 'sudoku': return sudokuStarted(game);
    case 'takuzu': return takuzuStarted(game);
    case 'flower-field': return flowerFieldStarted(game);
    case 'word-search': return wordSearchStarted(game);
  }
};

/** The highest value a cell of the game can hold: a digit of the Sudoku, or one of the two symbols of the Takuzu. */
const maxValueOf = (game: ValueGridGame): number => (game.id === 'sudoku' ? game.board.size : TAKUZU_SYMBOLS.length);

/** Cells on each side of the grid. */
const sizeOf = (game: GridGame): number => {
  switch (game.id) {
    case 'flower-field': return game.size;
    case 'word-search': return game.puzzle.size;
    default: return game.board.size;
  }
};

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

/** Per address (per socket where the address is not known): rooms that can be created. A room costs memory, and each one can open a game (a board costs CPU), so they cannot be opened in bulk, and opening a new connection does not start over. Joining a room that exists is free. */
export const roomCreationLimit = { max: 5, windowMs: 10 * 60 * 1000 };

/** Per address (per socket where the address is not known): restarts of the game, each one generates a board. A few per session is what a player does. */
export const restartLimit = { max: 6, windowMs: 60 * 1000 };

/**
 * Boards generated per second. Generating one blocks the event loop for every room, so there are two limits:
 * one per address (per socket where the address is not known), so that a single busy client cannot use up the
 * whole budget and leave the other rooms unable to start a game, and one for all sockets together behind it,
 * as the safety net. A board must pass both; one refused by the shared limit is not charged to the client.
 */
export const boardGenerationLimit = { max: 2, windowMs: 1000 };
export const clientBoardGenerationLimit = { max: 1, windowMs: 1000 };

/**
 * How long a player whose last connection dropped is still counted in the room. A phone that changes network
 * or locks its screen comes back within this: the others see nothing, and the votes of the player stay. Zero
 * removes the player at once (the tests that are not about it use that).
 */
export const reconnectGrace = { ms: 30_000 };

/** The players who dropped and are being waited for, by `roomId playerId`. At most one per player of a room, and each one ends. */
const pendingDepartures = new Map<string, ReturnType<typeof setTimeout>>();
const departureKey = (roomId: string, playerId: string) => `${roomId} ${playerId}`;

/** A player who comes back in time: nobody has to know they were gone. */
const cancelDeparture = (roomId: string, playerId: string) => {
  const key = departureKey(roomId, playerId);
  clearTimeout(pendingDepartures.get(key));
  pendingDepartures.delete(key);
};

type PlayerLeft = (roomId: string, room: RoomState, tableVoteGone: boolean) => void;

/** Takes a player with no connection left out of the room, and tells the others. */
const removePlayer = (io: GameServer, roomId: string, room: RoomState, playerId: string, onPlayerLeft: PlayerLeft) => {
  room.players.delete(playerId);
  room.votes.delete(playerId);
  const tableVoteGone = room.tableVotes.delete(playerId);
  const alias = room.aliases.get(playerId);
  const channel = io.to(channelOf(roomId));
  if (alias) channel.emit("player-disconnected", alias);
  channel.emit("players-updated", { players: snapshotPlayers(room) });
  if (room.players.size > 0) onPlayerLeft(roomId, room, tableVoteGone);
  else rooms.expireWhenEmpty(roomId);
};

/**
 * Removes the socket from the room it is currently in (if any).
 * Used both when the socket moves to another room and when it disconnects.
 * `onPlayerLeft` is called when a player (not just one of their tabs) left a room where somebody remains.
 * A player whose connection dropped (`dropped`) is kept for `reconnectGrace` first; one who moved to another
 * room is gone at once.
 */
const leaveCurrentRoom = (io: GameServer, socket: GameSocket, onPlayerLeft: PlayerLeft, dropped = false) => {
  const roomId = socket.data.roomId;
  if (!roomId) return;

  const { playerId } = socket.data;
  socket.data.roomId = undefined;
  socket.data.alias = undefined;
  void socket.leave(channelOf(roomId));

  const room = rooms.get(roomId);
  if (!room) return;

  const sockets = room.players.get(playerId);
  sockets?.delete(socket.id);
  if (sockets?.size) return;

  // No connection left: the player stays in the list, with an empty set of sockets, until the wait is over.
  if (dropped && reconnectGrace.ms > 0 && sockets) {
    cancelDeparture(roomId, playerId);
    const timer = setTimeout(() => {
      pendingDepartures.delete(departureKey(roomId, playerId));
      const current = rooms.get(roomId);
      // Gone already (the room was dropped), or back with a new connection: nothing to do.
      if (current?.players.get(playerId)?.size !== 0) return;
      removePlayer(io, roomId, current, playerId, onPlayerLeft);
    }, reconnectGrace.ms);
    // A wait must not keep the process alive when the server shuts down.
    timer.unref?.();
    pendingDepartures.set(departureKey(roomId, playerId), timer);
    return;
  }

  cancelDeparture(roomId, playerId);
  removePlayer(io, roomId, room, playerId, onPlayerLeft);
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

/** The same, for the events of a game played on a grid: they mean nothing in a room that is playing another kind of game, or none. */
const getCurrentGridGame = (socket: GameSocket) => {
  const current = getCurrentRoom(socket);
  if (!current?.room.game) return undefined;

  return { ...current, game: current.room.game };
};

/** The same, for the events of a game where the players write a value in a cell (the Sudoku and the Takuzu). */
const getCurrentValueGame = (socket: GameSocket) => {
  const current = getCurrentRoom(socket);
  if (!current?.room.game || (current.room.game.id !== 'sudoku' && current.room.game.id !== 'takuzu')) return undefined;

  return { ...current, game: current.room.game };
};

/** The filled cells whose number is not the one of the solution. The given numbers are right by definition. */
const sudokuMistakesOf = (game: SudokuGame): [number, number][] => {
  const cells: [number, number][] = [];
  game.currentGrid.forEach((row, r) => row.forEach((value, c) => {
    if (game.board.initial[r][c] === 0 && value !== 0 && value !== game.board.solution[r][c]) cells.push([r, c]);
  }));
  return cells;
};

/** The same, for the events of the Flower Field. */
const getCurrentFlowerField = (socket: GameSocket) => {
  const current = getCurrentRoom(socket);
  if (current?.room.game?.id !== 'flower-field') return undefined;

  return { ...current, game: current.room.game };
};

/** The same, for the events of the Word Search. */
const getCurrentWordSearch = (socket: GameSocket) => {
  const current = getCurrentRoom(socket);
  if (current?.room.game?.id !== 'word-search') return undefined;

  return { ...current, game: current.room.game };
};

/** The same, for the events of the Sudoku: they mean nothing in a room that is not playing one. */
const getCurrentSudoku = (socket: GameSocket) => {
  const current = getCurrentRoom(socket);
  if (current?.room.game?.id !== 'sudoku') return undefined;

  return { ...current, game: current.room.game };
};

/** The id the browser sent in the handshake, or the socket id for clients that sent none (or garbage). */
const resolvePlayerId = (socket: GameSocket): string => {
  const parsed = playerIdSchema.safeParse(socket.handshake.auth?.playerId);
  return parsed.success ? parsed.data : socket.id;
};

export const setupSocketHandlers = (io: GameServer) => {
  const allowBoardGeneration = createRateLimiter(boardGenerationLimit.max, boardGenerationLimit.windowMs);
  const allowClientBoardGeneration = createKeyedRateLimiter(clientBoardGenerationLimit.max, clientBoardGenerationLimit.windowMs);
  const allowRoomCreation = createKeyedRateLimiter(roomCreationLimit.max, roomCreationLimit.windowMs);
  const allowRestart = createKeyedRateLimiter(restartLimit.max, restartLimit.windowMs);

  /** Charges one board to `key` and to the server. False, with nothing charged, when either has none left. */
  const chargeBoard = (key: string): boolean => {
    if (!allowClientBoardGeneration(key)) return false;
    if (allowBoardGeneration()) return true;
    allowClientBoardGeneration.refund(key);
    return false;
  };

  /** A board that was charged and could not be made is given back: trying again should not cost twice. */
  const refundBoard = (key: string) => {
    allowBoardGeneration.refund();
    allowClientBoardGeneration.refund(key);
  };

  /**
   * Makes the state of a game, or null when its generator failed. The error is logged here; telling the players
   * is up to the caller, who knows who asked.
   */
  const makeGame = (make: () => RoomGame): RoomGame | null => {
    try {
      return make();
    } catch (error) {
      logger.error("[socket] a board could not be generated:", error);
      return null;
    }
  };

  /**
   * Opens the game the room has chosen, if it has chosen one. Returns false when the room stays at the table:
   * nobody has a majority yet, the server is generating too many boards right now (the votes stay, and the
   * next vote tries again), or the board could not be made (the room is told, and the votes stay too).
   * `key` is the budget of the player whose action decided it.
   */
  const openChosenGame = (roomId: string, room: RoomState, key: string): boolean => {
    if (room.game) return false;

    const chosen = chosenGame(room);
    if (!chosen || !chargeBoard(key)) return false;

    const game = makeGame(() => createGame[chosen](FIRST_DIFFICULTY));
    if (!game) {
      refundBoard(key);
      io.to(channelOf(roomId)).emit("board-failed");
      return false;
    }

    room.game = game;
    room.votes.clear();
    room.tableVotes.clear();
    io.to(channelOf(roomId)).emit("lobby-updated", snapshotLobby(room));
    io.to(channelOf(roomId)).emit("game-started", gameStarted(game));
    return true;
  };

  /**
   * After a vote changed or a player left: the room opens its game, goes back to the table, or tells everybody
   * where the votes are. Going back drops the game: the boxes on the table are the only way to open another one.
   * During a game a player who leaves changes something only if they had asked to go back, or if their going
   * turns the votes that are left into a majority; otherwise there is nothing new to tell.
   */
  const settleLobby = (roomId: string, room: RoomState, key: string, tableVoteGone = true) => {
    if (room.game) {
      if (wantsTable(room)) {
        room.game = null;
        room.votes.clear();
        room.tableVotes.clear();
      } else if (!tableVoteGone) {
        return;
      }
    } else if (openChosenGame(roomId, room, key)) {
      return;
    }
    io.to(channelOf(roomId)).emit("lobby-updated", snapshotLobby(room));
  };

  io.on("connection", (socket: GameSocket) => {
    socket.data.playerId = resolvePlayerId(socket);
    const allowEvent = createRateLimiter(eventLimit.max, eventLimit.windowMs);
    const budgetKey = () => socket.data.address ?? socket.id;
    // The lobby settled after something this socket did is paid from its budget.
    const settle = (roomId: string, room: RoomState, tableVoteGone?: boolean) => settleLobby(roomId, room, budgetKey(), tableVoteGone);

    /**
     * A new board for the game the room is playing, asked by this socket (restart, language). Paid like a
     * restart; dropped without an answer when a budget is used up, since an error screen here would replace the
     * game of everybody who is playing. When the board cannot be made, nothing is charged and only the player
     * who asked is told.
     */
    const replaceBoard = (roomId: string, room: RoomState, make: () => RoomGame) => {
      const key = budgetKey();
      if (!allowRestart(key)) return;
      if (!chargeBoard(key)) {
        allowRestart.refund(key);
        return;
      }

      const game = makeGame(make);
      if (!game) {
        refundBoard(key);
        allowRestart.refund(key);
        socket.emit("board-failed");
        return;
      }

      room.game = game;
      room.played = false;
      io.to(channelOf(roomId)).emit("game-started", gameStarted(game));
    };

    socket.on("join-room", safeHandler(joinRoomArgsSchema, (roomId) => {
      const existingRoom = rooms.get(roomId);

      // Checked before leaving the current room, so a refused player stays where they are.
      if (!existingRoom && rooms.isFull()) {
        socket.emit("join-error", "server-full");
        return;
      }
      if (!existingRoom && !allowRoomCreation(budgetKey())) {
        socket.emit("join-error", "too-fast");
        return;
      }
      if (existingRoom && !existingRoom.players.has(socket.data.playerId) && existingRoom.players.size >= MAX_PLAYERS_PER_ROOM) {
        // A player who is only being waited for gives up their seat to one who is here: otherwise joining and
        // dropping again and again could keep a room full with nobody in it.
        const awaited = [...existingRoom.players].find(([, sockets]) => sockets.size === 0)?.[0];
        if (awaited === undefined) {
          socket.emit("join-error", "room-full");
          return;
        }
        cancelDeparture(roomId, awaited);
        removePlayer(io, roomId, existingRoom, awaited, settle);
      }

      if (socket.data.roomId !== roomId) {
        leaveCurrentRoom(io, socket, settle);
      }

      void socket.join(channelOf(roomId));
      socket.data.roomId = roomId;

      let room = rooms.get(roomId);
      rooms.cancelExpiry(roomId);
      cancelDeparture(roomId, socket.data.playerId);

      if (!room) {
        // No game yet: the players choose it at the table, and only then a board is generated.
        room = {
          game: null,
          votes: new Map(),
          tableVotes: new Set(),
          players: new Map(),
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

      socket.emit("lobby-updated", snapshotLobby(room));
      if (room.game) socket.emit("game-started", gameStarted(room.game));
    }, allowEvent));

    socket.on("vote-game", safeHandler(voteGameArgsSchema, (game) => {
      const current = getCurrentRoom(socket);
      if (!current) return;
      const { roomId, room } = current;

      // The game of a room is chosen once. A vote that comes after is from a page that has not caught up yet.
      if (room.game) return;

      const now = Date.now();
      const lastVoteAt = socket.data.lastVoteAt;
      if (lastVoteAt !== undefined && now - lastVoteAt < voteLimit.cooldownMs) return;
      socket.data.lastVoteAt = now;

      // The same vote again tells the others nothing new. It still gets a chance to open the game: that is the
      // way out for a room that had its votes but found the server too busy to generate a board.
      if ((room.votes.get(socket.data.playerId) ?? null) === game) {
        openChosenGame(roomId, room, budgetKey());
        return;
      }

      if (game === null) room.votes.delete(socket.data.playerId);
      else room.votes.set(socket.data.playerId, game);

      settle(roomId, room);
    }, allowEvent));

    socket.on("vote-table", safeHandler(voteTableArgsSchema, (wants) => {
      const current = getCurrentRoom(socket);
      if (!current) return;
      const { roomId, room } = current;

      // Only a room that is playing can go back. A vote that comes after is from a page that has not caught up yet.
      if (!room.game) return;

      // The same cooldown as the votes for a game: one player tapping fast should not flood the room with updates.
      const now = Date.now();
      const lastVoteAt = socket.data.lastVoteAt;
      if (lastVoteAt !== undefined && now - lastVoteAt < voteLimit.cooldownMs) return;
      socket.data.lastVoteAt = now;

      // The same vote again tells the others nothing new.
      if (room.tableVotes.has(socket.data.playerId) === wants) return;

      if (wants) room.tableVotes.add(socket.data.playerId);
      else room.tableVotes.delete(socket.data.playerId);

      settle(roomId, room);
    }, allowEvent));

    socket.on("cell-update", safeHandler(cellUpdateArgsSchema, ({ r, c, v }, acknowledge?) => {
      const current = getCurrentValueGame(socket);
      if (!current) {
        acknowledge?.({ ok: false });
        return;
      }
      const { roomId, room, game } = current;

      const size = game.board.initial.length;

      if (r >= size || c >= size || v > maxValueOf(game)) {
        acknowledge?.({ ok: false });
        return;
      }

      if (game.board.initial[r][c] !== 0) {
        acknowledge?.({ ok: false });
        return;
      }

      const prevValue = game.currentGrid[r][c];

      if (prevValue === v) {
        acknowledge?.({ ok: true });
        return;
      }

      if (prevValue === 0 && v !== 0) {
        game.filledCells++;
      } else if (prevValue !== 0 && v === 0) {
        game.filledCells--;
      }

      game.currentGrid[r][c] = v;
      room.played = true;
      socket.to(channelOf(roomId)).emit("cell-updated", { r, c, v });
      acknowledge?.({ ok: true });

      // Once per game. A cell changed on a solved board is still shared (it is the board of the room), but the
      // victory is not announced again: emptying a cell and filling it back would show it to everybody each time.
      const totalCells = size * size;
      if (!game.won && game.filledCells === totalCells && checkWinCondition(game.currentGrid, game.board.solution)) {
        game.won = true;
        io.to(channelOf(roomId)).emit("game-won");
      }
    }, allowEvent));

    // Only the wrong cells go back, never the right number: the page shows the same thing it showed when it had
    // the solution, and the solution stays here. The question is cheap and paid like any other event.
    socket.on("sudoku:mistakes", safeHandler(sudokuMistakesArgsSchema, (acknowledge) => {
      const current = getCurrentSudoku(socket);
      acknowledge({ cells: current ? sudokuMistakesOf(current.game) : [] });
    }, allowEvent));

    socket.on("select-cell", safeHandler(selectCellArgsSchema, ({ r, c }) => {
      const current = getCurrentGridGame(socket);
      if (!current) return;
      const { roomId, game, alias } = current;

      const size = sizeOf(game);
      if ((r !== null && r >= size) || (c !== null && c >= size)) return;

      socket.to(channelOf(roomId)).emit("player-selected-cell", { alias, r, c });
    }, allowEvent));

    socket.on("disconnect", () => {
      // Not behind safeHandler (it carries no payload to parse), but it needs the same guarantee: an exception
      // escaping a listener stops the whole process, and with it every room.
      try {
        leaveCurrentRoom(io, socket, settle, true);
      } catch (error) {
        logger.error("[socket] disconnect cleanup failed:", error);
      }
    });

    socket.on("restart-game", safeHandler(restartGameArgsSchema, (difficulty) => {
      // The same game again: choosing another one is done at the table, after the room has voted to go back to it.
      const current = getCurrentGridGame(socket);
      if (!current) return;
      const { roomId, room, game: playing } = current;

      replaceBoard(roomId, room, () => createGame[playing.id](difficulty, playing));
    }, allowEvent));

    socket.on("flower-field:reveal", safeHandler(flowerFieldCellArgsSchema, ({ r, c }) => {
      const current = getCurrentFlowerField(socket);
      if (!current) return;
      const { roomId, room, game } = current;

      if (r >= game.size || c >= game.size || !isRevealable(game, r, c)) return;
      // The first cell lays out the mines, which costs what generating the board of another game costs.
      const laysMines = !game.mines;
      if (laysMines && !chargeBoard(budgetKey())) return;

      let result: ReturnType<typeof revealCell>;
      try {
        result = revealCell(game, r, c);
      } catch (error) {
        if (!laysMines) throw error;
        logger.error("[socket] the mines could not be laid out:", error);
        refundBoard(budgetKey());
        socket.emit("board-failed");
        return;
      }
      if (!result) return;

      room.played = true;
      const channel = io.to(channelOf(roomId));
      if (result.cells.length > 0) channel.emit("flower-field:updated", { cells: result.cells });
      if (result.lost) channel.emit("flower-field:lost", { mines: minesOf(game), exploded: result.lost });
      if (result.won) channel.emit("game-won");
    }, allowEvent));

    socket.on("flower-field:flag", safeHandler(flowerFieldCellArgsSchema, ({ r, c }) => {
      const current = getCurrentFlowerField(socket);
      if (!current) return;
      const { roomId, room, game, alias } = current;

      if (r >= game.size || c >= game.size) return;

      const result = toggleFlag(game, r, c, alias);
      if (!result) return;

      room.played = true;
      io.to(channelOf(roomId)).emit("flower-field:flagged", { r, c, alias: result.alias });
    }, allowEvent));

    socket.on("flower-field:set-mode", safeHandler(flowerFieldModeArgsSchema, ({ explosive }) => {
      const current = getCurrentFlowerField(socket);
      if (!current) return;
      const { roomId, game } = current;

      // Too late: the player who asked is shown the real option again, the others have nothing to learn.
      if (!setExplosive(game, explosive)) {
        socket.emit("flower-field:mode", { explosive: game.explosive });
        return;
      }

      io.to(channelOf(roomId)).emit("flower-field:mode", { explosive });
    }, allowEvent));

    socket.on("word-search:select", safeHandler(wordSearchSelectArgsSchema, ({ from, to }) => {
      const current = getCurrentWordSearch(socket);
      if (!current) return;
      const { roomId, room, game, alias } = current;

      const size = game.puzzle.size;
      if (from.r >= size || from.c >= size || to.r >= size || to.c >= size) return;

      const result = selectWord(game, from, to, alias);
      if (!result) return;

      room.played = true;
      const channel = io.to(channelOf(roomId));
      channel.emit("word-search:found", result.found);
      if (result.won) channel.emit("game-won");
    }, allowEvent));

    socket.on("word-search:set-language", safeHandler(wordSearchLanguageArgsSchema, ({ language }) => {
      const current = getCurrentWordSearch(socket);
      if (!current) return;
      const { roomId, room, game: playing } = current;

      if (playing.language === language) return;
      // A new puzzle costs what a restart costs, and is paid the same way.
      replaceBoard(roomId, room, () => createWordSearch(playing.difficulty, { ...playing, language }));
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
      const current = getCurrentSudoku(socket);
      if (!current) return;
      const { roomId, room, game, alias } = current;

      const size = game.board.size;

      if (r >= size || c >= size || v > size) return;

      room.played = true;

      const cellKey = `${r}-${c}`;
      if (!game.notesGrid[cellKey]) {
        game.notesGrid[cellKey] = {};
      }

      let assignedAlias: string | null = null;

      if (game.notesGrid[cellKey][v]) {
        delete game.notesGrid[cellKey][v];

        if (Object.keys(game.notesGrid[cellKey]).length === 0) {
          delete game.notesGrid[cellKey];
        }
      } else {
        game.notesGrid[cellKey][v] = alias;
        assignedAlias = alias;
      }

      io.to(channelOf(roomId)).emit("note-toggled", { r, c, v, alias: assignedAlias });
    }, allowEvent));
  });
};
