import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server, Socket as ServerSocket } from 'socket.io';
import Client, { Socket as ClientSocket } from 'socket.io-client';
import { setupSocketHandlers, rooms, eventLimit, roomCreationLimit, restartLimit, boardGenerationLimit } from './event';
import { EMOTE_COOLDOWN_MS, EMOTES, MAX_PLAYERS_PER_ROOM } from '@nbg/shared';
import type { JoinError } from '@nbg/shared';
import type { ClientToServerEvents, ServerToClientEvents } from '@nbg/shared';

// Read before any test changes them: a limit that is not finite protects nothing.
const defaultLimits = { roomCreation: roomCreationLimit.max, restart: restartLimit.max, boardGeneration: boardGenerationLimit.max };

type TestClientSocket = ClientSocket<ServerToClientEvents, ClientToServerEvents>;
type TestServerSocket = ServerSocket<ClientToServerEvents, ServerToClientEvents>;
type GameStartedPayload = Parameters<ServerToClientEvents['game-started']>[0];
type CellUpdatedPayload = Parameters<ServerToClientEvents['cell-updated']>[0];
type PlayerSelectedCellPayload = Parameters<ServerToClientEvents['player-selected-cell']>[0];
type NoteToggledPayload = Parameters<ServerToClientEvents['note-toggled']>[0];
type EmoteReceivedPayload = Parameters<ServerToClientEvents['emote-received']>[0];

describe('Socket Events Security & Bounds Checking', () => {
  let io: Server<ClientToServerEvents, ServerToClientEvents>;
  let clientSocket!: TestClientSocket;

  const port = 4001;
  const testRoomId = 'security-test-room';
  const clients = new Set<TestClientSocket>();
  const serverSockets = new Map<string, TestServerSocket>();

  /**
   * Connects a Socket.IO client to the test server.
   */
  const connectTestClient = async (playerId?: unknown): Promise<TestClientSocket> => {
    const socket = Client(`http://127.0.0.1:${port}`, {
      autoConnect: false,
      ...(playerId === undefined ? {} : { auth: { playerId } }),
    }) as TestClientSocket;

    clients.add(socket);

    await new Promise<void>((resolve, reject) => {
      const onConnect = () => { socket.off('connect_error', onError); resolve(); };
      const onError = (error: Error) => { socket.off('connect', onConnect); reject(error); };
      socket.once('connect', onConnect);
      socket.once('connect_error', onError);
      socket.connect();
    });

    return socket;
  };

  /**
   * Flushes pending socket events by sending a barrier event to the server.
   * The server replies only after processing all previously received events from that client.
   */
  const flushSocketEvents = (socket: TestClientSocket = clientSocket): Promise<void> =>
    new Promise<void>((resolve) => {
      (socket as unknown as { emit: (event: string, ack: () => void) => unknown }).emit('__test-barrier', resolve);
    });

  /**
   * Joins a room and waits for the game-started event.
   */
  const joinRoom = async (
    socket: TestClientSocket = clientSocket,
    roomId = testRoomId,
    difficulty: 'easy' | 'medium' | 'hard' = 'easy',
  ) => {
    const gameStarted = new Promise<void>((resolve) => { socket.once('game-started', () => resolve()); });

    socket.emit('join-room', roomId, difficulty);
    await gameStarted;

    const room = rooms.get(roomId);
    if (!room) throw new Error(`Room "${roomId}" was not created`);

    return room;
  };

  /**
   * Returns the server-side socket associated with a client.
   */
  const getServerSocket = (socket: TestClientSocket): TestServerSocket => {
    if (!socket.id) throw new Error('Client does not have a socket ID');

    const serverSocket = serverSockets.get(socket.id);
    if (!serverSocket) throw new Error(`Server socket not found for ${socket.id}`);

    return serverSocket;
  };

  /**
   * Finds a cell in the grid that satisfies a predicate.
   */
  const findCell = (grid: number[][], predicate: (value: number) => boolean) => {
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (predicate(grid[r][c])) return { r, c, value: grid[r][c] };
      }
    }
    throw new Error('No matching cell found');
  };

  beforeAll(async () => {
    // Tests send bursts of events and create many rooms: the limits have their own tests.
    eventLimit.max = Number.POSITIVE_INFINITY;
    roomCreationLimit.max = Number.POSITIVE_INFINITY;
    restartLimit.max = Number.POSITIVE_INFINITY;
    boardGenerationLimit.max = Number.POSITIVE_INFINITY;
    const httpServer = createServer();

    io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);
    setupSocketHandlers(io);

    /**
     * Auxiliary listeners to synchronize and inspect connections in tests.
     */
    io.on('connection', (socket) => {
      serverSockets.set(socket.id, socket);
      (socket as any).on('__test-barrier', (ack: () => void) => ack());
      socket.on('disconnect', () => { serverSockets.delete(socket.id); });
    });

    await new Promise<void>((resolve, reject) => {
      httpServer.once('error', reject);
      httpServer.listen(port, resolve);
    });

    clientSocket = await connectTestClient();
  });

  afterAll(async () => {
    for (const socket of clients) socket.disconnect();
    clients.clear();
    rooms.clear();
    serverSockets.clear();
    await new Promise<void>((resolve) => { io.close(() => resolve()); });
  });

  beforeEach(() => {
    rooms.clear();
    // Most tests expect an empty room to be gone right away; the grace period has its own tests.
    rooms.emptyRoomTtlMs = 0;
    rooms.maxRooms = 1000;
    eventLimit.max = Number.POSITIVE_INFINITY;
    roomCreationLimit.max = Number.POSITIVE_INFINITY;
    restartLimit.max = Number.POSITIVE_INFINITY;
    boardGenerationLimit.max = Number.POSITIVE_INFINITY;
  });

  // -------------------------------------------------------
  // JOIN ROOM
  // -------------------------------------------------------

  describe('join-room', () => {
    it('initializes room state on join', async () => {
      const gameStarted = new Promise<GameStartedPayload>((resolve) => {
        clientSocket.once('game-started', resolve);
      });

      clientSocket.emit('join-room', testRoomId, 'easy');

      const payload = await gameStarted;
      const room = rooms.get(testRoomId);

      expect(room).toBeDefined();
      expect(payload.board).toBeDefined();
      expect(payload.currentGrid).toBeDefined();
      expect(payload.notesGrid).toEqual({});
      expect(room!.currentGrid).toEqual(room!.board.initial);
      expect(room!.players.has(clientSocket.id!)).toBe(true);
    });

    it('allows a second player to join an existing room', async () => {
      await joinRoom();

      const secondClient = await connectTestClient();

      try {
        const secondGameStarted = new Promise<GameStartedPayload>((resolve) => {
          secondClient.once('game-started', resolve);
        });

        secondClient.emit('join-room', testRoomId, 'hard');

        const payload = await secondGameStarted;
        const room = rooms.get(testRoomId)!;

        expect(payload.board).toEqual(room.board);
        expect(room.difficulty).toBe('easy');
        expect(payload.difficulty).toBe('easy');
        expect(room.players.size).toBe(2);
        expect(room.players.has(secondClient.id!)).toBe(true);
      } finally {
        secondClient.disconnect();
      }
    });
  });

  // -------------------------------------------------------
  // TOGGLE NOTE
  // -------------------------------------------------------

  describe('toggle-note malicious inputs', () => {
    beforeEach(async () => { await joinRoom(); });

    it('rejects negative coordinates', async () => {
      const room = rooms.get(testRoomId)!;
      clientSocket.emit('toggle-note', { r: -1, c: 5, v: 3 });
      await flushSocketEvents();
      expect(room.notesGrid['-1-5']).toBeUndefined();
    });

    it('rejects coordinates greater than or equal to the board size', async () => {
      const room = rooms.get(testRoomId)!;
      const size = room.board.size;
      clientSocket.emit('toggle-note', { r: size, c: 0, v: 3 });
      await flushSocketEvents();
      expect(room.notesGrid[`${size}-0`]).toBeUndefined();
    });

    it('rejects values less than 1 or greater than the board size', async () => {
      const room = rooms.get(testRoomId)!;
      const size = room.board.size;
      clientSocket.emit('toggle-note', { r: 0, c: 0, v: 0 });
      clientSocket.emit('toggle-note', { r: 0, c: 0, v: size + 1 });
      await flushSocketEvents();
      expect(room.notesGrid['0-0']).toBeUndefined();
    });

    it('rejects non-integer coordinates and values', async () => {
      const room = rooms.get(testRoomId)!;
      clientSocket.emit('toggle-note', { r: 1.5, c: 2, v: 3 } as any);
      clientSocket.emit('toggle-note', { r: 1, c: 2, v: '3' } as any);
      await flushSocketEvents();
      expect(room.notesGrid['1.5-2']).toBeUndefined();
      expect(room.notesGrid['1-2']).toBeUndefined();
    });

    it('adds a valid note and removes it when toggled again', async () => {
      const room = rooms.get(testRoomId)!;

      const noteAdded = new Promise<NoteToggledPayload>((resolve) => {
        clientSocket.once('note-toggled', resolve);
      });

      clientSocket.emit('toggle-note', { r: 2, c: 3, v: 5 });

      await expect(noteAdded).resolves.toEqual({ r: 2, c: 3, v: 5, playerId: clientSocket.id });
      expect(room.notesGrid['2-3'][5]).toBe(clientSocket.id);

      const noteRemoved = new Promise<NoteToggledPayload>((resolve) => {
        clientSocket.once('note-toggled', resolve);
      });

      clientSocket.emit('toggle-note', { r: 2, c: 3, v: 5 });

      await expect(noteRemoved).resolves.toEqual({ r: 2, c: 3, v: 5, playerId: null });
      expect(room.notesGrid['2-3']).toBeUndefined();
    });
  });

  // -------------------------------------------------------
  // CELL UPDATE
  // -------------------------------------------------------

  describe('cell-update', () => {
    beforeEach(async () => { await joinRoom(); });

    it('ignores updates from a socket that has not joined any room', async () => {
      const room = rooms.get(testRoomId)!;
      const cell = findCell(room.board.initial, (value) => value === 0);
      const outsider = await connectTestClient();

      try {
        outsider.emit('cell-update', { r: cell.r, c: cell.c, v: room.board.solution[cell.r][cell.c] });
        await flushSocketEvents(outsider);

        expect(room.currentGrid[cell.r][cell.c]).toBe(0);
      } finally {
        outsider.disconnect();
      }
    });

    it('rejects invalid coordinates and values', async () => {
      const room = rooms.get(testRoomId)!;
      const size = room.board.initial.length;
      const originalGrid = room.currentGrid.map((row) => [...row]);

      const invalidPayloads = [
        { r: -1, c: 0, v: 1 },
        { r: size, c: 0, v: 1 },
        { r: 0.5, c: 0, v: 1 },
        { r: 0, c: -1, v: 1 },
        { r: 0, c: size, v: 1 },
        { r: 0, c: 0.5, v: 1 },
        { r: 0, c: 0, v: -1 },
        { r: 0, c: 0, v: size + 1 },
        { r: 0, c: 0, v: 1.5 },
        { r: 0, c: 0, v: '3' },
      ];

      for (const payload of invalidPayloads) {
        clientSocket.emit('cell-update', payload as any);
      }

      await flushSocketEvents();
      expect(room.currentGrid).toEqual(originalGrid);
    });

    it('prevents modifying initial cells', async () => {
      const room = rooms.get(testRoomId)!;
      const cell = findCell(room.board.initial, (value) => value !== 0);
      const originalValue = room.currentGrid[cell.r][cell.c];

      clientSocket.emit('cell-update', { r: cell.r, c: cell.c, v: 0 });
      await flushSocketEvents();

      expect(room.currentGrid[cell.r][cell.c]).toBe(originalValue);
    });

    it('updates an empty cell and increments filledCells', async () => {
      const room = rooms.get(testRoomId)!;
      const cell = findCell(room.board.initial, (value) => value === 0);
      const originalFilledCells = room.filledCells;
      const value = room.board.solution[cell.r][cell.c];

      clientSocket.emit('cell-update', { r: cell.r, c: cell.c, v: value });
      await flushSocketEvents();

      expect(room.currentGrid[cell.r][cell.c]).toBe(value);
      expect(room.filledCells).toBe(originalFilledCells + 1);
    });

    it('decrements filledCells when a cell is cleared', async () => {
      const room = rooms.get(testRoomId)!;
      const cell = findCell(room.board.initial, (value) => value === 0);

      room.currentGrid[cell.r][cell.c] = 4;
      room.filledCells += 1;

      const originalFilledCells = room.filledCells;

      clientSocket.emit('cell-update', { r: cell.r, c: cell.c, v: 0 });
      await flushSocketEvents();

      expect(room.currentGrid[cell.r][cell.c]).toBe(0);
      expect(room.filledCells).toBe(originalFilledCells - 1);
    });

    it('does not alter filledCells when replacing a non-zero value', async () => {
      const room = rooms.get(testRoomId)!;
      const cell = findCell(room.board.initial, (value) => value === 0);

      room.currentGrid[cell.r][cell.c] = 4;
      room.filledCells += 1;

      const originalFilledCells = room.filledCells;

      clientSocket.emit('cell-update', { r: cell.r, c: cell.c, v: 5 });
      await flushSocketEvents();

      expect(room.currentGrid[cell.r][cell.c]).toBe(5);
      expect(room.filledCells).toBe(originalFilledCells);
    });

    it('ignores an update with the same current value', async () => {
      const room = rooms.get(testRoomId)!;
      const cell = findCell(room.board.initial, (value) => value === 0);

      room.currentGrid[cell.r][cell.c] = 4;

      const originalFilledCells = room.filledCells;

      clientSocket.emit('cell-update', { r: cell.r, c: cell.c, v: 4 });
      await flushSocketEvents();

      expect(room.currentGrid[cell.r][cell.c]).toBe(4);
      expect(room.filledCells).toBe(originalFilledCells);
    });

    it('forwards updates to other players in the room', async () => {
      const room = rooms.get(testRoomId)!;
      const observer = await connectTestClient();

      try {
        await joinRoom(observer, testRoomId);

        const cell = findCell(room.board.initial, (value) => value === 0);
        const value = room.board.solution[cell.r][cell.c];

        const updateReceived = new Promise<CellUpdatedPayload>((resolve) => {
          observer.once('cell-updated', resolve);
        });

        clientSocket.emit('cell-update', { r: cell.r, c: cell.c, v: value });

        await expect(updateReceived).resolves.toEqual({ r: cell.r, c: cell.c, v: value });
      } finally {
        observer.disconnect();
      }
    });

    it('emits game-won when the grid is completed correctly', async () => {
      const room = rooms.get(testRoomId)!;
      const size = room.board.initial.length;
      const cell = findCell(room.board.initial, (value) => value === 0);

      room.currentGrid = room.board.solution.map((row) => [...row]);
      room.currentGrid[cell.r][cell.c] = 0;
      room.filledCells = size * size - 1;

      const gameWon = new Promise<void>((resolve) => { clientSocket.once('game-won', resolve); });

      clientSocket.emit('cell-update', {
        r: cell.r,
        c: cell.c,
        v: room.board.solution[cell.r][cell.c],
      });

      await gameWon;
      expect(room.currentGrid).toEqual(room.board.solution);
    });

    it('does not emit game-won when the count is complete but the grid is incorrect', async () => {
      const room = rooms.get(testRoomId)!;
      const size = room.board.initial.length;
      const cell = findCell(room.board.initial, (value) => value === 0);

      // Simulate reaching the total cell count while keeping the grid incorrect.
      room.filledCells = size * size - 1;

      let gameWon = false;
      const onGameWon = () => { gameWon = true; };
      clientSocket.on('game-won', onGameWon);

      try {
        clientSocket.emit('cell-update', {
          r: cell.r,
          c: cell.c,
          v: room.board.solution[cell.r][cell.c],
        });

        await flushSocketEvents();
        expect(gameWon).toBe(false);
      } finally {
        clientSocket.off('game-won', onGameWon);
      }
    });
  });

  // -------------------------------------------------------
  // SELECT CELL
  // -------------------------------------------------------

  describe('select-cell', () => {
    beforeEach(async () => { await joinRoom(); });

    it('forwards cell selection to other players', async () => {
      const observer = await connectTestClient();

      try {
        await joinRoom(observer, testRoomId);

        const selection = new Promise<PlayerSelectedCellPayload>((resolve) => {
          observer.once('player-selected-cell', resolve);
        });

        clientSocket.emit('select-cell', { r: 2, c: 3 });

        await expect(selection).resolves.toEqual({ playerId: clientSocket.id, r: 2, c: 3 });
      } finally {
        observer.disconnect();
      }
    });

    it('forwards cell deselection to other players', async () => {
      const observer = await connectTestClient();

      try {
        await joinRoom(observer, testRoomId);

        const selection = new Promise<PlayerSelectedCellPayload>((resolve) => {
          observer.once('player-selected-cell', resolve);
        });

        clientSocket.emit('select-cell', { r: null, c: null });

        await expect(selection).resolves.toEqual({ playerId: clientSocket.id, r: null, c: null });
      } finally {
        observer.disconnect();
      }
    });
  });

  // -------------------------------------------------------
  // RESTART GAME
  // -------------------------------------------------------

  describe('restart-game', () => {
    beforeEach(async () => { await joinRoom(); });

    it('ignores restart from a socket that has not joined any room', async () => {
      const room = rooms.get(testRoomId)!;
      const originalBoard = room.board;
      const outsider = await connectTestClient();

      try {
        outsider.emit('restart-game', 'hard');
        await flushSocketEvents(outsider);

        expect(room.board).toBe(originalBoard);
        expect(room.difficulty).toBe('easy');
      } finally {
        outsider.disconnect();
      }
    });

    it('restarts the game and resets the initial state', async () => {
      const room = rooms.get(testRoomId)!;

      room.currentGrid = room.currentGrid.map((row) => row.map(() => 9));
      room.filledCells = 0;
      room.notesGrid['0-0'] = { 5: clientSocket.id! };

      const restarted = new Promise<GameStartedPayload>((resolve) => {
        clientSocket.once('game-started', resolve);
      });

      clientSocket.emit('restart-game', 'medium');

      const payload = await restarted;

      expect(room.difficulty).toBe('medium');
      expect(payload.difficulty).toBe('medium');
      expect(room.currentGrid).toEqual(room.board.initial);
      expect(room.notesGrid).toEqual({});
      expect(room.filledCells).toBe(
        room.board.initial.flat().filter((value) => value !== 0).length,
      );
      expect(payload.board).toEqual(room.board);
      expect(payload.currentGrid).toEqual(room.board.initial);
      expect(payload.notesGrid).toEqual({});
    });

    it('notifies other players of the restart', async () => {
      const observer = await connectTestClient();

      try {
        await joinRoom(observer, testRoomId);

        const restarted = new Promise<GameStartedPayload>((resolve) => {
          observer.once('game-started', resolve);
        });

        clientSocket.emit('restart-game', 'hard');

        const payload = await restarted;

        expect(payload.board).toBeDefined();
        expect(payload.currentGrid).toEqual(payload.board.initial);
        expect(payload.notesGrid).toEqual({});
      } finally {
        observer.disconnect();
      }
    });
  });

  // -------------------------------------------------------
  // DISCONNECT
  // -------------------------------------------------------

  describe('disconnect', () => {
    it('removes a disconnected player and keeps the room for others', async () => {
      const room = await joinRoom();
      const observer = await connectTestClient();

      try {
        await joinRoom(observer, testRoomId);

        const observerId = observer.id!;
        const observerServerSocket = getServerSocket(observer);

        const playerDisconnected = new Promise<string>((resolve) => {
          clientSocket.once('player-disconnected', resolve);
        });

        const serverDisconnected = new Promise<void>((resolve) => {
          observerServerSocket.once('disconnect', () => resolve());
        });

        observer.disconnect();

        await expect(playerDisconnected).resolves.toBe(observerId);
        await serverDisconnected;

        expect(room.players.has(observerId)).toBe(false);
        expect(room.players.has(clientSocket.id!)).toBe(true);
        expect(rooms.has(testRoomId)).toBe(true);
      } finally {
        observer.disconnect();
      }
    });

    it('deletes the room when the last player disconnects', async () => {
      const observer = await connectTestClient();
      const roomId = 'solo-disconnect-room';

      try {
        await joinRoom(observer, roomId);

        const observerServerSocket = getServerSocket(observer);

        const serverDisconnected = new Promise<void>((resolve) => {
          observerServerSocket.once('disconnect', () => resolve());
        });

        observer.disconnect();
        await serverDisconnected;

        expect(rooms.has(roomId)).toBe(false);
      } finally {
        observer.disconnect();
      }
    });
  });

  // -------------------------------------------------------
  // LIMITS
  // -------------------------------------------------------

  describe('limits', () => {
    const joinOutcome = (socket: TestClientSocket, roomId: string) =>
      new Promise<JoinError | 'joined'>((resolve) => {
        socket.once('game-started', () => resolve('joined'));
        socket.once('join-error', resolve);
        socket.emit('join-room', roomId, 'easy');
      });

    const connectPlayers = async (count: number, prefix = 'cap-player') => {
      const players: TestClientSocket[] = [];
      for (let i = 0; i < count; i++) players.push(await connectTestClient(`${prefix}-${i}`));
      return players;
    };

    it(`lets ${MAX_PLAYERS_PER_ROOM} players in and turns the next one away`, async () => {
      const players = await connectPlayers(MAX_PLAYERS_PER_ROOM);
      const extra = await connectTestClient('cap-player-extra');

      try {
        for (const player of players) await expect(joinOutcome(player, 'full-room')).resolves.toBe('joined');

        await expect(joinOutcome(extra, 'full-room')).resolves.toBe('room-full');
        expect(rooms.get('full-room')!.players.size).toBe(MAX_PLAYERS_PER_ROOM);
        expect(rooms.get('full-room')!.players.has('cap-player-extra')).toBe(false);
      } finally {
        [...players, extra].forEach((socket) => socket.disconnect());
      }
    });

    it('still lets a player of a full room in with another tab', async () => {
      const players = await connectPlayers(MAX_PLAYERS_PER_ROOM);
      const otherTab = await connectTestClient('cap-player-0');

      try {
        for (const player of players) await joinOutcome(player, 'full-room');

        await expect(joinOutcome(otherTab, 'full-room')).resolves.toBe('joined');
      } finally {
        [...players, otherTab].forEach((socket) => socket.disconnect());
      }
    });

    it('frees a place when a player leaves', async () => {
      const players = await connectPlayers(MAX_PLAYERS_PER_ROOM);
      const extra = await connectTestClient('cap-player-extra');

      try {
        for (const player of players) await joinOutcome(player, 'full-room');
        await expect(joinOutcome(extra, 'full-room')).resolves.toBe('room-full');

        const closed = new Promise<void>((resolve) => { getServerSocket(players[0]).once('disconnect', () => resolve()); });
        players[0].disconnect();
        await closed;

        await expect(joinOutcome(extra, 'full-room')).resolves.toBe('joined');
      } finally {
        [...players, extra].forEach((socket) => socket.disconnect());
      }
    });

    it('keeps a refused player in the room they were already in', async () => {
      const players = await connectPlayers(MAX_PLAYERS_PER_ROOM);
      const extra = await connectTestClient('cap-player-extra');

      try {
        for (const player of players) await joinOutcome(player, 'full-room');
        await joinOutcome(extra, 'other-room');

        await expect(joinOutcome(extra, 'full-room')).resolves.toBe('room-full');

        expect(rooms.get('other-room')!.players.has('cap-player-extra')).toBe(true);
        expect(getServerSocket(extra).data.roomId).toBe('other-room');
      } finally {
        [...players, extra].forEach((socket) => socket.disconnect());
      }
    });

    it('refuses new rooms when the server is full, but not the ones that exist', async () => {
      rooms.maxRooms = 1;
      const [first, second] = await connectPlayers(2, 'room-cap');

      try {
        await expect(joinOutcome(first, 'only-room')).resolves.toBe('joined');

        await expect(joinOutcome(second, 'one-too-many')).resolves.toBe('server-full');
        expect(rooms.has('one-too-many')).toBe(false);

        await expect(joinOutcome(second, 'only-room')).resolves.toBe('joined');
      } finally {
        first.disconnect();
        second.disconnect();
      }
    });

    it('drops the events of a socket that sends too many', async () => {
      eventLimit.max = 3;
      const observer = await connectTestClient();
      const flooder = await connectTestClient();

      try {
        eventLimit.max = Number.POSITIVE_INFINITY;
        await joinRoom(observer, testRoomId);
        // The limit is read when a socket connects: flooder was created with max = 3.
        await joinRoom(flooder, testRoomId);

        const selections = vi.fn();
        observer.on('player-selected-cell', selections);

        for (let i = 0; i < 10; i++) flooder.emit('select-cell', { r: 0, c: 0 });
        await flushSocketEvents(flooder);
        await flushSocketEvents(observer);

        // 3 allowed events per window: one was the join, so two selections get through.
        expect(selections).toHaveBeenCalledTimes(2);
      } finally {
        observer.disconnect();
        flooder.disconnect();
      }
    });

    it('limits how many rooms a socket can create, but not how many it can join', async () => {
      // The limit is read when a socket connects.
      roomCreationLimit.max = 2;
      const [creator, other] = await connectPlayers(2, 'budget');

      try {
        await expect(joinOutcome(creator, 'budget-a')).resolves.toBe('joined');
        await expect(joinOutcome(creator, 'budget-b')).resolves.toBe('joined');

        await expect(joinOutcome(creator, 'budget-c')).resolves.toBe('too-fast');
        expect(rooms.has('budget-c')).toBe(false);
        expect(getServerSocket(creator).data.roomId).toBe('budget-b');

        await expect(joinOutcome(other, 'budget-o')).resolves.toBe('joined');
        await expect(joinOutcome(creator, 'budget-o')).resolves.toBe('joined');
      } finally {
        creator.disconnect();
        other.disconnect();
      }
    });

    it('limits how many times a socket can restart the game', async () => {
      restartLimit.max = 2;
      const player = await connectTestClient();

      try {
        await joinRoom(player, 'restart-budget');
        const restarted = vi.fn();
        player.on('game-started', restarted);

        for (let i = 0; i < 5; i++) player.emit('restart-game', 'easy');
        await flushSocketEvents(player);

        expect(restarted).toHaveBeenCalledTimes(2);
      } finally {
        player.disconnect();
      }
    });

    // The limit shared by all the sockets of a server is read when the server is set up, so these tests start their own.
    const withBoardLimit = async (max: number, run: (connect: () => Promise<TestClientSocket>) => Promise<void>) => {
      boardGenerationLimit.max = max;
      const httpServer = createServer();
      const otherIo = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);
      setupSocketHandlers(otherIo);
      boardGenerationLimit.max = Number.POSITIVE_INFINITY;
      await new Promise<void>((resolve) => { httpServer.listen(0, resolve); });
      const url = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;

      const sockets: TestClientSocket[] = [];
      const connect = async () => {
        const socket = Client(url) as TestClientSocket;
        sockets.push(socket);
        clients.add(socket);
        await new Promise<void>((resolve) => { socket.once('connect', resolve); });
        return socket;
      };

      try {
        await run(connect);
      } finally {
        sockets.forEach((socket) => socket.disconnect());
        await new Promise<void>((resolve) => { otherIo.close(() => resolve()); });
      }
    };

    it('limits the boards generated for all the sockets together', async () => {
      await withBoardLimit(2, async (connect) => {
        const [first, second, third] = [await connect(), await connect(), await connect()];

        await expect(joinOutcome(first, 'global-a')).resolves.toBe('joined');
        await expect(joinOutcome(second, 'global-b')).resolves.toBe('joined');
        await expect(joinOutcome(third, 'global-c')).resolves.toBe('too-fast');
        expect(rooms.has('global-c')).toBe(false);
      });
    });

    it('does not spend the budget of the server on a room the socket may not create', async () => {
      roomCreationLimit.max = 1;

      await withBoardLimit(2, async (connect) => {
        const [first, second, third] = [await connect(), await connect(), await connect()];

        await expect(joinOutcome(first, 'spent-a')).resolves.toBe('joined');
        await expect(joinOutcome(first, 'spent-b')).resolves.toBe('too-fast');

        // The refused attempt of the first socket did not use the second place of the server.
        await expect(joinOutcome(second, 'spent-c')).resolves.toBe('joined');
        await expect(joinOutcome(third, 'spent-d')).resolves.toBe('too-fast');
      });
    });

    it('does not count the restarts of a socket that is not in a room', async () => {
      restartLimit.max = 1;
      const player = await connectTestClient();

      try {
        for (let i = 0; i < 3; i++) player.emit('restart-game', 'easy');
        await flushSocketEvents(player);

        await joinRoom(player, 'outsider-restart');
        const restarted = vi.fn();
        player.on('game-started', restarted);
        player.emit('restart-game', 'easy');
        await flushSocketEvents(player);

        expect(restarted).toHaveBeenCalledTimes(1);
      } finally {
        player.disconnect();
      }
    });

    it('ships finite limits', () => {
      expect(Number.isFinite(defaultLimits.roomCreation)).toBe(true);
      expect(Number.isFinite(defaultLimits.restart)).toBe(true);
      expect(Number.isFinite(defaultLimits.boardGeneration)).toBe(true);
    });
  });

  // -------------------------------------------------------
  // MOVE ACKNOWLEDGEMENT
  // -------------------------------------------------------

  describe('cell-update acknowledgement', () => {
    const update = (socket: TestClientSocket, r: number, c: number, v: number) =>
      new Promise<{ ok: boolean }>((resolve) => { socket.emit('cell-update', { r, c, v }, resolve); });

    it('confirms an applied move', async () => {
      const room = await joinRoom();
      const { r, c } = findCell(room.currentGrid, (value) => value === 0);

      await expect(update(clientSocket, r, c, 1)).resolves.toEqual({ ok: true });
      expect(room.currentGrid[r][c]).toBe(1);
    });

    it('confirms a move that changes nothing', async () => {
      const room = await joinRoom();
      const { r, c } = findCell(room.currentGrid, (value) => value === 0);

      await update(clientSocket, r, c, 1);

      await expect(update(clientSocket, r, c, 1)).resolves.toEqual({ ok: true });
    });

    it('rejects a move on a given cell', async () => {
      const room = await joinRoom();
      const { r, c, value } = findCell(room.currentGrid, (v) => v !== 0);

      await expect(update(clientSocket, r, c, value === 1 ? 2 : 1)).resolves.toEqual({ ok: false });
      expect(room.currentGrid[r][c]).toBe(value);
    });

    it('rejects out-of-bounds moves', async () => {
      const room = await joinRoom();

      await expect(update(clientSocket, room.board.size, 0, 1)).resolves.toEqual({ ok: false });
      await expect(update(clientSocket, 0, 0, room.board.size + 1)).resolves.toEqual({ ok: false });
    });

    it('rejects a move from a socket that is not in a room', async () => {
      const outsider = await connectTestClient();

      try {
        await expect(update(outsider, 0, 0, 1)).resolves.toEqual({ ok: false });
      } finally {
        outsider.disconnect();
      }
    });

    it('does not run the handler when the acknowledgement is not a function', async () => {
      const room = await joinRoom();
      const { r, c } = findCell(room.currentGrid, (value) => value === 0);

      (clientSocket as unknown as { emit: (...args: unknown[]) => void }).emit('cell-update', { r, c, v: 1 }, 'nope');
      await flushSocketEvents();

      expect(room.currentGrid[r][c]).toBe(0);
    });
  });

  // -------------------------------------------------------
  // EMPTY ROOM GRACE PERIOD
  // -------------------------------------------------------

  describe('empty room grace period', () => {
    const playerId = 'grace-period-player-1';

    const leaveAndWait = async (socket: TestClientSocket) => {
      const serverSocket = getServerSocket(socket);
      const closed = new Promise<void>((resolve) => { serverSocket.once('disconnect', () => resolve()); });
      socket.disconnect();
      await closed;
    };

    // An empty room nobody played in is deleted right away: the grace period is for rooms with a game in progress.
    const makeMove = async (socket: TestClientSocket, room: { currentGrid: number[][] }) => {
      const { r, c } = findCell(room.currentGrid, (value) => value === 0);
      socket.emit('cell-update', { r, c, v: 1 });
      await flushSocketEvents(socket);
    };

    it('keeps the room, with its board and notes, when the last player drops', async () => {
      rooms.emptyRoomTtlMs = 60_000;
      const first = await connectTestClient(playerId);
      const room = await joinRoom(first, 'grace-room');
      const { r, c } = findCell(room.currentGrid, (value) => value === 0);

      first.emit('toggle-note', { r, c, v: 2 });
      await flushSocketEvents(first);
      await leaveAndWait(first);

      expect(rooms.has('grace-room')).toBe(true);
      expect(rooms.get('grace-room')!.players.size).toBe(0);

      const second = await connectTestClient(playerId);

      try {
        const gameStarted = new Promise<GameStartedPayload>((resolve) => { second.once('game-started', resolve); });
        second.emit('join-room', 'grace-room', 'hard');
        const payload = await gameStarted;

        expect(payload.board).toEqual(room.board);
        expect(payload.difficulty).toBe('easy');
        expect(payload.notesGrid[`${r}-${c}`][2]).toBe(playerId);
      } finally {
        second.disconnect();
      }
    });

    it('deletes the room once the grace period is over', async () => {
      rooms.emptyRoomTtlMs = 50;
      const client = await connectTestClient();
      await makeMove(client, await joinRoom(client, 'expiring-room'));

      await leaveAndWait(client);
      expect(rooms.has('expiring-room')).toBe(true);

      await vi.waitFor(() => expect(rooms.has('expiring-room')).toBe(false));
    });

    it('does not delete a room that someone came back to before the grace period was over', async () => {
      rooms.emptyRoomTtlMs = 100;
      const first = await connectTestClient();
      await makeMove(first, await joinRoom(first, 'returning-room'));
      await leaveAndWait(first);

      const second = await connectTestClient();

      try {
        await joinRoom(second, 'returning-room');
        await new Promise((resolve) => setTimeout(resolve, 250));

        expect(rooms.has('returning-room')).toBe(true);
        expect(rooms.get('returning-room')!.players.size).toBe(1);
      } finally {
        second.disconnect();
      }
    });

    it('deletes a room right away when nobody changed anything in it', async () => {
      rooms.emptyRoomTtlMs = 60_000;
      const client = await connectTestClient();
      await joinRoom(client, 'unplayed-room');

      await leaveAndWait(client);

      expect(rooms.has('unplayed-room')).toBe(false);
    });

    it('keeps a room for the grace period once a cell was changed', async () => {
      rooms.emptyRoomTtlMs = 60_000;
      const client = await connectTestClient();
      await makeMove(client, await joinRoom(client, 'played-room'));
      await leaveAndWait(client);

      expect(rooms.has('played-room')).toBe(true);
    });

    it('treats a restarted game as not played yet', async () => {
      rooms.emptyRoomTtlMs = 60_000;
      const client = await connectTestClient();
      await makeMove(client, await joinRoom(client, 'restarted-room'));
      client.emit('restart-game', 'easy');
      await flushSocketEvents(client);
      await leaveAndWait(client);

      expect(rooms.has('restarted-room')).toBe(false);
    });
  });

  // -------------------------------------------------------
  // PLAYER IDENTITY
  // -------------------------------------------------------

  describe('player identity', () => {
    const playerId = 'player-identity-abc123';

    const waitForServerDisconnect = (socket: TestClientSocket) => {
      const serverSocket = getServerSocket(socket);
      return new Promise<void>((resolve) => { serverSocket.once('disconnect', () => resolve()); });
    };

    it('uses the id sent by the browser instead of the socket id', async () => {
      const client = await connectTestClient(playerId);

      try {
        const room = await joinRoom(client);

        expect(getServerSocket(client).data.playerId).toBe(playerId);
        expect(room.players.has(playerId)).toBe(true);
        expect(room.players.has(client.id!)).toBe(false);
      } finally {
        client.disconnect();
      }
    });

    it.each([undefined, '', 'short', 'has spaces in it', 'x'.repeat(65), 42, null])(
      'falls back to the socket id when the browser sent %j',
      async (invalid) => {
        const client = await connectTestClient(invalid);

        try {
          await joinRoom(client);

          expect(getServerSocket(client).data.playerId).toBe(client.id);
        } finally {
          client.disconnect();
        }
      },
    );

    it('keeps the notes of a player after a reconnection', async () => {
      // Someone else stays in the room: an empty room is deleted (until it is given a grace period).
      const observer = await connectTestClient();
      const first = await connectTestClient(playerId);
      await joinRoom(observer, testRoomId);
      const room = await joinRoom(first, testRoomId);
      const { r, c } = findCell(room.currentGrid, (value) => value === 0);

      first.emit('toggle-note', { r, c, v: 1 });
      await flushSocketEvents(first);
      const closed = waitForServerDisconnect(first);
      first.disconnect();
      await closed;

      const second = await connectTestClient(playerId);

      try {
        const gameStarted = new Promise<GameStartedPayload>((resolve) => { second.once('game-started', resolve); });
        second.emit('join-room', testRoomId, 'easy');

        const payload = await gameStarted;
        expect(first.id).not.toBe(second.id);
        expect(payload.notesGrid[`${r}-${c}`][1]).toBe(playerId);
      } finally {
        observer.disconnect();
        second.disconnect();
      }
    });

    it('does not tell the others that a player left while another tab of that player is open', async () => {
      const observer = await connectTestClient();
      const tab = await connectTestClient(playerId);
      const otherTab = await connectTestClient(playerId);

      try {
        await joinRoom(observer, testRoomId);
        await joinRoom(tab, testRoomId);
        const room = await joinRoom(otherTab, testRoomId);

        const left = vi.fn();
        observer.on('player-disconnected', left);

        const closed = waitForServerDisconnect(tab);
        tab.disconnect();
        await closed;
        await flushSocketEvents(observer);

        expect(left).not.toHaveBeenCalled();
        expect(room.players.has(playerId)).toBe(true);

        const lastClosed = waitForServerDisconnect(otherTab);
        const playerLeft = new Promise<string>((resolve) => { observer.once('player-disconnected', resolve); });
        otherTab.disconnect();
        await lastClosed;

        await expect(playerLeft).resolves.toBe(playerId);
        expect(room.players.has(playerId)).toBe(false);
      } finally {
        observer.disconnect();
        tab.disconnect();
        otherTab.disconnect();
      }
    });

    it('reports selections and emotes with the stable id', async () => {
      const observer = await connectTestClient();
      const client = await connectTestClient(playerId);

      try {
        await joinRoom(observer, testRoomId);
        await joinRoom(client, testRoomId);

        const selection = new Promise<PlayerSelectedCellPayload>((resolve) => { observer.once('player-selected-cell', resolve); });
        const emote = new Promise<EmoteReceivedPayload>((resolve) => { observer.once('emote-received', resolve); });
        client.emit('select-cell', { r: 0, c: 0 });
        client.emit('send-emote', EMOTES[0]);

        await expect(selection).resolves.toMatchObject({ playerId });
        await expect(emote).resolves.toEqual({ playerId, emote: EMOTES[0] });
      } finally {
        observer.disconnect();
        client.disconnect();
      }
    });
  });

  // -------------------------------------------------------
  // ROOM MEMBERSHIP
  // -------------------------------------------------------

  describe('room membership', () => {
    it('does not let a socket outside the room toggle notes or select cells', async () => {
      const room = await joinRoom();
      const outsider = await connectTestClient();
      const received: string[] = [];

      const onNoteToggled = () => { received.push('note-toggled'); };
      const onPlayerSelectedCell = () => { received.push('player-selected-cell'); };

      clientSocket.on('note-toggled', onNoteToggled);
      clientSocket.on('player-selected-cell', onPlayerSelectedCell);

      try {
        outsider.emit('toggle-note', { r: 0, c: 0, v: 1 });
        outsider.emit('select-cell', { r: 0, c: 0 });
        await flushSocketEvents(outsider);
        await flushSocketEvents(clientSocket);

        expect(room.notesGrid).toEqual({});
        expect(received).toEqual([]);
      } finally {
        clientSocket.off('note-toggled', onNoteToggled);
        clientSocket.off('player-selected-cell', onPlayerSelectedCell);
        outsider.disconnect();
      }
    });

    it('removes the player from the previous room when joining another one', async () => {
      const mover = await connectTestClient();
      const stayer = await connectTestClient();

      try {
        await joinRoom(stayer, 'room-a');
        await joinRoom(mover, 'room-a');

        const left = new Promise<string>((resolve) => { stayer.once('player-disconnected', resolve); });

        await joinRoom(mover, 'room-b');

        await expect(left).resolves.toBe(mover.id);
        expect(rooms.get('room-a')!.players.has(mover.id!)).toBe(false);
        expect(rooms.get('room-a')!.players.has(stayer.id!)).toBe(true);
        expect(rooms.get('room-b')!.players.has(mover.id!)).toBe(true);
      } finally {
        mover.disconnect();
        stayer.disconnect();
      }
    });

    it('deletes the abandoned room when its last player moves away', async () => {
      const mover = await connectTestClient();

      try {
        await joinRoom(mover, 'room-a');
        await joinRoom(mover, 'room-b');

        expect(rooms.has('room-a')).toBe(false);
        expect(rooms.has('room-b')).toBe(true);
      } finally {
        mover.disconnect();
      }
    });

    it('leaves no ghost players behind after moving between rooms and disconnecting', async () => {
      const mover = await connectTestClient();
      await joinRoom(mover, 'room-a');
      await joinRoom(mover, 'room-b');

      const serverDisconnected = new Promise<void>((resolve) => {
        getServerSocket(mover).once('disconnect', () => resolve());
      });

      mover.disconnect();
      await serverDisconnected;

      expect(rooms.size).toBe(0);
    });

    it('keeps the room when the same socket joins it again', async () => {
      const room = await joinRoom();
      await joinRoom();

      expect(rooms.get(testRoomId)).toBe(room);
      expect(room.players.size).toBe(1);
    });
  });

  // -------------------------------------------------------
  // SEND EMOTE
  // -------------------------------------------------------

  describe('send-emote', () => {
    const collectEmotes = (socket: TestClientSocket) => {
      const received: EmoteReceivedPayload[] = [];
      socket.on('emote-received', (data) => received.push(data));
      return received;
    };

    const rawEmit = (socket: TestClientSocket, event: string, ...args: unknown[]) => {
      (socket as unknown as { emit: (event: string, ...args: unknown[]) => void }).emit(event, ...args);
    };

    let now = 1_000_000;

    beforeEach(() => {
      now = 1_000_000;
      vi.spyOn(Date, 'now').mockImplementation(() => now);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('relays the emote to the other players in the room, not back to the sender', async () => {
      const sender = await connectTestClient();
      const other = await connectTestClient();
      await joinRoom(sender);
      await joinRoom(other);
      const receivedBySender = collectEmotes(sender);
      const receivedByOther = collectEmotes(other);

      sender.emit('send-emote', EMOTES[0]);
      await flushSocketEvents(sender);
      await flushSocketEvents(other);

      expect(receivedByOther).toEqual([{ playerId: sender.id, emote: EMOTES[0] }]);
      expect(receivedBySender).toEqual([]);
    });

    it('does not leak emotes to other rooms', async () => {
      const sender = await connectTestClient();
      const sameRoom = await connectTestClient();
      const otherRoom = await connectTestClient();
      await joinRoom(sender);
      await joinRoom(sameRoom);
      await joinRoom(otherRoom, 'another-room');
      const receivedInOtherRoom = collectEmotes(otherRoom);

      sender.emit('send-emote', EMOTES[1]);
      await flushSocketEvents(sender);
      await flushSocketEvents(otherRoom);

      expect(receivedInOtherRoom).toEqual([]);
    });

    it('drops emotes sent during the cooldown and accepts them again afterwards', async () => {
      const sender = await connectTestClient();
      const other = await connectTestClient();
      await joinRoom(sender);
      await joinRoom(other);
      const received = collectEmotes(other);

      sender.emit('send-emote', EMOTES[0]);
      await flushSocketEvents(sender);
      now += EMOTE_COOLDOWN_MS - 1;
      sender.emit('send-emote', EMOTES[1]);
      await flushSocketEvents(sender);
      now += 1;
      sender.emit('send-emote', EMOTES[2]);
      await flushSocketEvents(sender);
      await flushSocketEvents(other);

      expect(received.map(({ emote }) => emote)).toEqual([EMOTES[0], EMOTES[2]]);
    });

    it('applies the cooldown per player', async () => {
      const first = await connectTestClient();
      const second = await connectTestClient();
      const listener = await connectTestClient();
      await joinRoom(first);
      await joinRoom(second);
      await joinRoom(listener);
      const received = collectEmotes(listener);

      first.emit('send-emote', EMOTES[0]);
      await flushSocketEvents(first);
      second.emit('send-emote', EMOTES[1]);
      await flushSocketEvents(second);
      await flushSocketEvents(listener);

      expect(received.map(({ emote }) => emote)).toEqual([EMOTES[0], EMOTES[1]]);
    });

    it('does not start the cooldown for rejected emotes', async () => {
      const sender = await connectTestClient();
      const other = await connectTestClient();
      await joinRoom(sender);
      await joinRoom(other);
      const received = collectEmotes(other);

      rawEmit(sender, 'send-emote', 'not-an-emote');
      sender.emit('send-emote', EMOTES[3]);
      await flushSocketEvents(sender);
      await flushSocketEvents(other);

      expect(received.map(({ emote }) => emote)).toEqual([EMOTES[3]]);
    });

    it.each([
      ['an unknown emoji', '🦄'],
      ['free text', 'hello everyone'],
      ['a very long string', '💜'.repeat(10_000)],
      ['an object', { emote: EMOTES[0] }],
      ['null', null],
    ])('ignores %s', async (_label, value) => {
      const sender = await connectTestClient();
      const other = await connectTestClient();
      await joinRoom(sender);
      await joinRoom(other);
      const received = collectEmotes(other);

      rawEmit(sender, 'send-emote', value);
      rawEmit(sender, 'send-emote');
      rawEmit(sender, 'send-emote', EMOTES[0], 'extra');
      await flushSocketEvents(sender);
      await flushSocketEvents(other);

      expect(received).toEqual([]);
    });

    it('ignores emotes from a socket that has not joined a room', async () => {
      const outsider = await connectTestClient();
      const player = await connectTestClient();
      await joinRoom(player);
      const received = collectEmotes(player);

      outsider.emit('send-emote', EMOTES[0]);
      await flushSocketEvents(outsider);
      await flushSocketEvents(player);

      expect(received).toEqual([]);
    });
  });

  // -------------------------------------------------------
  // MALFORMED INPUT
  // -------------------------------------------------------

  describe('malformed input', () => {
    const rawEmit = (socket: TestClientSocket, event: string, ...args: unknown[]) => {
      (socket as unknown as { emit: (event: string, ...args: unknown[]) => void }).emit(event, ...args);
    };

    it('survives garbage on every event and keeps serving valid requests', async () => {
      const room = await joinRoom();
      const originalBoard = room.board;
      const originalGrid = room.currentGrid.map((row) => [...row]);
      const garbage: unknown[] = [null, 0, 1, 'text', true, [], {}, { r: 'a' }, { r: 0 }, { r: 0, c: 0, v: null }];

      for (const event of ['cell-update', 'toggle-note', 'select-cell', 'restart-game', 'join-room', 'send-emote']) {
        rawEmit(clientSocket, event);
        for (const value of garbage) rawEmit(clientSocket, event, value);
      }

      rawEmit(clientSocket, 'join-room', 42, 'easy');
      rawEmit(clientSocket, 'join-room', testRoomId);
      rawEmit(clientSocket, 'join-room', testRoomId, 'easy', 'extra');
      rawEmit(clientSocket, 'cell-update', { r: 0, c: 0, v: 1 }, 'extra');

      await flushSocketEvents();

      expect(rooms.get(testRoomId)).toBe(room);
      expect(room.board).toBe(originalBoard);
      expect(room.currentGrid).toEqual(originalGrid);
      expect(room.notesGrid).toEqual({});

      // The server must still be alive and processing valid events.
      const cell = findCell(room.board.initial, (value) => value === 0);
      const value = room.board.solution[cell.r][cell.c];
      clientSocket.emit('cell-update', { r: cell.r, c: cell.c, v: value });
      await flushSocketEvents();

      expect(room.currentGrid[cell.r][cell.c]).toBe(value);
    });

    it('does not create a room for an unknown difficulty', async () => {
      const client = await connectTestClient();
      const received: string[] = [];
      client.on('game-started', () => received.push('game-started'));

      try {
        rawEmit(client, 'join-room', 'room-bad-difficulty', 'banana');
        await flushSocketEvents(client);

        expect(rooms.has('room-bad-difficulty')).toBe(false);
        expect(received).toEqual([]);
      } finally {
        client.disconnect();
      }
    });

    it('does not create rooms for invalid room ids', async () => {
      const client = await connectTestClient();

      try {
        rawEmit(client, 'join-room', '', 'easy');
        rawEmit(client, 'join-room', 'a'.repeat(65), 'easy');
        rawEmit(client, 'join-room', 'room with spaces', 'easy');
        rawEmit(client, 'join-room', '../etc/passwd', 'easy');
        await flushSocketEvents(client);

        expect(rooms.size).toBe(0);
      } finally {
        client.disconnect();
      }
    });

    it('ignores restart-game with an unknown difficulty', async () => {
      const room = await joinRoom();
      const originalBoard = room.board;

      rawEmit(clientSocket, 'restart-game', 'banana');
      await flushSocketEvents();

      expect(room.board).toBe(originalBoard);
      expect(room.difficulty).toBe('easy');
    });

    it('ignores select-cell outside the board', async () => {
      const room = await joinRoom();
      const observer = await connectTestClient();
      const received: string[] = [];

      try {
        await joinRoom(observer, testRoomId);
        observer.on('player-selected-cell', () => received.push('player-selected-cell'));

        clientSocket.emit('select-cell', { r: room.board.size, c: 0 });
        clientSocket.emit('select-cell', { r: 0, c: room.board.size });
        await flushSocketEvents();
        await flushSocketEvents(observer);

        expect(received).toEqual([]);
      } finally {
        observer.disconnect();
      }
    });
  });
});