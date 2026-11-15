import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SettingToggle } from './SettingToggle';

describe('SettingToggle', () => {
  it('names the box with its label, and shows whether it is on', () => {
    const { rerender } = render(<SettingToggle label="Show errors" checked onChange={() => {}} />);
    expect(screen.getByRole('checkbox', { name: 'Show errors' })).toBeChecked();

    rerender(<SettingToggle label="Show errors" checked={false} onChange={() => {}} />);
    expect(screen.getByRole('checkbox', { name: 'Show errors' })).not.toBeChecked();
  });

  it('tells when it is clicked, on the box or on its name', () => {
    const onChange = vi.fn();
    render(<SettingToggle label="Show errors" checked={false} onChange={onChange} />);

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('Show errors'));

    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('can be changed unless it is disabled, and then it looks so', () => {
    const { rerender } = render(<SettingToggle label="Explosive" checked onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).toBeEnabled();
    expect(screen.getByText('Explosive').closest('label')?.className).toContain('cursor-pointer');

    rerender(<SettingToggle label="Explosive" checked onChange={() => {}} disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
    expect(screen.getByText('Explosive').closest('label')?.className).toContain('cursor-not-allowed opacity-60');
  });
});
