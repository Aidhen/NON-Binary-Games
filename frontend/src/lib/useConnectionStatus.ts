'use client';
import { useCallback, useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';

export type ConnectionStatus = 'connecting' | 'waking' | 'connected' | 'failed';

// A sleeping free-tier server needs about a minute to wake up.
export const WAKING_AFTER_MS = 5000;
export const FAILED_AFTER_MS = 120000;

// When the server refuses a connection on purpose (too many from one address) the socket does not try again by itself.
export const REFUSED_RETRY_BASE_MS = 3000;
export const REFUSED_RETRY_MAX_MS = 30000;

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    let wakingTimer: ReturnType<typeof setTimeout> | undefined;
    let failedTimer: ReturnType<typeof setTimeout> | undefined;
    let refusedTimer: ReturnType<typeof setTimeout> | undefined;
    let refusals = 0;

    const stopTimers = () => {
      clearTimeout(wakingTimer);
      clearTimeout(failedTimer);
    };

    // Later each time, and spread out, so that everyone who was refused does not come back at the same moment.
    const onConnectError = (error: Error) => {
      if (error.message !== 'too-many-connections') return;

      const wait = Math.min(REFUSED_RETRY_MAX_MS, REFUSED_RETRY_BASE_MS * 2 ** refusals++);
      clearTimeout(refusedTimer);
      refusedTimer = setTimeout(() => socket.connect(), wait * (0.75 + Math.random() * 0.5));
    };

    const startWaiting = () => {
      stopTimers();
      setStatus('connecting');
      wakingTimer = setTimeout(() => setStatus('waking'), WAKING_AFTER_MS);
      failedTimer = setTimeout(() => setStatus('failed'), FAILED_AFTER_MS);
    };

    const onConnect = () => {
      stopTimers();
      refusals = 0;
      setStatus('connected');
    };

    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('disconnect', startWaiting);

    if (socket.connected) onConnect();
    else startWaiting();

    return () => {
      stopTimers();
      clearTimeout(refusedTimer);
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
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
