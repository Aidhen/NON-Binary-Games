import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server } from 'socket.io';
import Client from 'socket.io-client';
import type { Socket as ClientSocket } from 'socket.io-client';
import { MAX_PLAYER_ID_LENGTH } from '@nbg/shared';
import type { ClientToServerEvents, ServerToClientEvents } from '@nbg/shared';
import { addressResolverFromEnv, applyConnectionLimits, connectionLimit, MAX_MESSAGE_BYTES } from './connectionLimits';
import type { AddressOf } from './connectionLimits';
import { rooms, setupSocketHandlers } from './event';

type TestClient = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

const defaults = structuredClone(connectionLimit);

describe('applyConnectionLimits', () => {
  let io: Server<ClientToServerEvents, ServerToClientEvents> | undefined;
  const clients: TestClient[] = [];

  const start = async (addressOf?: AddressOf, maxHttpBufferSize?: number) => {
    const httpServer = createServer();
    io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, maxHttpBufferSize ? { maxHttpBufferSize } : {});
    const guard = applyConnectionLimits(io, addressOf);
    await new Promise<void>((resolve) => { httpServer.listen(0, resolve); });
    return { guard, url: `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}` };
  };

  /** Resolves with `connected`, or with the reason the server gave when it refused the connection. */
  const attempt = (url: string, auth: Record<string, unknown> = {}) =>
    new Promise<{ client: TestClient; result: string }>((resolve) => {
      const client = Client(url, { auth, reconnection: false }) as TestClient;
      clients.push(client);
      client.once('connect', () => resolve({ client, result: 'connected' }));
      client.once('connect_error', (error) => resolve({ client, result: error.message }));
    });

  const closeAndWait = (client: TestClient) => new Promise<void>((resolve) => {
    client.once('disconnect', () => resolve());
    client.disconnect();
  });

  const byAddress: AddressOf = (socket) => socket.handshake.auth.address as string | undefined;

  beforeEach(() => { Object.assign(connectionLimit, structuredClone(defaults)); });

  afterEach(async () => {
    clients.splice(0).forEach((client) => client.disconnect());
    await new Promise<void>((resolve) => { io ? io.close(() => resolve()) : resolve(); });
    io = undefined;
    rooms.clear();
  });

  it('refuses connections over the limit of the whole server, and takes them again when one closes', async () => {
    connectionLimit.maxTotal = 2;
    const { url } = await start(byAddress);

    const first = await attempt(url, { address: 'a' });
    await attempt(url, { address: 'b' });
    expect((await attempt(url, { address: 'c' })).result).toBe('too-many-connections');

    await closeAndWait(first.client);
    await vi.waitFor(async () => expect((await attempt(url, { address: 'd' })).result).toBe('connected'));
  });

  it('refuses connections over the limit of one address and leaves the other addresses alone', async () => {
    connectionLimit.maxPerAddress = 2;
    const { url } = await start(byAddress);

    await attempt(url, { address: 'a' });
    await attempt(url, { address: 'a' });

    expect((await attempt(url, { address: 'a' })).result).toBe('too-many-connections');
    expect((await attempt(url, { address: 'b' })).result).toBe('connected');
  });

  it('limits how many connections an address can open, also when they are closed', async () => {
    connectionLimit.newPerAddress = { max: 2, windowMs: 60_000 };
    const { url } = await start(byAddress);

    for (let i = 0; i < 2; i++) {
      const { client, result } = await attempt(url, { address: 'a' });
      expect(result).toBe('connected');
      await closeAndWait(client);
    }

    expect((await attempt(url, { address: 'a' })).result).toBe('too-many-connections');
    expect((await attempt(url, { address: 'b' })).result).toBe('connected');
  });

  it('puts no limit on connections whose address is not known', async () => {
    connectionLimit.maxPerAddress = 1;
    connectionLimit.maxTotal = 1;
    const { url } = await start(() => undefined);

    expect((await attempt(url)).result).toBe('connected');
    expect((await attempt(url)).result).toBe('connected');
  });

  it('keeps the address of the connection for the budgets of the rooms', async () => {
    const { url } = await start(byAddress);
    const serverSide = new Promise<string | undefined>((resolve) => { io!.once('connection', (socket) => resolve(socket.data.address)); });

    await attempt(url, { address: 'kept-address' });

    await expect(serverSide).resolves.toBe('kept-address');
  });

  it('forgets an address when its last connection closes', async () => {
    const { url, guard } = await start(byAddress);

    const { client } = await attempt(url, { address: 'a' });
    await vi.waitFor(() => expect(guard.stats()).toEqual({ total: 1, addresses: 1 }));

    await closeAndWait(client);
    await vi.waitFor(() => expect(guard.stats()).toEqual({ total: 0, addresses: 0 }));
  });

  it('closes the connection of a client that sends more than the largest message', async () => {
    const { url } = await start(undefined, MAX_MESSAGE_BYTES);
    const { client } = await attempt(url);
    const closed = new Promise<string>((resolve) => { client.once('disconnect', resolve); });

    (client as unknown as { emit: (event: string, data: unknown) => void }).emit('select-cell', { r: 'x'.repeat(MAX_MESSAGE_BYTES * 3) });

    await expect(closed).resolves.toBeTypeOf('string');
  });

  it('still accepts the largest message a client really sends', async () => {
    const { url } = await start(undefined, MAX_MESSAGE_BYTES);
    setupSocketHandlers(io!);
    // A room id is always 36 characters; the player id is the longest the schema allows.
    const { client, result } = await attempt(url, { playerId: 'p'.repeat(MAX_PLAYER_ID_LENGTH) });
    expect(result).toBe('connected');
    const started = new Promise<string>((resolve) => { client.once('lobby-updated', () => resolve('started')); });
    const closed = new Promise<string>((resolve) => { client.once('disconnect', () => resolve('closed')); });

    client.emit('join-room', crypto.randomUUID());

    await expect(Promise.race([started, closed])).resolves.toBe('started');
  });
});

describe('addressResolverFromEnv', () => {
  const socketWith = (headers: Record<string, string | string[]>, address = '10.0.0.1') =>
    ({ handshake: { headers, address } }) as unknown as Parameters<AddressOf>[0];

  it('is off when nothing is configured', () => {
    expect(addressResolverFromEnv({})).toBeUndefined();
  });

  it('uses the address of the connection when asked to', () => {
    expect(addressResolverFromEnv({ LIMIT_BY_PEER_ADDRESS: 'true' })!(socketWith({}, '127.0.0.1'))).toBe('127.0.0.1');
    expect(addressResolverFromEnv({ LIMIT_BY_PEER_ADDRESS: 'yes' })).toBeUndefined();
  });

  it('takes the last entry of the configured header: the first ones are written by the client', () => {
    const resolve = addressResolverFromEnv({ CLIENT_IP_HEADER: 'X-Forwarded-For' })!;

    expect(resolve(socketWith({ 'x-forwarded-for': '6.6.6.6, 7.7.7.7, 203.0.113.9' }))).toBe('203.0.113.9');
    expect(resolve(socketWith({ 'x-forwarded-for': ['1.1.1.1', '203.0.113.9'] }))).toBe('203.0.113.9');
  });

  it.each<Record<string, string>>([{}, { 'x-forwarded-for': '' }, { 'x-forwarded-for': 'a'.repeat(65) }])('falls back to the address of the connection when the header is missing or unusable (%j)', (headers) => {
    expect(addressResolverFromEnv({ CLIENT_IP_HEADER: 'x-forwarded-for' })!(socketWith(headers, '10.0.0.1'))).toBe('10.0.0.1');
  });

  it('prefers the header over the address of the connection', () => {
    const resolve = addressResolverFromEnv({ CLIENT_IP_HEADER: 'x-real-ip', LIMIT_BY_PEER_ADDRESS: 'true' })!;

    expect(resolve(socketWith({ 'x-real-ip': '203.0.113.9' }))).toBe('203.0.113.9');
  });
});
