import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PLAYER_COLORS } from '@nbg/shared';
import { PLAYER_COLOR_STYLES, UNKNOWN_PLAYER_STYLE, styleOfColor } from './playerPalette';

const css = readFileSync(path.resolve(import.meta.dirname, '../app/globals.css'), 'utf8');

/** The `--name: #rrggbb` variables of each theme block of globals.css. */
const themes = Object.fromEntries(
  [...css.matchAll(/(:root, \[data-theme="light"\]|\[data-theme="([a-z-]+)"\])\s*\{([\s\S]*?)\n\}/g)].map((match) => [
    match[2] ?? 'light',
    Object.fromEntries([...match[3].matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)].map(([, name, value]) => [name, value])),
  ]),
) as Record<string, Record<string, string>>;

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
};

/** Where the colors of other players are drawn: the page, the cells, and a cell that is selected. */
const SURFACES = ['bg', 'cell-background', 'cell-background-initial', 'cell-background-highlight'] as const;
const SELECTED = 'cell-background-selected';

describe('the player colors of every theme', () => {
  it('are found in globals.css for the five themes', () => {
    expect(Object.keys(themes).sort()).toEqual(['dark', 'light', 'non-binary', 'oled', 'retro']);
  });

  describe.each(Object.keys(themes))('%s', (theme) => {
    const variables = themes[theme];

    it.each(PLAYER_COLORS)('defines %s for rings and swatches and for the text of notes', (color) => {
      expect(variables[`player-${color}`]).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(variables[`player-${color}-text`]).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it.each(PLAYER_COLORS)('keeps %s visible as a ring or a swatch (3:1) on every surface, the selected cell included', (color) => {
      for (const surface of [...SURFACES, SELECTED]) {
        expect(contrast(variables[`player-${color}`], variables[surface]), `${color} on ${surface}`).toBeGreaterThanOrEqual(3);
      }
    });

    it.each(PLAYER_COLORS)('keeps %s readable as the digits of a note (4.5:1 on the surfaces, 3:1 on a selected cell)', (color) => {
      for (const surface of SURFACES) {
        expect(contrast(variables[`player-${color}-text`], variables[surface]), `${color} text on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrast(variables[`player-${color}-text`], variables[SELECTED]), `${color} text on the selected cell`).toBeGreaterThanOrEqual(3);
    });
  });
});

describe('the text and the lines of every theme', () => {
  describe.each(Object.keys(themes))('%s', (theme) => {
    const variables = themes[theme];

    it('keeps the title readable (4.5:1) on the page, the paper and its wells, and the subtitle on the page and the paper', () => {
      for (const [text, surfaces] of [['title-text', ['bg', 'paper', 'paper-well']], ['subtitle-text', ['bg', 'paper']]] as const) {
        for (const surface of surfaces) {
          expect(contrast(variables[text], variables[surface]), `${text} on ${surface}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    });

    it.runIf(theme === 'light')('keeps the plum and lilac of the light theme: the subtitle reaches 4.5:1 on the page, the paper and its wells', () => {
      expect(variables['title-text'].toLowerCase()).toBe('#3a2e3f');
      expect(variables['bg'].toLowerCase()).toBe('#f3f0f7');
      for (const surface of ['bg', 'paper', 'paper-well']) {
        expect(contrast(variables['subtitle-text'], variables[surface]), `subtitle on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('keeps the lines between the boxes of a board visible (3:1) on the cells', () => {
      for (const surface of ['cell-background', 'cell-background-initial']) {
        expect(contrast(variables['grid-border-outer'], variables[surface]), `lines on ${surface}`).toBeGreaterThanOrEqual(3);
      }
    });

    it('draws the grass and the meadow of the Flower Field, and keeps its numbers readable on the soil', () => {
      expect(variables['field-grass']).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(variables['field-meadow']).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(contrast(variables['number-initial'], variables['paper-well'])).toBeGreaterThanOrEqual(4.5);
    });
  });
});

const PLUM = '#3A2E3F';

describe('the game boxes of every theme', () => {
  describe.each(Object.keys(themes))('%s', (theme) => {
    const variables = themes[theme];
    const block = css.slice(css.indexOf(theme === 'light' ? ':root, [data-theme="light"]' : `[data-theme="${theme}"]`)).split('\n}\n')[0];

    it('defines the four lids, the Takuzu one split between its two tiles', () => {
      for (const name of ['lid-sudoku', 'lid-flower-field', 'lid-word-search', 'lid-takuzu-a', 'lid-takuzu-b']) {
        expect(variables[name], name).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
      expect(block).toMatch(/--lid-takuzu: linear-gradient\(135deg, var\(--lid-takuzu-a\) 50%, var\(--lid-takuzu-b\) 50%\);/);
    });

    it('keeps the plum outline visible (3:1) on every lid, and the plum letters of Word Search readable (4.5:1) on its sunflower', () => {
      for (const name of ['lid-sudoku', 'lid-flower-field', 'lid-word-search', 'lid-takuzu-a', 'lid-takuzu-b']) {
        expect(contrast(PLUM, variables[name]), `outline on ${name}`).toBeGreaterThanOrEqual(3);
      }
      expect(contrast(PLUM, variables['lid-word-search'])).toBeGreaterThanOrEqual(4.5);
    });

    it('gives each game its own lid', () => {
      const lids = ['lid-sudoku', 'lid-flower-field', 'lid-word-search', 'lid-takuzu-a'].map((name) => variables[name].toLowerCase());
      expect(new Set(lids).size).toBe(lids.length);
    });
  });
});

describe('PLAYER_COLOR_STYLES', () => {
  it('has the classes of every color, written out in full so that Tailwind finds them', () => {
    expect(Object.keys(PLAYER_COLOR_STYLES).sort()).toEqual([...PLAYER_COLORS].sort());
  });

  it.each(PLAYER_COLORS)('uses the variables of %s and no other color', (color) => {
    const { ring, tint, head, swatch, border, text } = PLAYER_COLOR_STYLES[color];

    expect(ring).toContain(`--player-${color})`);
    expect(tint).toContain(`--player-${color})`);
    expect(head).toContain(`--player-${color})`);
    expect(swatch).toContain(`--player-${color})`);
    expect(border).toContain(`--player-${color})`);
    expect(text).toContain(`--player-${color}-text)`);
    for (const other of PLAYER_COLORS.filter((name) => name !== color)) {
      expect([ring, tint, head, swatch, border, text].join(' ')).not.toContain(`--player-${other}`);
    }
  });
});

describe('styleOfColor', () => {
  it.each(PLAYER_COLORS)('gives %s its own style', (color) => {
    expect(styleOfColor(color)).toBe(PLAYER_COLOR_STYLES[color]);
  });

  it.each(['gold', '', 'RED', '__proto__', 'constructor', 'toString'])(
    'gives the color of the theme to a color it does not know (%j), such as one from a newer server',
    (color) => {
      expect(styleOfColor(color)).toBe(UNKNOWN_PLAYER_STYLE);
    },
  );
});

