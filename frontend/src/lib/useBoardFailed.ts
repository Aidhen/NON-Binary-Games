'use client';
import { useEffect, useState } from 'react';
import { getSocket } from './socket';

/** How long the notice stays: long enough to read, and it goes away by itself. */
export const BOARD_FAILED_NOTICE_MS = 6000;

/**
 * Whether to show that the server could not make a board (see `board-failed`). Nothing changed in the room,
 * so it is only a notice that invites to try again, and it fades after a while.
 */
export function useBoardFailed(): boolean {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onFailed = () => {
      setShown(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShown(false), BOARD_FAILED_NOTICE_MS);
    };
    socket.on('board-failed', onFailed);
    return () => {
      socket.off('board-failed', onFailed);
      clearTimeout(timer);
    };
  }, []);

  return shown;
}
