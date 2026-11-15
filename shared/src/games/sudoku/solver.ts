import type { SudokuGrid } from './types';

/** A grid being solved, with the numbers already in each row, column and box, one bit per number. */
interface Marks {
  grid: SudokuGrid;
  size: number;
  boxSize: number;
  rows: number[];
  cols: number[];
  boxes: number[];
}

const boxOf = (marks: Marks, r: number, c: number) => Math.floor(r / marks.boxSize) * marks.boxSize + Math.floor(c / marks.boxSize);

const onlyOne = (mask: number) => mask !== 0 && (mask & (mask - 1)) === 0;

function place(marks: Marks, r: number, c: number, value: number): void {
  const bit = 1 << (value - 1);
  marks.grid[r][c] = value;
  marks.rows[r] |= bit;
  marks.cols[c] |= bit;
  marks.boxes[boxOf(marks, r, c)] |= bit;
}

/** The numbers that can still go in (r, c), one bit per number. */
function candidates(marks: Marks, r: number, c: number): number {
  const full = (1 << marks.size) - 1;
  return full & ~(marks.rows[r] | marks.cols[c] | marks.boxes[boxOf(marks, r, c)]);
}

/** Marks the given numbers. False when two of them clash: a puzzle with no solution, which the masks alone would hide. */
function markGivens(marks: Marks): boolean {
  const { grid, size, rows, cols, boxes } = marks;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const value = grid[r][c];
      if (value === 0) continue;
      const bit = 1 << (value - 1);
      if ((rows[r] & bit) || (cols[c] & bit) || (boxes[boxOf(marks, r, c)] & bit)) return false;
      place(marks, r, c, value);
    }
  }

  return true;
}

/** The cells of every row, column and box. */
function unitsOf(size: number, boxSize: number): [number, number][][] {
  const units: [number, number][][] = [];
  for (let i = 0; i < size; i++) {
    units.push(
      Array.from({ length: size }, (_, k): [number, number] => [i, k]),
      Array.from({ length: size }, (_, k): [number, number] => [k, i]),
      Array.from({ length: size }, (_, k): [number, number] => [
        Math.floor(i / boxSize) * boxSize + Math.floor(k / boxSize),
        (i % boxSize) * boxSize + (k % boxSize),
      ]),
    );
  }
  return units;
}

/** Fills the cells where only one number can go. True when it wrote something. */
function fillSingleCandidates(marks: Marks): boolean {
  const { grid, size } = marks;
  let progress = false;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const mask = grid[r][c] === 0 ? candidates(marks, r, c) : 0;
      if (!onlyOne(mask)) continue;
      place(marks, r, c, Math.log2(mask) + 1);
      progress = true;
    }
  }

  return progress;
}

/** Writes the numbers that can go in only one cell of a row, a column or a box. True when it wrote something. */
function fillSinglePlaces(marks: Marks, units: [number, number][][]): boolean {
  const { grid, size } = marks;
  let progress = false;

  for (const unit of units) {
    for (let value = 1; value <= size; value++) {
      const bit = 1 << (value - 1);
      const places = unit.filter(([r, c]) => grid[r][c] === 0 && (candidates(marks, r, c) & bit) !== 0);
      // A number that is already in the unit has no empty cell left that could take it.
      if (places.length !== 1) continue;
      place(marks, places[0][0], places[0][1], value);
      progress = true;
    }
  }

  return progress;
}

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
  const marks: Marks = {
    grid, size, boxSize,
    rows: new Array<number>(size).fill(0),
    cols: new Array<number>(size).fill(0),
    boxes: new Array<number>(size).fill(0),
  };

  if (!markGivens(marks)) return null;

  const units = unitsOf(size, boxSize);
  let progress = true;
  while (progress) {
    // Both deductions run on every pass, also when the first one already wrote something.
    const filledCells = fillSingleCandidates(marks);
    const filledPlaces = fillSinglePlaces(marks, units);
    progress = filledCells || filledPlaces;
  }

  return grid.every((row) => row.every((value) => value !== 0)) ? grid : null;
}
