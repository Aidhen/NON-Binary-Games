import { act, fireEvent, render, screen } from '@testing-library/react';
import { EMOTES } from '@nbg/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Blob, BLOB_REACTION_MS } from './Blob';

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const status = () => screen.getByRole('status').textContent;
const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Blob', () => {
  it('waits quietly at the beginning', () => {
    render(<Blob />);

    expect(status()).toBe('minigames.blob.idle');
  });

  it('is surprised when poked and tells the loader the player is playing', () => {
    const onPlay = vi.fn();
    render(<Blob onPlay={onPlay} />);

    fireEvent.click(screen.getByRole('button', { name: 'minigames.blob.poke' }));

    expect(status()).toBe('minigames.blob.surprised');
    expect(onPlay).toHaveBeenCalledOnce();
  });

  it.each([
    ['💜', 'happy'],
    ['🔥', 'surprised'],
    ['🤔', 'thinking'],
    ['😢', 'sad'],
  ])('reacts to %s feeling %s and shows the emote above its head', (emote, mood) => {
    const onPlay = vi.fn();
    render(<Blob onPlay={onPlay} />);

    fireEvent.click(screen.getByRole('button', { name: emote }));

    expect(status()).toBe(`minigames.blob.${mood}`);
    expect(screen.getAllByText(emote)).toHaveLength(2); // the bar button and the reaction
    expect(onPlay).toHaveBeenCalledOnce();
  });

  it.each(EMOTES)('has a reaction for every shared emote (%s)', (emote) => {
    render(<Blob />);

    fireEvent.click(screen.getByRole('button', { name: emote }));

    expect(status()).not.toBe('minigames.blob.idle');
  });

  it('goes back to waiting once the reaction is over', () => {
    render(<Blob />);

    fireEvent.click(screen.getByRole('button', { name: '😢' }));
    advance(BLOB_REACTION_MS - 1);
    expect(status()).toBe('minigames.blob.sad');

    advance(1);
    expect(status()).toBe('minigames.blob.idle');
    expect(screen.getAllByText('😢')).toHaveLength(1); // only the bar button is left
  });

  it('restarts the countdown when a new reaction arrives', () => {
    render(<Blob />);

    fireEvent.click(screen.getByRole('button', { name: '😢' }));
    advance(BLOB_REACTION_MS - 500);
    fireEvent.click(screen.getByRole('button', { name: '😎' }));
    advance(BLOB_REACTION_MS - 1);

    expect(status()).toBe('minigames.blob.happy');

    advance(1);
    expect(status()).toBe('minigames.blob.idle');
  });

  it('keeps the keyboard focus on the blob after poking it', () => {
    render(<Blob />);
    const blob = screen.getByRole('button', { name: 'minigames.blob.poke' });

    blob.focus();
    fireEvent.click(blob);

    expect(screen.getByRole('button', { name: 'minigames.blob.poke' })).toBe(blob);
    expect(blob).toHaveFocus();
  });

  it('leaves no timer behind when unmounted', () => {
    const { unmount } = render(<Blob />);
    fireEvent.click(screen.getByRole('button', { name: '🪻' }));

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
