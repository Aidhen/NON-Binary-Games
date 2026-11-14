import { afterEach, describe, expect, it, vi } from 'vitest';
import { layMines } from './generator';
import { canBeSolvedWithoutGuessing } from './solver';

// The real solver would make the test depend on luck: here no field is ever good, and only the clock decides.
vi.mock('./solver', () => ({ canBeSolvedWithoutGuessing: vi.fn(() => false) }));

afterEach(() => { vi.restoreAllMocks(); vi.mocked(canBeSolvedWithoutGuessing).mockClear(); });

describe('layMines, when no field is found', () => {
  it('stops when the time is up, after trying once, and does not use all the attempts', () => {
    // The first reading sets the deadline, every one after is long past it.
    const now = vi.spyOn(Date, 'now').mockReturnValue(10_000);
    now.mockReturnValueOnce(0);

    expect(() => layMines(8, 8, 0, 0)).toThrow('no guess');

    expect(canBeSolvedWithoutGuessing).toHaveBeenCalledTimes(1);
  });

  it('uses the attempts when the time is not up, and then gives up', () => {
    vi.spyOn(Date, 'now').mockReturnValue(0);

    expect(() => layMines(8, 8, 0, 0)).toThrow('no guess');

    expect(vi.mocked(canBeSolvedWithoutGuessing).mock.calls.length).toBeGreaterThan(1);
  });
});
