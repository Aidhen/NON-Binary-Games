'use client';
import { FLOWER_HIDDEN } from '@nbg/shared';
import type { GameId, PlayerProfile, SudokuPuzzle } from '@nbg/shared';
import { FlowerFieldBoardUI } from '../flower-field/FlowerFieldBoardUI';
import { MemoryBoardUI } from '../memory/MemoryBoardUI';
import { SudokuBoardUI } from '../sudoku/SudokuBoardUI';
import { TakuzuBoardUI } from '../takuzu/TakuzuBoardUI';
import { WordSearchBoardUI } from '../word-search/WordSearchBoardUI';

// Two made-up players, so that the previews show what playing together looks like: flags, words and cursors in two colors.
const PROFILES: Record<string, PlayerProfile> = {
  first: { alias: 'first', animal: 'penguin', color: 'teal' },
  second: { alias: 'second', animal: 'fox', color: 'orange' },
};

const digits = (rows: readonly string[]) => rows.map((row) => row.split('').map((cell) => (cell === '.' ? 0 : Number(cell))));
const nothing = () => {};

const SUDOKU: SudokuPuzzle = {
  size: 9,
  boxSize: 3,
  initial: digits(['53..7....', '6..195...', '.98....6.', '8...6...3', '4..8.3..1', '7...2...6', '.6....28.', '...419..5', '....8..79']),
};
// The puzzle with a few numbers already written by the players.
const SUDOKU_GRID = digits(['534.7....', '6..195...', '.98....6.', '8...6...3', '4.68.3..1', '7...2...6', '.6....28.', '...419..5', '....8..79']);
const SUDOKU_SETTINGS = { highlightCrosshairs: false, highlightSameNumbers: false, showErrors: false, godMode: false };

// In a Takuzu grid 1 is the symbol "0" and 2 is the symbol "1" (see TAKUZU_DIGITS).
const TAKUZU_INITIAL = digits(['1.2..2', '.21.1.', '2..21.', '.1.1.2', '21..2.', '..12.1']);
const TAKUZU_GRID = digits(['1.2.12', '.21.1.', '2..21.', '.1.1.2', '212.2.', '..12.1']);

const H = FLOWER_HIDDEN;
const FLOWER_GRID = [
  [0, 1, H, H, H, H],
  [0, 1, 2, H, H, H],
  [0, 0, 1, 2, 3, 2],
  [1, 1, 0, 0, 0, 0],
  [H, 1, 0, 0, 1, 1],
  [H, 1, 0, 0, 1, H],
];
const FLOWER_FLAGS = { '0-2': 'first', '4-0': 'second', '5-5': 'first' };

const WORDS_GRID = ['SUNKAT', 'ROMOON', 'ELGPIE', 'STARHF', 'TBOWLG', 'CLOUDY'].map((row) => row.split(''));
const WORDS_FOUND = [
  { word: 'SUN', alias: 'first', from: { r: 0, c: 0 }, to: { r: 0, c: 2 } },
  { word: 'MOON', alias: 'second', from: { r: 1, c: 2 }, to: { r: 1, c: 5 } },
  { word: 'STAR', alias: 'first', from: { r: 3, c: 0 }, to: { r: 3, c: 3 } },
];

// A table of 16 cards (a 4×4 square, like the other previews): two are face up in the colors of the two players, one pair is found.
const MEMORY_FACES_UP = { 2: 18, 9: 17, 4: 3, 11: 3 };
const MEMORY_MATCHED = new Set([4, 11]);
const MEMORY_HELD = { 2: { alias: 'first', closesInMs: 10000 }, 9: { alias: 'second', closesInMs: 10000 } };
const MEMORY_NOTHING: ReadonlySet<number> = new Set();

const board = (game: GameId) => {
  switch (game) {
    case 'sudoku':
      return <SudokuBoardUI board={SUDOKU} playerGrid={SUDOKU_GRID} selectedCell={[4, 4]} settings={SUDOKU_SETTINGS} isGameWon={false} onCellClick={nothing} isErrorPlacement={() => false} othersSelections={{ second: [2, 6] }} profiles={PROFILES} />;
    case 'takuzu':
      return <TakuzuBoardUI size={6} grid={TAKUZU_GRID} initial={TAKUZU_INITIAL} selectedCell={[2, 2]} conflicts={new Set()} isGameWon={false} onCellClick={nothing} othersSelections={{ second: [4, 3] }} profiles={PROFILES} />;
    case 'flower-field':
      return <FlowerFieldBoardUI size={6} grid={FLOWER_GRID} flags={FLOWER_FLAGS} mines={[]} exploded={null} selectedCell={[1, 3]} isOver={false} onCellClick={nothing} othersSelections={{ second: [5, 0] }} profiles={PROFILES} />;
    case 'word-search':
      return <WordSearchBoardUI size={6} grid={WORDS_GRID} found={WORDS_FOUND} profiles={PROFILES} isOver={false} onSelect={nothing} />;
    case 'memory':
      return (
        // The board fills its box: a square, so that the preview is as tall as the others.
        <div className="aspect-square w-full">
          <MemoryBoardUI cards={16} faces={MEMORY_FACES_UP} matched={MEMORY_MATCHED} locked={MEMORY_NOTHING} held={MEMORY_HELD} pending={null} self="first" profiles={PROFILES} onFlip={nothing} />
        </div>
      );
  }
};

/**
 * A moment of a game, as two players would see it. It is the board of the game itself, with made-up
 * numbers, so the preview cannot look different from the real thing. It is a picture: it takes no clicks
 * and no focus, and assistive technology skips it (the rules next to it say the same in words).
 */
export function GamePreview({ game }: Readonly<{ game: GameId }>) {
  return (
    <div inert aria-hidden="true" data-testid="game-preview" className="w-full max-w-xs p-1">
      {board(game)}
    </div>
  );
}
