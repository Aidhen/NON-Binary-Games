import { MemoryCardArt } from '@nbg/art';

// Three cards in a fan, as they lie on the lid: the back, The Star and The Moon (faces 17 and 18). They are the real
// drawings, with the card (dark, with its edge) drawn by MemoryCardArt, so the cover cannot drift from the game.
// Positions are percentages of a 4:3 stage, so that the fan scales with the lid.
const CARDS = [
  { face: 'back', left: 33, top: 56, width: 40.5, turn: -16 },
  { face: 17, left: 67, top: 56, width: 40.5, turn: 16 },
  { face: 18, left: 50, top: 54, width: 43.5, turn: 0 },
] as const;

export function MemoryCover() {
  return (
    <span className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-[var(--lid-memory)] shadow-[inset_0_0_0_2.5px_#3A2E3F]">
      <span className="relative aspect-[4/3] h-full max-w-full">
        {CARDS.map(({ face, left, top, width, turn }) => (
          <span key={face} className="absolute" style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, transform: `translate(-50%, -50%) rotate(${turn}deg)` }}>
            <MemoryCardArt face={face} className="block h-auto w-full" />
          </span>
        ))}
      </span>
    </span>
  );
}
