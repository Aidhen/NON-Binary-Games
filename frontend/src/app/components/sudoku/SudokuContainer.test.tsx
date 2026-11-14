import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SudokuContainer } from './SudokuContainer';
import { WAKING_AFTER_MS } from '@/lib/useConnectionStatus';
import { HIGHLIGHT_MS } from '@/lib/useHighlight';
import { EMOTES } from '@nbg/shared';
import type { Mock } from 'vitest';
import type { DifficultyLevel, NotesGrid } from '@nbg/shared';
import type { GameSettings } from './SudokuContainer';


type BoardMockProps = {
  onCellClick: (r: number, c: number) => void;
  isErrorPlacement: (r: number, c: number, value: number) => boolean;
  playerGrid: number[][];
  selectedCell: [number, number] | null;
  isGameWon: boolean;
  othersSelections?: Record<string, [number, number]>;
  notesGrid?: NotesGrid;
  completedNumbers?: Set<number>;
  profiles?: Record<string, unknown>;
  highlightedAlias?: string | null;
};

type SettingsPanelMockProps = {
  settings: GameSettings;
  onToggle: (key: keyof GameSettings) => void;
  currentDifficulty: DifficultyLevel;
  onDifficultyChange: (level: DifficultyLevel) => void;
};

const mocks = vi.hoisted(() => {
  type Handler = (...args: unknown[]) => void;

  type SocketMock = {
    connected: boolean;
    id: string;
    on: Mock<(event: string, handler: Handler) => SocketMock>;
    off: Mock<(event: string, handler?: Handler) => SocketMock>;
    emit: Mock<(event: string, ...args: unknown[]) => SocketMock>;
    connect: Mock<() => SocketMock>;
    disconnect: Mock<() => SocketMock>;
  };

  const listeners: Record<string, Handler[]> = {};
  const emitted: { event: string; args: unknown[] }[] = [];
  const generateSudoku = vi.fn();
  const isValid = vi.fn();
  const socket = {} as SocketMock;

  const dispatch = (event: string, ...args: unknown[]) => {
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
  socket.emit = vi.fn((event: string, ...args: unknown[]) => {
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
  SudokuBoardUI: (props: BoardMockProps) => {
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
            completedNumbers: Array.from(props.completedNumbers ?? []),
            profiles: props.profiles,
            highlightedAlias: props.highlightedAlias,
          })}
        </output>
      </div>
    );
  },
}));

vi.mock('./SettingsPanel', () => ({
  SettingsPanel: ({ settings, onToggle, currentDifficulty, onDifficultyChange }: SettingsPanelMockProps) => (
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
    render(<SudokuContainer roomId="custom-room" />);

    expect(screen.getByText('sudoku.loading')).toBeInTheDocument();
    expect(mocks.socket.connect).toHaveBeenCalledOnce();
    expect(mocks.emitted).toContainEqual({ event: 'join-room', args: ['custom-room', 'easy'] });
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
      args: [{ r: 0, c: 1 }],
    });
  });

  it('updates an editable cell and emits cell-update when a number is entered', async () => {
    await renderGame();

    fireEvent.click(screen.getByTestId('select-empty-cell'));
    fireEvent.click(screen.getByRole('button', { name: /^3$/ }));

    expect(getBoardState().playerGrid[0][1]).toBe(3);
    expect(mocks.emitted).toContainEqual({
      event: 'cell-update',
      args: [{ r: 0, c: 1, v: 3 }, expect.any(Function)],
    });
  });

  it('asks the server for the real state when a move is not applied', async () => {
    await renderGame('room-7');
    fireEvent.click(screen.getByTestId('select-empty-cell'));
    fireEvent.click(screen.getByRole('button', { name: /^3$/ }));

    const acknowledge = mocks.emitted.find(({ event }) => event === 'cell-update')!.args[1] as (result: { ok: boolean }) => void;

    acknowledge({ ok: true });
    const joinsBefore = mocks.emitted.filter(({ event }) => event === 'join-room').length;

    acknowledge({ ok: false });

    const joins = mocks.emitted.filter(({ event }) => event === 'join-room');
    expect(joins).toHaveLength(joinsBefore + 1);
    expect(joins.at(-1)!.args).toEqual(['room-7', 'easy']);
  });

  it.each([
    ['room-full', 'sudoku.roomFull'],
    ['server-full', 'sudoku.serverFull'],
    ['too-fast', 'sudoku.tooFast'],
  ])('shows why the game cannot be joined (%s)', async (reason, message) => {
    render(<SudokuContainer roomId="room-1" />);

    await act(async () => {
      mocks.dispatch('join-error', reason);
    });

    expect(screen.getByRole('alert')).toHaveTextContent(message);
    expect(screen.getByRole('link', { name: 'sudoku.backHome' })).toHaveAttribute('href', '/');
  });

  it('shows the game when it starts after a refused join', async () => {
    render(<SudokuContainer roomId="room-1" />);

    await act(async () => {
      mocks.dispatch('join-error', 'too-fast');
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await act(async () => {
      mocks.dispatch('game-started', { board: testBoard, currentGrid: currentGrid.map((row) => [...row]), notesGrid: {}, difficulty: 'easy' });
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('board-state')).toBeInTheDocument();
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
      args: [{ r: 0, c: 1, v: 3 }],
    });
    expect(mocks.emitted.some(({ event }) => event === 'cell-update')).toBe(false);
    expect(getBoardState().playerGrid[0][1]).toBe(2);
  });

  describe('delete key and notes', () => {
    const addNotes = async (...values: number[]) => {
      for (const v of values) {
        await act(async () => { mocks.dispatch('note-toggled', { r: 0, c: 1, v, alias: 'p-1' }); });
      }
    };

    const notesToggled = () => mocks.emitted.filter(({ event }) => event === 'toggle-note').map(({ args }) => args[0]);

    it('wipes all the notes of the cell in notes mode', async () => {
      await renderGame();
      fireEvent.click(screen.getByRole('button', { name: /sudoku.notesMode OFF/ }));
      fireEvent.click(screen.getByTestId('select-empty-cell'));
      await addNotes(2, 5, 7);

      fireEvent.click(screen.getByRole('button', { name: '⌫' }));

      expect(notesToggled()).toEqual([{ r: 0, c: 1, v: 2 }, { r: 0, c: 1, v: 5 }, { r: 0, c: 1, v: 7 }]);
      expect(mocks.emitted.some(({ event }) => event === 'cell-update')).toBe(false);
      expect(getBoardState().playerGrid[0][1]).toBe(2);
    });

    it('wipes the notes with Backspace too', async () => {
      await renderGame();
      fireEvent.click(screen.getByRole('button', { name: /sudoku.notesMode OFF/ }));
      fireEvent.click(screen.getByTestId('select-empty-cell'));
      await addNotes(4);

      fireEvent.keyDown(window, { key: 'Backspace', code: 'Backspace' });

      expect(notesToggled()).toEqual([{ r: 0, c: 1, v: 4 }]);
    });

    it('clears the number when the cell has no notes', async () => {
      await renderGame();
      fireEvent.click(screen.getByRole('button', { name: /sudoku.notesMode OFF/ }));
      fireEvent.click(screen.getByTestId('select-empty-cell'));

      fireEvent.click(screen.getByRole('button', { name: '⌫' }));

      expect(notesToggled()).toEqual([]);
      expect(getBoardState().playerGrid[0][1]).toBe(0);
    });

    it('only clears the number outside notes mode, and leaves the notes alone', async () => {
      await renderGame();
      fireEvent.click(screen.getByTestId('select-empty-cell'));
      await addNotes(2, 5);

      fireEvent.click(screen.getByRole('button', { name: '⌫' }));

      expect(notesToggled()).toEqual([]);
      expect(getBoardState().playerGrid[0][1]).toBe(0);
    });

    it('does not touch the notes of other cells', async () => {
      await renderGame();
      fireEvent.click(screen.getByRole('button', { name: /sudoku.notesMode OFF/ }));
      fireEvent.click(screen.getByTestId('select-empty-cell'));
      await act(async () => { mocks.dispatch('note-toggled', { r: 3, c: 3, v: 9, alias: 'p-1' }); });
      await addNotes(6);

      fireEvent.click(screen.getByRole('button', { name: '⌫' }));

      expect(notesToggled()).toEqual([{ r: 0, c: 1, v: 6 }]);
    });
  });

  it('enters a note when a number key is pressed with Shift', async () => {
    await renderGame();

    fireEvent.click(screen.getByTestId('select-empty-cell'));
    fireEvent.keyDown(window, { key: '3', code: 'Digit3', shiftKey: true });

    expect(mocks.emitted).toContainEqual({
      event: 'toggle-note',
      args: [{ r: 0, c: 1, v: 3 }],
    });
  });

  it('supports numpad keyboard input', async () => {
    await renderGame();

    fireEvent.click(screen.getByTestId('select-empty-cell'));
    fireEvent.keyDown(window, { key: 'Unidentified', code: 'Numpad3' });

    expect(mocks.emitted).toContainEqual({
      event: 'cell-update',
      args: [{ r: 0, c: 1, v: 3 }, expect.any(Function)],
    });
  });

  it('clears an editable cell when Backspace is pressed', async () => {
    await renderGame();

    fireEvent.click(screen.getByTestId('select-empty-cell'));
    fireEvent.keyDown(window, { key: 'Backspace', code: 'Backspace' });

    expect(getBoardState().playerGrid[0][1]).toBe(0);
    expect(mocks.emitted).toContainEqual({
      event: 'cell-update',
      args: [{ r: 0, c: 1, v: 0 }, expect.any(Function)],
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
      mocks.dispatch('player-selected-cell', { alias: 'player-2', r: 2, c: 3 });
    });

    expect(getBoardState().othersSelections['player-2']).toEqual([2, 3]);

    await act(async () => {
      mocks.dispatch('player-selected-cell', { alias: 'player-2', r: null, c: null });
    });

    expect(getBoardState().othersSelections['player-2']).toBeUndefined();
  });

  it('removes a disconnected player selection', async () => {
    await renderGame();

    await act(async () => {
      mocks.dispatch('player-selected-cell', { alias: 'player-2', r: 1, c: 1 });
      mocks.dispatch('player-disconnected', 'player-2');
    });

    expect(getBoardState().othersSelections['player-2']).toBeUndefined();
  });

  it('adds and removes notes received from the server', async () => {
    await renderGame();

    await act(async () => {
      mocks.dispatch('note-toggled', { r: 0, c: 1, v: 3, alias: 'player-2' });
    });

    expect(getBoardState().notesGrid['0-1']['3']).toBe('player-2');

    await act(async () => {
      mocks.dispatch('note-toggled', { r: 0, c: 1, v: 3, alias: null });
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
      args: ['medium'],
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
      args: ['easy'],
    });
  });

  it('stacks the completion overlay above the occupied cells (z-10)', async () => {
    await renderGame();

    await act(async () => {
      mocks.dispatch('game-won');
    });

    expect(screen.getByText('sudoku.cleared').closest('.absolute')).toHaveClass('z-20');
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

  it('disables the numpad buttons of the numbers that are complete on the grid', async () => {
    await renderGame();

    fireEvent.click(screen.getByTestId('select-empty-cell'));

    expect(screen.getByRole('button', { name: /^1$/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^4$/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^2$/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /^3$/ })).toBeEnabled();
  });

  it('disables a number once its last occurrence is placed and enables it again when removed', async () => {
    await renderGame();

    fireEvent.click(screen.getByTestId('select-empty-cell'));

    await act(async () => {
      mocks.dispatch('cell-updated', { r: 0, c: 2, v: 2 });
      mocks.dispatch('cell-updated', { r: 1, c: 0, v: 2 });
      mocks.dispatch('cell-updated', { r: 1, c: 3, v: 2 });
    });
    expect(screen.getByRole('button', { name: /^2$/ })).toBeDisabled();

    await act(async () => {
      mocks.dispatch('cell-updated', { r: 1, c: 3, v: 0 });
    });
    expect(screen.getByRole('button', { name: /^2$/ })).toBeEnabled();
  });

  it('colors the notes mode controls with the theme accent instead of a fixed blue', async () => {
    await renderGame();

    fireEvent.click(screen.getByRole('button', { name: /sudoku.notesMode OFF/ }));

    const toggle = screen.getByRole('button', { name: /sudoku.notesMode ON/ });
    const numpadKey = screen.getByRole('button', { name: /^3$/ });

    expect(toggle).toHaveClass('text-[var(--number-player)]', 'border-[var(--number-player)]/50');
    expect(numpadKey).toHaveClass('text-[var(--number-player)]', 'border-[var(--number-player)]/30');
    expect(toggle.className).not.toMatch(/blue/);
    expect(numpadKey.className).not.toMatch(/blue/);
  });

  it('passes the completed numbers to the board so it can hide their notes', async () => {
    await renderGame();

    expect(getBoardState().completedNumbers).toEqual([1, 4]);
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
    const { unmount } = render(<SudokuContainer roomId="custom-room" />);

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

  describe('emotes', () => {
    it('lets the player send a reaction to the others in the room', async () => {
      await renderGame();

      fireEvent.click(screen.getByRole('button', { name: EMOTES[5] }));

      expect(mocks.emitted).toContainEqual({ event: 'send-emote', args: [EMOTES[5]] });
      expect(screen.getAllByTestId('floating-emote').map((element) => element.textContent)).toEqual([EMOTES[5]]);
    });

    it('waits for the cooldown before accepting another reaction', async () => {
      await renderGame();

      fireEvent.click(screen.getByRole('button', { name: EMOTES[0] }));

      for (const button of screen.getAllByRole('button', { name: new RegExp(EMOTES.join('|')) })) {
        expect(button).toBeDisabled();
      }
    });

    it('shows the reactions sent by other players', async () => {
      await renderGame();

      await act(async () => { mocks.dispatch('emote-received', { alias: 'someone-else', emote: EMOTES[3] }); });

      expect(screen.getAllByTestId('floating-emote').map((element) => element.textContent)).toEqual([EMOTES[3]]);
      expect(mocks.emitted.some(({ event }) => event === 'send-emote')).toBe(false);
    });

    it('stops listening for reactions when unmounted', async () => {
      const { unmount } = render(<SudokuContainer roomId="custom-room" />);
      expect(mocks.listeners['emote-received']).toHaveLength(1);

      unmount();

      expect(mocks.listeners['emote-received'] ?? []).toHaveLength(0);
    });
  });

  describe('players', () => {
    const panda = { alias: 'aaaaaaaaaaaa', animal: 'panda', color: 'red' };
    const fox = { alias: 'bbbbbbbbbbbb', animal: 'fox', color: 'blue' };

    const tellPlayers = async (players = [panda, fox]) => {
      await act(async () => {
        mocks.dispatch('joined-as', panda.alias);
        mocks.dispatch('players-updated', { players });
      });
    };

    afterEach(() => {
      vi.useRealTimers();
      // The first test replaces emit to look at what is listening when the room is joined.
      mocks.socket.emit.mockImplementation((event: string, ...args: unknown[]) => {
        mocks.emitted.push({ event, args });
        return mocks.socket;
      });
    });

    it('is already listening to the players when the room is joined, because the server answers the join with them', () => {
      const listeningAtJoin: string[][] = [];
      mocks.socket.emit.mockImplementation((event: string) => {
        if (event === 'join-room') listeningAtJoin.push(Object.keys(mocks.listeners));
        return mocks.socket;
      });

      render(<SudokuContainer roomId="room-1" />);

      expect(listeningAtJoin).toHaveLength(1);
      expect(listeningAtJoin[0]).toEqual(expect.arrayContaining(['joined-as', 'players-updated']));
    });

    it('shows who is in the room above the board', async () => {
      await renderGame();

      expect(screen.queryByRole('list', { name: 'players.title' })).not.toBeInTheDocument();

      await tellPlayers();

      expect(screen.getByRole('list', { name: 'players.title' })).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    it('asks the server for the color the player picks', async () => {
      await renderGame();
      await tellPlayers();

      fireEvent.click(screen.getByRole('button', { name: 'players.nameFormat (players.you)' }));
      fireEvent.click(screen.getAllByRole('radio')[1]);

      expect(mocks.emitted).toContainEqual({ event: 'set-color', args: ['orange'] });
    });

    it('points out another player for a moment when their chip is clicked', async () => {
      vi.useFakeTimers();
      await renderGame();
      await tellPlayers();
      const chip = () => screen.getAllByRole('listitem')[1].querySelector('button')!;

      fireEvent.click(chip());
      expect(chip()).toHaveAttribute('data-highlighted', 'true');

      act(() => { vi.advanceTimersByTime(HIGHLIGHT_MS); });
      expect(chip()).not.toHaveAttribute('data-highlighted');
    });

    it('gives the board the colors of the players, and the player who is pointed out', async () => {
      vi.useFakeTimers();
      await renderGame();
      await tellPlayers();

      expect(getBoardState().profiles).toEqual({ [panda.alias]: panda, [fox.alias]: fox });
      expect(getBoardState().highlightedAlias).toBeNull();

      fireEvent.click(screen.getAllByRole('listitem')[1].querySelector('button')!);
      expect(getBoardState().highlightedAlias).toBe(fox.alias);

      act(() => { vi.advanceTimersByTime(HIGHLIGHT_MS); });
      expect(getBoardState().highlightedAlias).toBeNull();
    });

    it('forgets the players of a room when it moves to another one', async () => {
      const { rerender } = render(<SudokuContainer roomId="room-1" />);
      await act(async () => { mocks.dispatch('game-started', { board: testBoard, currentGrid, notesGrid: {}, difficulty: 'easy' }); });
      await tellPlayers();
      expect(screen.getAllByRole('listitem')).toHaveLength(2);

      rerender(<SudokuContainer roomId="room-2" />);

      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });
  });

  describe('when the server is asleep', () => {
    const connectLater = () => {
      mocks.socket.connect.mockImplementationOnce(() => mocks.socket);
      vi.useFakeTimers({ shouldAdvanceTime: true });
    };

    const serverWakesUp = async () => {
      await act(async () => {
        mocks.socket.connected = true;
        mocks.dispatch('connect');
        mocks.dispatch('game-started', {
          board: testBoard,
          currentGrid: currentGrid.map((row) => [...row]),
          notesGrid: {},
          difficulty: 'easy',
        });
      });
    };

    afterEach(() => {
      vi.useRealTimers();
    });

    it('explains why it is waiting once the server has not answered for a few seconds', async () => {
      connectLater();
      render(<SudokuContainer roomId="sleepy-room" />);

      expect(screen.getByText('sudoku.loading')).toBeInTheDocument();
      expect(screen.queryByText('loader.waking')).not.toBeInTheDocument();

      await act(async () => { vi.advanceTimersByTime(WAKING_AFTER_MS); });

      expect(screen.getByText('loader.waking')).toBeInTheDocument();
      expect(screen.getByText('loader.wakingDetails')).toBeInTheDocument();
    });

    it('goes straight to the board when the player did not touch the mini game', async () => {
      connectLater();
      render(<SudokuContainer roomId="sleepy-room" />);
      await act(async () => { vi.advanceTimersByTime(WAKING_AFTER_MS); });

      await serverWakesUp();

      expect(screen.getByTestId('board-ui')).toBeInTheDocument();
      expect(screen.queryByText('loader.ready')).not.toBeInTheDocument();
    });

    it('lets the player finish with the mini game and join when they choose', async () => {
      connectLater();
      render(<SudokuContainer roomId="sleepy-room" />);
      await act(async () => { vi.advanceTimersByTime(WAKING_AFTER_MS); });

      fireEvent.click(await screen.findByRole('button', { name: 'minigames.garden.water' }));
      await serverWakesUp();

      expect(screen.getByText('loader.ready')).toBeInTheDocument();
      expect(screen.queryByTestId('board-ui')).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'loader.join' }));

      expect(screen.getByTestId('board-ui')).toBeInTheDocument();
      expect(getBoardState().playerGrid).toEqual(currentGrid);
    });

    it('joins the room as soon as the socket connects, while the player is still in the mini game', async () => {
      connectLater();
      render(<SudokuContainer roomId="sleepy-room" />);
      await act(async () => { vi.advanceTimersByTime(WAKING_AFTER_MS); });
      expect(mocks.emitted.filter(({ event }) => event === 'join-room')).toHaveLength(0);

      await serverWakesUp();

      expect(mocks.emitted).toContainEqual({ event: 'join-room', args: ['sleepy-room', 'easy'] });
    });
  });
});