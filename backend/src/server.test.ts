import { describe, it, expect, afterEach, vi } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server as HttpServer } from 'node:http';
import type { Server } from 'socket.io';
import { createHttpServer, DEFAULT_FRONTEND_URL, DEFAULT_PORT, installCrashLogging, parsePort, resolveAllowedOrigin, shutdown, SHUTDOWN_TIMEOUT_MS } from './server';
import { logger } from './logger';

describe('parsePort', () => {
  it('uses the PORT value when it is a valid port', () => {
    expect(parsePort('10000')).toBe(10000);
  });

  it.each([undefined, '', 'abc', '0', '-1', '70000', '80.5'])('falls back to the default for %s', (value) => {
    expect(parsePort(value)).toBe(DEFAULT_PORT);
  });
});

describe('resolveAllowedOrigin', () => {
  it('uses FRONTEND_URL when it is set', () => {
    expect(resolveAllowedOrigin({ FRONTEND_URL: 'https://games.example.com' })).toBe('https://games.example.com');
    expect(resolveAllowedOrigin({ FRONTEND_URL: 'https://games.example.com', NODE_ENV: 'production' })).toBe('https://games.example.com');
  });

  it('falls back to the local frontend when developing', () => {
    expect(resolveAllowedOrigin({})).toBe(DEFAULT_FRONTEND_URL);
    expect(resolveAllowedOrigin({ NODE_ENV: 'development' })).toBe(DEFAULT_FRONTEND_URL);
  });

  it.each([undefined, '', '   '])('has no origin in production when FRONTEND_URL is %j', (value) => {
    expect(resolveAllowedOrigin({ NODE_ENV: 'production', FRONTEND_URL: value })).toBeUndefined();
  });

  it('counts a Render service as production even when NODE_ENV is not set', () => {
    expect(resolveAllowedOrigin({ RENDER: 'true' })).toBeUndefined();
    expect(resolveAllowedOrigin({ RENDER: 'true', FRONTEND_URL: 'https://games.example.com' })).toBe('https://games.example.com');
  });

  it.each([
    ['https://games.example.com/', 'https://games.example.com'],
    ['https://games.example.com/play/x?y=1#z', 'https://games.example.com'],
    ['  http://localhost:3000/  ', 'http://localhost:3000'],
    ['HTTPS://Games.Example.com', 'https://games.example.com'],
  ])('reduces %j to the origin a browser sends, %j', (value, origin) => {
    expect(resolveAllowedOrigin({ FRONTEND_URL: value })).toBe(origin);
  });

  it.each(['games.example.com', 'localhost:3000', 'not a url', 'ftp://games.example.com', 'javascript:alert(1)'])(
    'refuses FRONTEND_URL %j, in development as well: it would match no browser',
    (value) => {
      expect(resolveAllowedOrigin({ FRONTEND_URL: value })).toBeUndefined();
      expect(resolveAllowedOrigin({ FRONTEND_URL: value, NODE_ENV: 'production' })).toBeUndefined();
    },
  );
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

describe('installCrashLogging', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('logs an uncaught exception and then exits with 1, as Node does without a handler', () => {
    const logged = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    const handlers: Record<string, (error: Error) => void> = {};
    const proc = { on: vi.fn((event: string, handler: (error: Error) => void) => { handlers[event] = handler; }) } as unknown as NodeJS.Process;
    const exit = vi.fn();
    const error = new Error('boom');

    installCrashLogging(proc, exit);
    handlers.uncaughtException(error);

    expect(logged).toHaveBeenCalledWith('Uncaught exception, shutting down', error);
    expect(exit).toHaveBeenCalledExactlyOnceWith(1);
    expect(logged.mock.invocationCallOrder[0]).toBeLessThan(exit.mock.invocationCallOrder[0]);
  });
});
