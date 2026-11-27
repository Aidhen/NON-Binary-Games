import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PrivacyPage, { HOSTING_POLICIES } from './page';

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('PrivacyPage', () => {
  it('says what is kept in the browser, on the server, by the hosting and by the feedback form', () => {
    render(<PrivacyPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'privacy.title' })).toBeInTheDocument();
    for (const section of ['browser', 'server', 'hosting', 'feedback']) {
      expect(screen.getByRole('heading', { level: 2, name: `privacy.${section}Title` })).toBeInTheDocument();
      expect(screen.getByText(`privacy.${section}Text`)).toBeInTheDocument();
    }
    expect(screen.getByText('privacy.updated')).toBeInTheDocument();
  });

  it('links the policies of the hosting, without telling them where the player came from', () => {
    render(<PrivacyPage />);

    for (const { name, url } of HOSTING_POLICIES) {
      const link = screen.getByRole('link', { name });
      expect(link).toHaveAttribute('href', url);
      expect(link.getAttribute('rel')).toContain('noreferrer');
      expect(link.getAttribute('rel')).toContain('noopener');
    }
  });

  it('links the privacy policy of GitHub, where the answers of the feedback form are kept', () => {
    render(<PrivacyPage />);

    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement');
  });
});
