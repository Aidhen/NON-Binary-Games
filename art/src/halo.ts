import type { CSSProperties } from 'react';

/**
 * A thin cream line under the plum outline, so that the outline can still be seen on dark paper. The theme
 * sets --art-halo (see globals.css); without it the halo is transparent and light themes look as drawn.
 */
export const HALO: CSSProperties = { fill: 'var(--art-halo, transparent)', stroke: 'var(--art-halo, transparent)' };
