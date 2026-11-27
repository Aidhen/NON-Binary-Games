import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ROOM_ICONS, RoomIconArt } from './RoomIconArt';

describe('RoomIconArt', () => {
  it('has sixteen different drawings, so that a room code of five can have no repeat', () => {
    expect(ROOM_ICONS).toHaveLength(16);
    expect(new Set(ROOM_ICONS).size).toBe(16);
  });

  it.each(ROOM_ICONS)('draws the %s as decoration, with a halo under the outline', (icon) => {
    const { container } = render(<RoomIconArt icon={icon} className="size-6" />);
    const svg = container.querySelector('svg')!;

    expect(svg).toHaveAttribute('data-room-icon', icon);
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg.getAttribute('viewBox')).toBe('0 0 40 40');
    expect(svg).toHaveClass('size-6');
    expect(svg.querySelectorAll('g').length).toBeGreaterThanOrEqual(3);
    expect(svg.innerHTML).not.toContain('currentColor');
  });
});
