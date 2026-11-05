import { describe, it, expect, vi, afterEach } from 'vitest';
import { z } from 'zod';
import { safeHandler } from './safeHandler';

describe('safeHandler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const schema = z.tuple([z.object({ n: z.number().int() })]);

  it('calls the handler with the parsed arguments', () => {
    const handler = vi.fn();

    safeHandler(schema, handler)({ n: 3 });

    expect(handler).toHaveBeenCalledExactlyOnceWith({ n: 3 });
  });

  it('drops invalid input without calling the handler or throwing', () => {
    const handler = vi.fn();
    const wrapped = safeHandler(schema, handler);

    expect(() => {
      wrapped();
      wrapped(undefined);
      wrapped(null);
      wrapped('text');
      wrapped({ n: 'x' });
      wrapped({ n: 1.5 });
      wrapped({ n: 1 }, 'extra');
    }).not.toThrow();

    expect(handler).not.toHaveBeenCalled();
  });

  it('catches and logs exceptions thrown by the handler instead of letting them escape', () => {
    const error = new Error('boom');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const wrapped = safeHandler<z.output<typeof schema>>(schema, () => { throw error; });

    expect(() => wrapped({ n: 1 })).not.toThrow();
    expect(consoleError).toHaveBeenCalledWith('[socket] handler failed:', error);
  });

  it('drops the event without parsing it when the rate limit says no', () => {
    const handler = vi.fn();
    const parse = vi.spyOn(schema, 'safeParse');
    const wrapped = safeHandler(schema, handler, () => false);

    wrapped({ n: 1 });

    expect(parse).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });

  it('calls the handler when the rate limit allows the event', () => {
    const handler = vi.fn();

    safeHandler(schema, handler, () => true)({ n: 1 });

    expect(handler).toHaveBeenCalledOnce();
  });
});
