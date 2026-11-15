'use client';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';

interface GameOverCardProps {
  title: string;
  message: string;
  onPlayAgain: () => void;
}

/** What covers the board when a game is over: how it went, and the button to start another one. */
export function GameOverCard({ title, message, onPlayAgain }: Readonly<GameOverCardProps>) {
  const { t } = useTranslation();

  return (
    <div className={cn("absolute inset-0 z-20 rounded-2xl", "flex flex-col items-center justify-center", "bg-black/60 backdrop-blur-sm transition-all duration-500")}>
      <div className={cn("flex flex-col items-center p-8 text-center rounded-[var(--radius-paper)]", "bg-[var(--paper)] shadow-[var(--shadow-paper)]")}>
        <h2 className="font-display text-3xl font-extrabold text-[var(--title-text)] mb-2">{title}</h2>
        <p className="text-[var(--subtitle-text)] mb-6 font-medium">{message}</p>
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
      </div>
    </div>
  );
}
