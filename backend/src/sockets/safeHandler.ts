import type { z } from "zod";

/**
 * Wraps a Socket.IO event handler with the guarantees every handler needs.
 *
 * 1. The whole argument list is validated against `schema` before the handler
 *    runs. Whatever a client sends is `unknown` until it has been parsed, because
 *    TypeScript types do not exist at runtime. Invalid input is dropped silently.
 * 2. An exception thrown by the handler is caught and logged. Socket.IO invokes
 *    handlers as plain EventEmitter listeners: an exception that escapes one is
 *    an uncaught exception and terminates the whole Node process (and with it
 *    every room held in memory).
 *
 * `isAllowed` is an optional rate limit: when it says no, the event is dropped.
 */
export function safeHandler<Args extends unknown[]>(
  schema: z.ZodType<Args>,
  handler: (...args: Args) => void,
  isAllowed: () => boolean = () => true,
): (...args: unknown[]) => void {
  return (...args: unknown[]): void => {
    // Checked before parsing: a flood of invalid payloads must not cost anything either.
    if (!isAllowed()) return;

    const parsed = schema.safeParse(args);
    if (!parsed.success) return;

    try {
      handler(...parsed.data);
    } catch (error) {
      console.error("[socket] handler failed:", error);
    }
  };
}
