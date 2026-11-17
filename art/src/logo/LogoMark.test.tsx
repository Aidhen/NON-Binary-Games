import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LogoMark } from './LogoMark';

describe('LogoMark', () => {
  it('is decoration by default: the name of the project is written next to it', () => {
    const { container } = render(<LogoMark />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('is an image with a name when it stands alone', () => {
    render(<LogoMark label="(non)BinaryGames" />);

    expect(screen.getByRole('img', { name: '(non)BinaryGames' })).toBeInTheDocument();
  });

  it('leaves the blush and the star out unless they are asked for', () => {
    const { container } = render(<LogoMark />);

    expect(container.querySelector('[data-logo-part="cheeks"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-logo-part="sparkle"]')).not.toBeInTheDocument();
  });

  it('draws the blush and the star of the large logo', () => {
    const { container } = render(<LogoMark size={320} cheeks sparkle />);

    expect(container.querySelectorAll('[data-logo-part="cheeks"] ellipse')).toHaveLength(4);
    expect(container.querySelector('[data-logo-part="sparkle"]')).toBeInTheDocument();
  });

  it('gives each logo on a page its own clip, so that one does not cut the other', () => {
    const { container } = render(<><LogoMark /><LogoMark /></>);

    const ids = [...container.querySelectorAll('clipPath')].map((clip) => clip.id);
    expect(new Set(ids).size).toBe(2);
    for (const [index, group] of [...container.querySelectorAll('g[clip-path]')].entries()) {
      expect(group.getAttribute('clip-path')).toBe(`url(#${ids[index]})`);
    }
  });
});
