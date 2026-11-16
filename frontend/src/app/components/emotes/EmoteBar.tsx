'use client';
import { useState } from 'react';
import { EMOTE_PAGES } from '@nbg/shared';
import type { Emote } from '@nbg/shared';
import { EmoteArt } from '@nbg/art';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { cn } from '@/lib/utils';

interface EmoteBarProps {
  onSend: (emote: Emote) => void;
  disabled?: boolean;
}

const [FRONT_EMOTES, BACK_EMOTES] = EMOTE_PAGES;

// The buttons are 40 pixels tall: the drawing fills them without touching the edge.
const ART_SIZE = 30;

const FACE_CLASSES = cn(
  "absolute inset-0 flex items-center justify-center rounded-[var(--radius-control)] backface-hidden",
  "bg-[var(--numpad-background)] group-hover:bg-[var(--numpad-hover)]"
);

export function EmoteBar({ onSend, disabled = false }: Readonly<EmoteBarProps>) {
  const { t } = useTranslation();
  const [flipped, setFlipped] = useState(false);

  return (
    <div role="group" aria-label={t('emotes.title')} className="grid w-full grid-cols-5 gap-2">
      {FRONT_EMOTES.map((emote, index) => (
        <button
          key={emote}
          onClick={() => onSend(flipped ? BACK_EMOTES[index] : emote)}
          disabled={disabled}
          // The drawings are decoration: the button is named after the emoji it sends, which every screen reader can say.
          aria-label={flipped ? BACK_EMOTES[index] : emote}
          className={cn(
            "group h-10 cursor-pointer text-xl perspective-midrange transition-transform motion-reduce:transition-none",
            "active:scale-90 disabled:cursor-not-allowed"
          )}
        >
          {/* The card turns inside the button, so the press feedback of the button is not delayed by the wave. */}
          <span
            style={{ transitionDelay: `${index * 25}ms` }}
            className={cn(
              "relative block h-full w-full transform-3d transition-transform duration-300 motion-reduce:transition-none",
              flipped && "rotate-y-180"
            )}
          >
            <span className={FACE_CLASSES}><EmoteArt emote={emote} size={ART_SIZE} /></span>
            <span className={cn(FACE_CLASSES, "rotate-y-180")}><EmoteArt emote={BACK_EMOTES[index]} size={ART_SIZE} /></span>
          </span>
        </button>
      ))}
      <button
        onClick={() => setFlipped((current) => !current)}
        aria-label={t('emotes.more')}
        aria-pressed={flipped}
        className={cn(
          "flex h-10 cursor-pointer items-center justify-center rounded-[var(--radius-control)] transition-transform motion-reduce:transition-none",
          "bg-[var(--numpad-background)] hover:bg-[var(--numpad-hover)] active:scale-90"
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={cn("h-5 w-5 transition-transform duration-300 motion-reduce:transition-none", flipped && "rotate-180")}
        >
          <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
          <path d="M3 21v-5h5" />
        </svg>
      </button>
    </div>
  );
}
