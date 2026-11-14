'use client';
import { useCallback, useEffect, useState } from 'react';
import { FLOWER_HIDDEN } from '@nbg/shared';
import type { DifficultyLevel, FlowerCellChange, FlowerStatus, GameStartedPayload } from '@nbg/shared';
import { FlowerFieldBoardUI } from './FlowerFieldBoardUI';
import { FlowerFieldSettingsPanel } from './FlowerFieldSettingsPanel';
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

/** What the page knows of the field. It only ever shows what the server says: nothing is opened before the server agrees. */
interface Field {
  size: number;
  grid: number[][];
  flags: Record<string, string>;
  status: FlowerStatus;
  explosive: boolean;
  difficulty: DifficultyLevel;
  mines: [number, number][];
  exploded: [number, number] | null;
}

/** A cell that opens or is marked has no flag any more. */
const applyChanges = (field: Field, cells: FlowerCellChange[]): Field => {
  const grid = field.grid.map((row) => [...row]);
  const flags = { ...field.flags };
  for (const { r, c, v } of cells) {
    grid[r][c] = v;
    delete flags[`${r}-${c}`];
  }
  return { ...field, grid, flags };
};

export function FlowerFieldContainer({ roomId }: Readonly<{ roomId: string }>) {
  const [field, setField] = useState<Field>();
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [othersSelections, setOthersSelections] = useState<Record<string, [number, number]>>({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFlagMode, setIsFlagMode] = useState(false);

  const { t } = useTranslation();
  const { status, retry } = useConnectionStatus();
  const { emotes, sendEmote, isCoolingDown } = useEmotes();
  // Before the effect that joins the room: the server answers the join with who is in it.
  const { self, players, profiles, setColor } = usePlayers(roomId);
  const { highlighted, highlight } = useHighlight();

  const handleCellClick = useCallback((r: number, c: number) => {
    setSelectedCell([r, c]);
    getSocket().emit('select-cell', { r, c });
    if (field?.status !== 'playing' || field.grid[r][c] !== FLOWER_HIDDEN) return;

    getSocket().emit(isFlagMode ? 'flower-field:flag' : 'flower-field:reveal', { r, c });
  }, [field, isFlagMode]);

  const handleDifficultyChange = (level: DifficultyLevel) => {
    setIsSettingsOpen(false);
    getSocket().emit('restart-game', level);
  };

  useEffect(() => {
    const socket = getSocket();

    const join = () => { socket.emit('join-room', roomId); };
    const onGameStarted = (payload: GameStartedPayload) => {
      // The room can be playing another game: its start is not a field for this page.
      if (payload.game !== 'flower-field') return;
      setField({
        size: payload.size,
        grid: payload.grid,
        flags: payload.flags,
        status: payload.status,
        explosive: payload.explosive,
        difficulty: payload.difficulty,
        mines: payload.mines,
        exploded: null,
      });
      setSelectedCell(null);
      setOthersSelections({});
    };
    const onUpdated = ({ cells }: { cells: FlowerCellChange[] }) => setField((current) => (current ? applyChanges(current, cells) : current));
    const onFlagged = ({ r, c, alias }: { r: number; c: number; alias: string | null }) =>
      setField((current) => {
        if (!current) return current;
        const flags = { ...current.flags };
        if (alias === null) delete flags[`${r}-${c}`];
        else flags[`${r}-${c}`] = alias;
        return { ...current, flags };
      });
    const onLost = ({ mines, exploded }: { mines: [number, number][]; exploded: [number, number] }) =>
      setField((current) => (current ? { ...current, status: 'lost', mines, exploded } : current));
    const onWon = () => setField((current) => (current ? { ...current, status: 'won' } : current));
    const onMode = ({ explosive }: { explosive: boolean }) => setField((current) => (current ? { ...current, explosive } : current));
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

    socket.on('connect', join);
    socket.on('game-started', onGameStarted);
    socket.on('flower-field:updated', onUpdated);
    socket.on('flower-field:flagged', onFlagged);
    socket.on('flower-field:lost', onLost);
    socket.on('flower-field:mode', onMode);
    socket.on('game-won', onWon);
    socket.on('player-selected-cell', onPlayerSelectedCell);
    socket.on('player-disconnected', onPlayerDisconnected);

    // The room opened this game before this page was here: joining again is how the server tells it the field.
    if (socket.connected) join();
    else socket.connect();

    return () => {
      socket.off('connect', join);
      socket.off('game-started', onGameStarted);
      socket.off('flower-field:updated', onUpdated);
      socket.off('flower-field:flagged', onFlagged);
      socket.off('flower-field:lost', onLost);
      socket.off('flower-field:mode', onMode);
      socket.off('game-won', onWon);
      socket.off('player-selected-cell', onPlayerSelectedCell);
      socket.off('player-disconnected', onPlayerDisconnected);
    };
  }, [roomId]);

  if (!field) return <ServerLoader status={status} onRetry={retry} />;

  const isOver = field.status !== 'playing';
  const isUntouched = field.grid.every((row) => row.every((value) => value === FLOWER_HIDDEN));

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[500px] mx-auto relative">
      <PlayerBar players={players} self={self} highlightedAlias={highlighted} onPickColor={setColor} onHighlight={highlight} />

      <div className="w-full flex justify-between items-center">
        <div className="rounded-full bg-[var(--paper)] px-4 py-1.5 text-[var(--subtitle-text)] text-sm font-bold uppercase tracking-wider shadow-[var(--shadow-paper-sm)]">
          {t('sudoku.mode')}: {t(`sudoku.${field.difficulty}`)}
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
        <FlowerFieldSettingsPanel
          explosive={field.explosive}
          canChangeExplosive={isUntouched && !isOver}
          onToggleExplosive={() => getSocket().emit('flower-field:set-mode', { explosive: !field.explosive })}
          currentDifficulty={field.difficulty}
          onDifficultyChange={handleDifficultyChange}
        />
      )}

      <div className="relative w-full">
        {isOver && (
          <div className={cn("absolute inset-0 z-20 rounded-2xl", "flex flex-col items-center justify-center", "bg-black/60 backdrop-blur-sm transition-all duration-500")}>
            <div className={cn("flex flex-col items-center p-8 text-center rounded-[var(--radius-paper)]", "bg-[var(--paper)] shadow-[var(--shadow-paper)]")}>
              <h2 className="font-display text-3xl font-extrabold text-[var(--title-text)] mb-2">
                {field.status === 'won' ? t('flowerField.cleared') : t('flowerField.lost')}
              </h2>
              <p className="text-[var(--subtitle-text)] mb-6 font-medium">
                {field.status === 'won' ? t('flowerField.compliment') : t('flowerField.lostHint')}
              </p>
              <button
                onClick={() => getSocket().emit('restart-game', field.difficulty)}
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

        <FlowerFieldBoardUI
          size={field.size}
          grid={field.grid}
          flags={field.flags}
          mines={field.mines}
          exploded={field.exploded}
          selectedCell={selectedCell}
          isOver={isOver}
          onCellClick={handleCellClick}
          othersSelections={othersSelections}
          profiles={profiles}
          highlightedAlias={highlighted}
        />
      </div>

      <div className="w-full flex flex-col gap-3 mt-2">
        <div className="flex justify-center w-full">
          <button
            onClick={() => setIsFlagMode(!isFlagMode)}
            aria-pressed={isFlagMode}
            className={cn(
              "flex cursor-pointer items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-200",
              isFlagMode
                ? "bg-[var(--number-player)]/10 text-[var(--number-player)] border-2 border-[var(--number-player)]/50"
                : "bg-[var(--numpad-background)] text-[var(--subtitle-text)] border-2 border-transparent hover:bg-[var(--numpad-hover)]"
            )}
          >
            <span className="text-lg">⚑</span>
            {t('flowerField.flagMode')} {isFlagMode ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="rounded-[var(--radius-paper)] bg-[var(--paper)] p-4 text-sm text-[var(--subtitle-text)] shadow-[var(--shadow-paper-sm)]">
          <p className="mb-2 font-black uppercase tracking-wide text-[var(--title-text)]">{t('flowerField.rules')}</p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>{t('flowerField.ruleNumbers')}</li>
            <li>{t('flowerField.ruleSafe')}</li>
            <li>{t('flowerField.ruleFlags')}</li>
            <li>{field.explosive ? t('flowerField.ruleMineLoses') : t('flowerField.ruleMineMarks')}</li>
          </ul>
        </div>

        <EmoteBar onSend={sendEmote} disabled={isCoolingDown} />
      </div>

      <EmoteOverlay emotes={emotes} />
    </div>
  );
}
