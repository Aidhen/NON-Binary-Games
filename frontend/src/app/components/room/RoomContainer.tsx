'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { ServerLoader } from '../loader/ServerLoader';
import { GAMES, findGame } from '../games/registry';
import type { GameEntry } from '../games/types';
import { Lobby } from './Lobby';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { joinErrorMessages } from '@/lib/joinErrors';
import { useConnectionStatus } from '@/lib/useConnectionStatus';
import { usePlayers } from '@/lib/usePlayers';
import { useRoom } from '@/lib/useRoom';

interface RoomContainerProps {
  roomId: string;
  games?: readonly GameEntry[];
}

/**
 * A room: first the table where the players choose a game, then the game the server opened. Whoever comes
 * after the choice is shown the game directly.
 */
export function RoomContainer({ roomId, games = GAMES }: Readonly<RoomContainerProps>) {
  const { t } = useTranslation();
  const { status, retry } = useConnectionStatus();
  // Before the hook that joins the room: the server answers the join with who is in it.
  const { self, players, setColor } = usePlayers(roomId);
  const { lobby, joinError, vote } = useRoom(roomId);

  if (joinError) {
    return (
      <div role="alert" className="flex flex-col items-center gap-4 text-center">
        <p className="text-lg font-bold text-[var(--title-text)]">
          {t(joinErrorMessages[joinError])}
        </p>
        <Link href="/" className="font-bold text-[var(--subtitle-text)] underline hover:text-[var(--title-text)]">
          {t('sudoku.backHome')}
        </Link>
      </div>
    );
  }

  if (!lobby) return <ServerLoader status={status} onRetry={retry} />;

  if (lobby.game === null) {
    return <Lobby games={games} players={players} self={self} votes={lobby.votes} onVote={vote} onPickColor={setColor} />;
  }

  const game = findGame(lobby.game, games);

  // A server that is newer than this page can open a game the page has never heard of.
  if (!game) {
    return <p role="alert" className="text-center text-lg font-bold text-[var(--title-text)]">{t('lobby.unknownGame')}</p>;
  }

  return (
    <Suspense fallback={<ServerLoader status={status} onRetry={retry} />}>
      <game.Game roomId={roomId} />
    </Suspense>
  );
}
