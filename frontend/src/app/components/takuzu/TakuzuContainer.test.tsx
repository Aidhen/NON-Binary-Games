import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { DifficultyLevel } from '@nbg/shared';
import { TakuzuContainer } from './TakuzuContainer';

type BoardMockProps = {
  onCellClick: (r: number, c: number) => void;
  grid: number[][];
  selectedCell: [number, number] | null;
  conflicts: Set<string>;
  isGameWon: boolean;
  othersSelections?: Record<string, [number, number]>;
};

type SettingsMockProps = {
  showErrors: boolean;
  onToggleErrors: () => void;
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
  };

  const listeners: Record<string, Handler[]> = {};
  const emitted: { event: string; args: unknown[] }[] = [];
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

  const reset = () => {
    Object.keys(listeners).forEach((event) => delete listeners[event]);
    emitted.length = 0;
    socket.connected = false;
    socket.on.mockClear();
    socket.off.mockClear();
    socket.emit.mockClear();
    socket.connect.mockClear();
  };

  return { socket, listeners, emitted, dispatch, reset };
});

vi.mock('@/lib/socket', () => ({ getSocket: () => mocks.socket }));

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('./TakuzuBoardUI', () => ({
  TakuzuBoardUI: (props: BoardMockProps) => (
    <div data-testid="board-ui">
      <button data-testid="tap-empty" onClick={() => props.onCellClick(0, 1)}>Tap an empty cell</button>
      <button data-testid="tap-given" onClick={() => props.onCellClick(0, 0)}>Tap a given cell</button>
      <output data-testid="board-state">
        {JSON.stringify({
          grid: props.grid,
          selectedCell: props.selectedCell,
          conflicts: [...props.conflicts],
          isGameWon: props.isGameWon,
          othersSelections: props.othersSelections,
        })}
      </output>
    </div>
  ),
}));

vi.mock('./TakuzuSettingsPanel', () => ({
  TakuzuSettingsPanel: ({ showErrors, onToggleErrors, currentDifficulty, onDifficultyChange }: SettingsMockProps) => (
    <div data-testid="settings-panel">
      <output data-testid="settings-state">{JSON.stringify({ showErrors, currentDifficulty })}</output>
      <button onClick={onToggleErrors}>Toggle errors</button>
      <button data-testid="set-hard" onClick={() => onDifficultyChange('hard')}>Set hard</button>
    </div>
  ),
}));

const initial = [
  [1, 0, 0, 2],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [2, 0, 0, 0],
];

const started = (overrides: Record<string, unknown> = {}) => ({
  game: 'takuzu',
  size: 4,
  initial,
  currentGrid: initial.map((row) => [...row]),
  difficulty: 'easy',
  ...overrides,
});

const renderGame = async (roomId = 'room-1') => {
  render(<TakuzuContainer roomId={roomId} />);
  await act(async () => { mocks.dispatch('game-started', started()); });
};

const boardState = () => JSON.parse(screen.getByTestId('board-state').textContent ?? '{}');

/** What the page sent to the server about the cells, in order. */
const cellUpdates = () => mocks.emitted.filter(({ event }) => event === 'cell-update').map(({ args }) => args[0]);

beforeEach(() => { mocks.reset(); });

describe('TakuzuContainer', () => {
  it('joins the room, and shows no grid until the server sends it', () => {
    render(<TakuzuContainer roomId="custom-room" />);

    expect(mocks.socket.connect).toHaveBeenCalledOnce();
    expect(mocks.emitted).toContainEqual({ event: 'join-room', args: ['custom-room'] });
    expect(screen.queryByTestId('board-ui')).not.toBeInTheDocument();
  });

  it('joins the room at once when the socket is already connected: the server tells the grid to whoever joins', () => {
    mocks.socket.connected = true;

    render(<TakuzuContainer roomId="custom-room" />);

    expect(mocks.socket.connect).not.toHaveBeenCalled();
    expect(mocks.emitted).toContainEqual({ event: 'join-room', args: ['custom-room'] });
  });

  it('shows the grid when the Takuzu starts', async () => {
    await renderGame();

    expect(boardState().grid).toEqual(initial);
    expect(screen.getByText('takuzu.ruleBalance')).toBeInTheDocument();
  });

  it('ignores the start of another game', async () => {
    render(<TakuzuContainer roomId="room-1" />);

    await act(async () => { mocks.dispatch('game-started', { game: 'sudoku', board: {}, currentGrid: [[1]], notesGrid: {}, difficulty: 'easy' }); });

    expect(screen.queryByTestId('board-ui')).not.toBeInTheDocument();
  });

  it('goes from empty to the first symbol, to the second, and back to empty with each tap', async () => {
    await renderGame();

    for (const expected of [1, 2, 0]) {
      fireEvent.click(screen.getByTestId('tap-empty'));
      expect(boardState().grid[0][1]).toBe(expected);
    }

    expect(cellUpdates()).toEqual([{ r: 0, c: 1, v: 1 }, { r: 0, c: 1, v: 2 }, { r: 0, c: 1, v: 0 }]);
  });

  it('shows the others where the player is when they tap', async () => {
    await renderGame();

    fireEvent.click(screen.getByTestId('tap-empty'));

    expect(mocks.emitted).toContainEqual({ event: 'select-cell', args: [{ r: 0, c: 1 }] });
    expect(boardState().selectedCell).toEqual([0, 1]);
  });

  it('selects a cell the puzzle gave, but does not try to change it', async () => {
    await renderGame();

    fireEvent.click(screen.getByTestId('tap-given'));

    expect(boardState().selectedCell).toEqual([0, 0]);
    expect(boardState().grid).toEqual(initial);
    expect(cellUpdates()).toEqual([]);
  });

  it('asks for the real state when the server does not apply a move', async () => {
    await renderGame();

    fireEvent.click(screen.getByTestId('tap-empty'));
    const acknowledge = mocks.emitted.find(({ event }) => event === 'cell-update')?.args[1] as (result: { ok: boolean }) => void;
    mocks.emitted.length = 0;

    acknowledge({ ok: true });
    expect(mocks.emitted).toEqual([]);

    acknowledge({ ok: false });
    expect(mocks.emitted).toContainEqual({ event: 'join-room', args: ['room-1'] });
  });

  it('writes the symbol of a key in the selected cell, and empties it with delete', async () => {
    await renderGame();
    fireEvent.click(screen.getByTestId('tap-empty'));

    fireEvent.keyDown(window, { key: '1' });
    expect(boardState().grid[0][1]).toBe(2);

    fireEvent.keyDown(window, { key: '0' });
    expect(boardState().grid[0][1]).toBe(1);

    fireEvent.keyDown(window, { key: 'Backspace' });
    expect(boardState().grid[0][1]).toBe(0);
  });

  it('does not write with a key when nothing is selected, or with a shortcut', async () => {
    await renderGame();

    fireEvent.keyDown(window, { key: '1' });
    expect(cellUpdates()).toEqual([]);

    fireEvent.click(screen.getByTestId('tap-given'));
    fireEvent.click(screen.getByTestId('tap-empty'));
    mocks.emitted.length = 0;
    fireEvent.keyDown(window, { key: '1', ctrlKey: true });
    expect(cellUpdates()).toEqual([]);
  });

  it('does not write a key in a cell the puzzle gave', async () => {
    await renderGame();
    fireEvent.click(screen.getByTestId('tap-given'));

    fireEvent.keyDown(window, { key: '1' });

    expect(cellUpdates()).toEqual([]);
    expect(boardState().grid[0][0]).toBe(1);
  });

  it('shows what the others write, and where they are', async () => {
    await renderGame();

    await act(async () => { mocks.dispatch('cell-updated', { r: 2, c: 3, v: 2 }); });
    await act(async () => { mocks.dispatch('player-selected-cell', { alias: 'friend', r: 1, c: 1 }); });

    expect(boardState().grid[2][3]).toBe(2);
    expect(boardState().othersSelections).toEqual({ friend: [1, 1] });

    await act(async () => { mocks.dispatch('player-selected-cell', { alias: 'friend', r: null, c: null }); });
    expect(boardState().othersSelections).toEqual({});

    await act(async () => { mocks.dispatch('player-selected-cell', { alias: 'friend', r: 0, c: 0 }); });
    await act(async () => { mocks.dispatch('player-disconnected', 'friend'); });
    expect(boardState().othersSelections).toEqual({});
  });

  it('shows the clashes of the rules, and hides them when the player asks to', async () => {
    await renderGame();
    await act(async () => { mocks.dispatch('cell-updated', { r: 1, c: 0, v: 1 }); });
    await act(async () => { mocks.dispatch('cell-updated', { r: 1, c: 1, v: 1 }); });
    await act(async () => { mocks.dispatch('cell-updated', { r: 1, c: 2, v: 1 }); });

    expect(boardState().conflicts).toEqual(expect.arrayContaining(['1-0', '1-1', '1-2']));

    fireEvent.click(screen.getByText('sudoku.settings'));
    fireEvent.click(screen.getByText('Toggle errors'));

    expect(boardState().conflicts).toEqual([]);
  });

  it('shows the cleared message when the server says so, and plays again at the same level', async () => {
    await renderGame();

    await act(async () => { mocks.dispatch('game-won'); });

    expect(screen.getByText('takuzu.cleared')).toBeInTheDocument();
    expect(boardState().isGameWon).toBe(true);

    fireEvent.click(screen.getByText('sudoku.playAgain'));
    expect(mocks.emitted).toContainEqual({ event: 'restart-game', args: ['easy'] });
  });

  it('does not take a move once the puzzle is solved', async () => {
    await renderGame();
    await act(async () => { mocks.dispatch('game-won'); });

    fireEvent.click(screen.getByTestId('tap-empty'));

    expect(cellUpdates()).toEqual([]);
  });

  it('starts a new grid of the level the player picks', async () => {
    await renderGame();

    fireEvent.click(screen.getByText('sudoku.settings'));
    fireEvent.click(screen.getByTestId('set-hard'));

    expect(mocks.emitted).toContainEqual({ event: 'restart-game', args: ['hard'] });
    expect(screen.queryByTestId('settings-panel')).not.toBeInTheDocument();
  });

  it('starts over when the room restarts: a clean grid, nobody selected, not solved', async () => {
    await renderGame();
    fireEvent.click(screen.getByTestId('tap-empty'));
    await act(async () => { mocks.dispatch('game-won'); });

    await act(async () => { mocks.dispatch('game-started', started({ difficulty: 'medium' })); });

    expect(boardState().grid).toEqual(initial);
    expect(boardState().selectedCell).toBeNull();
    expect(boardState().isGameWon).toBe(false);
    expect(screen.getByText(/sudoku.medium/)).toBeInTheDocument();
  });

  it('stops listening when it leaves, and does not take away the listeners of the others', async () => {
    const { unmount } = render(<TakuzuContainer roomId="room-1" />);
    const other = vi.fn();
    mocks.socket.on('game-started', other);

    unmount();

    expect(mocks.listeners['game-started']).toEqual([other]);
    expect(mocks.listeners['game-won'] ?? []).toHaveLength(0);
    expect(mocks.listeners['cell-updated'] ?? []).toHaveLength(0);
  });
});
