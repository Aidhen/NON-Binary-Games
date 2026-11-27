import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ANIMAL_ART_IDS, AnimalArt } from './AnimalArt';

describe('AnimalArt', () => {
  it.each(ANIMAL_ART_IDS)('draws the %s as decoration, filled with the color of the text around it', (animal) => {
    const { container } = render(<AnimalArt animal={animal} style={{ color: 'rgb(1, 2, 3)' }} />);
    const svg = container.querySelector('svg')!;

    expect(svg).toHaveAttribute('data-animal', animal);
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg.getAttribute('viewBox')).toBe('0 0 40 40');
    expect(svg).toHaveStyle({ color: 'rgb(1, 2, 3)' });
    expect(svg.innerHTML).toContain('currentColor');
    expect(svg.querySelectorAll('g')).toHaveLength(3);
  });
});
