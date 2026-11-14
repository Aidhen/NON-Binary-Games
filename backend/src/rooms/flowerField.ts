import { FLOWER_HIDDEN, FLOWER_MARKED, createHiddenGrid, getFlowerFieldLevel, layMines, openCells } from "@nbg/shared";
import type { DifficultyLevel, FlowerCellChange, FlowerFieldStartedPayload } from "@nbg/shared";
import type { FlowerFieldGame, RoomGame } from "./roomStore";

const keyOf = (r: number, c: number) => `${r}-${c}`;

/** `previous` is the game the room was playing: the option to lose is a choice of the table, so it stays. */
export const createFlowerField = (difficulty: DifficultyLevel, previous?: RoomGame): FlowerFieldGame => {
  const { size, mines } = getFlowerFieldLevel(difficulty);
  return {
    id: 'flower-field',
    difficulty,
    size,
    mineCount: mines,
    explosive: previous?.id === 'flower-field' ? previous.explosive : false,
    mines: null,
    grid: createHiddenGrid(size),
    flags: new Map(),
    openedCells: 0,
    status: 'playing',
  };
};

/** Where the mines are, as the players are told when the game is lost. */
export const minesOf = (game: FlowerFieldGame): [number, number][] => {
  const found: [number, number][] = [];
  game.mines?.forEach((row, r) => row.forEach((isMine, c) => { if (isMine) found.push([r, c]); }));
  return found;
};

/** What the players are told about the game: the mines only once they cannot spoil it any more. */
export const flowerFieldStarted = (game: FlowerFieldGame): FlowerFieldStartedPayload => ({
  game: 'flower-field',
  size: game.size,
  mineCount: game.mineCount,
  difficulty: game.difficulty,
  explosive: game.explosive,
  grid: game.grid,
  flags: Object.fromEntries(game.flags),
  status: game.status,
  mines: game.status === 'lost' ? minesOf(game) : [],
});

/** A cell can be opened while the game is on, if it is closed and has no flag: a flag has to be taken off first. */
export const isRevealable = (game: FlowerFieldGame, r: number, c: number): boolean =>
  game.status === 'playing' && game.grid[r][c] === FLOWER_HIDDEN && !game.flags.has(keyOf(r, c));

export interface RevealResult {
  /** The cells that opened or were marked, to tell the room. */
  cells: FlowerCellChange[];
  /** The mine that was opened, when the option to lose is on. */
  lost: [number, number] | null;
  won: boolean;
}

/**
 * Opens a cell. Returns null when the move does not apply. It throws when it is the first cell and no field could
 * be laid out: nothing has changed then, and the cell can be tried again.
 */
export const revealCell = (game: FlowerFieldGame, r: number, c: number): RevealResult | null => {
  if (!isRevealable(game, r, c)) return null;

  // Laid out now and not when the game starts, so that the first cell is never a mine.
  game.mines ??= layMines(game.size, game.mineCount, r, c);

  if (game.mines[r][c]) {
    if (game.explosive) {
      game.status = 'lost';
      return { cells: [], lost: [r, c], won: false };
    }
    game.grid[r][c] = FLOWER_MARKED;
    return { cells: [{ r, c, v: FLOWER_MARKED }], lost: null, won: false };
  }

  const cells = openCells(game.mines, game.grid, r, c);
  // A flag on a cell that opens by itself was a wrong one: it goes with the cell.
  for (const cell of cells) game.flags.delete(keyOf(cell.r, cell.c));
  game.openedCells += cells.length;

  const won = game.openedCells === game.size * game.size - game.mineCount;
  if (won) game.status = 'won';
  return { cells, lost: null, won };
};

/** Puts a flag on a closed cell, or takes it off. Returns who has it now (null for nobody), or null when the move does not apply. */
export const toggleFlag = (game: FlowerFieldGame, r: number, c: number, alias: string): { alias: string | null } | null => {
  if (game.status !== 'playing' || game.grid[r][c] !== FLOWER_HIDDEN) return null;

  if (game.flags.delete(keyOf(r, c))) return { alias: null };
  game.flags.set(keyOf(r, c), alias);
  return { alias };
};

/** The option to lose can only change before the first cell is opened: after that the board is in play. */
export const setExplosive = (game: FlowerFieldGame, explosive: boolean): boolean => {
  if (game.mines !== null || game.status !== 'playing') return false;

  game.explosive = explosive;
  return true;
};
