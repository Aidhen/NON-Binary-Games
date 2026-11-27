import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EMOTES, FEEDBACK_WHERE, FEEDBACK_WISHES } from '@nbg/shared';
import FeedbackPage from './page';
import { FEEDBACK_WAKING_AFTER_MS } from '@/lib/sendFeedback';

const { sendFeedback } = vi.hoisted(() => ({ sendFeedback: vi.fn() }));

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@/lib/sendFeedback', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/sendFeedback')>()), sendFeedback }));

const choose = (name: string) => fireEvent.click(screen.getByRole('radio', { name }));
const submit = () => screen.getByRole('button', { name: 'feedback.send' });

const fillBug = () => {
  choose('feedback.kindBug');
  fireEvent.change(screen.getByLabelText('feedback.where'), { target: { value: 'takuzu' } });
  choose('feedback.options.what.looks-wrong');
  choose('feedback.options.device.tablet');
  choose('feedback.options.frequency.always');
};

const fillOpinion = () => {
  choose('feedback.kindOpinion');
  fireEvent.change(screen.getByLabelText('feedback.where'), { target: { value: 'whole-site' } });
  choose('feedback.options.rating.4');
};

beforeEach(() => { sendFeedback.mockReset(); sendFeedback.mockResolvedValue('sent'); });
afterEach(() => { vi.useRealTimers(); });

describe('FeedbackPage', () => {
  it('is a form that can be used, with no text to write and no contact', () => {
    const { container } = render(<FeedbackPage />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(container.querySelector('input[type="email"], textarea')).toBeNull();
    expect(screen.queryByText('feedback.wip')).not.toBeInTheDocument();
    expect(screen.getAllByRole('radio').every((radio) => !(radio as HTMLInputElement).disabled)).toBe(true);
    expect(screen.getByRole('radio', { name: 'feedback.kindBug' })).toBeEnabled();
    expect(screen.getByRole('radio', { name: 'feedback.kindOpinion' })).toBeEnabled();
  });

  it('says that some requests may be answered or built in the Diary, and that there is no private reply', () => {
    render(<FeedbackPage />);

    expect(screen.getByText('feedback.diaryNote')).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'feedback.afterTitle' })).toHaveTextContent('feedback.after3Title');
  });

  it('asks nothing else before the kind is chosen, and cannot be sent', () => {
    render(<FeedbackPage />);

    expect(screen.queryByLabelText('feedback.where')).not.toBeInTheDocument();
    expect(submit()).toBeDisabled();
  });

  it('asks where, what happened, the device and how often for something that is wrong', () => {
    render(<FeedbackPage />);
    choose('feedback.kindBug');

    expect(screen.getByLabelText('feedback.where')).toBeInTheDocument();
    for (const legend of ['feedback.what', 'feedback.device', 'feedback.frequency']) expect(screen.getByRole('group', { name: legend })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'feedback.rating' })).not.toBeInTheDocument();
    expect(within(screen.getByLabelText('feedback.where')).getAllByRole('option')).toHaveLength(FEEDBACK_WHERE.length + 1);
  });

  it('asks where, the rating, the wishes and an emote for an opinion', () => {
    render(<FeedbackPage />);
    choose('feedback.kindOpinion');

    expect(screen.getByLabelText('feedback.where')).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'feedback.rating' })).getAllByRole('radio')).toHaveLength(4);
    expect(screen.getAllByRole('checkbox')).toHaveLength(FEEDBACK_WISHES.length);
    expect(within(screen.getByRole('group', { name: /feedback.emote/ })).getAllByRole('button')).toHaveLength(EMOTES.length);
    expect(screen.queryByRole('group', { name: 'feedback.device' })).not.toBeInTheDocument();
  });

  it('can be sent only when every required answer is there', () => {
    render(<FeedbackPage />);
    choose('feedback.kindBug');
    fireEvent.change(screen.getByLabelText('feedback.where'), { target: { value: 'takuzu' } });
    choose('feedback.options.what.looks-wrong');
    choose('feedback.options.device.tablet');

    expect(submit()).toBeDisabled();
    choose('feedback.options.frequency.always');
    expect(submit()).toBeEnabled();
  });

  it('sends the chosen values of a bug and says thank you', async () => {
    render(<FeedbackPage />);
    fillBug();

    await act(async () => { fireEvent.click(submit()); });

    expect(sendFeedback).toHaveBeenCalledExactlyOnceWith({ kind: 'bug', where: 'takuzu', what: 'looks-wrong', device: 'tablet', frequency: 'always' }, expect.any(AbortSignal));
    expect(screen.getByRole('status')).toHaveTextContent('feedback.sentTitle');
    expect(screen.queryByRole('button', { name: 'feedback.send' })).not.toBeInTheDocument();
  });

  it('sends an opinion with only what was chosen', async () => {
    render(<FeedbackPage />);
    fillOpinion();

    await act(async () => { fireEvent.click(submit()); });

    expect(sendFeedback).toHaveBeenCalledExactlyOnceWith({ kind: 'opinion', where: 'whole-site', rating: 4 }, expect.any(AbortSignal));
  });

  it('sends the wishes and the emote, and lets them be taken back', async () => {
    render(<FeedbackPage />);
    fillOpinion();
    fireEvent.click(screen.getByRole('checkbox', { name: 'feedback.options.wish.more-games' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'feedback.options.wish.public-rooms' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'feedback.options.wish.more-games' }));
    fireEvent.click(screen.getByRole('button', { name: EMOTES[0] }));
    expect(screen.getByRole('button', { name: EMOTES[0] })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: EMOTES[1] }));

    await act(async () => { fireEvent.click(submit()); });

    expect(sendFeedback.mock.calls[0][0]).toEqual({ kind: 'opinion', where: 'whole-site', rating: 4, wishes: ['public-rooms'], emote: EMOTES[1] });
  });

  it('does not send the fields of the other kind', async () => {
    render(<FeedbackPage />);
    fillBug();
    choose('feedback.kindOpinion');
    choose('feedback.options.rating.2');

    await act(async () => { fireEvent.click(submit()); });

    expect(sendFeedback.mock.calls[0][0]).toEqual({ kind: 'opinion', where: 'takuzu', rating: 2 });
  });

  it('shows that it is sending, then that the server is waking up when the answer takes long, and sends once', async () => {
    vi.useFakeTimers();
    sendFeedback.mockReturnValue(new Promise(() => undefined));
    render(<FeedbackPage />);
    fillBug();

    fireEvent.click(submit());
    expect(screen.getByRole('status')).toHaveTextContent('feedback.sending');
    expect(submit()).toBeDisabled();

    await act(async () => { await vi.advanceTimersByTimeAsync(FEEDBACK_WAKING_AFTER_MS); });

    expect(screen.getByRole('status')).toHaveTextContent('feedback.waking');
    expect(screen.getByRole('status')).toHaveTextContent('feedback.wakingDetails');
    fireEvent.click(submit());
    expect(sendFeedback).toHaveBeenCalledOnce();
  });

  it('says there are too many reports on a 429, and keeps the answers to try again', async () => {
    sendFeedback.mockResolvedValue('too-many');
    render(<FeedbackPage />);
    fillBug();

    await act(async () => { fireEvent.click(submit()); });

    expect(screen.getByRole('alert')).toHaveTextContent('feedback.tooMany');
    expect(submit()).toBeEnabled();
    expect(screen.getByRole('radio', { name: 'feedback.options.device.tablet' })).toBeChecked();
  });

  it('says the form is full for today on a "day-full" answer', async () => {
    sendFeedback.mockResolvedValue('day-full');
    render(<FeedbackPage />);
    fillBug();

    await act(async () => { fireEvent.click(submit()); });

    expect(screen.getByRole('alert')).toHaveTextContent('feedback.dayFull');
  });

  it('says it is unavailable when the server did not take it, and can be tried again', async () => {
    sendFeedback.mockResolvedValueOnce('unavailable').mockResolvedValueOnce('sent');
    render(<FeedbackPage />);
    fillBug();

    await act(async () => { fireEvent.click(submit()); });
    expect(screen.getByRole('alert')).toHaveTextContent('feedback.unavailable');

    await act(async () => { fireEvent.click(submit()); });
    expect(screen.getByRole('status')).toHaveTextContent('feedback.sentTitle');
  });

  it('starts again with an empty form after "send another"', async () => {
    render(<FeedbackPage />);
    fillBug();
    await act(async () => { fireEvent.click(submit()); });

    fireEvent.click(screen.getByRole('button', { name: 'feedback.sendAnother' }));

    expect(screen.getByRole('radio', { name: 'feedback.kindBug' })).not.toBeChecked();
    expect(submit()).toBeDisabled();
  });

  it('stops waiting when the page is left', () => {
    sendFeedback.mockReturnValue(new Promise(() => undefined));
    const { unmount } = render(<FeedbackPage />);
    fillBug();
    fireEvent.click(submit());
    const signal = sendFeedback.mock.calls[0][1] as AbortSignal;

    unmount();

    expect(signal.aborted).toBe(true);
  });
});
