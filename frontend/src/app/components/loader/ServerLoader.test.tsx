import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServerLoader } from './ServerLoader';
import type { ConnectionStatus } from '@/lib/useConnectionStatus';

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../minigames/MiniGameArea', () => ({
  MiniGameArea: ({ onPlay }: { onPlay?: () => void }) => <button onClick={onPlay}>mini game</button>,
}));

const onEnter = vi.fn();
const onRetry = vi.fn();

const renderLoader = (status: ConnectionStatus, ready = false) =>
  render(<ServerLoader status={status} ready={ready} onEnter={onEnter} onRetry={onRetry} />);

beforeEach(() => {
  onEnter.mockClear();
  onRetry.mockClear();
});

describe('ServerLoader', () => {
  it.each<ConnectionStatus>(['connecting', 'connected'])('shows only the loading text while %s', (status) => {
    renderLoader(status);

    expect(screen.getByText('sudoku.loading')).toBeInTheDocument();
    expect(screen.queryByText('mini game')).not.toBeInTheDocument();
    expect(onEnter).not.toHaveBeenCalled();
  });

  it('explains why the server is slow and offers a mini game while waking', () => {
    renderLoader('waking');

    expect(screen.getByText('loader.waking')).toBeInTheDocument();
    expect(screen.getByText('loader.wakingDetails')).toBeInTheDocument();
    expect(screen.getByText('mini game')).toBeInTheDocument();
    expect(screen.queryByText('sudoku.loading')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'loader.retry' })).not.toBeInTheDocument();
  });

  it('shows the failure message with a retry button, keeping the mini game', () => {
    renderLoader('failed');

    expect(screen.getByText('loader.failed')).toBeInTheDocument();
    expect(screen.getByText('loader.failedDetails')).toBeInTheDocument();
    expect(screen.getByText('mini game')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'loader.retry' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('enters the game right away when the server is ready and nobody played', () => {
    renderLoader('connected', true);

    expect(onEnter).toHaveBeenCalledOnce();
    expect(screen.queryByText('loader.ready')).not.toBeInTheDocument();
  });

  it('enters the game right away when the server wakes up before the player touched the mini game', () => {
    const { rerender } = renderLoader('waking');

    rerender(<ServerLoader status="connected" ready onEnter={onEnter} onRetry={onRetry} />);

    expect(onEnter).toHaveBeenCalledOnce();
  });

  it('waits for the player to join when they were playing the mini game', () => {
    const { rerender } = renderLoader('waking');

    fireEvent.click(screen.getByText('mini game'));
    rerender(<ServerLoader status="connected" ready onEnter={onEnter} onRetry={onRetry} />);

    expect(onEnter).not.toHaveBeenCalled();
    expect(screen.getByText('loader.ready')).toBeInTheDocument();
    expect(screen.getByText('mini game')).toBeInTheDocument();
    expect(screen.queryByText('loader.waking')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'loader.join' }));

    expect(onEnter).toHaveBeenCalledOnce();
  });
});
