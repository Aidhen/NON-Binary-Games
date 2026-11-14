import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server } from 'socket.io';
import Client from 'socket.io-client';
import type { Socket as ClientSocket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@nbg/shared';
import { generateSudoku } from '@nbg/shared';
import { setupSocketHandlers, rooms, eventLimit, roomCreationLimit, boardGenerationLimit } from './event';
import { logger } from '../logger';

// The real generator, which a test can make fail once.
vi.mock('@nbg/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nbg/shared')>();
  return { ...actual, generateSudoku: vi.fn(actual.generateSudoku) };
});

type TestClient = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

const ROOM_A = '3f2b8c1e-9d4a-4b7e-8a2c-5d6e7f8a9b01';
const ROOM_B = '3f2b8c1e-9d4a-4b7e-8a2c-5d6e7f8a9b02';

describe('joining a room when making its board fails', () => {
  let io: Server<ClientToServerEvents, ServerToClientEvents>;
  let url: string;
  const clients: TestClient[] = [];
  const roomOf = new Map<string, string | undefined>();

  beforeAll(async () => {
    eventLimit.max = Number.POSITIVE_INFINITY;
    roomCreationLimit.max = Number.POSITIVE_INFINITY;
    boardGenerationLimit.max = Number.POSITIVE_INFINITY;
    const httpServer = createServer();
    io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);
    setupSocketHandlers(io);
    io.on('connection', (socket) => {
      roomOf.set(socket.id, undefined);
      (socket as unknown as { on: (event: string, handler: (ack: () => void) => void) => void }).on('__barrier', (ack) => { roomOf.set(socket.id, socket.data.roomId); ack(); });
      socket.onAny(() => roomOf.set(socket.id, socket.data.roomId));
    });
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
    const client = Client(url, { auth: { playerId: `join-failure-${clients.length}-abcdef` } }) as TestClient;
    clients.push(client);
    await new Promise<void>((resolve) => { client.once('connect', resolve); });
    return client;
  };

  const flush = (client: TestClient) =>
    new Promise<void>((resolve) => { (client as unknown as { emit: (e: string, ack: () => void) => void }).emit('__barrier', resolve); });

  it('leaves the player in the room they were in, and creates nothing', async () => {
    const logged = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    const client = await connect();
    const first = new Promise<void>((resolve) => { client.once('game-started', () => resolve()); });
    client.emit('join-room', ROOM_A, 'easy');
    await first;

    vi.mocked(generateSudoku).mockImplementationOnce(() => { throw new Error('the board could not be made'); });
    const started = vi.fn();
    client.on('game-started', started);
    client.emit('join-room', ROOM_B, 'easy');
    await flush(client);

    expect(logged).toHaveBeenCalled();
    expect(rooms.has(ROOM_B)).toBe(false);
    expect(started).not.toHaveBeenCalled();
    // Still in the room where they were, with the others able to reach them there.
    expect(rooms.get(ROOM_A)!.players.has(`join-failure-0-abcdef`)).toBe(true);
    expect(roomOf.get(client.id!)).toBe(ROOM_A);
    logged.mockRestore();
  });

  it('lets the same player join again once the board can be made', async () => {
    const logged = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    const client = await connect();
    vi.mocked(generateSudoku).mockImplementationOnce(() => { throw new Error('the board could not be made'); });

    client.emit('join-room', ROOM_B, 'easy');
    await flush(client);
    expect(rooms.has(ROOM_B)).toBe(false);

    const started = new Promise<void>((resolve) => { client.once('game-started', () => resolve()); });
    client.emit('join-room', ROOM_B, 'easy');
    await started;

    expect(rooms.has(ROOM_B)).toBe(true);
    logged.mockRestore();
  });
});
