'use client';
import { useMemo } from 'react';
import { FLOWER_HIDDEN, FLOWER_MARKED } from '@nbg/shared';
import { BeeArt, FLOWER_COLORS, FLOWER_KINDS, FlowerArt } from '@nbg/art';
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
  /** Where the bees are, once the game is lost. */
  mines: [number, number][];
  /** The bee that was woken up and lost the game. */
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

/**
 * Closed cells are grass, raised a little; opened ones are flat soil, so it is clear at a glance what is still
 * closed. The bee that lost the game keeps a soft tint (never an alarm), then the cell the player is on. Once the
 * field is cleared the tiles let go of their color, and the tray, which turns into a meadow, shows through.
 */
const backgroundClass = (isExploded: boolean, isSelected: boolean, isShown: boolean, isBlooming: boolean, isDense: boolean): string => {
  if (isBlooming) return 'bg-transparent shadow-none transition-colors duration-[400ms] motion-reduce:transition-none';
  if (isExploded) return 'bg-[var(--cutout-2)]';
  if (isSelected) return 'bg-[var(--cell-background-selected)]';
  if (isShown) return 'bg-[var(--field-soil)]';
  // On a dense field the raised edge is thinner, so that it does not eat the tile.
  return cn('bg-[var(--field-grass)] hover:brightness-110', isDense ? 'shadow-[1px_2px_0_var(--paper-shadow)]' : 'shadow-[var(--shadow-paper-sm)]');
};

/** What is written in a cell: a flag, the number of bees around it, or nothing (a bee is drawn, not written). */
const contentOf = (value: number, isMine: boolean, isFlagged: boolean): string | number => {
  if (isMine) return '';
  if (isFlagged) return FLAG;
  return value > 0 ? value : '';
};

const noMove = () => {};

export function FlowerFieldBoardUI({ size, grid, flags, mines, exploded, selectedCell, isOver, onCellClick, onMove, othersSelections = {}, profiles = {}, highlightedAlias = null, bloom = null }: Readonly<FlowerFieldBoardUIProps>) {
  const { t } = useTranslation();
  const isBlooming = bloom !== null;
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
    <div className={cn("relative aspect-square", BOARD_TRAY, isBlooming && 'bg-[var(--field-meadow)] duration-[400ms] motion-reduce:transition-none')} data-blooming={bloom?.grow || undefined}>
      <div
        className={cn("grid h-full w-full", gapOf(size))}
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {grid.map((row, r) => row.map((value, c) => {
          const key = `${r}-${c}`;
          const isOpen = value >= 0;
          const isMine = value === FLOWER_MARKED || revealedMines.has(key);
          // A field in bloom shows only its flowers: nothing of the game is left under or around them.
          const isTidy = isBlooming;
          const isShown = isOpen || isMine;
          const isSelected = !isTidy && isAt(selectedCell, r, c);
          const flagger = isTidy ? null : flaggerOf(key, isShown);

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
                backgroundClass(isAt(exploded, r, c), isSelected, isShown, isTidy, size > 8),
                isOpen && 'text-[var(--number-initial)] font-bold',
                flagClass(flagger),
                isSelected && 'outline-2 -outline-offset-2 outline-[var(--number-player)]/70',
                !isTidy && ringClass(occupants.get(key), isSelected)
              )}
            >
              {!isTidy && contentOf(value, isMine, flagger !== null)}
              {isMine && !isTidy && <BeeArt className="absolute inset-[6%] size-[88%]" />}
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
