import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EMOTES } from '@nbg/shared';
import { EMOTES_PER_ROW, EmoteShowcase, SHOWN_EMOTES } from './EmoteShowcase';
import { EMOTE_LIFETIME_MS, MAX_FLOATING_EMOTES } from '@/lib/useEmotes';

const socket = vi.hoisted(() => ({ emit: vi.fn() }));
vi.mock('@/lib/socket', () => ({ getSocket: () => socket }));

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('EmoteShowcase', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('only has full rows', () => {
    expect(SHOWN_EMOTES.length % EMOTES_PER_ROW).toBe(0);
    expect(SHOWN_EMOTES.length).toBeGreaterThan(0);
    expect(SHOWN_EMOTES).toEqual(EMOTES.slice(0, SHOWN_EMOTES.length));
  });

  it('draws each emote it shows as a button named after it', () => {
    render(<EmoteShowcase />);

    expect(screen.getByRole('group', { name: 'emotes.title' }).querySelectorAll('svg[data-emote-art]')).toHaveLength(SHOWN_EMOTES.length);
    for (const emote of SHOWN_EMOTES) expect(screen.getByRole('button', { name: emote })).toBeInTheDocument();
  });

  it('sends a tapped emote floating up this screen only, and lets it go', () => {
    render(<EmoteShowcase />);

    fireEvent.click(screen.getByRole('button', { name: SHOWN_EMOTES[0] }));

    expect(screen.getByTestId('floating-emote')).toHaveAttribute('data-emote', SHOWN_EMOTES[0]);
    expect(socket.emit).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(EMOTE_LIFETIME_MS); });
    expect(screen.queryByTestId('floating-emote')).not.toBeInTheDocument();
  });

  it('keeps no more emotes in the air than a game does', () => {
    render(<EmoteShowcase />);
    const button = screen.getByRole('button', { name: SHOWN_EMOTES[1] });

    for (let i = 0; i < MAX_FLOATING_EMOTES + 5; i++) fireEvent.click(button);

    expect(screen.getAllByTestId('floating-emote')).toHaveLength(MAX_FLOATING_EMOTES);
  });
});
