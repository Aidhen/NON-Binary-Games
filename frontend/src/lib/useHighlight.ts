'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/** How long the cursor and the notes of a player stand out after somebody asks where they are. */
export const HIGHLIGHT_MS = 1500;

/** The player (by alias) that is being pointed out on the board, for a moment. */
export function useHighlight() {
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const highlight = useCallback((alias: string) => {
    clearTimeout(timer.current);
    setHighlighted(alias);
    timer.current = setTimeout(() => setHighlighted(null), HIGHLIGHT_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { highlighted, highlight };
}
