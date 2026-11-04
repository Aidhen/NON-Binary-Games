import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmoteOverlay } from './EmoteOverlay';

describe('EmoteOverlay', () => {
  it('renders each floating emote at its own horizontal position', () => {
    render(<EmoteOverlay emotes={[{ id: 1, emote: '🔥', left: 25 }, { id: 2, emote: '😴', left: 70 }]} />);

    const floating = screen.getAllByTestId('floating-emote');
    expect(floating.map((element) => element.textContent)).toEqual(['🔥', '😴']);
    expect(floating.map((element) => element.style.left)).toEqual(['25%', '70%']);
  });

  it('never gets in the way of the board or of assistive technology', () => {
    const { container } = render(<EmoteOverlay emotes={[{ id: 1, emote: '💜', left: 50 }]} />);

    const overlay = container.firstElementChild!;
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
    expect(overlay).toHaveClass('pointer-events-none');
  });

  it('renders nothing visible when there are no emotes', () => {
    render(<EmoteOverlay emotes={[]} />);

    expect(screen.queryByTestId('floating-emote')).not.toBeInTheDocument();
  });
});
