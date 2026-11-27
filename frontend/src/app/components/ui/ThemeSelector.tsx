'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { Dropdown, DropdownOption } from './Dropdown';

const KNOWN_THEMES = ['light', 'dark', 'retro', 'oled', 'non-binary', 'system'];

export function ThemeSelector() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, themes } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn(
        "h-[42px] w-[110px] rounded-md",
        "bg-[var(--cell-background-initial)] border border-[var(--grid-border-inner)]",
        "motion-safe:animate-pulse"
      )} />
    );
  }

  // The name of a theme is a word of the page, not its id; a theme this page has no word for shows its id.
  const nameOf = (id: string) => (KNOWN_THEMES.includes(id) ? t(`themes.${id}`) : id);
  const themeOptions: DropdownOption<string>[] = themes.map(id => ({
    value: id,
    label: nameOf(id)
  }));

  return (
    <Dropdown<string>
      value={theme || 'system'}
      options={themeOptions}
      onChange={setTheme}
      label={t('settings.theme')}
      className="min-w-[110px]"
    />
  );
}