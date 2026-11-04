import { describe, expect, it } from 'vitest';
import { getRoomEmoji, ROOM_EMOJI, ROOM_EMOJI_COUNT } from './roomEmoji';

describe('ROOM_EMOJI', () => {
  // 5 slices of 6 bits: the list must have exactly 2 ** 6 entries to map without bias.
  it('has exactly 64 entries', () => {
    expect(ROOM_EMOJI).toHaveLength(64);
  });

  it('has no duplicates', () => {
    expect(new Set(ROOM_EMOJI).size).toBe(ROOM_EMOJI.length);
  });

  it('contains only single code point emoji', () => {
    ROOM_EMOJI.forEach((emoji) => expect([...emoji]).toHaveLength(1));
  });
});

describe('getRoomEmoji', () => {
  it('returns ROOM_EMOJI_COUNT emoji taken from the list', () => {
    const emoji = getRoomEmoji('4ed062d4-6d34-463e-bafc-2a71b1a94317');

    expect(emoji).toHaveLength(ROOM_EMOJI_COUNT);
    emoji.forEach((item) => expect(ROOM_EMOJI).toContain(item));
  });

  it('returns the same label for the same room id', () => {
    expect(getRoomEmoji('room-a')).toEqual(getRoomEmoji('room-a'));
  });

  it('returns different labels for different room ids', () => {
    expect(getRoomEmoji('room-a')).not.toEqual(getRoomEmoji('room-b'));
  });

  // Pinned on purpose: changing the hash or reordering the list would silently relabel every room.
  it('keeps the label of a known room stable', () => {
    expect(getRoomEmoji('test-room-123')).toEqual(['🐝', '🧀', '🦋', '🎁', '🎲']);
  });

  it.each(['a', 'AbC_123-xyz', 'x'.repeat(64)])('works with the non-UUID room id %s', (roomId) => {
    expect(getRoomEmoji(roomId)).toHaveLength(ROOM_EMOJI_COUNT);
  });
});
