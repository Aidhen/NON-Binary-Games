import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SudokuContainer } from './SudokuContainer';

const mocks = vi.hoisted(() => {
  type Handler = (...args: any[]) => void;

  const listeners: Record<string, Handler[]> = {};
  const emitted: { event: string; args: any[] }[] = [];
  const generateSudoku = vi.fn();
  const isValid = vi.fn();
  const socket: any = {};

  const dispatch = (event: string, ...args: any[]) => {
    [...(listeners[event] ?? [])].forEach((handler) => handler(...args));
  };

  socket.connected = false;
  socket.id = 'local-player';
  socket.on = vi.fn((event: string, handler: Handler) => {
    (listeners[event] ??= []).push(handler);
    return socket;
  });
  socket.off = vi.fn((event: string, handler?: Handler) => {
    if (!handler) delete listeners[event];
    else listeners[event] = (listeners[event] ?? []).filter((registered) => registered !== handler);
    return socket;
  });
  socket.emit = vi.fn((event: string, ...args: any[]) => {
    emitted.push({ event, args });
    return socket;
  });
  socket.connect = vi.fn(() => {
    socket.connected = true;
    dispatch('connect');
    return socket;
  });
  socket.disconnect = vi.fn(() => {
    socket.connected = false;
    dispatch('disconnect');
    return socket;
  });

  const reset = () => {
    Object.keys(listeners).forEach((event) => delete listeners[event]);
    emitted.length = 0;
    socket.connected = false;
    socket.id = 'local-player';
    socket.on.mockClear();
    socket.off.mockClear();
    socket.emit.mockClear();
    socket.connect.mockClear();
    socket.disconnect.mockClear();
    generateSudoku.mockReset();
    isValid.mockReset();
  };

  return { socket, listeners, emitted, dispatch, generateSudoku, isValid, reset };
});

vi.mock('@nbg/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nbg/shared')>();
  return { ...actual, generateSudoku: mocks.generateSudoku, isValid: mocks.isValid };
});

vi.mock('@/lib/socket', () => ({ getSocket: () => mocks.socket }));

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('./SudokuBoardUI', () => ({
  SudokuBoardUI: (props: any) => {
    const [errorResult, setErrorResult] = useState('');

    return (
      <div data-testid="board-ui">
        <button data-testid="select-empty-cell" onClick={() => props.onCellClick(0, 1)}>Select empty cell</button>
        <button data-testid="select-filled-cell" onClick={() => props.onCellClick(0, 0)}>Select filled cell</button>
        <button data-testid="check-invalid-placement" onClick={() => setErrorResult(String(props.isErrorPlacement(0, 1, 2)))}>Check invalid placement</button>
        <button data-testid="check-zero-placement" onClick={() => setErrorResult(String(props.isErrorPlacement(0, 1, 0)))}>Check zero placement</button>
        <output data-testid="error-result">{errorResult}</output>
        <output data-testid="board-state">
          {JSON.stringify({
            playerGrid: props.playerGrid,
            selectedCell: props.selectedCell,
            isGameWon: props.isGameWon,
            othersSelections: props.othersSelections,
            notesGrid: props.notesGrid,
          })}
        </output>
      </div>
    );
  },
}));

vi.mock('./SettingsPanel', () => ({
  SettingsPanel: ({ settings, onToggle, currentDifficulty, onDifficultyChange }: any) => (
    <div data-testid="settings-panel">
      <output data-testid="settings-state">{JSON.stringify({ settings, currentDifficulty })}</output>
      <button onClick={() => onToggle('showErrors')}>Toggle show errors</button>
      <button data-testid="set-medium" onClick={() => onDifficultyChange('medium')}>Set medium</button>
    </div>
  ),
}));

const testBoard = {
  size: 4,
  boxSize: 2,
  initial: [
    [1, 0, 0, 4],
    [0, 4, 1, 0],
    [0, 1, 4, 0],
    [4, 0, 0, 1],
  ],
  solution: [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 1, 4, 3],
    [4, 3, 2, 1],
  ],
};

const currentGrid = [
  [1, 2, 0, 4],
  [0, 4, 1, 0],
  [0, 1, 4, 0],
  [4, 0, 0, 1],
];

const renderGame = async (roomId = 'room-1') => {
  render(<SudokuContainer roomId={roomId} />);

  await act(async () => {
    mocks.dispatch('game-started', {
      board: testBoard,
      currentGrid: currentGrid.map((row) => [...row]),
      notesGrid: {},
      difficulty: 'easy',
    });
  });
};

const getBoardState = () => JSON.parse(screen.getByTestId('board-state').textContent ?? '{}');

const getSettingsState = () => JSON.parse(screen.getByTestId('settings-state').textContent ?? '{}');

beforeEach(() => {
  mocks.reset();
  mocks.generateSudoku.mockReturnValue(testBoard);
  mocks.isValid.mockReturnValue(true);
});

describe('SudokuContainer', () => {
  it('renders the loading state and joins the room when the socket connects', () => {
    render(<SudokuContainer />);

    expect(screen.getByText('sudoku.loading')).toBeInTheDocument();
    expect(mocks.socket.connect).toHaveBeenCalledOnce();
    expect(mocks.emitted).toContainEqual({ event: 'join-room', args: ['room-1', 'easy'] });
  });

  it('joins the room immediately when the socket is already connected', () => {
    mocks.socket.connected = true;

    render(<SudokuContainer roomId="custom-room" />);

    expect(mocks.socket.connect).not.toHaveBeenCalled();
    expect(mocks.emitted).toContainEqual({ event: 'join-room', args: ['custom-room', 'easy'] });
  });

  it('renders the board when a game-started event is received', async () => {
    await renderGame();

    expect(screen.getByTestId('board-ui')).toBeInTheDocument();
    expect(getBoardState().playerGrid).toEqual(currentGrid);
    expect(screen.getByRole('button', { name: 'sudoku.settings' })).toBeInTheDocument();
  });

  it('selects a cell and emits select-cell', async () => {
    await renderGame('test-room');

    fireEvent.click(screen.getByTestId('select-empty-cell'));

    expect(getBoardState().selectedCell).toEqual([0, 1]);
    expect(mocks.emitted).toContainEqual({
      event: 'select-cell',
      args: ['test-room', { r: 0, c: 1 }],
    });
  });

  it('updates an editable cell and emits cell-update when a number is entered', async () => {
    await renderGame();

    fireEvent.click(screen.getByTestId('select-empty-cell'));
    fireEvent.click(screen.getByRole('button', { name: /^3$/ }));

    expect(getBoardState().playerGrid[0][1]).toBe(3);
    expect(mocks.emitted).toContainEqual({
      event: 'cell-update',
      args: ['room-1', { r: 0, c: 1, v: 3 }],
    });
  });

  it('does not update an initial fixed cell', async () => {
    await renderGame();

    fireEvent.click(screen.getByTestId('select-filled-cell'));
    fireEvent.click(screen.getByRole('button', { name: /^2$/ }));

    expect(getBoardState().playerGrid[0][0]).toBe(1);
    expect(mocks.emitted.some(({ event }) => event === 'cell-update')).toBe(false);
  });

  it('disables the numpad when no cell is selected', async () => {
    await renderGame();

    expect(screen.getByRole('button', { name: /^2$/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: '⌫' })).toBeDisabled();
  });

  it('emits toggle-note instead of cell-update when notes mode is enabled', async () => {
    await renderGame();

    fireEvent.click(screen.getByRole('button', { name: /sudoku.notesMode OFF/ }));
    fireEvent.click(screen.getByTestId('select-empty-cell'));
    fireEvent.click(screen.getByRole('button', { name: /^3$/ }));

    expect(mocks.emitted).toContainEqual({
      event: 'toggle-note',
      args: ['room-1', { r: 0, c: 1, v: 3 }],
    });
    expect(mocks.emitted.some(({ event }) => event === 'cell-update')).toBe(false);
    expect(getBoardState().playerGrid[0][1]).toBe(2);
  });

  it('enters a note when a number key is pressed with Shift', async () => {
    await renderGame();

    fireEvent.click(screen.getByTestId('select-empty-cell'));
    fireEvent.keyDown(window, { key: '3', code: 'Digit3', shiftKey: true });

    expect(mocks.emitted).toContainEqual({
      event: 'toggle-note',
      args: ['room-1', { r: 0, c: 1, v: 3 }],
    });
  });

  it('supports numpad keyboard input', async () => {
    await renderGame();

    fireEvent.click(screen.getByTestId('select-empty-cell'));
    fireEvent.keyDown(window, { key: 'Unidentified', code: 'Numpad3' });

    expect(mocks.emitted).toContainEqual({
      event: 'cell-update',
      args: ['room-1', { r: 0, c: 1, v: 3 }],
    });
  });

  it('clears an editable cell when Backspace is pressed', async () => {
    await renderGame();

    fireEvent.click(screen.getByTestId('select-empty-cell'));
    fireEvent.keyDown(window, { key: 'Backspace', code: 'Backspace' });

    expect(getBoardState().playerGrid[0][1]).toBe(0);
    expect(mocks.emitted).toContainEqual({
      event: 'cell-update',
      args: ['room-1', { r: 0, c: 1, v: 0 }],
    });
  });

  it('ignores unsupported keys and values outside the board range', async () => {
    await renderGame();

    fireEvent.click(screen.getByTestId('select-empty-cell'));
    fireEvent.keyDown(window, { key: 'x', code: 'KeyX' });
    fireEvent.keyDown(window, { key: '5', code: 'Digit5' });

    expect(mocks.emitted.some(({ event }) => event === 'cell-update')).toBe(false);
    expect(mocks.emitted.some(({ event }) => event === 'toggle-note')).toBe(false);
  });

  it('updates the player grid when another player changes a cell', async () => {
    await renderGame();

    await act(async () => {
      mocks.dispatch('cell-updated', { r: 1, c: 0, v: 3 });
    });

    expect(getBoardState().playerGrid[1][0]).toBe(3);
  });

  it('tracks other players cell selections and removes cleared selections', async () => {
    await renderGame();

    await act(async () => {
      mocks.dispatch('player-selected-cell', { playerId: 'player-2', r: 2, c: 3 });
    });

    expect(getBoardState().othersSelections['player-2']).toEqual([2, 3]);

    await act(async () => {
      mocks.dispatch('player-selected-cell', { playerId: 'player-2', r: null, c: null });
    });

    expect(getBoardState().othersSelections['player-2']).toBeUndefined();
  });

  it('removes a disconnected player selection', async () => {
    await renderGame();

    await act(async () => {
      mocks.dispatch('player-selected-cell', { playerId: 'player-2', r: 1, c: 1 });
      mocks.dispatch('player-disconnected', 'player-2');
    });

    expect(getBoardState().othersSelections['player-2']).toBeUndefined();
  });

  it('adds and removes notes received from the server', async () => {
    await renderGame();

    await act(async () => {
      mocks.dispatch('note-toggled', { r: 0, c: 1, v: 3, playerId: 'player-2' });
    });

    expect(getBoardState().notesGrid['0-1']['3']).toBe('player-2');

    await act(async () => {
      mocks.dispatch('note-toggled', { r: 0, c: 1, v: 3, playerId: null });
    });

    expect(getBoardState().notesGrid['0-1']).toBeUndefined();
  });

  it('opens and closes the settings panel', async () => {
    await renderGame();

    fireEvent.click(screen.getByRole('button', { name: 'sudoku.settings' }));

    expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'sudoku.closeSettings' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'sudoku.closeSettings' }));

    expect(screen.queryByTestId('settings-panel')).not.toBeInTheDocument();
  });

  it('toggles a game setting', async () => {
    await renderGame();

    fireEvent.click(screen.getByRole('button', { name: 'sudoku.settings' }));
    expect(getSettingsState().settings.showErrors).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle show errors' }));

    expect(getSettingsState().settings.showErrors).toBe(false);
  });

  it('requests a shared restart when difficulty changes and applies the server state', async () => {
    await renderGame();

    fireEvent.click(screen.getByTestId('select-empty-cell'));
    fireEvent.click(screen.getByRole('button', { name: 'sudoku.settings' }));
    fireEvent.click(screen.getByTestId('set-medium'));

    expect(mocks.generateSudoku).not.toHaveBeenCalled();
    expect(screen.queryByTestId('settings-panel')).not.toBeInTheDocument();
    expect(mocks.emitted).toContainEqual({
      event: 'restart-game',
      args: ['room-1', 'medium'],
    });
    expect(mocks.emitted.filter(({ event }) => event === 'join-room')).toHaveLength(1);

    await act(async () => {
      mocks.dispatch('game-started', {
        board: testBoard,
        currentGrid: testBoard.initial.map((row) => [...row]),
        notesGrid: {},
        difficulty: 'medium',
      });
    });

    expect(getBoardState().playerGrid).toEqual(testBoard.initial);
    expect(getBoardState().selectedCell).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'sudoku.settings' }));
    expect(getSettingsState().currentDifficulty).toBe('medium');
  });

  it('shows the completion overlay and emits restart-game when play again is clicked', async () => {
    await renderGame();

    fireEvent.click(screen.getByTestId('select-empty-cell'));

    await act(async () => {
      mocks.dispatch('game-won');
    });

    expect(screen.getByText('sudoku.cleared')).toBeInTheDocument();
    expect(getBoardState().isGameWon).toBe(true);
    expect(getBoardState().selectedCell).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'sudoku.playAgain' }));

    expect(mocks.emitted).toContainEqual({
      event: 'restart-game',
      args: ['room-1', 'easy'],
    });
  });

  it('clears the completion state when a new game starts', async () => {
    await renderGame();

    await act(async () => {
      mocks.dispatch('game-won');
    });

    await act(async () => {
      mocks.dispatch('game-started', { board: testBoard, currentGrid, notesGrid: {}, difficulty: 'easy' });
    });

    expect(getBoardState().isGameWon).toBe(false);
    expect(screen.queryByText('sudoku.cleared')).not.toBeInTheDocument();
  });

  it('reports invalid placements through isValid', async () => {
    mocks.isValid.mockReturnValue(false);
    await renderGame();

    fireEvent.click(screen.getByTestId('check-invalid-placement'));

    expect(screen.getByTestId('error-result')).toHaveTextContent('true');
    expect(mocks.isValid).toHaveBeenCalledWith(
      [
        [1, 0, 0, 4],
        [0, 4, 1, 0],
        [0, 1, 4, 0],
        [4, 0, 0, 1],
      ],
      0,
      1,
      2,
      4,
      2,
    );
  });

  it('does not validate zero as an error placement', async () => {
    await renderGame();

    fireEvent.click(screen.getByTestId('check-zero-placement'));

    expect(screen.getByTestId('error-result')).toHaveTextContent('false');
    expect(mocks.isValid).not.toHaveBeenCalled();
  });

  it('removes socket event listeners when unmounted', async () => {
    const { unmount } = render(<SudokuContainer />);

    expect(mocks.listeners['game-started']).toHaveLength(1);
    expect(mocks.listeners['cell-updated']).toHaveLength(1);

    unmount();

    expect(mocks.listeners['game-started'] ?? []).toHaveLength(0);
    expect(mocks.listeners['cell-updated'] ?? []).toHaveLength(0);
    expect(mocks.listeners['player-selected-cell'] ?? []).toHaveLength(0);
    expect(mocks.listeners['player-disconnected'] ?? []).toHaveLength(0);
    expect(mocks.listeners['game-won'] ?? []).toHaveLength(0);
    expect(mocks.listeners['note-toggled'] ?? []).toHaveLength(0);
  });
});