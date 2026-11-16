'use client';
import { EmoteArt } from '@nbg/art';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { cn } from '@/lib/utils';
import { GAMES } from '../components/games/registry';
import { Page } from '../components/site/Page';
import { BAND, BODY, BUTTON_PRIMARY, CARD, HEADING, PILL } from '../components/site/styles';

const KINDS = [
  { key: 'feedback.kindBug', emote: '😓' },
  { key: 'feedback.kindIdea', emote: '🔥' },
  { key: 'feedback.kindOther', emote: '🤔' },
] as const;

const AFTER = ['after1', 'after2', 'after3'] as const;

const PLAYABLE_GAMES = GAMES.filter((game) => game.status === 'available');

const FIELD = "min-h-12 w-full rounded-[var(--radius-control)] bg-[var(--paper-well)] px-3.5 py-2.5 text-base text-[var(--title-text)] placeholder:text-[var(--subtitle-text)]";
const LABEL = "mb-1.5 block text-sm font-bold text-[var(--title-text)]";

/**
 * The feedback form, as it will be. It is switched off on purpose: nothing typed here goes anywhere, so
 * every field is disabled and the page says so first. When the form is connected, the fieldset is what to
 * enable; the contact field collects personal data and needs its own decision before that (see CLAUDE.md).
 */
export default function FeedbackPage() {
  const { t } = useTranslation();

  return (
    <Page title={t('feedback.title')} lead={t('feedback.lead')}>
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <p role="status" className={cn(BAND, "flex flex-wrap items-center gap-3 p-4 text-base font-medium text-[var(--title-text)]")}>
            <span className={PILL}>{t('feedback.wip')}</span>
            <span className="min-w-0 flex-1 basis-60">{t('feedback.wipText')}</span>
          </p>

          <form onSubmit={(event) => event.preventDefault()} className={cn(CARD, "p-5 sm:p-7")}>
            <fieldset disabled className="flex min-w-0 flex-col gap-5 opacity-60">
              <fieldset className="min-w-0">
                <legend className={LABEL}>{t('feedback.kind')}</legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  {KINDS.map(({ key, emote }, index) => (
                    <label key={key} className="flex min-h-14 items-center gap-2.5 rounded-[var(--radius-control)] bg-[var(--paper-well)] px-3 py-2 text-sm font-bold text-[var(--title-text)]">
                      <input type="radio" name="kind" defaultChecked={index === 0} className="size-4 accent-[var(--accent)]" />
                      <EmoteArt emote={emote} size={32} />
                      {t(key)}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div>
                <label htmlFor="feedback-about" className={LABEL}>{t('feedback.about')}</label>
                <select id="feedback-about" className={FIELD}>
                  <option>{t('feedback.aboutAll')}</option>
                  {PLAYABLE_GAMES.map((game) => <option key={game.id}>{t(game.titleKey)}</option>)}
                  <option>{t('feedback.aboutRooms')}</option>
                </select>
              </div>
              <div>
                <label htmlFor="feedback-headline" className={LABEL}>{t('feedback.headline')}</label>
                <input id="feedback-headline" type="text" placeholder={t('feedback.headlinePlaceholder')} className={FIELD} />
              </div>
              <div>
                <label htmlFor="feedback-details" className={LABEL}>{t('feedback.details')}</label>
                <textarea id="feedback-details" rows={6} placeholder={t('feedback.detailsPlaceholder')} className={FIELD} />
              </div>
              <div>
                <label htmlFor="feedback-contact" className={LABEL}>
                  {t('feedback.contact')} <span className="font-medium text-[var(--subtitle-text)]">({t('feedback.optional')})</span>
                </label>
                <input id="feedback-contact" type="email" placeholder={t('feedback.contactPlaceholder')} className={FIELD} />
              </div>
              <div>
                <button type="submit" className={cn(BUTTON_PRIMARY, "cursor-not-allowed")}>{t('feedback.send')}</button>
              </div>
            </fieldset>
          </form>
        </div>

        <aside aria-labelledby="feedback-after" className={cn(BAND, "flex flex-col gap-4 p-5 sm:p-6")}>
          <h2 id="feedback-after" className={cn(HEADING, "text-2xl")}>{t('feedback.afterTitle')}</h2>
          {AFTER.map((item) => (
            <div key={item}>
              <h3 className={cn(HEADING, "text-lg")}>{t(`feedback.${item}Title`)}</h3>
              <p className={cn(BODY, "text-sm")}>{t(`feedback.${item}Text`)}</p>
            </div>
          ))}
          <div className="flex justify-center">
            <EmoteArt emote="🙏" size={104} />
          </div>
        </aside>
      </div>
    </Page>
  );
}
