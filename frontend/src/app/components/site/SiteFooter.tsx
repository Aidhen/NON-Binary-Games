'use client';
import Link from 'next/link';
import { useFocusMode } from '@/lib/focusMode';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { BODY } from './styles';

// Set when the site is built (see next.config.ts).
const VERSION = process.env.NEXT_PUBLIC_APP_VERSION;

export const REPOSITORY_URL = 'https://github.com/Aidhen/NON-Binary-Games';

// The profiles do not exist yet: the three marks keep their place, greyed out, and lead nowhere.
const SOCIALS = [
  { name: 'Instagram', mark: 'IG' },
  { name: 'X', mark: 'X' },
  { name: 'TikTok', mark: 'TT' },
] as const;

export function SiteFooter() {
  const { t } = useTranslation();
  const focused = useFocusMode();

  // Out of the way while a game is open.
  if (focused) return null;

  return (
    <footer className="mt-10 w-full bg-[var(--paper-well)]">
      <div className={`mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-6 text-sm sm:px-8 ${BODY}`}>
        <p>(non)BinaryGames{VERSION && ` · v${VERSION}`} · {t('footer.tagline')}</p>
        <div className="flex flex-wrap items-center gap-5">
          <Link href="/feedback" className="font-bold text-[var(--title-text)] underline">{t('nav.feedback')}</Link>
          <Link href="/privacy" className="font-bold text-[var(--title-text)] underline">{t('footer.privacy')}</Link>
          {/* noreferrer: the address of a room must not travel to another site (see securityHeaders.ts). */}
          <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-[var(--title-text)] underline">{t('footer.github')}</a>
          <span role="img" aria-label={t('footer.social')} className="flex gap-2">
            {SOCIALS.map(({ name, mark }) => (
              <span
                key={name}
                aria-hidden="true"
                title={name}
                className="flex size-9 items-center justify-center rounded-[var(--radius-control)] bg-[var(--paper)] text-xs font-extrabold opacity-60"
              >
                {mark}
              </span>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
