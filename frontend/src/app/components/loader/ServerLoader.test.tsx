import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServerLoader } from './ServerLoader';
import type { ConnectionStatus } from '@/lib/useConnectionStatus';

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const onRetry = vi.fn();

const renderLoader = (status: ConnectionStatus) => render(<ServerLoader status={status} onRetry={onRetry} />);

beforeEach(() => {
  onRetry.mockClear();
});

describe('ServerLoader', () => {
  it.each<ConnectionStatus>(['connecting', 'connected'])('shows only the loading text while %s', (status) => {
    renderLoader(status);

    expect(screen.getByText('sudoku.loading')).toBeInTheDocument();
    expect(screen.queryByText('loader.waking')).not.toBeInTheDocument();
  });

  it('explains why the server is slow while waking', () => {
    renderLoader('waking');

    expect(screen.getByText('loader.waking')).toBeInTheDocument();
    expect(screen.getByText('loader.wakingDetails')).toBeInTheDocument();
    expect(screen.queryByText('sudoku.loading')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'loader.retry' })).not.toBeInTheDocument();
  });

  it('shows the failure message with a retry button', () => {
    renderLoader('failed');

    expect(screen.getByText('loader.failed')).toBeInTheDocument();
    expect(screen.getByText('loader.failedDetails')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'loader.retry' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });
});
