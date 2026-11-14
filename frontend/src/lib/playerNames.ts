import { PLAYER_ANIMALS, PLAYER_COLORS } from '@nbg/shared';
import type { PlayerAnimal } from '@nbg/shared';

/**
 * One emoji for each animal: plain Unicode like the emotes, so there is nothing to load and screen readers
 * know them. They are also the way to tell players apart without looking at colors.
 */
export const PLAYER_ANIMAL_EMOJI: Record<PlayerAnimal, string> = {
  panda: '🐼',
  fox: '🦊',
  otter: '🦦',
  owl: '🦉',
  frog: '🐸',
  koala: '🐨',
  hedgehog: '🦔',
  penguin: '🐧',
  rabbit: '🐰',
  turtle: '🐢',
  octopus: '🐙',
  dolphin: '🐬',
};

/** The emoji of an animal, or a paw for one this page does not know (a newer server than the page). */
export const animalEmoji = (animal: string): string => (Object.hasOwn(PLAYER_ANIMAL_EMOJI, animal) ? PLAYER_ANIMAL_EMOJI[animal as PlayerAnimal] : '🐾');

const KNOWN_ANIMALS: readonly string[] = PLAYER_ANIMALS;
const KNOWN_COLORS: readonly string[] = PLAYER_COLORS;

/**
 * The name of a player in the language of the page, put together from the animal and the color they have
 * now (so it changes when they take another color). The word order and the form of the color, which in
 * Italian agrees with the animal, are in the dictionary.
 */
export const playerName = (t: (path: string) => string, { animal, color }: { animal: string; color: string }): string => {
  // A page older than the server can get an animal or a color it has no word for: the name gets shorter, it never fails.
  if (!KNOWN_ANIMALS.includes(animal)) return t('players.someone');

  const gender = t(`players.animals.${animal}.gender`) === 'f' ? 'f' : 'm';
  return t('players.nameFormat')
    .replace('{color}', KNOWN_COLORS.includes(color) ? t(`players.colors.${color}.${gender}`) : '')
    .replace('{animal}', t(`players.animals.${animal}.name`))
    .replace(/\s+/g, ' ')
    .trim();
};
