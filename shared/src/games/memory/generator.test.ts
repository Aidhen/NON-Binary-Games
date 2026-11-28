import { describe, expect, it } from 'vitest';
import { DIFFICULTIES } from '../sudoku/types';
import { generateMemory, getMemoryLevel } from './generator';
import { MEMORY_FACE_COUNT } from './types';

describe('getMemoryLevel', () => {
  it('has the pairs agreed for each level, and never more than there are drawings', () => {
    expect(DIFFICULTIES.map((level) => getMemoryLevel(level).pairs)).toEqual([6, 8, 12, 16, 22]);
    for (const level of DIFFICULTIES) expect(getMemoryLevel(level).pairs).toBeLessThanOrEqual(MEMORY_FACE_COUNT);
  });

  it('refuses a level it does not know, also the names every object has', () => {
    expect(() => getMemoryLevel('impossible' as never)).toThrow('Unknown difficulty');
    expect(() => getMemoryLevel('constructor' as never)).toThrow('Unknown difficulty');
  });
});

describe('generateMemory', () => {
  it.each(DIFFICULTIES)('makes a deck of two cards for each pair, %s', (level) => {
    const deck = generateMemory(level);

    expect(deck).toHaveLength(getMemoryLevel(level).pairs * 2);
  });

  it.each(DIFFICULTIES)('has each face exactly twice, and only drawings that exist, %s', (level) => {
    const deck = generateMemory(level);
    const counts = new Map<number, number>();
    for (const face of deck) counts.set(face, (counts.get(face) ?? 0) + 1);

    expect(counts.size).toBe(getMemoryLevel(level).pairs);
    expect([...counts.values()].every((count) => count === 2)).toBe(true);
    expect(deck.every((face) => Number.isInteger(face) && face >= 0 && face < MEMORY_FACE_COUNT)).toBe(true);
  });

  it('uses every drawing at the last level', () => {
    expect(new Set(generateMemory('expert')).size).toBe(MEMORY_FACE_COUNT);
  });

  it('does not make the same deck every time', () => {
    const decks = new Set(Array.from({ length: 10 }, () => generateMemory('hard').join(',')));

    expect(decks.size).toBeGreaterThan(1);
  });

  it('refuses a level it does not know', () => {
    expect(() => generateMemory('impossible' as never)).toThrow('Unknown difficulty');
  });
});
