import { FLOWER_HIDDEN } from './types';
import type { FlowerGrid, FlowerMines } from './types';
import { countOpenCells, createHiddenGrid, neighboursOf, openCells } from './board';

interface Constraint {
  r: number;
  c: number;
  /** Mines still to find among the unknown cells around an open cell. */
  need: number;
  /** The closed cells around it that are not known to be mines yet, as `r * size + c`. */
  unknown: number[];
}

/** What the solver knows about a field while it plays it. */
interface Play {
  mines: FlowerMines;
  grid: FlowerGrid;
  /** The closed cells it knows to be mines, as `r * size + c`. */
  known: Set<number>;
  /** Whether a cell was opened or a mine was found since the flag was last put down. */
  progress: boolean;
}

function open(play: Play, cells: number[]): void {
  const size = play.grid.length;
  for (const cell of cells) {
    const r = Math.floor(cell / size);
    const c = cell % size;
    if (play.grid[r][c] !== FLOWER_HIDDEN) continue;
    openCells(play.mines, play.grid, r, c);
    play.progress = true;
  }
}

function markAsMines(play: Play, cells: number[]): void {
  for (const cell of cells) {
    if (play.known.has(cell)) continue;
    play.known.add(cell);
    play.progress = true;
  }
}

/** Cells that hold no mine are opened, cells that are all mines are marked. False when it is neither: nothing is known yet. */
function settle(play: Play, cells: number[], minesAmongThem: number): boolean {
  if (minesAmongThem === 0) open(play, cells);
  else if (minesAmongThem === cells.length) markAsMines(play, cells);
  else return false;
  return true;
}

/** What the open cell (r, c) says about the closed cells around it, or null when it says nothing new. */
function constraintOf(play: Play, r: number, c: number): Constraint | null {
  const size = play.grid.length;
  if (play.grid[r][c] <= 0) return null;

  const unknown: number[] = [];
  let found = 0;
  for (const [nr, nc] of neighboursOf(size, r, c)) {
    if (play.grid[nr][nc] !== FLOWER_HIDDEN) continue;
    if (play.known.has(nr * size + nc)) found++;
    else unknown.push(nr * size + nc);
  }
  if (unknown.length === 0) return null;

  return { r, c, need: play.grid[r][c] - found, unknown };
}

/** The first deduction, on every number of the field. It gives back the numbers it could not settle on their own. */
function settleNumbers(play: Play): Constraint[] {
  const size = play.grid.length;
  const constraints: Constraint[] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const constraint = constraintOf(play, r, c);
      if (constraint && !settle(play, constraint.unknown, constraint.need)) constraints.push(constraint);
    }
  }

  return constraints;
}

/** Whether every unknown cell of `small` is also one of `big`, which has more of them. */
function isInside(small: Constraint, big: Constraint): boolean {
  if (small === big || small.unknown.length >= big.unknown.length) return false;
  // Cells that are not close cannot share an unknown cell.
  if (Math.abs(small.r - big.r) > 2 || Math.abs(small.c - big.c) > 2) return false;
  return small.unknown.every((cell) => big.unknown.includes(cell));
}

/** The second deduction, on every pair of numbers the first one left. */
function settlePairs(play: Play, constraints: Constraint[]): void {
  for (const small of constraints) {
    for (const big of constraints) {
      if (!isInside(small, big)) continue;

      const rest = big.unknown.filter((cell) => !small.unknown.includes(cell));
      settle(play, rest, big.need - small.need);
    }
  }
}

/**
 * Plays a field from its first move with the two deductions a person uses, and nothing else:
 *  - a number that has all its mines already found: the other cells around it are safe; a number that needs as
 *    many mines as it has unknown cells: they are all mines;
 *  - two numbers where the unknown cells of one are among those of the other: what is left of the bigger one has
 *    the difference of their mines, which settles it when that is none or all of them.
 * It never guesses. True means that every safe cell can be opened this way, so a player never has to guess.
 */
export function canBeSolvedWithoutGuessing(mines: FlowerMines, firstR: number, firstC: number): boolean {
  const size = mines.length;
  const mineCount = mines.flat().filter(Boolean).length;
  const play: Play = { mines, grid: createHiddenGrid(size), known: new Set<number>(), progress: true };

  openCells(mines, play.grid, firstR, firstC);

  while (play.progress) {
    play.progress = false;
    // What a constraint says stays true after cells were opened or found in this pass, so none of them is stale.
    settlePairs(play, settleNumbers(play));
  }

  return countOpenCells(play.grid) === size * size - mineCount;
}
