/**
 * Fixed-window rate limit: at most `limit` calls every `windowMs`.
 * Returns a function that says whether the current call is allowed.
 */
export const createRateLimiter = (limit: number, windowMs: number, now: () => number = Date.now) => {
  let windowStart = now();
  let count = 0;

  return (): boolean => {
    const current = now();

    if (current - windowStart >= windowMs) {
      windowStart = current;
      count = 0;
    }

    count++;
    return count <= limit;
  };
};

/**
 * Like `createRateLimiter`, with one window per key (an address, for example), so that the
 * limit follows whoever it is for and not one connection: reconnecting does not start over.
 *
 * The windows are kept in memory only. Windows that are over are dropped when the map is full, and
 * if it is still full after that the oldest one is forgotten: the memory it uses has a bound. Refusing
 * the new key instead would let one client lock everybody else out just by inventing keys.
 */
export const createKeyedRateLimiter = (limit: number, windowMs: number, now: () => number = Date.now, maxKeys = 10_000) => {
  const windows = new Map<string, { start: number; count: number }>();

  const dropFinished = (current: number) => {
    for (const [key, window] of windows) {
      if (current - window.start >= windowMs) windows.delete(key);
    }
  };

  return (key: string): boolean => {
    const current = now();
    let window = windows.get(key);

    if (window && current - window.start >= windowMs) {
      windows.delete(key);
      window = undefined;
    }

    if (!window) {
      if (windows.size >= maxKeys) dropFinished(current);
      if (windows.size >= maxKeys) windows.delete(windows.keys().next().value as string);

      window = { start: current, count: 0 };
      windows.set(key, window);
    }

    window.count++;
    return window.count <= limit;
  };
};
