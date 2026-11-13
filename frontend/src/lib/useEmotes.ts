'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { EMOTE_COOLDOWN_MS } from '@nbg/shared';
import type { Emote } from '@nbg/shared';
import { getSocket } from '@/lib/socket';

export const EMOTE_LIFETIME_MS = 2500;
// Safety net: a crowded room must not fill the screen (and the DOM) with emojis.
export const MAX_FLOATING_EMOTES = 20;

export interface FloatingEmote {
  id: number;
  emote: Emote;
  // Horizontal position in %, random so that emotes sent together do not overlap.
  left: number;
}

export function useEmotes() {
  const [emotes, setEmotes] = useState<FloatingEmote[]>([]);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const nextId = useRef(0);
  const coolingDown = useRef(false);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const later = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      callback();
    }, delay);
    timers.current.add(timer);
  }, []);

  const show = useCallback((emote: Emote) => {
    const id = nextId.current++;
    const left = 10 + Math.random() * 80;

    setEmotes((current) => [...current, { id, emote, left }].slice(-MAX_FLOATING_EMOTES));
    later(() => setEmotes((current) => current.filter((floating) => floating.id !== id)), EMOTE_LIFETIME_MS);
  }, [later]);

  useEffect(() => {
    const socket = getSocket();
    const onEmote = ({ emote }: { alias: string; emote: Emote }) => show(emote);
    const pending = timers.current;

    socket.on('emote-received', onEmote);
    return () => {
      socket.off('emote-received', onEmote);
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, [show]);

  const sendEmote = useCallback((emote: Emote) => {
    const socket = getSocket();
    // A disconnected socket would buffer the emote and send it long after the moment has passed.
    if (coolingDown.current || !socket.connected) return;

    coolingDown.current = true;
    setIsCoolingDown(true);
    later(() => {
      coolingDown.current = false;
      setIsCoolingDown(false);
    }, EMOTE_COOLDOWN_MS);

    socket.emit('send-emote', emote);
    show(emote);
  }, [later, show]);

  return { emotes, sendEmote, isCoolingDown };
}
