import { readStorage, writeStorage } from './storage';

const STORAGE_KEY = 'nbg-player-id';

const generatePlayerId = (): string => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

let current: string | undefined;

/**
 * Identity of this browser in the rooms. It is kept in localStorage so that the same
 * player keeps colors, notes and selection after a reload or a dropped connection.
 * Without storage it still lasts as long as the page stays open.
 */
export const getPlayerId = (): string => {
  if (current) return current;

  current = readStorage(STORAGE_KEY) ?? generatePlayerId();
  writeStorage(STORAGE_KEY, current);
  return current;
};
