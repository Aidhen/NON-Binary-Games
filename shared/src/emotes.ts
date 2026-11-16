/**
 * Quick reactions players can send to the others in the room.
 * Plain Unicode emoji: no assets to load, and screen readers know their names.
 *
 * This is the only place to edit: one row per side of the emote bar, in the order the buttons are shown.
 * The first row is the side players see when the game opens, the second one appears when they flip the bar.
 * Each row has exactly EMOTES_PER_PAGE emotes (the last slot of the bar is the flip button) and no emote is repeated.
 */
export const EMOTE_PAGES = [
  ['💜', '🔥', '😂', '😤', '👏', '😎', '🤔', '😢', '😴'],
  ['❤️', '🎉', '🦆', '🫪', '🙏', '💪', '😶‍🌫️', '🤯', '🫰'],
] as const;

export const EMOTES_PER_PAGE = 9;

/** Every emote of both sides: the server accepts exactly these values. */
export const EMOTES = [...EMOTE_PAGES[0], ...EMOTE_PAGES[1]] as const;

export type Emote = (typeof EMOTES)[number];

/** Minimum time between two emotes sent by the same player (enforced by the server, mirrored by the UI). */
export const EMOTE_COOLDOWN_MS = 50;
