'use client';
import { useMemo } from 'react';
import { NotesGrid, PlayerProfile, SudokuBoard } from '@nbg/shared';
import { GameSettings } from './SudokuContainer';
import { SudokuCell } from './SudokuCell';
import { cn } from '@/lib/utils';
import { UNKNOWN_PLAYER_STYLE, styleOfColor } from '@/lib/playerPalette';

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
  completedNumbers?: Set<number>;
  /** Every player the page has seen in the room, by alias: the color of a cursor or a note comes from here. */
  profiles?: Record<string, PlayerProfile>;
  /** The player being pointed out for a moment: their cursor and notes stand out. */
  highlightedAlias?: string | null;
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
  notesGrid = {},
  completedNumbers = new Set<number>(),
  profiles = {},
  highlightedAlias = null
}: SudokuBoardUIProps) {

  // A player who is not in the list (a note by somebody who left before you came) gets the color of the theme.
  // The list comes from the server and an alias is a key of it: only a key it really has counts.
  const styleOf = (alias: string) => (Object.hasOwn(profiles, alias) ? styleOfColor(profiles[alias].color) : UNKNOWN_PLAYER_STYLE);

  const isCellInitial = (r: number, c: number) => board.initial[r][c] !== 0;
  const isCellSelected = (r: number, c: number) => selectedCell?.[0] === r && selectedCell?.[1] === c;
  const isCellEmpty = (r: number, c: number) => playerGrid[r][c] === 0;

  const shouldDisplayError = (r: number, c: number, value: number): boolean => {
    if (isCellInitial(r, c)) return false;
    if (isCellEmpty(r, c)) return false;
    if (settings.godMode && value !== board.solution[r][c]) return true;
    if (!settings.showErrors) return false;
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
    if (isSelected) return 'bg-[var(--cell-background-selected)]';
    if (showSameNumbers) return 'bg-[var(--cell-background-selected)]';
    if (showCrosshair) return 'bg-[var(--cell-background-highlight)]';
    if (isInitial) return 'bg-[var(--cell-background-initial)]';
    return 'bg-[var(--cell-background)] hover:bg-[var(--cell-background-initial)]';
  };

  const resolveTextClass = (
    value: number,
    isInitial: boolean,
    isError: boolean
  ): string => {
    if (value === 0) return 'text-transparent';
    if (isInitial) return 'text-[var(--number-initial)] font-bold';
    if (isError) return 'text-[var(--number-error)] font-bold';
    return 'text-[var(--number-player)] font-medium';
  };

  const cellOccupantsMap = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(othersSelections).forEach(([alias, [r, c]]) => {
      map.set(`${r}-${c}`, alias);
    });
    return map;
  }, [othersSelections]);

  return (
    <div className="relative w-full aspect-square">
      <div
        className={cn(
          "w-full h-full grid overflow-hidden rounded-2xl transition-colors duration-300",
          "border-4 border-[var(--grid-border-outer)] shadow-[var(--shadow-paper)]"
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
              const style = styleOf(occupantId);
              const pointedOut = occupantId === highlightedAlias;
              const tintClass = selected ? '' : style.tint;
              ringClass = cn('ring-inset z-10', pointedOut ? 'ring-8 motion-safe:animate-pulse' : 'ring-4', style.ring, tintClass);
            }

            // Outline, not ring: it can sit next to the ring of another player on the same cell
            const outlineClass = selected ? 'outline-2 -outline-offset-2 outline-[var(--number-player)]/70' : '';

            const finalBgClass = cn(bgClass, ringClass, outlineClass);

            const rawNotes = notesGrid[`${rIndex}-${cIndex}`];
            let parsedNotes: Record<number, string> | undefined;

            if (rawNotes) {
              parsedNotes = {};
              for (const [noteVal, pid] of Object.entries(rawNotes)) {
                const note = Number(noteVal);
                if (completedNumbers.has(note) || isErrorPlacement(rIndex, cIndex, note)) continue;
                parsedNotes[note] = cn(styleOf(pid).text, pid === highlightedAlias && 'font-black motion-safe:animate-pulse');
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