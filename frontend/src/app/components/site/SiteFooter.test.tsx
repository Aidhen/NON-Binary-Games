import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The version is read when the module loads, like the build does: it has to be there before the import.
vi.hoisted(() => { process.env.NEXT_PUBLIC_APP_VERSION = '1.2.3-test'; });

import { REPOSITORY_URL, SiteFooter } from './SiteFooter';

const { focused } = vi.hoisted(() => ({ focused: { current: false } }));
vi.mock('@/lib/focusMode', () => ({ useFocusMode: () => focused.current }));

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('SiteFooter', () => {
  beforeEach(() => { focused.current = false; });

  it('is not there while a game is open', () => {
    focused.current = true;
    const { container } = render(<SiteFooter />);

    expect(container).toBeEmptyDOMElement();
  });

  it('says which version of the site this is', () => {
    render(<SiteFooter />);

    expect(screen.getByText(/v1\.2\.3-test/)).toBeInTheDocument();
  });

  it('leads to the feedback page, the privacy note and the repository, without telling the repository where the player came from', () => {
    render(<SiteFooter />);

    expect(screen.getByRole('link', { name: 'nav.feedback' })).toHaveAttribute('href', '/feedback');
    expect(screen.getByRole('link', { name: 'footer.privacy' })).toHaveAttribute('href', '/privacy');
    const repository = screen.getByRole('link', { name: 'footer.github' });
    expect(repository).toHaveAttribute('href', REPOSITORY_URL);
    expect(repository.getAttribute('rel')).toContain('noreferrer');
    expect(repository.getAttribute('rel')).toContain('noopener');
  });

  it('has no placeholder for profiles that do not exist yet', () => {
    render(<SiteFooter />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText('footer.social')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });
});
