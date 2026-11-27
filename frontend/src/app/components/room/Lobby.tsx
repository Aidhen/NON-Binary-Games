'use client';
import { useState } from 'react';
import type { GameId, LobbyVote, PlayerColor, PlayerProfile } from '@nbg/shared';
import { GameCarousel } from '../games/GameCarousel';
import type { AvailableGame, GameEntry } from '../games/types';
import { RoomCard } from './RoomCard';
import { WakeStatus } from './WakeStatus';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { playerName } from '@/lib/playerNames';
import type { ConnectionStatus } from '@/lib/useConnectionStatus';

interface LobbyProps {
  roomId: string;
  games: readonly GameEntry[];
  /** The players in the room, in the order they came. */
  players: PlayerProfile[];
  /** Who the player is in that list (their alias), once the server has said so. */
  self: string | null;
  /** Null until the room has answered: the table is shown, but nothing can be voted yet. */
  votes: LobbyVote[] | null;
  status: ConnectionStatus;
  onRetry: () => void;
  /** The game the player wants, or `null` to take their vote back. */
  onVote: (game: GameId | null) => void;
  onPickColor: (color: PlayerColor) => void;
}

/**
 * The room before a game is open, as a table seen from above: the room in the middle, and one box per game.
 * The player lifts the lid of a box and asks to open it: that is their vote, and the server opens the game
 * that more than half of the room wants.
 */
export function Lobby({ roomId, games, players, self, votes, status, onRetry, onVote, onPickColor }: Readonly<LobbyProps>) {
  const { t } = useTranslation();
  const playable = games.filter((game): game is AvailableGame => game.status === 'available');
  const [lookedAt, setLookedAt] = useState<GameId | null>(null);

  const ready = votes !== null;
  const ownVote = votes?.find(({ alias }) => alias === self)?.game ?? null;
  const votesFor = (id: string) => (votes ?? []).filter((vote) => vote.game === id);
  // The box with the most votes, the first of them when they are tied: the table opens on what the room leans to.
  const leading = playable.reduce<AvailableGame | undefined>((best, game) => {
    const bestCount = best ? votesFor(best.id).length : 0;
    return votesFor(game.id).length > bestCount ? game : best;
  }, undefined);
  // The box the player touched last, else the one they voted for, else the one most of the room wants, else the first that can be played.
  const selected = playable.find(({ id }) => id === (lookedAt ?? ownVote ?? leading?.id)) ?? playable[0];
  const voted = ownVote === selected?.id;
  const openLabel = t('lobby.open').replace('{game}', selected ? t(selected.titleKey) : '').trim();

  // Who wants what, by the names the chips show. A game nobody wants is not mentioned.
  const nameList = (names: string[]) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} ${t('lobby.and')} ${names.at(-1)}`);
  const wishes = playable.flatMap((game) => {
    const names = players.filter(({ alias }) => votesFor(game.id).some((vote) => vote.alias === alias)).map((player) => playerName(t, player));
    if (names.length === 0) return [];
    return [t(names.length > 1 ? 'lobby.wantsPlural' : 'lobby.wants').replace('{names}', nameList(names)).replace('{game}', t(game.titleKey))];
  });
  // Votes on two games or more: no box has the room yet, and it is worth saying how one gets it.
  const isSplit = wishes.length > 1;

  return (
    <div className="mx-auto grid w-full max-w-md grid-cols-1 gap-6 lg:max-w-6xl lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-10 lg:items-start">
      {/* The table comes first, so that on a phone the boxes and the button are there without scrolling; the room card goes under it, and back to the left on a wide screen. */}
      <section aria-labelledby="lobby-title" className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="lobby-title" className="font-display text-3xl font-extrabold leading-tight text-[var(--title-text)]">{t('lobby.title')}</h2>
          <p className="text-sm font-medium text-[var(--subtitle-text)]">{t('lobby.hint')}</p>
        </div>

        <GameCarousel
          games={games}
          selectedId={selected?.id ?? null}
          onSelect={(id) => setLookedAt(playable.find((game) => game.id === id)?.id ?? null)}
          votes={votes ?? []}
          players={players}
          enabled={ready}
        />

        <button
          type="button"
          aria-pressed={voted}
          disabled={!ready || !selected}
          onClick={() => selected && onVote(voted ? null : selected.id)}
          className={cn(
            "w-full cursor-pointer rounded-[var(--radius-paper)] px-6 py-4 font-display text-xl font-extrabold",
            "shadow-[var(--shadow-paper)] transition-transform duration-150 motion-reduce:transition-none",
            "active:translate-x-0.5 active:translate-y-1 active:shadow-none",
            "disabled:cursor-not-allowed disabled:opacity-60",
            voted
              ? "bg-[var(--paper)] text-[var(--title-text)]"
              : "bg-[var(--accent)] text-[var(--accent-ink)]"
          )}
        >
          {voted ? t('lobby.takeBack') : openLabel}
        </button>

        {!ready && <WakeStatus status={status} onRetry={onRetry} />}

        {ready && (
          // An <output> holds phrasing content only: the lines are spans shown as blocks.
          <output className="block min-h-5 text-center text-sm font-bold text-[var(--subtitle-text)]">
            {wishes.map((wish) => <span key={wish} className="block">{wish}</span>)}
            {isSplit && <span className="mt-1 block font-medium">{t('lobby.split')}</span>}
          </output>
        )}
      </section>

      <div className="lg:order-first">
        <RoomCard roomId={roomId} players={players} self={self} onPickColor={onPickColor} />
      </div>
    </div>
  );
}
