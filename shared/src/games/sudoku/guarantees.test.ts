import { describe, expect, it } from 'vitest';
import { DIFFICULTIES } from './types';
import type { Difficulty, SudokuGrid } from './types';
import { generateSudoku, getCluesCount } from './generator';
import { solveWithSingles } from './solver';

/**
 * What the game promises about every puzzle it makes: exactly one solution, and a way to finish it by deduction,
 * without ever guessing. These tests check that with two checkers that share no code with the generator or the
 * solver of the game, so that a defect in one cannot hide in the other.
 */

// ---- the independent checkers -------------------------------------------------------------------------

const rootOf = (size: number) => Math.round(Math.sqrt(size));

/** Counts the solutions of a puzzle and stops at `limit`. Bit masks per row, column and box; the cell with the fewest candidates first. */
const countSolutions = (puzzle: SudokuGrid, limit = 2): number => {
  const n = puzzle.length;
  const b = rootOf(n);
  const full = (1 << n) - 1;
  const cells = puzzle.map((row) => [...row]);
  const rows = new Array<number>(n).fill(0);
  const cols = new Array<number>(n).fill(0);
  const boxes = new Array<number>(n).fill(0);
  const boxOf = (r: number, c: number) => Math.floor(r / b) * b + Math.floor(c / b);
  const bitCount = (x: number) => { let k = 0; for (let v = x; v; v &= v - 1) k++; return k; };

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const value = cells[r][c];
      if (value === 0) continue;
      const bit = 1 << (value - 1);
      if ((rows[r] & bit) || (cols[c] & bit) || (boxes[boxOf(r, c)] & bit)) return 0;
      rows[r] |= bit; cols[c] |= bit; boxes[boxOf(r, c)] |= bit;
    }
  }

  const search = (): number => {
    let bestR = -1, bestC = -1, bestMask = 0, bestCount = n + 1;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (cells[r][c] !== 0) continue;
        const mask = full & ~(rows[r] | cols[c] | boxes[boxOf(r, c)]);
        const count = bitCount(mask);
        if (count === 0) return 0;
        if (count < bestCount) { bestCount = count; bestR = r; bestC = c; bestMask = mask; }
      }
    }
    if (bestR === -1) return 1;

    let found = 0;
    for (let digit = 1; digit <= n && found < limit; digit++) {
      const bit = 1 << (digit - 1);
      if (!(bestMask & bit)) continue;
      cells[bestR][bestC] = digit;
      rows[bestR] |= bit; cols[bestC] |= bit; boxes[boxOf(bestR, bestC)] |= bit;
      found += search();
      cells[bestR][bestC] = 0;
      rows[bestR] &= ~bit; cols[bestC] &= ~bit; boxes[boxOf(bestR, bestC)] &= ~bit;
    }
    return found;
  };

  return search();
};

/** Finishes a puzzle with the two basic deductions only, or returns null. Plain candidate sets, recomputed at every step: slow and simple on purpose. */
const deduce = (puzzle: SudokuGrid): SudokuGrid | null => {
  const n = puzzle.length;
  const b = rootOf(n);
  const grid = puzzle.map((row) => [...row]);
  const digits = Array.from({ length: n }, (_, i) => i + 1);
  const sameBox = (r1: number, c1: number, r2: number, c2: number) => Math.floor(r1 / b) === Math.floor(r2 / b) && Math.floor(c1 / b) === Math.floor(c2 / b);

  const units: [number, number][][] = [];
  for (let i = 0; i < n; i++) {
    units.push(digits.map((_, j): [number, number] => [i, j]));
    units.push(digits.map((_, j): [number, number] => [j, i]));
  }
  for (let br = 0; br < b; br++) {
    for (let bc = 0; bc < b; bc++) {
      const unit: [number, number][] = [];
      for (let i = 0; i < b; i++) for (let j = 0; j < b; j++) unit.push([br * b + i, bc * b + j]);
      units.push(unit);
    }
  }

  // Two given numbers that clash: no solution.
  for (const unit of units) {
    const seen = unit.map(([r, c]) => grid[r][c]).filter((v) => v !== 0);
    if (new Set(seen).size !== seen.length) return null;
  }

  const candidatesOfAll = () => {
    const all = new Map<string, Set<number>>();
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (grid[r][c] !== 0) continue;
        const taken = new Set<number>();
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          if (i === r || j === c || sameBox(r, c, i, j)) taken.add(grid[i][j]);
        }
        all.set(`${r},${c}`, new Set(digits.filter((d) => !taken.has(d))));
      }
    }
    return all;
  };

  for (;;) {
    const candidates = candidatesOfAll();
    if (candidates.size === 0) break;

    const naked = [...candidates].find(([, options]) => options.size === 1);
    if (naked) {
      const [r, c] = naked[0].split(',').map(Number);
      grid[r][c] = [...naked[1]][0];
      continue;
    }

    let placed = false;
    for (const unit of units) {
      for (const d of digits) {
        if (unit.some(([r, c]) => grid[r][c] === d)) continue;
        const where = unit.filter(([r, c]) => candidates.get(`${r},${c}`)?.has(d));
        if (where.length === 1) { grid[where[0][0]][where[0][1]] = d; placed = true; break; }
      }
      if (placed) break;
    }
    if (!placed) break;
  }

  return grid.every((row) => row.every((v) => v !== 0)) ? grid : null;
};

// ---- helpers -------------------------------------------------------------------------------------------

const parse = (text: string, size = 9): SudokuGrid =>
  Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => Number(text[r * size + c])));
const show = (grid: SudokuGrid) => grid.map((row) => row.join('')).join('\n');
const clues = (grid: SudokuGrid) => grid.flat().filter((v) => v !== 0).length;

const EASY = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
const EASY_SOLUTION = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';
// Unique solution, but at the start no cell has one candidate and no number has one place.
const NEEDS_A_GUESS = '097000000000014000301702000006000000030400007000090831000007350400000008810000060';

// ---- the checkers must be right first -----------------------------------------------------------------

describe('the independent checkers', () => {
  it('count one solution for a puzzle that has one', () => {
    expect(countSolutions(parse(EASY))).toBe(1);
    expect(countSolutions(parse(NEEDS_A_GUESS))).toBe(1);
  });

  it('count more than one for a puzzle that has many', () => {
    expect(countSolutions(parse('0'.repeat(16), 4))).toBe(2);
    expect(countSolutions(parse('0'.repeat(81)))).toBe(2);
  });

  it('count exactly two for a puzzle that has exactly two (a rectangle that can be swapped)', () => {
    const twoSolutions = parse('0204' + '0402' + '2143' + '4321', 4);

    expect(countSolutions(twoSolutions, 10)).toBe(2);
  });

  it('count none for a puzzle with clashing numbers or with a cell where nothing fits', () => {
    expect(countSolutions(parse('55' + '0'.repeat(79)))).toBe(0);

    const stuck = parse('0'.repeat(81));
    for (let c = 0; c < 8; c++) stuck[0][c] = c + 1;
    stuck[1][8] = 9;
    expect(countSolutions(stuck)).toBe(0);
  });

  it('deduce the easy puzzle to its solution, and give up on the one that needs a guess', () => {
    expect(deduce(parse(EASY))).toEqual(parse(EASY_SOLUTION));
    expect(deduce(parse(NEEDS_A_GUESS))).toBeNull();
    expect(deduce(parse('0'.repeat(81)))).toBeNull();
  });

  it('deduce nothing from clashing numbers', () => {
    expect(deduce(parse('55' + '0'.repeat(79)))).toBeNull();
  });
});

describe('the fixture of a puzzle that needs a guess', () => {
  it('has exactly one solution, 24 given numbers, and cannot be finished by deduction', () => {
    const puzzle = parse(NEEDS_A_GUESS);

    expect(clues(puzzle)).toBe(24);
    expect(countSolutions(puzzle)).toBe(1);
    expect(deduce(puzzle)).toBeNull();
    expect(solveWithSingles(puzzle, 9, 3)).toBeNull();
  });
});

describe('the solver of the game and the independent deducer', () => {
  // Puzzles with one solution made by a rule that does not care about deduction: some are finished by the two
  // basic deductions and some are not, so that both answers are compared.
  const uniquePuzzle = (solution: SudokuGrid, target: number): SudokuGrid => {
    const grid = solution.map((row) => [...row]);
    const order = Array.from({ length: 81 }, (_, i) => i).sort(() => Math.random() - 0.5);
    let left = 81;
    for (const index of order) {
      if (left <= target) break;
      const [r, c] = [Math.floor(index / 9), index % 9];
      const value = grid[r][c];
      grid[r][c] = 0;
      if (countSolutions(grid) === 1) left--; else grid[r][c] = value;
    }
    return grid;
  };

  it('agree on whether a puzzle can be finished by deduction, and on how', () => {
    let finished = 0;
    let stuck = 0;

    for (let i = 0; i < 40; i++) {
      const { solution } = generateSudoku('easy');
      const puzzle = uniquePuzzle(solution, 26);
      const ours = solveWithSingles(puzzle, 9, 3);
      const theirs = deduce(puzzle);

      expect(ours === null, show(puzzle)).toBe(theirs === null);
      if (ours) { expect(ours, show(puzzle)).toEqual(theirs); expect(ours).toEqual(solution); finished++; } else stuck++;
    }

    // Both outcomes were really compared.
    expect(finished).toBeGreaterThan(0);
    expect(stuck).toBeGreaterThan(0);
  }, 120_000);
});

// ---- the promise, level by level ----------------------------------------------------------------------

describe.each(DIFFICULTIES)('a %s puzzle', (level: Difficulty) => {
  const boards = (size: number, count: number) => Array.from({ length: count }, () => generateSudoku(level, size));

  it.each([[9, 25], [4, 60]])('on a grid of side %d (%d boards) has exactly one solution, and it is the stored one', (size, count) => {
    for (const { initial, solution } of boards(size, count)) {
      expect(countSolutions(initial), show(initial)).toBe(1);
      expect(countSolutions(solution), show(solution)).toBe(1);
      // The stored solution is the one solution: put it back and nothing clashes, and every given is in it.
      for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
        if (initial[r][c] !== 0) expect(initial[r][c], show(initial)).toBe(solution[r][c]);
      }
    }
  }, 120_000);

  it.each([[9, 25], [4, 60]])('on a grid of side %d (%d boards) can be finished by deduction alone, on the stored solution', (size, count) => {
    for (const { initial, solution } of boards(size, count)) {
      expect(deduce(initial), show(initial)).toEqual(solution);
      expect(solveWithSingles(initial, size, rootOf(size)), show(initial)).toEqual(solution);
    }
  }, 120_000);

  it('on a 9x9 grid gives the number of clues of its level', () => {
    const target = getCluesCount(level, 9);
    // The hardest levels may keep a few more clues than asked: a number is only taken out when deduction still works.
    const room = level === 'hard' || level === 'expert' ? 4 : 0;

    for (const { initial } of boards(9, 25)) {
      expect(clues(initial), show(initial)).toBeGreaterThanOrEqual(target);
      expect(clues(initial), show(initial)).toBeLessThanOrEqual(target + room);
    }
  }, 120_000);
});
