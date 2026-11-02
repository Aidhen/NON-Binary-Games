'use client';
import { useCallback, useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';

export type ConnectionStatus = 'connecting' | 'waking' | 'connected' | 'failed';

// A sleeping free-tier server needs about a minute to wake up.
export const WAKING_AFTER_MS = 5000;
export const FAILED_AFTER_MS = 120000;

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    let wakingTimer: ReturnType<typeof setTimeout> | undefined;
    let failedTimer: ReturnType<typeof setTimeout> | undefined;

    const stopTimers = () => {
      clearTimeout(wakingTimer);
      clearTimeout(failedTimer);
    };

    const startWaiting = () => {
      stopTimers();
      setStatus('connecting');
      wakingTimer = setTimeout(() => setStatus('waking'), WAKING_AFTER_MS);
      failedTimer = setTimeout(() => setStatus('failed'), FAILED_AFTER_MS);
    };

    const onConnect = () => {
      stopTimers();
      setStatus('connected');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', startWaiting);

    if (socket.connected) onConnect();
    else startWaiting();

    return () => {
      stopTimers();
      socket.off('connect', onConnect);
      socket.off('disconnect', startWaiting);
    };
  }, [attempt]);

  // "failed" is only a message: the socket keeps retrying, so a late connection still flips the status.
  const retry = useCallback(() => {
    getSocket().connect();
    setAttempt((current) => current + 1);
  }, []);

  return { status, retry };
}
