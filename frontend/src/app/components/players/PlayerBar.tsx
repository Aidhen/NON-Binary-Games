'use client';
import { useEffect, useId, useRef, useState } from 'react';
import type { PlayerColor, PlayerProfile } from '@nbg/shared';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { playerName } from '@/lib/playerNames';
import { ColorPicker } from './ColorPicker';
import { PlayerChip } from './PlayerChip';

interface PlayerBarProps {
  /** The players in the room, in the order they came. */
  players: PlayerProfile[];
  /** Who the player is in that list (their alias), once the server has said so. */
  self: string | null;
  /** The player who is being pointed out on the board, if any. */
  highlightedAlias: string | null;
  onPickColor: (color: PlayerColor) => void;
  onHighlight: (alias: string) => void;
}

/**
 * Who is in the room, above the board. The player is first and clicking their chip opens the color
 * picker; clicking another chip points that player out on the board. A hidden status line tells screen
 * reader users who comes and who leaves.
 */
export function PlayerBar({ players, self, highlightedAlias, onPickColor, onHighlight }: PlayerBarProps) {
  const { t } = useTranslation();
  const pickerId = useId();
  const ownChip = useRef<HTMLButtonElement>(null);
  const previous = useRef<PlayerProfile[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const own = players.find(({ alias }) => alias === self);
  const others = players.filter(({ alias }) => alias !== self);
  const open = pickerOpen && own !== undefined;

  useEffect(() => { if (!own) setPickerOpen(false); }, [own]);

  useEffect(() => {
    const before = previous.current;
    previous.current = players;
    // The first list is the room as it was when the player came: nobody "joined" in front of them.
    if (before.length === 0) return;

    const was = new Set(before.map(({ alias }) => alias));
    const is = new Set(players.map(({ alias }) => alias));
    const text = [
      ...players.filter(({ alias }) => !was.has(alias) && alias !== self).map((player) => t('players.joined').replace('{name}', playerName(t, player))),
      ...before.filter(({ alias }) => !is.has(alias)).map((player) => t('players.left').replace('{name}', playerName(t, player))),
    ].join('. ');
    if (text) setAnnouncement(text);
  }, [players, self, t]);

  const closePicker = () => {
    setPickerOpen(false);
    ownChip.current?.focus();
  };

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {players.length > 0 && (
        <ul aria-label={t('players.title')} className="flex w-full flex-wrap items-center justify-center gap-2">
          {[...(own ? [own] : []), ...others].map((player) => {
            const isSelf = player.alias === self;
            const name = playerName(t, player);

            return (
              <li key={player.alias}>
                <PlayerChip
                  profile={player}
                  name={name}
                  isSelf={isSelf}
                  isHighlighted={player.alias === highlightedAlias}
                  expanded={open}
                  label={isSelf ? `${name} (${t('players.you')})` : t('players.highlight').replace('{name}', name)}
                  buttonRef={isSelf ? ownChip : undefined}
                  onClick={() => (isSelf ? (open ? closePicker() : setPickerOpen(true)) : onHighlight(player.alias))}
                />
              </li>
            );
          })}
        </ul>
      )}

      {open && own && (
        <ColorPicker
          id={pickerId}
          current={own.color}
          others={others}
          onPick={(color) => { onPickColor(color); closePicker(); }}
          onClose={closePicker}
        />
      )}

      <p role="status" className="sr-only">{announcement}</p>
    </div>
  );
}
