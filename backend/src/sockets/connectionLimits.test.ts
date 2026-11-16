import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createServer, get } from 'node:http';
import type { IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server } from 'socket.io';
import Client from 'socket.io-client';
import type { Socket as ClientSocket } from 'socket.io-client';
import { MAX_PLAYER_ID_LENGTH } from '@nbg/shared';
import type { ClientToServerEvents, ServerToClientEvents } from '@nbg/shared';
import { addressResolverFromEnv, createConnectionGuard, connectionLimit, MAX_MESSAGE_BYTES, normaliseAddress } from './connectionLimits';
import type { AddressOf } from './connectionLimits';
import { rooms, setupSocketHandlers } from './event';

type TestClient = ClientSocket<ServerToClientEvents, ClientToServerEvents>;
type Transport = 'polling' | 'websocket';
/** `origin: null` sends no Origin header at all. */
type From = { address?: string; origin?: string | null };

const defaults = structuredClone(connectionLimit);
const ORIGIN = 'https://games.example.com';
const ADDRESS_HEADER = 'x-test-address';

const headersOf = ({ address, origin = ORIGIN }: From) => ({ ...(origin === null ? {} : { origin }), ...(address === undefined ? {} : { [ADDRESS_HEADER]: address }) });

describe('createConnectionGuard', () => {
  let io: Server<ClientToServerEvents, ServerToClientEvents> | undefined;
  const clients: TestClient[] = [];

  const start = async (addressOf?: AddressOf, maxHttpBufferSize?: number) => {
    const httpServer = createServer();
    const guard = createConnectionGuard(ORIGIN, addressOf);
    io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, { allowRequest: guard.allowRequest, ...(maxHttpBufferSize ? { maxHttpBufferSize } : {}) });
    guard.track(io);
    await new Promise<void>((resolve) => { httpServer.listen(0, resolve); });
    return { guard, url: `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}` };
  };

  /** Resolves with `connected`, or with `refused` when the server did not let the connection open. */
  const attempt = (url: string, from: From = {}, auth: Record<string, unknown> = {}, transports: Transport[] = ['polling', 'websocket']) =>
    new Promise<{ client: TestClient; result: 'connected' | 'refused' }>((resolve) => {
      const client = Client(url, { auth, reconnection: false, transports, extraHeaders: headersOf(from) }) as TestClient;
      clients.push(client);
      client.once('connect', () => resolve({ client, result: 'connected' }));
      client.once('connect_error', () => resolve({ client, result: 'refused' }));
    });

  /**
   * Opens an Engine.IO session and stops there: the Socket.IO CONNECT is never sent, so nothing above the
   * transport ever hears about it. Resolves with the status of the answer and the reason when it is a refusal.
   */
  const openSession = (url: string, from: From = {}, transport: Transport = 'polling') =>
    new Promise<{ status: number; reason?: string }>((resolve, reject) => {
      const upgrade = transport === 'websocket' ? { connection: 'Upgrade', upgrade: 'websocket', 'sec-websocket-version': '13', 'sec-websocket-key': Buffer.from('0123456789abcdef').toString('base64') } : {};
      const request = get(`${url}/socket.io/?EIO=4&transport=${transport}`, { agent: false, headers: { ...headersOf(from), ...upgrade } }, (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => { body += chunk; });
        response.on('end', () => {
          const status = response.statusCode ?? 0;
          if (status === 200) return resolve({ status });
          // A refused polling request answers with JSON, a refused upgrade with the bare reason.
          let reason = body;
          try { reason = (JSON.parse(body) as { message: string }).message; } catch { /* the bare reason */ }
          resolve({ status, reason });
        });
      });
      // The session is left open, as a client that holds a place would: the server closes it at the end of the test.
      request.on('upgrade', (response) => resolve({ status: response.statusCode ?? 0 }));
      request.on('error', reject);
    });

  const closeAndWait = (client: TestClient) => new Promise<void>((resolve) => {
    client.once('disconnect', () => resolve());
    client.disconnect();
  });

  const byAddress: AddressOf = (req) => req.headers[ADDRESS_HEADER] as string | undefined;

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
    expect((await attempt(url, { address: 'c' })).result).toBe('refused');

    await closeAndWait(first.client);
    await vi.waitFor(async () => expect((await attempt(url, { address: 'd' })).result).toBe('connected'));
  });

  it('refuses connections over the limit of one address and leaves the other addresses alone', async () => {
    connectionLimit.maxPerAddress = 2;
    const { url } = await start(byAddress);

    await attempt(url, { address: 'a' });
    await attempt(url, { address: 'a' });

    expect((await attempt(url, { address: 'a' })).result).toBe('refused');
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

    expect((await attempt(url, { address: 'a' })).result).toBe('refused');
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
    const { client, result } = await attempt(url, {}, { playerId: 'p'.repeat(MAX_PLAYER_ID_LENGTH) });
    expect(result).toBe('connected');
    const started = new Promise<string>((resolve) => { client.once('lobby-updated', () => resolve('started')); });
    const closed = new Promise<string>((resolve) => { client.once('disconnect', () => resolve('closed')); });

    client.emit('join-room', crypto.randomUUID());

    await expect(Promise.race([started, closed])).resolves.toBe('started');
  });
  describe.each<Transport>(['polling', 'websocket'])('origin, on %s', (transport) => {
    it('lets the allowed origin in', async () => {
      const { url } = await start(byAddress);

      expect((await attempt(url, {}, {}, [transport])).result).toBe('connected');
    });

    it.each<[string, string | null]>([
      ['another site', 'https://evil.example.com'],
      ['the right host on another scheme', 'http://games.example.com'],
      ['the right host on another port', `${ORIGIN}:8443`],
      ['a longer name that starts the same', `${ORIGIN}.evil.example.com`],
      ['the origin with a final slash', `${ORIGIN}/`],
      ['an opaque origin', 'null'],
      ['no origin at all', null],
    ])('refuses %s', async (_name, origin) => {
      const { url, guard } = await start(byAddress);

      const refusal = await openSession(url, { origin }, transport);
      expect(refusal.status).toBeGreaterThanOrEqual(400);
      expect(refusal.reason).toBe('origin-not-allowed');
      expect((await attempt(url, { origin }, {}, [transport])).result).toBe('refused');
      expect(guard.stats()).toEqual({ total: 0, addresses: 0 });
    });

    it('checks the origin also when the limits per address are off', async () => {
      const { url } = await start();

      expect((await openSession(url, { origin: 'https://evil.example.com' }, transport)).reason).toBe('origin-not-allowed');
      expect((await attempt(url, {}, {}, [transport])).result).toBe('connected');
    });

    it('does not count a refused origin against the address it came from', async () => {
      connectionLimit.newPerAddress = { max: 1, windowMs: 60_000 };
      const { url } = await start(byAddress);

      await openSession(url, { address: 'a', origin: 'https://evil.example.com' }, transport);

      expect((await attempt(url, { address: 'a' }, {}, [transport])).result).toBe('connected');
    });
  });

  describe.each<Transport>(['polling', 'websocket'])('sessions that never send a Socket.IO CONNECT, on %s', (transport) => {
    const opened = transport === 'polling' ? 200 : 101;

    it('counts them in the limit of the whole server', async () => {
      connectionLimit.maxTotal = 2;
      const { url, guard } = await start(byAddress);
      const connected = vi.fn();
      io!.on('connection', connected);

      expect((await openSession(url, { address: 'a' }, transport)).status).toBe(opened);
      expect((await openSession(url, { address: 'b' }, transport)).status).toBe(opened);
      await vi.waitFor(() => expect(guard.stats().total).toBe(2));

      expect((await openSession(url, { address: 'c' }, transport)).reason).toBe('too-many-connections');
      expect((await attempt(url, { address: 'd' }, {}, [transport])).result).toBe('refused');
      // Nothing got as far as Socket.IO: the limit was applied on the sessions alone.
      expect(connected).not.toHaveBeenCalled();
    });

    it('counts them in the limit of one address', async () => {
      connectionLimit.maxPerAddress = 2;
      const { url, guard } = await start(byAddress);

      await openSession(url, { address: 'a' }, transport);
      await openSession(url, { address: 'a' }, transport);
      await vi.waitFor(() => expect(guard.stats().total).toBe(2));

      expect((await openSession(url, { address: 'a' }, transport)).reason).toBe('too-many-connections');
      expect((await openSession(url, { address: 'b' }, transport)).status).toBe(opened);
    });

    it('counts them in the new connections of one address', async () => {
      connectionLimit.newPerAddress = { max: 2, windowMs: 60_000 };
      const { url } = await start(byAddress);

      await openSession(url, { address: 'a' }, transport);
      await openSession(url, { address: 'a' }, transport);

      expect((await openSession(url, { address: 'a' }, transport)).reason).toBe('too-many-connections');
      expect((await openSession(url, { address: 'b' }, transport)).status).toBe(opened);
    });
  });

  it('counts a connection once, also after it has joined', async () => {
    const { url, guard } = await start(byAddress);

    const { client } = await attempt(url, { address: 'a' });
    // The upgrade from polling to WebSocket is the same session, not a second one.
    if (client.io.engine.transport.name !== 'websocket') await new Promise<void>((resolve) => { client.io.engine.once('upgrade', () => resolve()); });
    expect(guard.stats()).toEqual({ total: 1, addresses: 1 });

    await closeAndWait(client);
    await vi.waitFor(() => expect(guard.stats()).toEqual({ total: 0, addresses: 0 }));
  });

  describe('addresses in the same network', () => {
    const fromEnv = () => start(addressResolverFromEnv({ CLIENT_IP_HEADER: ADDRESS_HEADER }));

    it('gives one allowance to the IPv6 addresses of one /64, and another to the next /64', async () => {
      connectionLimit.maxPerAddress = 2;
      const { url, guard } = await fromEnv();

      expect((await attempt(url, { address: '2001:db8:1:2::1' })).result).toBe('connected');
      expect((await attempt(url, { address: '2001:db8:1:2:aaaa:bbbb:cccc:dddd' })).result).toBe('connected');
      expect(guard.stats()).toEqual({ total: 2, addresses: 1 });

      expect((await attempt(url, { address: '2001:0db8:0001:0002:ffff:ffff:ffff:ffff' })).result).toBe('refused');
      expect((await attempt(url, { address: '2001:db8:1:3::1' })).result).toBe('connected');
      expect(guard.stats()).toEqual({ total: 3, addresses: 2 });
    });

    it('does not start over on the new connections when the address changes inside the /64', async () => {
      connectionLimit.newPerAddress = { max: 2, windowMs: 60_000 };
      const { url } = await fromEnv();

      for (const address of ['2001:db8:1:2::1', '2001:db8:1:2::2']) {
        const { client, result } = await attempt(url, { address });
        expect(result).toBe('connected');
        await closeAndWait(client);
      }

      expect((await attempt(url, { address: '2001:db8:1:2::3' })).result).toBe('refused');
      expect((await attempt(url, { address: '2001:db8:1:3::3' })).result).toBe('connected');
    });

    it('leaves the /64 in the address the budgets of the rooms follow', async () => {
      const { url } = await fromEnv();
      const kept: (string | undefined)[] = [];
      io!.on('connection', (socket) => { kept.push((socket.data as { address?: string }).address); });

      await attempt(url, { address: '2001:db8:1:2::1' });
      await attempt(url, { address: '2001:db8:1:2:9:9:9:9' });
      await attempt(url, { address: '::ffff:203.0.113.9' });

      expect(kept).toEqual(['2001:db8:1:2::/64', '2001:db8:1:2::/64', '203.0.113.9']);
    });
  });
});

describe('normaliseAddress', () => {
  it.each(['203.0.113.9', '127.0.0.1', '0.0.0.0'])('leaves the IPv4 %s as it is', (address) => {
    expect(normaliseAddress(address)).toBe(address);
  });

  it.each([
    ['2001:db8:1:2::1', '2001:db8:1:2::/64'],
    ['2001:db8:1:2:ffff:ffff:ffff:ffff', '2001:db8:1:2::/64'],
    ['2001:0DB8:0001:0002:0000:0000:0000:0001', '2001:db8:1:2::/64'],
    ['2001:db8:1:3::1', '2001:db8:1:3::/64'],
    ['2001:db8::1', '2001:db8:0:0::/64'],
    ['2001:db8:1::', '2001:db8:1:0::/64'],
    ['::1', '0:0:0:0::/64'],
    ['::', '0:0:0:0::/64'],
    ['1::', '1:0:0:0::/64'],
    ['1:2:3:4:5:6:7::', '1:2:3:4::/64'],
    ['::2:3:4:5:6:7:8', '0:2:3:4::/64'],
    ['fe80::1%eth0', 'fe80:0:0:0::/64'],
    ['fe80::1%25en0', 'fe80:0:0:0::/64'],
    ['64:ff9b::203.0.113.9', '64:ff9b:0:0::/64'],
  ])('reduces the IPv6 %s to its /64, %s', (address, key) => {
    expect(normaliseAddress(address)).toBe(key);
  });

  it.each([
    ['::ffff:203.0.113.9', '203.0.113.9'],
    ['::FFFF:203.0.113.9', '203.0.113.9'],
    ['::ffff:cb00:7109', '203.0.113.9'],
    ['0:0:0:0:0:ffff:203.0.113.9', '203.0.113.9'],
    ['::ffff:127.0.0.1', '127.0.0.1'],
  ])('reads the IPv4 inside %s', (address, key) => {
    expect(normaliseAddress(address)).toBe(key);
  });

  it('gives the same key to an IPv4 however it is written', () => {
    expect(normaliseAddress('::ffff:203.0.113.9')).toBe(normaliseAddress('203.0.113.9'));
  });

  it.each([undefined, '', 'unknown', 'localhost', '203.0.113', '203.0.113.9.1', '256.0.0.1', '203.0.113.9:443', '[2001:db8::1]', '2001:db8::1::2', '1:2:3:4:5:6:7:8:9', 'g::1', '%eth0', '2001:db8:1:2::/64'])('has no key for %j', (value) => {
    expect(normaliseAddress(value)).toBeUndefined();
  });
});

describe('addressResolverFromEnv', () => {
  const socketWith = (headers: Record<string, string | string[]>, remoteAddress: string | undefined = '10.0.0.1') =>
    ({ headers, socket: { remoteAddress } }) as unknown as IncomingMessage;

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

  it.each<Record<string, string>>([{ 'x-forwarded-for': 'not-an-address' }, { 'x-forwarded-for': '203.0.113.9:443' }, { 'x-forwarded-for': '2001:db8::1::2' }])('falls back to the address of the connection when the header is not an address (%j)', (headers) => {
    expect(addressResolverFromEnv({ CLIENT_IP_HEADER: 'x-forwarded-for' })!(socketWith(headers, '10.0.0.1'))).toBe('10.0.0.1');
  });

  it('gives the key of the address, from the header and from the connection', () => {
    const fromHeader = addressResolverFromEnv({ CLIENT_IP_HEADER: 'x-real-ip' })!;
    const fromPeer = addressResolverFromEnv({ LIMIT_BY_PEER_ADDRESS: 'true' })!;

    expect(fromHeader(socketWith({ 'x-real-ip': '2001:db8:1:2::1' }))).toBe('2001:db8:1:2::/64');
    expect(fromHeader(socketWith({ 'x-real-ip': '2001:db8:1:2::2' }))).toBe('2001:db8:1:2::/64');
    expect(fromHeader(socketWith({ 'x-real-ip': '2001:db8:1:3::1' }))).toBe('2001:db8:1:3::/64');
    expect(fromHeader(socketWith({ 'x-real-ip': '::ffff:203.0.113.9' }))).toBe('203.0.113.9');
    expect(fromHeader(socketWith({}, '::ffff:10.0.0.1'))).toBe('10.0.0.1');
    expect(fromPeer(socketWith({}, '::ffff:127.0.0.1'))).toBe('127.0.0.1');
    expect(fromPeer(socketWith({}, 'fe80::1%eth0'))).toBe('fe80:0:0:0::/64');
  });

  it('keeps what the connection reports when it is not an address, and nothing when there is nothing', () => {
    const resolve = addressResolverFromEnv({ CLIENT_IP_HEADER: 'x-real-ip' })!;

    expect(resolve(socketWith({ 'x-real-ip': 'nonsense' }, 'something-else'))).toBe('something-else');
    expect(resolve({ headers: {}, socket: {} } as unknown as IncomingMessage)).toBeUndefined();
  });
});
