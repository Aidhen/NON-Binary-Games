import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { getRoomEmoji, ROOM_EMOJI, ROOM_EMOJI_COUNT } from './roomEmoji';

describe('ROOM_EMOJI', () => {
  it('is the set of sixteen drawings, with no repeat', () => {
    expect(ROOM_EMOJI).toHaveLength(16);
    expect(new Set(ROOM_EMOJI).size).toBe(16);
  });
});

describe('getRoomEmoji', () => {
  it('returns ROOM_EMOJI_COUNT drawings taken from the set', () => {
    const icons = getRoomEmoji('4ed062d4-6d34-463e-bafc-2a71b1a94317');

    expect(icons).toHaveLength(ROOM_EMOJI_COUNT);
    icons.forEach((icon) => expect(ROOM_EMOJI).toContain(icon));
  });

  it('never repeats a drawing inside one code', () => {
    for (let i = 0; i < 2000; i++) expect(new Set(getRoomEmoji(randomUUID())).size).toBe(ROOM_EMOJI_COUNT);
  });

  it('is deterministic', () => {
    expect(getRoomEmoji('room-a')).toEqual(getRoomEmoji('room-a'));
  });

  it('differs between rooms', () => {
    expect(getRoomEmoji('room-a')).not.toEqual(getRoomEmoji('room-b'));
  });

  it('keeps the label of a known room stable', () => {
    expect(getRoomEmoji('test-room-123')).toEqual(['teacup', 'gem', 'mushroom', 'icecream', 'donut']);
  });

  it('uses every drawing, in every position, about as often as the others', () => {
    const rounds = 16000;
    const counts = Array.from({ length: ROOM_EMOJI_COUNT }, () => new Map<string, number>());
    for (let i = 0; i < rounds; i++) getRoomEmoji(randomUUID()).forEach((icon, position) => counts[position].set(icon, (counts[position].get(icon) ?? 0) + 1));

    for (const count of counts) {
      expect(count.size).toBe(ROOM_EMOJI.length);
      for (const seen of count.values()) expect(seen).toBeGreaterThan(rounds / 16 / 2);
    }
  });

  it.each(['a', 'AbC_123-xyz', 'x'.repeat(64)])('works with the non-UUID room id %s', (roomId) => {
    const icons = getRoomEmoji(roomId);
    expect(icons).toHaveLength(ROOM_EMOJI_COUNT);
    expect(new Set(icons).size).toBe(ROOM_EMOJI_COUNT);
  });
});
