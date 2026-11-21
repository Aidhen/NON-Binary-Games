'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { EMOTES } from '@nbg/shared';
import type { Emote } from '@nbg/shared';
import { EmoteArt } from '@nbg/art';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { EMOTE_LIFETIME_MS, MAX_FLOATING_EMOTES } from '@/lib/useEmotes';
import type { FloatingEmote } from '@/lib/useEmotes';
import { EmoteOverlay } from './EmoteOverlay';

// Six emotes per row, on every screen. The showcase only has full rows: emotes that would not fill the last one are left out.
export const EMOTES_PER_ROW = 6;
export const SHOWN_EMOTES = EMOTES.slice(0, EMOTES.length - (EMOTES.length % EMOTES_PER_ROW));

/**
 * The emotes of the home page, to try out: a tap sends one floating up the screen, like in a game. Only on this
 * screen: there is no room here, so nothing goes to the server and nobody else sees it.
 */
export function EmoteShowcase() {
  const { t } = useTranslation();
  const [emotes, setEmotes] = useState<FloatingEmote[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const show = useCallback((emote: Emote) => {
    const id = nextId.current++;
    const left = 10 + Math.random() * 80;
    // The same bound as in a game: tapping fast must not fill the screen (and the page) with emotes.
    setEmotes((current) => [...current, { id, emote, left }].slice(-MAX_FLOATING_EMOTES));
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setEmotes((current) => current.filter((floating) => floating.id !== id));
    }, EMOTE_LIFETIME_MS);
    timers.current.add(timer);
  }, []);

  return (
    <>
      <fieldset aria-label={t('emotes.title')} data-testid="emote-showcase" className="m-0 grid min-w-0 max-w-md grid-cols-6 gap-2 border-0 p-0">
        {SHOWN_EMOTES.map((emote) => (
          <button
            key={emote}
            type="button"
            aria-label={emote}
            onClick={() => show(emote)}
            className="flex aspect-square cursor-pointer items-center justify-center rounded-[var(--radius-control)] bg-[var(--paper)] shadow-[var(--shadow-paper-sm)] transition-transform duration-150 active:translate-y-0.5 motion-reduce:transition-none"
          >
            <EmoteArt emote={emote} size={36} className="h-auto w-3/4" />
          </button>
        ))}
      </fieldset>
      <EmoteOverlay emotes={emotes} />
    </>
  );
}
