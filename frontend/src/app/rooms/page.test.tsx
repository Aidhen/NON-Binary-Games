import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RoomsPage from './page';

const { router } = vi.hoisted(() => ({ router: { push: vi.fn() } }));

vi.mock('next/navigation', () => ({ useRouter: () => router }));

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('RoomsPage', () => {
  beforeEach(() => router.push.mockClear());

  it('says how rooms work today and opens one when asked', () => {
    render(<RoomsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'rooms.title' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'home.create' }));

    expect(router.push).toHaveBeenCalledExactlyOnceWith(expect.stringMatching(/^\/play\//));
  });

  it('presents public rooms as work in progress, with nothing to open yet', () => {
    render(<RoomsPage />);

    expect(screen.getByText('rooms.wip')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'rooms.publicTitle' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('asks for opinions through the feedback page', () => {
    render(<RoomsPage />);

    expect(screen.getByRole('link', { name: 'rooms.publicAskLink' })).toHaveAttribute('href', '/feedback');
  });
});
