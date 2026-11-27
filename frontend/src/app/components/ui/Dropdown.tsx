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
  /** What the choice is about ("Theme"): with the current value it names the button for a screen reader. */
  label: string;
  className?: string;
}

export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  label,
  className
}: Readonly<DropdownProps<T>>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  // Escape closes the list and puts the focus back on the button, where the keyboard player was. It is heard in the
  // capture phase and marked as handled, so that a panel around the dropdown (SettingsMenu) does not close with it.
  useEffect(() => {
    if (!isOpen) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    }
    document.addEventListener('keydown', handleEscape, true);
    return () => document.removeEventListener('keydown', handleEscape, true);
  }, [isOpen]);

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${label}: ${currentLabel}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "px-3 py-2 rounded-[var(--radius-control)] text-left text-sm whitespace-nowrap flex items-center justify-between gap-2",
          "bg-[var(--paper)] text-[var(--number-initial)] font-bold capitalize",
          "shadow-[var(--shadow-paper-sm)]",
          "cursor-pointer transition-colors duration-300",
          className
        )}
      >
        {currentLabel}
        <span aria-hidden="true" className={cn(
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
              aria-current={value === opt.value ? 'true' : undefined}
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