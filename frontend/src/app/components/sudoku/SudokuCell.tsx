'use client';
import { cn } from '@/lib/utils';

interface SudokuCellProps {
    value: number;
    bgClass: string;
    textClass: string;
    isRightBorder: boolean;
    isBottomBorder: boolean;
    onClick: () => void;
    notes?: Record<number, string>;
    boardSize?: number;
    boxSize?: number;
}

export function SudokuCell({ 
    value, 
    bgClass, 
    textClass, 
    isRightBorder, 
    isBottomBorder, 
    onClick,
    notes,
    boardSize = 9,
    boxSize = 3
}: SudokuCellProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "relative flex items-center justify-center text-2xl",
                "cursor-pointer select-none overflow-hidden",
                "transition-colors duration-200",
                {
                    "border-r-2 border-r-[var(--grid-border-outer)]": isRightBorder,
                    "border-r border-r-[var(--grid-border-inner)]": !isRightBorder,
                    
                    "border-b-2 border-b-[var(--grid-border-outer)]": isBottomBorder,
                    "border-b border-b-[var(--grid-border-inner)]": !isBottomBorder,
                },
                bgClass,
                textClass
            )}
        >
            {value !== 0 ? value : ''}

            {value === 0 && notes && (
                <div 
                    className="absolute inset-0 grid w-full h-full pointer-events-none p-0.5"
                    style={{ 
                        gridTemplateColumns: `repeat(${boxSize}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${boxSize}, minmax(0, 1fr))`
                    }}
                >
                    {Array.from({ length: boardSize }, (_, i) => i + 1).map((num) => {
                        const colorClass = notes[num];
                        return (
                            <div 
                                key={num} 
                                className={cn(
                                    "flex items-center justify-center text-[0.6rem] sm:text-xs font-semibold leading-none",
                                    colorClass || "text-transparent"
                                )}
                            >
                                {colorClass ? num : ''}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}