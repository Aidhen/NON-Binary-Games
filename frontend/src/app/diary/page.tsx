'use client';
import { useState } from 'react';
import { LogoMark } from '@nbg/art';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { cn } from '@/lib/utils';
import { DIARY, DIARY_TYPES } from '@/locales/diary';
import type { DiaryType } from '@/locales/diary';
import { Page } from '../components/site/Page';
import { BAND, BODY, CARD, HEADING, PILL } from '../components/site/styles';

const TYPE_LABEL: Record<DiaryType, string> = {
  upcoming: 'diary.upcoming',
  released: 'diary.released',
  'behind-the-scenes': 'diary.behindTheScenes',
};

// Newest first. Entries of the same day keep the order they have in the file.
const ENTRIES = [...DIARY].sort((a, b) => b.date.localeCompare(a.date));

const ABOUT = ['diary.about1', 'diary.about2', 'diary.about3'];

/**
 * What is coming, what came out and a few stories. The entries are closed until one is chosen, one at a
 * time: the page stays a list to scan. The box about who makes the game is always open, next to the list.
 */
export default function DiaryPage() {
  const { t, language } = useTranslation();
  const [filter, setFilter] = useState<DiaryType | 'all'>('all');
  const [open, setOpen] = useState<string | null>(null);

  const shown = ENTRIES.filter((entry) => filter === 'all' || entry.type === filter);
  const formatDate = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString(language, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });

  return (
    <Page title={t('diary.title')} lead={t('diary.lead')}>
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <div role="group" aria-label={t('diary.filter')} className="flex flex-wrap gap-2">
            {(['all', ...DIARY_TYPES] as const).map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={filter === type}
                onClick={() => setFilter(type)}
                className={cn(
                  "min-h-11 cursor-pointer rounded-full px-4 text-sm font-bold shadow-[var(--shadow-paper-sm)]",
                  filter === type ? "bg-[var(--title-text)] text-[var(--paper)]" : "bg-[var(--paper)] text-[var(--title-text)]"
                )}
              >
                {t(type === 'all' ? 'diary.all' : TYPE_LABEL[type])}
              </button>
            ))}
          </div>

          <ul className="flex flex-col gap-4">
            {shown.map((entry) => {
              const text = entry[language];
              const expanded = open === entry.id;
              return (
                <li key={entry.id} className={CARD}>
                  <h2>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={`diary-${entry.id}`}
                      onClick={() => setOpen(expanded ? null : entry.id)}
                      className="flex w-full cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--radius-paper)] px-5 py-4 text-left"
                    >
                      <span className={cn(PILL, "shrink-0")}>{t(TYPE_LABEL[entry.type])}</span>
                      <span className="flex min-w-0 flex-1 basis-60 flex-col">
                        <span className={cn(HEADING, "text-xl")}>{text.title}</span>
                        <span className={cn(BODY, "text-sm")}>{text.summary}</span>
                      </span>
                      <span className={cn(BODY, "shrink-0 text-xs")}>
                        {entry.version && `v${entry.version} · `}<time dateTime={entry.date}>{formatDate(entry.date)}</time>
                      </span>
                      <svg aria-hidden="true" viewBox="0 0 22 22" className={cn("size-5 shrink-0 transition-transform duration-200 motion-reduce:transition-none", expanded && "rotate-180")}>
                        <path d="M5 8 l6 6 l6 -6" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </h2>
                  {expanded && (
                    <div id={`diary-${entry.id}`} className="flex max-w-2xl flex-col gap-3 px-5 pb-5 text-base font-medium text-[var(--title-text)]">
                      {text.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <aside aria-labelledby="diary-about" className={cn(BAND, "flex flex-col gap-3 p-5 sm:p-6")}>
          <div className="flex items-center gap-3">
            <LogoMark size={56} />
            <h2 id="diary-about" className={cn(HEADING, "text-2xl")}>{t('diary.aboutTitle')}</h2>
          </div>
          {ABOUT.map((key) => <p key={key} className="text-base font-medium text-[var(--title-text)]">{t(key)}</p>)}
        </aside>
      </div>
    </Page>
  );
}
