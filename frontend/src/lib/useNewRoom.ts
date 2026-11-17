import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Opens a new room. The room only exists on the server once this browser joins it, so "creating" one is
 * choosing an address nobody can guess and going there.
 */
export function useNewRoom() {
  const router = useRouter();
  return useCallback(() => router.push(`/play/${crypto.randomUUID()}`), [router]);
}
