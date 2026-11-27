import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server } from 'socket.io';
import Client from 'socket.io-client';
import type { Socket as ClientSocket } from 'socket.io-client';
import { MEMORY_HAND_MS, MEMORY_MISMATCH_MS, getMemoryLevel } from '@nbg/shared';
import type { ClientToServerEvents, MemoryStartedPayload, ServerToClientEvents } from '@nbg/shared';
import { setupSocketHandlers, reconnectGrace, rooms, eventLimit, roomCreationLimit, restartLimit, boardGenerationLimit, clientBoardGenerationLimit, voteLimit } from './event';
import type { MemoryGame } from '../rooms/roomStore';

type TestClient = ClientSocket<ServerToClientEvents, ClientToServerEvents>;
type Started = Parameters<ServerToClientEvents['game-started']>[0];

describe('a room that plays the Memory', () => {
  let io: Server<ClientToServerEvents, ServerToClientEvents>;
  let url: string;
  const clients: TestClient[] = [];

  beforeAll(async () => {
    eventLimit.max = Number.POSITIVE_INFINITY;
    reconnectGrace.ms = 0;
    roomCreationLimit.max = Number.POSITIVE_INFINITY;
    restartLimit.max = Number.POSITIVE_INFINITY;
    boardGenerationLimit.max = Number.POSITIVE_INFINITY;
    clientBoardGenerationLimit.max = Number.POSITIVE_INFINITY;
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

  afterEach(() => {
    vi.useRealTimers();
  });

  afterAll(async () => {
    clients.forEach((client) => client.disconnect());
    rooms.clear();
    await new Promise<void>((resolve) => { io.close(() => resolve()); });
  });

  const connect = async (playerId = `memory-player-${clients.length}-abcdef`): Promise<TestClient> => {
    const client = Client(url, { auth: { playerId } }) as TestClient;
    clients.push(client);
    await new Promise<void>((resolve) => { client.once('connect', resolve); });
    return client;
  };

  /** The server has handled everything this client sent before: events on one connection are handled in order. */
  const flush = (client: TestClient) =>
    new Promise<void>((resolve) => { (client as unknown as { emit: (event: string, ack: () => void) => void }).emit('__barrier', resolve); });

  const next = <E extends keyof ServerToClientEvents>(client: TestClient, event: E) =>
    new Promise<Parameters<ServerToClientEvents[E]>[0]>((resolve) => {
      (client as unknown as { once: (name: string, handler: (data: never) => void) => void }).once(event, resolve as (data: never) => void);
    });

  const asMemory = (payload: Started): MemoryStartedPayload => {
    if (payload.game !== 'memory') throw new Error(`Expected a Memory, the room started ${payload.game}`);
    return payload;
  };

  const openMemory = async (client: TestClient, roomId: string): Promise<MemoryStartedPayload> => {
    const atTheTable = next(client, 'lobby-updated');
    client.emit('join-room', roomId);
    await atTheTable;

    const started = next(client, 'game-started');
    client.emit('vote-game', 'memory');
    return asMemory(await started);
  };

  const gameOf = (roomId: string): MemoryGame => {
    const game = rooms.get(roomId)?.game;
    if (game?.id !== 'memory') throw new Error('The room is not playing a Memory');
    return game;
  };

  /** Faces known to the test: the pairs lie side by side (0 0 1 1 2 2...). The deck of the server is a shuffle. */
  const withKnownDeck = (roomId: string, pairs = 4) => {
    gameOf(roomId).deck = Array.from({ length: pairs * 2 }, (_, index) => Math.floor(index / 2));
  };

  /** A room with two players at a table of known cards. */
  const twoPlayers = async (pairs = 4) => {
    const roomId = randomUUID();
    const first = await connect();
    const second = await connect();
    await openMemory(first, roomId);
    second.emit('join-room', roomId);
    await flush(second);
    withKnownDeck(roomId, pairs);
    return { roomId, first, second };
  };

  const collect = <E extends keyof ServerToClientEvents>(client: TestClient, event: E) => {
    const seen: Parameters<ServerToClientEvents[E]>[0][] = [];
    (client as unknown as { on: (name: string, handler: (data: never) => void) => void }).on(event, ((data: never) => { seen.push(data); }) as never);
    return seen;
  };

  it('opens when the players vote for it, with the cards of the level and none of them face up', async () => {
    const roomId = randomUUID();
    const player = await connect();

    const payload = await openMemory(player, roomId);

    expect(payload).toEqual({ game: 'memory', difficulty: 'easy', cards: getMemoryLevel('easy').pairs * 2, matched: [], open: [] });
    expect(rooms.get(roomId)?.game?.id).toBe('memory');
  });

  describe('memory:flip', () => {
    it('turns a card for everybody, the player who flipped it included, with its face and the alias of the player', async () => {
      const { roomId, first, second } = await twoPlayers();
      const toFirst = next(first, 'memory:flipped');
      const toSecond = next(second, 'memory:flipped');

      first.emit('memory:flip', { index: 2 });

      const [told, alsoTold] = await Promise.all([toFirst, toSecond]);
      expect(told).toEqual(alsoTold);
      expect(told).toEqual({ index: 2, face: 1, alias: [...rooms.get(roomId)!.aliases.values()][0] });
      expect(rooms.get(roomId)?.played).toBe(true);
    });

    it('matches two cards with the same face for good, and credits the player who flipped them', async () => {
      const { roomId, first, second } = await twoPlayers();
      const alias = rooms.get(roomId)!.aliases.get('memory-player-0-abcdef');
      const flipped = collect(second, 'memory:flipped');
      const matched = next(second, 'memory:matched');
      const mismatched = vi.fn();
      second.on('memory:mismatched', mismatched);

      first.emit('memory:flip', { index: 0 });
      first.emit('memory:flip', { index: 1 });

      expect(await matched).toEqual({ indices: [0, 1], alias });
      expect(flipped.map(({ index }) => index)).toEqual([0, 1]);
      await flush(second);
      expect(mismatched).not.toHaveBeenCalled();
      expect([...gameOf(roomId).matched.keys()]).toEqual([0, 1]);
    });

    it('tells a mismatch after the second card, locks both cards for the time agreed and frees them after it', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(1_000_000);
      const { roomId, first, second } = await twoPlayers();
      const events: string[] = [];
      second.on('memory:flipped', ({ index }) => events.push(`flipped ${index}`));
      second.on('memory:mismatched', ({ indices }) => events.push(`mismatched ${indices.join(',')}`));

      first.emit('memory:flip', { index: 0 });
      first.emit('memory:flip', { index: 2 });
      await flush(first);
      await flush(second);

      expect(events).toEqual(['flipped 0', 'flipped 2', 'mismatched 0,2']);
      expect(gameOf(roomId).hands.size).toBe(0);

      // Still locked, for the other player as well.
      vi.setSystemTime(1_000_000 + MEMORY_MISMATCH_MS - 1);
      second.emit('memory:flip', { index: 0 });
      first.emit('memory:flip', { index: 2 });
      await flush(first);
      await flush(second);
      expect(events).toHaveLength(3);

      vi.setSystemTime(1_000_000 + MEMORY_MISMATCH_MS);
      const flipped = next(first, 'memory:flipped');
      second.emit('memory:flip', { index: 0 });
      expect(await flipped).toMatchObject({ index: 0, face: 0 });
    });

    it('does not let another player flip a card somebody holds face up, nor the same player twice', async () => {
      const { roomId, first, second } = await twoPlayers();
      const flipped = collect(first, 'memory:flipped');
      first.emit('memory:flip', { index: 0 });
      await flush(first);

      second.emit('memory:flip', { index: 0 });
      first.emit('memory:flip', { index: 0 });
      await flush(second);
      await flush(first);

      expect(flipped).toHaveLength(1);
      expect(gameOf(roomId).hands.size).toBe(1);
      expect(gameOf(roomId).matched.size).toBe(0);
    });

    it('lets another player flip a card held past its time, with no word from the server in between', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(1_000_000);
      const { roomId, first, second } = await twoPlayers();
      const flipped = collect(first, 'memory:flipped');
      first.emit('memory:flip', { index: 0 });
      await flush(first);

      vi.setSystemTime(1_000_000 + MEMORY_HAND_MS - 1);
      second.emit('memory:flip', { index: 0 });
      await flush(second);
      expect(flipped).toHaveLength(1);

      vi.setSystemTime(1_000_000 + MEMORY_HAND_MS);
      second.emit('memory:flip', { index: 0 });
      await flush(second);
      await flush(first);
      expect(flipped).toHaveLength(2);
      expect([...gameOf(roomId).hands.values()].map(({ index }) => index)).toEqual([0]);
    });

    it('ignores a card that is matched already', async () => {
      const { first, second } = await twoPlayers();
      first.emit('memory:flip', { index: 0 });
      first.emit('memory:flip', { index: 1 });
      await flush(first);
      const flipped = collect(second, 'memory:flipped');

      second.emit('memory:flip', { index: 0 });
      await flush(second);
      await flush(first);

      expect(flipped).toHaveLength(0);
    });

    it('lets each player hold a card of their own at the same time', async () => {
      const { first, second } = await twoPlayers();
      const matched = collect(first, 'memory:matched');

      first.emit('memory:flip', { index: 0 });
      second.emit('memory:flip', { index: 2 });
      second.emit('memory:flip', { index: 3 });
      await flush(second);
      await flush(first);

      expect(matched).toHaveLength(1);
      expect(matched[0].indices).toEqual([2, 3]);
    });

    it('shares the hand between the tabs of one player: the second card can come from the other tab', async () => {
      const roomId = randomUUID();
      const tab = await connect('memory-same-player-abcdef');
      const otherTab = await connect('memory-same-player-abcdef');
      await openMemory(tab, roomId);
      otherTab.emit('join-room', roomId);
      await flush(otherTab);
      withKnownDeck(roomId);
      const matched = next(tab, 'memory:matched');

      tab.emit('memory:flip', { index: 4 });
      await flush(tab);
      otherTab.emit('memory:flip', { index: 5 });

      expect((await matched).indices).toEqual([4, 5]);
    });

    it.each([{ index: 8 }, { index: 9999 }, { index: -1 }, { index: 1.5 }, { index: '1' }, { index: null }, {}, null, 'text', 7, []])(
      'ignores a place that is not on the table, or something that is not a place (%j)',
      async (payload) => {
        const { roomId, first, second } = await twoPlayers();
        const flipped = vi.fn();
        second.on('memory:flipped', flipped);

        (first as unknown as { emit: (event: string, data: unknown) => void }).emit('memory:flip', payload);
        await flush(first);
        await flush(second);

        expect(flipped).not.toHaveBeenCalled();
        expect(gameOf(roomId).hands.size).toBe(0);
      },
    );

    it('ignores a flip from a player who is not in a room, and one in a room that plays another game', async () => {
      const outside = await connect();
      outside.emit('memory:flip', { index: 0 });
      await flush(outside);

      const roomId = randomUUID();
      const player = await connect();
      const atTheTable = next(player, 'lobby-updated');
      player.emit('join-room', roomId);
      await atTheTable;
      const started = next(player, 'game-started');
      player.emit('vote-game', 'takuzu');
      await started;
      const flipped = vi.fn();
      player.on('memory:flipped', flipped);

      player.emit('memory:flip', { index: 0 });
      await flush(player);

      expect(flipped).not.toHaveBeenCalled();
    });

    it('wins when the last pair is found, and does not take more flips after it', async () => {
      const { roomId, first, second } = await twoPlayers(2);
      const won = vi.fn();
      second.on('game-won', won);
      const wonFirst = next(first, 'game-won');

      first.emit('memory:flip', { index: 0 });
      first.emit('memory:flip', { index: 1 });
      second.emit('memory:flip', { index: 2 });
      second.emit('memory:flip', { index: 3 });
      await wonFirst;
      await flush(second);

      expect(won).toHaveBeenCalledTimes(1);
      expect(gameOf(roomId).status).toBe('won');

      const flipped = vi.fn();
      second.on('memory:flipped', flipped);
      first.emit('memory:flip', { index: 0 });
      await flush(first);
      await flush(second);
      expect(flipped).not.toHaveBeenCalled();
    });
  });

  describe('a player who leaves', () => {
    it('puts the card they held face up back down, and tells the room', async () => {
      const { roomId, first, second } = await twoPlayers();
      first.emit('memory:flip', { index: 6 });
      await flush(first);
      const closed = next(second, 'memory:closed');

      first.disconnect();

      expect(await closed).toEqual({ index: 6 });
      expect(gameOf(roomId).hands.size).toBe(0);
      // Anybody can flip it now.
      const flipped = next(second, 'memory:flipped');
      second.emit('memory:flip', { index: 6 });
      expect(await flipped).toMatchObject({ index: 6 });
    });

    it('tells nothing when they held no card, and keeps the card of the ones who stay', async () => {
      const { roomId, first, second } = await twoPlayers();
      second.emit('memory:flip', { index: 2 });
      await flush(second);
      const closed = vi.fn();
      second.on('memory:closed', closed);

      first.disconnect();
      await vi.waitFor(() => expect(rooms.get(roomId)!.players.size).toBe(1));

      expect(closed).not.toHaveBeenCalled();
      expect(gameOf(roomId).hands.size).toBe(1);
    });

    it('keeps the card of a tab while another tab of the player is still there', async () => {
      const roomId = randomUUID();
      const tab = await connect('memory-same-player-abcdef');
      const otherTab = await connect('memory-same-player-abcdef');
      await openMemory(tab, roomId);
      otherTab.emit('join-room', roomId);
      await flush(otherTab);
      tab.emit('memory:flip', { index: 0 });
      await flush(tab);

      tab.disconnect();
      await vi.waitFor(() => expect(rooms.get(roomId)!.players.get('memory-same-player-abcdef')!.size).toBe(1));

      expect(gameOf(roomId).hands.size).toBe(1);
    });
  });

  describe('a player who joins or comes back', () => {
    it('is told the pairs found and the cards held, and no face of a card that is hidden', async () => {
      const { roomId, first, second } = await twoPlayers();
      first.emit('memory:flip', { index: 0 });
      first.emit('memory:flip', { index: 1 });
      second.emit('memory:flip', { index: 4 });
      second.emit('memory:flip', { index: 6 });
      first.emit('memory:flip', { index: 2 });
      await flush(first);
      await flush(second);
      const alias = (playerId: string) => rooms.get(roomId)!.aliases.get(playerId);

      const newcomer = await connect();
      const started = next(newcomer, 'game-started');
      newcomer.emit('join-room', roomId);
      const payload = asMemory(await started);

      // 4 and 6 did not match and are locked: hidden. 2 is in the hand of the first player.
      expect(payload).toEqual({
        game: 'memory',
        difficulty: 'easy',
        cards: 8,
        matched: [{ index: 0, face: 0, alias: alias('memory-player-0-abcdef') }, { index: 1, face: 0, alias: alias('memory-player-0-abcdef') }],
        open: [{ index: 2, face: 1, alias: alias('memory-player-0-abcdef'), closesInMs: expect.any(Number) }],
      });
      expect(payload.open[0].closesInMs).toBeGreaterThan(0);
      expect(payload.open[0].closesInMs).toBeLessThanOrEqual(MEMORY_HAND_MS);
      const told = JSON.stringify(payload);
      expect(told).not.toContain('deck');
      expect(told).not.toContain('memory-player');
      expect(payload.matched.length + payload.open.length).toBe(3);
    });

    it('learns nothing about a table where no card was turned', async () => {
      const { roomId, first } = await twoPlayers();
      const newcomer = await connect();
      const started = next(newcomer, 'game-started');
      newcomer.emit('join-room', roomId);

      const payload = asMemory(await started);

      expect(payload.matched).toEqual([]);
      expect(payload.open).toEqual([]);
      expect(Object.keys(payload).sort()).toEqual(['cards', 'difficulty', 'game', 'matched', 'open']);
      await flush(first);
    });

    it('gets the same table back after a dropped connection', async () => {
      const roomId = randomUUID();
      const player = await connect('memory-comes-back-abcdef');
      const other = await connect();
      await openMemory(player, roomId);
      other.emit('join-room', roomId);
      await flush(other);
      withKnownDeck(roomId);
      player.emit('memory:flip', { index: 0 });
      await flush(player);
      reconnectGrace.ms = 30_000;
      onTestFinished(() => { reconnectGrace.ms = 0; });
      player.disconnect();
      await vi.waitFor(() => expect(rooms.get(roomId)!.players.get('memory-comes-back-abcdef')!.size).toBe(0));

      const back = await connect('memory-comes-back-abcdef');
      const started = next(back, 'game-started');
      back.emit('join-room', roomId);

      expect(asMemory(await started).open).toEqual([{ index: 0, face: 0, alias: rooms.get(roomId)!.aliases.get('memory-comes-back-abcdef'), closesInMs: expect.any(Number) }]);
    });
  });

  describe('restart-game', () => {
    it('gives a new deck at the level chosen, with nothing turned, to everybody', async () => {
      const { roomId, first, second } = await twoPlayers();
      first.emit('memory:flip', { index: 0 });
      first.emit('memory:flip', { index: 1 });
      await flush(first);
      const before = gameOf(roomId);
      const told = next(second, 'game-started');

      first.emit('restart-game', 'hard');

      const payload = asMemory(await told);
      expect(payload).toEqual({ game: 'memory', difficulty: 'hard', cards: getMemoryLevel('hard').pairs * 2, matched: [], open: [] });
      expect(gameOf(roomId)).not.toBe(before);
      expect(gameOf(roomId).matched.size).toBe(0);
      expect(gameOf(roomId).hands.size).toBe(0);
      expect(rooms.get(roomId)?.played).toBe(false);
    });

    it('does not spend the budget of boards: a deck is a shuffle', async () => {
      // The limits are read when the handlers are set up: a server of its own, with no board to give out.
      const saved = { board: boardGenerationLimit.max, client: clientBoardGenerationLimit.max };
      boardGenerationLimit.max = 0;
      clientBoardGenerationLimit.max = 0;
      const httpServer = createServer();
      const strict = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);
      setupSocketHandlers(strict);
      boardGenerationLimit.max = saved.board;
      clientBoardGenerationLimit.max = saved.client;
      await new Promise<void>((resolve) => { httpServer.listen(0, resolve); });
      const player = Client(`http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`, { auth: { playerId: 'memory-no-budget-abcdef' } }) as TestClient;
      onTestFinished(async () => {
        player.disconnect();
        await new Promise<void>((resolve) => { strict.close(() => resolve()); });
      });
      await new Promise<void>((resolve) => { player.once('connect', resolve); });

      await openMemory(player, randomUUID());
      const told = next(player, 'game-started');
      player.emit('restart-game', 'medium');

      expect(asMemory(await told).cards).toBe(getMemoryLevel('medium').pairs * 2);
    });
  });

  describe('select-cell', () => {
    it('means nothing in a Memory: it is not passed on to the others', async () => {
      const { first, second } = await twoPlayers();
      const selected = vi.fn();
      second.on('player-selected-cell', selected);

      first.emit('select-cell', { r: 0, c: 0 });
      await flush(first);
      await flush(second);

      expect(selected).not.toHaveBeenCalled();
    });
  });
});
