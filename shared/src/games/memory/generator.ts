import type { Difficulty } from '../sudoku/types';
import { MEMORY_FACE_COUNT } from './types';

/** How many pairs each level has. The levels are the ones of the Sudoku, so that a room can restart with the same list of names. The last one uses every drawing. */
const PAIRS: Record<Difficulty, number> = {
  beginner: 6,
  easy: 8,
  medium: 12,
  hard: 16,
  expert: MEMORY_FACE_COUNT,
};

export function getMemoryLevel(difficulty: Difficulty): { pairs: number } {
  // Fail loudly: an unknown difficulty would otherwise give an empty deck.
  if (!Object.hasOwn(PAIRS, difficulty)) throw new Error(`Unknown difficulty: ${String(difficulty)}`);

  return { pairs: PAIRS[difficulty] };
}

/** The deck of a game: the face of each card, in the order they lie. Some drawings at random, each one twice, shuffled. It never leaves the server. */
export function generateMemory(difficulty: Difficulty): number[] {
  const { pairs } = getMemoryLevel(difficulty);

  const faces = Array.from({ length: MEMORY_FACE_COUNT }, (_, face) => face);
  shuffleArray(faces);
  const deck = faces.slice(0, pairs).flatMap((face) => [face, face]);
  shuffleArray(deck);
  return deck;
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
