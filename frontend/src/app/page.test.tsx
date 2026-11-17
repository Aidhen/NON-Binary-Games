import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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

const create = () => fireEvent.click(screen.getByRole('button', { name: 'home.create' }));

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

  it('says what the site is, and opens no room until it is asked to', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('home.titleStart');
    expect(router.push).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('opens a new room when asked, with an id the server accepts', () => {
    render(<Home />);

    create();

    expect(router.push).toHaveBeenCalledOnce();
    const [path] = router.push.mock.calls[0] as [string];
    expect(path).toMatch(/^\/play\//);
    expect(roomIdSchema.safeParse(path.replace('/play/', '')).success).toBe(true);
  });

  it('keeps the home in the history: going back from the room leads here, where nothing opens by itself', () => {
    render(<Home />);
    create();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('opens a different room each time', () => {
    render(<Home />);
    create();
    create();

    const [first, second] = router.push.mock.calls.map(([path]) => path as string);
    expect(first).not.toBe(second);
  });

  it('shows the games further down the page', () => {
    render(<Home />);

    expect(screen.getByRole('region', { name: 'home.gamesTitle' })).toBeInTheDocument();
  });

  it('explains how it works in three steps, in order', () => {
    render(<Home />);

    const steps = screen.getAllByRole('listitem').filter((item) => item.querySelector('h3')?.textContent?.startsWith('home.step'));
    expect(steps.map((step) => step.querySelector('h3')?.textContent)).toEqual(['home.step1Title', 'home.step2Title', 'home.step3Title']);
  });
});
