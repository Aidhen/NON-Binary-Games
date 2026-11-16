import type { GameId } from '@nbg/shared';
import { cn } from '@/lib/utils';

interface PreviewBoard {
  columns: number;
  /** One string per cell, row by row. An empty string is an empty cell. */
  cells: readonly string[];
  /** Cells that look different from a plain one: closed (Flower Field) or part of a found word (Word Search). */
  marked?: ReadonlySet<number>;
  /** Where two other players are looking. */
  rings: readonly [number, number];
}

const row = (text: string) => text.split('').map((cell) => (cell === '.' ? '' : cell));

// A moment of a game, small enough to read at a glance. These are pictures, not puzzles: nothing here is solved or checked.
const BOARDS: Readonly<Record<GameId, PreviewBoard>> = {
  sudoku: {
    columns: 9,
    cells: ['53..7....', '6..195...', '.98....6.', '8...6...3', '4..8.3..1', '7...2...6', '.6....28.', '...419..5', '....8..79'].flatMap(row),
    rings: [20, 49],
  },
  takuzu: {
    columns: 6,
    cells: ['0.1..1', '.10.0.', '1..10.', '.0.0.1', '10..1.', '..01.0'].flatMap(row),
    rings: [7, 22],
  },
  'flower-field': {
    columns: 6,
    cells: ['.1⚑...', '.12...', '..1232', '11...1', '⚑1..11', '.1..1⚑'].flatMap(row),
    marked: new Set([2, 3, 4, 5, 9, 10, 11, 24, 30, 35]),
    rings: [14, 27],
  },
  'word-search': {
    columns: 6,
    cells: ['SUNKAT', 'ROMOON', 'ELGPIE', 'STARHF', 'TBOWLG', 'CLOUDY'].flatMap(row),
    marked: new Set([0, 1, 2, 8, 9, 10, 11, 18, 19, 20, 21, 30, 31, 32, 33, 34]),
    rings: [13, 26],
  },
};

const RING = ["ring-[var(--player-teal)]", "ring-[var(--player-orange)]"];

/** A small still picture of a game, as two players would see it. Decoration: the rules next to it say the same in words. */
export function GamePreview({ game }: Readonly<{ game: GameId }>) {
  const { columns, cells, marked, rings } = BOARDS[game];

  return (
    <div
      aria-hidden="true"
      data-testid="game-preview"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      className="grid w-full max-w-xs gap-1 rounded-[var(--radius-paper)] bg-[var(--paper-well)] p-2"
    >
      {cells.map((cell, index) => (
        <span
          key={index}
          className={cn(
            "flex aspect-square items-center justify-center rounded-md text-xs font-extrabold leading-none text-[var(--title-text)] sm:text-sm",
            marked?.has(index) ? "bg-[var(--cell-background-selected)]" : "bg-[var(--cell-background)]",
            rings.includes(index) && cn("ring-3 ring-inset", RING[rings.indexOf(index)])
          )}
        >
          {cell}
        </span>
      ))}
    </div>
  );
}
