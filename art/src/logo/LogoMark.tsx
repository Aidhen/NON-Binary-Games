import { useId } from 'react';

interface LogoMarkProps {
  /** Side of the drawing, in pixels. */
  size?: number;
  /** The blush on the two faces. It is lost below about 96 pixels, so the small logo of a header leaves it out. */
  cheeks?: boolean;
  /** The little star above the tiles, for the large logo of a hero. */
  sparkle?: boolean;
  /** Says what the drawing is to assistive technology. Without it the logo is decoration, next to the written name. */
  label?: string;
  className?: string;
}

const TILE = { width: 54, height: 54, rx: 17, y: 36 };
const LEFT = { ...TILE, x: 14, transform: 'rotate(-5 41 63)' };
const RIGHT = { ...TILE, x: 50, transform: 'rotate(5 77 63)' };

// A theme gives the logo its colors through these variables; the fallback is the palette it was drawn with.
const COLORS = {
  left: 'var(--logo-left, #3F9E8F)',
  right: 'var(--logo-right, #E0603F)',
  overlap: 'var(--logo-overlap, #A58BF0)',
  line: 'var(--logo-line, #3A2E3F)',
  shadow: 'var(--logo-shadow, #3A2E3F)',
  face: 'var(--logo-face, #3A2E3F)',
  sparkle: 'var(--logo-sparkle, #F2B544)',
};
const CHEEK = '#FF9FA8';

/**
 * The logo: two tiles with a face, leaning on each other. Where they overlap they make a third color,
 * which is the "(non)" of the name: the part that is neither one nor the other.
 */
export function LogoMark({ size = 56, cheeks = false, sparkle = false, label, className }: Readonly<LogoMarkProps>) {
  const clipId = useId();
  const naming = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  // Thinner lines when the logo is large, so that it does not look heavier than the text next to it.
  const outline = size >= 160 ? 3 : 4;
  const faceLine = { fill: 'none', strokeWidth: outline - 0.6, strokeLinecap: 'round' as const, style: { stroke: COLORS.face } };

  return (
    <svg {...naming} viewBox="0 0 120 120" width={size} height={size} className={className}>
      <defs>
        <clipPath id={clipId}><rect {...LEFT} /></clipPath>
      </defs>
      <g transform="translate(3 4)" style={{ fill: COLORS.shadow }}>
        <rect {...LEFT} />
        <rect {...RIGHT} />
      </g>
      <rect {...LEFT} style={{ fill: COLORS.left }} />
      <rect {...RIGHT} style={{ fill: COLORS.right }} />
      <g clipPath={`url(#${clipId})`}><rect {...RIGHT} style={{ fill: COLORS.overlap }} /></g>
      {cheeks && (
        // Under the outlines and clear of them: the blush never touches the border of a tile.
        <g fill={CHEEK} data-logo-part="cheeks">
          <g transform={LEFT.transform}><ellipse cx="20" cy="66" rx="2.3" ry="1.7" /><ellipse cx="43.5" cy="66" rx="2.3" ry="1.7" /></g>
          <g transform={RIGHT.transform}><ellipse cx="74.5" cy="66" rx="2.3" ry="1.7" /><ellipse cx="97.5" cy="66" rx="2.3" ry="1.7" /></g>
        </g>
      )}
      <g fill="none" strokeWidth={outline} style={{ stroke: COLORS.line }}>
        <rect {...LEFT} />
        <rect {...RIGHT} />
      </g>
      <g transform={LEFT.transform}>
        <path d="M22 61 q3 -4 6 0 M36 61 q3 -4 6 0 M26 68 q6 6 12 0" {...faceLine} />
      </g>
      <g transform={RIGHT.transform}>
        <circle cx="79" cy="61" r="3" style={{ fill: COLORS.face }} />
        <circle cx="93" cy="61" r="3" style={{ fill: COLORS.face }} />
        <path d="M80 68 q6 6 12 0" {...faceLine} />
      </g>
      {sparkle && (
        <path
          data-logo-part="sparkle"
          d="M100 8 Q101.5 18 112 20 Q101.5 22 100 32 Q98.5 22 88 20 Q98.5 18 100 8Z"
          strokeWidth="2.2"
          strokeLinejoin="round"
          style={{ fill: COLORS.sparkle, stroke: COLORS.line }}
        />
      )}
    </svg>
  );
}
