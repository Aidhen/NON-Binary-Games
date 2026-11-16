import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EMOTES } from '@nbg/shared';
import { EMOTES_PER_ROW, EmoteShowcase, SHOWN_EMOTES } from './EmoteShowcase';

describe('EmoteShowcase', () => {
  it('only has full rows', () => {
    expect(SHOWN_EMOTES.length % EMOTES_PER_ROW).toBe(0);
    expect(SHOWN_EMOTES.length).toBeGreaterThan(0);
    expect(SHOWN_EMOTES).toEqual(EMOTES.slice(0, SHOWN_EMOTES.length));
  });

  it('draws each emote it shows, as decoration', () => {
    render(<EmoteShowcase />);

    const showcase = screen.getByTestId('emote-showcase');
    expect(showcase).toHaveAttribute('aria-hidden', 'true');
    expect(showcase.querySelectorAll('svg[data-emote-art]')).toHaveLength(SHOWN_EMOTES.length);
  });
});
