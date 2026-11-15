'use client';
import { useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import type { PlayerProfile, WordSearchCell, WordSearchFound } from '@nbg/shared';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { UNKNOWN_PLAYER_STYLE, styleOfColor } from '@/lib/playerPalette';

interface WordSearchBoardUIProps {
  size: number;
  grid: string[][];
  /** The words found, with who found them: the page draws what the server says and never decides a word is found. */
  found: WordSearchFound[];
  /** Every player the page has seen in the room, by alias: the color of a found word comes from here. */
  profiles?: Record<string, PlayerProfile>;
  /** The player being pointed out for a moment: their words stand out. */
  highlightedAlias?: string | null;
  /** The game is won: the grid takes no more selections. */
  isOver: boolean;
  /** A straight line of at least two cells the player marked. The server decides whether it is a word. */
  onSelect: (from: WordSearchCell, to: WordSearchCell) => void;
}

const sameCell = (a: WordSearchCell, b: WordSearchCell) => a.r === b.r && a.c === b.c;

/**
 * The end of the straight line (one of the 8 directions) that goes from `from` the closest to where the pointer is.
 * A finger is not precise, so the line is the nearest direction and never a path that cannot be a word.
 */
export const snapLine = (from: WordSearchCell, pointer: WordSearchCell, size: number): WordSearchCell => {
  const dr = pointer.r - from.r;
  const dc = pointer.c - from.c;
  if (dr === 0 && dc === 0) return from;

  const angle = Math.round(Math.atan2(dr, dc) / (Math.PI / 4)) * (Math.PI / 4);
  const sr = Math.round(Math.sin(angle));
  const sc = Math.round(Math.cos(angle));
  // Steps along the direction: a diagonal step covers one row and one column, so the dot product counts twice.
  let steps = Math.round((dr * sr + dc * sc) / (sr * sr + sc * sc));
  const room = (step: number, at: number) => (step > 0 ? size - 1 - at : step < 0 ? at : Infinity);
  steps = Math.max(0, Math.min(steps, room(sr, from.r), room(sc, from.c)));
  return { r: from.r + sr * steps, c: from.c + sc * steps };
};

/** The cells from one end to the other, or none when it is not a straight line inside the grid. */
const lineCells = (from: WordSearchCell, to: WordSearchCell, size: number): WordSearchCell[] => {
  const dr = to.r - from.r;
  const dc = to.c - from.c;
  const length = Math.max(Math.abs(dr), Math.abs(dc));
  const inside = [from, to].every(({ r, c }) => r >= 0 && c >= 0 && r < size && c < size);
  if (!inside || (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc))) return [];
  return Array.from({ length: length + 1 }, (_, i) => ({ r: from.r + Math.sign(dr) * i, c: from.c + Math.sign(dc) * i }));
};

const ARROWS: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };

export function WordSearchBoardUI({ size, grid, found, profiles = {}, highlightedAlias = null, isOver, onSelect }: Readonly<WordSearchBoardUIProps>) {
  const { t } = useTranslation();
  const gridRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // A drag that ends a click on the cell where it started would otherwise also count as the first tap.
  const skipClick = useRef(false);
  const [drag, setDrag] = useState<{ from: WordSearchCell; to: WordSearchCell } | null>(null);
  const [tapStart, setTapStart] = useState<WordSearchCell | null>(null);
  const [focused, setFocused] = useState<WordSearchCell>({ r: 0, c: 0 });

  // The list comes from the server and an alias is a key of it: only a key it really has counts.
  const styleOf = (alias: string) => (Object.hasOwn(profiles, alias) ? styleOfColor(profiles[alias].color) : UNKNOWN_PLAYER_STYLE);

  const foundByCell = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const { alias, from, to } of found) {
      for (const { r, c } of lineCells(from, to, size)) map.set(`${r}-${c}`, [...(map.get(`${r}-${c}`) ?? []), alias]);
    }
    return map;
  }, [found, size]);

  // The line being marked: the drag, or the first tap followed by the cell the keyboard is on.
  const preview = drag ?? (tapStart ? { from: tapStart, to: snapLine(tapStart, focused, size) } : null);
  const previewKeys = new Set(preview ? lineCells(preview.from, preview.to, size).map(({ r, c }) => `${r}-${c}`) : []);

  /** The cell under the pointer, from its position: the cell that was pressed is not the one it is over when it moves. */
  const cellAt = (event: PointerEvent): WordSearchCell | null => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    const at = (position: number, start: number, length: number) => Math.min(size - 1, Math.max(0, Math.floor(((position - start) / length) * size)));
    return { r: at(event.clientY, rect.top, rect.height), c: at(event.clientX, rect.left, rect.width) };
  };

  const send = (from: WordSearchCell, to: WordSearchCell) => {
    if (lineCells(from, to, size).length >= 2) onSelect(from, to);
  };

  const handlePointerDown = (event: PointerEvent) => {
    skipClick.current = false;
    if (isOver || event.button !== 0) return;
    const cell = cellAt(event);
    if (cell) setDrag({ from: cell, to: cell });
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!drag) return;
    const cell = cellAt(event);
    if (!cell) return;
    const to = snapLine(drag.from, cell, size);
    if (!sameCell(to, drag.to)) setDrag({ from: drag.from, to });
  };

  const handlePointerUp = () => {
    if (!drag) return;
    if (!sameCell(drag.from, drag.to)) {
      skipClick.current = true;
      setTapStart(null);
      send(drag.from, drag.to);
    }
    setDrag(null);
  };

  const handleCellClick = (cell: WordSearchCell, event: { detail: number }) => {
    // A click made by a pointer right after a drag is the end of that drag; the keyboard has no detail and is never skipped.
    if (skipClick.current && event.detail > 0) {
      skipClick.current = false;
      return;
    }
    if (isOver) return;
    if (!tapStart || sameCell(tapStart, cell)) {
      setTapStart(tapStart ? null : cell);
      return;
    }
    // A second tap that makes no straight line is a new first tap: the player changed their mind.
    if (lineCells(tapStart, cell, size).length === 0) {
      setTapStart(cell);
      return;
    }
    setTapStart(null);
    send(tapStart, cell);
  };

  const handleKeyDown = (event: KeyboardEvent, { r, c }: WordSearchCell) => {
    if (event.key === 'Escape') {
      setTapStart(null);
      setDrag(null);
      return;
    }
    const arrow = ARROWS[event.key];
    if (!arrow) return;
    event.preventDefault();
    const next = { r: Math.min(size - 1, Math.max(0, r + arrow[0])), c: Math.min(size - 1, Math.max(0, c + arrow[1])) };
    cellRefs.current[next.r * size + next.c]?.focus();
  };

  const labelOf = (r: number, c: number, letter: string) => {
    const key = tapStart && tapStart.r === r && tapStart.c === c ? 'wordSearch.cellStart' : foundByCell.has(`${r}-${c}`) ? 'wordSearch.cellFound' : 'wordSearch.cell';
    return t(key).replace('{letter}', letter).replace('{row}', String(r + 1)).replace('{column}', String(c + 1));
  };

  return (
    <div className="relative w-full aspect-square">
      <div className={cn("w-full h-full overflow-hidden rounded-2xl", "border-4 border-[var(--grid-border-outer)] shadow-[var(--shadow-paper)]")}>
        <div
          ref={gridRef}
          role="group"
          aria-label={t('wordSearch.grid')}
          // Without this the browser takes a drag for a scroll of the page and stops sending the moves.
          className="w-full h-full grid touch-none select-none"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => setDrag(null)}
          onPointerLeave={() => setDrag(null)}
        >
          {grid.map((row, r) => row.map((letter, c) => {
            const key = `${r}-${c}`;
            const finders = foundByCell.get(key) ?? [];
            const isStart = tapStart?.r === r && tapStart?.c === c;
            const inPreview = previewKeys.has(key);
            const isFocusCell = focused.r === r && focused.c === c;
            const lastFinder = finders.at(-1);

            return (
              <button
                key={key}
                ref={(element) => { cellRefs.current[r * size + c] = element; }}
                type="button"
                tabIndex={isFocusCell ? 0 : -1}
                aria-label={labelOf(r, c, letter)}
                aria-pressed={isStart}
                onFocus={() => setFocused({ r, c })}
                onClick={(event) => handleCellClick({ r, c }, event)}
                onKeyDown={(event) => handleKeyDown(event, { r, c })}
                className={cn(
                  "relative flex items-center justify-center font-display font-bold leading-none touch-none",
                  size > 12 ? "text-sm sm:text-lg" : "text-base sm:text-xl",
                  "cursor-pointer select-none focus-visible:-outline-offset-4",
                  c < size - 1 && "border-r border-r-[var(--grid-border-inner)]",
                  r < size - 1 && "border-b border-b-[var(--grid-border-inner)]",
                  inPreview ? 'bg-[var(--cell-background-selected)]' : 'bg-[var(--cell-background-initial)] hover:bg-[var(--cell-background)]',
                  lastFinder === undefined ? 'text-[var(--number-initial)]' : cn(styleOf(lastFinder).text, 'font-black'),
                  (inPreview || isStart) && 'outline-2 -outline-offset-2 outline-[var(--number-player)]/70'
                )}
              >
                {/* Under the letter: a soft bar in the color of whoever found the word, for each word that crosses the cell. */}
                {finders.map((alias, i) => (
                  <span
                    key={`${alias}-${i}`}
                    aria-hidden="true"
                    className={cn('absolute inset-0.5 rounded-md opacity-30', styleOf(alias).swatch, alias === highlightedAlias && 'opacity-60 motion-safe:animate-pulse')}
                  />
                ))}
                <span className="relative">{letter}</span>
              </button>
            );
          }))}
        </div>
      </div>
    </div>
  );
}
