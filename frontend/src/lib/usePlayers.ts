'use client';
import { useCallback, useEffect, useState } from 'react';
import type { PlayerColor, PlayerProfile } from '@nbg/shared';
import { getSocket } from '@/lib/socket';

/** Most players the page remembers: those who are here, and the last ones who left (their notes keep their color). */
export const MAX_KNOWN_PLAYERS = 40;

interface PlayersState {
  /** Who the player is in the list of this room, as soon as the server has said so. */
  self: string | null;
  /** The players in the room now, in the order they came. */
  players: PlayerProfile[];
  /** Everybody the page has seen in this room, by alias, those who left included. */
  profiles: Record<string, PlayerProfile>;
}

const NOBODY: PlayersState = { self: null, players: [], profiles: {} };

const remember = (known: Record<string, PlayerProfile>, players: PlayerProfile[]): Record<string, PlayerProfile> => {
  const next = { ...known };
  for (const player of players) next[player.alias] = player;

  // Whoever is there stays; the ones who left go oldest first, so that a long evening cannot grow this without end.
  const here = new Set(players.map(({ alias }) => alias));
  let size = Object.keys(next).length;
  for (const alias of Object.keys(next)) {
    if (size <= MAX_KNOWN_PLAYERS) break;
    if (here.has(alias)) continue;
    delete next[alias];
    size--;
  }
  return next;
};

/** The players of the room as the server tells them: who is here, who the player is, and the color they ask for. */
export function usePlayers(roomId: string) {
  const [state, setState] = useState<PlayersState>(NOBODY);

  useEffect(() => {
    const socket = getSocket();
    // Another room has other players, and other aliases for the same people.
    setState(NOBODY);

    const onJoinedAs = (alias: string) => setState((current) => ({ ...current, self: alias }));
    const onPlayersUpdated = ({ players }: { players: PlayerProfile[] }) =>
      setState((current) => ({ ...current, players, profiles: remember(current.profiles, players) }));

    socket.on('joined-as', onJoinedAs);
    socket.on('players-updated', onPlayersUpdated);
    return () => {
      socket.off('joined-as', onJoinedAs);
      socket.off('players-updated', onPlayersUpdated);
    };
  }, [roomId]);

  const setColor = useCallback((color: PlayerColor) => {
    const socket = getSocket();
    // A disconnected socket would keep the request and send it long after the moment has passed.
    if (!socket.connected) return;
    socket.emit('set-color', color);
  }, []);

  return { ...state, setColor };
}
