'use client';
import { cn } from '@/lib/utils'; // Assicurati che l'alias @ funzioni, altrimenti usa percorsi relativi come '../../lib/utils'

interface SudokuCellProps {
    value: number;
    bgClass: string;
    textClass: string;
    isRightBorder: boolean;
    isBottomBorder: boolean;
    onClick: () => void;
}

export function SudokuCell({ 
    value, 
    bgClass, 
    textClass, 
    isRightBorder, 
    isBottomBorder, 
    onClick 
}: SudokuCellProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center justify-center text-2xl",
                "cursor-pointer select-none",
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
        </div>
    );
}