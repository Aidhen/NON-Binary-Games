'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { findTakuzuConflicts } from '@nbg/shared';
import type { DifficultyLevel, GameStartedPayload } from '@nbg/shared';
import { TakuzuBoardUI } from './TakuzuBoardUI';
import { TakuzuSettingsPanel } from './TakuzuSettingsPanel';
import { ServerLoader } from '../loader/ServerLoader';
import { EmoteBar } from '../emotes/EmoteBar';
import { EmoteOverlay } from '../emotes/EmoteOverlay';
import { PlayerBar } from '../players/PlayerBar';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { getSocket } from '@/lib/socket';
import { useConnectionStatus } from '@/lib/useConnectionStatus';
import { useEmotes } from '@/lib/useEmotes';
import { useHighlight } from '@/lib/useHighlight';
import { usePlayers } from '@/lib/usePlayers';

/** Empty, then the first symbol, then the second, then empty again: a tap is the whole input. */
const nextValue = (value: number) => (value + 1) % 3;

export function TakuzuContainer({ roomId }: Readonly<{ roomId: string }>) {
  const [initial, setInitial] = useState<number[][]>();
  const [grid, setGrid] = useState<number[][]>();
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [othersSelections, setOthersSelections] = useState<Record<string, [number, number]>>({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(true);
  const [isGameWon, setIsGameWon] = useState(false);

  const { t } = useTranslation();
  const { status, retry } = useConnectionStatus();
  const { emotes, sendEmote, isCoolingDown } = useEmotes();
  // Before the effect that joins the room: the server answers the join with who is in it.
  const { self, players, profiles, setColor } = usePlayers(roomId);
  const { highlighted, highlight } = useHighlight();

  const conflicts = useMemo(() => (showErrors && grid ? findTakuzuConflicts(grid) : new Set<string>()), [grid, showErrors]);

  const setCell = useCallback((r: number, c: number, value: number) => {
    if (!grid || !initial || isGameWon || initial[r][c] !== 0) return;

    setGrid(grid.map((row, index) => (index === r ? row.map((cell, column) => (column === c ? value : cell)) : row)));
    getSocket().emit('cell-update', { r, c, v: value }, (result) => {
      // The server did not apply the move: ask for the real state instead of keeping a cell nobody else sees.
      if (!result.ok) getSocket().emit('join-room', roomId);
    });
  }, [grid, initial, isGameWon, roomId]);

  const handleCellClick = useCallback((r: number, c: number) => {
    setSelectedCell([r, c]);
    getSocket().emit('select-cell', { r, c });
    if (grid) setCell(r, c, nextValue(grid[r][c]));
  }, [grid, setCell]);

  // For the keyboard: 0 and 1 write that symbol in the selected cell, delete empties it.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!selectedCell || event.ctrlKey || event.metaKey || event.altKey) return;
      const [r, c] = selectedCell;

      if (event.key === 'Backspace' || event.key === 'Delete') setCell(r, c, 0);
      else if (event.key === '0') setCell(r, c, 1);
      else if (event.key === '1') setCell(r, c, 2);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedCell, setCell]);

  const handleDifficultyChange = (level: DifficultyLevel) => {
    setDifficulty(level);
    setIsSettingsOpen(false);
    getSocket().emit('restart-game', level);
  };

  useEffect(() => {
    const socket = getSocket();

    const join = () => { socket.emit('join-room', roomId); };
    const onGameStarted = (payload: GameStartedPayload) => {
      // The room can be playing another game: its start is not a grid for this page.
      if (payload.game !== 'takuzu') return;
      setDifficulty(payload.difficulty);
      setInitial(payload.initial);
      setGrid(payload.currentGrid);
      setSelectedCell(null);
      setOthersSelections({});
      setIsGameWon(false);
    };
    const onCellUpdated = ({ r, c, v }: { r: number; c: number; v: number }) =>
      setGrid((previous) => previous?.map((row, index) => (index === r ? row.map((cell, column) => (column === c ? v : cell)) : row)));
    const onPlayerSelectedCell = ({ alias, r, c }: { alias: string; r: number | null; c: number | null }) =>
      setOthersSelections((previous) => {
        const next = { ...previous };
        if (r === null || c === null) delete next[alias];
        else next[alias] = [r, c];
        return next;
      });
    const onPlayerDisconnected = (alias: string) =>
      setOthersSelections((previous) => {
        const next = { ...previous };
        delete next[alias];
        return next;
      });
    const onGameWon = () => {
      setIsGameWon(true);
      setSelectedCell(null);
    };

    socket.on('connect', join);
    socket.on('game-started', onGameStarted);
    socket.on('cell-updated', onCellUpdated);
    socket.on('player-selected-cell', onPlayerSelectedCell);
    socket.on('player-disconnected', onPlayerDisconnected);
    socket.on('game-won', onGameWon);

    // The room opened this game before this page was here: joining again is how the server tells it the grid.
    if (socket.connected) join();
    else socket.connect();

    return () => {
      socket.off('connect', join);
      socket.off('game-started', onGameStarted);
      socket.off('cell-updated', onCellUpdated);
      socket.off('player-selected-cell', onPlayerSelectedCell);
      socket.off('player-disconnected', onPlayerDisconnected);
      socket.off('game-won', onGameWon);
    };
  }, [roomId]);

  if (!grid || !initial) return <ServerLoader status={status} onRetry={retry} />;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[500px] mx-auto relative">
      <PlayerBar players={players} self={self} highlightedAlias={highlighted} onPickColor={setColor} onHighlight={highlight} />

      <div className="w-full flex justify-between items-center">
        <div className="rounded-full bg-[var(--paper)] px-4 py-1.5 text-[var(--subtitle-text)] text-sm font-bold uppercase tracking-wider shadow-[var(--shadow-paper-sm)]">
          {t('sudoku.mode')}: {t(`sudoku.${difficulty}`)}
        </div>
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          aria-expanded={isSettingsOpen}
          className="cursor-pointer rounded-full bg-[var(--paper)] px-4 py-1.5 text-[var(--subtitle-text)] hover:text-[var(--title-text)] text-sm font-bold uppercase shadow-[var(--shadow-paper-sm)] transition-colors"
        >
          {isSettingsOpen ? t('sudoku.closeSettings') : t('sudoku.settings')}
        </button>
      </div>

      {isSettingsOpen && (
        <TakuzuSettingsPanel
          showErrors={showErrors}
          onToggleErrors={() => setShowErrors((current) => !current)}
          currentDifficulty={difficulty}
          onDifficultyChange={handleDifficultyChange}
        />
      )}

      <div className="relative w-full">
        {isGameWon && (
          <div className={cn("absolute inset-0 z-20 rounded-2xl", "flex flex-col items-center justify-center", "bg-black/60 backdrop-blur-sm transition-all duration-500")}>
            <div className={cn("flex flex-col items-center p-8 text-center rounded-[var(--radius-paper)]", "bg-[var(--paper)] shadow-[var(--shadow-paper)]")}>
              <h2 className="font-display text-3xl font-extrabold text-[var(--title-text)] mb-2">{t('takuzu.cleared')}</h2>
              <p className="text-[var(--subtitle-text)] mb-6 font-medium">{t('takuzu.compliment')}</p>
              <button
                onClick={() => getSocket().emit('restart-game', difficulty)}
                className={cn(
                  "cursor-pointer px-6 py-3 rounded-[var(--radius-control)] font-display text-lg font-extrabold",
                  "bg-[var(--accent)] text-[var(--accent-ink)] shadow-[var(--shadow-paper-sm)]",
                  "transition-transform duration-150 motion-reduce:transition-none active:translate-y-0.5 active:shadow-none"
                )}
              >
                {t('sudoku.playAgain')}
              </button>
            </div>
          </div>
        )}

        <TakuzuBoardUI
          size={grid.length}
          grid={grid}
          initial={initial}
          selectedCell={selectedCell}
          conflicts={conflicts}
          isGameWon={isGameWon}
          onCellClick={handleCellClick}
          othersSelections={othersSelections}
          profiles={profiles}
          highlightedAlias={highlighted}
        />
      </div>

      <div className="w-full flex flex-col gap-3 mt-2">
        <div className="rounded-[var(--radius-paper)] bg-[var(--paper)] p-4 text-sm text-[var(--subtitle-text)] shadow-[var(--shadow-paper-sm)]">
          <p className="mb-2 font-black uppercase tracking-wide text-[var(--title-text)]">{t('takuzu.rules')}</p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>{t('takuzu.ruleBalance')}</li>
            <li>{t('takuzu.rulePairs')}</li>
            <li>{t('takuzu.ruleUnique')}</li>
          </ul>
          <p className="mt-3 font-medium">{t('takuzu.tapHint')}</p>
        </div>

        <EmoteBar onSend={sendEmote} disabled={isCoolingDown} />
      </div>

      <EmoteOverlay emotes={emotes} />
    </div>
  );
}
