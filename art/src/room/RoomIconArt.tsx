import type { CSSProperties, ReactNode } from 'react';
import { HALO } from '../halo';

/** The drawings that label a room (five of them, see frontend/src/lib/roomEmoji.ts). Order matters: it is part of how a room id maps to its code. */
export const ROOM_ICONS = [
  'lemon', 'cherries', 'mushroom', 'moon', 'star', 'leaf', 'teacup', 'house', 'cloud', 'umbrella', 'icecream', 'acorn', 'sailboat', 'donut', 'balloon', 'gem',
] as const;

export type RoomIconId = (typeof ROOM_ICONS)[number];

interface RoomIconArtProps {
  icon: RoomIconId;
  className?: string;
  style?: CSSProperties;
}

/*
 * Each drawing is three layers: a halo (cream in the dark themes, see HALO), the plum shadow offset
 * down and to the right, and the colored shapes. The colors are part of the drawing and do not change with the theme.
 */
const DRAWINGS: Record<RoomIconId, ReactNode> = {
  lemon: (
    <>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round" style={HALO}>
        <circle cx="32" cy="12.5" r="2.7" strokeWidth="4.4"/>
        <circle cx="8" cy="29.5" r="2.7" strokeWidth="4.4"/>
        <ellipse cx="20" cy="21" rx="14" ry="10" transform="rotate(-35 20 21)" strokeWidth="4.4"/>
      </g>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round">
        <circle cx="32" cy="12.5" r="2.7" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
        <circle cx="8" cy="29.5" r="2.7" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
        <ellipse cx="20" cy="21" rx="14" ry="10" transform="rotate(-35 20 21)" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
      </g>
      <g strokeLinejoin="round" strokeLinecap="round">
        <circle cx="32" cy="12.5" r="2.7" fill="#F5D547" stroke="#3A2E3F" strokeWidth="2.4"/>
        <circle cx="8" cy="29.5" r="2.7" fill="#F5D547" stroke="#3A2E3F" strokeWidth="2.4"/>
        <ellipse cx="20" cy="21" rx="14" ry="10" transform="rotate(-35 20 21)" fill="#F5D547" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M12.5 21 Q13.5 15.5 19 12.5" fill="none" stroke="#FFF7E8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ),
  cherries: (
    <>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round" style={HALO}>
        <path d="M12 24 Q13 11 25 6 M28 25 Q27 14 25 6"  fill="none" strokeWidth="4.2"/>
        <path d="M25 6 Q31 2.5 36 6.5 Q30 10.5 25 6Z" strokeWidth="4.4"/>
        <circle cx="12" cy="28.5" r="7" strokeWidth="4.4"/>
        <circle cx="28.5" cy="29.5" r="7" strokeWidth="4.4"/>
      </g>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round">
        <path d="M12 24 Q13 11 25 6 M28 25 Q27 14 25 6"  fill="none" stroke="#3A2E3F" strokeWidth="2.2"/>
        <path d="M25 6 Q31 2.5 36 6.5 Q30 10.5 25 6Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
        <circle cx="12" cy="28.5" r="7" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
        <circle cx="28.5" cy="29.5" r="7" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
      </g>
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M12 24 Q13 11 25 6 M28 25 Q27 14 25 6"  fill="none" stroke="#3A2E3F" strokeWidth="2.2"/>
        <path d="M25 6 Q31 2.5 36 6.5 Q30 10.5 25 6Z" fill="#6DB55E" stroke="#3A2E3F" strokeWidth="2.4"/>
        <circle cx="12" cy="28.5" r="7" fill="#D9455F" stroke="#3A2E3F" strokeWidth="2.4"/>
        <circle cx="28.5" cy="29.5" r="7" fill="#D9455F" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M8.5 26.5 Q9 24.5 11 23.5" fill="none" stroke="#FFF7E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M25 27.5 Q25.5 25.5 27.5 24.5" fill="none" stroke="#FFF7E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ),
  mushroom: (
    <>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round" style={HALO}>
        <path d="M13 22 V31 Q13 35.5 17.5 35.5 H22.5 Q27 35.5 27 31 V22Z" strokeWidth="4.4"/>
        <path d="M4.5 22 C4.5 11 11.5 4.5 20 4.5 C28.5 4.5 35.5 11 35.5 22 Q35.5 24 33.5 24 H6.5 Q4.5 24 4.5 22Z" strokeWidth="4.4"/>
      </g>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round">
        <path d="M13 22 V31 Q13 35.5 17.5 35.5 H22.5 Q27 35.5 27 31 V22Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M4.5 22 C4.5 11 11.5 4.5 20 4.5 C28.5 4.5 35.5 11 35.5 22 Q35.5 24 33.5 24 H6.5 Q4.5 24 4.5 22Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
      </g>
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M13 22 V31 Q13 35.5 17.5 35.5 H22.5 Q27 35.5 27 31 V22Z" fill="#FFF7E8" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M4.5 22 C4.5 11 11.5 4.5 20 4.5 C28.5 4.5 35.5 11 35.5 22 Q35.5 24 33.5 24 H6.5 Q4.5 24 4.5 22Z" fill="#E0603F" stroke="#3A2E3F" strokeWidth="2.4"/>
        <circle cx="12.5" cy="15" r="3" fill="#FFF7E8"/>
        <circle cx="22.5" cy="10.5" r="2.6" fill="#FFF7E8"/>
        <circle cx="28.5" cy="18" r="3" fill="#FFF7E8"/>
      </g>
    </>
  ),
  moon: (
    <>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round" style={HALO}>
        <path d="M25 4.5 A15.5 15.5 0 1 0 35.5 27 A12.5 12.5 0 0 1 25 4.5Z" strokeWidth="4.4"/>
      </g>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round">
        <path d="M25 4.5 A15.5 15.5 0 1 0 35.5 27 A12.5 12.5 0 0 1 25 4.5Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
      </g>
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M25 4.5 A15.5 15.5 0 1 0 35.5 27 A12.5 12.5 0 0 1 25 4.5Z" fill="#FFF7E8" stroke="#3A2E3F" strokeWidth="2.4"/>
        <circle cx="14" cy="24" r="1.6" fill="#E3D3AE"/>
        <circle cx="19" cy="29" r="1.2" fill="#E3D3AE"/>
      </g>
    </>
  ),
  star: (
    <>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round" style={HALO}>
        <path d="M18.53 7.34 Q20 4.5 21.47 7.34 L24.07 12.35 Q25 14.12 26.97 14.45 L32.54 15.38 Q35.69 15.9 33.45 18.18 L29.49 22.2 Q28.08 23.63 28.38 25.6 L29.22 31.18 Q29.7 34.35 26.84 32.92 L21.79 30.39 Q20 29.5 18.21 30.39 L13.16 32.92 Q10.3 34.35 10.78 31.18 L11.62 25.6 Q11.92 23.63 10.51 22.2 L6.55 18.18 Q4.31 15.9 7.46 15.38 L13.03 14.45 Q15 14.12 15.93 12.35 Z" strokeWidth="4.6"/>
      </g>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round">
        <path d="M18.53 7.34 Q20 4.5 21.47 7.34 L24.07 12.35 Q25 14.12 26.97 14.45 L32.54 15.38 Q35.69 15.9 33.45 18.18 L29.49 22.2 Q28.08 23.63 28.38 25.6 L29.22 31.18 Q29.7 34.35 26.84 32.92 L21.79 30.39 Q20 29.5 18.21 30.39 L13.16 32.92 Q10.3 34.35 10.78 31.18 L11.62 25.6 Q11.92 23.63 10.51 22.2 L6.55 18.18 Q4.31 15.9 7.46 15.38 L13.03 14.45 Q15 14.12 15.93 12.35 Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.6"/>
      </g>
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M18.53 7.34 Q20 4.5 21.47 7.34 L24.07 12.35 Q25 14.12 26.97 14.45 L32.54 15.38 Q35.69 15.9 33.45 18.18 L29.49 22.2 Q28.08 23.63 28.38 25.6 L29.22 31.18 Q29.7 34.35 26.84 32.92 L21.79 30.39 Q20 29.5 18.21 30.39 L13.16 32.92 Q10.3 34.35 10.78 31.18 L11.62 25.6 Q11.92 23.63 10.51 22.2 L6.55 18.18 Q4.31 15.9 7.46 15.38 L13.03 14.45 Q15 14.12 15.93 12.35 Z" fill="#F2B544" stroke="#3A2E3F" strokeWidth="2.6"/>
        <path d="M15.5 17 L18 13" fill="none" stroke="#FFF7E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ),
  leaf: (
    <>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round" style={HALO}>
        <path d="M7 33 L3.5 36.5" fill="none" strokeWidth="4.4"/>
        <path d="M7 33 C3.5 18 14 5.5 34 5.5 C36 25 22 36.5 7 33Z" strokeWidth="4.4"/>
      </g>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round">
        <path d="M7 33 L3.5 36.5" fill="none" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M7 33 C3.5 18 14 5.5 34 5.5 C36 25 22 36.5 7 33Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
      </g>
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M7 33 L3.5 36.5" fill="none" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M7 33 C3.5 18 14 5.5 34 5.5 C36 25 22 36.5 7 33Z" fill="#6DB55E" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M8.5 31.5 Q20 21 30 9.5" fill="none" stroke="#3A2E3F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ),
  teacup: (
    <>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round" style={HALO}>
        <path d="M29 19.5 H32 Q37 19.5 37 24 Q37 28.5 31 28.5" fill="none" strokeWidth="8.4"/>
        <ellipse cx="18" cy="35" rx="14" ry="3" strokeWidth="4.4"/>
        <path d="M5.5 16.5 H30.5 V23 Q30.5 33 20 33 H16 Q5.5 33 5.5 23Z" strokeWidth="4.4"/>
      </g>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round">
        <path d="M29 19.5 H32 Q37 19.5 37 24 Q37 28.5 31 28.5" fill="none" stroke="#3A2E3F" strokeWidth="6.4"/>
        <ellipse cx="18" cy="35" rx="14" ry="3" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M5.5 16.5 H30.5 V23 Q30.5 33 20 33 H16 Q5.5 33 5.5 23Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
      </g>
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M29 19.5 H32 Q37 19.5 37 24 Q37 28.5 31 28.5" fill="none" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M29 19.5 H32 Q37 19.5 37 24 Q37 28.5 31 28.5" fill="none" stroke="#3F9E8F" strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="18" cy="35" rx="14" ry="3" fill="#FFF7E8" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M5.5 16.5 H30.5 V23 Q30.5 33 20 33 H16 Q5.5 33 5.5 23Z" fill="#3F9E8F" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M11 22 V25" fill="none" stroke="#FFF7E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 4 q-3 3 0 5.5 q3 2.5 0 5 M20 3 q-3 3 0 5.5 q3 2.5 0 5" fill="none" stroke="#3A2E3F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ),
  house: (
    <>
      <g transform="translate(0 .5)">
        <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round" style={HALO}>
          <rect x="26" y="7" width="5.5" height="11" rx="2" strokeWidth="4.4"/>
          <rect x="7.5" y="18" width="25" height="17.5" rx="3.5" strokeWidth="4.4"/>
          <path d="M6.5 21 Q3.5 21 5.69 18.95 L15.63 9.61 Q20 5.5 24.37 9.61 L34.31 18.95 Q36.5 21 33.5 21 Z" strokeWidth="4.4"/>
        </g>
        <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round">
          <rect x="26" y="7" width="5.5" height="11" rx="2" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
          <rect x="7.5" y="18" width="25" height="17.5" rx="3.5" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
          <path d="M6.5 21 Q3.5 21 5.69 18.95 L15.63 9.61 Q20 5.5 24.37 9.61 L34.31 18.95 Q36.5 21 33.5 21 Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
        </g>
        <g strokeLinejoin="round" strokeLinecap="round">
          <rect x="26" y="7" width="5.5" height="11" rx="2" fill="#B97A4A" stroke="#3A2E3F" strokeWidth="2.4"/>
          <rect x="7.5" y="18" width="25" height="17.5" rx="3.5" fill="#FFF7E8" stroke="#3A2E3F" strokeWidth="2.4"/>
          <path d="M6.5 21 Q3.5 21 5.69 18.95 L15.63 9.61 Q20 5.5 24.37 9.61 L34.31 18.95 Q36.5 21 33.5 21 Z" fill="#E0603F" stroke="#3A2E3F" strokeWidth="2.4"/>
          <path d="M16.5 35.5 V29.5 Q16.5 26 20 26 Q23.5 26 23.5 29.5 V35.5Z" fill="#F2B544" stroke="#3A2E3F" strokeWidth="2.4"/>
        </g>
      </g>
    </>
  ),
  cloud: (
    <>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round" style={HALO}>
        <path d="M10 32 A6.5 6.5 0 0 1 9 19 A8.5 8.5 0 0 1 22 13.5 A7.5 7.5 0 0 1 32.5 19 A6.5 6.5 0 0 1 31 32Z" strokeWidth="4.4"/>
      </g>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round">
        <path d="M10 32 A6.5 6.5 0 0 1 9 19 A8.5 8.5 0 0 1 22 13.5 A7.5 7.5 0 0 1 32.5 19 A6.5 6.5 0 0 1 31 32Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
      </g>
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M10 32 A6.5 6.5 0 0 1 9 19 A8.5 8.5 0 0 1 22 13.5 A7.5 7.5 0 0 1 32.5 19 A6.5 6.5 0 0 1 31 32Z" fill="#7CC4E8" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M12 18.5 Q13 15 17 14" fill="none" stroke="#FFF7E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ),
  umbrella: (
    <>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round" style={HALO}>
        <path d="M20 22 V32 Q20 36 16 36 Q12.5 36 12.5 32.5" fill="none" strokeWidth="4.6"/>
        <path d="M20 6 V3" fill="none" strokeWidth="4.4"/>
        <path d="M3.5 22 Q3.5 6.5 20 6.5 Q36.5 6.5 36.5 22 Q32.5 18.5 28.5 22 Q24.5 18.5 20 22 Q15.5 18.5 11.5 22 Q7.5 18.5 3.5 22Z" strokeWidth="4.4"/>
      </g>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round">
        <path d="M20 22 V32 Q20 36 16 36 Q12.5 36 12.5 32.5" fill="none" stroke="#3A2E3F" strokeWidth="2.6"/>
        <path d="M20 6 V3" fill="none" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M3.5 22 Q3.5 6.5 20 6.5 Q36.5 6.5 36.5 22 Q32.5 18.5 28.5 22 Q24.5 18.5 20 22 Q15.5 18.5 11.5 22 Q7.5 18.5 3.5 22Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
      </g>
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M20 22 V32 Q20 36 16 36 Q12.5 36 12.5 32.5" fill="none" stroke="#3A2E3F" strokeWidth="2.6"/>
        <path d="M20 6 V3" fill="none" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M3.5 22 Q3.5 6.5 20 6.5 Q36.5 6.5 36.5 22 Q32.5 18.5 28.5 22 Q24.5 18.5 20 22 Q15.5 18.5 11.5 22 Q7.5 18.5 3.5 22Z" fill="#5B8DEF" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M20 7 Q14 12 11.5 20.5 M20 7 Q26 12 28.5 20.5" fill="none" stroke="#3A2E3F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ),
  icecream: (
    <>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round" style={HALO}>
        <path d="M13.5 21.5 Q10.5 21.5 12.14 24.01 L17.26 31.82 Q20 36 22.74 31.82 L27.86 24.01 Q29.5 21.5 26.5 21.5 Z" strokeWidth="4.4"/>
        <path d="M8.5 22.5 A11.5 11.5 0 0 1 31.5 22.5 Q31.5 25.5 28.5 25 Q24.5 27 20 25 Q15.5 27 11.5 25 Q8.5 25.5 8.5 22.5Z" strokeWidth="4.4"/>
        <circle cx="21" cy="9.8" r="3.5" strokeWidth="4.4"/>
      </g>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round">
        <path d="M13.5 21.5 Q10.5 21.5 12.14 24.01 L17.26 31.82 Q20 36 22.74 31.82 L27.86 24.01 Q29.5 21.5 26.5 21.5 Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M8.5 22.5 A11.5 11.5 0 0 1 31.5 22.5 Q31.5 25.5 28.5 25 Q24.5 27 20 25 Q15.5 27 11.5 25 Q8.5 25.5 8.5 22.5Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
        <circle cx="21" cy="9.8" r="3.5" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
      </g>
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M13.5 21.5 Q10.5 21.5 12.14 24.01 L17.26 31.82 Q20 36 22.74 31.82 L27.86 24.01 Q29.5 21.5 26.5 21.5 Z" fill="#E8B77A" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M14 25 L22.5 31.5 M20 23.5 L26 29" fill="none" stroke="#3A2E3F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity=".55"/>
        <path d="M8.5 22.5 A11.5 11.5 0 0 1 31.5 22.5 Q31.5 25.5 28.5 25 Q24.5 27 20 25 Q15.5 27 11.5 25 Q8.5 25.5 8.5 22.5Z" fill="#FF9FA8" stroke="#3A2E3F" strokeWidth="2.4"/>
        <circle cx="21" cy="9.8" r="3.5" fill="#D9455F" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M21 6.5 Q21.5 3.8 24 2.8" fill="none" stroke="#3A2E3F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ),
  acorn: (
    <>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round" style={HALO}>
        <path d="M20 6 V3" fill="none" strokeWidth="4.4"/>
        <path d="M9.5 17 H30.5 Q30.5 30.5 23 35.5 Q20 37.5 17 35.5 Q9.5 30.5 9.5 17Z" strokeWidth="4.4"/>
        <path d="M5.5 18 Q5 6.5 20 6.5 Q35 6.5 34.5 18 Q34.5 21 31 21 H9 Q5.5 21 5.5 18Z" strokeWidth="4.4"/>
      </g>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round">
        <path d="M20 6 V3" fill="none" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M9.5 17 H30.5 Q30.5 30.5 23 35.5 Q20 37.5 17 35.5 Q9.5 30.5 9.5 17Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M5.5 18 Q5 6.5 20 6.5 Q35 6.5 34.5 18 Q34.5 21 31 21 H9 Q5.5 21 5.5 18Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
      </g>
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M20 6 V3" fill="none" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M9.5 17 H30.5 Q30.5 30.5 23 35.5 Q20 37.5 17 35.5 Q9.5 30.5 9.5 17Z" fill="#D9A066" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M5.5 18 Q5 6.5 20 6.5 Q35 6.5 34.5 18 Q34.5 21 31 21 H9 Q5.5 21 5.5 18Z" fill="#8B5E3C" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M12 12 L14 14 M20 11 L22 13 M27 12 L29 14" fill="none" stroke="#FFF7E8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity=".7"/>
      </g>
    </>
  ),
  sailboat: (
    <>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round" style={HALO}>
        <path d="M3.5 27 H36.5 Q33.5 35.5 27 35.5 H13 Q6.5 35.5 3.5 27Z" strokeWidth="4.4"/>
      </g>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round">
        <path d="M3.5 27 H36.5 Q33.5 35.5 27 35.5 H13 Q6.5 35.5 3.5 27Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
      </g>
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M20 4.5 Q31 12 33.8 24 Q34 25.5 32.5 25.5 H20Z" fill="#FFF7E8" stroke="#3A2E3F" strokeWidth="2"/>
        <path d="M20 10 Q11.5 15 7.2 24 Q6.7 25.5 8.5 25.5 H20Z" fill="#5B8DEF" stroke="#3A2E3F" strokeWidth="2"/>
        <path d="M3.5 27 H36.5 Q33.5 35.5 27 35.5 H13 Q6.5 35.5 3.5 27Z" fill="#E0603F" stroke="#3A2E3F" strokeWidth="2.4"/>
      </g>
    </>
  ),
  donut: (
    <>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round" style={HALO}>
        <path d="M5 20 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0Z M14.5 20 a5.5 5.5 0 1 0 11 0 a5.5 5.5 0 1 0 -11 0Z" strokeWidth="4.4" fillRule="evenodd"/>
      </g>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round">
        <path d="M5 20 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0Z M14.5 20 a5.5 5.5 0 1 0 11 0 a5.5 5.5 0 1 0 -11 0Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4" fillRule="evenodd"/>
      </g>
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M5 20 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0Z M14.5 20 a5.5 5.5 0 1 0 11 0 a5.5 5.5 0 1 0 -11 0Z" fill="#E8B77A" stroke="#3A2E3F" strokeWidth="2.4" fillRule="evenodd"/>
        <path d="M31.6 20 C31.6 20.72 31.12 21.48 30.79 22.15 C30.46 22.81 29.88 23.32 29.61 23.98 C29.33 24.64 29.38 25.41 29.15 26.11 C28.91 26.82 28.71 27.7 28.2 28.2 C27.7 28.71 26.82 28.91 26.11 29.15 C25.41 29.38 24.64 29.33 23.98 29.61 C23.32 29.88 22.81 30.46 22.15 30.79 C21.48 31.12 20.72 31.6 20 31.6 C19.28 31.6 18.52 31.12 17.85 30.79 C17.19 30.46 16.68 29.88 16.02 29.61 C15.36 29.33 14.59 29.38 13.89 29.15 C13.18 28.91 12.3 28.71 11.8 28.2 C11.29 27.7 11.09 26.82 10.85 26.11 C10.62 25.41 10.67 24.64 10.39 23.98 C10.12 23.32 9.54 22.81 9.21 22.15 C8.88 21.48 8.4 20.72 8.4 20 C8.4 19.28 8.88 18.52 9.21 17.85 C9.54 17.19 10.12 16.68 10.39 16.02 C10.67 15.36 10.62 14.59 10.85 13.89 C11.09 13.18 11.29 12.3 11.8 11.8 C12.3 11.29 13.18 11.09 13.89 10.85 C14.59 10.62 15.36 10.67 16.02 10.39 C16.68 10.12 17.19 9.54 17.85 9.21 C18.52 8.88 19.28 8.4 20 8.4 C20.72 8.4 21.48 8.88 22.15 9.21 C22.81 9.54 23.32 10.12 23.98 10.39 C24.64 10.67 25.41 10.62 26.11 10.85 C26.82 11.09 27.7 11.29 28.2 11.8 C28.71 12.3 28.91 13.18 29.15 13.89 C29.38 14.59 29.33 15.36 29.61 16.02 C29.88 16.68 30.46 17.19 30.79 17.85 C31.12 18.52 31.6 19.28 31.6 20Z M14.5 20 a5.5 5.5 0 1 0 11 0 a5.5 5.5 0 1 0 -11 0Z" fill="#A58BF0" fillRule="evenodd" stroke="#3A2E3F" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M28.3 21.4 L28.5 23.8 M22.9 27.7 L20.9 29.1 M14.5 26.5 L12.4 25.5 M11.9 18.1 L11.8 15.7 M17.1 12.1 L19.1 10.7 M25.0 13.4 L27.2 14.4" fill="none" stroke="#FFF7E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ),
  balloon: (
    <>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round" style={HALO}>
        <path d="M20 32 q-3.5 2 0 4 q3.5 1.8 0 3.5" fill="none" strokeWidth="3.8"/>
        <path d="M20 3.5 C30.5 3.5 33.5 12 31.5 19 C29.5 25.5 24.5 28.5 20 29.5 C15.5 28.5 10.5 25.5 8.5 19 C6.5 12 9.5 3.5 20 3.5Z" strokeWidth="4.4"/>
        <path d="M20 29.5 L17.2 33 H22.8Z" strokeWidth="4.2"/>
      </g>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round">
        <path d="M20 32 q-3.5 2 0 4 q3.5 1.8 0 3.5" fill="none" stroke="#3A2E3F" strokeWidth="1.8"/>
        <path d="M20 3.5 C30.5 3.5 33.5 12 31.5 19 C29.5 25.5 24.5 28.5 20 29.5 C15.5 28.5 10.5 25.5 8.5 19 C6.5 12 9.5 3.5 20 3.5Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M20 29.5 L17.2 33 H22.8Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.2"/>
      </g>
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M20 32 q-3.5 2 0 4 q3.5 1.8 0 3.5" fill="none" stroke="#3A2E3F" strokeWidth="1.8"/>
        <path d="M20 3.5 C30.5 3.5 33.5 12 31.5 19 C29.5 25.5 24.5 28.5 20 29.5 C15.5 28.5 10.5 25.5 8.5 19 C6.5 12 9.5 3.5 20 3.5Z" fill="#E0603F" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M20 29.5 L17.2 33 H22.8Z" fill="#E0603F" stroke="#3A2E3F" strokeWidth="2.2"/>
        <path d="M13 11 Q14 8 17 7" fill="none" stroke="#FFF7E8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ),
  gem: (
    <>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round" style={HALO}>
        <path d="M9.07 8.79 Q11 6.5 14 6.5 L26 6.5 Q29 6.5 30.93 8.79 L34.1 12.56 Q37 16 34.09 19.43 L23.24 32.19 Q20 36 16.76 32.19 L5.91 19.43 Q3 16 5.9 12.56 Z" strokeWidth="4.4"/>
      </g>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round">
        <path d="M9.07 8.79 Q11 6.5 14 6.5 L26 6.5 Q29 6.5 30.93 8.79 L34.1 12.56 Q37 16 34.09 19.43 L23.24 32.19 Q20 36 16.76 32.19 L5.91 19.43 Q3 16 5.9 12.56 Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
      </g>
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M9.07 8.79 Q11 6.5 14 6.5 L26 6.5 Q29 6.5 30.93 8.79 L34.1 12.56 Q37 16 34.09 19.43 L23.24 32.19 Q20 36 16.76 32.19 L5.91 19.43 Q3 16 5.9 12.56 Z" fill="#3F9E8F" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M10.72 9.41 Q11.5 8.5 12.04 9.57 L14.46 14.43 Q15 15.5 13.8 15.5 L6.7 15.5 Q5.5 15.5 6.28 14.59 Z" fill="#FFF7E8" fillOpacity=".45"/>
        <path d="M4.5 16 H35.5 M15.5 16 L20 33.5 M24.5 16 L20 33.5 M15.5 16 L11.5 8.5 M24.5 16 L28.5 8.5" fill="none" stroke="#3A2E3F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ),
};

/**
 * One of the little drawings that stand for a room in its code. It is decoration: the frontend gives the
 * group of five an accessible name, so the drawing itself is hidden from screen readers.
 */
export function RoomIconArt({ icon, className, style }: Readonly<RoomIconArtProps>) {
  return (
    <svg aria-hidden="true" data-room-icon={icon} viewBox="0 0 40 40" className={className} style={style}>
      {DRAWINGS[icon]}
    </svg>
  );
}
