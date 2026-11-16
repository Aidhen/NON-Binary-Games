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

const isAt = (cell: [number, number] | null, r: number, c: number): boolean => cell?.[0] === r && cell?.[1] === c;

const backgroundClass = (isSelected: boolean, isGiven: boolean): string => {
  if (isSelected) return 'bg-[var(--cell-background-selected)]';
  if (isGiven) return 'bg-[var(--cell-background-initial)]';
  return 'bg-[var(--cell-background)] hover:bg-[var(--cell-background-initial)]';
};

/** The color of a symbol: the ones the puzzle gave are bolder, and a clash shows only on a cell a player wrote. */
const symbolClass = (value: number, isGiven: boolean, isConflict: boolean): string => {
  if (value === 0) return 'text-transparent';
  if (isGiven) return 'text-[var(--number-initial)] font-bold';
  if (isConflict) return 'text-[var(--number-error)] font-bold';
  return 'text-[var(--number-player)] font-medium';
};

export function TakuzuBoardUI({ size, grid, initial, selectedCell, conflicts, isGameWon, onCellClick, othersSelections = {}, profiles = {}, highlightedAlias = null }: Readonly<TakuzuBoardUIProps>) {
  const { t } = useTranslation();

  // The list comes from the server and an alias is a key of it: only a key it really has counts.
  const styleOf = (alias: string) => (Object.hasOwn(profiles, alias) ? styleOfColor(profiles[alias].color) : UNKNOWN_PLAYER_STYLE);

  const occupants = useMemo(() => {
    const map = new Map<string, string>();
    for (const [alias, [r, c]] of Object.entries(othersSelections)) map.set(`${r}-${c}`, alias);
    return map;
  }, [othersSelections]);

  /** The ring around the cell another player is on. The cell this player is on keeps its own background under it. */
  const ringClass = (occupant: string | undefined, isSelected: boolean): string => {
    if (!occupant) return '';
    const style = styleOf(occupant);
    return cn('ring-inset z-10', occupant === highlightedAlias ? 'ring-8 motion-safe:animate-pulse' : 'ring-4', style.ring, isSelected ? '' : style.tint);
  };

  const sizeClass = size > 8 ? "text-lg sm:text-2xl" : "text-2xl sm:text-3xl";

  const labelOf = (r: number, c: number, value: number) =>
    `${t('takuzu.cell').replace('{row}', String(r + 1)).replace('{column}', String(c + 1)).replace('{value}', value === 0 ? t('takuzu.empty') : TAKUZU_DIGITS[value] ?? '')}`;

  return (
    <div className="relative w-full aspect-square">
      <div
        className={cn(
          "w-full h-full grid overflow-hidden rounded-2xl",
          "border-4 border-[var(--grid-border-outer)] shadow-[var(--shadow-paper)]"
        )}
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {grid.map((row, r) => row.map((value, c) => {
          const isGiven = initial[r][c] !== 0;
          const isSelected = isAt(selectedCell, r, c);
          const isConflict = value !== 0 && !isGiven && conflicts.has(`${r}-${c}`);

          return (
            <button
              key={`${r}-${c}`}
              type="button"
              aria-label={labelOf(r, c, value)}
              onClick={() => !isGameWon && onCellClick(r, c)}
              className={cn(
                "relative flex items-center justify-center font-display leading-none",
                sizeClass,
                "cursor-pointer select-none overflow-hidden focus-visible:-outline-offset-4",
                c < size - 1 && "border-r border-r-[var(--grid-border-inner)]",
                r < size - 1 && "border-b border-b-[var(--grid-border-inner)]",
                backgroundClass(isSelected, isGiven),
                symbolClass(value, isGiven, isConflict),
                isSelected && 'outline-2 -outline-offset-2 outline-[var(--number-player)]/70',
                ringClass(occupants.get(`${r}-${c}`), isSelected)
              )}
            >
              {TAKUZU_DIGITS[value] ?? ''}
            </button>
          );
        }))}
      </div>
    </div>
  );
}
