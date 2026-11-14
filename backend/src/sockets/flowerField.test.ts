import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server } from 'socket.io';
import Client from 'socket.io-client';
import type { Socket as ClientSocket } from 'socket.io-client';
import { FLOWER_MARKED, getFlowerFieldLevel } from '@nbg/shared';
import type { ClientToServerEvents, FlowerFieldStartedPayload, LobbyState, ServerToClientEvents } from '@nbg/shared';
import { setupSocketHandlers, rooms, eventLimit, roomCreationLimit, restartLimit, boardGenerationLimit, voteLimit } from './event';
import type { FlowerFieldGame } from '../rooms/roomStore';

type TestClient = ClientSocket<ServerToClientEvents, ClientToServerEvents>;
type Started = Parameters<ServerToClientEvents['game-started']>[0];

describe('a room that plays the Flower Field', () => {
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
    const client = Client(url, { auth: { playerId: `flower-player-${clients.length}-abcdef` } }) as TestClient;
    clients.push(client);
    await new Promise<void>((resolve) => { client.once('connect', resolve); });
    return client;
  };

  /** The server has handled everything this client sent before: events on one connection are handled in order. */
  const flush = (client: TestClient) =>
    new Promise<void>((resolve) => { (client as unknown as { emit: (event: string, ack: () => void) => void }).emit('__barrier', resolve); });

  const asFlowerField = (payload: Started): FlowerFieldStartedPayload => {
    if (payload.game !== 'flower-field') throw new Error(`Expected a Flower Field, the room started ${payload.game}`);
    return payload;
  };

  const open = async (client: TestClient, roomId: string, game: 'flower-field' | 'takuzu' = 'flower-field'): Promise<Started> => {
    const atTheTable = new Promise<LobbyState>((resolve) => { client.once('lobby-updated', resolve); });
    client.emit('join-room', roomId);
    await atTheTable;

    const started = new Promise<Started>((resolve) => { client.once('game-started', resolve); });
    client.emit('vote-game', game);
    return started;
  };

  const openFlowerField = async (client: TestClient, roomId: string) => asFlowerField(await open(client, roomId));

  const fieldOf = (roomId: string): FlowerFieldGame => {
    const game = rooms.get(roomId)?.game;
    if (game?.id !== 'flower-field') throw new Error('The room is not playing a Flower Field');
    return game;
  };

  /** A cell that is a mine, once the mines are laid out. */
  const aMine = (game: FlowerFieldGame): [number, number] => {
    for (let r = 0; r < game.size; r++) for (let c = 0; c < game.size; c++) if (game.mines![r][c]) return [r, c];
    throw new Error('The field has no mines');
  };

  const next = <E extends keyof ServerToClientEvents>(client: TestClient, event: E) =>
    new Promise<Parameters<ServerToClientEvents[E]>[0]>((resolve) => {
      (client as unknown as { once: (name: string, handler: (data: never) => void) => void }).once(event, resolve as (data: never) => void);
    });

  it('opens when the players vote for it, with a closed field and no mines to see', async () => {
    const roomId = randomUUID();
    const player = await connect();

    const payload = await openFlowerField(player, roomId);

    const { size, mines } = getFlowerFieldLevel('easy');
    expect(payload).toMatchObject({ size, mineCount: mines, difficulty: 'easy', explosive: false, status: 'playing', flags: {}, mines: [] });
    expect(payload.grid).toHaveLength(size);
    expect(payload.grid.flat().every((value) => value === -1)).toBe(true);
    expect(rooms.get(roomId)?.game?.id).toBe('flower-field');
  });

  it('shows the same field to somebody who comes after it opened', async () => {
    const roomId = randomUUID();
    const first = await connect();
    const second = await connect();
    await openFlowerField(first, roomId);
    first.emit('flower-field:reveal', { r: 4, c: 4 });
    await flush(first);

    const started = next(second, 'game-started');
    second.emit('join-room', roomId);
    const payload = asFlowerField(await started);

    expect(payload.grid).toEqual(fieldOf(roomId).grid);
    expect(payload.grid[4][4]).toBe(0);
    expect(payload.mines).toEqual([]);
  });

  describe('flower-field:reveal', () => {
    it('opens the first cell for everybody, the player who asked included, with that cell never a mine', async () => {
      const roomId = randomUUID();
      const first = await connect();
      const second = await connect();
      await openFlowerField(first, roomId);
      second.emit('join-room', roomId);
      await flush(second);
      const toFirst = next(first, 'flower-field:updated');
      const toSecond = next(second, 'flower-field:updated');

      first.emit('flower-field:reveal', { r: 4, c: 4 });

      const [told, alsoTold] = await Promise.all([toFirst, toSecond]);
      expect(told).toEqual(alsoTold);
      expect(told.cells).toContainEqual({ r: 4, c: 4, v: 0 });
      expect(fieldOf(roomId).mines![4][4]).toBe(false);
      expect(rooms.get(roomId)?.played).toBe(true);
    });

    it('ignores a cell outside the field', async () => {
      const roomId = randomUUID();
      const player = await connect();
      const { size } = await openFlowerField(player, roomId);
      const updated = vi.fn();
      player.on('flower-field:updated', updated);

      player.emit('flower-field:reveal', { r: size, c: 0 });
      player.emit('flower-field:reveal', { r: 0, c: size });
      await flush(player);

      expect(updated).not.toHaveBeenCalled();
      expect(fieldOf(roomId).mines).toBeNull();
    });

    it('marks a mine for everybody instead of opening it, and the game goes on', async () => {
      const roomId = randomUUID();
      const player = await connect();
      await openFlowerField(player, roomId);
      player.emit('flower-field:reveal', { r: 4, c: 4 });
      await flush(player);
      const [r, c] = aMine(fieldOf(roomId));
      const told = next(player, 'flower-field:updated');
      const lost = vi.fn();
      player.on('flower-field:lost', lost);

      player.emit('flower-field:reveal', { r, c });

      expect((await told).cells).toEqual([{ r, c, v: FLOWER_MARKED }]);
      await flush(player);
      expect(lost).not.toHaveBeenCalled();
      expect(fieldOf(roomId).status).toBe('playing');
    });

    it('loses the game for the whole room when the option is on, and tells where the mines are', async () => {
      const roomId = randomUUID();
      const first = await connect();
      const second = await connect();
      await openFlowerField(first, roomId);
      second.emit('join-room', roomId);
      await flush(second);
      first.emit('flower-field:set-mode', { explosive: true });
      first.emit('flower-field:reveal', { r: 4, c: 4 });
      await flush(first);
      const [r, c] = aMine(fieldOf(roomId));
      const toFirst = next(first, 'flower-field:lost');
      const toSecond = next(second, 'flower-field:lost');

      first.emit('flower-field:reveal', { r, c });

      const [told, alsoTold] = await Promise.all([toFirst, toSecond]);
      expect(told).toEqual(alsoTold);
      expect(told.exploded).toEqual([r, c]);
      expect(told.mines).toHaveLength(fieldOf(roomId).mineCount);
      expect(fieldOf(roomId).status).toBe('lost');
    });

    it('opens nothing more once the game is lost, until somebody starts a new one', async () => {
      const roomId = randomUUID();
      const player = await connect();
      await openFlowerField(player, roomId);
      player.emit('flower-field:set-mode', { explosive: true });
      player.emit('flower-field:reveal', { r: 4, c: 4 });
      await flush(player);
      const [r, c] = aMine(fieldOf(roomId));
      player.emit('flower-field:reveal', { r, c });
      await flush(player);
      const updated = vi.fn();
      player.on('flower-field:updated', updated);

      player.emit('flower-field:reveal', { r: 0, c: 0 });
      await flush(player);
      expect(updated).not.toHaveBeenCalled();

      const restarted = next(player, 'game-started');
      player.emit('restart-game', 'beginner');
      const payload = asFlowerField(await restarted);
      expect(payload).toMatchObject({ difficulty: 'beginner', status: 'playing', explosive: true, mines: [] });
    });

    it('says the game is won to everybody once the last safe cell is open', async () => {
      const roomId = randomUUID();
      const first = await connect();
      const second = await connect();
      await openFlowerField(first, roomId);
      second.emit('join-room', roomId);
      await flush(second);
      first.emit('flower-field:reveal', { r: 4, c: 4 });
      await flush(first);
      const game = fieldOf(roomId);
      const toFirst = next(first, 'game-won');
      const toSecond = next(second, 'game-won');

      for (let r = 0; r < game.size; r++) {
        for (let c = 0; c < game.size; c++) if (!game.mines![r][c]) first.emit('flower-field:reveal', { r, c });
      }

      await Promise.all([toFirst, toSecond]);
      expect(game.status).toBe('won');
    });

    it('ignores the action in a room that plays another game', async () => {
      const roomId = randomUUID();
      const player = await connect();
      await open(player, roomId, 'takuzu');
      const updated = vi.fn();
      player.on('flower-field:updated', updated);

      player.emit('flower-field:reveal', { r: 0, c: 0 });
      player.emit('flower-field:flag', { r: 0, c: 0 });
      player.emit('flower-field:set-mode', { explosive: true });
      await flush(player);

      expect(updated).not.toHaveBeenCalled();
      expect(rooms.get(roomId)?.game?.id).toBe('takuzu');
    });
  });

  describe('flower-field:flag', () => {
    it('puts a flag with the alias of the player, tells everybody, and takes it off with a second one', async () => {
      const roomId = randomUUID();
      const first = await connect();
      const second = await connect();
      await openFlowerField(first, roomId);
      second.emit('join-room', roomId);
      await flush(second);
      const alias = next(first, 'joined-as');
      first.emit('join-room', roomId);
      const own = await alias;
      const put = next(second, 'flower-field:flagged');

      first.emit('flower-field:flag', { r: 1, c: 2 });

      expect(await put).toEqual({ r: 1, c: 2, alias: own });
      expect(fieldOf(roomId).flags.get('1-2')).toBe(own);

      const removed = next(second, 'flower-field:flagged');
      second.emit('flower-field:flag', { r: 1, c: 2 });
      expect(await removed).toEqual({ r: 1, c: 2, alias: null });
      expect(fieldOf(roomId).flags.size).toBe(0);
    });

    it('ignores a cell outside the field, and a cell that is already open', async () => {
      const roomId = randomUUID();
      const player = await connect();
      const { size } = await openFlowerField(player, roomId);
      player.emit('flower-field:reveal', { r: 4, c: 4 });
      await flush(player);
      const flagged = vi.fn();
      player.on('flower-field:flagged', flagged);

      player.emit('flower-field:flag', { r: size, c: 0 });
      player.emit('flower-field:flag', { r: 4, c: 4 });
      await flush(player);

      expect(flagged).not.toHaveBeenCalled();
    });
  });

  describe('flower-field:set-mode', () => {
    it('tells the room the option while no cell is open', async () => {
      const roomId = randomUUID();
      const first = await connect();
      const second = await connect();
      await openFlowerField(first, roomId);
      second.emit('join-room', roomId);
      await flush(second);
      const told = next(second, 'flower-field:mode');

      first.emit('flower-field:set-mode', { explosive: true });

      expect(await told).toEqual({ explosive: true });
      expect(fieldOf(roomId).explosive).toBe(true);
    });

    it('does not change it once a cell is open, and shows the player who asked the real option', async () => {
      const roomId = randomUUID();
      const player = await connect();
      await openFlowerField(player, roomId);
      player.emit('flower-field:reveal', { r: 4, c: 4 });
      await flush(player);
      const told = next(player, 'flower-field:mode');

      player.emit('flower-field:set-mode', { explosive: true });

      expect(await told).toEqual({ explosive: false });
      expect(fieldOf(roomId).explosive).toBe(false);
    });
  });

  describe('events of the other games', () => {
    it('refuses cell-update: nobody writes a value in this game', async () => {
      const roomId = randomUUID();
      const player = await connect();
      await openFlowerField(player, roomId);

      const ok = await new Promise<boolean>((resolve) => { player.emit('cell-update', { r: 0, c: 0, v: 1 }, (result) => resolve(result.ok)); });

      expect(ok).toBe(false);
      expect(fieldOf(roomId).grid[0][0]).toBe(-1);
    });

    it('shows the others where a player is, inside the field and not outside', async () => {
      const roomId = randomUUID();
      const first = await connect();
      const second = await connect();
      const { size } = await openFlowerField(first, roomId);
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
});
