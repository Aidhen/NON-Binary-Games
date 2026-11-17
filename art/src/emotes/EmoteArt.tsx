import { EMOTE_DRAWINGS } from './drawings';

interface EmoteArtProps {
  /** The Unicode emoji of the emote, as the game sends it. */
  emote: string;
  /** Side of the drawing, in pixels. */
  size?: number;
  /** Says what the drawing is to assistive technology. Without it the drawing is decoration, to use where the emote is already named. */
  label?: string;
  className?: string;
}

export const hasEmoteArt = (emote: string): boolean => Object.hasOwn(EMOTE_DRAWINGS, emote);

/**
 * One emote, drawn. An emoji that has no drawing yet is shown as the emoji itself, at about the same size:
 * a new emote can be added to the game before its drawing is ready.
 */
export function EmoteArt({ emote, size = 32, label, className }: Readonly<EmoteArtProps>) {
  const naming = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };

  if (!hasEmoteArt(emote)) {
    return <span {...naming} className={className} style={{ fontSize: size * 0.8, lineHeight: 1 }}>{emote}</span>;
  }

  const { id, viewBox, art } = EMOTE_DRAWINGS[emote];
  return (
    <svg {...naming} data-emote-art={id} viewBox={viewBox} width={size} height={size} className={className}>
      {art}
    </svg>
  );
}
