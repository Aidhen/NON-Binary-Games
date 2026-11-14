'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { SudokuBoard, isValid, DifficultyLevel, JoinError, NotesGrid } from '@nbg/shared';
import { SudokuBoardUI } from './SudokuBoardUI';
import { SettingsPanel } from './SettingsPanel';
import { ServerLoader } from '../loader/ServerLoader';
import { EmoteBar } from '../emotes/EmoteBar';
import { EmoteOverlay } from '../emotes/EmoteOverlay';
import { PlayerBar } from '../players/PlayerBar';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { getSocket } from "@/lib/socket";
import { useConnectionStatus } from '@/lib/useConnectionStatus';
import { useEmotes } from '@/lib/useEmotes';
import { useHighlight } from '@/lib/useHighlight';
import { usePlayers } from '@/lib/usePlayers';
import { getCompletedNumbers } from '@/lib/completedNumbers';

export interface GameSettings {
  highlightCrosshairs: boolean;
  highlightSameNumbers: boolean;
  showErrors: boolean;
  godMode: boolean;
}

/** One message per reason: a new JoinError does not compile until it has its own text. */
const joinErrorMessages: Record<JoinError, string> = {
  'room-full': 'sudoku.roomFull',
  'server-full': 'sudoku.serverFull',
  'too-fast': 'sudoku.tooFast',
};

export function SudokuContainer({ roomId }: { roomId: string }) {
  const [board, setBoard] = useState<SudokuBoard>();
  const [playerGrid, setPlayerGrid] = useState<number[][]>();
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [notesGrid, setNotesGrid] = useState<NotesGrid>({});
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [joinError, setJoinError] = useState<JoinError | null>(null);

  const { t } = useTranslation();
  const { status, retry } = useConnectionStatus();
  const [hasEntered, setHasEntered] = useState(false);
  const enterGame = useCallback(() => setHasEntered(true), []);
  const { emotes, sendEmote, isCoolingDown } = useEmotes();
  // Before the effect that joins the room: the server answers the join with who is in it.
  const { self, players, profiles, setColor } = usePlayers(roomId);
  const { highlighted, highlight } = useHighlight();

  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const difficultyRef = useRef<DifficultyLevel>('easy');

  const [settings, setSettings] = useState<GameSettings>({
    highlightCrosshairs: true,
    highlightSameNumbers: true,
    showErrors: true,
    godMode: false,
  });


  const [othersSelections, setOthersSelections] = useState<Record<string, [number, number]>>({});

  const completedNumbers = useMemo(
    () => (board && playerGrid ? getCompletedNumbers(playerGrid, board.size) : new Set<number>()),
    [board, playerGrid]
  );

  const handleCellClick = useCallback((r: number, c: number) => {
    setSelectedCell([r, c]);
    getSocket().emit("select-cell", { r, c });
  }, []);

  const handleDifficultyChange = (newDifficulty: DifficultyLevel) => {
    difficultyRef.current = newDifficulty;
    setDifficulty(newDifficulty);
    setIsSettingsOpen(false);
    getSocket().emit('restart-game', newDifficulty);
  };

  const canAcceptInput = useCallback((r: number, c: number): boolean => {
    if (!board) return false;
    if (board.initial[r][c] !== 0) return false;
    return true;
  }, [board]);

  const isErrorPlacement = useCallback((r: number, c: number, value: number): boolean => {
    if (!playerGrid || !board) return false;
    if (value === 0) return false;
    const tempGrid = playerGrid.map(row => [...row]);
    tempGrid[r][c] = 0;
    return !isValid(tempGrid, r, c, value, board.size, board.boxSize);
  }, [playerGrid, board]);


  const handleInput = useCallback((value: number, asNote: boolean = isNotesMode) => {
    if (!selectedCell || !playerGrid || !board) return;
    const [r, c] = selectedCell;

    if (!canAcceptInput(r, c)) return;

    if (asNote && value !== 0) {
      getSocket().emit("toggle-note", { r, c, v: value });
      return;
    }

    const newGrid = [...playerGrid];
    newGrid[r] = [...newGrid[r]];
    newGrid[r][c] = value;

    setPlayerGrid(newGrid);
    getSocket().emit("cell-update", { r, c, v: value }, (result) => {
      // The server did not apply the move: ask for the real state instead of keeping a cell nobody else sees.
      if (!result.ok) getSocket().emit("join-room", roomId, difficultyRef.current);
    });
  }, [selectedCell, playerGrid, board, canAcceptInput, isNotesMode, roomId]);

  // In notes mode the delete key wipes the notes of the cell; with no notes to wipe (or outside notes mode) it clears the number.
  const handleClear = useCallback(() => {
    if (!selectedCell) return;
    const [r, c] = selectedCell;
    const notes = Object.keys(notesGrid[`${r}-${c}`] ?? {});

    if (isNotesMode && notes.length > 0 && canAcceptInput(r, c)) {
      notes.forEach((note) => getSocket().emit("toggle-note", { r, c, v: Number(note) }));
      return;
    }

    handleInput(0, false);
  }, [selectedCell, notesGrid, isNotesMode, canAcceptInput, handleInput]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell || !board) return;

      if (e.key === 'Backspace' || e.key === 'Delete') {
        handleClear();
        return;
      }

      let num = Number.parseInt(e.key);
      if (Number.isNaN(num)) {
        if (e.code.startsWith('Digit')) {
          num = Number.parseInt(e.code.replace('Digit', ''));
        } else if (e.code.startsWith('Numpad')) {
          num = Number.parseInt(e.code.replace('Numpad', ''));
        }
      }

      if (!Number.isNaN(num) && num >= 1 && num <= board.size) {
        const asNote = isNotesMode || e.shiftKey;
        handleInput(num, asNote);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, board, handleInput, handleClear, isNotesMode]);

  const toggleSetting = (key: keyof GameSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const socket = getSocket();

    const joinGame = () => {
      socket.emit('join-room', roomId, difficultyRef.current);
    };

    const onConnect = () => {
      joinGame();
    };

    socket.on("connect", onConnect);

    const onJoinError = (reason: JoinError) => setJoinError(reason);
    socket.on("join-error", onJoinError);

    socket.on("game-started", (payload) => {
      // A refusal can be temporary (too-fast): once the game starts, the error must not stay on screen.
      setJoinError(null);
      difficultyRef.current = payload.difficulty;
      setDifficulty(payload.difficulty);
      setBoard(payload.board);
      setPlayerGrid(payload.currentGrid);
      setNotesGrid(payload.notesGrid || {});
      setSelectedCell(null);
      setOthersSelections({});
      setIsGameWon(false);
    });

    if (socket.connected) {
      joinGame();
    } else {
      socket.connect();
    }

    socket.on("cell-updated", ({ r, c, v }) => {
      setPlayerGrid((prev) => {
        if (!prev) return prev;
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = v;
        return newGrid;
      });
    });

    socket.on("player-selected-cell", ({ alias, r, c }) => {
      setOthersSelections((prev) => {
        const next = { ...prev };
        if (r === null || c === null) {
          delete next[alias];
        } else {
          next[alias] = [r, c];
        }
        return next;
      });
    });

    socket.on("player-disconnected", (alias) => {
      setOthersSelections((prev) => {
        const next = { ...prev };
        delete next[alias];
        return next;
      });
    });

    socket.on("game-won", () => {
      setIsGameWon(true);
      setSelectedCell(null);
    });

    socket.on("note-toggled", ({ r, c, v, alias }) => {
      setNotesGrid((prev) => {
        const next = { ...prev };
        const key = `${r}-${c}`;

        if (!next[key]) next[key] = {};

        if (alias === null) {
          delete next[key][v];
          if (Object.keys(next[key]).length === 0) {
            delete next[key];
          }
        } else {
          next[key][v] = alias;
        }
        return next;
      });
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("join-error", onJoinError);
      socket.off("game-started");
      socket.off("cell-updated");
      socket.off("player-selected-cell");
      socket.off("player-disconnected");
      socket.off("game-won");
      socket.off("note-toggled");
    };
  }, [roomId]);

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

  if (!board || !playerGrid || !hasEntered) {
    return <ServerLoader status={status} ready={!!board && !!playerGrid} onEnter={enterGame} onRetry={retry} />;
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[500px] mx-auto relative">
      <PlayerBar players={players} self={self} highlightedAlias={highlighted} onPickColor={setColor} onHighlight={highlight} />

      <div className="w-full flex justify-between items-center">
        <div className="text-[var(--subtitle-text)] text-sm font-bold uppercase tracking-wider">
          {t('sudoku.mode')}: {t(`sudoku.${difficulty}`)}
        </div>
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="text-[var(--subtitle-text)] hover:text-[var(--title-text)] text-sm font-bold uppercase transition-colors"
        >
          {isSettingsOpen ? t('sudoku.closeSettings') : `${t('sudoku.settings')}`}
        </button>
      </div>

      {isSettingsOpen && (
        <SettingsPanel
          settings={settings}
          onToggle={toggleSetting}
          currentDifficulty={difficulty}
          onDifficultyChange={handleDifficultyChange}
        />
      )}

      <div className="relative w-full">
        {isGameWon && (
          <div className={cn(
            "absolute inset-0 z-20 rounded-lg",
            "flex flex-col items-center justify-center",
            "bg-black/60 backdrop-blur-sm transition-all duration-500"
          )}>
            <div className={cn(
              "flex flex-col items-center p-8 rounded-xl shadow-2xl",
              "bg-[var(--cell-background)] border-2 border-[var(--grid-border-outer)]"
            )}>
              <h2 className="text-3xl font-black text-[var(--title-text)] mb-2">
                {t('sudoku.cleared')}
              </h2>
              <p className="text-[var(--subtitle-text)] mb-6 font-medium">
                {t('sudoku.compliment')}
              </p>
              <button
                onClick={() => getSocket().emit("restart-game", difficulty)}
                className={cn(
                  "px-6 py-3 rounded-lg font-bold transition-all duration-200",
                  "bg-[var(--numpad-background)] text-[var(--numpad-text)]",
                  "hover:bg-[var(--numpad-hover)] active:bg-[var(--numpad-active)]"
                )}
              >
                {t('sudoku.playAgain')}
              </button>
            </div>
          </div>
        )}

        <SudokuBoardUI
          board={board}
          playerGrid={playerGrid}
          selectedCell={selectedCell}
          settings={settings}
          isGameWon={isGameWon}
          onCellClick={handleCellClick}
          isErrorPlacement={isErrorPlacement}
          othersSelections={othersSelections}
          notesGrid={notesGrid}
          completedNumbers={completedNumbers}
          profiles={profiles}
          highlightedAlias={highlighted}
        />
      </div>

      {/* Controls Area (Toggle + Numpad) */}
      <div className="w-full flex flex-col gap-3 mt-2">
        <div className="flex justify-center w-full">
          <button
            onClick={() => setIsNotesMode(!isNotesMode)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200",
              isNotesMode
                ? "bg-[var(--number-player)]/10 text-[var(--number-player)] border-2 border-[var(--number-player)]/50"
                : "bg-[var(--numpad-background)] text-[var(--subtitle-text)] border-2 border-transparent hover:bg-[var(--numpad-hover)]"
            )}
          >
            <span className="text-lg">✎</span>
            {t('sudoku.notesMode')} {isNotesMode ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2 w-full">
          {Array.from({ length: board.size }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => handleInput(num, isNotesMode)}
              disabled={!selectedCell || isGameWon || completedNumbers.has(num)}
              className={cn(
                "p-3 text-xl font-bold rounded-lg transition-all duration-200",
                isNotesMode
                  ? "bg-[var(--cell-background)] text-[var(--number-player)] border border-[var(--number-player)]/30"
                  : "bg-[var(--numpad-background)] text-[var(--numpad-text)]",
                "hover:opacity-80 active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            disabled={!selectedCell || isGameWon}
            className={cn(
              "p-3 text-xl font-bold rounded-lg transition-all duration-200",
              "bg-red-500/10 text-red-500 hover:bg-red-500/20 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            ⌫
          </button>
        </div>

        <EmoteBar onSend={sendEmote} disabled={isCoolingDown} />
      </div>

      <EmoteOverlay emotes={emotes} />
    </div>
  );
}