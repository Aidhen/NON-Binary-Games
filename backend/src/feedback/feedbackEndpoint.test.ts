import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { request } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import Client from 'socket.io-client';
import { createFeedbackHandler, feedbackLimit, MAX_FEEDBACK_BYTES } from './feedbackEndpoint';
import type { FeedbackTracker, FilingResult } from './githubTracker';
import { createHttpServer } from '../server';
import type { AddressOf } from '../sockets/connectionLimits';

const ORIGIN = 'https://games.example.com';
const ADDRESS = '203.0.113.9';

const bug = { kind: 'bug', where: 'takuzu', what: 'looks-wrong', device: 'tablet', frequency: 'always' };
const opinion = { kind: 'opinion', where: 'table', rating: 2, wishes: ['more-levels'], emote: '🤔' };

// Read before any test changes them.
const defaults = structuredClone(feedbackLimit);

describe('POST /feedback', () => {
  let server: HttpServer | undefined;
  let clock = 0;
  let result: FilingResult | Error = 'filed';
  const file = vi.fn(async () => { if (result instanceof Error) throw result; return result; });
  const alert = vi.fn();
  const tracker: FeedbackTracker = { file, alert };

  const start = async (options: { tracker?: FeedbackTracker | null; addressOf?: AddressOf } = {}): Promise<string> => {
    const handler = createFeedbackHandler(ORIGIN, 'addressOf' in options ? options.addressOf : () => ADDRESS, options.tracker === null ? undefined : (options.tracker ?? tracker), () => clock);
    server = createHttpServer(handler);
    await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve));
    return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  };

  const post = (url: string, body: unknown, headers: Record<string, string> = {}) =>
    fetch(`${url}/feedback`, { method: 'POST', headers: { 'Origin': ORIGIN, 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });

  beforeEach(() => {
    clock = 0;
    result = 'filed';
    file.mockClear();
    alert.mockClear();
    Object.assign(feedbackLimit.perAddress, defaults.perAddress);
    Object.assign(feedbackLimit, { bugsPerDay: defaults.bugsPerDay, reportsPerDay: defaults.reportsPerDay, bodyTimeoutMs: defaults.bodyTimeoutMs });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    server?.closeAllConnections();
    await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()));
    server = undefined;
  });

  it('files a valid report and answers 204, with the headers the browser needs to read it', async () => {
    const response = await post(await start(), bug);

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    expect(response.headers.get('access-control-allow-credentials')).toBeNull();
    expect(file).toHaveBeenCalledExactlyOnceWith(bug);
  });

  it('answers the preflight for the frontend only: POST, Content-Type, no credentials', async () => {
    const url = await start();
    const response = await fetch(`${url}/feedback`, { method: 'OPTIONS', headers: { 'Origin': ORIGIN, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } });

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    expect(response.headers.get('access-control-allow-methods')).toBe('POST');
    expect(response.headers.get('access-control-allow-headers')).toBe('Content-Type');
    expect(response.headers.get('access-control-allow-credentials')).toBeNull();
    expect(file).not.toHaveBeenCalled();
  });

  it.each([
    ['another origin', { Origin: 'https://evil.example.com' }],
    ['the same host on another scheme', { Origin: 'http://games.example.com' }],
    ['no origin, like a script', { Origin: '' }],
  ])('refuses %s with 403, without allowing it to read the answer', async (_name, headers) => {
    const url = await start();
    const post403 = await post(url, bug, headers);
    const preflight = await fetch(`${url}/feedback`, { method: 'OPTIONS', headers });

    for (const response of [post403, preflight]) {
      expect(response.status).toBe(403);
      expect(response.headers.get('access-control-allow-origin')).toBeNull();
    }
    expect(file).not.toHaveBeenCalled();
  });

  it.each(['text/plain', 'application/x-www-form-urlencoded', ''])('refuses the content type "%s" with 400', async (type) => {
    const response = await post(await start(), JSON.stringify(bug), { 'Content-Type': type });

    expect(response.status).toBe(400);
    expect(file).not.toHaveBeenCalled();
  });

  it('accepts the content type with a charset', async () => {
    expect((await post(await start(), bug, { 'Content-Type': 'application/json; charset=utf-8' })).status).toBe(204);
  });

  it('refuses a body that says it is too big, without reading it', async () => {
    const response = await post(await start(), JSON.stringify({ ...bug, padding: 'x'.repeat(MAX_FEEDBACK_BYTES) }));

    expect(response.status).toBe(413);
    expect(file).not.toHaveBeenCalled();
  });

  it('stops reading a body that grows past the bound without saying so', async () => {
    const url = new URL(await start());
    const status = await new Promise<number>((resolve, reject) => {
      const req = request({ host: url.hostname, port: url.port, path: '/feedback', method: 'POST', headers: { 'Origin': ORIGIN, 'Content-Type': 'application/json', 'Transfer-Encoding': 'chunked' } }, (res) => { res.resume(); resolve(res.statusCode!); });
      req.on('error', (error) => { if ((error as NodeJS.ErrnoException).code !== 'ECONNRESET') reject(error); });
      req.write('{"kind":"bug","padding":"');
      req.write('x'.repeat(MAX_FEEDBACK_BYTES));
    });

    expect(status).toBe(413);
    expect(file).not.toHaveBeenCalled();
  });

  it('gives up on a body that never ends', async () => {
    feedbackLimit.bodyTimeoutMs = 50;
    const url = new URL(await start());
    const status = new Promise<number>((resolve) => {
      const req = request({ host: url.hostname, port: url.port, path: '/feedback', method: 'POST', headers: { 'Origin': ORIGIN, 'Content-Type': 'application/json', 'Transfer-Encoding': 'chunked' } }, (res) => { res.resume(); resolve(res.statusCode!); });
      req.on('error', () => undefined);
      req.write('{"kind":');
    });

    expect(await status).toBe(400);
    expect(file).not.toHaveBeenCalled();
  });

  it.each([
    ['text that is not JSON', 'not json'],
    ['an empty body', ''],
    ['a list', '[]'],
    ['a value out of its list', JSON.stringify({ ...bug, where: 'moon' })],
    ['a field that is not in the list', JSON.stringify({ ...bug, contact: 'a@b.c' })],
    ['a rating out of range', JSON.stringify({ ...opinion, rating: 9 })],
  ])('refuses %s with 400 and a body that says nothing of the request', async (_name, body) => {
    const response = await post(await start(), body);

    expect(response.status).toBe(400);
    expect(await response.text()).toBe('{"error":"invalid"}');
    expect(file).not.toHaveBeenCalled();
  });

  it('allows three reports per address in ten minutes, then 429, and starts again afterwards', async () => {
    const url = await start();

    for (let sent = 0; sent < feedbackLimit.perAddress.max; sent++) expect((await post(url, opinion)).status).toBe(204);
    expect((await post(url, opinion)).status).toBe(429);
    expect(file).toHaveBeenCalledTimes(feedbackLimit.perAddress.max);

    clock += feedbackLimit.perAddress.windowMs;
    expect((await post(url, opinion)).status).toBe(204);
  });

  it('does not spend the allowance of an address on requests that were refused', async () => {
    const url = await start();

    for (let sent = 0; sent < 5; sent++) await post(url, { ...bug, where: 'moon' });
    await post(url, 'garbage');

    for (let sent = 0; sent < feedbackLimit.perAddress.max; sent++) expect((await post(url, opinion)).status).toBe(204);
  });

  it('says "day-full" when the total of the day is reached', async () => {
    feedbackLimit.reportsPerDay = 1;
    const url = await start();

    await post(url, opinion);
    const response = await post(url, opinion);

    expect(response.status).toBe(429);
    expect(await response.text()).toBe('{"error":"day-full"}');
  });

  it('alerts the owner once a day when a daily total is reached, not once per refused report', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    feedbackLimit.perAddress.max = 100;
    feedbackLimit.bugsPerDay = 1;
    const url = await start();

    await post(url, bug);
    for (let refused = 0; refused < 3; refused++) await post(url, bug);
    expect(alert).toHaveBeenCalledExactlyOnceWith('bugs');

    clock += feedbackLimit.dayMs;
    await post(url, bug);
    await post(url, bug);
    expect(alert).toHaveBeenCalledTimes(2);
  });

  it('says "too-many" when the address is over its limit, and marks the answers as JSON only', async () => {
    const url = await start();

    for (let sent = 0; sent < feedbackLimit.perAddress.max; sent++) await post(url, opinion);
    const response = await post(url, opinion);

    expect(await response.text()).toBe('{"error":"too-many"}');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('counts each address on its own', async () => {
    let address = 'a';
    const url = await start({ addressOf: () => address });

    for (let sent = 0; sent < feedbackLimit.perAddress.max; sent++) await post(url, opinion);
    expect((await post(url, opinion)).status).toBe(429);

    address = 'b';
    expect((await post(url, opinion)).status).toBe(204);
  });

  it('has no limit per address where the address is not known, and the daily totals still apply', async () => {
    feedbackLimit.reportsPerDay = 5;
    const url = await start({ addressOf: undefined });

    for (let sent = 0; sent < 5; sent++) expect((await post(url, opinion)).status).toBe(204);
    expect((await post(url, opinion)).status).toBe(429);
  });

  it('stops bug reports at their daily total and still takes opinions, then starts again the next day', async () => {
    feedbackLimit.perAddress.max = 100;
    feedbackLimit.bugsPerDay = 2;
    const url = await start();

    expect((await post(url, bug)).status).toBe(204);
    expect((await post(url, bug)).status).toBe(204);
    expect((await post(url, bug)).status).toBe(429);
    expect((await post(url, opinion)).status).toBe(204);

    clock += feedbackLimit.dayMs;
    expect((await post(url, bug)).status).toBe(204);
  });

  it('stops everything at the daily total of reports of any kind', async () => {
    feedbackLimit.perAddress.max = 100;
    feedbackLimit.reportsPerDay = 3;
    feedbackLimit.bugsPerDay = 3;
    const url = await start();

    for (const body of [bug, opinion, bug]) expect((await post(url, body)).status).toBe(204);
    expect((await post(url, opinion)).status).toBe(429);
    expect((await post(url, bug)).status).toBe(429);
    expect(file).toHaveBeenCalledTimes(3);
  });

  it('does not spend the day on requests that were refused', async () => {
    feedbackLimit.perAddress.max = 100;
    feedbackLimit.reportsPerDay = 1;
    const url = await start();

    await post(url, { ...bug, where: 'moon' });
    await post(url, bug, { Origin: 'https://evil.example.com' });

    expect((await post(url, opinion)).status).toBe(204);
  });

  it('answers 503 when it is not configured, still answers the preflight', async () => {
    const url = await start({ tracker: null });

    expect((await post(url, bug)).status).toBe(503);
    expect((await fetch(`${url}/feedback`, { method: 'OPTIONS', headers: { Origin: ORIGIN } })).status).toBe(204);
  });

  it.each(['failed', 'busy'] as const)('answers 503 when the tracker says %s, and gives the day back', async (outcome) => {
    feedbackLimit.perAddress.max = 100;
    feedbackLimit.bugsPerDay = 1;
    const url = await start();
    result = outcome;

    expect((await post(url, bug)).status).toBe(503);

    result = 'filed';
    expect((await post(url, bug)).status).toBe(204);
  });

  it('answers 503 and keeps running when the tracker throws', async () => {
    const url = await start();
    result = new Error('boom');

    const response = await post(url, bug);

    expect(response.status).toBe(503);
    expect((await fetch(`${url}/healthz`)).status).toBe(200);
  });

  it('keeps the address and the report out of the log', async () => {
    const spies = (['info', 'warn', 'error'] as const).map((level) => vi.spyOn(console, level).mockImplementation(() => undefined));
    const url = await start();

    await post(url, bug);
    result = 'failed';
    await post(url, opinion);
    await post(url, 'garbage');
    await post(url, bug, { Origin: 'https://evil.example.com' });
    for (let sent = 0; sent < 3; sent++) await post(url, opinion);

    const logged = JSON.stringify(spies.flatMap((spy) => spy.mock.calls));
    expect(logged).not.toContain(ADDRESS);
    expect(logged).not.toContain('takuzu');
    expect(logged).not.toContain('garbage');
  });

  it.each(['GET', 'PUT', 'DELETE'])('answers 404 to %s', async (method) => {
    const response = await fetch(`${await start()}/feedback`, { method, headers: { Origin: ORIGIN } });

    expect(response.status).toBe(404);
  });

  it('leaves /healthz, the 404 and Socket.IO as they were', async () => {
    const url = await start();
    const io = new Server(server!, { cors: { origin: ORIGIN } });
    const client = Client(url, { extraHeaders: { Origin: ORIGIN }, transports: ['polling'], reconnection: false });

    try {
      await new Promise<void>((resolve, reject) => { client.on('connect', resolve); client.on('connect_error', reject); });
      expect(client.connected).toBe(true);
      expect((await fetch(`${url}/healthz`)).status).toBe(200);
      expect((await fetch(`${url}/nothing`)).status).toBe(404);
      expect((await post(url, bug)).status).toBe(204);
    } finally {
      client.close();
      await io.close();
      server = undefined;
    }
  });
});
