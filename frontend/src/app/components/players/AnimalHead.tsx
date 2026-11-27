import { AnimalArt } from '@nbg/art';
import { animalArtId } from '@/lib/playerNames';
import { styleOfColor } from '@/lib/playerPalette';
import { cn } from '@/lib/utils';

interface AnimalHeadProps {
  animal: string;
  color: string;
  className?: string;
}

/**
 * The head of a player's animal, filled with their color. Decoration: the name of the player is always
 * written next to it (or in the label of the button around it), so it is hidden from screen readers.
 */
export function AnimalHead({ animal, color, className }: Readonly<AnimalHeadProps>) {
  return <AnimalArt animal={animalArtId(animal)} className={cn('shrink-0', styleOfColor(color).head, className)} />;
}
