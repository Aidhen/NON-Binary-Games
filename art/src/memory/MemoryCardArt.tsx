import { MEMORY_BACK, MEMORY_FACES } from './drawings';
import type { MemoryDrawing } from './drawings';

interface MemoryCardArtProps {
  /** The place of the face in the deck, as the game sends it, or `back` for the side that hides it. */
  face: number | 'back';
  /** Width of the card, in pixels. The height follows the 3:4 of the drawings. */
  size?: number;
  /** Says what the card is to assistive technology. Without it the drawing is decoration, to use where the card is already named. */
  label?: string;
  className?: string;
}

const drawingOf = (face: number | 'back'): MemoryDrawing | null =>
  face === 'back' ? MEMORY_BACK : (Number.isInteger(face) && MEMORY_FACES[face]) || null;

export const hasMemoryArt = (face: number | 'back'): boolean => drawingOf(face) !== null;

// The cards are tarot cards: tall, 3:4 like the drawings, so a drawing fills its card and is never shrunk into a square.
const CARD_WIDTH = 300;
const CARD_HEIGHT = 400;
const heightOf = (width: number) => Math.round((width * CARD_HEIGHT) / CARD_WIDTH);

/**
 * One side of a Memory card, drawn. The card itself (the dark face and its border) is drawn here, the same for every
 * face and for the back, and the drawing sits on it edge to edge. A face with no drawing yet is a plain card with its
 * number, and the back a plain card: the game can be built and played before the drawings are ready.
 */
export function MemoryCardArt({ face, size = 56, label, className }: Readonly<MemoryCardArtProps>) {
  const naming = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  const drawing = drawingOf(face);
  const card = <rect x="1.5" y="1.5" width={CARD_WIDTH - 3} height={CARD_HEIGHT - 3} rx="24" fill="#141B2E" stroke="#263049" strokeWidth="3" />;

  if (!drawing) {
    return (
      <svg {...naming} data-memory-placeholder={face} viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`} width={size} height={heightOf(size)} className={className}>
        {card}
        {face !== 'back' && (
          <text x="150" y="200" textAnchor="middle" dominantBaseline="central" fontSize="96" fontWeight="700" fill="#F4F1EA">{face + 1}</text>
        )}
      </svg>
    );
  }

  return (
    <svg {...naming} data-memory-art={drawing.id} viewBox={drawing.viewBox} width={size} height={heightOf(size)} className={className}>
      {card}
      {drawing.art}
    </svg>
  );
}
