import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlayRoomPage from '@/app/play/[roomId]/page';

const mocks = vi.hoisted(() => ({ roomId: '3f2b8c1e-9d4a-4b7e-8a2c-5d6e7f8a9b0c' as unknown }));

vi.mock('next/navigation', () => ({
  useParams: () => ({ roomId: mocks.roomId }),
}));

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/app/components/room/RoomContainer', () => ({
  RoomContainer: ({ roomId }: { roomId: string }) => (
    <div data-testid="room-container" data-room-id={roomId} />
  ),
}));

const ROOM = '3f2b8c1e-9d4a-4b7e-8a2c-5d6e7f8a9b0c';

describe('PlayRoomPage', () => {
  beforeEach(() => { mocks.roomId = ROOM; });

  it('renders the RoomContainer with the correct roomId', () => {
    render(<PlayRoomPage />);
    const container = screen.getByTestId('room-container');
    expect(container.getAttribute('data-room-id')).toBe('3f2b8c1e-9d4a-4b7e-8a2c-5d6e7f8a9b0c');
  });

  it.each(['custom-room', 'us', '', ['a', 'b'], undefined])('shows a message instead of the game when the link has no valid room (%j)', (roomId) => {
    mocks.roomId = roomId;

    render(<PlayRoomPage />);

    expect(screen.getByRole('alert')).toHaveTextContent('sudoku.invalidRoom');
    expect(screen.getByRole('link', { name: 'sudoku.backHome' })).toHaveAttribute('href', '/');
    expect(screen.queryByTestId('room-container')).toBeNull();
  });
});
