import { describe, it, expect } from 'vitest';
import { canJoinGame, MAX_PLAYERS } from './gameLogic';
import type { GameState } from './gameLogic';

const createState = (players: string[], status: GameState['status']): GameState => ({
  players,
  status,
});

describe('canJoinGame', () => {
  it('allows joining an empty waiting room', () => {
    expect(canJoinGame(createState([], 'waiting'))).toBe(true);
  });

  it('allows joining a waiting room with available slots', () => {
    const players = Array.from({ length: MAX_PLAYERS - 1 }, (_, i) => `player-${i + 1}`);

    expect(canJoinGame(createState(players, 'waiting'))).toBe(true);
  });

  it('rejects joining a full waiting room', () => {
    const players = Array.from({ length: MAX_PLAYERS }, (_, i) => `player-${i + 1}`);

    expect(canJoinGame(createState(players, 'waiting'))).toBe(false);
  });

  it('rejects joining a room that exceeds the player limit', () => {
    const players = Array.from({ length: MAX_PLAYERS + 1 }, (_, i) => `player-${i + 1}`);

    expect(canJoinGame(createState(players, 'waiting'))).toBe(false);
  });

  it('rejects joining a game that is already in progress', () => {
    expect(canJoinGame(createState(['player-1'], 'playing'))).toBe(false);
  });

  it('rejects joining a finished game', () => {
    expect(canJoinGame(createState([], 'finished'))).toBe(false);
  });

  it('uses the expected maximum player count', () => {
    expect(MAX_PLAYERS).toBe(4);
  });
});