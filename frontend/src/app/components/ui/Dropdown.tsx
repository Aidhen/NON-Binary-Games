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
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "px-3 py-2 rounded-[var(--radius-control)] text-left text-sm whitespace-nowrap flex items-center justify-between gap-2",
          "bg-[var(--paper)] text-[var(--title-text)] font-bold capitalize",
          "shadow-[var(--shadow-paper-sm)]",
          "cursor-pointer transition-colors duration-300",
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
          "bg-[var(--paper)] rounded-[var(--radius-control)] shadow-[var(--shadow-paper)]",
          "flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        )}>
          {options.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "cursor-pointer px-3 py-2 text-left text-sm font-bold transition-colors capitalize",
                value === opt.value
                  ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                  : "text-[var(--subtitle-text)] hover:bg-[var(--paper-well)] hover:text-[var(--title-text)]"
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