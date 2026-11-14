import type { PlayerAnimal, PlayerProfile } from '@nbg/shared';

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

/**
 * The name of a player in the language of the page, put together from the animal and the color they have
 * now (so it changes when they take another color). The word order and the form of the color, which in
 * Italian agrees with the animal, are in the dictionary.
 */
export const playerName = (t: (path: string) => string, { animal, color }: Pick<PlayerProfile, 'animal' | 'color'>): string => {
  const gender = t(`players.animals.${animal}.gender`) === 'f' ? 'f' : 'm';
  return t('players.nameFormat')
    .replace('{color}', t(`players.colors.${color}.${gender}`))
    .replace('{animal}', t(`players.animals.${animal}.name`));
};
