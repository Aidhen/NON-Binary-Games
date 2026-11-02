import { describe, it, expect } from 'vitest';
import {
  cellUpdateArgsSchema,
  difficultySchema,
  joinRoomArgsSchema,
  MAX_ROOM_ID_LENGTH,
  restartGameArgsSchema,
  roomIdSchema,
  selectCellArgsSchema,
  toggleNoteArgsSchema,
} from './schemas';

const garbage: unknown[] = [undefined, null, 0, 1, NaN, 'text', true, [], {}, () => 1];

describe('difficultySchema', () => {
  it.each(['easy', 'medium', 'hard'])('accepts "%s"', (value) => {
    expect(difficultySchema.safeParse(value).success).toBe(true);
  });

  it.each(['banana', 'EASY', '', 'constructor', '__proto__', 1, null, undefined])(
    'rejects %j',
    (value) => {
      expect(difficultySchema.safeParse(value).success).toBe(false);
    },
  );
});

describe('roomIdSchema', () => {
  it('accepts UUIDs and url-safe ids', () => {
    expect(roomIdSchema.safeParse(crypto.randomUUID()).success).toBe(true);
    expect(roomIdSchema.safeParse('custom-room_1').success).toBe(true);
  });

  it('rejects empty, oversized and non url-safe ids', () => {
    expect(roomIdSchema.safeParse('').success).toBe(false);
    expect(roomIdSchema.safeParse('a'.repeat(MAX_ROOM_ID_LENGTH + 1)).success).toBe(false);
    expect(roomIdSchema.safeParse('a'.repeat(MAX_ROOM_ID_LENGTH)).success).toBe(true);
    expect(roomIdSchema.safeParse('room with spaces').success).toBe(false);
    expect(roomIdSchema.safeParse('../etc/passwd').success).toBe(false);
    expect(roomIdSchema.safeParse('<script>').success).toBe(false);
  });

  it('rejects non-string values', () => {
    for (const value of [undefined, null, 42, {}, []]) {
      expect(roomIdSchema.safeParse(value).success).toBe(false);
    }
  });
});

describe('joinRoomArgsSchema', () => {
  it('accepts a valid room id and difficulty', () => {
    expect(joinRoomArgsSchema.safeParse(['room-1', 'hard']).success).toBe(true);
  });

  it('rejects an invalid difficulty, missing or extra arguments', () => {
    expect(joinRoomArgsSchema.safeParse(['room-1', 'banana']).success).toBe(false);
    expect(joinRoomArgsSchema.safeParse(['room-1']).success).toBe(false);
    expect(joinRoomArgsSchema.safeParse([]).success).toBe(false);
    expect(joinRoomArgsSchema.safeParse(['room-1', 'easy', () => 1]).success).toBe(false);
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
