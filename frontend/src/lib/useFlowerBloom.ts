'use client';
import { useCallback, useSyncExternalStore } from 'react';
import { readStorage, writeStorage } from './storage';

export const FLOWER_BLOOM_KEY = 'nbg-flower-bloom';

// Every component that shows the choice hears when it changes.
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
// Kept here too, for a browser that refuses localStorage: the choice then lasts as long as the page.
let chosen: boolean | null = null;
const read = () => {
  const stored = readStorage(FLOWER_BLOOM_KEY);
  return stored === null ? (chosen ?? true) : stored !== 'off';
};
// The server renders the page without localStorage: on until the browser has been read.
const readOnServer = () => true;

/**
 * Whether the flowers of a cleared Flower Field grow, or show up still. On by default; a phone that struggles
 * can turn it off, and the choice is kept in this browser (see the privacy page). Whoever asked the system for
 * less motion never sees it grow, whatever this says: that is done in CSS (motion-safe).
 */
export function useFlowerBloom(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(subscribe, read, readOnServer);

  const choose = useCallback((next: boolean) => {
    chosen = next;
    writeStorage(FLOWER_BLOOM_KEY, next ? 'on' : 'off');
    listeners.forEach((listener) => listener());
  }, []);

  return [on, choose];
}
