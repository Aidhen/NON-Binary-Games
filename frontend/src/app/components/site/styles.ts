// The shapes the pages of the site are made of. They are the paper of the game pages (see globals.css):
// the same radii and the same flat shadow, so that the site and the table look like one thing.
export const CARD = "rounded-[var(--radius-paper)] bg-[var(--paper)] shadow-[var(--shadow-paper)]";
export const BAND = "rounded-[var(--radius-paper)] bg-[var(--paper-well)]";
export const PILL = "inline-block rounded-full bg-[var(--cutout-2)] px-3.5 py-1 text-xs font-bold text-[var(--title-text)]";
export const HEADING = "font-display font-extrabold leading-tight text-[var(--title-text)]";
export const BODY = "font-medium text-[var(--subtitle-text)]";

const BUTTON = "inline-flex min-h-12 cursor-pointer items-center justify-center rounded-[var(--radius-control)] px-6 text-base font-bold shadow-[var(--shadow-paper-sm)] transition-transform duration-150 active:translate-y-0.5 motion-reduce:transition-none";
export const BUTTON_PRIMARY = `${BUTTON} bg-[var(--accent)] text-[var(--accent-ink)]`;
export const BUTTON_SECONDARY = `${BUTTON} bg-[var(--paper)] text-[var(--title-text)]`;
