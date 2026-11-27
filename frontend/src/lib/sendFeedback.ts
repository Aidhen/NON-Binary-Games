import type { FeedbackArgs } from '@nbg/shared';
import { backendUrl } from './backendUrl';

export type FeedbackOutcome = 'sent' | 'too-many' | 'day-full' | 'unavailable';

/** A sleeping free-tier server needs about a minute to wake up: the wait is allowed to be that long, and no longer. */
export const FEEDBACK_TIMEOUT_MS = 90_000;

/** How long the answer can take before the page says that the server is waking up (the same wait as the rooms, see WAKING_AFTER_MS). */
export const FEEDBACK_WAKING_AFTER_MS = 5000;

/**
 * Sends the answers of the form to the backend. Whatever the reason it did not arrive (an error status, a server that
 * does not answer, no network) the page only needs to know whether to say "too many" (from this address, or for today on
 * the whole site) or "try again": `unavailable`.
 * `signal` lets the page stop waiting when it is left.
 */
export const sendFeedback = async (report: FeedbackArgs, signal?: AbortSignal): Promise<FeedbackOutcome> => {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), FEEDBACK_TIMEOUT_MS);
  signal?.addEventListener('abort', () => timeout.abort(), { once: true });

  try {
    const response = await fetch(`${backendUrl()}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
      // Nothing of the player travels with it: no cookies, no referrer.
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: timeout.signal,
    });
    if (response.ok) return 'sent';
    if (response.status !== 429) return 'unavailable';
    // The server says which limit it was: a body that cannot be read is taken as the limit of the address.
    const answer: unknown = await response.json().catch(() => undefined);
    return (answer as { error?: unknown } | undefined)?.error === 'day-full' ? 'day-full' : 'too-many';
  } catch {
    return 'unavailable';
  } finally {
    clearTimeout(timer);
  }
};
