import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NAV_LINKS, SiteHeader } from './SiteHeader';

const { pathname, focused } = vi.hoisted(() => ({ pathname: { current: '/' }, focused: { current: false } }));

vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }));
vi.mock('@/lib/focusMode', () => ({ useFocusMode: () => focused.current }));

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../ui/ThemeSelector', () => ({ ThemeSelector: () => <div data-testid="theme-selector" /> }));
vi.mock('../ui/LanguageSelector', () => ({ LanguageSelector: () => <div data-testid="language-selector" /> }));

describe('SiteHeader', () => {
  beforeEach(() => { pathname.current = '/'; focused.current = false; });

  it('leaves the pages out while a game is open, and keeps the logo, the theme and the language', () => {
    focused.current = true;
    render(<SiteHeader />);

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'nav.home' })).toBeInTheDocument();
    expect(screen.getByTestId('theme-selector')).toBeInTheDocument();
    expect(screen.getByTestId('language-selector')).toBeInTheDocument();
  });

  it('leads home from the logo, which is named after the site', () => {
    render(<SiteHeader />);

    expect(screen.getByRole('link', { name: 'nav.home' })).toHaveAttribute('href', '/');
  });

  it('lists the pages of the site', () => {
    render(<SiteHeader />);

    const nav = screen.getByRole('navigation', { name: 'nav.label' });
    expect(within(nav).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(NAV_LINKS.map(({ href }) => href));
  });

  it('marks no page as the current one on the home or in a room', () => {
    render(<SiteHeader />);

    for (const link of within(screen.getByRole('navigation')).getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current');
    }
  });

  it.each(NAV_LINKS)('marks $href as the current page when it is open', ({ href, labelKey }) => {
    pathname.current = href;
    render(<SiteHeader />);

    const nav = screen.getByRole('navigation');
    expect(within(nav).getByRole('link', { name: labelKey })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getAllByRole('link').filter((link) => link.hasAttribute('aria-current'))).toHaveLength(1);
  });

  it('keeps theme and language at hand', () => {
    render(<SiteHeader />);

    expect(screen.getByTestId('theme-selector')).toBeInTheDocument();
    expect(screen.getByTestId('language-selector')).toBeInTheDocument();
  });
});
