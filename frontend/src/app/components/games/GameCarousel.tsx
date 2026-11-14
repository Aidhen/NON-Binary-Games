'use client';
import type { LobbyVote, PlayerProfile } from '@nbg/shared';
import { GameBox } from './GameBox';
import type { GameEntry } from './types';
import { useTranslation } from '@/lib/i18n/TranslationContext';

interface GameCarouselProps {
  games: readonly GameEntry[];
  /** The id of the box the player is looking at. */
  selectedId: string | null;
  onSelect: (id: string) => void;
  votes: LobbyVote[];
  players: PlayerProfile[];
  enabled: boolean;
}

/**
 * The boxes on the table, side by side. They scroll sideways when they do not fit and are centered when
 * they do, so the row looks right with one game as with eight. The layout knows nothing about a single
 * game: a box is its registry entry and its cover.
 */
export function GameCarousel({ games, selectedId, onSelect, votes, players, enabled }: Readonly<GameCarouselProps>) {
  const { t } = useTranslation();

  return (
    <ul
      aria-label={t('lobby.games')}
      className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-5 [justify-content:safe_center]"
    >
      {games.map((game, index) => (
        <li key={game.id} className="shrink-0 snap-center">
          <GameBox
            game={game}
            index={index}
            selected={game.id === selectedId}
            voters={players.filter(({ alias }) => votes.some((vote) => vote.alias === alias && vote.game === game.id))}
            playerCount={players.length}
            enabled={enabled}
            onSelect={() => onSelect(game.id)}
          />
        </li>
      ))}
    </ul>
  );
}
