import { fireEvent, render, screen } from '@testing-library/react';
import { EMOTES } from '@nbg/shared';
import { describe, expect, it, vi } from 'vitest';
import { EmoteBar } from './EmoteBar';

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('EmoteBar', () => {
  it('shows one button per emote, named after the emoji itself', () => {
    render(<EmoteBar onSend={vi.fn()} />);

    expect(screen.getByRole('group', { name: 'emotes.title' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(EMOTES.length);
    for (const emote of EMOTES) {
      expect(screen.getByRole('button', { name: emote })).toBeInTheDocument();
    }
  });

  it.each(EMOTES)('sends %s when its button is clicked', (emote) => {
    const onSend = vi.fn();
    render(<EmoteBar onSend={onSend} />);

    fireEvent.click(screen.getByRole('button', { name: emote }));

    expect(onSend).toHaveBeenCalledExactlyOnceWith(emote);
  });

  it('disables every button while disabled', () => {
    const onSend = vi.fn();
    render(<EmoteBar onSend={onSend} disabled />);

    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled();
      fireEvent.click(button);
    }
    expect(onSend).not.toHaveBeenCalled();
  });
});
