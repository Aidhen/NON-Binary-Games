import type { GameId, LobbyState } from "@nbg/shared";
import type { RoomState } from "./roomStore";

/**
 * The game the room has chosen, if any: the one more than half of the players in the room voted for.
 * Alone it takes one vote, in two it takes both. With more than half there can only be one such game,
 * so there is no tie to break: a room split in two stays at the table until somebody changes their mind.
 */
export const chosenGame = (room: RoomState): GameId | null => {
  const counts = new Map<GameId, number>();
  for (const [playerId, game] of room.votes) {
    // A vote only counts while its player is in the room.
    if (!room.players.has(playerId)) continue;
    const count = (counts.get(game) ?? 0) + 1;
    if (count * 2 > room.players.size) return game;
    counts.set(game, count);
  }
  return null;
};

/** What everybody in the room is told about the choice of the game: votes go out by alias, never by player id. */
export const snapshotLobby = (room: RoomState): LobbyState => ({
  game: room.game?.id ?? null,
  votes: [...room.votes].flatMap(([playerId, game]) => {
    const alias = room.aliases.get(playerId);
    return alias && room.players.has(playerId) ? [{ alias, game }] : [];
  }),
});
