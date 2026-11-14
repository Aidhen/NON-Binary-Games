'use client';
import { useMemo } from 'react';
import type { PlayerProfile } from '@nbg/shared';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { UNKNOWN_PLAYER_STYLE, styleOfColor } from '@/lib/playerPalette';

/** What a cell shows for each value: the two symbols of the game are written 0 and 1, and the value 0 is "empty". */
export const TAKUZU_DIGITS: Record<number, string> = { 1: '0', 2: '1' };

interface TakuzuBoardUIProps {
  size: number;
  grid: number[][];
  /** The cells the puzzle gave: they cannot be changed and are drawn bolder. */
  initial: number[][];
  selectedCell: [number, number] | null;
  /** Cells that break a rule, as `r-c`. Empty when the player does not want to see them. */
  conflicts: Set<string>;
  isGameWon: boolean;
  onCellClick: (r: number, c: number) => void;
  othersSelections?: Record<string, [number, number]>;
  /** Every player the page has seen in the room, by alias: the color of a cursor comes from here. */
  profiles?: Record<string, PlayerProfile>;
  /** The player being pointed out for a moment: their cursor stands out. */
  highlightedAlias?: string | null;
}

export function TakuzuBoardUI({ size, grid, initial, selectedCell, conflicts, isGameWon, onCellClick, othersSelections = {}, profiles = {}, highlightedAlias = null }: Readonly<TakuzuBoardUIProps>) {
  const { t } = useTranslation();

  // The list comes from the server and an alias is a key of it: only a key it really has counts.
  const styleOf = (alias: string) => (Object.hasOwn(profiles, alias) ? styleOfColor(profiles[alias].color) : UNKNOWN_PLAYER_STYLE);

  const occupants = useMemo(() => {
    const map = new Map<string, string>();
    for (const [alias, [r, c]] of Object.entries(othersSelections)) map.set(`${r}-${c}`, alias);
    return map;
  }, [othersSelections]);

  const labelOf = (r: number, c: number, value: number) =>
    `${t('takuzu.cell').replace('{row}', String(r + 1)).replace('{column}', String(c + 1)).replace('{value}', value === 0 ? t('takuzu.empty') : TAKUZU_DIGITS[value] ?? '')}`;

  return (
    <div className="relative w-full aspect-square">
      <div
        className={cn(
          "w-full h-full grid overflow-hidden rounded-2xl",
          "border-4 border-[var(--grid-border-outer)] shadow-[var(--shadow-paper)]"
        )}
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {grid.map((row, r) => row.map((value, c) => {
          const isGiven = initial[r][c] !== 0;
          const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
          const isConflict = value !== 0 && !isGiven && conflicts.has(`${r}-${c}`);
          const occupant = occupants.get(`${r}-${c}`);

          let ringClass = '';
          if (occupant) {
            const style = styleOf(occupant);
            ringClass = cn('ring-inset z-10', occupant === highlightedAlias ? 'ring-8 motion-safe:animate-pulse' : 'ring-4', style.ring, isSelected ? '' : style.tint);
          }

          return (
            <button
              key={`${r}-${c}`}
              type="button"
              aria-label={labelOf(r, c, value)}
              onClick={() => !isGameWon && onCellClick(r, c)}
              className={cn(
                "relative flex items-center justify-center font-display leading-none",
                size > 8 ? "text-lg sm:text-2xl" : "text-2xl sm:text-3xl",
                "cursor-pointer select-none overflow-hidden focus-visible:-outline-offset-4",
                c < size - 1 && "border-r border-r-[var(--grid-border-inner)]",
                r < size - 1 && "border-b border-b-[var(--grid-border-inner)]",
                isSelected ? 'bg-[var(--cell-background-selected)]' : isGiven ? 'bg-[var(--cell-background-initial)]' : 'bg-[var(--cell-background)] hover:bg-[var(--cell-background-initial)]',
                value === 0 && 'text-transparent',
                value !== 0 && (isGiven ? 'text-[var(--number-initial)] font-bold' : isConflict ? 'text-[var(--number-error)] font-bold' : 'text-[var(--number-player)] font-medium'),
                isSelected && 'outline-2 -outline-offset-2 outline-[var(--number-player)]/70',
                ringClass
              )}
            >
              {value === 0 ? '' : TAKUZU_DIGITS[value]}
            </button>
          );
        }))}
      </div>
    </div>
  );
}
