'use client';
import { useEffect, useRef, useState } from 'react';
import type { Emote } from '@nbg/shared';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { cn } from '@/lib/utils';
import { EmoteBar } from '../emotes/EmoteBar';
import type { MiniGameProps } from './types';

export const BLOB_REACTION_MS = 2000;

type Mood = 'idle' | 'happy' | 'surprised' | 'sad' | 'thinking';

const MOOD_BY_EMOTE: Record<Emote, Mood> = {
  '💜': 'happy',
  '❤️': 'happy',
  '😂': 'happy',
  '🌹': 'happy',
  '👏': 'happy',
  '🔥': 'surprised',
  '🤔': 'thinking',
  '😢': 'sad',
  '🪻': 'happy',
  '😎': 'happy',
};

const MOUTHS: Record<Mood, string> = {
  idle: "h-2 w-6 rounded-b-full border-b-4",
  happy: "h-4 w-9 rounded-b-full bg-current",
  surprised: "h-5 w-5 rounded-full bg-current",
  sad: "h-3 w-8 rounded-t-full border-t-4",
  thinking: "h-1 w-6 translate-x-2 rounded-full bg-current",
};

export function Blob({ onPlay }: MiniGameProps) {
  const { t } = useTranslation();
  const [mood, setMood] = useState<Mood>('idle');
  const [reaction, setReaction] = useState<Emote | null>(null);
  const [reactions, setReactions] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const feel = (nextMood: Mood, nextReaction: Emote | null) => {
    clearTimeout(timer.current);
    setMood(nextMood);
    setReaction(nextReaction);
    setReactions((current) => current + 1);
    timer.current = setTimeout(() => {
      setMood('idle');
      setReaction(null);
    }, BLOB_REACTION_MS);
    onPlay?.();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-32 w-40 items-end justify-center">
        {reaction && (
          <span key={`emote-${reactions}`} aria-hidden="true" className="absolute top-0 text-3xl motion-safe:animate-pop">
            {reaction}
          </span>
        )}
        <button onClick={() => feel('surprised', null)} aria-label={t('minigames.blob.poke')} className="rounded-[60%_40%_55%_45%/55%_60%_40%_45%]">
          <span
            key={`blob-${reactions}`}
            className={cn(
              "flex h-24 w-32 flex-col items-center justify-center gap-2 text-[var(--title-text)]",
              "rounded-[60%_40%_55%_45%/55%_60%_40%_45%] border-4 border-[var(--grid-border-outer)]",
              "bg-[var(--cell-background-selected)] motion-safe:animate-squish"
            )}
          >
            <span aria-hidden="true" className="flex gap-6">
              <span className="h-3 w-3 rounded-full bg-current" />
              <span className="h-3 w-3 rounded-full bg-current" />
            </span>
            <span aria-hidden="true" className={cn("border-current", MOUTHS[mood])} />
          </span>
        </button>
      </div>

      <p role="status" className="text-center text-sm font-medium text-[var(--subtitle-text)]">
        {t(`minigames.blob.${mood}`)}
      </p>

      <EmoteBar onSend={(emote) => feel(MOOD_BY_EMOTE[emote], emote)} />
    </div>
  );
}
