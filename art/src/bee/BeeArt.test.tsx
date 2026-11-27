import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BeeArt } from './BeeArt';

describe('BeeArt', () => {
  it('is decoration on the same 40 by 40 canvas as the flowers, with the class and the style it is given', () => {
    const { container } = render(<BeeArt className="size-full" style={{ opacity: 0.5 }} />);
    const svg = container.querySelector('svg')!;

    expect(svg).toHaveAttribute('data-bee');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg.getAttribute('viewBox')).toBe('0 0 40 40');
    expect(svg).toHaveClass('size-full');
    expect(svg.style.opacity).toBe('0.5');
  });

  it('is drawn in the plum, honey, cream and blush of the emotes, as plain hex colors that never follow the theme', () => {
    const { container } = render(<BeeArt />);
    const drawing = container.innerHTML.toUpperCase();

    for (const color of ['#3A2E3F', '#F2B544', '#FFF7E8', '#FF9FA8']) expect(drawing).toContain(color);
    expect(container.innerHTML).not.toContain('var(');
  });

  it('has two wings that can flutter, two antennae with dots, and two stripes on the body', () => {
    const { container } = render(<BeeArt />);

    expect(container.querySelectorAll('[data-bee-wings] ellipse')).toHaveLength(2);
    expect(container.querySelectorAll('circle')).toHaveLength(2);
    expect(container.querySelector('path[d*="V27.4"]')).toBeInTheDocument();
  });

  it('is asleep: closed eyes and a smile, and nothing sharp (no stinger)', () => {
    const { container } = render(<BeeArt />);

    expect(container.innerHTML).not.toMatch(/polygon/i);
    expect(container.querySelectorAll('path[d*="q1.6 -2 3.2 0"]')).toHaveLength(1);
  });
});
