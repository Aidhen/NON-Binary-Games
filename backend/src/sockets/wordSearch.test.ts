import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server } from 'socket.io';
import Client from 'socket.io-client';
import type { Socket as ClientSocket } from 'socket.io-client';
import { generateWordSearch } from '@nbg/shared';
import type { ClientToServerEvents, LobbyState, ServerToClientEvents, WordSearchPuzzle, WordSearchStartedPayload } from '@nbg/shared';
import { setupSocketHandlers, reconnectGrace, rooms, eventLimit, roomCreationLimit, restartLimit, boardGenerationLimit, clientBoardGenerationLimit, voteLimit } from './event';
import { logger } from '../logger';
import type { WordSearchGame } from '../rooms/roomStore';
import { FORBIDDEN } from '../rooms/wordSearchBlocklist';

/** A 5x5 puzzle made by hand, so that the test knows where the words are: CAT on the first row, DOG down the last column, ANT backwards on the last row. */
const handMade = (): WordSearchPuzzle => {
  const placements = [
    { word: 'DOG', r: 1, c: 4, dr: 1, dc: 0 },
    { word: 'CAT', r: 0, c: 0, dr: 0, dc: 1 },
    { word: 'ANT', r: 4, c: 4, dr: 0, dc: -1 },
  ];
  const grid = Array.from({ length: 5 }, () => new Array<string>(5).fill('X'));
  for (const { word, r, c, dr, dc } of placements) [...word].forEach((letter, i) => { grid[r + dr * i][c + dc * i] = letter; });
  // Not what the grid spells (the filler here is X): the test only needs a hidden word to be sure it never travels.
  const hidden = { word: 'HIDE', cells: [[2, 0], [2, 1], [2, 2], [2, 3]] as [number, number][] };
  return { size: 5, grid, placements, hidden };
};

vi.mock('@nbg/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nbg/shared')>();
  return { ...actual, generateWordSearch: vi.fn() };
});

type TestClient = ClientSocket<ServerToClientEvents, ClientToServerEvents>;
type Started = Parameters<ServerToClientEvents['game-started']>[0];
type Budgets = { restart?: number };

const CAT: [{ r: number; c: number }, { r: number; c: number }] = [{ r: 0, c: 0 }, { r: 0, c: 2 }];
const DOG: [{ r: number; c: number }, { r: number; c: number }] = [{ r: 1, c: 4 }, { r: 3, c: 4 }];
const ANT: [{ r: number; c: number }, { r: number; c: number }] = [{ r: 4, c: 4 }, { r: 4, c: 2 }];

describe('a room that plays the Word Search', () => {
  let io: Server<ClientToServerEvents, ServerToClientEvents>;
  let url: string;
  const clients: TestClient[] = [];

  /** The budgets are read when a server is set up, so a test that needs a tight one starts a server of its own. */
  const startServer = async (budgets: Budgets = {}) => {
    eventLimit.max = Number.POSITIVE_INFINITY;
    reconnectGrace.ms = 0;
    roomCreationLimit.max = Number.POSITIVE_INFINITY;
    restartLimit.max = budgets.restart ?? Number.POSITIVE_INFINITY;
    boardGenerationLimit.max = Number.POSITIVE_INFINITY;
    clientBoardGenerationLimit.max = Number.POSITIVE_INFINITY;
    const httpServer = createServer();
    io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);
    setupSocketHandlers(io);
    io.on('connection', (socket) => { (socket as unknown as { on: (event: string, handler: (ack: () => void) => void) => void }).on('__barrier', (ack) => ack()); });
    await new Promise<void>((resolve) => { httpServer.listen(0, resolve); });
    url = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
    restartLimit.max = Number.POSITIVE_INFINITY;
  };

  const stopServer = async () => {
    clients.splice(0).forEach((client) => client.disconnect());
    rooms.clear();
    await new Promise<void>((resolve) => { io.close(() => resolve()); });
  };

  beforeAll(() => startServer());
  afterAll(stopServer);

  beforeEach(() => {
    rooms.clear();
    rooms.emptyRoomTtlMs = 0;
    voteLimit.cooldownMs = 0;
    vi.mocked(generateWordSearch).mockReset();
    vi.mocked(generateWordSearch).mockImplementation(handMade);
  });

  const connect = async (): Promise<TestClient> => {
    const client = Client(url, { auth: { playerId: `word-player-${clients.length}-abcdef-${randomUUID()}` } }) as TestClient;
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

  const asWordSearch = (payload: Started): WordSearchStartedPayload => {
    if (payload.game !== 'word-search') throw new Error(`Expected a Word Search, the room started ${payload.game}`);
    return payload;
  };

  const open = async (client: TestClient, roomId: string, game: 'word-search' | 'takuzu' = 'word-search'): Promise<Started> => {
    const atTheTable = new Promise<LobbyState>((resolve) => { client.once('lobby-updated', resolve); });
    client.emit('join-room', roomId);
    await atTheTable;

    const started = next(client, 'game-started');
    client.emit('vote-game', game);
    return started;
  };

  const openWordSearch = async (client: TestClient, roomId: string) => asWordSearch(await open(client, roomId));

  const gameOf = (roomId: string): WordSearchGame => {
    const game = rooms.get(roomId)?.game;
    if (game?.id !== 'word-search') throw new Error('The room is not playing a Word Search');
    return game;
  };

  /** Joins a room that is playing, and waits for everything the server tells at the door, so that no part of it is taken for an answer to what comes next. */
  const join = async (client: TestClient, roomId: string) => {
    const joined = next(client, 'joined-as');
    const started = next(client, 'game-started');
    client.emit('join-room', roomId);
    const [alias] = await Promise.all([joined, started]);
    return alias;
  };

  it('opens when the players vote for it, with the grid and the words in alphabetical order', async () => {
    const roomId = randomUUID();
    const player = await connect();

    const payload = await openWordSearch(player, roomId);

    expect(payload).toMatchObject({ size: 5, difficulty: 'easy', language: 'en', words: ['ANT', 'CAT', 'DOG'], hiddenLength: 4, found: [] });
    expect(payload.grid).toEqual(handMade().grid);
    expect(generateWordSearch).toHaveBeenCalledWith('easy', 'en', FORBIDDEN);
    expect(rooms.get(roomId)?.game?.id).toBe('word-search');
  });

  it('never tells where a word lies before somebody finds it', async () => {
    const roomId = randomUUID();
    const player = await connect();

    const payload = await openWordSearch(player, roomId);

    const serialized = JSON.stringify(payload);
    expect(serialized).not.toMatch(/placements|"dr"|"dc"/);
    expect(Object.keys(payload).sort()).toEqual(['difficulty', 'found', 'game', 'grid', 'hiddenLength', 'language', 'size', 'words']);
  });

  it('tells how long the hidden word is and never the word, nor the cells that spell it', async () => {
    const roomId = randomUUID();
    const player = await connect();

    const payload = await openWordSearch(player, roomId);

    expect(payload.hiddenLength).toBe(4);
    expect(JSON.stringify(payload)).not.toMatch(/hidden"|HIDE|"cells"/);
  });

  describe('word-search:select', () => {
    it('tells everybody, the player who found it included, with the alias of who found it', async () => {
      const roomId = randomUUID();
      const first = await connect();
      const second = await connect();
      await openWordSearch(first, roomId);
      const alias = await join(second, roomId);
      const toFirst = next(first, 'word-search:found');
      const toSecond = next(second, 'word-search:found');

      second.emit('word-search:select', { from: CAT[0], to: CAT[1] });

      const [told, alsoTold] = await Promise.all([toFirst, toSecond]);
      expect(told).toEqual(alsoTold);
      expect(told).toEqual({ word: 'CAT', alias, from: CAT[0], to: CAT[1] });
      expect(gameOf(roomId).found.get('CAT')?.alias).toBe(alias);
      expect(rooms.get(roomId)?.played).toBe(true);
    });

    it('works from either end, and tells the ends of the word as they were laid', async () => {
      const roomId = randomUUID();
      const player = await connect();
      await openWordSearch(player, roomId);
      const told = next(player, 'word-search:found');

      player.emit('word-search:select', { from: DOG[1], to: DOG[0] });

      expect(await told).toMatchObject({ word: 'DOG', from: DOG[0], to: DOG[1] });
    });

    it('does nothing for what is not a word, a word found already, or a cell outside the grid', async () => {
      const roomId = randomUUID();
      const player = await connect();
      await openWordSearch(player, roomId);
      const found = vi.fn();
      player.on('word-search:found', found);

      player.emit('word-search:select', { from: { r: 0, c: 0 }, to: { r: 0, c: 1 } });
      player.emit('word-search:select', { from: { r: 0, c: 0 }, to: { r: 2, c: 1 } });
      player.emit('word-search:select', { from: { r: 0, c: 0 }, to: { r: 0, c: 5 } });
      player.emit('word-search:select', { from: { r: 5, c: 0 }, to: { r: 0, c: 0 } });
      player.emit('word-search:select', { from: { r: -1, c: 0 }, to: { r: 0, c: 0 } });
      player.emit('word-search:select', { from: { r: 0.5, c: 0 }, to: { r: 0, c: 0 } });
      await flush(player);
      expect(found).not.toHaveBeenCalled();
      expect(gameOf(roomId).found.size).toBe(0);
      expect(rooms.get(roomId)?.played).toBe(false);

      player.emit('word-search:select', { from: CAT[0], to: CAT[1] });
      player.emit('word-search:select', { from: CAT[1], to: CAT[0] });
      await flush(player);
      expect(found).toHaveBeenCalledTimes(1);
    });

    it('wins with the last word, tells it once, and ignores every selection after', async () => {
      const roomId = randomUUID();
      const first = await connect();
      const second = await connect();
      await openWordSearch(first, roomId);
      await join(second, roomId);
      const won = vi.fn();
      const found = vi.fn();
      second.on('game-won', won);
      second.on('word-search:found', found);

      first.emit('word-search:select', { from: CAT[0], to: CAT[1] });
      first.emit('word-search:select', { from: DOG[0], to: DOG[1] });
      second.emit('word-search:select', { from: ANT[0], to: ANT[1] });
      await flush(first);
      await flush(second);
      expect(won).toHaveBeenCalledTimes(1);
      expect(found).toHaveBeenCalledTimes(3);
      expect(gameOf(roomId).status).toBe('won');

      // Even a word that was not found (as if it had been taken back) cannot be found once the game is won.
      gameOf(roomId).found.delete('CAT');
      first.emit('word-search:select', { from: CAT[0], to: CAT[1] });
      await flush(first);
      await flush(second);
      expect(found).toHaveBeenCalledTimes(3);
      expect(won).toHaveBeenCalledTimes(1);
    });

    it('does nothing from a socket that is in no room, or in a room playing another game', async () => {
      const lonely = await connect();
      const roomId = randomUUID();
      const player = await connect();
      await open(player, roomId, 'takuzu');
      const found = vi.fn();
      lonely.on('word-search:found', found);
      player.on('word-search:found', found);

      lonely.emit('word-search:select', { from: CAT[0], to: CAT[1] });
      player.emit('word-search:select', { from: CAT[0], to: CAT[1] });
      lonely.emit('word-search:set-language', { language: 'it' });
      player.emit('word-search:set-language', { language: 'it' });
      await flush(lonely);
      await flush(player);

      expect(found).not.toHaveBeenCalled();
      expect(rooms.get(roomId)?.game?.id).toBe('takuzu');
    });

    it('drops a payload the schema refuses', async () => {
      const roomId = randomUUID();
      const player = await connect();
      await openWordSearch(player, roomId);
      const found = vi.fn();
      player.on('word-search:found', found);
      const emit = player as unknown as { emit: (event: string, ...args: unknown[]) => void };

      emit.emit('word-search:select', { from: CAT[0] });
      emit.emit('word-search:select', 'CAT');
      await flush(player);

      expect(found).not.toHaveBeenCalled();
    });

    it('is told a word found before when somebody comes in late', async () => {
      const roomId = randomUUID();
      const first = await connect();
      const late = await connect();
      await openWordSearch(first, roomId);
      const alias = await join(first, roomId);
      first.emit('word-search:select', { from: DOG[0], to: DOG[1] });
      await flush(first);

      const started = next(late, 'game-started');
      late.emit('join-room', roomId);
      const payload = asWordSearch(await started);

      expect(payload.found).toEqual([{ word: 'DOG', alias, from: DOG[0], to: DOG[1] }]);
      expect(payload.words).toEqual(['ANT', 'CAT', 'DOG']);
      expect(payload.grid).toEqual(handMade().grid);
      expect(JSON.stringify(payload)).not.toMatch(/placements|"dr"|"dc"|hidden"|HIDE|"cells"/);
      expect(payload.hiddenLength).toBe(4);
    });
  });

  describe('cell-update', () => {
    it('means nothing in a Word Search', async () => {
      const roomId = randomUUID();
      const player = await connect();
      await openWordSearch(player, roomId);

      const answer = await new Promise<{ ok: boolean }>((resolve) => { player.emit('cell-update', { r: 0, c: 0, v: 1 }, resolve); });

      expect(answer).toEqual({ ok: false });
    });

    it('still lets the players show the cell they point at, inside the grid', async () => {
      const roomId = randomUUID();
      const first = await connect();
      const second = await connect();
      await openWordSearch(first, roomId);
      const alias = await join(first, roomId);
      await join(second, roomId);
      const selected = vi.fn();
      second.on('player-selected-cell', selected);

      first.emit('select-cell', { r: 4, c: 4 });
      first.emit('select-cell', { r: 5, c: 0 });
      await flush(first);
      await flush(second);

      expect(selected).toHaveBeenCalledTimes(1);
      expect(selected).toHaveBeenCalledWith({ alias, r: 4, c: 4 });
    });
  });

  describe('word-search:set-language', () => {
    it('makes a new puzzle in that language for everybody, and starts over', async () => {
      const roomId = randomUUID();
      const first = await connect();
      const second = await connect();
      await openWordSearch(first, roomId);
      await join(second, roomId);
      first.emit('word-search:select', { from: CAT[0], to: CAT[1] });
      await flush(first);
      const toFirst = next(first, 'game-started');
      const toSecond = next(second, 'game-started');

      second.emit('word-search:set-language', { language: 'it' });

      const [told, alsoTold] = await Promise.all([toFirst, toSecond]);
      expect(told).toEqual(alsoTold);
      expect(asWordSearch(told)).toMatchObject({ language: 'it', difficulty: 'easy', found: [] });
      expect(generateWordSearch).toHaveBeenLastCalledWith('easy', 'it', FORBIDDEN);
      expect(gameOf(roomId)).toMatchObject({ language: 'it', status: 'playing' });
      expect(gameOf(roomId).found.size).toBe(0);
      expect(rooms.get(roomId)?.played).toBe(false);
    });

    it('does nothing when the room already has that language', async () => {
      const roomId = randomUUID();
      const player = await connect();
      await openWordSearch(player, roomId);
      const before = gameOf(roomId);
      player.emit('word-search:select', { from: CAT[0], to: CAT[1] });
      const started = vi.fn();
      player.on('game-started', started);
      vi.mocked(generateWordSearch).mockClear();

      player.emit('word-search:set-language', { language: 'en' });
      await flush(player);

      expect(started).not.toHaveBeenCalled();
      expect(generateWordSearch).not.toHaveBeenCalled();
      expect(rooms.get(roomId)?.game).toBe(before);
      expect(before.found.size).toBe(1);
    });

    it('drops a language the contract does not know', async () => {
      const roomId = randomUUID();
      const player = await connect();
      await openWordSearch(player, roomId);
      const started = vi.fn();
      player.on('game-started', started);
      const emit = player as unknown as { emit: (event: string, ...args: unknown[]) => void };

      emit.emit('word-search:set-language', { language: 'xx' });
      emit.emit('word-search:set-language', {});
      await flush(player);

      expect(started).not.toHaveBeenCalled();
      expect(gameOf(roomId).language).toBe('en');
    });

    it('is kept by a restart, which brings the same words back to the start in the same language', async () => {
      const roomId = randomUUID();
      const player = await connect();
      await openWordSearch(player, roomId);
      player.emit('word-search:set-language', { language: 'it' });
      await flush(player);
      vi.mocked(generateWordSearch).mockClear();
      const restarted = next(player, 'game-started');

      player.emit('restart-game', 'hard');

      expect(asWordSearch(await restarted)).toMatchObject({ language: 'it', difficulty: 'hard', found: [] });
      expect(generateWordSearch).toHaveBeenCalledWith('hard', 'it', FORBIDDEN);
    });

    it('keeps the puzzle that is being played when a new one cannot be made, and works on the next try', async () => {
      const logged = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
      const roomId = randomUUID();
      const player = await connect();
      await openWordSearch(player, roomId);
      const before = gameOf(roomId);
      const started = vi.fn();
      player.on('game-started', started);

      vi.mocked(generateWordSearch).mockImplementationOnce(() => { throw new Error('the puzzle could not be made'); });
      player.emit('word-search:set-language', { language: 'it' });
      await flush(player);

      expect(logged).toHaveBeenCalled();
      expect(rooms.get(roomId)?.game).toBe(before);
      expect(before.language).toBe('en');
      expect(started).not.toHaveBeenCalled();

      const again = next(player, 'game-started');
      player.emit('word-search:set-language', { language: 'it' });
      expect(asWordSearch(await again).language).toBe('it');
      logged.mockRestore();
    });
  });

  it('keeps the room at the table, with the vote, when its puzzle cannot be made, and opens it on the next try', async () => {
    const logged = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    const roomId = randomUUID();
    const player = await connect();
    const atTheTable = next(player, 'lobby-updated');
    player.emit('join-room', roomId);
    await atTheTable;
    const started = vi.fn();
    player.on('game-started', started);

    vi.mocked(generateWordSearch).mockImplementationOnce(() => { throw new Error('the puzzle could not be made'); });
    player.emit('vote-game', 'word-search');
    await flush(player);

    expect(logged).toHaveBeenCalled();
    expect(rooms.get(roomId)!.game).toBeNull();
    expect(rooms.get(roomId)!.votes.size).toBe(1);
    expect(started).not.toHaveBeenCalled();

    const opened = next(player, 'game-started');
    player.emit('vote-game', 'word-search');
    expect(asWordSearch(await opened).words).toEqual(['ANT', 'CAT', 'DOG']);
    logged.mockRestore();
  });

  describe('with a tight budget of restarts', () => {
    beforeAll(async () => {
      await stopServer();
      await startServer({ restart: 2 });
    });

    afterEach(() => {
      clients.splice(0).forEach((client) => client.disconnect());
    });

    it('limits how many times a socket can change the language, as it limits restarts', async () => {
      const roomId = randomUUID();
      const player = await connect();
      await openWordSearch(player, roomId);
      const started = vi.fn();
      player.on('game-started', started);

      // Each one asks for the other language than the room has, so none is a no-op.
      for (const language of ['it', 'en', 'it', 'it'] as const) player.emit('word-search:set-language', { language });
      await flush(player);

      expect(started).toHaveBeenCalledTimes(2);
      expect(gameOf(roomId).language).toBe('en');
    });
  });
});
