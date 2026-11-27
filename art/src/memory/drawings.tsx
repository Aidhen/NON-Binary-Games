import type { ReactNode } from 'react';

export interface MemoryDrawing {
  /** A name for the drawing that does not depend on its place in the deck: for tests and file names (see svg/README.md). */
  id: string;
  /** Always a square, so that every card takes the same room on the table. */
  viewBox: string;
  art: ReactNode;
}

/**
 * The faces of the Memory cards, in the order of the deck: the game sends the place of a face (0 for the first),
 * never the drawing. The order is part of the game and does not change once it is out. A place with no drawing
 * yet is a placeholder (see MemoryCardArt). The sources are the SVG files in svg/.
 */
export const MEMORY_FACES: readonly MemoryDrawing[] = [];

/** The back of every card. Null until it is drawn. */
export const MEMORY_BACK: MemoryDrawing | null = null;
