import { describe, it, expect } from 'vitest';
import {
  cellUpdateArgsSchema,
  difficultySchema,
  gameIdSchema,
  joinRoomArgsSchema,
  MAX_ROOM_ID_LENGTH,
  restartGameArgsSchema,
  roomIdSchema,
  selectCellArgsSchema,
  sendEmoteArgsSchema,
  toggleNoteArgsSchema,
  voteGameArgsSchema,
} from './schemas';
import { EMOTES } from './emotes';
import { GAME_IDS } from './games';

const garbage: unknown[] = [undefined, null, 0, 1, NaN, 'text', true, [], {}, () => 1];

describe('difficultySchema', () => {
  it.each(['beginner', 'easy', 'medium', 'hard', 'expert'])('accepts "%s"', (value) => {
    expect(difficultySchema.safeParse(value).success).toBe(true);
  });

  it.each(['banana', 'EASY', 'Expert', 'master', '', 'constructor', '__proto__', 1, null, undefined])(
    'rejects %j',
    (value) => {
      expect(difficultySchema.safeParse(value).success).toBe(false);
    },
  );
});

describe('roomIdSchema', () => {
  it('accepts the ids the app generates', () => {
    for (let i = 0; i < 20; i++) expect(roomIdSchema.safeParse(crypto.randomUUID()).success).toBe(true);
    expect(crypto.randomUUID()).toHaveLength(MAX_ROOM_ID_LENGTH);
  });

  it('turns an id written in capitals into the one the app generated, so that both links lead to the same room', () => {
    const id = crypto.randomUUID();

    expect(roomIdSchema.parse(id.toUpperCase())).toBe(id);
    expect(roomIdSchema.parse(id)).toBe(id);
  });

  it.each(['custom-room_1', 'us', 'a'.repeat(MAX_ROOM_ID_LENGTH), 'a'.repeat(MAX_ROOM_ID_LENGTH + 1)])(
    'rejects an id someone made up (%s)',
    (value) => {
      expect(roomIdSchema.safeParse(value).success).toBe(false);
    },
  );

  it.each([
    '',
    '00000000-0000-0000-0000-000000000000',
    '3f2b8c1e-9d4a-1b7e-8a2c-5d6e7f8a9b0c',
    '3f2b8c1e-9d4a-4b7e-8a2c-5d6e7f8a9b0cc',
    ' 3f2b8c1e-9d4a-4b7e-8a2c-5d6e7f8a9b0c',
    'room with spaces',
    '../etc/passwd',
    '<script>',
  ])('rejects anything that is not a version 4 UUID (%j)', (value) => {
    expect(roomIdSchema.safeParse(value).success).toBe(false);
  });

  it('rejects non-string values', () => {
    for (const value of [undefined, null, 42, {}, []]) {
      expect(roomIdSchema.safeParse(value).success).toBe(false);
    }
  });
});

const ROOM = crypto.randomUUID();

describe('joinRoomArgsSchema', () => {
  it('accepts a valid room id', () => {
    expect(joinRoomArgsSchema.safeParse([ROOM]).success).toBe(true);
  });

  it('rejects missing or extra arguments', () => {
    expect(joinRoomArgsSchema.safeParse([]).success).toBe(false);
    expect(joinRoomArgsSchema.safeParse([ROOM, 'easy']).success).toBe(false);
    expect(joinRoomArgsSchema.safeParse([ROOM, () => 1]).success).toBe(false);
  });
});

describe('voteGameArgsSchema', () => {
  it('accepts every game of the list, and null to take the vote back', () => {
    for (const game of GAME_IDS) {
      expect(gameIdSchema.safeParse(game).success).toBe(true);
      expect(voteGameArgsSchema.safeParse([game]).success).toBe(true);
    }
    expect(voteGameArgsSchema.safeParse([null]).success).toBe(true);
  });

  it('rejects unknown games, missing or extra arguments', () => {
    for (const value of ['chess', 'SUDOKU', '', 'constructor', '__proto__', 0, {}, ['sudoku'], undefined]) {
      expect(voteGameArgsSchema.safeParse([value]).success).toBe(false);
    }
    expect(voteGameArgsSchema.safeParse([]).success).toBe(false);
    expect(voteGameArgsSchema.safeParse(['sudoku', 'sudoku']).success).toBe(false);
    expect(voteGameArgsSchema.safeParse(['sudoku', () => 1]).success).toBe(false);
  });
});

describe('cellUpdateArgsSchema', () => {
  it('accepts valid payloads, including 0 to clear a cell', () => {
    expect(cellUpdateArgsSchema.safeParse([{ r: 0, c: 8, v: 0 }]).success).toBe(true);
    expect(cellUpdateArgsSchema.safeParse([{ r: 3, c: 4, v: 9 }]).success).toBe(true);
  });

  it('rejects missing payload, non-objects and wrong field types', () => {
    expect(cellUpdateArgsSchema.safeParse([]).success).toBe(false);
    for (const value of garbage) {
      expect(cellUpdateArgsSchema.safeParse([value]).success).toBe(false);
    }
    expect(cellUpdateArgsSchema.safeParse([{ r: '1', c: 1, v: 1 }]).success).toBe(false);
    expect(cellUpdateArgsSchema.safeParse([{ r: 1.5, c: 1, v: 1 }]).success).toBe(false);
    expect(cellUpdateArgsSchema.safeParse([{ r: -1, c: 1, v: 1 }]).success).toBe(false);
    expect(cellUpdateArgsSchema.safeParse([{ r: 1, c: 1 }]).success).toBe(false);
  });

  it('accepts the acknowledgement callback Socket.IO adds, and nothing else after the payload', () => {
    expect(cellUpdateArgsSchema.safeParse([{ r: 0, c: 0, v: 1 }, () => undefined]).success).toBe(true);
    expect(cellUpdateArgsSchema.safeParse([{ r: 0, c: 0, v: 1 }, 'not a function']).success).toBe(false);
    expect(cellUpdateArgsSchema.safeParse([{ r: 0, c: 0, v: 1 }, () => undefined, 1]).success).toBe(false);
  });
});

describe('toggleNoteArgsSchema', () => {
  it('accepts positive values only', () => {
    expect(toggleNoteArgsSchema.safeParse([{ r: 1, c: 2, v: 5 }]).success).toBe(true);
    expect(toggleNoteArgsSchema.safeParse([{ r: 1, c: 2, v: 0 }]).success).toBe(false);
  });

  it('rejects garbage', () => {
    for (const value of garbage) {
      expect(toggleNoteArgsSchema.safeParse([value]).success).toBe(false);
    }
  });
});

describe('selectCellArgsSchema', () => {
  it('accepts a selection and a deselection', () => {
    expect(selectCellArgsSchema.safeParse([{ r: 2, c: 3 }]).success).toBe(true);
    expect(selectCellArgsSchema.safeParse([{ r: null, c: null }]).success).toBe(true);
  });

  it('rejects half-null selections and garbage', () => {
    expect(selectCellArgsSchema.safeParse([{ r: null, c: 3 }]).success).toBe(false);
    expect(selectCellArgsSchema.safeParse([{ r: 2, c: null }]).success).toBe(false);
    expect(selectCellArgsSchema.safeParse([{ r: -1, c: 0 }]).success).toBe(false);
    for (const value of garbage) {
      expect(selectCellArgsSchema.safeParse([value]).success).toBe(false);
    }
  });
});

describe('restartGameArgsSchema', () => {
  it('accepts only a valid difficulty', () => {
    expect(restartGameArgsSchema.safeParse(['medium']).success).toBe(true);
    expect(restartGameArgsSchema.safeParse(['banana']).success).toBe(false);
    expect(restartGameArgsSchema.safeParse([]).success).toBe(false);
  });
});

describe('EMOTES', () => {
  it('stays small enough to fit a button bar and has no duplicates', () => {
    expect(EMOTES.length).toBeGreaterThan(0);
    expect(EMOTES.length).toBeLessThanOrEqual(10);
    expect(new Set(EMOTES).size).toBe(EMOTES.length);
  });
});

describe('sendEmoteArgsSchema', () => {
  it('accepts every emote of the list', () => {
    for (const emote of EMOTES) {
      expect(sendEmoteArgsSchema.safeParse([emote]).success).toBe(true);
    }
  });

  it('rejects anything that is not exactly one known emote', () => {
    const garbage: unknown[] = ['🦄', 'hello', '💜💜', ' 💜', '', 42, null, undefined, {}, [], { emote: '💜' }, '💜'.repeat(10_000)];
    for (const value of garbage) {
      expect(sendEmoteArgsSchema.safeParse([value]).success).toBe(false);
    }
    expect(sendEmoteArgsSchema.safeParse([]).success).toBe(false);
    expect(sendEmoteArgsSchema.safeParse([EMOTES[0], 'extra']).success).toBe(false);
  });
});
