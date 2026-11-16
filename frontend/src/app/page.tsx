'use client';

import { useEffect } from 'react';
import { LogoMark } from '@nbg/art';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { useNewRoom } from '@/lib/useNewRoom';
import { cn } from '@/lib/utils';
import { warmUpServer } from '@/lib/warmUp';
import { EmoteShowcase } from './components/emotes/EmoteShowcase';
import { GameShelf } from './components/games/GameShelf';
import { BAND, BODY, BUTTON_PRIMARY, CARD, HEADING } from './components/site/styles';

const STEPS = ['step1', 'step2', 'step3'] as const;

// The home says what the site is and opens a room when asked. Whoever received a link never sees it: the
// link leads straight to the table.
export default function Home() {
  const { t } = useTranslation();
  const openNewRoom = useNewRoom();

  // The server may be asleep: it starts waking up while the player reads the page.
  useEffect(() => warmUpServer(), []);

  return (
    <div className="mb-auto flex w-full max-w-5xl flex-col gap-10 px-4 pb-12 pt-2 sm:px-8">
      <section className="flex flex-wrap items-center justify-between gap-x-12 gap-y-8">
        <div className="flex min-w-0 max-w-xl flex-1 basis-96 flex-col items-start gap-5">
          <h1 className={cn(HEADING, "text-5xl sm:text-6xl")}>
            {t('home.titleStart')}{' '}
            <span className="relative inline-block whitespace-nowrap text-[var(--logo-non)]">
              {t('home.titleAccent')}
              {/* One stroke of a marker under the words, stretched to their width. */}
              <svg aria-hidden="true" viewBox="0 0 100 10" preserveAspectRatio="none" className="absolute -bottom-1.5 left-0 h-2.5 w-full">
                <path d="M2 6 Q14 1 26 5 T50 5 T74 5 T98 4" fill="none" strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ stroke: 'var(--logo-sparkle)' }} />
              </svg>
            </span>.
          </h1>
          <p className={cn(BODY, "text-lg")}>{t('home.lead')}</p>
          <button type="button" onClick={openNewRoom} className={BUTTON_PRIMARY}>{t('home.create')}</button>
          <p className={cn(BODY, "text-sm")}>{t('home.gotLink')}</p>
        </div>
        {/* On a phone the large logo would only push the page down: the small one in the header is enough. */}
        <div className="hidden shrink-0 md:block">
          <LogoMark size={320} cheeks sparkle />
        </div>
      </section>

      <section className={cn(BAND, "grid gap-x-10 gap-y-8 p-5 sm:p-7 md:grid-cols-[3fr_2fr]")}>
        <div className="flex min-w-0 flex-col gap-3">
          <h2 className={cn(HEADING, "text-3xl")}>{t('home.howTitle')}</h2>
          <ol className="flex flex-col gap-3">
            {STEPS.map((step, index) => (
              <li key={step} className={cn(CARD, "flex items-start gap-3 px-4 py-3")}>
                <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-[var(--cutout-2)] font-display text-lg font-extrabold text-[var(--title-text)]">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className={cn(HEADING, "text-lg")}>{t(`home.${step}Title`)}</h3>
                  <p className={cn(BODY, "text-sm")}>{t(`home.${step}Text`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <div>
            <h2 className={cn(HEADING, "text-3xl")}>{t('home.emotesTitle')}</h2>
            <p className={cn(BODY, "text-sm")}>{t('home.emotesText')}</p>
          </div>
          <EmoteShowcase />
        </div>
      </section>

      <section aria-labelledby="games-title" className="flex flex-col gap-3">
        <div>
          <h2 id="games-title" className={cn(HEADING, "text-3xl")}>{t('home.gamesTitle')}</h2>
          <p className={cn(BODY, "text-sm")}>{t('home.gamesHint')}</p>
        </div>
        <GameShelf />
      </section>
    </div>
  );
}
