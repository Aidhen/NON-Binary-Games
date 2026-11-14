import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { roomIdSchema } from '@nbg/shared';
import Home from '@/app/page';

const { warmUpServer, router } = vi.hoisted(() => ({ warmUpServer: vi.fn(), router: { replace: vi.fn(), push: vi.fn() } }));

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}));

vi.mock('@/lib/warmUp', () => ({ warmUpServer }));

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('Home', () => {
  beforeEach(() => {
    router.replace.mockClear();
    router.push.mockClear();
    warmUpServer.mockClear();
  });

  it('wakes up the server in the background when the page opens', () => {
    render(<Home />);
    expect(warmUpServer).toHaveBeenCalledOnce();
  });

  it('opens a new room right away, with an id the server accepts', () => {
    render(<Home />);

    expect(router.replace).toHaveBeenCalledOnce();
    const [path] = router.replace.mock.calls[0] as [string];
    expect(path).toMatch(/^\/play\//);
    expect(roomIdSchema.safeParse(path.replace('/play/', '')).success).toBe(true);
  });

  it('does not leave the home in the history: going back must not open another room', () => {
    render(<Home />);
    expect(router.push).not.toHaveBeenCalled();
  });

  it('opens a different room each time', () => {
    render(<Home />);
    render(<Home />);

    const [first, second] = router.replace.mock.calls.map(([path]) => path as string);
    expect(first).not.toBe(second);
  });

  it('shows that something is loading in the meantime', () => {
    render(<Home />);
    expect(screen.getByText('sudoku.loading')).toBeInTheDocument();
  });
});
