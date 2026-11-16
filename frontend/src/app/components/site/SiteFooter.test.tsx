import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import packageInfo from '../../../../package.json';
import { REPOSITORY_URL, SiteFooter } from './SiteFooter';

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('SiteFooter', () => {
  it('says which version of the site this is', () => {
    render(<SiteFooter />);

    expect(screen.getByText(new RegExp(`v${packageInfo.version.replaceAll('.', '\\.')}`))).toBeInTheDocument();
  });

  it('leads to the feedback page and to the repository, without telling the repository where the player came from', () => {
    render(<SiteFooter />);

    expect(screen.getByRole('link', { name: 'nav.feedback' })).toHaveAttribute('href', '/feedback');
    const repository = screen.getByRole('link', { name: 'footer.github' });
    expect(repository).toHaveAttribute('href', REPOSITORY_URL);
    expect(repository.getAttribute('rel')).toContain('noreferrer');
    expect(repository.getAttribute('rel')).toContain('noopener');
  });

  it('shows the social profiles as coming soon: one image with a name, and nothing to press', () => {
    render(<SiteFooter />);

    expect(screen.getByRole('img', { name: 'footer.social' })).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });
});
