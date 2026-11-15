import { cn } from '@/lib/utils';

interface SettingToggleProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  /** The option is shown but cannot be changed right now. */
  disabled?: boolean;
}

/** One option of a game that is on or off: its name on the left, the box on the right, and the whole row takes the click. */
export function SettingToggle({ label, checked, onChange, disabled = false }: Readonly<SettingToggleProps>) {
  return (
    <label className={cn("flex items-center justify-between group", disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer")}>
      <span className="text-[var(--title-text)] font-medium text-sm group-hover:opacity-80 transition-opacity">
        {label}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="w-4 h-4 cursor-pointer accent-[var(--number-player)] disabled:cursor-not-allowed"
      />
    </label>
  );
}
