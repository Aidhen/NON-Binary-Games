import { fireEvent, render, screen } from '@testing-library/react';
import { EMOTE_PAGES } from '@nbg/shared';
import { describe, expect, it, vi } from 'vitest';
import { EmoteBar } from './EmoteBar';

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const [FRONT_EMOTES, BACK_EMOTES] = EMOTE_PAGES;
const flip = () => fireEvent.click(screen.getByRole('button', { name: 'emotes.more' }));

describe('EmoteBar', () => {
  it('shows one button per emote of the first side, named after the emoji itself, plus the flip button', () => {
    render(<EmoteBar onSend={vi.fn()} />);

    expect(screen.getByRole('group', { name: 'emotes.title' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(FRONT_EMOTES.length + 1);
    for (const emote of FRONT_EMOTES) {
      expect(screen.getByRole('button', { name: emote })).toBeInTheDocument();
    }
    for (const emote of BACK_EMOTES) {
      expect(screen.queryByRole('button', { name: emote })).not.toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'emotes.more' })).toHaveAttribute('aria-pressed', 'false');
  });

  it.each(FRONT_EMOTES)('sends %s when its button is clicked', (emote) => {
    const onSend = vi.fn();
    render(<EmoteBar onSend={onSend} />);

    fireEvent.click(screen.getByRole('button', { name: emote }));

    expect(onSend).toHaveBeenCalledExactlyOnceWith(emote);
  });

  it('shows the second side after a flip, without sending anything', () => {
    const onSend = vi.fn();
    render(<EmoteBar onSend={onSend} />);

    flip();

    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'emotes.more' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('button')).toHaveLength(BACK_EMOTES.length + 1);
    for (const emote of BACK_EMOTES) {
      expect(screen.getByRole('button', { name: emote })).toBeInTheDocument();
    }
    for (const emote of FRONT_EMOTES) {
      expect(screen.queryByRole('button', { name: emote })).not.toBeInTheDocument();
    }
  });

  it.each(BACK_EMOTES)('sends %s from the second side', (emote) => {
    const onSend = vi.fn();
    render(<EmoteBar onSend={onSend} />);

    flip();
    fireEvent.click(screen.getByRole('button', { name: emote }));

    expect(onSend).toHaveBeenCalledExactlyOnceWith(emote);
  });

  it('goes back to the first side with a second flip', () => {
    const onSend = vi.fn();
    render(<EmoteBar onSend={onSend} />);

    flip();
    flip();
    fireEvent.click(screen.getByRole('button', { name: FRONT_EMOTES[0] }));

    expect(onSend).toHaveBeenCalledExactlyOnceWith(FRONT_EMOTES[0]);
  });

  it('disables every emote while disabled, but the bar can still be flipped', () => {
    const onSend = vi.fn();
    render(<EmoteBar onSend={onSend} disabled />);

    for (const emote of FRONT_EMOTES) {
      const button = screen.getByRole('button', { name: emote });
      expect(button).toBeDisabled();
      fireEvent.click(button);
    }
    flip();
    for (const emote of BACK_EMOTES) {
      expect(screen.getByRole('button', { name: emote })).toBeDisabled();
    }
    expect(onSend).not.toHaveBeenCalled();
  });
});
