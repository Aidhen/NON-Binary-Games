import type { CSSProperties } from 'react';

const OUTLINE = '#3A2E3F';
const CREAM = '#FFF7E8';
const HONEY = '#F2B544';
const BLUSH = '#FF9FA8';

interface BeeArtProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The bee asleep under a cell of the Flower Field. It is drawn like the emotes: the square-head silhouette
 * lying on its side, the same dark plum outline, closed eyes and a blush, so that finding it feels like a
 * surprise and never like a punishment (no stinger, no frown). It dozes, nose a little up. Like the flowers
 * and the emotes, the colors are part of the drawing and do not change with the theme.
 *
 * It is decoration: the cell it sits in already says what it holds. The wings carry `data-bee-wings` so that
 * the page can make them flutter for whoever welcomes motion (see globals.css).
 */
export function BeeArt({ className, style }: Readonly<BeeArtProps>) {
  return (
    <svg aria-hidden="true" data-bee viewBox="0 0 40 40" className={className} style={style}>
      {/* About 70% of the tile, a little high, and tilted as if dozing. */}
      <g transform="translate(0 -1) rotate(-12 20 20)" strokeLinejoin="round" strokeLinecap="round">
        <g data-bee-wings fill={CREAM} stroke={OUTLINE} strokeWidth="2">
          <ellipse cx="13" cy="9.5" rx="5" ry="3.2" transform="rotate(-25 13 9.5)" />
          <ellipse cx="20" cy="8" rx="4.6" ry="3" transform="rotate(-8 20 8)" />
        </g>
        <path d="M26 12.8 L27 8.6 M30.2 13.6 L32.8 10.4" fill="none" stroke={OUTLINE} strokeWidth="2" />
        <circle cx="27" cy="7.6" r="1.4" fill={OUTLINE} />
        <circle cx="33.4" cy="9.6" r="1.4" fill={OUTLINE} />
        <rect x="9" y="12" width="22" height="16" rx="6" fill={HONEY} />
        <path d="M13.2 12.6 V27.4 M18.2 12.4 V27.6" fill="none" stroke={OUTLINE} strokeWidth="2.6" strokeLinecap="butt" />
        <rect x="9" y="12" width="22" height="16" rx="6" fill="none" stroke={OUTLINE} strokeWidth="2.3" />
        <ellipse cx="23.6" cy="23" rx="1.7" ry="1.1" fill={BLUSH} stroke="none" />
        <ellipse cx="29.4" cy="23" rx="1.7" ry="1.1" fill={BLUSH} stroke="none" />
        <path d="M23 19.4 q1.6 -2 3.2 0 M27.6 19.4 q1.6 -2 3.2 0 M25.4 23 q1.7 1.5 3.4 0" fill="none" stroke={OUTLINE} strokeWidth="1.7" />
      </g>
    </svg>
  );
}
