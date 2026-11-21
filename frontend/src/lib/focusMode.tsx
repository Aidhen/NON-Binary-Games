'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface FocusModeValue {
  focused: boolean;
  setFocused: (focused: boolean) => void;
}

const FocusModeContext = createContext<FocusModeValue>({ focused: false, setFocused: () => {} });

/**
 * Whether a game is open on this page. While it is, the site keeps out of the way: the header shows only the
 * logo and the two choices that are still useful in a game (theme and language), and the footer goes.
 */
export function FocusModeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [focused, setFocused] = useState(false);
  const value = useMemo(() => ({ focused, setFocused }), [focused]);
  return <FocusModeContext.Provider value={value}>{children}</FocusModeContext.Provider>;
}

export const useFocusMode = (): boolean => useContext(FocusModeContext).focused;

/** Turns the focus mode on while `active` is true, and off again when it stops being true or the page goes. */
export function useFocusModeWhile(active: boolean) {
  const { setFocused } = useContext(FocusModeContext);
  useEffect(() => {
    if (!active) return;
    setFocused(true);
    return () => setFocused(false);
  }, [active, setFocused]);
}
