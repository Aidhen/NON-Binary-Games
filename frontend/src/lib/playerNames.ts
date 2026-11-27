import { PLAYER_ANIMALS, PLAYER_COLORS } from '@nbg/shared';
import { ANIMAL_ART_IDS } from '@nbg/art';
import type { AnimalArtId } from '@nbg/art';

/**
 * The drawing for an animal. A page older or newer than the server can get an animal it has no drawing for
 * (the server used to have panda, otter and more): it gets one of the drawings we have, always the same for the
 * same word, so that a player does not change face between renders. The name written next to it stays the truth.
 */
export const animalArtId = (animal: string): AnimalArtId => {
  const known = ANIMAL_ART_IDS.find((id) => id === animal);
  if (known) return known;
  let sum = 0;
  for (const char of animal) sum += char.codePointAt(0) ?? 0;
  return ANIMAL_ART_IDS[sum % ANIMAL_ART_IDS.length];
};

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
