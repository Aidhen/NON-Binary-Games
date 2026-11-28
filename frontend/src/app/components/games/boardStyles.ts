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

/**
 * The box the cards of the Memory are laid out in. A phone gives it the height that is left of the screen once the
 * header, the players, the toolbar and the counter have their share (about 21rem), never less than 16rem, and the
 * page measures it to pick how many cards go on a row. A larger screen gets a box as tall as the screen allows, up
 * to 44rem, and wider than the other boards.
 */
export const MEMORY_FIT = "w-full max-sm:h-[max(16rem,calc(100dvh-21rem))] sm:h-[clamp(20rem,calc(100dvh-26rem),44rem)]";

/** The cards are tall, like tarot cards: 3 wide for 4 high. */
const CARD_RATIO = 3 / 4;
const MIN_COLUMNS = 3;
const MAX_COLUMNS = 11;

/** The room between the cards: 8 px for big ones, down to 3 px when they get small, so that small cards stay as large as they can. */
export const memoryGapOf = (cardWidth: number): number => Math.min(8, Math.max(3, Math.round(cardWidth / 10)));

export interface MemoryGrid {
  columns: number;
  rows: number;
  /** In pixels. The height of a card is 4/3 of it. */
  cardWidth: number;
  gap: number;
}

/** The largest card for a number of columns that fits the box, with the gap that goes with its size. */
const gridFor = (count: number, columns: number, boxWidth: number, boxHeight: number): MemoryGrid => {
  const rows = Math.ceil(count / columns);
  const widthWith = (gap: number) => Math.min((boxWidth - gap * (columns - 1)) / columns, ((boxHeight - gap * (rows - 1)) * CARD_RATIO) / rows);
  // The gap depends on the card and the card on the gap: one round from the widest gap settles it.
  const gap = memoryGapOf(widthWith(8));
  return { columns, rows, cardWidth: Math.max(0, Math.floor(widthWith(gap))), gap };
};

/**
 * How the cards of a table go in a box: the number of columns, from 3 to 11, that gives the largest cards. The last
 * row can be shorter, and the page centers it. On a tall narrow box that is more rows (a phone), on a wide one more
 * columns. An empty box (not measured yet) gets a plain 6 columns of small cards.
 */
export const fitMemoryGrid = (count: number, boxWidth: number, boxHeight: number): MemoryGrid => {
  if (count <= 0 || boxWidth <= 0 || boxHeight <= 0) return { columns: Math.min(6, Math.max(1, count)), rows: Math.ceil(count / 6), cardWidth: 48, gap: 5 };

  let best = gridFor(count, Math.min(MIN_COLUMNS, count), boxWidth, boxHeight);
  for (let columns = MIN_COLUMNS + 1; columns <= Math.min(MAX_COLUMNS, count); columns++) {
    const candidate = gridFor(count, columns, boxWidth, boxHeight);
    // On a tie the fewer columns win: the board stays closer to a column of cards on a phone.
    if (candidate.cardWidth > best.cardWidth) best = candidate;
  }
  return best;
};
