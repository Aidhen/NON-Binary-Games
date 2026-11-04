// Visual label for a room, derived from its id. It is only a label to recognize the room:
// the full id in the URL stays the only thing that grants access.
// The length must be 2 ** INDEX_BITS so every index maps without bias (a test enforces it).
export const ROOM_EMOJI = [
  // animals
  '🐙', '🦊', '🐢', '🦉', '🐳', '🦋', '🐝', '🐸', '🦀', '🐧', '🦒', '🐘', '🦔', '🐌', '🦜', '🐞',
  // nature
  '🌵', '🌻', '🍄', '🌲', '🌴', '🍀', '🌙', '⭐', '🌈', '🌊', '🌋', '⛄',
  // food
  '🍕', '🍓', '🍉', '🍋', '🥑', '🍩', '🍪', '🥕', '🌽', '🍇', '🍍', '🥨', '🧀', '🍔',
  // objects
  '🚀', '🎲', '🎸', '🎈', '🔑', '🔔', '🎁', '🧲', '⚓', '🎯', '🧩', '🎨', '🔭', '⏰', '🎺', '🚲', '⛵', '🚂', '🏰', '🎩', '🔮', '🧭',
] as const;

export const ROOM_EMOJI_COUNT = 5;

const INDEX_BITS = 6;
const INDEX_MASK = ROOM_EMOJI.length - 1;

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

export const getRoomEmoji = (roomId: string): string[] => {
  const hash = hashRoomId(roomId);
  return Array.from(
    { length: ROOM_EMOJI_COUNT },
    (_, i) => ROOM_EMOJI[(hash >>> (i * INDEX_BITS)) & INDEX_MASK]
  );
};
