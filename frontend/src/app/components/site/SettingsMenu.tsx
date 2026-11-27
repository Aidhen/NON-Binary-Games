'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { LanguageSelector } from '../ui/LanguageSelector';
import { ThemeSelector } from '../ui/ThemeSelector';

/**
 * Theme and language behind one small button, for a phone, where two wide dropdowns would take a row of the
 * screen that a game needs. The panel opens under the button and closes on Escape or a tap outside.
 */
export function SettingsMenu() {
  const { t } = useTranslation();
  const panelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      // An open dropdown inside the panel takes the first Escape for itself (see Dropdown).
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      setIsOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={t('settings.label')}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        className="flex size-11 cursor-pointer items-center justify-center rounded-[var(--radius-control)] bg-[var(--paper)] font-display text-base font-extrabold text-[var(--title-text)] shadow-[var(--shadow-paper-sm)]"
      >
        <span aria-hidden="true">Aa</span>
      </button>
      {isOpen && (
        <div id={panelId} className="absolute right-0 top-full z-50 mt-2 flex w-44 flex-col gap-2 rounded-[var(--radius-paper)] bg-[var(--paper-well)] p-3 shadow-[var(--shadow-paper)]">
          <ThemeSelector />
          <LanguageSelector />
        </div>
      )}
    </div>
  );
}
