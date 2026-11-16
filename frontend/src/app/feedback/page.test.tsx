import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FeedbackPage from './page';

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('FeedbackPage', () => {
  it('says first that the form is not active yet', () => {
    render(<FeedbackPage />);

    const notice = screen.getByRole('status');
    expect(notice).toHaveTextContent('feedback.wip');
    expect(notice).toHaveTextContent('feedback.wipText');
  });

  it('shows the form with every field switched off, the contact included', () => {
    render(<FeedbackPage />);

    for (const field of [...screen.getAllByRole('textbox'), ...screen.getAllByRole('radio'), screen.getByRole('combobox')]) {
      expect(field).toBeDisabled();
    }
    expect(screen.getByLabelText(/feedback\.contact/)).toBeDisabled();
    expect(screen.getByRole('button', { name: 'feedback.send' })).toBeDisabled();
  });

  it('sends nothing and goes nowhere, whatever happens to the form', () => {
    const { container } = render(<FeedbackPage />);
    const form = container.querySelector('form')!;

    expect(form).not.toHaveAttribute('action');
    expect(fireEvent.submit(form)).toBe(false);
  });

  it('explains what will happen to a message once the form is open', () => {
    render(<FeedbackPage />);

    expect(screen.getByRole('complementary', { name: 'feedback.afterTitle' })).toHaveTextContent('feedback.after1Title');
  });
});
