import { afterEach, describe, expect, it, vi } from 'vitest';
import { FEEDBACK_TIMEOUT_MS, sendFeedback } from './sendFeedback';

const report = { kind: 'bug', where: 'sudoku', what: 'not-loading', device: 'phone', frequency: 'once' } as const;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('sendFeedback', () => {
  it('posts the answers as JSON to the backend, without cookies or referrer', async () => {
    vi.stubEnv('NEXT_PUBLIC_SOCKET_URL', 'https://api.example.com');
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await sendFeedback(report)).toBe('sent');

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/feedback', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    }));
  });

  it('uses the local backend by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await sendFeedback(report);

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:4000/feedback');
  });

  it.each([
    [429, 'too-many'],
    [503, 'unavailable'],
    [400, 'unavailable'],
    [403, 'unavailable'],
    [413, 'unavailable'],
  ])('turns a %i into "%s"', async (status, outcome) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status })));

    expect(await sendFeedback(report)).toBe(outcome);
  });

  it('tells the total of the day from the limit of the address', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"error":"day-full"}', { status: 429 })));
    expect(await sendFeedback(report)).toBe('day-full');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"error":"too-many"}', { status: 429 })));
    expect(await sendFeedback(report)).toBe('too-many');
  });

  it('turns a network failure into "unavailable"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    expect(await sendFeedback(report)).toBe('unavailable');
  });

  it('stops waiting after the timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal!.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    })));

    const outcome = sendFeedback(report);
    await vi.advanceTimersByTimeAsync(FEEDBACK_TIMEOUT_MS);

    expect(await outcome).toBe('unavailable');
  });

  it('stops waiting when the page says so', async () => {
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal!.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    })));
    const page = new AbortController();

    const outcome = sendFeedback(report, page.signal);
    page.abort();

    expect(await outcome).toBe('unavailable');
  });
});
