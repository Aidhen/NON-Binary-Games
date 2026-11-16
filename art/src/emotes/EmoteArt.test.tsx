import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmoteArt, hasEmoteArt } from './EmoteArt';
import { EMOTE_DRAWINGS } from './drawings';

const DRAWN = Object.keys(EMOTE_DRAWINGS);

describe('the drawings of the emotes', () => {
  it('have a name of their own each, so that two emotes never share a drawing by mistake', () => {
    const ids = DRAWN.map((emote) => EMOTE_DRAWINGS[emote].id);
    expect(new Set(ids).size).toBe(DRAWN.length);
  });

  it.each(DRAWN)('%s is drawn in a square, so that every emote takes the same room', (emote) => {
    const [, , width, height] = EMOTE_DRAWINGS[emote].viewBox.split(' ').map(Number);
    expect(width).toBeGreaterThan(0);
    expect(width).toBe(height);
  });
});

describe('EmoteArt', () => {
  it.each(DRAWN)('draws %s at the size it is asked for', (emote) => {
    const { container } = render(<EmoteArt emote={emote} size={40} />);

    const drawing = container.querySelector('svg')!;
    expect(drawing).toHaveAttribute('data-emote-art', EMOTE_DRAWINGS[emote].id);
    expect(drawing).toHaveAttribute('width', '40');
    expect(drawing).toHaveAttribute('height', '40');
    expect(drawing.childElementCount).toBeGreaterThan(0);
  });

  it('is decoration unless it is given a label', () => {
    const { container } = render(<EmoteArt emote={DRAWN[0]} />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('is an image with a name when it is given a label', () => {
    render(<EmoteArt emote={DRAWN[0]} label="Purple heart" />);

    expect(screen.getByRole('img', { name: 'Purple heart' })).toBeInTheDocument();
  });

  it('shows the emoji itself when it has no drawing yet', () => {
    const { container } = render(<EmoteArt emote="🌵" />);

    expect(hasEmoteArt('🌵')).toBe(false);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('🌵');
  });

  it('does not take a property of every object for a drawing', () => {
    expect(hasEmoteArt('toString')).toBe(false);
  });
});
