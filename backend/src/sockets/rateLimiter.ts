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
