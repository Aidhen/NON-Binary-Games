'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MEMORY_HAND_MS, MEMORY_MISMATCH_MS, getMemoryLevel } from '@nbg/shared';
import type { DifficultyLevel, GameStartedPayload, MemoryCardMatched, MemoryCardShown } from '@nbg/shared';
import { MemoryBoardUI } from './MemoryBoardUI';
import type { MemoryHeld } from './MemoryBoardUI';
import { ServerLoader } from '../loader/ServerLoader';
import { EmoteBar } from '../emotes/EmoteBar';
import { EmoteOverlay } from '../emotes/EmoteOverlay';
import { PlayerBar } from '../players/PlayerBar';
import { DifficultyPicker } from '../play/DifficultyPicker';
import { GameOverCard } from '../play/GameOverCard';
import { GameToolbar } from '../play/GameToolbar';
import { MEMORY_FIT } from '../games/boardStyles';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { getSocket } from '@/lib/socket';
import { useConnectionStatus } from '@/lib/useConnectionStatus';
import { useEmotes } from '@/lib/useEmotes';
import { useHighlight } from '@/lib/useHighlight';
import { usePlayers } from '@/lib/usePlayers';

/** How long a tap waits for the server before the card stops looking pressed: a flip the server refuses gets no answer. */
export const PENDING_MS = 1500;
/** How long a pair that was just found celebrates: the turn, the pulse and the stars. */
export const CELEBRATE_MS = 1200;

/** What the page knows of the table: only what the server has told. The drawings of the cards face down are not here. */
interface Table {
  difficulty: DifficultyLevel;
  cards: number;
  faces: Record<number, number>;
  matched: ReadonlySet<number>;
  /** Face up after a mismatch, until they turn back. */
  locked: ReadonlySet<number>;
  held: Record<number, MemoryHeld>;
  celebrating: ReadonlySet<number>;
  pending: number | null;
  won: boolean;
}

const without = <T,>(record: Record<number, T>, ...indices: number[]): Record<number, T> => {
  const next = { ...record };
  for (const index of indices) delete next[index];
  return next;
};

const added = (set: ReadonlySet<number>, ...indices: number[]): ReadonlySet<number> => new Set([...set, ...indices]);
const removed = (set: ReadonlySet<number>, ...indices: number[]): ReadonlySet<number> => new Set([...set].filter((index) => !indices.includes(index)));

export function MemoryContainer({ roomId }: Readonly<{ roomId: string }>) {
  const [table, setTable] = useState<Table>();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // What is waiting to happen on the table (a card held that turns back by itself, a lock that ends). One per card and kind.
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const { t } = useTranslation();
  const { status, retry } = useConnectionStatus();
  const { emotes, sendEmote, isCoolingDown } = useEmotes();
  // Before the effect that joins the room: the server answers the join with who is in it.
  const { self, players, profiles, setColor } = usePlayers(roomId);
  const { highlighted, highlight } = useHighlight();

  const stop = useCallback((key: string) => {
    clearTimeout(timers.current.get(key));
    timers.current.delete(key);
  }, []);

  const later = useCallback((key: string, ms: number, action: () => void) => {
    stop(key);
    timers.current.set(key, setTimeout(() => {
      timers.current.delete(key);
      action();
    }, ms));
  }, [stop]);

  const handleDifficultyChange = (level: DifficultyLevel) => {
    setIsSettingsOpen(false);
    getSocket().emit('restart-game', level);
  };

  useEffect(() => {
    const socket = getSocket();
    const clearTimers = () => {
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current.clear();
    };

    // A card that turns back: held too long, or locked after a mismatch.
    const turnBack = (...indices: number[]) =>
      setTable((current) => (current ? { ...current, faces: without(current.faces, ...indices), held: without(current.held, ...indices), locked: removed(current.locked, ...indices) } : current));

    const keepHeld = (index: number, closesInMs: number) => later(`hold-${index}`, closesInMs, () => turnBack(index));

    const join = () => { socket.emit('join-room', roomId); };
    const onGameStarted = (payload: GameStartedPayload) => {
      // The room can be playing another game: its start is not a table for this page.
      if (payload.game !== 'memory') return;
      clearTimers();

      const faces: Record<number, number> = {};
      const held: Record<number, MemoryHeld> = {};
      for (const { index, face } of payload.matched) faces[index] = face;
      for (const { index, face, alias, closesInMs } of payload.open) {
        faces[index] = face;
        held[index] = { alias, closesInMs };
        keepHeld(index, closesInMs);
      }
      setTable({
        difficulty: payload.difficulty,
        cards: payload.cards,
        faces,
        matched: new Set(payload.matched.map(({ index }: MemoryCardMatched) => index)),
        locked: new Set(),
        held,
        celebrating: new Set(),
        pending: null,
        // Somebody who joins when the last pair is already found gets the whole table and no `game-won`.
        won: payload.cards > 0 && payload.matched.length >= payload.cards,
      });
    };

    const onFlipped = ({ index, face, alias }: MemoryCardShown) => {
      setTable((current) => {
        if (!current || index >= current.cards) return current;
        return { ...current, faces: { ...current.faces, [index]: face }, held: { ...current.held, [index]: { alias, closesInMs: MEMORY_HAND_MS } }, pending: current.pending === index ? null : current.pending };
      });
      stop('pending');
      keepHeld(index, MEMORY_HAND_MS);
    };

    const onMatched = ({ indices }: { indices: [number, number] }) => {
      for (const index of indices) stop(`hold-${index}`);
      setTable((current) => (current ? { ...current, held: without(current.held, ...indices), matched: added(current.matched, ...indices), celebrating: added(current.celebrating, ...indices) } : current));
      later(`celebrate-${indices.join('-')}`, CELEBRATE_MS, () => setTable((current) => (current ? { ...current, celebrating: removed(current.celebrating, ...indices) } : current)));
    };

    const onMismatched = ({ indices }: { indices: [number, number] }) => {
      for (const index of indices) stop(`hold-${index}`);
      setTable((current) => (current ? { ...current, held: without(current.held, ...indices), locked: added(current.locked, ...indices) } : current));
      later(`lock-${indices.join('-')}`, MEMORY_MISMATCH_MS, () => turnBack(...indices));
    };

    const onClosed = ({ index }: { index: number }) => {
      stop(`hold-${index}`);
      turnBack(index);
    };

    const onWon = () => setTable((current) => (current ? { ...current, won: true } : current));

    socket.on('connect', join);
    socket.on('game-started', onGameStarted);
    socket.on('memory:flipped', onFlipped);
    socket.on('memory:matched', onMatched);
    socket.on('memory:mismatched', onMismatched);
    socket.on('memory:closed', onClosed);
    socket.on('game-won', onWon);

    // The room opened this game before this page was here: joining again is how the server tells it the table.
    if (socket.connected) join();
    else socket.connect();

    return () => {
      socket.off('connect', join);
      socket.off('game-started', onGameStarted);
      socket.off('memory:flipped', onFlipped);
      socket.off('memory:matched', onMatched);
      socket.off('memory:mismatched', onMismatched);
      socket.off('memory:closed', onClosed);
      socket.off('game-won', onWon);
      clearTimers();
    };
  }, [roomId, later, stop]);

  if (!table) return <ServerLoader status={status} onRetry={retry} />;

  const handleFlip = (index: number) => {
    if (table.won || table.pending !== null) return;
    // Only a card face down and free can be flipped: nothing is sent for the rest.
    if (table.matched.has(index) || table.locked.has(index) || Object.hasOwn(table.held, index)) return;

    setTable({ ...table, pending: index });
    later('pending', PENDING_MS, () => setTable((now) => (now?.pending === index ? { ...now, pending: null } : now)));
    getSocket().emit('memory:flip', { index });
  };

  const fill = (text: string) => text.replace('{found}', String(table.matched.size / 2)).replace('{total}', String(table.cards / 2));

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-6 w-full max-w-[500px] sm:max-w-[900px] mx-auto relative">
      <PlayerBar players={players} self={self} highlightedAlias={highlighted} onPickColor={setColor} onHighlight={highlight} />

      <GameToolbar difficulty={table.difficulty} isSettingsOpen={isSettingsOpen} onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)} />

      {isSettingsOpen && (
        <div className="w-full p-5 mb-2 flex flex-col gap-6 rounded-[var(--radius-paper)] bg-[var(--paper)] shadow-[var(--shadow-paper)]">
          <DifficultyPicker currentDifficulty={table.difficulty} onDifficultyChange={handleDifficultyChange} labelOf={(level) => t('memory.pairs').replace('{n}', String(getMemoryLevel(level).pairs))} />
        </div>
      )}

      <div className="flex w-full flex-col gap-2">
        <p className="text-right text-sm font-black text-[var(--title-text)]">{fill(t('memory.counter'))}</p>
        <div className={cn('relative', MEMORY_FIT)}>
          <MemoryBoardUI
            cards={table.cards}
            faces={table.faces}
            matched={table.matched}
            locked={table.locked}
            held={table.held}
            celebrating={table.celebrating}
            pending={table.pending}
            self={self}
            profiles={profiles}
            disabled={table.won || status !== 'connected'}
            onFlip={handleFlip}
          />
        </div>
      </div>

      {table.won && (
        <GameOverCard overlay={false} title={t('memory.cleared')} message={t('memory.compliment')} onBackToTable={() => getSocket().emit('vote-table', true)} onPlayAgain={() => getSocket().emit('restart-game', table.difficulty)} />
      )}

      <div className="w-full flex flex-col gap-3 mt-2">
        <EmoteBar onSend={sendEmote} disabled={isCoolingDown} />

        <div className="rounded-[var(--radius-paper)] bg-[var(--paper)] p-4 text-sm text-[var(--subtitle-text)] shadow-[var(--shadow-paper-sm)]">
          <p className="mb-2 font-black uppercase tracking-wide text-[var(--title-text)]">{t('memory.rules')}</p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>{t('memory.ruleFind')}</li>
            <li>{t('memory.ruleTogether')}</li>
            <li>{t('memory.ruleMismatch')}</li>
          </ul>
        </div>
      </div>

      <EmoteOverlay emotes={emotes} />
    </div>
  );
}
