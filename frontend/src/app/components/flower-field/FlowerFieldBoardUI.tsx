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
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {grid.map((row, r) => row.map((value, c) => {
          const key = `${r}-${c}`;
          const isOpen = value >= 0;
          const isMine = value === FLOWER_MARKED || revealedMines.has(key);
          const isExploded = exploded?.[0] === r && exploded?.[1] === c;
          const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
          const flagger = !isOpen && !isMine && Object.hasOwn(flags, key) ? flags[key] : null;
          const occupant = occupants.get(key);

          let ringClass = '';
          if (occupant) {
            const style = styleOf(occupant);
            ringClass = cn('ring-inset z-10', occupant === highlightedAlias ? 'ring-8 motion-safe:animate-pulse' : 'ring-4', style.ring, isSelected ? '' : style.tint);
          }

          return (
            <button
              key={key}
              type="button"
              aria-label={labelOf(r, c, value)}
              onClick={() => !isOver && onCellClick(r, c)}
              className={cn(
                "relative flex items-center justify-center font-display leading-none",
                size > 10 ? "text-base sm:text-xl" : "text-xl sm:text-2xl",
                "cursor-pointer select-none overflow-hidden focus-visible:-outline-offset-4",
                c < size - 1 && "border-r border-r-[var(--grid-border-inner)]",
                r < size - 1 && "border-b border-b-[var(--grid-border-inner)]",
                isExploded ? 'bg-[var(--number-error)]/30' : isSelected ? 'bg-[var(--cell-background-selected)]' : isOpen || isMine ? 'bg-[var(--cell-background-initial)]' : 'bg-[var(--cell-background)] hover:bg-[var(--cell-background-initial)]',
                isOpen && 'text-[var(--number-initial)] font-bold',
                isMine && 'text-[var(--number-error)]',
                flagger !== null && cn(styleOf(flagger).text, flagger === highlightedAlias && 'font-black motion-safe:animate-pulse'),
                isSelected && 'outline-2 -outline-offset-2 outline-[var(--number-player)]/70',
                ringClass
              )}
            >
              {isMine ? MINE : flagger !== null ? FLAG : isOpen && value > 0 ? value : ''}
            </button>
          );
        }))}
      </div>
    </div>
  );
}
