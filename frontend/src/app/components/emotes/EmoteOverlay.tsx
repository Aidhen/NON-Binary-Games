import type { FloatingEmote } from '@/lib/useEmotes';

// Purely decorative: it never captures clicks and is hidden from assistive technology.
export function EmoteOverlay({ emotes }: { emotes: FloatingEmote[] }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      {emotes.map(({ id, emote, left }) => (
        <span
          key={id}
          data-testid="floating-emote"
          style={{ left: `${left}%` }}
          className="absolute bottom-24 text-5xl motion-safe:animate-float"
        >
          {emote}
        </span>
      ))}
    </div>
  );
}
