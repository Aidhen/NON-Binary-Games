import { EmoteArt } from '@nbg/art';
import type { FloatingEmote } from '@/lib/useEmotes';

// As large as the emoji it replaces (text-5xl).
const ART_SIZE = 48;

// Purely decorative: it never captures clicks and is hidden from assistive technology.
export function EmoteOverlay({ emotes }: Readonly<{ emotes: FloatingEmote[] }>) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      {emotes.map(({ id, emote, left }) => (
        <span
          key={id}
          data-testid="floating-emote"
          data-emote={emote}
          style={{ left: `${left}%` }}
          className="absolute bottom-24 motion-safe:animate-float"
        >
          <EmoteArt emote={emote} size={ART_SIZE} />
        </span>
      ))}
    </div>
  );
}
