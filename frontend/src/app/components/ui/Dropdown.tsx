'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface DropdownOption<T extends string> {
    value: T;
    label: string;
}

interface DropdownProps<T extends string> {
    value: T;
    options: DropdownOption<T>[];
    onChange: (value: T) => void;
    className?: string;
}

export function Dropdown<T extends string>({ 
    value, 
    options, 
    onChange,
    className
}: DropdownProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentLabel = options.find(opt => opt.value === value)?.label || value;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val: T) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "p-2 rounded-md shadow-sm text-left flex items-center justify-between gap-3",
                    "bg-[var(--numpad-background)] text-[var(--numpad-text)] font-medium capitalize",
                    "border border-[var(--grid-border-inner)]",
                    "cursor-pointer outline-none transition-all duration-300",
                    "focus:ring-2 focus:ring-blue-500",
                    className
                )}
            >
                {currentLabel}
                <span className={cn(
                    "text-xs opacity-50 transition-transform duration-200",
                    isOpen ? "rotate-180" : "rotate-0"
                )}>
                    ▼
                </span>
            </button>

            {isOpen && (
                <div className={cn(
                    "absolute top-full right-0 mt-1 w-full min-w-[120px] z-50",
                    "bg-[var(--cell-background)] border border-[var(--grid-border-outer)] rounded-md shadow-xl",
                    "flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                )}>
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => handleSelect(opt.value)}
                            className={cn(
                                "p-2 text-left text-sm font-medium transition-colors capitalize",
                                value === opt.value 
                                    ? "bg-[var(--numpad-background)] text-[var(--numpad-text)]" 
                                    : "text-[var(--subtitle-text)] hover:bg-[var(--cell-background-highlight)] hover:text-[var(--title-text)]"
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}