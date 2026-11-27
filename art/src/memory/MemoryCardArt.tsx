import { MEMORY_BACK, MEMORY_FACES } from './drawings';
import type { MemoryDrawing } from './drawings';

interface MemoryCardArtProps {
  /** The place of the face in the deck, as the game sends it, or `back` for the side that hides it. */
  face: number | 'back';
  /** Side of the drawing, in pixels. */
  size?: number;
  /** Says what the card is to assistive technology. Without it the drawing is decoration, to use where the card is already named. */
  label?: string;
  className?: string;
}

const drawingOf = (face: number | 'back'): MemoryDrawing | null =>
  face === 'back' ? MEMORY_BACK : (Number.isInteger(face) && MEMORY_FACES[face]) || null;

export const hasMemoryArt = (face: number | 'back'): boolean => drawingOf(face) !== null;

/**
 * One side of a Memory card, drawn. A face with no drawing yet is a plain tile with its number, and the back a
 * plain tile: the game can be built and played before the drawings are ready.
 */
export function MemoryCardArt({ face, size = 56, label, className }: Readonly<MemoryCardArtProps>) {
  const naming = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  const drawing = drawingOf(face);

  if (!drawing) {
    return (
      <svg {...naming} data-memory-placeholder={face} viewBox="0 0 72 72" width={size} height={size} className={className}>
        <rect x="4" y="4" width="64" height="64" rx="12" fill="#FFF7E8" stroke="#3A2E3F" strokeWidth="4" />
        {face !== 'back' && (
          <text x="36" y="36" textAnchor="middle" dominantBaseline="central" fontSize="28" fontWeight="700" fill="#3A2E3F">{face + 1}</text>
        )}
      </svg>
    );
  }

  return (
    <svg {...naming} data-memory-art={drawing.id} viewBox={drawing.viewBox} width={size} height={size} className={className}>
      {drawing.art}
    </svg>
  );
}
