'use client';
import { useState, useEffect, useCallback } from 'react';
import { generateSudoku, SudokuBoard, isValid, DifficultyLevel, NotesGrid } from '@nbg/shared';
import { SudokuBoardUI } from './SudokuBoardUI';
import { SettingsPanel } from './SettingsPanel';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { getSocket } from "@/lib/socket";

export interface GameSettings {
    highlightCrosshairs: boolean;
    highlightSameNumbers: boolean;
    showErrors: boolean;
}

export function SudokuContainer({ roomId = "room-1" }: { roomId?: string }) {
    const [board, setBoard] = useState<SudokuBoard>();
    const [playerGrid, setPlayerGrid] = useState<number[][]>();
    const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isGameWon, setIsGameWon] = useState<boolean>(false);
    const [notesGrid, setNotesGrid] = useState<NotesGrid>({});
    const [isNotesMode, setIsNotesMode] = useState(false);

    const { t } = useTranslation();

    const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');

    const [settings, setSettings] = useState<GameSettings>({
        highlightCrosshairs: true,
        highlightSameNumbers: true,
        showErrors: true,
    });

    const initGame = useCallback((level: DifficultyLevel = difficulty) => {
        const newBoard = generateSudoku(level);
        setBoard(newBoard);
        setPlayerGrid(newBoard.initial.map(row => [...row]));
        setSelectedCell(null);
        setNotesGrid({});
    }, [difficulty]);

    const [othersSelections, setOthersSelections] = useState<Record<string, [number, number]>>({});

    const handleCellClick = useCallback((r: number, c: number) => {
        setSelectedCell([r, c]);
        getSocket().emit("select-cell", roomId, { r, c });
    }, [roomId]);

    const handleDifficultyChange = (newDifficulty: DifficultyLevel) => {
        setDifficulty(newDifficulty);
        initGame(newDifficulty);
        setIsSettingsOpen(false);
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
            getSocket().emit("toggle-note", roomId, { r, c, v: value });
            return;
        }

        const newGrid = [...playerGrid];
        newGrid[r] = [...newGrid[r]];
        newGrid[r][c] = value;

        setPlayerGrid(newGrid);
        getSocket().emit("cell-update", roomId, { r, c, v: value });
    }, [selectedCell, playerGrid, board, canAcceptInput, roomId, isNotesMode]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedCell || !board) return;
            
            if (e.key === 'Backspace' || e.key === 'Delete') {
                handleInput(0, false);
                return;
            }
            
            let num = parseInt(e.key);
            if (isNaN(num)) {
                if (e.code.startsWith('Digit')) {
                    num = parseInt(e.code.replace('Digit', ''));
                } else if (e.code.startsWith('Numpad')) {
                    num = parseInt(e.code.replace('Numpad', ''));
                }
            }
            
            if (!isNaN(num) && num >= 1 && num <= board.size) {
                const asNote = isNotesMode || e.shiftKey;
                handleInput(num, asNote);
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedCell, board, handleInput, isNotesMode]);

    const toggleSetting = (key: keyof GameSettings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    useEffect(() => {
        console.log("🟡 [Frontend] Mounting SudokuContainer");
        const socket = getSocket();

        const joinGame = () => {
            console.log(`🚀 [Frontend] Emitting 'join-room' for room ${roomId}`);
            socket.emit("join-room", roomId, difficulty);
        };

        const onConnect = () => {
            console.log("🟢 [Frontend] Socket connected! ID:", socket.id);
            joinGame();
        };

        socket.on("connect", onConnect);
        
        socket.on("game-started", (payload) => {
            console.log("🔵 [Frontend] 'game-started' received! Payload:", payload);
            setBoard(payload.board);
            setPlayerGrid(payload.currentGrid);
            setNotesGrid(payload.notesGrid || {});
            setIsGameWon(false);
        });

        if (socket.connected) {
            console.log("⚡ [Frontend] Socket was already connected (Hot Reload), joining immediately");
            joinGame();
        } else {
            console.log("⏳ [Frontend] Calling socket.connect()...");
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

        socket.on("player-selected-cell", ({ playerId, r, c }) => {
            setOthersSelections((prev) => {
                const next = { ...prev };
                if (r === null || c === null) {
                    delete next[playerId];
                } else {
                    next[playerId] = [r, c];
                }
                return next;
            });
        });

        socket.on("player-disconnected", (playerId) => {
            setOthersSelections((prev) => {
                const next = { ...prev };
                delete next[playerId];
                return next;
            });
        });

        socket.on("game-won", () => {
            console.log("🎉 [Frontend] 'game-won' received!");
            setIsGameWon(true);
            setSelectedCell(null);
        });

        socket.on("note-toggled", ({ r, c, v, playerId }) => {
            setNotesGrid((prev) => {
                const next = { ...prev };
                const key = `${r}-${c}`;
                
                if (!next[key]) next[key] = {};
                
                if (playerId === null) {
                    delete next[key][v];
                    if (Object.keys(next[key]).length === 0) {
                        delete next[key];
                    }
                } else {
                    next[key][v] = playerId;
                }
                return next;
            });
        });

        return () => {
            console.log("🧹 [Frontend] Cleanup: unmounting listeners");
            socket.off("connect", onConnect);
            socket.off("game-started");
            socket.off("cell-updated");
            socket.off("player-selected-cell");
            socket.off("player-disconnected");
            socket.off("game-won");
            socket.off("note-toggled");
        };
    }, [difficulty, roomId]);

    if (!board || !playerGrid) {
        return (
            <div className={cn(
                "w-full max-w-[500px] aspect-square mx-auto",
                "flex items-center justify-center border-4 border-[var(--grid-border-outer)]"
            )}>
                <span className="text-[var(--subtitle-text)] font-medium animate-pulse">
                    {t('sudoku.loading')}
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-[500px] mx-auto relative">
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
                        "absolute inset-0 z-10 rounded-lg",
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
                                onClick={() => getSocket().emit("restart-game", roomId, difficulty)}
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
                />
            </div>

            {/* Controls Area (Toggle + Numpad) */}
            <div className="w-full flex flex-col gap-3 mt-2">
                <div className="flex justify-end w-full">
                    <button
                        onClick={() => setIsNotesMode(!isNotesMode)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                            isNotesMode 
                                ? "bg-blue-500/20 text-blue-500 border-2 border-blue-500/50" 
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
                            disabled={!selectedCell || isGameWon}
                            className={cn(
                                "p-3 text-xl font-bold rounded-lg transition-all duration-200",
                                isNotesMode 
                                    ? "bg-[var(--cell-background)] text-blue-500 border border-blue-500/30" 
                                    : "bg-[var(--numpad-background)] text-[var(--numpad-text)]",
                                "hover:opacity-80 active:scale-95",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={() => handleInput(0, false)}
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
            </div>
        </div>
    );
}