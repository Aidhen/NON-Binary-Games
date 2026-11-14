import { randomInt } from "node:crypto";
import { PLAYER_ANIMALS, PLAYER_COLORS } from "@nbg/shared";
import type { PlayerColor, PlayerProfile } from "@nbg/shared";
import type { RoomProfile, RoomState } from "./roomStore";

const pickOne = <T>(options: readonly T[]): T => options[randomInt(options.length)];

/** The animals and colors that players other than `playerId` have right now (players who left do not hold theirs). */
const inUse = (room: RoomState, playerId: string) => {
  const colors = new Set<PlayerColor>();
  const animals = new Set<string>();

  for (const otherId of room.players.keys()) {
    const profile = room.profiles.get(otherId);
    if (otherId === playerId || !profile) continue;
    colors.add(profile.color);
    animals.add(profile.animal);
  }

  return { colors, animals };
};

/**
 * Gives a player who comes into a room an animal and a color that no player in the room has, at random.
 * Someone who was here before and comes back keeps theirs when they are still free: the others have
 * already got to know them by it. There are more colors and animals than players in a room, and the
 * fallback only exists so that a mistake elsewhere cannot make a join fail.
 */
export const assignProfile = (room: RoomState, playerId: string): RoomProfile => {
  const kept = room.profiles.get(playerId);
  const { colors, animals } = inUse(room, playerId);
  const freeColors = PLAYER_COLORS.filter((color) => !colors.has(color));
  const freeAnimals = PLAYER_ANIMALS.filter((animal) => !animals.has(animal));

  const profile: RoomProfile = {
    color: kept && !colors.has(kept.color) ? kept.color : pickOne(freeColors.length ? freeColors : PLAYER_COLORS),
    animal: kept && !animals.has(kept.animal) ? kept.animal : pickOne(freeAnimals.length ? freeAnimals : PLAYER_ANIMALS),
  };
  room.profiles.set(playerId, profile);
  return profile;
};

/** A color is free for a player when nobody else in the room has it. */
export const colorIsFree = (room: RoomState, playerId: string, color: PlayerColor): boolean => !inUse(room, playerId).colors.has(color);

/** The players in the room, in the order they came: what everybody is told. */
export const snapshotPlayers = (room: RoomState): PlayerProfile[] =>
  [...room.players.keys()].flatMap((playerId) => {
    const alias = room.aliases.get(playerId);
    const profile = room.profiles.get(playerId);
    return alias && profile ? [{ alias, animal: profile.animal, color: profile.color }] : [];
  });
