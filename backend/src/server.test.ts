import { describe, it, expect, afterEach, vi } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server as HttpServer } from 'node:http';
import type { Server } from 'socket.io';
import { createHttpServer, DEFAULT_PORT, parsePort, shutdown, SHUTDOWN_TIMEOUT_MS } from './server';

describe('parsePort', () => {
  it('uses the PORT value when it is a valid port', () => {
    expect(parsePort('10000')).toBe(10000);
  });

  it.each([undefined, '', 'abc', '0', '-1', '70000', '80.5'])('falls back to the default for %s', (value) => {
    expect(parsePort(value)).toBe(DEFAULT_PORT);
  });
});

describe('createHttpServer', () => {
  let server: HttpServer | undefined;

  const start = async (): Promise<string> => {
    server = createHttpServer();
    await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve));
    return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  };

  afterEach(async () => {
    await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()));
    server = undefined;
  });

  it('answers the health check', async () => {
    const response = await fetch(`${await start()}/healthz`);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
  });

  it('shows the headers of the request that may carry the address of the caller', async () => {
    const response = await fetch(`${await start()}/ip-header-check`, { headers: { 'x-forwarded-for': '1.2.3.4' } });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      'x-forwarded-for': '1.2.3.4',
      'x-real-ip': null,
      'true-client-ip': null,
      'cf-connecting-ip': null,
      forwarded: null,
      'x-forwarded-proto': null,
    });
  });

  it('answers 404 to anything else', async () => {
    const response = await fetch(`${await start()}/nothing`);

    expect(response.status).toBe(404);
  });
});

describe('shutdown', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('exits with 0 once the server is closed', () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const exit = vi.fn();
    const io = { close: vi.fn((callback: () => void) => callback()) } as unknown as Server;

    shutdown(io, 'SIGTERM', exit);

    expect(io.close).toHaveBeenCalledOnce();
    expect(exit).toHaveBeenCalledExactlyOnceWith(0);
  });

  it('forces the exit if the server never closes', () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exit = vi.fn();
    const io = { close: vi.fn() } as unknown as Server;

    shutdown(io, 'SIGTERM', exit);
    expect(exit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(SHUTDOWN_TIMEOUT_MS);

    expect(exit).toHaveBeenCalledExactlyOnceWith(1);
  });
});
