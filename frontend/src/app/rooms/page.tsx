'use client';
import Link from 'next/link';
import { EmoteArt } from '@nbg/art';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { useNewRoom } from '@/lib/useNewRoom';
import { cn } from '@/lib/utils';
import { Page } from '../components/site/Page';
import { BAND, BODY, BUTTON_PRIMARY, CARD, HEADING, PILL } from '../components/site/styles';

const TODAY = ['private', 'noAccount', 'together'] as const;

// What a room is today, and what is being thought about for later. Public rooms do not exist yet: the page
// says so, and promises no date.
export default function RoomsPage() {
  const { t } = useTranslation();
  const openNewRoom = useNewRoom();

  return (
    <Page title={t('rooms.title')} lead={t('rooms.lead')}>
      <section className="flex flex-col items-start gap-4">
        <h2 className={cn(HEADING, "text-3xl")}>{t('rooms.todayTitle')}</h2>
        <ul className="grid w-full gap-4 md:grid-cols-3">
          {TODAY.map((item) => (
            <li key={item} className={cn(CARD, "p-5")}>
              <h3 className={cn(HEADING, "text-xl")}>{t(`rooms.${item}Title`)}</h3>
              <p className={cn(BODY, "text-sm")}>{t(`rooms.${item}Text`)}</p>
            </li>
          ))}
        </ul>
        <button type="button" onClick={openNewRoom} className={BUTTON_PRIMARY}>{t('home.create')}</button>
      </section>

      <section className={cn(BAND, "flex flex-col gap-4 p-5 sm:p-7")}>
        <div className="flex flex-wrap items-center gap-3">
          <span className={PILL}>{t('rooms.wip')}</span>
          <h2 className={cn(HEADING, "text-3xl")}>{t('rooms.publicTitle')}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <EmoteArt emote="🤔" size={88} />
          <p className="min-w-0 flex-1 basis-80 text-base font-medium text-[var(--title-text)] sm:text-lg">{t('rooms.publicText')}</p>
        </div>
        <p className={cn(BODY, "text-sm")}>
          {t('rooms.publicAsk')}{' '}
          <Link href="/feedback" className="font-bold text-[var(--title-text)] underline">{t('rooms.publicAskLink')}</Link>.
        </p>
      </section>
    </Page>
  );
}
