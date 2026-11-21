import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FocusModeProvider, useFocusMode, useFocusModeWhile } from './focusMode';

const Shown = () => <p data-testid="focused">{String(useFocusMode())}</p>;
const Game = ({ active }: { active: boolean }) => { useFocusModeWhile(active); return null; };

const renderWith = (active: boolean, mounted = true) => (
  <FocusModeProvider>
    <Shown />
    {mounted && <Game active={active} />}
  </FocusModeProvider>
);

describe('focus mode', () => {
  it('is off until a game asks for it, and on while it does', () => {
    const { rerender } = render(renderWith(false));
    expect(screen.getByTestId('focused')).toHaveTextContent('false');

    rerender(renderWith(true));
    expect(screen.getByTestId('focused')).toHaveTextContent('true');

    rerender(renderWith(false));
    expect(screen.getByTestId('focused')).toHaveTextContent('false');
  });

  it('goes off when the game leaves the page', () => {
    const { rerender } = render(renderWith(true));
    rerender(renderWith(true, false));

    expect(screen.getByTestId('focused')).toHaveTextContent('false');
  });

  it('is off outside a provider', () => {
    render(<Shown />);

    expect(screen.getByTestId('focused')).toHaveTextContent('false');
  });
});
