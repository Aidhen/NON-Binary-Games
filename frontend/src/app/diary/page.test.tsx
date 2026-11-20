import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DIARY, DIARY_TYPES } from '@/locales/diary';
import DiaryPage from './page';

const { language } = vi.hoisted(() => ({ language: { current: 'en' as 'en' | 'it' } }));

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key, language: language.current }),
}));

const newestFirst = [...DIARY].sort((a, b) => b.date.localeCompare(a.date));
const entryButtons = () => screen.getAllByRole('button', { expanded: false }).concat(screen.queryAllByRole('button', { expanded: true }));
const titles = () => screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.querySelector('button')).filter((button) => button !== null);

describe('the entries of the diary', () => {
  it('have an id of their own each', () => {
    expect(new Set(DIARY.map((entry) => entry.id)).size).toBe(DIARY.length);
  });

  it.each(DIARY)('$id is complete in both languages and dated', (entry) => {
    expect(DIARY_TYPES).toContain(entry.type);
    expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(entry.date))).toBe(false);
    for (const text of [entry.en, entry.it]) {
      expect(text.title.trim()).not.toBe('');
      expect(text.summary.trim()).not.toBe('');
      expect(text.body.length).toBeGreaterThan(0);
      expect(new Set(text.body).size).toBe(text.body.length);
    }
  });

  it('carry a version only when they are released, and always then', () => {
    for (const entry of DIARY) {
      expect(entry.version !== undefined, entry.id).toBe(entry.type === 'released');
    }
  });

  it('announce a few things at a time (see docs/DIARY.md)', () => {
    expect(DIARY.filter((entry) => entry.type === 'upcoming').length).toBeLessThanOrEqual(5);
  });
});

describe('DiaryPage', () => {
  it('lists every entry, newest first and closed', () => {
    language.current = 'en';
    render(<DiaryPage />);

    expect(titles().map((button) => button.querySelector(':scope > span:last-child > span')?.textContent)).toEqual(newestFirst.map((entry) => entry.en.title));
    expect(entryButtons().every((button) => button.getAttribute('aria-expanded') === 'false')).toBe(true);
    expect(screen.queryByText(newestFirst[0].en.body[0])).not.toBeInTheDocument();
  });

  it('opens one entry at a time, and closes it when it is picked again', () => {
    language.current = 'en';
    render(<DiaryPage />);
    const [first, second] = titles();

    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(first.getAttribute('aria-controls')!)).toHaveTextContent(newestFirst[0].en.body[0]);

    fireEvent.click(second);
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(second).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(second);
    expect(second).toHaveAttribute('aria-expanded', 'false');
  });

  it.each(DIARY_TYPES)('shows only the %s entries when asked', (type) => {
    language.current = 'en';
    render(<DiaryPage />);
    const filters = within(screen.getByRole('group', { name: 'diary.filter' })).getAllByRole('button');

    fireEvent.click(filters[DIARY_TYPES.indexOf(type) + 1]);

    expect(filters[DIARY_TYPES.indexOf(type) + 1]).toHaveAttribute('aria-pressed', 'true');
    expect(titles()).toHaveLength(DIARY.filter((entry) => entry.type === type).length);

    fireEvent.click(filters[0]);
    expect(titles()).toHaveLength(DIARY.length);
  });

  it('writes the entries in the language of the page', () => {
    language.current = 'it';
    render(<DiaryPage />);

    expect(screen.getByText(newestFirst[0].it.title)).toBeInTheDocument();
  });

  it('always shows who is behind the game, under the list', () => {
    language.current = 'en';
    render(<DiaryPage />);

    const about = screen.getByRole('complementary', { name: 'diary.aboutTitle' });
    expect(within(about).getByText('diary.about2')).toBeInTheDocument();
    expect(within(about).queryByRole('button')).not.toBeInTheDocument();
  });
});
