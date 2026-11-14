'use client';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';

export const COPIED_MS = 2000;

/**
 * Copies the address of the page: the link of the room is what lets the others in. One tap, and the button
 * says that it worked for a moment.
 */
export function CopyLinkButton({ className }: Readonly<{ className?: string }>) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPIED_MS);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      type="button"
      onClick={copyInviteLink}
      className={cn(
        "shrink-0 cursor-pointer whitespace-nowrap rounded-[var(--radius-control)] px-3.5 py-2 text-sm font-bold",
        "bg-[var(--title-text)] text-[var(--paper)] transition-transform duration-150 active:translate-y-0.5 motion-reduce:transition-none",
        className
      )}
    >
      <span aria-live="polite">{copied ? `${t('sudoku.copied')}! ✨` : `${t('sudoku.copyLink')} 🔗`}</span>
    </button>
  );
}
