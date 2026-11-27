import { ROOM_ICONS } from '@nbg/art';
import type { RoomIconId } from '@nbg/art';

// Visual label for a room, derived from its id. It is only a label to recognize the room:
// the full id in the URL stays the only thing that grants access.
// The names say "emoji" because the label used to be emoji; it is now five of the drawings of @nbg/art.
export const ROOM_EMOJI = ROOM_ICONS;

export const ROOM_EMOJI_COUNT = 5;

// FNV-1a, 32 bit. Synchronous on purpose: crypto.subtle.digest is async and would force
// state + effect just to render a label.
const hashRoomId = (roomId: string): number => {
  let hash = 0x811c9dc5;
  for (const char of roomId) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

/**
 * Five different drawings, the same for everybody in the room. Each one is picked among the ones left, with
 * successive divisions of the hash (16 * 15 * 14 * 13 * 12 = 524,160 codes, well inside 32 bits).
 */
export const getRoomEmoji = (roomId: string): RoomIconId[] => {
  let rest = hashRoomId(roomId);
  const left: RoomIconId[] = [...ROOM_EMOJI];
  return Array.from({ length: ROOM_EMOJI_COUNT }, () => {
    const [icon] = left.splice(rest % left.length, 1);
    rest = Math.floor(rest / (left.length + 1));
    return icon;
  });
};
