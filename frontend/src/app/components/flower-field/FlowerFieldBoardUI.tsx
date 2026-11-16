'use client';
import { useMemo } from 'react';
import { FLOWER_HIDDEN, FLOWER_MARKED } from '@nbg/shared';
import type { PlayerProfile } from '@nbg/shared';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { UNKNOWN_PLAYER_STYLE, styleOfColor } from '@/lib/playerPalette';

interface FlowerFieldBoardUIProps {
  size: number;
  grid: number[][];
  /** Who put the flag on each cell, by alias, under the key `r-c`. */
  flags: Record<string, string>;
  /** Where the mines are, once the game is lost. */
  mines: [number, number][];
  /** The mine that was opened and lost the game. */
  exploded: [number, number] | null;
  selectedCell: [number, number] | null;
  /** Won or lost: the field takes no more clicks. */
  isOver: boolean;
  onCellClick: (r: number, c: number) => void;
  othersSelections?: Record<string, [number, number]>;
  /** Every player the page has seen in the room, by alias: the color of a flag or a cursor comes from here. */
  profiles?: Record<string, PlayerProfile>;
  /** The player being pointed out for a moment: their flags and cursor stand out. */
  highlightedAlias?: string | null;
}

const MINE = '✸';
const FLAG = '⚑';

const isAt = (cell: [number, number] | null, r: number, c: number): boolean => cell?.[0] === r && cell?.[1] === c;

/** The mine that lost the game comes first, then the cell the player is on, then whether the cell shows what it holds. */
const backgroundClass = (isExploded: boolean, isSelected: boolean, isShown: boolean): string => {
  if (isExploded) return 'bg-[var(--number-error)]/30';
  if (isSelected) return 'bg-[var(--cell-background-selected)]';
  if (isShown) return 'bg-[var(--cell-background-initial)]';
  return 'bg-[var(--cell-background)] hover:bg-[var(--cell-background-initial)]';
};

/** What is drawn in a cell: a mine, a flag, the number of mines around it, or nothing. */
const contentOf = (value: number, isMine: boolean, isFlagged: boolean): string | number => {
  if (isMine) return MINE;
  if (isFlagged) return FLAG;
  return value > 0 ? value : '';
};

export function FlowerFieldBoardUI({ size, grid, flags, mines, exploded, selectedCell, isOver, onCellClick, othersSelections = {}, profiles = {}, highlightedAlias = null }: Readonly<FlowerFieldBoardUIProps>) {
  const { t } = useTranslation();

  // The list comes from the server and an alias is a key of it: only a key it really has counts.
  const styleOf = (alias: string) => (Object.hasOwn(profiles, alias) ? styleOfColor(profiles[alias].color) : UNKNOWN_PLAYER_STYLE);

  const occupants = useMemo(() => {
    const map = new Map<string, string>();
    for (const [alias, [r, c]] of Object.entries(othersSelections)) map.set(`${r}-${c}`, alias);
    return map;
  }, [othersSelections]);

  const revealedMines = useMemo(() => new Set(mines.map(([r, c]) => `${r}-${c}`)), [mines]);

  /** Who put the flag that shows on a cell, or null: a cell that shows what it holds has no flag on it. */
  const flaggerOf = (key: string, isShown: boolean): string | null => (!isShown && Object.hasOwn(flags, key) ? flags[key] : null);

  const flagClass = (flagger: string | null) =>
    flagger !== null && cn(styleOf(flagger).text, flagger === highlightedAlias && 'font-black motion-safe:animate-pulse');

  /** The ring around the cell another player is on. The cell this player is on keeps its own background under it. */
  const ringClass = (occupant: string | undefined, isSelected: boolean): string => {
    if (!occupant) return '';
    const style = styleOf(occupant);
    return cn('ring-inset z-10', occupant === highlightedAlias ? 'ring-8 motion-safe:animate-pulse' : 'ring-4', style.ring, isSelected ? '' : style.tint);
  };

  const sizeClass = size > 10 ? "text-base sm:text-xl" : "text-xl sm:text-2xl";

  const stateOf = (r: number, c: number, value: number): string => {
    if (value === FLOWER_MARKED || revealedMines.has(`${r}-${c}`)) return t('flowerField.mine');
    if (value === FLOWER_HIDDEN) return Object.hasOwn(flags, `${r}-${c}`) ? t('flowerField.flagged') : t('flowerField.closed');
    return value === 0 ? t('flowerField.empty') : String(value);
  };

  const labelOf = (r: number, c: number, value: number) =>
    t('flowerField.cell').replace('{row}', String(r + 1)).replace('{column}', String(c + 1)).replace('{state}', stateOf(r, c, value));

  return (
    <div className="relative w-full aspect-square">
      <div
        className={cn("w-full h-full grid overflow-hidden rounded-2xl", "border-4 border-[var(--grid-border-outer)] shadow-[var(--shadow-paper)]")}
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {grid.map((row, r) => row.map((value, c) => {
          const key = `${r}-${c}`;
          const isOpen = value >= 0;
          const isMine = value === FLOWER_MARKED || revealedMines.has(key);
          const isShown = isOpen || isMine;
          const isSelected = isAt(selectedCell, r, c);
          const flagger = flaggerOf(key, isShown);

          return (
            <button
              key={key}
              type="button"
              aria-label={labelOf(r, c, value)}
              onClick={() => !isOver && onCellClick(r, c)}
              className={cn(
                "relative flex items-center justify-center font-display leading-none",
                sizeClass,
                "cursor-pointer select-none overflow-hidden focus-visible:-outline-offset-4",
                c < size - 1 && "border-r border-r-[var(--grid-border-inner)]",
                r < size - 1 && "border-b border-b-[var(--grid-border-inner)]",
                backgroundClass(isAt(exploded, r, c), isSelected, isShown),
                isOpen && 'text-[var(--number-initial)] font-bold',
                isMine && 'text-[var(--number-error)]',
                flagClass(flagger),
                isSelected && 'outline-2 -outline-offset-2 outline-[var(--number-player)]/70',
                ringClass(occupants.get(key), isSelected)
              )}
            >
              {contentOf(value, isMine, flagger !== null)}
            </button>
          );
        }))}
      </div>
    </div>
  );
}
