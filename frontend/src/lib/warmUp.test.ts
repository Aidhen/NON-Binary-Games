import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();

describe('warmUpServer', () => {
  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(undefined);
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('sends a background no-cors request to /healthz', async () => {
    const { warmUpServer } = await import('./warmUp');

    warmUpServer();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:4000/healthz', { mode: 'no-cors', cache: 'no-store' });
  });

  it('uses NEXT_PUBLIC_SOCKET_URL when it is set', async () => {
    vi.stubEnv('NEXT_PUBLIC_SOCKET_URL', 'https://api.example.com');
    const { warmUpServer } = await import('./warmUp');

    warmUpServer();

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/healthz', expect.anything());
  });

  it('only warms up once per page load', async () => {
    const { warmUpServer } = await import('./warmUp');

    warmUpServer();
    warmUpServer();
    warmUpServer();

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('ignores network errors', async () => {
    fetchMock.mockReturnValue(Promise.reject(new Error('offline')));
    const { warmUpServer } = await import('./warmUp');

    expect(() => warmUpServer()).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});
