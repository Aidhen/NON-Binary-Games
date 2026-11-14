import type { SudokuGrid } from './types';

/**
 * Finishes a puzzle with the two basic deductions and nothing else, or gives up (null) when they get stuck:
 *  - a cell where only one number can go (the other numbers are in its row, column or box);
 *  - a number that can go in only one cell of a row, a column or a box.
 * It never guesses. A puzzle it finishes can therefore be solved by a person without trial and error, and has
 * exactly one solution: each number it writes is forced by the givens, so any solution must have it.
 * It returns a new grid and leaves the one it is given as it is.
 */
export function solveWithSingles(puzzle: SudokuGrid, size: number, boxSize: number): SudokuGrid | null {
  const grid = puzzle.map((row) => [...row]);
  const full = (1 << size) - 1;
  // The numbers already in each row, column and box, one bit per number.
  const rows = new Array<number>(size).fill(0);
  const cols = new Array<number>(size).fill(0);
  const boxes = new Array<number>(size).fill(0);
  const boxOf = (r: number, c: number) => Math.floor(r / boxSize) * boxSize + Math.floor(c / boxSize);

  const place = (r: number, c: number, value: number) => {
    const bit = 1 << (value - 1);
    grid[r][c] = value;
    rows[r] |= bit;
    cols[c] |= bit;
    boxes[boxOf(r, c)] |= bit;
  };
  const candidates = (r: number, c: number) => full & ~(rows[r] | cols[c] | boxes[boxOf(r, c)]);
  const onlyOne = (mask: number) => mask !== 0 && (mask & (mask - 1)) === 0;

  // Given numbers that clash make a puzzle with no solution: the masks alone would hide it.
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const value = grid[r][c];
      if (value === 0) continue;
      const bit = 1 << (value - 1);
      if ((rows[r] & bit) || (cols[c] & bit) || (boxes[boxOf(r, c)] & bit)) return null;
      place(r, c, value);
    }
  }

  // The cells of every row, column and box.
  const units: [number, number][][] = [];
  for (let i = 0; i < size; i++) {
    units.push(Array.from({ length: size }, (_, k): [number, number] => [i, k]));
    units.push(Array.from({ length: size }, (_, k): [number, number] => [k, i]));
    units.push(Array.from({ length: size }, (_, k): [number, number] => [
      Math.floor(i / boxSize) * boxSize + Math.floor(k / boxSize),
      (i % boxSize) * boxSize + (k % boxSize),
    ]));
  }

  let progress = true;
  while (progress) {
    progress = false;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const mask = grid[r][c] === 0 ? candidates(r, c) : 0;
        if (!onlyOne(mask)) continue;
        place(r, c, Math.log2(mask) + 1);
        progress = true;
      }
    }

    for (const unit of units) {
      for (let value = 1; value <= size; value++) {
        const bit = 1 << (value - 1);
        const places = unit.filter(([r, c]) => grid[r][c] === 0 && (candidates(r, c) & bit) !== 0);
        // A number that is already in the unit has no empty cell left that could take it.
        if (places.length !== 1) continue;
        place(places[0][0], places[0][1], value);
        progress = true;
      }
    }
  }

  return grid.every((row) => row.every((value) => value !== 0)) ? grid : null;
}
