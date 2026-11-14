'use client';
import { EMOTES } from '@nbg/shared';
import type { Emote } from '@nbg/shared';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { cn } from '@/lib/utils';

interface EmoteBarProps {
  onSend: (emote: Emote) => void;
  disabled?: boolean;
}

export function EmoteBar({ onSend, disabled = false }: EmoteBarProps) {
  const { t } = useTranslation();

  return (
    <div role="group" aria-label={t('emotes.title')} className="grid w-full grid-cols-5 gap-2">
      {EMOTES.map((emote) => (
        <button
          key={emote}
          onClick={() => onSend(emote)}
          disabled={disabled}
          className={cn(
            "h-10 cursor-pointer rounded-[var(--radius-control)] text-xl transition-transform motion-reduce:transition-none",
            "bg-[var(--numpad-background)] hover:bg-[var(--numpad-hover)] active:scale-90",
            "disabled:cursor-not-allowed"
          )}
        >
          {emote}
        </button>
      ))}
    </div>
  );
}
