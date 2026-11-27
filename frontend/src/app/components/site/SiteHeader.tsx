'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoMark } from '@nbg/art';
import { useFocusMode } from '@/lib/focusMode';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { cn } from '@/lib/utils';
import { SettingsMenu } from './SettingsMenu';
import { LanguageSelector } from '../ui/LanguageSelector';
import { ThemeSelector } from '../ui/ThemeSelector';

export const NAV_LINKS = [
  { href: '/rooms', labelKey: 'nav.rooms' },
  { href: '/diary', labelKey: 'nav.diary' },
  { href: '/feedback', labelKey: 'nav.feedback' },
] as const;

/**
 * The top of every page: the logo (which leads home), the pages of the site, and the two choices that are
 * always at hand, theme and language (on a phone, behind one button). On a phone the pages go on a row of their own. While a game is open the
 * pages are left out, so that the board comes first.
 */
export function SiteHeader() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const focused = useFocusMode();

  return (
    <header className={cn(
        "mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 sm:px-8 sm:py-6",
        // In a game the header is only the logo and the settings: a phone gets the rows back for the board.
        focused ? "px-4 py-2" : "p-4"
      )}>
      <Link href="/" aria-label={t('nav.home')} className="flex min-w-0 items-center gap-2">
        <LogoMark size={focused ? 36 : 44} />
        <span className="truncate font-display text-xl leading-none sm:text-2xl">
          <span className="font-medium text-[var(--logo-non)]">(non)</span>
          <span className="font-extrabold text-[var(--title-text)]">Binary</span>
          <span className="font-extrabold text-[var(--logo-games)]">Games</span>
        </span>
      </Link>
      {!focused && (
        <nav aria-label={t('nav.label')} className="order-last flex w-full flex-wrap gap-x-1 md:order-none md:w-auto">
          {NAV_LINKS.map(({ href, labelKey }) => {
            const current = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  "flex min-h-11 items-center border-b-[3px] border-transparent px-3 text-base text-[var(--title-text)]",
                  current ? "border-[var(--accent)] font-extrabold" : "font-medium"
                )}
              >
                {t(labelKey)}
              </Link>
            );
          })}
        </nav>
      )}
      {/* On a phone the two choices share one small button: the screen is better spent on the game. */}
      <div className="hidden items-center gap-2 sm:flex">
        <ThemeSelector />
        <LanguageSelector />
      </div>
      <div className="sm:hidden">
        <SettingsMenu />
      </div>
    </header>
  );
}
