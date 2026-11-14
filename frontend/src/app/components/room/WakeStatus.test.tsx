import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WakeStatus } from './WakeStatus';
import type { ConnectionStatus } from '@/lib/useConnectionStatus';

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const onRetry = vi.fn();
const renderStatus = (status: ConnectionStatus) =>
  render(<WakeStatus status={status} onRetry={onRetry}><span>something to do</span></WakeStatus>);

describe('WakeStatus', () => {
  it.each<ConnectionStatus>(['connecting', 'connected'])('only says the table is being set while %s', (status) => {
    renderStatus(status);

    expect(screen.getByRole('status')).toHaveTextContent('lobby.connecting');
    expect(screen.queryByText('loader.waking')).not.toBeInTheDocument();
    expect(screen.queryByText('something to do')).not.toBeInTheDocument();
  });

  it('explains why the server is slow, and has room for something to do meanwhile', () => {
    renderStatus('waking');

    expect(screen.getByText('loader.waking')).toBeInTheDocument();
    expect(screen.getByText('loader.wakingDetails')).toBeInTheDocument();
    expect(screen.getByText('something to do')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'loader.retry' })).not.toBeInTheDocument();
  });

  it('offers to try again when the server could not be reached', () => {
    onRetry.mockClear();
    renderStatus('failed');

    expect(screen.getByText('loader.failed')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'loader.retry' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });
});
