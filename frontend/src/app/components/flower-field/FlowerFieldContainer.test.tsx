import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { DifficultyLevel } from '@nbg/shared';
import { FlowerFieldContainer } from './FlowerFieldContainer';

type BoardMockProps = {
  onCellClick: (r: number, c: number) => void;
  grid: number[][];
  flags: Record<string, string>;
  mines: [number, number][];
  exploded: [number, number] | null;
  selectedCell: [number, number] | null;
  isOver: boolean;
  othersSelections?: Record<string, [number, number]>;
};

type SettingsMockProps = {
  explosive: boolean;
  canChangeExplosive: boolean;
  onToggleExplosive: () => void;
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

vi.mock('./FlowerFieldBoardUI', () => ({
  FlowerFieldBoardUI: (props: BoardMockProps) => (
    <div data-testid="board-ui">
      <button data-testid="tap-closed" onClick={() => props.onCellClick(0, 0)}>Tap a closed cell</button>
      <button data-testid="tap-open" onClick={() => props.onCellClick(0, 1)}>Tap an open cell</button>
      <output data-testid="board-state">
        {JSON.stringify({
          grid: props.grid,
          flags: props.flags,
          mines: props.mines,
          exploded: props.exploded,
          selectedCell: props.selectedCell,
          isOver: props.isOver,
          othersSelections: props.othersSelections,
        })}
      </output>
    </div>
  ),
}));

vi.mock('./FlowerFieldSettingsPanel', () => ({
  FlowerFieldSettingsPanel: ({ explosive, canChangeExplosive, onToggleExplosive, currentDifficulty, onDifficultyChange }: SettingsMockProps) => (
    <div data-testid="settings-panel">
      <output data-testid="settings-state">{JSON.stringify({ explosive, canChangeExplosive, currentDifficulty })}</output>
      <button onClick={onToggleExplosive}>Toggle lose</button>
      <button data-testid="set-hard" onClick={() => onDifficultyChange('hard')}>Set hard</button>
    </div>
  ),
}));

const closed = () => [[-1, -1, -1], [-1, -1, -1], [-1, -1, -1]];
const withOpenNumber = () => [[-1, 2, -1], [-1, -1, -1], [-1, -1, -1]];

const started = (overrides: Record<string, unknown> = {}) => ({
  game: 'flower-field',
  size: 3,
  mineCount: 1,
  difficulty: 'easy',
  explosive: false,
  grid: withOpenNumber(),
  flags: {},
  status: 'playing',
  mines: [],
  ...overrides,
});

const renderGame = async (overrides: Record<string, unknown> = {}) => {
  render(<FlowerFieldContainer roomId="room-1" />);
  await act(async () => { mocks.dispatch('game-started', started(overrides)); });
};

const boardState = () => JSON.parse(screen.getByTestId('board-state').textContent ?? '{}');
const settingsState = () => JSON.parse(screen.getByTestId('settings-state').textContent ?? '{}');
const sent = (event: string) => mocks.emitted.filter((entry) => entry.event === event).map(({ args }) => args[0]);

beforeEach(() => { mocks.reset(); });

describe('FlowerFieldContainer', () => {
  it('joins the room, and shows no field until the server sends it', () => {
    render(<FlowerFieldContainer roomId="custom-room" />);

    expect(mocks.socket.connect).toHaveBeenCalledOnce();
    expect(mocks.emitted).toContainEqual({ event: 'join-room', args: ['custom-room'] });
    expect(screen.queryByTestId('board-ui')).not.toBeInTheDocument();
  });

  it('joins at once when the socket is already connected: the server tells the field to whoever joins', () => {
    mocks.socket.connected = true;

    render(<FlowerFieldContainer roomId="custom-room" />);

    expect(mocks.socket.connect).not.toHaveBeenCalled();
    expect(mocks.emitted).toContainEqual({ event: 'join-room', args: ['custom-room'] });
  });

  it('shows the field when the game starts, with the flags and the status the server says', async () => {
    await renderGame({ flags: { '1-1': 'friend' } });

    expect(boardState()).toMatchObject({ grid: withOpenNumber(), flags: { '1-1': 'friend' }, isOver: false });
    expect(screen.getByText('flowerField.ruleMineMarks')).toBeInTheDocument();
  });

  it('ignores the start of another game', async () => {
    render(<FlowerFieldContainer roomId="room-1" />);

    await act(async () => { mocks.dispatch('game-started', { game: 'takuzu', size: 4, initial: [[0]], currentGrid: [[0]], difficulty: 'easy' }); });

    expect(screen.queryByTestId('board-ui')).not.toBeInTheDocument();
  });

  it('asks the server to open a closed cell, and tells the others where the player is', async () => {
    await renderGame();

    fireEvent.click(screen.getByTestId('tap-closed'));

    expect(sent('flower-field:reveal')).toEqual([{ r: 0, c: 0 }]);
    expect(sent('select-cell')).toEqual([{ r: 0, c: 0 }]);
    expect(boardState().selectedCell).toEqual([0, 0]);
    // Nothing is opened before the server says so.
    expect(boardState().grid).toEqual(withOpenNumber());
  });

  it('asks for a flag instead when the flag mode is on', async () => {
    await renderGame();

    fireEvent.click(screen.getByRole('button', { name: /flowerField.flagMode/ }));
    fireEvent.click(screen.getByTestId('tap-closed'));

    expect(sent('flower-field:flag')).toEqual([{ r: 0, c: 0 }]);
    expect(sent('flower-field:reveal')).toEqual([]);
  });

  it('does not ask anything for a cell that is already open', async () => {
    await renderGame();

    fireEvent.click(screen.getByTestId('tap-open'));

    expect(sent('flower-field:reveal')).toEqual([]);
    expect(sent('flower-field:flag')).toEqual([]);
    expect(sent('select-cell')).toEqual([{ r: 0, c: 1 }]);
  });

  it('opens the cells the server says, and takes the flag off a cell that opens', async () => {
    await renderGame({ grid: closed(), flags: { '2-2': 'friend', '0-0': 'friend' } });

    await act(async () => { mocks.dispatch('flower-field:updated', { cells: [{ r: 2, c: 2, v: 0 }, { r: 1, c: 2, v: 3 }] }); });

    expect(boardState().grid).toEqual([[-1, -1, -1], [-1, -1, 3], [-1, -1, 0]]);
    expect(boardState().flags).toEqual({ '0-0': 'friend' });
  });

  it('shows a cell the server marks as a mine', async () => {
    await renderGame({ grid: closed() });

    await act(async () => { mocks.dispatch('flower-field:updated', { cells: [{ r: 1, c: 1, v: -2 }] }); });

    expect(boardState().grid[1][1]).toBe(-2);
  });

  it('shows a flag when it is put, and takes it off when the server says nobody has it', async () => {
    await renderGame();

    await act(async () => { mocks.dispatch('flower-field:flagged', { r: 2, c: 0, alias: 'friend' }); });
    expect(boardState().flags).toEqual({ '2-0': 'friend' });

    await act(async () => { mocks.dispatch('flower-field:flagged', { r: 2, c: 0, alias: null }); });
    expect(boardState().flags).toEqual({});
  });

  it('shows the loss, with the mines and the one that was opened, and plays again at the same level', async () => {
    await renderGame({ explosive: true });

    await act(async () => { mocks.dispatch('flower-field:lost', { mines: [[0, 0], [2, 2]], exploded: [2, 2] }); });

    expect(screen.getByText('flowerField.lost')).toBeInTheDocument();
    expect(boardState()).toMatchObject({ isOver: true, mines: [[0, 0], [2, 2]], exploded: [2, 2] });

    fireEvent.click(screen.getByText('sudoku.playAgain'));
    expect(mocks.emitted).toContainEqual({ event: 'restart-game', args: ['easy'] });
  });

  it('shows the win when the server says so', async () => {
    await renderGame();

    await act(async () => { mocks.dispatch('game-won'); });

    expect(screen.getByText('flowerField.cleared')).toBeInTheDocument();
    expect(boardState().isOver).toBe(true);
  });

  it('asks nothing once the game is over', async () => {
    await renderGame({ status: 'lost', mines: [[0, 0]] });

    fireEvent.click(screen.getByTestId('tap-closed'));

    expect(sent('flower-field:reveal')).toEqual([]);
  });

  it('follows the option to lose that the server tells, in the settings and in the rules', async () => {
    await renderGame();
    expect(screen.getByText('flowerField.ruleMineMarks')).toBeInTheDocument();

    await act(async () => { mocks.dispatch('flower-field:mode', { explosive: true }); });

    expect(screen.getByText('flowerField.ruleMineLoses')).toBeInTheDocument();
    fireEvent.click(screen.getByText('sudoku.settings'));
    expect(settingsState().explosive).toBe(true);
  });

  it('asks for the opposite option when the player toggles it, and only offers it before the first cell is open', async () => {
    await renderGame({ grid: closed() });
    fireEvent.click(screen.getByText('sudoku.settings'));
    expect(settingsState().canChangeExplosive).toBe(true);

    fireEvent.click(screen.getByText('Toggle lose'));
    expect(sent('flower-field:set-mode')).toEqual([{ explosive: true }]);

    await act(async () => { mocks.dispatch('flower-field:updated', { cells: [{ r: 0, c: 0, v: 0 }] }); });
    expect(settingsState().canChangeExplosive).toBe(false);
  });

  it('starts a new field of the level the player picks, and closes the settings', async () => {
    await renderGame();

    fireEvent.click(screen.getByText('sudoku.settings'));
    fireEvent.click(screen.getByTestId('set-hard'));

    expect(mocks.emitted).toContainEqual({ event: 'restart-game', args: ['hard'] });
    expect(screen.queryByTestId('settings-panel')).not.toBeInTheDocument();
  });

  it('starts over when the room restarts: a new field, nobody selected', async () => {
    await renderGame();
    fireEvent.click(screen.getByTestId('tap-closed'));
    await act(async () => { mocks.dispatch('flower-field:lost', { mines: [[0, 0]], exploded: [0, 0] }); });

    await act(async () => { mocks.dispatch('game-started', started({ grid: closed(), difficulty: 'medium' })); });

    expect(boardState()).toMatchObject({ grid: closed(), selectedCell: null, isOver: false, exploded: null, mines: [] });
    expect(screen.getByText(/sudoku.medium/)).toBeInTheDocument();
  });

  it('shows where the others are, and forgets them when they leave', async () => {
    await renderGame();

    await act(async () => { mocks.dispatch('player-selected-cell', { alias: 'friend', r: 1, c: 1 }); });
    expect(boardState().othersSelections).toEqual({ friend: [1, 1] });

    await act(async () => { mocks.dispatch('player-selected-cell', { alias: 'friend', r: null, c: null }); });
    expect(boardState().othersSelections).toEqual({});

    await act(async () => { mocks.dispatch('player-selected-cell', { alias: 'friend', r: 0, c: 0 }); });
    await act(async () => { mocks.dispatch('player-disconnected', 'friend'); });
    expect(boardState().othersSelections).toEqual({});
  });

  it('stops listening when it leaves, and does not take away the listeners of the others', () => {
    const { unmount } = render(<FlowerFieldContainer roomId="room-1" />);
    const other = vi.fn();
    mocks.socket.on('game-started', other);

    unmount();

    expect(mocks.listeners['game-started']).toEqual([other]);
    for (const event of ['flower-field:updated', 'flower-field:flagged', 'flower-field:lost', 'flower-field:mode', 'game-won']) {
      expect(mocks.listeners[event] ?? []).toHaveLength(0);
    }
  });
});
