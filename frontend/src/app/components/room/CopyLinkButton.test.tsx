import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COPIED_MS, CopyLinkButton } from './CopyLinkButton';

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const writeText = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  writeText.mockReset().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('CopyLinkButton', () => {
  it('copies the address of the page with one click and says so for a moment', async () => {
    render(<CopyLinkButton />);

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /sudoku.copyLink/ })); });

    expect(writeText).toHaveBeenCalledExactlyOnceWith(window.location.href);
    expect(screen.getByRole('button')).toHaveTextContent('sudoku.copied');

    act(() => { vi.advanceTimersByTime(COPIED_MS); });

    expect(screen.getByRole('button')).toHaveTextContent('sudoku.copyLink');
  });

  it('does not claim the link was copied when the browser refused', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    writeText.mockRejectedValue(new Error('denied'));
    render(<CopyLinkButton />);

    await act(async () => { fireEvent.click(screen.getByRole('button')); });

    expect(screen.getByRole('button')).toHaveTextContent('sudoku.copyLink');
  });

  it('leaves no timer behind when it goes away', async () => {
    const { unmount } = render(<CopyLinkButton />);
    await act(async () => { fireEvent.click(screen.getByRole('button')); });

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
