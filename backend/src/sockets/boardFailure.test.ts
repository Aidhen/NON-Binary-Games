import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server } from 'socket.io';
import Client from 'socket.io-client';
import type { Socket as ClientSocket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@nbg/shared';
import { generateSudoku } from '@nbg/shared';
import { setupSocketHandlers, rooms, eventLimit, roomCreationLimit, restartLimit, boardGenerationLimit, voteLimit } from './event';
import { logger } from '../logger';

// The real generator, which a test can make fail once.
vi.mock('@nbg/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nbg/shared')>();
  return { ...actual, generateSudoku: vi.fn(actual.generateSudoku) };
});

type TestClient = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

const ROOM = '3f2b8c1e-9d4a-4b7e-8a2c-5d6e7f8a9b01';
const failOnce = () => vi.mocked(generateSudoku).mockImplementationOnce(() => { throw new Error('the board could not be made'); });

describe('when a board cannot be made', () => {
  let io: Server<ClientToServerEvents, ServerToClientEvents>;
  let url: string;
  const clients: TestClient[] = [];

  beforeAll(async () => {
    eventLimit.max = Number.POSITIVE_INFINITY;
    roomCreationLimit.max = Number.POSITIVE_INFINITY;
    restartLimit.max = Number.POSITIVE_INFINITY;
    boardGenerationLimit.max = Number.POSITIVE_INFINITY;
    voteLimit.cooldownMs = 0;
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
    vi.mocked(generateSudoku).mockClear();
  });

  afterAll(async () => {
    clients.forEach((client) => client.disconnect());
    rooms.clear();
    await new Promise<void>((resolve) => { io.close(() => resolve()); });
  });

  const connect = async (): Promise<TestClient> => {
    const client = Client(url, { auth: { playerId: `board-failure-${clients.length}-abcdef` } }) as TestClient;
    clients.push(client);
    await new Promise<void>((resolve) => { client.once('connect', resolve); });
    return client;
  };

  const flush = (client: TestClient) =>
    new Promise<void>((resolve) => { (client as unknown as { emit: (event: string, ack: () => void) => void }).emit('__barrier', resolve); });

  /** Joins the room and waits until the server has told the player about the table. */
  const sitAtTheTable = async (client: TestClient) => {
    const lobby = new Promise<void>((resolve) => { client.once('lobby-updated', () => resolve()); });
    client.emit('join-room', ROOM);
    await lobby;
  };

  it('keeps the room at the table, with the vote, when its game cannot open, and opens it on the next try', async () => {
    const logged = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    const client = await connect();
    await sitAtTheTable(client);
    const started = vi.fn();
    client.on('game-started', started);

    failOnce();
    client.emit('vote-game', 'sudoku');
    await flush(client);

    expect(logged).toHaveBeenCalled();
    expect(rooms.get(ROOM)!.game).toBeNull();
    expect(rooms.get(ROOM)!.votes.size).toBe(1);
    expect(started).not.toHaveBeenCalled();

    // The same vote again is the way out: it tries to open the game once more.
    const opened = new Promise<void>((resolve) => { client.once('game-started', () => resolve()); });
    client.emit('vote-game', 'sudoku');
    await opened;

    expect(rooms.get(ROOM)!.game?.id).toBe('sudoku');
    logged.mockRestore();
  });

  it('keeps the game that is being played when a restart cannot make its board', async () => {
    const logged = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    const client = await connect();
    await sitAtTheTable(client);
    const opened = new Promise<void>((resolve) => { client.once('game-started', () => resolve()); });
    client.emit('vote-game', 'sudoku');
    await opened;
    const before = rooms.get(ROOM)!.game;
    const started = vi.fn();
    client.on('game-started', started);

    failOnce();
    client.emit('restart-game', 'expert');
    await flush(client);

    expect(logged).toHaveBeenCalled();
    expect(rooms.get(ROOM)!.game).toBe(before);
    expect(started).not.toHaveBeenCalled();

    // The next restart works: nothing was left half done.
    const restarted = new Promise<void>((resolve) => { client.once('game-started', () => resolve()); });
    client.emit('restart-game', 'expert');
    await restarted;

    expect(rooms.get(ROOM)!.game).not.toBe(before);
    expect(rooms.get(ROOM)!.game?.id === 'sudoku' && rooms.get(ROOM)!.game?.difficulty).toBe('expert');
    logged.mockRestore();
  });
});
