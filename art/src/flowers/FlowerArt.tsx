import type { CSSProperties, ReactNode } from 'react';

const OUTLINE = '#3A2E3F';
const LEAF = '#3F9E8F';
const CREAM = '#FFF7E8';
const HEART = '#F2B544';

/**
 * The petals of the flowers that grow on a cleared Flower Field. Like the emotes, the colors are part of the
 * drawing and do not change with the theme, and the outline is the same dark plum.
 */
export const FLOWER_COLORS = ['#E0603F', '#F2B544', '#A58BF0', '#FF9FA8', '#5B8DEF', '#8B5CF6'] as const;

export const FLOWER_KINDS = ['daisy', 'round', 'tulip', 'star', 'bud'] as const;
export type FlowerKind = (typeof FLOWER_KINDS)[number];

const DAISY_PETALS = [0, 45, 90, 135, 180, 225, 270, 315];
const ROUND_PETALS: readonly [number, number][] = [[20, 9.8], [25.9, 14.1], [23.6, 21], [16.4, 21], [14.1, 14.1]];

/** Stem and leaf, the same for every flower: the head sits on top of them, centred on (20, 16). */
const stem = (
  <>
    <path d="M20 37 V22" fill="none" stroke={OUTLINE} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M20 32 q-8.5 -0.5 -10 -8.5 q8 0.5 10 8.5Z" fill={LEAF} stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round" />
  </>
);

const heads: Record<FlowerKind, (color: string) => ReactNode> = {
  // White petals whatever the color: the color goes to the heart.
  daisy: (color) => (
    <>
      {DAISY_PETALS.map((angle) => (
        <ellipse key={angle} cx="20" cy="9.5" rx="3.2" ry="6" fill={CREAM} stroke={OUTLINE} strokeWidth="2" transform={`rotate(${angle} 20 16)`} />
      ))}
      <circle cx="20" cy="16" r="4.6" fill={color} stroke={OUTLINE} strokeWidth="2.2" />
    </>
  ),
  round: (color) => (
    <>
      {ROUND_PETALS.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill={color} stroke={OUTLINE} strokeWidth="2.2" />)}
      <circle cx="20" cy="16" r="3.6" fill={HEART} stroke={OUTLINE} strokeWidth="2.2" />
    </>
  ),
  tulip: (color) => (
    <path d="M11.5 9 l4.2 4 l4.3 -6.5 l4.3 6.5 l4.2 -4 v8 q0 8.5 -8.5 8.5 q-8.5 0 -8.5 -8.5Z" fill={color} stroke={OUTLINE} strokeWidth="2.4" strokeLinejoin="round" />
  ),
  star: (color) => (
    <>
      <path d="M20 6 L22.7 12.3 L29.5 12.9 L24.4 17.4 L25.9 24.1 L20 20.6 L14.1 24.1 L15.6 17.4 L10.5 12.9 L17.3 12.3Z" fill={color} stroke={OUTLINE} strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="20" cy="16.5" r="2.6" fill={CREAM} stroke={OUTLINE} strokeWidth="1.8" />
    </>
  ),
  bud: (color) => (
    <>
      <circle cx="20" cy="15" r="8.5" fill={color} stroke={OUTLINE} strokeWidth="2.4" />
      <path d="M17.5 15 a2.5 2.5 0 1 1 2.5 2.5 a5 5 0 1 1 5 -5" fill="none" stroke={OUTLINE} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
};

/** How the head moves while the flower grows: it turns on itself, or, for a head that is not round, it opens up. */
export const HEAD_MOTION: Record<FlowerKind, 'spin' | 'grow'> = { daisy: 'spin', round: 'spin', tulip: 'grow', star: 'spin', bud: 'spin' };

interface FlowerArtProps {
  kind: FlowerKind;
  color: string;
  className?: string;
  style?: CSSProperties;
}

/** One flower, drawn. It is decoration: the cell it grows on already says what it holds. */
export function FlowerArt({ kind, color, className, style }: Readonly<FlowerArtProps>) {
  return (
    <svg aria-hidden="true" data-flower={kind} viewBox="0 0 40 40" className={className} style={style}>
      {stem}
      {/* The head on its own, so that it can move while the flower grows (see the bloom in globals.css). */}
      <g data-flower-head={HEAD_MOTION[kind]}>{heads[kind](color)}</g>
    </svg>
  );
}
