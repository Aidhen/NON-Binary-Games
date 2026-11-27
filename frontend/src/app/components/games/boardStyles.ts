// How every board is drawn: tiles lying on a tray, with a little room between them. No lines: the tray
// showing between the tiles is what separates them, so a board looks the same in a game and in its preview.

/** The tray: what holds the grid of a board. Its color is what shows between the tiles. */
export const BOARD_TRAY = "w-full h-full rounded-2xl bg-[var(--grid-border-inner)] p-1.5 shadow-[var(--shadow-paper)] transition-colors duration-300";

/** One tile. The focus outline stays inside it, so that the tiles next to it do not cover it. */
export const BOARD_TILE = "rounded-md focus-visible:-outline-offset-4";

/** The room between the tiles: less of it when there are many, so that small tiles stay as large as they can. */
export const gapOf = (size: number): string => (size > 8 ? "gap-0.5" : "gap-1");

/**
 * On a phone the board of a game never grows past what is left of the screen once the header, the players and
 * the controls have their share (about 24rem), so that the board and the controls under it are both in the first
 * screen. It never gets smaller than 18rem. A larger screen is not touched.
 */
export const BOARD_FIT = "max-sm:mx-auto max-sm:max-w-[max(18rem,calc(100dvh-24rem))]";
