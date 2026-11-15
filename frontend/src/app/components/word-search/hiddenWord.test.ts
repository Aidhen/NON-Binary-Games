import { describe, expect, it } from 'vitest';
import type { WordSearchFound } from '@nbg/shared';
import { hiddenWordOf, lineCells } from './hiddenWord';

// 3x3. Rows: ABC / DEF / GHI. Words: ABC (row 0), CFI (column 2, crosses ABC at C), GEC is not used.
const grid = [['A', 'B', 'C'], ['D', 'E', 'F'], ['G', 'H', 'I']];
const abc: WordSearchFound = { word: 'ABC', alias: 'a', from: { r: 0, c: 0 }, to: { r: 0, c: 2 } };
const cfi: WordSearchFound = { word: 'CFI', alias: 'b', from: { r: 0, c: 2 }, to: { r: 2, c: 2 } };
const gec: WordSearchFound = { word: 'GEC', alias: 'a', from: { r: 2, c: 0 }, to: { r: 0, c: 2 } };

describe('lineCells', () => {
  it('walks the line, backwards and in diagonal too', () => {
    expect(lineCells({ r: 0, c: 2 }, { r: 2, c: 0 }, 3)).toEqual([{ r: 0, c: 2 }, { r: 1, c: 1 }, { r: 2, c: 0 }]);
  });

  it('gives nothing for a line that is not straight or leaves the grid', () => {
    expect(lineCells({ r: 0, c: 0 }, { r: 1, c: 2 }, 3)).toEqual([]);
    expect(lineCells({ r: 0, c: 0 }, { r: 0, c: 3 }, 3)).toEqual([]);
  });
});

describe('hiddenWordOf', () => {
  it('gives nothing while a word is missing, even when the cells left would spell something', () => {
    expect(hiddenWordOf(grid, [abc, cfi], 4)).toBeNull();
    expect(hiddenWordOf(grid, [], 3)).toBeNull();
  });

  it('gives nothing when the puzzle has no words', () => {
    expect(hiddenWordOf(grid, [], 0)).toBeNull();
  });

  it('does not count the same word twice towards the total', () => {
    expect(hiddenWordOf(grid, [abc, abc], 2)).toBeNull();
  });

  it('gives the cells no word covers, in reading order, and the letters they spell', () => {
    // ABC and CFI cover the first row and the last column: D, E, G, H are left.
    const hidden = hiddenWordOf(grid, [cfi, abc], 2);

    expect(hidden?.cells).toEqual([{ r: 1, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 0 }, { r: 2, c: 1 }]);
    expect(hidden?.word).toBe('DEGH');
  });

  it('does not light a cell that two words cross, and does not forget one a word only touches', () => {
    // C is crossed by ABC and CFI: it is covered, not left over. GEC adds the diagonal.
    const hidden = hiddenWordOf(grid, [abc, cfi, gec], 3);

    expect(hidden?.cells).toEqual([{ r: 1, c: 0 }, { r: 2, c: 1 }]);
    expect(hidden?.word).toBe('DH');
  });

  it('gives an empty word when the words cover the whole grid', () => {
    const rows: WordSearchFound[] = [0, 1, 2].map((r) => ({ word: `R${r}`, alias: 'a', from: { r, c: 0 }, to: { r, c: 2 } }));

    expect(hiddenWordOf(grid, rows, 3)).toEqual({ cells: [], word: '' });
  });
});
