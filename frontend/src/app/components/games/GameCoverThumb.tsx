import type { GameEntry } from './types';

// The covers are drawn for the lid of a box on the table, which is this wide.
const LID_SIZE = 128;

interface GameCoverThumbProps {
  game: GameEntry;
  /** Where the game is in its list (see GameCoverProps). */
  index: number;
  /** Side of the thumbnail, in pixels. */
  size: number;
  className?: string;
}

/** The cover of a game at any size: the lid of the table, scaled, so that a cover is drawn once and looks the same everywhere. */
export function GameCoverThumb({ game, index, size, className }: Readonly<GameCoverThumbProps>) {
  return (
    <span aria-hidden="true" style={{ width: size, height: size }} className={`relative block shrink-0 overflow-hidden ${className ?? ''}`}>
      <span
        style={{ width: LID_SIZE, height: LID_SIZE, transform: `scale(${size / LID_SIZE})` }}
        className="absolute left-0 top-0 block origin-top-left overflow-hidden rounded-[var(--radius-paper)]"
      >
        <game.Cover index={index} />
      </span>
    </span>
  );
}
