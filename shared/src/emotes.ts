/**
 * Quick reactions players can send to the others in the room.
 * Plain Unicode emoji: no assets to load, and screen readers know their names.
 * Keep the list short (max 10): every emote needs a button in the UI.
 */
export const EMOTES = ['💜', '❤️', '😂', '🌹', '👏', '🔥', '🤔', '😢', '🪻', '😎'] as const;

export type Emote = (typeof EMOTES)[number];

/** Minimum time between two emotes sent by the same player (enforced by the server, mirrored by the UI). */
export const EMOTE_COOLDOWN_MS = 50;
