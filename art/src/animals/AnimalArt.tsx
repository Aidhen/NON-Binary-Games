import type { CSSProperties, ReactNode } from 'react';
import { HALO } from '../halo';

/** The animals that can be drawn. The same list as PLAYER_ANIMALS in @nbg/shared (art does not depend on shared; a test in the frontend keeps the two equal). */
export const ANIMAL_ART_IDS = ['octopus', 'penguin', 'owl', 'fox', 'hedgehog', 'koala'] as const;

export type AnimalArtId = (typeof ANIMAL_ART_IDS)[number];

interface AnimalArtProps {
  animal: AnimalArtId;
  className?: string;
  style?: CSSProperties;
}

/*
 * The head is filled with `currentColor`: whoever draws it sets the player color with CSS `color`. The darker
 * shade of the details is the plum overlay of the drawing. Like the room icons it has a halo for the dark themes.
 */
const DRAWINGS: Record<AnimalArtId, ReactNode> = {
  fox: (
    <>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round" style={HALO}>
        <path d="M4.5 19 L6 3.5 L15.5 10.5 Q20 9.3 24.5 10.5 L34 3.5 L35.5 19 Q36 29 28 33.5 Q24 36.5 20 36.5 Q16 36.5 12 33.5 Q4 29 4.5 19Z" strokeWidth="4.4"/>
      </g>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round">
        <path d="M4.5 19 L6 3.5 L15.5 10.5 Q20 9.3 24.5 10.5 L34 3.5 L35.5 19 Q36 29 28 33.5 Q24 36.5 20 36.5 Q16 36.5 12 33.5 Q4 29 4.5 19Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
      </g>
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M4.5 19 L6 3.5 L15.5 10.5 Q20 9.3 24.5 10.5 L34 3.5 L35.5 19 Q36 29 28 33.5 Q24 36.5 20 36.5 Q16 36.5 12 33.5 Q4 29 4.5 19Z" fill="currentColor" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M8 8.5 L13.5 12.5 L9 16Z" fill="#3A2E3F" fillOpacity="0.3"/>
        <path d="M32 8.5 L26.5 12.5 L31 16Z" fill="#3A2E3F" fillOpacity="0.3"/>
        <path d="M5 22 Q12 23.5 20 21 Q28 23.5 35 22 Q34 29.5 28 33 Q24 36 20 36 Q16 36 12 33 Q6 29.5 5 22Z" fill="#FFF7E8"/>
        <path d="M4.5 19 Q5 29 12 33.5 Q16 36.5 20 36.5 Q24 36.5 28 33.5 Q35 29 35.5 19" fill="none" stroke="#3A2E3F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="21.5" r="2.3" fill="#3A2E3F"/>
        <circle cx="28" cy="21.5" r="2.3" fill="#3A2E3F"/>
        <path d="M17 28.5 h6 q0 3 -3 3.4 q-3 -.4 -3 -3.4Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M20 31.5 V33 M17.5 33.5 q2.5 2 5 0" fill="none" stroke="#3A2E3F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ),
  owl: (
    <>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round" style={HALO}>
        <path d="M4.5 21 L4.5 5 L12.5 9.5 Q20 7.5 27.5 9.5 L35.5 5 L35.5 21 Q35.5 36.5 20 36.5 Q4.5 36.5 4.5 21Z" strokeWidth="4.4"/>
      </g>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round">
        <path d="M4.5 21 L4.5 5 L12.5 9.5 Q20 7.5 27.5 9.5 L35.5 5 L35.5 21 Q35.5 36.5 20 36.5 Q4.5 36.5 4.5 21Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
      </g>
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M4.5 21 L4.5 5 L12.5 9.5 Q20 7.5 27.5 9.5 L35.5 5 L35.5 21 Q35.5 36.5 20 36.5 Q4.5 36.5 4.5 21Z" fill="currentColor" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M7 31 Q20 38 33 31 Q33 36.5 20 36.5 Q7 36.5 7 31Z" fill="#3A2E3F" fillOpacity="0.22"/>
        <path d="M16 33.5 l1.8 1.6 M24 33.5 l-1.8 1.6 M20 32 v2" fill="none" stroke="#3A2E3F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity=".5"/>
        <circle cx="13" cy="19" r="7" fill="#FFF7E8" stroke="#3A2E3F" strokeWidth="2.2"/>
        <circle cx="27" cy="19" r="7" fill="#FFF7E8" stroke="#3A2E3F" strokeWidth="2.2"/>
        <circle cx="13.5" cy="19.5" r="3.2" fill="#3A2E3F"/>
        <circle cx="26.5" cy="19.5" r="3.2" fill="#3A2E3F"/>
        <circle cx="14.7" cy="18.4" r="1" fill="#FFF7E8"/>
        <circle cx="27.7" cy="18.4" r="1" fill="#FFF7E8"/>
        <path d="M17.3 25 H22.7 L20 30.5Z" fill="#F2B544" stroke="#3A2E3F" strokeWidth="2" strokeLinejoin="round"/>
      </g>
    </>
  ),
  koala: (
    <>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round" style={HALO}>
        <circle cx="7.5" cy="13" r="8" strokeWidth="4.4"/>
        <circle cx="32.5" cy="13" r="8" strokeWidth="4.4"/>
        <ellipse cx="20" cy="23" rx="15" ry="14" strokeWidth="4.4"/>
      </g>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round">
        <circle cx="7.5" cy="13" r="8" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
        <circle cx="32.5" cy="13" r="8" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
        <ellipse cx="20" cy="23" rx="15" ry="14" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
      </g>
      <g strokeLinejoin="round" strokeLinecap="round">
        <circle cx="7.5" cy="13" r="8" fill="currentColor" stroke="#3A2E3F" strokeWidth="2.4"/>
        <circle cx="32.5" cy="13" r="8" fill="currentColor" stroke="#3A2E3F" strokeWidth="2.4"/>
        <circle cx="7.5" cy="13" r="4.3" fill="#FFF7E8"/>
        <circle cx="32.5" cy="13" r="4.3" fill="#FFF7E8"/>
        <ellipse cx="20" cy="23" rx="15" ry="14" fill="currentColor" stroke="#3A2E3F" strokeWidth="2.4"/>
        <circle cx="11.5" cy="20" r="2.2" fill="#3A2E3F"/>
        <circle cx="28.5" cy="20" r="2.2" fill="#3A2E3F"/>
        <ellipse cx="20" cy="24.5" rx="4.6" ry="6.4" fill="#3A2E3F"/>
        <ellipse cx="18.4" cy="22" rx="1.3" ry="1.8" fill="#FFF7E8" fillOpacity=".55"/>
        <path d="M16.5 33 q3.5 2.6 7 0" fill="none" stroke="#3A2E3F" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/>
        <ellipse cx="9" cy="28" rx="2.5" ry="1.7" fill="#FF9FA8"/>
        <ellipse cx="31" cy="28" rx="2.5" ry="1.7" fill="#FF9FA8"/>
      </g>
    </>
  ),
  hedgehog: (
    <>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round" style={HALO}>
        <path d="M3 28 L2.5 19.5 L7 20 L4.5 12 L10.5 14 L10.5 6 L16.5 10.5 L20 3.5 L23.5 10.5 L29.5 6 L29.5 14 L35.5 12 L33 20 L37.5 19.5 L37 28 Q37 36.5 20 36.5 Q3 36.5 3 28Z" strokeWidth="4.4"/>
      </g>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round">
        <path d="M3 28 L2.5 19.5 L7 20 L4.5 12 L10.5 14 L10.5 6 L16.5 10.5 L20 3.5 L23.5 10.5 L29.5 6 L29.5 14 L35.5 12 L33 20 L37.5 19.5 L37 28 Q37 36.5 20 36.5 Q3 36.5 3 28Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
      </g>
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M3 28 L2.5 19.5 L7 20 L4.5 12 L10.5 14 L10.5 6 L16.5 10.5 L20 3.5 L23.5 10.5 L29.5 6 L29.5 14 L35.5 12 L33 20 L37.5 19.5 L37 28 Q37 36.5 20 36.5 Q3 36.5 3 28Z" fill="currentColor" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M3 28 L2.5 19.5 L7 20 L4.5 12 L10.5 14 L10.5 6 L16.5 10.5 L20 3.5 L23.5 10.5 L29.5 6 L29.5 14 L35.5 12 L33 20 L37.5 19.5 L37 28 Q30 17 20 17 Q10 17 3 28Z" fill="#3A2E3F" fillOpacity="0.22"/>
        <path d="M7 28.5 Q7.5 18.5 20 18.5 Q32.5 18.5 33 28.5 Q32 36 20 36 Q8 36 7 28.5Z" fill="#FFF7E8" stroke="#3A2E3F" strokeWidth="2.2" strokeLinejoin="round"/>
        <circle cx="13" cy="25" r="2.2" fill="#3A2E3F"/>
        <circle cx="27" cy="25" r="2.2" fill="#3A2E3F"/>
        <ellipse cx="20" cy="29.5" rx="2.8" ry="2.2" fill="#3A2E3F"/>
        <path d="M17.5 32.5 q2.5 2 5 0" fill="none" stroke="#3A2E3F" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
        <ellipse cx="9.5" cy="30" rx="2.5" ry="1.7" fill="#FF9FA8"/>
        <ellipse cx="30.5" cy="30" rx="2.5" ry="1.7" fill="#FF9FA8"/>
      </g>
    </>
  ),
  penguin: (
    <>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round" style={HALO}>
        <path d="M20 3.5 C29.5 3.5 36 9.5 36 20 C36 30.5 29 36.5 20 36.5 C11 36.5 4 30.5 4 20 C4 9.5 10.5 3.5 20 3.5Z" strokeWidth="4.4"/>
      </g>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round">
        <path d="M20 3.5 C29.5 3.5 36 9.5 36 20 C36 30.5 29 36.5 20 36.5 C11 36.5 4 30.5 4 20 C4 9.5 10.5 3.5 20 3.5Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
      </g>
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M20 3.5 C29.5 3.5 36 9.5 36 20 C36 30.5 29 36.5 20 36.5 C11 36.5 4 30.5 4 20 C4 9.5 10.5 3.5 20 3.5Z" fill="currentColor" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M20 3.5 C29.5 3.5 36 9.5 36 20 C33 15 27 13 20 13 C13 13 7 15 4 20 C4 9.5 10.5 3.5 20 3.5Z" fill="#3A2E3F" fillOpacity="0.3"/>
        <path d="M7.5 22 Q6.5 14.5 12.5 14.5 Q17.5 14.5 20 19 Q22.5 14.5 27.5 14.5 Q33.5 14.5 32.5 22 Q31.5 33 20 34 Q8.5 33 7.5 22Z" fill="#FFF7E8" stroke="#3A2E3F" strokeWidth="2" strokeLinejoin="round"/>
        <circle cx="12.5" cy="21" r="2.3" fill="#3A2E3F"/>
        <circle cx="27.5" cy="21" r="2.3" fill="#3A2E3F"/>
        <path d="M16.2 25.5 Q20 23 23.8 25.5 Q23.5 29.5 20 30.2 Q16.5 29.5 16.2 25.5Z" fill="#F2B544" stroke="#3A2E3F" strokeWidth="2" strokeLinejoin="round"/>
        <ellipse cx="9" cy="26" rx="2.5" ry="1.7" fill="#FF9FA8"/>
        <ellipse cx="31" cy="26" rx="2.5" ry="1.7" fill="#FF9FA8"/>
      </g>
    </>
  ),
  octopus: (
    <>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round" style={HALO}>
        <path d="M4.5 18 Q4.5 3.5 20 3.5 Q35.5 3.5 35.5 18 Q35.5 25 33 29.5 Q37 34 33 36.5 Q29.5 38 28 34 Q27.5 38 23.5 38 Q20.5 38 20 34.5 Q19.5 38 16.5 38 Q12.5 38 12 34 Q10.5 38 7 36.5 Q3 34 7 29.5 Q4.5 25 4.5 18Z" strokeWidth="4.4"/>
      </g>
      <g transform="translate(1.5 1.8)" strokeLinejoin="round" strokeLinecap="round">
        <path d="M4.5 18 Q4.5 3.5 20 3.5 Q35.5 3.5 35.5 18 Q35.5 25 33 29.5 Q37 34 33 36.5 Q29.5 38 28 34 Q27.5 38 23.5 38 Q20.5 38 20 34.5 Q19.5 38 16.5 38 Q12.5 38 12 34 Q10.5 38 7 36.5 Q3 34 7 29.5 Q4.5 25 4.5 18Z" fill="#3A2E3F" stroke="#3A2E3F" strokeWidth="2.4"/>
      </g>
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M4.5 18 Q4.5 3.5 20 3.5 Q35.5 3.5 35.5 18 Q35.5 25 33 29.5 Q37 34 33 36.5 Q29.5 38 28 34 Q27.5 38 23.5 38 Q20.5 38 20 34.5 Q19.5 38 16.5 38 Q12.5 38 12 34 Q10.5 38 7 36.5 Q3 34 7 29.5 Q4.5 25 4.5 18Z" fill="currentColor" stroke="#3A2E3F" strokeWidth="2.4"/>
        <path d="M4.5 18 Q4.5 3.5 20 3.5 Q35.5 3.5 35.5 18 Q35.5 25 33 29.5 Q30 26 20 26 Q10 26 7 29.5 Q4.5 25 4.5 18Z" fill="#3A2E3F" fillOpacity="0"/>
        <circle cx="12.5" cy="17.5" r="2.5" fill="#3A2E3F"/>
        <circle cx="27.5" cy="17.5" r="2.5" fill="#3A2E3F"/>
        <ellipse cx="8" cy="23" rx="2.5" ry="1.7" fill="#FF9FA8"/>
        <ellipse cx="32" cy="23" rx="2.5" ry="1.7" fill="#FF9FA8"/>
        <path d="M16.5 23.5 q3.5 3 7 0" fill="none" stroke="#3A2E3F" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="10" cy="33" r="1.1" fill="#FFF7E8"/>
        <circle cx="16.5" cy="34.3" r="1.1" fill="#FFF7E8"/>
        <circle cx="23.5" cy="34.3" r="1.1" fill="#FFF7E8"/>
        <circle cx="30" cy="33" r="1.1" fill="#FFF7E8"/>
        <path d="M10 9 Q13 5.5 17 5.2" fill="none" stroke="#FFF7E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".7"/>
      </g>
    </>
  ),
};

/** The head of a player. Decoration: the name of the player is always written next to it. */
export function AnimalArt({ animal, className, style }: Readonly<AnimalArtProps>) {
  return (
    <svg aria-hidden="true" data-animal={animal} viewBox="0 0 40 40" className={className} style={style}>
      {DRAWINGS[animal]}
    </svg>
  );
}
