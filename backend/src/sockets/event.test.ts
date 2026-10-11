import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createServer } from 'node:http';
import { Server, Socket as ServerSocket } from 'socket.io';
import Client, { Socket as ClientSocket } from 'socket.io-client';
import { setupSocketHandlers, rooms } from './event';
import type { ClientToServerEvents, ServerToClientEvents } from '@nbg/shared';

type TestClientSocket = ClientSocket<ServerToClientEvents, ClientToServerEvents>;
type TestServerSocket = ServerSocket<ClientToServerEvents, ServerToClientEvents>;
type GameStartedPayload = Parameters<ServerToClientEvents['game-started']>[0];
type CellUpdatedPayload = Parameters<ServerToClientEvents['cell-updated']>[0];
type PlayerSelectedCellPayload = Parameters<ServerToClientEvents['player-selected-cell']>[0];
type NoteToggledPayload = Parameters<ServerToClientEvents['note-toggled']>[0];

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
  const connectTestClient = async (): Promise<TestClientSocket> => {
    const socket = Client(`http://127.0.0.1:${port}`, { autoConnect: false }) as TestClientSocket;

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
    new Promise<void>((resolve) => { (socket as any).emit('__test-barrier', resolve); });

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
      clientSocket.emit('toggle-note', testRoomId, { r: -1, c: 5, v: 3 });
      await flushSocketEvents();
      expect(room.notesGrid['-1-5']).toBeUndefined();
    });

    it('rejects coordinates greater than or equal to the board size', async () => {
      const room = rooms.get(testRoomId)!;
      const size = room.board.size;
      clientSocket.emit('toggle-note', testRoomId, { r: size, c: 0, v: 3 });
      await flushSocketEvents();
      expect(room.notesGrid[`${size}-0`]).toBeUndefined();
    });

    it('rejects values less than 1 or greater than the board size', async () => {
      const room = rooms.get(testRoomId)!;
      const size = room.board.size;
      clientSocket.emit('toggle-note', testRoomId, { r: 0, c: 0, v: 0 });
      clientSocket.emit('toggle-note', testRoomId, { r: 0, c: 0, v: size + 1 });
      await flushSocketEvents();
      expect(room.notesGrid['0-0']).toBeUndefined();
    });

    it('rejects non-integer coordinates and values', async () => {
      const room = rooms.get(testRoomId)!;
      clientSocket.emit('toggle-note', testRoomId, { r: 1.5, c: 2, v: 3 } as any);
      clientSocket.emit('toggle-note', testRoomId, { r: 1, c: 2, v: '3' } as any);
      await flushSocketEvents();
      expect(room.notesGrid['1.5-2']).toBeUndefined();
      expect(room.notesGrid['1-2']).toBeUndefined();
    });

    it('adds a valid note and removes it when toggled again', async () => {
      const room = rooms.get(testRoomId)!;

      const noteAdded = new Promise<NoteToggledPayload>((resolve) => {
        clientSocket.once('note-toggled', resolve);
      });

      clientSocket.emit('toggle-note', testRoomId, { r: 2, c: 3, v: 5 });

      await expect(noteAdded).resolves.toEqual({ r: 2, c: 3, v: 5, playerId: clientSocket.id });
      expect(room.notesGrid['2-3'][5]).toBe(clientSocket.id);

      const noteRemoved = new Promise<NoteToggledPayload>((resolve) => {
        clientSocket.once('note-toggled', resolve);
      });

      clientSocket.emit('toggle-note', testRoomId, { r: 2, c: 3, v: 5 });

      await expect(noteRemoved).resolves.toEqual({ r: 2, c: 3, v: 5, playerId: null });
      expect(room.notesGrid['2-3']).toBeUndefined();
    });
  });

  // -------------------------------------------------------
  // CELL UPDATE
  // -------------------------------------------------------

  describe('cell-update', () => {
    beforeEach(async () => { await joinRoom(); });

    it('ignores updates for non-existent rooms', async () => {
      clientSocket.emit('cell-update', 'missing-room', { r: 0, c: 0, v: 1 });
      await flushSocketEvents();
      expect(rooms.has('missing-room')).toBe(false);
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
        clientSocket.emit('cell-update', testRoomId, payload as any);
      }

      await flushSocketEvents();
      expect(room.currentGrid).toEqual(originalGrid);
    });

    it('prevents modifying initial cells', async () => {
      const room = rooms.get(testRoomId)!;
      const cell = findCell(room.board.initial, (value) => value !== 0);
      const originalValue = room.currentGrid[cell.r][cell.c];

      clientSocket.emit('cell-update', testRoomId, { r: cell.r, c: cell.c, v: 0 });
      await flushSocketEvents();

      expect(room.currentGrid[cell.r][cell.c]).toBe(originalValue);
    });

    it('updates an empty cell and increments filledCells', async () => {
      const room = rooms.get(testRoomId)!;
      const cell = findCell(room.board.initial, (value) => value === 0);
      const originalFilledCells = room.filledCells;
      const value = room.board.solution[cell.r][cell.c];

      clientSocket.emit('cell-update', testRoomId, { r: cell.r, c: cell.c, v: value });
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

      clientSocket.emit('cell-update', testRoomId, { r: cell.r, c: cell.c, v: 0 });
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

      clientSocket.emit('cell-update', testRoomId, { r: cell.r, c: cell.c, v: 5 });
      await flushSocketEvents();

      expect(room.currentGrid[cell.r][cell.c]).toBe(5);
      expect(room.filledCells).toBe(originalFilledCells);
    });

    it('ignores an update with the same current value', async () => {
      const room = rooms.get(testRoomId)!;
      const cell = findCell(room.board.initial, (value) => value === 0);

      room.currentGrid[cell.r][cell.c] = 4;

      const originalFilledCells = room.filledCells;

      clientSocket.emit('cell-update', testRoomId, { r: cell.r, c: cell.c, v: 4 });
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

        clientSocket.emit('cell-update', testRoomId, { r: cell.r, c: cell.c, v: value });

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

      clientSocket.emit('cell-update', testRoomId, {
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
        clientSocket.emit('cell-update', testRoomId, {
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

        clientSocket.emit('select-cell', testRoomId, { r: 2, c: 3 });

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

        clientSocket.emit('select-cell', testRoomId, { r: null, c: null });

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

    it('ignores restart for a non-existent room', async () => {
      clientSocket.emit('restart-game', 'missing-restart-room', 'easy');
      await flushSocketEvents();
      expect(rooms.has('missing-restart-room')).toBe(false);
    });

    it('restarts the game and resets the initial state', async () => {
      const room = rooms.get(testRoomId)!;

      room.currentGrid = room.currentGrid.map((row) => row.map(() => 9));
      room.filledCells = 0;
      room.notesGrid['0-0'] = { 5: clientSocket.id! };

      const restarted = new Promise<GameStartedPayload>((resolve) => {
        clientSocket.once('game-started', resolve);
      });

      clientSocket.emit('restart-game', testRoomId, 'medium');

      const payload = await restarted;

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

        clientSocket.emit('restart-game', testRoomId, 'hard');

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
});