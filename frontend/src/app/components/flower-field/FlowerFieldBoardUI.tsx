'use client';
import { useMemo } from 'react';
import { FLOWER_HIDDEN, FLOWER_MARKED } from '@nbg/shared';
import { FLOWER_COLORS, FLOWER_KINDS, FlowerArt } from '@nbg/art';
import type { PlayerProfile } from '@nbg/shared';
import { cn } from '@/lib/utils';
import { BOARD_TILE, BOARD_TRAY, gapOf } from '../games/boardStyles';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { useGridKeyboard } from '@/lib/useGridKeyboard';
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
  /** The arrows select a cell without playing it, which a tap does (see useGridKeyboard). */
  onMove?: (r: number, c: number) => void;
  othersSelections?: Record<string, [number, number]>;
  /** Every player the page has seen in the room, by alias: the color of a flag or a cursor comes from here. */
  profiles?: Record<string, PlayerProfile>;
  /** The player being pointed out for a moment: their flags and cursor stand out. */
  highlightedAlias?: string | null;
  /** Once the field is cleared a flower grows on every cell; `grow: false` shows them still, for phones that struggle. */
  bloom?: { grow: boolean } | null;
}

const MINE = '✸';
const FLAG = '⚑';

const isAt = (cell: [number, number] | null, r: number, c: number): boolean => cell?.[0] === r && cell?.[1] === c;

/** How long the flowers take to reach the corners, from the middle of the field. */
export const BLOOM_SPREAD_MS = 1200;

/**
 * The flower of a cell. It comes from where the cell is, not from chance: every player in the room sees the
 * same field in bloom, and it stays the same through a re-render.
 */
export const flowerOf = (r: number, c: number) => {
  const seed = (r * 73 + c * 151 + r * c * 17) >>> 0;
  return { kind: FLOWER_KINDS[seed % FLOWER_KINDS.length], color: FLOWER_COLORS[(seed >> 3) % FLOWER_COLORS.length] };
};

/** The flowers open in a wave from the middle of the field, with a little give so that it does not look drawn with a compass. */
export const bloomDelayOf = (size: number, r: number, c: number): number => {
  const middle = (size - 1) / 2;
  const farthest = Math.hypot(middle, middle) || 1;
  const give = ((r * 37 + c * 61) % 7) * 20;
  return Math.round((Math.hypot(r - middle, c - middle) / farthest) * BLOOM_SPREAD_MS) + give;
};

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

const noMove = () => {};

export function FlowerFieldBoardUI({ size, grid, flags, mines, exploded, selectedCell, isOver, onCellClick, onMove, othersSelections = {}, profiles = {}, highlightedAlias = null, bloom = null }: Readonly<FlowerFieldBoardUIProps>) {
  const { t } = useTranslation();
  const keyboard = useGridKeyboard(size, selectedCell, onMove ?? noMove);

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
    <div className={cn("relative aspect-square", BOARD_TRAY)} data-blooming={bloom?.grow || undefined}>
      <div
        className={cn("grid h-full w-full", gapOf(size))}
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
              {...(!isOver && onMove ? keyboard(r, c) : {})}
              className={cn(
                "relative flex items-center justify-center font-display leading-none",
                sizeClass,
                "cursor-pointer select-none overflow-hidden",
                BOARD_TILE,
                backgroundClass(isAt(exploded, r, c), isSelected, isShown),
                isOpen && 'text-[var(--number-initial)] font-bold',
                isMine && 'text-[var(--number-error)]',
                flagClass(flagger),
                isSelected && 'outline-2 -outline-offset-2 outline-[var(--number-player)]/70',
                ringClass(occupants.get(key), isSelected)
              )}
            >
              {contentOf(value, isMine, flagger !== null)}
              {bloom && (
                <FlowerArt
                  {...flowerOf(r, c)}
                  className={cn("absolute inset-[6%] size-[88%] origin-bottom", bloom.grow && "motion-safe:animate-bloom")}
                  style={bloom.grow ? { animationDelay: `${bloomDelayOf(size, r, c)}ms` } : undefined}
                />
              )}
            </button>
          );
        }))}
      </div>
    </div>
  );
}
