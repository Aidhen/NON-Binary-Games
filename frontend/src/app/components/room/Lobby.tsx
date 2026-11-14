'use client';
import type { GameId, LobbyVote, PlayerColor, PlayerProfile } from '@nbg/shared';
import { EmoteBar } from '../emotes/EmoteBar';
import { EmoteOverlay } from '../emotes/EmoteOverlay';
import { PlayerBar } from '../players/PlayerBar';
import type { GameEntry } from '../games/types';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { useEmotes } from '@/lib/useEmotes';
import { useHighlight } from '@/lib/useHighlight';

interface LobbyProps {
  games: readonly GameEntry[];
  /** The players in the room, in the order they came. */
  players: PlayerProfile[];
  /** Who the player is in that list (their alias), once the server has said so. */
  self: string | null;
  votes: LobbyVote[];
  /** The game the player wants, or `null` to take their vote back. */
  onVote: (game: GameId | null) => void;
  onPickColor: (color: PlayerColor) => void;
}

/**
 * The room before a game is open: who is here and the games to choose from. Every player votes for one,
 * and the server opens the game that more than half of the room wants.
 */
export function Lobby({ games, players, self, votes, onVote, onPickColor }: Readonly<LobbyProps>) {
  const { t } = useTranslation();
  const { emotes, sendEmote, isCoolingDown } = useEmotes();
  const { highlighted, highlight } = useHighlight();

  const ownVote = votes.find(({ alias }) => alias === self)?.game ?? null;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[500px] mx-auto relative">
      <PlayerBar players={players} self={self} highlightedAlias={highlighted} onPickColor={onPickColor} onHighlight={highlight} />

      <section aria-labelledby="lobby-title" className="flex w-full flex-col items-center gap-3">
        <h2 id="lobby-title" className="text-2xl font-black text-[var(--title-text)]">{t('lobby.title')}</h2>
        <p className="text-center text-sm font-medium text-[var(--subtitle-text)]">{t('lobby.hint')}</p>

        <ul className="flex w-full flex-col gap-2">
          {games.map((game) => {
            const count = votes.filter((vote) => vote.game === game.id).length;
            const voted = game.status === 'available' && ownVote === game.id;

            return (
              <li key={game.id}>
                <button
                  type="button"
                  disabled={game.status === 'soon'}
                  aria-pressed={game.status === 'available' ? voted : undefined}
                  onClick={game.status === 'available' ? () => onVote(voted ? null : game.id) : undefined}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg border-2 px-4 py-3 text-left font-bold transition-colors duration-200",
                    voted
                      ? "bg-[var(--cell-background-selected)] text-[var(--title-text)] border-[var(--grid-border-outer)]"
                      : "bg-[var(--numpad-background)] text-[var(--numpad-text)] border-transparent hover:bg-[var(--numpad-hover)]",
                    "disabled:cursor-not-allowed disabled:opacity-60"
                  )}
                >
                  <span>{t(game.titleKey)}</span>
                  <span className="text-sm text-[var(--subtitle-text)]">
                    {game.status === 'soon'
                      ? t('lobby.soon')
                      : t('lobby.votes').replace('{count}', String(count)).replace('{total}', String(players.length))}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <EmoteBar onSend={sendEmote} disabled={isCoolingDown} />
      <EmoteOverlay emotes={emotes} />
    </div>
  );
}
