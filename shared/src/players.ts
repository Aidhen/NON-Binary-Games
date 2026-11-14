/**
 * How a player is shown to the others in a room: a generated name (an animal and a color, like "Red Panda")
 * and the color of their cursor and notes. Only fixed lists, never text a player writes: the names are put
 * together by the client from these words, in the language of the page.
 */

/** Colors to choose from. More than the players of a room (MAX_PLAYERS_PER_ROOM), so there is always a free one. */
export const PLAYER_COLORS = ['red', 'orange', 'green', 'teal', 'blue', 'purple', 'pink'] as const;

export type PlayerColor = (typeof PLAYER_COLORS)[number];

/** Animals of the generated names. Each room gives a different one to each player. */
export const PLAYER_ANIMALS = [
  'panda', 'fox', 'otter', 'owl', 'frog', 'koala', 'hedgehog', 'penguin', 'rabbit', 'turtle', 'octopus', 'dolphin',
] as const;

export type PlayerAnimal = (typeof PLAYER_ANIMALS)[number];

/** What the others see of a player. `alias` is the name of the player in this room only (see SocketData.alias). */
export interface PlayerProfile {
  alias: string;
  animal: PlayerAnimal;
  color: PlayerColor;
}
