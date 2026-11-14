import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server } from 'socket.io';
import Client from 'socket.io-client';
import type { Socket as ClientSocket } from 'socket.io-client';
import { getTakuzuLevel } from '@nbg/shared';
import type { ClientToServerEvents, LobbyState, ServerToClientEvents, TakuzuStartedPayload } from '@nbg/shared';
import { setupSocketHandlers, rooms, eventLimit, roomCreationLimit, restartLimit, boardGenerationLimit, voteLimit } from './event';
import type { TakuzuGame } from '../rooms/roomStore';

type TestClient = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

describe('a room that plays the Takuzu', () => {
  let io: Server<ClientToServerEvents, ServerToClientEvents>;
  let url: string;
  const clients: TestClient[] = [];

  beforeAll(async () => {
    eventLimit.max = Number.POSITIVE_INFINITY;
    roomCreationLimit.max = Number.POSITIVE_INFINITY;
    restartLimit.max = Number.POSITIVE_INFINITY;
    boardGenerationLimit.max = Number.POSITIVE_INFINITY;
    const httpServer = createServer();
    io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);
    setupSocketHandlers(io);
    io.on('connection', (socket) => { (socket as unknown as { on: (event: string, handler: (ack: () => void) => void) => void }).on('__barrier', (ack) => ack()); });
    await new Promise<void>((resolve) => { httpServer.listen(0, resolve); });
    url = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
  });

  beforeEach(() => {
    rooms.clear();
    rooms.emptyRoomTtlMs = 0;
    voteLimit.cooldownMs = 0;
  });

  afterAll(async () => {
    clients.forEach((client) => client.disconnect());
    rooms.clear();
    await new Promise<void>((resolve) => { io.close(() => resolve()); });
  });

  const connect = async (): Promise<TestClient> => {
    const client = Client(url, { auth: { playerId: `takuzu-player-${clients.length}-abcdef` } }) as TestClient;
    clients.push(client);
    await new Promise<void>((resolve) => { client.once('connect', resolve); });
    return client;
  };

  /** The server has handled everything this client sent before: events on one connection are handled in order. */
  const flush = (client: TestClient) =>
    new Promise<void>((resolve) => { (client as unknown as { emit: (event: string, ack: () => void) => void }).emit('__barrier', resolve); });

  const asTakuzu = (payload: Parameters<ServerToClientEvents['game-started']>[0]): TakuzuStartedPayload => {
    if (payload.game !== 'takuzu') throw new Error(`Expected a Takuzu, the room started ${payload.game}`);
    return payload;
  };

  /** A player alone in a new room votes for the Takuzu, which opens it. */
  const openTakuzu = async (client: TestClient, roomId: string): Promise<TakuzuStartedPayload> => {
    const atTheTable = new Promise<LobbyState>((resolve) => { client.once('lobby-updated', resolve); });
    client.emit('join-room', roomId);
    await atTheTable;

    const started = new Promise<Parameters<ServerToClientEvents['game-started']>[0]>((resolve) => { client.once('game-started', resolve); });
    client.emit('vote-game', 'takuzu');
    return asTakuzu(await started);
  };

  const takuzuOf = (roomId: string): TakuzuGame => {
    const game = rooms.get(roomId)?.game;
    if (game?.id !== 'takuzu') throw new Error('The room is not playing a Takuzu');
    return game;
  };

  const update = (client: TestClient, r: number, c: number, v: number) =>
    new Promise<boolean>((resolve) => { client.emit('cell-update', { r, c, v }, (result) => resolve(result.ok)); });

  const emptyCells = (grid: number[][]) =>
    grid.flatMap((row, r) => row.flatMap((value, c) => (value === 0 ? [[r, c] as const] : [])));

  it('opens when the players vote for it, with the grid of the first level', async () => {
    const roomId = randomUUID();
    const player = await connect();

    const payload = await openTakuzu(player, roomId);

    expect(payload.size).toBe(getTakuzuLevel('easy').size);
    expect(payload.difficulty).toBe('easy');
    expect(payload.initial).toHaveLength(payload.size);
    expect(payload.currentGrid).toEqual(payload.initial);
    expect(rooms.get(roomId)?.game?.id).toBe('takuzu');
  });

  it('keeps the solution on the server', async () => {
    const roomId = randomUUID();
    const player = await connect();

    const payload = await openTakuzu(player, roomId);

    expect(JSON.stringify(payload)).not.toContain('solution');
    expect(payload).not.toHaveProperty('board');
  });

  it('shows the same grid to somebody who comes after it opened', async () => {
    const roomId = randomUUID();
    const first = await connect();
    const second = await connect();
    const opened = await openTakuzu(first, roomId);

    const started = new Promise<Parameters<ServerToClientEvents['game-started']>[0]>((resolve) => { second.once('game-started', resolve); });
    second.emit('join-room', roomId);

    expect(asTakuzu(await started)).toEqual(opened);
  });

  describe('cell-update', () => {
    it('writes a symbol in an empty cell and tells the others', async () => {
      const roomId = randomUUID();
      const first = await connect();
      const second = await connect();
      const { initial } = await openTakuzu(first, roomId);
      second.emit('join-room', roomId);
      await flush(second);
      const [r, c] = emptyCells(initial)[0];
      const told = new Promise<{ r: number; c: number; v: number }>((resolve) => { second.once('cell-updated', resolve); });

      expect(await update(first, r, c, 2)).toBe(true);

      expect(await told).toEqual({ r, c, v: 2 });
      expect(takuzuOf(roomId).currentGrid[r][c]).toBe(2);
      expect(takuzuOf(roomId).filledCells).toBe(initial.flat().filter((value) => value !== 0).length + 1);
      expect(rooms.get(roomId)?.played).toBe(true);
    });

    it('takes a symbol back, and counts the cell as empty again', async () => {
      const roomId = randomUUID();
      const player = await connect();
      const { initial } = await openTakuzu(player, roomId);
      const [r, c] = emptyCells(initial)[0];
      const given = takuzuOf(roomId).filledCells;

      await update(player, r, c, 1);
      expect(await update(player, r, c, 0)).toBe(true);

      expect(takuzuOf(roomId).currentGrid[r][c]).toBe(0);
      expect(takuzuOf(roomId).filledCells).toBe(given);
    });

    it('refuses a value that is not one of the two symbols', async () => {
      const roomId = randomUUID();
      const player = await connect();
      const { initial } = await openTakuzu(player, roomId);
      const [r, c] = emptyCells(initial)[0];

      // A 3 is a digit of the Sudoku: here it would be a symbol that does not exist.
      expect(await update(player, r, c, 3)).toBe(false);
      expect(await update(player, r, c, 9)).toBe(false);

      expect(takuzuOf(roomId).currentGrid[r][c]).toBe(0);
    });

    it('refuses a cell outside the grid', async () => {
      const roomId = randomUUID();
      const player = await connect();
      const { size } = await openTakuzu(player, roomId);

      expect(await update(player, size, 0, 1)).toBe(false);
      expect(await update(player, 0, size, 1)).toBe(false);
    });

    it('refuses to change a cell the puzzle gave', async () => {
      const roomId = randomUUID();
      const player = await connect();
      const { initial } = await openTakuzu(player, roomId);
      const r = initial.findIndex((row) => row.some((value) => value !== 0));
      const c = initial[r].findIndex((value) => value !== 0);

      expect(await update(player, r, c, initial[r][c] === 1 ? 2 : 1)).toBe(false);

      expect(takuzuOf(roomId).currentGrid[r][c]).toBe(initial[r][c]);
    });

    it('says the puzzle is solved to everybody once the last cell is right', async () => {
      const roomId = randomUUID();
      const first = await connect();
      const second = await connect();
      const { initial } = await openTakuzu(first, roomId);
      second.emit('join-room', roomId);
      await flush(second);
      const wonByFirst = vi.fn();
      const wonBySecond = new Promise<void>((resolve) => { second.once('game-won', () => resolve()); });
      first.on('game-won', wonByFirst);
      const { solution } = takuzuOf(roomId).board;

      for (const [r, c] of emptyCells(initial)) expect(await update(first, r, c, solution[r][c])).toBe(true);

      await wonBySecond;
      await flush(first);
      expect(wonByFirst).toHaveBeenCalledTimes(1);
    });

    it('does not say it is solved when every cell is full but one is wrong', async () => {
      const roomId = randomUUID();
      const player = await connect();
      const { initial } = await openTakuzu(player, roomId);
      const won = vi.fn();
      player.on('game-won', won);
      const { solution } = takuzuOf(roomId).board;
      const cells = emptyCells(initial);
      const [lastR, lastC] = cells[cells.length - 1];

      for (const [r, c] of cells.slice(0, -1)) await update(player, r, c, solution[r][c]);
      await update(player, lastR, lastC, solution[lastR][lastC] === 1 ? 2 : 1);
      await flush(player);
      expect(won).not.toHaveBeenCalled();

      // Fixing it is what makes the puzzle solved: the grid had not been given up on.
      const solved = new Promise<void>((resolve) => { player.once('game-won', () => resolve()); });
      await update(player, lastR, lastC, solution[lastR][lastC]);
      await solved;
    });
  });

  describe('select-cell', () => {
    it('shows the cell a player is on to the others, and nothing outside the grid', async () => {
      const roomId = randomUUID();
      const first = await connect();
      const second = await connect();
      const { size } = await openTakuzu(first, roomId);
      second.emit('join-room', roomId);
      await flush(second);
      const seen = vi.fn();
      second.on('player-selected-cell', seen);

      first.emit('select-cell', { r: size, c: 0 });
      first.emit('select-cell', { r: 1, c: 2 });
      await flush(first);
      await flush(second);

      expect(seen).toHaveBeenCalledTimes(1);
      expect(seen).toHaveBeenCalledWith(expect.objectContaining({ r: 1, c: 2 }));
    });
  });

  describe('events of another game', () => {
    it('ignores the notes of the Sudoku: the Takuzu has none', async () => {
      const roomId = randomUUID();
      const player = await connect();
      await openTakuzu(player, roomId);
      const toggled = vi.fn();
      player.on('note-toggled', toggled);

      player.emit('toggle-note', { r: 0, c: 0, v: 1 });
      await flush(player);

      expect(toggled).not.toHaveBeenCalled();
      expect(takuzuOf(roomId)).not.toHaveProperty('notesGrid');
    });
  });

  describe('restart-game', () => {
    it('starts a new Takuzu of the level that was asked for, and not another game', async () => {
      const roomId = randomUUID();
      const player = await connect();
      await openTakuzu(player, roomId);
      const started = new Promise<Parameters<ServerToClientEvents['game-started']>[0]>((resolve) => { player.once('game-started', resolve); });

      player.emit('restart-game', 'hard');
      const payload = asTakuzu(await started);

      expect(payload.difficulty).toBe('hard');
      expect(payload.size).toBe(getTakuzuLevel('hard').size);
      expect(takuzuOf(roomId).difficulty).toBe('hard');
      expect(rooms.get(roomId)?.played).toBe(false);
    });
  });
});
