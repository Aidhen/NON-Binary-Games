'use client';
import { useMemo } from 'react';
import { NotesGrid, SudokuBoard } from '@nbg/shared';
import { GameSettings } from './SudokuContainer';
import { SudokuCell } from './SudokuCell';
import { cn } from '@/lib/utils'; 

const MULTIPLAYER_COLORS = [
    'ring-blue-500 bg-blue-500/10',     // P1 
    'ring-green-500 bg-green-500/10',   // P2
    'ring-purple-500 bg-purple-500/10', // P3
    'ring-pink-500 bg-pink-500/10',     // P4
    'ring-orange-500 bg-orange-500/10'  // P5
];

const MULTIPLAYER_TEXT_COLORS = [
    'text-blue-500',
    'text-green-500',
    'text-purple-500',
    'text-pink-500',
    'text-orange-500'
];

const getStableColorIndex = (id: string): number => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % MULTIPLAYER_COLORS.length;
};

interface SudokuBoardUIProps {
    board: SudokuBoard;
    playerGrid: number[][];
    selectedCell: [number, number] | null;
    settings: GameSettings;
    isGameWon: boolean;
    onCellClick: (r: number, c: number) => void;
    isErrorPlacement: (r: number, c: number, value: number) => boolean;
    othersSelections?: Record<string, [number, number]>;
    notesGrid?: NotesGrid;
}

export function SudokuBoardUI({
    board,
    playerGrid,
    selectedCell,
    settings,
    isGameWon,
    onCellClick,
    isErrorPlacement,
    othersSelections = {},
    notesGrid = {}
}: SudokuBoardUIProps) {

    const isCellInitial = (r: number, c: number) => board.initial[r][c] !== 0;
    const isCellSelected = (r: number, c: number) => selectedCell?.[0] === r && selectedCell?.[1] === c;
    const isCellEmpty = (r: number, c: number) => playerGrid[r][c] === 0;

    const activePlayerIds = Object.keys(othersSelections).sort();

    const shouldDisplayError = (r: number, c: number, value: number): boolean => {
        if (!settings.showErrors) return false;
        if (isCellInitial(r, c)) return false;
        if (isCellEmpty(r, c)) return false;
        return isErrorPlacement(r, c, value);
    };

    const isSharedBox = (r: number, c: number, targetR: number, targetC: number) => {
        const boxR = Math.floor(r / board.boxSize);
        const boxC = Math.floor(c / board.boxSize);
        const targetBoxR = Math.floor(targetR / board.boxSize);
        const targetBoxC = Math.floor(targetC / board.boxSize);
        return boxR === targetBoxR && boxC === targetBoxC;
    };

    const shouldDrawCrosshair = (r: number, c: number): boolean => {
        if (!settings.highlightCrosshairs || !selectedCell) return false;
        if (isCellSelected(r, c)) return false;

        const [selectedR, selectedC] = selectedCell;
        const selectedValue = playerGrid[selectedR][selectedC];
        
        const originIsEmpty = selectedValue === 0;
        const originIsError = shouldDisplayError(selectedR, selectedC, selectedValue);
        
        if (!originIsEmpty && !originIsError) return false;

        return r === selectedR || c === selectedC || isSharedBox(r, c, selectedR, selectedC);
    };

    const shouldDrawSameNumberHighlight = (r: number, c: number, cellValue: number): boolean => {
        if (!settings.highlightSameNumbers || !selectedCell) return false;
        if (isCellSelected(r, c) || cellValue === 0) return false;

        const [selectedR, selectedC] = selectedCell;
        const selectedValue = playerGrid[selectedR][selectedC];
        
        if (selectedValue === 0) return false;
        if (shouldDisplayError(selectedR, selectedC, selectedValue)) return false;

        return cellValue === selectedValue;
    };

    const resolveBackgroundClass = (
        isInitial: boolean, 
        isSelected: boolean, 
        showCrosshair: boolean, 
        showSameNumbers: boolean
    ): string => {
        if (isSelected || showSameNumbers) return 'bg-[var(--cell-background-selected)]';
        if (showCrosshair) return 'bg-[var(--cell-background-highlight)]';
        if (isInitial) return 'bg-[var(--cell-background-initial)]';
        return 'bg-[var(--cell-background)] hover:bg-[var(--cell-background-initial)] transition-colors';
    };

    const resolveTextClass = (
        value: number, 
        isInitial: boolean, 
        isError: boolean
    ): string => {
        if (value === 0) return 'text-transparent';
        if (isInitial) return 'text-[var(--number-initial)] font-bold';
        if (isError) return 'text-red-500 font-bold';
        return 'text-[var(--number-player)] font-medium';
    };

    const cellOccupantsMap = useMemo(() => {
        const map = new Map<string, string>();
        Object.entries(othersSelections).forEach(([playerId, [r, c]]) => {
            map.set(`${r}-${c}`, playerId);
        });
        return map;
    }, [othersSelections]);

    return (
        <div className="relative w-full aspect-square">
            <div 
                className={cn(
                    "w-full h-full grid shadow-xl transition-colors duration-300",
                    "border-4 border-[var(--grid-border-outer)]"
                )}
                style={{ gridTemplateColumns: `repeat(${board.size}, minmax(0, 1fr))` }}
            >
                {playerGrid.map((row, rIndex) => (
                    row.map((cellValue, cIndex) => {
                        const isRightBorder = (cIndex + 1) % board.boxSize === 0 && cIndex !== board.size - 1;
                        const isBottomBorder = (rIndex + 1) % board.boxSize === 0 && rIndex !== board.size - 1;
                        
                        const initial = isCellInitial(rIndex, cIndex);
                        const selected = isCellSelected(rIndex, cIndex);
                        const displayError = shouldDisplayError(rIndex, cIndex, cellValue);
                        const showCrosshair = shouldDrawCrosshair(rIndex, cIndex);
                        const showSameNumbers = shouldDrawSameNumberHighlight(rIndex, cIndex, cellValue);

                        const bgClass = resolveBackgroundClass(initial, selected, showCrosshair, showSameNumbers);
                        const textClass = resolveTextClass(cellValue, initial, displayError);

                        const occupantId = cellOccupantsMap.get(`${rIndex}-${cIndex}`);
                        
                        let ringClass = "";
                        if (occupantId) {
                            ringClass = `ring-4 ring-inset z-10 ${MULTIPLAYER_COLORS[getStableColorIndex(occupantId)]}`;
                        }

                        const finalBgClass = cn(bgClass, ringClass);

                        const rawNotes = notesGrid[`${rIndex}-${cIndex}`];
                        let parsedNotes: Record<number, string> | undefined;
                        
                        if (rawNotes) {
                            parsedNotes = {};
                            for (const [noteVal, pid] of Object.entries(rawNotes)) {
                                parsedNotes[Number(noteVal)] = MULTIPLAYER_TEXT_COLORS[getStableColorIndex(pid)];
                            }
                        }

                        return (
                            <SudokuCell
                                key={`${rIndex}-${cIndex}`}
                                value={cellValue}
                                bgClass={finalBgClass}
                                textClass={textClass}
                                isRightBorder={isRightBorder}
                                isBottomBorder={isBottomBorder}
                                onClick={() => !isGameWon && onCellClick(rIndex, cIndex)}
                                notes={parsedNotes}
                                boardSize={board.size}
                                boxSize={board.boxSize}
                            />
                        );
                    })
                ))}
            </div>
        </div>
    );
}