'use client';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { EmoteArt } from '@nbg/art';
import { EMOTES, FEEDBACK_DEVICES, FEEDBACK_FREQUENCIES, FEEDBACK_RATINGS, FEEDBACK_WHAT, FEEDBACK_WHERE, FEEDBACK_WISHES } from '@nbg/shared';
import type { Emote, FeedbackArgs, FeedbackDevice, FeedbackFrequency, FeedbackWhat, FeedbackWhere, FeedbackWish } from '@nbg/shared';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { FEEDBACK_WAKING_AFTER_MS, sendFeedback } from '@/lib/sendFeedback';
import { cn } from '@/lib/utils';
import { Page } from '../components/site/Page';
import { BAND, BODY, BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, HEADING } from '../components/site/styles';

const KINDS = [
  { kind: 'bug', key: 'feedback.kindBug', emote: '😓' },
  { kind: 'opinion', key: 'feedback.kindOpinion', emote: '🤔' },
] as const;

// From "I don't like it" to "I love it", one drawing each.
const RATING_EMOTES = { 1: '😢', 2: '😶‍🌫️', 3: '😎', 4: '💜' } as const;

const AFTER = ['after1', 'after2', 'after3'] as const;

const FIELD = "min-h-12 w-full rounded-[var(--radius-control)] bg-[var(--paper-well)] px-3.5 py-2.5 text-base text-[var(--title-text)]";
const LABEL = "mb-1.5 block text-sm font-bold text-[var(--title-text)]";
// The choice is told by the radio itself and by the ring around it: not by color alone.
const OPTION = "flex min-h-12 cursor-pointer items-center gap-2.5 rounded-[var(--radius-control)] bg-[var(--paper-well)] px-3 py-2 text-sm font-bold text-[var(--title-text)] has-[:checked]:ring-2 has-[:checked]:ring-[var(--accent)]";

interface Answers {
  kind?: 'bug' | 'opinion';
  where?: FeedbackWhere;
  what?: FeedbackWhat;
  device?: FeedbackDevice;
  frequency?: FeedbackFrequency;
  rating?: number;
  wishes: FeedbackWish[];
  emote?: Emote;
}

type Status = 'idle' | 'sending' | 'waking' | 'sent' | 'too-many' | 'day-full' | 'unavailable';

/** What the form sends, or nothing while a required answer is missing. Only the fields of the chosen kind go in. */
const reportOf = ({ kind, where, what, device, frequency, rating, wishes, emote }: Answers): FeedbackArgs | undefined => {
  if (!where) return undefined;
  if (kind === 'bug') return what && device && frequency ? { kind, where, what, device, frequency } : undefined;
  if (kind === 'opinion') return rating ? { kind, where, rating, ...(wishes.length ? { wishes } : {}), ...(emote ? { emote } : {}) } : undefined;
  return undefined;
};

interface ChoiceProps {
  name: string;
  legend: string;
  options: readonly string[];
  value: string | undefined;
  onChange: (value: string) => void;
  text: (option: string) => string;
  art?: (option: string) => ReactNode;
}

/** One question with one answer: a group of radio buttons that the arrow keys move through. */
function Choice({ name, legend, options, value, onChange, text, art }: Readonly<ChoiceProps>) {
  return (
    <fieldset className="min-w-0">
      <legend className={LABEL}>{legend}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label key={option} className={OPTION}>
            <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} className="size-4 accent-[var(--accent)]" />
            {art?.(option)}
            {text(option)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * The feedback form: multiple choice only. There is no text to write on purpose: nothing a person types reaches the
 * tracker, so there is nothing to moderate and nothing about the person to keep (see CLAUDE.md).
 */
export default function FeedbackPage() {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<Answers>({ wishes: [] });
  const [status, setStatus] = useState<Status>('idle');
  const pending = useRef<AbortController | null>(null);

  // Leaving the page stops the wait: nothing is left running, and nothing is set on a page that is gone.
  useEffect(() => () => pending.current?.abort(), []);

  const set = (change: Partial<Answers>) => setAnswers((current) => ({ ...current, ...change }));
  const report = reportOf(answers);
  const busy = status === 'sending' || status === 'waking';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!report || busy) return;

    const controller = new AbortController();
    pending.current = controller;
    setStatus('sending');
    const waking = setTimeout(() => setStatus((current) => (current === 'sending' ? 'waking' : current)), FEEDBACK_WAKING_AFTER_MS);

    const outcome = await sendFeedback(report, controller.signal);

    clearTimeout(waking);
    if (!controller.signal.aborted) setStatus(outcome === 'sent' ? 'sent' : outcome);
  };

  const toggleWish = (wish: FeedbackWish) => set({ wishes: answers.wishes.includes(wish) ? answers.wishes.filter((chosen) => chosen !== wish) : [...answers.wishes, wish] });

  return (
    <Page title={t('feedback.title')} lead={t('feedback.lead')}>
      <div className="flex flex-col gap-8">
        <div className="flex min-w-0 flex-col gap-4">
          <p className={cn(BAND, "p-4 text-base font-medium text-[var(--title-text)]")}>{t('feedback.diaryNote')}</p>

          {status === 'sent' ? (
            <div role="status" className={cn(CARD, "flex flex-col items-start gap-3 p-5 sm:p-7")}>
              <h2 className={cn(HEADING, "text-2xl")}>{t('feedback.sentTitle')}</h2>
              <p className={BODY}>{t('feedback.sentText')}</p>
              <button type="button" onClick={() => { setAnswers({ wishes: [] }); setStatus('idle'); }} className={BUTTON_SECONDARY}>{t('feedback.sendAnother')}</button>
            </div>
          ) : (
            <form onSubmit={submit} className={cn(CARD, "flex min-w-0 flex-col gap-5 p-5 sm:p-7")}>
              <fieldset className="min-w-0">
                <legend className={LABEL}>{t('feedback.kind')}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {KINDS.map(({ kind, key, emote }) => (
                    <label key={kind} className={cn(OPTION, "min-h-14")}>
                      <input type="radio" name="kind" value={kind} checked={answers.kind === kind} onChange={() => set({ kind })} className="size-4 accent-[var(--accent)]" />
                      <EmoteArt emote={emote} size={32} />
                      {t(key)}
                    </label>
                  ))}
                </div>
              </fieldset>

              {answers.kind && (
                <div>
                  <label htmlFor="feedback-where" className={LABEL}>{t('feedback.where')}</label>
                  <select id="feedback-where" value={answers.where ?? ''} onChange={(event) => set({ where: (event.target.value || undefined) as FeedbackWhere | undefined })} className={FIELD}>
                    <option value="">{t('feedback.wherePlaceholder')}</option>
                    {FEEDBACK_WHERE.map((where) => <option key={where} value={where}>{t(`feedback.options.where.${where}`)}</option>)}
                  </select>
                </div>
              )}

              {answers.kind === 'bug' && (
                <>
                  <Choice name="what" legend={t('feedback.what')} options={FEEDBACK_WHAT} value={answers.what} onChange={(what) => set({ what: what as FeedbackWhat })} text={(option) => t(`feedback.options.what.${option}`)} />
                  <Choice name="device" legend={t('feedback.device')} options={FEEDBACK_DEVICES} value={answers.device} onChange={(device) => set({ device: device as FeedbackDevice })} text={(option) => t(`feedback.options.device.${option}`)} />
                  <Choice name="frequency" legend={t('feedback.frequency')} options={FEEDBACK_FREQUENCIES} value={answers.frequency} onChange={(frequency) => set({ frequency: frequency as FeedbackFrequency })} text={(option) => t(`feedback.options.frequency.${option}`)} />
                </>
              )}

              {answers.kind === 'opinion' && (
                <>
                  <Choice
                    name="rating"
                    legend={t('feedback.rating')}
                    options={FEEDBACK_RATINGS.map(String)}
                    value={answers.rating === undefined ? undefined : String(answers.rating)}
                    onChange={(rating) => set({ rating: Number(rating) })}
                    text={(option) => t(`feedback.options.rating.${option}`)}
                    art={(option) => <EmoteArt emote={RATING_EMOTES[Number(option) as keyof typeof RATING_EMOTES]} size={32} />}
                  />
                  <fieldset className="min-w-0">
                    <legend className={LABEL}>{t('feedback.wishes')} <span className="font-medium text-[var(--subtitle-text)]">({t('feedback.optional')})</span></legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {FEEDBACK_WISHES.map((wish) => (
                        <label key={wish} className={OPTION}>
                          <input type="checkbox" checked={answers.wishes.includes(wish)} onChange={() => toggleWish(wish)} className="size-4 accent-[var(--accent)]" />
                          {t(`feedback.options.wish.${wish}`)}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="min-w-0">
                    <legend className={LABEL}>{t('feedback.emote')} <span className="font-medium text-[var(--subtitle-text)]">({t('feedback.optional')})</span></legend>
                    <div className="flex flex-wrap gap-2">
                      {EMOTES.map((emote) => (
                        // Named after the emoji, like the buttons of the emote bar. Pressing it again takes it back.
                        <button
                          key={emote}
                          type="button"
                          aria-label={emote}
                          aria-pressed={answers.emote === emote}
                          onClick={() => set({ emote: answers.emote === emote ? undefined : emote })}
                          className="flex size-12 cursor-pointer items-center justify-center rounded-[var(--radius-control)] bg-[var(--paper-well)] aria-pressed:ring-2 aria-pressed:ring-[var(--accent)]"
                        >
                          <EmoteArt emote={emote} size={32} />
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </>
              )}

              {status === 'sending' && <p role="status" className={cn(BODY, "text-sm")}>{t('feedback.sending')}</p>}
              {status === 'waking' && (
                <div role="status" className={cn(BAND, "flex flex-col gap-1 p-4")}>
                  <p className="font-display text-lg font-extrabold text-[var(--title-text)]">{t('feedback.waking')}</p>
                  <p className={cn(BODY, "text-sm")}>{t('feedback.wakingDetails')}</p>
                </div>
              )}
              {status === 'too-many' && <p role="alert" className="text-sm font-bold text-[var(--title-text)]">{t('feedback.tooMany')}</p>}
              {status === 'day-full' && <p role="alert" className="text-sm font-bold text-[var(--title-text)]">{t('feedback.dayFull')}</p>}
              {status === 'unavailable' && <p role="alert" className="text-sm font-bold text-[var(--title-text)]">{t('feedback.unavailable')}</p>}

              <div>
                <button type="submit" disabled={!report || busy} className={cn(BUTTON_PRIMARY, "disabled:cursor-not-allowed disabled:opacity-60")}>{t('feedback.send')}</button>
              </div>
            </form>
          )}
        </div>

        <aside aria-labelledby="feedback-after" className={cn(BAND, "flex flex-col gap-4 p-5 sm:p-6")}>
          <h2 id="feedback-after" className={cn(HEADING, "text-2xl")}>{t('feedback.afterTitle')}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {AFTER.map((item) => (
              <div key={item}>
                <h3 className={cn(HEADING, "text-lg")}>{t(`feedback.${item}Title`)}</h3>
                <p className={cn(BODY, "text-sm")}>{t(`feedback.${item}Text`)}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </Page>
  );
}
