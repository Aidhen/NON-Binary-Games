import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Home from '@/app/page';

const mockPush = vi.fn();
const { warmUpServer } = vi.hoisted(() => ({ warmUpServer: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/lib/warmUp', () => ({ warmUpServer }));

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('Home', () => {
  beforeEach(() => {
    mockPush.mockClear();
    warmUpServer.mockClear();
  });

  it('wakes up the server in the background when the page opens', () => {
    render(<Home />);
    expect(warmUpServer).toHaveBeenCalledOnce();
  });

  it('renders the title and subtitle', () => {
    render(<Home />);
    expect(screen.getByText('sudoku.title')).toBeDefined();
    expect(screen.getByText('sudoku.subtitle')).toBeDefined();
  });

  it('renders the start button', () => {
    render(<Home />);
    expect(screen.getByText('sudoku.startNewGame')).toBeDefined();
  });

  it('navigates to a new room on button click', () => {
    render(<Home />);
    fireEvent.click(screen.getByText('sudoku.startNewGame'));
    expect(mockPush).toHaveBeenCalledOnce();
    expect(mockPush.mock.calls[0][0]).toMatch(/^\/play\/[a-f0-9-]{36}$/);
  });
});