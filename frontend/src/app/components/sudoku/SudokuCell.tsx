'use client';
import { cn } from '@/lib/utils';
import type { GridCellKeyboard } from '@/lib/useGridKeyboard';
import { BOARD_TILE } from '../games/boardStyles';

interface SudokuCellProps {
  value: number;
  bgClass: string;
  textClass: string;
  onClick: () => void;
  notes?: Record<number, string>;
  boardSize?: number;
  boxSize?: number;
  /** What a screen reader says of the cell: its row, column and number, from the board. */
  label?: string;
  /** Tab stop and arrow keys, from the board (see useGridKeyboard). */
  keyboard?: GridCellKeyboard;
}

export function SudokuCell({ value, bgClass, textClass, onClick, notes, boardSize = 9, boxSize = 3, label, keyboard }: Readonly<SudokuCellProps>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? (value !== 0 ? `Cell value ${value}` : 'Empty cell')}
      {...keyboard}
      className={cn(
        "relative flex items-center justify-center font-display text-2xl leading-none",
        "cursor-pointer select-none overflow-hidden",
        BOARD_TILE,
        bgClass,
        textClass
      )}
    >
      {value !== 0 ? value : ''}

      {value === 0 && notes && (
        <div
          className="absolute inset-0 grid w-full h-full pointer-events-none p-0.5"
          style={{
            gridTemplateColumns: `repeat(${boxSize}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${boxSize}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: boardSize }, (_, i) => i + 1).map((num) => {
            const colorClass = notes[num];
            return (
              <div
                key={num}
                className={cn(
                  "flex items-center justify-center text-[0.6rem] sm:text-xs font-semibold leading-none",
                  colorClass || "text-transparent"
                )}
              >
                {colorClass ? num : ''}
              </div>
            );
          })}
        </div>
      )}
    </button>
  );
}