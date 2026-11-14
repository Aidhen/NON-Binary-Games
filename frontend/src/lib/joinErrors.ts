import type { JoinError } from '@nbg/shared';

/** One message per reason: a new JoinError does not compile until it has its own text. */
export const joinErrorMessages: Record<JoinError, string> = {
  'room-full': 'sudoku.roomFull',
  'server-full': 'sudoku.serverFull',
  'too-fast': 'sudoku.tooFast',
};
