import { cn } from '@/lib/utils';

/** A choice among a few, drawn as a button: the one that is picked is filled with the color of the player. */
export const optionClass = (isActive: boolean) => cn(
  "py-2 text-sm font-bold rounded-[var(--radius-control)] transition-colors",
  isActive
    ? "bg-[var(--number-player)] text-[var(--cell-background)]"
    : "bg-[var(--numpad-background)] text-[var(--numpad-text)] hover:bg-[var(--numpad-hover)]"
);
