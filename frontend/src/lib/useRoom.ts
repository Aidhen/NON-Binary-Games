'use client';
import { useCallback, useEffect, useState } from 'react';
import type { GameId, JoinError, LobbyState } from '@nbg/shared';
import { getSocket } from '@/lib/socket';

/**
 * Joins the room and follows what it is doing: still choosing a game (and who voted for what), or playing one.
 * `lobby` stays null until the server has answered. The server decides when a game opens, the page only shows it.
 */
export function useRoom(roomId: string) {
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [joinError, setJoinError] = useState<JoinError | null>(null);

  useEffect(() => {
    const socket = getSocket();
    // Another room has its own game and its own votes.
    setLobby(null);
    setJoinError(null);

    // Also after every reconnection: the server forgets a socket that dropped.
    const join = () => { socket.emit('join-room', roomId); };
    const onLobbyUpdated = (state: LobbyState) => {
      // A refusal can be temporary (too-fast): once the room answers, the error must not stay on screen.
      setJoinError(null);
      setLobby(state);
    };
    const onJoinError = (reason: JoinError) => setJoinError(reason);

    socket.on('connect', join);
    socket.on('lobby-updated', onLobbyUpdated);
    socket.on('join-error', onJoinError);

    if (socket.connected) join();
    else socket.connect();

    return () => {
      socket.off('connect', join);
      socket.off('lobby-updated', onLobbyUpdated);
      socket.off('join-error', onJoinError);
    };
  }, [roomId]);

  const vote = useCallback((game: GameId | null) => {
    const socket = getSocket();
    // A disconnected socket would keep the vote and send it long after the moment has passed.
    if (!socket.connected) return;
    socket.emit('vote-game', game);
  }, []);

  return { lobby, joinError, vote };
}
