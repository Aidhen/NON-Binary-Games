export interface GameState {
  players: string[];
  status: 'waiting' | 'playing' | 'finished';
}

export const MAX_PLAYERS = 4;

export function canJoinGame(state: GameState): boolean {
  return state.players.length < MAX_PLAYERS && state.status === 'waiting';
}