'use client';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { cn } from '@/lib/utils';
import { Page } from '../components/site/Page';
import { BODY, CARD, HEADING } from '../components/site/styles';

const SECTIONS = ['browser', 'server', 'hosting', 'feedback'] as const;

export const HOSTING_POLICIES = [
  { name: 'Vercel', url: 'https://vercel.com/legal/privacy-policy' },
  { name: 'Render', url: 'https://render.com/privacy' },
] as const;

// What the site keeps, where and for how long. It has to say what the code really does: when something that
// is stored changes (the feedback form, an account, a new key in localStorage), this page changes with it.
export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <Page title={t('privacy.title')} lead={t('privacy.lead')}>
      <ul className="flex w-full max-w-3xl flex-col gap-4">
        {SECTIONS.map((section) => (
          <li key={section} className={cn(CARD, "p-5")}>
            <h2 className={cn(HEADING, "text-xl")}>{t(`privacy.${section}Title`)}</h2>
            <p className={cn(BODY, "text-sm")}>{t(`privacy.${section}Text`)}</p>
            {section === 'hosting' && (
              <p className={cn(BODY, "mt-2 flex flex-wrap gap-x-4 text-sm")}>
                {/* noreferrer: the address of a room must not travel to another site (see securityHeaders.ts). */}
                {HOSTING_POLICIES.map(({ name, url }) => (
                  <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="font-bold text-[var(--title-text)] underline">{name}</a>
                ))}
              </p>
            )}
          </li>
        ))}
      </ul>
      <p className={cn(BODY, "text-sm")}>{t('privacy.updated')}</p>
    </Page>
  );
}
