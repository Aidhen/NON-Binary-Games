// How every board is drawn: tiles lying on a tray, with a little room between them. No lines: the tray
// showing between the tiles is what separates them, so a board looks the same in a game and in its preview.

/** The tray: what holds the grid of a board. Its color is what shows between the tiles. */
export const BOARD_TRAY = "w-full h-full rounded-2xl bg-[var(--grid-border-inner)] p-1.5 shadow-[var(--shadow-paper)] transition-colors duration-300";

/** One tile. The focus outline stays inside it, so that the tiles next to it do not cover it. */
export const BOARD_TILE = "rounded-md focus-visible:-outline-offset-4";

/** The room between the tiles: less of it when there are many, so that small tiles stay as large as they can. */
export const gapOf = (size: number): string => (size > 8 ? "gap-0.5" : "gap-1");
