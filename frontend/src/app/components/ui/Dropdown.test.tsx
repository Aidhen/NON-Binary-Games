import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Dropdown } from './Dropdown';
import type { DropdownOption } from './Dropdown';

type TestProps = {
  value: string;
  options: DropdownOption<string>[];
  onChange: (value: string) => void;
  label: string;
  className?: string;
};

const options: DropdownOption<string>[] = [
  { value: 'en', label: 'English' },
  { value: 'it', label: 'Italian' },
  { value: 'fr', label: 'French' },
];

const renderDropdown = (overrides: Partial<TestProps> = {}) => {
  const props: TestProps = { value: 'en', options, onChange: vi.fn(), label: 'Choice', ...overrides };
  return { ...render(<Dropdown {...props} />), props };
};

const getTrigger = () => screen.getByRole('button', { name: /^Choice:/ });

describe('Dropdown', () => {
  it('renders the current option label', () => {
    renderDropdown();

    expect(getTrigger()).toHaveTextContent('English');
  });

  it('falls back to the value when no matching option exists', () => {
    renderDropdown({ value: 'unknown' });

    expect(getTrigger()).toHaveTextContent('unknown');
  });

  it('opens the options when the trigger is clicked', () => {
    renderDropdown();

    fireEvent.click(getTrigger());

    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Italian' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'French' })).toBeInTheDocument();
  });

  it('closes the options when the trigger is clicked again', () => {
    renderDropdown();

    fireEvent.click(getTrigger());
    expect(screen.getByRole('button', { name: 'Italian' })).toBeInTheDocument();

    fireEvent.click(getTrigger());

    expect(screen.queryByRole('button', { name: 'Italian' })).not.toBeInTheDocument();
  });

  it('calls onChange and closes the dropdown when an option is selected', () => {
    const onChange = vi.fn();
    renderDropdown({ onChange });

    fireEvent.click(getTrigger());
    fireEvent.click(screen.getByRole('button', { name: 'Italian' }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('it');
    expect(screen.queryByRole('button', { name: 'Italian' })).not.toBeInTheDocument();
  });

  it('highlights the currently selected option', () => {
    renderDropdown();

    fireEvent.click(getTrigger());

    expect(screen.getByRole('button', { name: 'English' })).toHaveClass(
      'bg-[var(--accent)]',
      'text-[var(--accent-ink)]',
    );
    expect(screen.getByRole('button', { name: 'Italian' })).toHaveClass(
      'text-[var(--subtitle-text)]',
    );
  });

  it('closes the dropdown when clicking outside', () => {
    renderDropdown();

    fireEvent.click(getTrigger());
    expect(screen.getByRole('button', { name: 'French' })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('button', { name: 'French' })).not.toBeInTheDocument();
  });

  it('is named after what it chooses and its current value, and says it opens a list', () => {
    renderDropdown();

    expect(getTrigger()).toHaveAccessibleName('Choice: English');
    expect(getTrigger()).toHaveAttribute('aria-haspopup', 'true');
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
    expect(getTrigger().querySelector('[aria-hidden="true"]')).toHaveTextContent('▼');

    fireEvent.click(getTrigger());
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
  });

  it('marks the current option for assistive technology', () => {
    renderDropdown();

    fireEvent.click(getTrigger());

    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Italian' })).not.toHaveAttribute('aria-current');
  });

  it('closes on Escape and gives the focus back to the button', () => {
    renderDropdown();

    fireEvent.click(getTrigger());
    fireEvent.keyDown(screen.getByRole('button', { name: 'Italian' }), { key: 'Escape' });

    expect(screen.queryByRole('button', { name: 'Italian' })).not.toBeInTheDocument();
    expect(getTrigger()).toHaveFocus();
  });

  it('marks the Escape it closes with as handled, so that a panel around it stays open', () => {
    renderDropdown();

    fireEvent.click(getTrigger());
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    screen.getByRole('button', { name: 'Italian' }).dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('applies the custom class to the trigger', () => {
    renderDropdown({ className: 'custom-trigger' });

    expect(getTrigger()).toHaveClass('custom-trigger');
  });

  it('renders an empty options list without errors', () => {
    renderDropdown({ options: [] });

    expect(getTrigger()).toHaveTextContent('en');

    fireEvent.click(getTrigger());

    expect(screen.queryByRole('button', { name: 'Italian' })).not.toBeInTheDocument();
  });
});