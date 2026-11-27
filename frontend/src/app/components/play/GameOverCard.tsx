'use client';
import { LogoMark } from '@nbg/art';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';

interface GameOverCardProps {
  title: string;
  message: string;
  onPlayAgain: () => void;
  /** Casts the vote to go back to the table, like the button above the game does. Without it the card has no such button. */
  onBackToTable?: () => void;
  /** On by default: the card covers the board. Off, the card is a block of the page (under the board), for a game whose board has something to show once it is over. */
  overlay?: boolean;
}

/** What covers the board when a game is over: how it went, and the buttons to start another one or to go back to the table. */
export function GameOverCard({ title, message, onPlayAgain, onBackToTable, overlay = true }: Readonly<GameOverCardProps>) {
  const { t } = useTranslation();

  const card = (
    <div className={cn("flex flex-col items-center p-8 text-center rounded-[var(--radius-paper)]", "bg-[var(--paper)] shadow-[var(--shadow-paper)]", !overlay && "w-full")}>
      <div className="relative mb-2">
        <LogoMark size={56} />
        {/* Pops once and stays: it is a small joy, not an alert. */}
        <span aria-hidden="true" className="absolute -right-3 -top-2 text-xl leading-none motion-safe:animate-pop">✨</span>
      </div>
      <h2 className="font-display text-3xl font-extrabold text-[var(--title-text)] mb-2">{title}</h2>
      <p className="text-[var(--subtitle-text)] mb-6 font-medium">{message}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onPlayAgain}
          className={cn(
            "cursor-pointer px-6 py-3 rounded-[var(--radius-control)] font-display text-lg font-extrabold",
            "bg-[var(--accent)] text-[var(--accent-ink)] shadow-[var(--shadow-paper-sm)]",
            "transition-transform duration-150 motion-reduce:transition-none active:translate-y-0.5 active:shadow-none"
          )}
        >
          {t('sudoku.playAgain')}
        </button>
        {onBackToTable && (
          <button
            onClick={onBackToTable}
            className={cn(
              "cursor-pointer px-6 py-3 rounded-[var(--radius-control)] font-display text-lg font-extrabold",
              "bg-[var(--paper-well)] text-[var(--title-text)] shadow-[var(--shadow-paper-sm)]",
              "transition-transform duration-150 motion-reduce:transition-none active:translate-y-0.5 active:shadow-none"
            )}
          >
            {t('lobby.backToTable')}
          </button>
        )}
      </div>
    </div>
  );

  if (!overlay) return card;

  return (
    <div className={cn("absolute inset-0 z-20 rounded-2xl", "flex flex-col items-center justify-center", "bg-black/60 backdrop-blur-sm transition-all duration-500")}>
      {card}
    </div>
  );
}
