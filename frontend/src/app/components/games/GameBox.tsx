'use client';
import type { PlayerProfile } from '@nbg/shared';
import type { GameEntry } from './types';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { animalEmoji } from '@/lib/playerNames';
import { styleOfColor } from '@/lib/playerPalette';

interface GameBoxProps {
  game: GameEntry;
  /** Where the box is on the table (see GameCoverProps). */
  index: number;
  /** The box the player is looking at: its lid is lifted. */
  selected: boolean;
  /** The players who voted for this game. */
  voters: PlayerProfile[];
  /** How many players are in the room, to say the votes out of how many. */
  playerCount: number;
  /** False until the room has answered: nothing can be picked yet. */
  enabled: boolean;
  onSelect: () => void;
}

const BOX = "relative block size-32";
const LID = "absolute inset-0 overflow-hidden rounded-[var(--radius-paper)] shadow-[var(--shadow-paper)]";

/**
 * One game on the table, seen from above: a box with the cover of the game on its lid. A game that can be
 * played is a button that lifts the lid; one that is only announced is a closed box with a ribbon, and
 * cannot be focused or pressed.
 */
export function GameBox({ game, index, selected, voters, playerCount, enabled, onSelect }: Readonly<GameBoxProps>) {
  const { t } = useTranslation();
  const title = t(game.titleKey);
  const players = game.minPlayers === game.maxPlayers
    ? t('lobby.playersExact').replace('{count}', String(game.minPlayers))
    : t('lobby.players').replace('{min}', String(game.minPlayers)).replace('{max}', String(game.maxPlayers));

  if (game.status === 'soon') {
    return (
      <div className="flex w-36 flex-col items-center gap-3 pt-4 text-center">
        <span className={BOX}>
          <span aria-hidden="true" className={LID}>
            <game.Cover index={index} />
            {/* The ribbon that keeps the box closed. */}
            <span className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 bg-[var(--paper)]/45" />
            <span className="absolute inset-y-0 left-1/2 w-3 -translate-x-1/2 bg-[var(--paper)]/45" />
          </span>
          <span className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-6 rounded-full px-3 py-1",
            "bg-[var(--paper)] text-xs font-extrabold uppercase tracking-wider text-[var(--title-text)] shadow-[var(--shadow-paper-sm)]"
          )}>
            {t('lobby.soon')}
          </span>
        </span>
        <span className="font-display text-lg font-extrabold leading-tight text-[var(--subtitle-text)]">{title}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={!enabled}
      onClick={onSelect}
      className="flex w-36 cursor-pointer flex-col items-center gap-3 rounded-[var(--radius-paper)] pt-4 text-center disabled:cursor-not-allowed"
    >
      <span className={BOX}>
        <span aria-hidden="true" className="absolute inset-1.5 rounded-[var(--radius-paper)] bg-[var(--box-inside)] shadow-[var(--shadow-paper-sm)]" />
        <span
          aria-hidden="true"
          className={cn(
            LID,
            "transition-transform duration-300 ease-out motion-reduce:transition-none",
            selected && "translate-x-2 -translate-y-3 rotate-6"
          )}
        >
          <game.Cover index={index} />
        </span>
        {voters.length > 0 && (
          <span aria-hidden="true" className="absolute -bottom-2 -right-2 flex -space-x-2">
            {voters.map((voter) => (
              <span
                key={voter.alias}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 bg-[var(--paper)] text-base leading-none",
                  styleOfColor(voter.color).border
                )}
              >
                {animalEmoji(voter.animal)}
              </span>
            ))}
          </span>
        )}
      </span>
      <span className="flex flex-col">
        <span className="font-display text-lg font-extrabold leading-tight text-[var(--title-text)]">{title}</span>
        <span className="text-xs font-medium text-[var(--subtitle-text)]">{players}</span>
        <span className="sr-only">
          {t('lobby.votes').replace('{count}', String(voters.length)).replace('{total}', String(playerCount))}
        </span>
      </span>
    </button>
  );
}
