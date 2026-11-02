import { describe, expect, it } from 'vitest';
import { en } from '@/locales/en';
import { it as italian } from '@/locales/it';
import { MINI_GAMES } from './registry';

const translate = (translations: unknown, key: string) =>
  key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], translations);

describe('MINI_GAMES', () => {
  it('has unique ids', () => {
    const ids = MINI_GAMES.map((game) => game.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(MINI_GAMES.map((game) => [game.id, game.labelKey]))('translates the picker label of %s in every language', (_id, labelKey) => {
    expect(typeof translate(en, labelKey)).toBe('string');
    expect(typeof translate(italian, labelKey)).toBe('string');
  });
});
