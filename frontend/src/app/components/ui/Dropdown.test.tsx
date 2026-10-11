import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Dropdown } from './Dropdown';
import type { DropdownOption } from './Dropdown';

type TestProps = {
  value: string;
  options: DropdownOption<string>[];
  onChange: (value: string) => void;
  className?: string;
};

const options: DropdownOption<string>[] = [
  { value: 'en', label: 'English' },
  { value: 'it', label: 'Italian' },
  { value: 'fr', label: 'French' },
];

const renderDropdown = (overrides: Partial<TestProps> = {}) => {
  const props: TestProps = { value: 'en', options, onChange: vi.fn(), ...overrides };
  return { ...render(<Dropdown {...props} />), props };
};

const getTrigger = () => screen.getByRole('button', { name: /▼/ });

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
      'bg-[var(--numpad-background)]',
      'text-[var(--numpad-text)]',
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