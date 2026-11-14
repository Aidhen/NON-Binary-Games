import { describe, expect, it } from 'vitest';
import { FLOWER_HIDDEN, FLOWER_MARKED } from '@nbg/shared';
import type { RoomGame } from './roomStore';
import { createFlowerField, flowerFieldStarted, isRevealable, minesOf, revealCell, setExplosive, toggleFlag } from './flowerField';

/** An 8x8 field (the beginner level, with its 8 mines) where the mines are in these cells: no luck involved. */
const fieldWithMines = (...cells: [number, number][]) => {
  const game = createFlowerField('beginner');
  game.mines = Array.from({ length: game.size }, () => new Array<boolean>(game.size).fill(false));
  cells.forEach(([r, c]) => { game.mines![r][c] = true; });
  return game;
};

/** All the mines on the first row: opening a cell of the last row opens everything else. */
const ROW_OF_MINES: [number, number][] = Array.from({ length: 8 }, (_, c) => [0, c]);

describe('createFlowerField', () => {
  it('starts with every cell closed, no mines laid out yet, and the option to lose off', () => {
    const game = createFlowerField('beginner');

    expect(game).toMatchObject({ id: 'flower-field', difficulty: 'beginner', size: 8, mineCount: 8, explosive: false, mines: null, openedCells: 0, status: 'playing' });
    expect(game.grid.flat().every((value) => value === FLOWER_HIDDEN)).toBe(true);
    expect(game.flags.size).toBe(0);
  });

  it('keeps the option to lose from the game the room was playing, and only from a Flower Field', () => {
    const before = createFlowerField('easy');
    before.explosive = true;

    expect(createFlowerField('hard', before).explosive).toBe(true);
    expect(createFlowerField('hard', { id: 'sudoku' } as RoomGame).explosive).toBe(false);
  });

  it('makes a bigger field for a higher level', () => {
    expect(createFlowerField('expert').size).toBeGreaterThan(createFlowerField('beginner').size);
  });
});

describe('revealCell', () => {
  it('lays out the mines at the first cell, with that cell free, and opens an area', () => {
    const game = createFlowerField('beginner');

    const result = revealCell(game, 3, 4);

    expect(game.mines).not.toBeNull();
    expect(minesOf(game)).toHaveLength(game.mineCount);
    expect(game.mines![3][4]).toBe(false);
    expect(result!.cells.length).toBeGreaterThan(1);
    expect(game.grid[3][4]).toBe(0);
  });

  it('does not change the field when it cannot be laid out: the cell can be tried again', () => {
    const game = createFlowerField('beginner');
    game.mineCount = 1000;

    expect(() => revealCell(game, 0, 0)).toThrow('no room');

    expect(game.mines).toBeNull();
    expect(game.grid.flat().every((value) => value === FLOWER_HIDDEN)).toBe(true);
    expect(game.status).toBe('playing');
  });

  it('marks a mine instead of opening it, and the game goes on', () => {
    const game = fieldWithMines(...ROW_OF_MINES);

    const result = revealCell(game, 0, 3);

    expect(result).toEqual({ cells: [{ r: 0, c: 3, v: FLOWER_MARKED }], lost: null, won: false });
    expect(game.grid[0][3]).toBe(FLOWER_MARKED);
    expect(game.status).toBe('playing');
    expect(game.openedCells).toBe(0);
  });

  it('refuses a cell that is already open or marked', () => {
    const game = fieldWithMines(...ROW_OF_MINES);
    revealCell(game, 0, 3);
    revealCell(game, 1, 1);

    expect(revealCell(game, 0, 3)).toBeNull();
    expect(revealCell(game, 1, 1)).toBeNull();
  });

  it('loses the game when the option is on, and says which mine it was', () => {
    const game = fieldWithMines(...ROW_OF_MINES);
    game.explosive = true;

    const result = revealCell(game, 0, 5);

    expect(result).toEqual({ cells: [], lost: [0, 5], won: false });
    expect(game.status).toBe('lost');
    expect(revealCell(game, 7, 7)).toBeNull();
  });

  it('refuses a cell with a flag until the flag is taken off', () => {
    const game = fieldWithMines(...ROW_OF_MINES);
    toggleFlag(game, 7, 7, 'alias-a');

    expect(isRevealable(game, 7, 7)).toBe(false);
    expect(revealCell(game, 7, 7)).toBeNull();

    toggleFlag(game, 7, 7, 'alias-a');
    expect(revealCell(game, 7, 7)).not.toBeNull();
  });

  it('takes the flags off the cells that open on their own', () => {
    const game = fieldWithMines(...ROW_OF_MINES);
    toggleFlag(game, 3, 3, 'alias-a');

    revealCell(game, 7, 7);

    expect(game.flags.has('3-3')).toBe(false);
  });

  it('wins when every cell that is not a mine is open, and then refuses everything', () => {
    const game = fieldWithMines(...ROW_OF_MINES);

    const result = revealCell(game, 7, 7);

    expect(result!.won).toBe(true);
    expect(game.openedCells).toBe(56);
    expect(game.status).toBe('won');
    expect(game.grid[0].every((value) => value === FLOWER_HIDDEN)).toBe(true);
    expect(toggleFlag(game, 0, 0, 'alias-a')).toBeNull();
  });

  it('counts a marked mine as no progress towards the win', () => {
    const game = fieldWithMines(...ROW_OF_MINES);
    revealCell(game, 0, 0);

    expect(game.openedCells).toBe(0);
    expect(revealCell(game, 7, 7)!.won).toBe(true);
  });
});

describe('toggleFlag', () => {
  it('puts a flag with the alias of the player, and takes it off', () => {
    const game = createFlowerField('beginner');

    expect(toggleFlag(game, 2, 2, 'alias-a')).toEqual({ alias: 'alias-a' });
    expect(game.flags.get('2-2')).toBe('alias-a');

    // Anybody can take a flag off: the field is the room's.
    expect(toggleFlag(game, 2, 2, 'alias-b')).toEqual({ alias: null });
    expect(game.flags.size).toBe(0);
  });

  it('does not flag a cell that is open or marked', () => {
    const game = fieldWithMines(...ROW_OF_MINES);
    revealCell(game, 0, 1);
    revealCell(game, 1, 1);

    expect(toggleFlag(game, 0, 1, 'alias-a')).toBeNull();
    expect(toggleFlag(game, 1, 1, 'alias-a')).toBeNull();
  });
});

describe('setExplosive', () => {
  it('changes the option while nothing is open', () => {
    const game = createFlowerField('beginner');

    expect(setExplosive(game, true)).toBe(true);
    expect(game.explosive).toBe(true);
  });

  it('does not change it once the first cell was opened', () => {
    const game = createFlowerField('beginner');
    revealCell(game, 3, 3);

    expect(setExplosive(game, true)).toBe(false);
    expect(game.explosive).toBe(false);
  });
});

describe('flowerFieldStarted', () => {
  it('tells what the players see, and never where the mines are while the game is on', () => {
    const game = fieldWithMines(...ROW_OF_MINES);
    toggleFlag(game, 5, 5, 'alias-a');

    const payload = flowerFieldStarted(game);

    expect(payload).toMatchObject({ game: 'flower-field', size: 8, mineCount: 8, difficulty: 'beginner', explosive: false, status: 'playing', flags: { '5-5': 'alias-a' }, mines: [] });
    expect(payload.grid).toBe(game.grid);
  });

  it('tells where the mines are once the game is lost, and not before', () => {
    const game = fieldWithMines(...ROW_OF_MINES);
    game.explosive = true;
    expect(flowerFieldStarted(game).mines).toEqual([]);

    revealCell(game, 0, 2);

    expect(flowerFieldStarted(game)).toMatchObject({ status: 'lost', mines: ROW_OF_MINES });
  });
});

describe('minesOf', () => {
  it('is empty before the mines are laid out', () => {
    expect(minesOf(createFlowerField('beginner'))).toEqual([]);
  });
});
