import { EMOTES } from '@nbg/shared';
import { EmoteArt } from '@nbg/art';

// Six emotes per row, on every screen. The showcase only has full rows: emotes that would not fill the last one are left out.
export const EMOTES_PER_ROW = 6;
export const SHOWN_EMOTES = EMOTES.slice(0, EMOTES.length - (EMOTES.length % EMOTES_PER_ROW));

/** The emotes, laid out to be looked at. Decoration: they are named where they can be sent, in the bar of a game. */
export function EmoteShowcase() {
  return (
    <div aria-hidden="true" data-testid="emote-showcase" className="grid max-w-md grid-cols-6 gap-2">
      {SHOWN_EMOTES.map((emote) => (
        <span key={emote} className="flex aspect-square items-center justify-center rounded-[var(--radius-control)] bg-[var(--paper)] shadow-[var(--shadow-paper-sm)]">
          <EmoteArt emote={emote} size={36} className="h-auto w-3/4" />
        </span>
      ))}
    </div>
  );
}
