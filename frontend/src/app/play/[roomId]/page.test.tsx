import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlayRoomPage from '@/app/play/[roomId]/page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ roomId: 'test-room-123' }),
}));

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/app/components/sudoku/SudokuContainer', () => ({
  SudokuContainer: ({ roomId }: { roomId: string }) => (
    <div data-testid="sudoku-container" data-room-id={roomId} />
  ),
}));

describe('PlayRoomPage', () => {
  it('renders the room ID', () => {
    render(<PlayRoomPage />);
    expect(screen.getByText('test-room-123')).toBeDefined();
  });

  it('renders the SudokuContainer with the correct roomId', () => {
    render(<PlayRoomPage />);
    const container = screen.getByTestId('sudoku-container');
    expect(container.getAttribute('data-room-id')).toBe('test-room-123');
  });

  it('renders the copy link button', () => {
    render(<PlayRoomPage />);
    expect(screen.getByText(/sudoku.copyLink/)).toBeDefined();
  });

  it('copies the invite link and shows confirmation', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(<PlayRoomPage />);
    fireEvent.click(screen.getByText(/sudoku.copyLink/));

    await waitFor(() => {
      expect(screen.getByText(/sudoku.copied/)).toBeDefined();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      window.location.href
    );
  });
});