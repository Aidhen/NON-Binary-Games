import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { roomIdSchema } from '@nbg/shared';
import { useNewRoom } from './useNewRoom';

const { router } = vi.hoisted(() => ({ router: { push: vi.fn() } }));

vi.mock('next/navigation', () => ({ useRouter: () => router }));

describe('useNewRoom', () => {
  beforeEach(() => router.push.mockClear());

  it('goes to a room with an id the server accepts', () => {
    const { result } = renderHook(() => useNewRoom());

    result.current();

    const [path] = router.push.mock.calls[0] as [string];
    expect(path).toMatch(/^\/play\//);
    expect(roomIdSchema.safeParse(path.replace('/play/', '')).success).toBe(true);
  });

  it('never opens the same room twice', () => {
    const { result } = renderHook(() => useNewRoom());

    result.current();
    result.current();

    const [first, second] = router.push.mock.calls.map(([path]) => path as string);
    expect(first).not.toBe(second);
  });
});
