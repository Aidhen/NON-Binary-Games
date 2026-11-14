import type { GameCoverProps } from '../types';
import { cn } from '@/lib/utils';

/** The lid of a game that is not announced by name yet. Two colors, taken in turn, so that two of them side by side differ. */
export function MysteryCover({ index }: Readonly<GameCoverProps>) {
  return (
    <span
      className={cn(
        "absolute inset-0 flex items-center justify-center rounded-[inherit]",
        "font-display text-5xl font-extrabold text-[var(--box-soon-ink)]",
        index % 2 === 0 ? "bg-[var(--box-soon-1)]" : "bg-[var(--box-soon-2)]"
      )}
    >
      <span className="opacity-40">?</span>
    </span>
  );
}
