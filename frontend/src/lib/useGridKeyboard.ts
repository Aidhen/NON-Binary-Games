'use client';
import { useCallback, useRef } from 'react';
import type { KeyboardEvent } from 'react';

const ARROWS: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };

/** Where a key moves from (r, c) on a grid of `size`: the arrows by one cell, Home and End to the ends of the row. Null for any other key. */
export const moveOf = (key: string, r: number, c: number, size: number): [number, number] | null => {
  if (key === 'Home') return [r, 0];
  if (key === 'End') return [r, size - 1];
  const arrow = ARROWS[key];
  if (!arrow) return null;
  // At the edge the cell stays where it is: the grid does not wrap around.
  return [Math.min(size - 1, Math.max(0, r + arrow[0])), Math.min(size - 1, Math.max(0, c + arrow[1]))];
};

export interface GridCellKeyboard {
  ref: (element: HTMLButtonElement | null) => void;
  tabIndex: number;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

/**
 * One tab stop for a whole grid (a roving tabindex): Tab reaches the selected cell, or the first one, and the
 * arrows move from there. Moving selects the cell like a tap that does not play (`onMove`), so the other players
 * see where this one is. The keys that play stay with each game.
 */
export function useGridKeyboard(size: number, selected: [number, number] | null, onMove: (r: number, c: number) => void) {
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusR, focusC] = selected && selected[0] < size && selected[1] < size ? selected : [0, 0];

  return useCallback((r: number, c: number): GridCellKeyboard => ({
    ref: (element) => { cells.current[r * size + c] = element; },
    tabIndex: r === focusR && c === focusC ? 0 : -1,
    onKeyDown: (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const next = moveOf(event.key, r, c, size);
      if (!next) return;
      event.preventDefault();
      onMove(next[0], next[1]);
      cells.current[next[0] * size + next[1]]?.focus();
    },
  }), [size, focusR, focusC, onMove]);
}
