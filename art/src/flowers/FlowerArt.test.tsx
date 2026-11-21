import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FLOWER_COLORS, FLOWER_KINDS, FlowerArt, HEAD_MOTION } from './FlowerArt';

describe('FlowerArt', () => {
  it.each(FLOWER_KINDS)('draws the %s as decoration, in the color it is given', (kind) => {
    const { container } = render(<FlowerArt kind={kind} color={FLOWER_COLORS[2]} />);
    const svg = container.querySelector('svg')!;

    expect(svg).toHaveAttribute('data-flower', kind);
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg.getAttribute('viewBox')).toBe('0 0 40 40');
    expect(svg.innerHTML).toContain(FLOWER_COLORS[2]);
    expect(svg.querySelector('[data-flower-head]')).toHaveAttribute('data-flower-head', HEAD_MOTION[kind]);
  });

  it('lets the tulip open up instead of turning, since it is not round', () => {
    expect(HEAD_MOTION.tulip).toBe('grow');
    expect(FLOWER_KINDS.filter((kind) => kind !== 'tulip').every((kind) => HEAD_MOTION[kind] === 'spin')).toBe(true);
  });

  it('has colors written as plain hex, so that the drawing never changes with the theme', () => {
    for (const color of FLOWER_COLORS) expect(color).toMatch(/^#[0-9A-F]{6}$/);
  });
});
