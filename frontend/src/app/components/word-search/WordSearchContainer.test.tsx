import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { en } from '@/locales/en';
import type { DifficultyLevel, WordLanguage, WordSearchCell, WordSearchFound } from '@nbg/shared';
import { WordSearchContainer } from './WordSearchContainer';

type BoardMockProps = {
  grid: string[][];
  found: WordSearchFound[];
  hiddenCells?: WordSearchCell[];
  isOver: boolean;
  onSelect: (from: WordSearchCell, to: WordSearchCell) => void;
};

type SettingsMockProps = {
  currentDifficulty: DifficultyLevel;
  onDifficultyChange: (level: DifficultyLevel) => void;
  currentLanguage: WordLanguage;
  onLanguageChange: (language: WordLanguage) => void;
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

// The real English strings: the counter is made of numbers that a test has to read.
vi.mock('@/lib/i18n/TranslationContext', async () => {
  const { en } = await import('@/locales/en');
  const translate = (key: string) => (key.split('.').reduce<unknown>((current, part) => (current as Record<string, unknown> | undefined)?.[part], en) as string | undefined) ?? key;
  return { useTranslation: () => ({ t: translate }) };
});

vi.mock('./WordSearchBoardUI', () => ({
  WordSearchBoardUI: (props: BoardMockProps) => (
    <div data-testid="board-ui">
      <button data-testid="select" onClick={() => props.onSelect({ r: 0, c: 0 }, { r: 0, c: 2 })}>Select</button>
      <output data-testid="board-state">{JSON.stringify({ grid: props.grid, found: props.found, hiddenCells: props.hiddenCells ?? [], isOver: props.isOver })}</output>
    </div>
  ),
}));

vi.mock('./WordSearchSettingsPanel', () => ({
  WordSearchSettingsPanel: ({ currentDifficulty, onDifficultyChange, currentLanguage, onLanguageChange }: SettingsMockProps) => (
    <div data-testid="settings-panel">
      <output data-testid="settings-state">{JSON.stringify({ currentDifficulty, currentLanguage })}</output>
      <button data-testid="set-hard" onClick={() => onDifficultyChange('hard')}>Set hard</button>
      <button data-testid="set-it" onClick={() => onLanguageChange('it')}>Set Italian</button>
    </div>
  ),
}));

const grid = [['C', 'A', 'T'], ['D', 'O', 'G'], ['E', 'G', 'G']];
const cat: WordSearchFound = { word: 'CAT', alias: 'friend', from: { r: 0, c: 0 }, to: { r: 0, c: 2 } };
const dog: WordSearchFound = { word: 'DOG', alias: 'me', from: { r: 1, c: 0 }, to: { r: 1, c: 2 } };

const started = (overrides: Record<string, unknown> = {}) => ({
  game: 'word-search',
  size: 3,
  difficulty: 'easy',
  language: 'en',
  grid,
  words: ['CAT', 'DOG', 'EGG'],
  hiddenLength: 4,
  found: [],
  ...overrides,
});

const renderGame = async (overrides: Record<string, unknown> = {}) => {
  render(<WordSearchContainer roomId="room-1" />);
  await act(async () => { mocks.dispatch('game-started', started(overrides)); });
};

const boardState = () => JSON.parse(screen.getByTestId('board-state').textContent ?? '{}');
const sent = (event: string) => mocks.emitted.filter((entry) => entry.event === event).map(({ args }) => args[0]);
const wordItem = (word: string) => screen.getByText(word, { selector: 'li' });
const players = [{ alias: 'friend', animal: 'fox', color: 'teal' }, { alias: 'me', animal: 'owl', color: 'pink' }];

beforeEach(() => { mocks.reset(); });

describe('WordSearchContainer', () => {
  it('joins the room, and shows no puzzle until the server sends it', () => {
    render(<WordSearchContainer roomId="custom-room" />);

    expect(mocks.socket.connect).toHaveBeenCalledOnce();
    expect(mocks.emitted).toContainEqual({ event: 'join-room', args: ['custom-room'] });
    expect(screen.queryByTestId('board-ui')).not.toBeInTheDocument();
  });

  it('joins at once when the socket is already connected: the server tells the puzzle to whoever joins', () => {
    mocks.socket.connected = true;

    render(<WordSearchContainer roomId="custom-room" />);

    expect(mocks.socket.connect).not.toHaveBeenCalled();
    expect(mocks.emitted).toContainEqual({ event: 'join-room', args: ['custom-room'] });
  });

  it('shows the grid and the words in the order the server sends them, with nothing found', async () => {
    await renderGame({ words: ['CAT', 'DOG', 'EGG'] });

    expect(boardState()).toMatchObject({ grid, found: [], isOver: false });
    expect(screen.getAllByRole('listitem').filter((item) => item.closest('ul[lang]')).map((item) => item.textContent)).toEqual(['CAT', 'DOG', 'EGG']);
    expect(screen.getByLabelText('0 of 3 words found')).toHaveTextContent('0/3');
  });

  it('strikes a word in the color of the player who found it, and counts it', async () => {
    await renderGame();
    await act(async () => { mocks.dispatch('players-updated', { players }); });

    await act(async () => { mocks.dispatch('word-search:found', cat); });

    expect(wordItem('CAT').className).toContain('line-through');
    expect(wordItem('CAT').className).toContain('--player-teal-text');
    expect(within(wordItem('CAT')).getByText(/found/)).toBeInTheDocument();
    expect(wordItem('DOG').className).not.toContain('line-through');
    expect(screen.getByLabelText('1 of 3 words found')).toHaveTextContent('1/3');
    expect(boardState().found).toEqual([cat]);
  });

  it('does not count the same word twice when the server tells it again', async () => {
    await renderGame();

    await act(async () => { mocks.dispatch('word-search:found', cat); });
    await act(async () => { mocks.dispatch('word-search:found', cat); });

    expect(boardState().found).toEqual([cat]);
    expect(screen.getByLabelText('1 of 3 words found')).toBeInTheDocument();
  });

  it('shows the words already found to somebody who joins late, each in the color of its finder', async () => {
    render(<WordSearchContainer roomId="room-1" />);
    await act(async () => { mocks.dispatch('players-updated', { players }); });

    await act(async () => { mocks.dispatch('game-started', started({ found: [cat, dog] })); });

    expect(wordItem('CAT').className).toContain('--player-teal-text');
    expect(wordItem('DOG').className).toContain('--player-pink-text');
    expect(wordItem('EGG').className).not.toContain('line-through');
    expect(boardState().found).toEqual([cat, dog]);
    expect(screen.getByLabelText('2 of 3 words found')).toBeInTheDocument();
    expect(boardState().isOver).toBe(false);
  });

  it('shows a found word of a player the page does not know in the color of the theme, and takes no name from the prototype', async () => {
    await renderGame({ found: [{ ...cat, alias: 'constructor' }] });

    expect(wordItem('CAT').className).toContain('--number-player');
  });

  it('shows the win to somebody who joins when the last word is already found', async () => {
    await renderGame({ found: [cat, dog, { word: 'EGG', alias: 'me', from: { r: 2, c: 0 }, to: { r: 2, c: 2 } }] });

    expect(screen.getByText(en.wordSearch.cleared)).toBeInTheDocument();
    expect(boardState().isOver).toBe(true);
  });

  it('shows one blank per letter of the hidden word while playing, and no word', async () => {
    await renderGame({ hiddenLength: 6, found: [cat] });

    expect(screen.getAllByTestId('hidden-letter')).toHaveLength(6);
    expect(screen.getByText('Hidden word: 6 letters')).toBeInTheDocument();
    expect(screen.queryByText(/The hidden word was/)).not.toBeInTheDocument();
    expect(boardState().hiddenCells).toEqual([]);
  });

  it('does not work the word out while a word is missing', async () => {
    await renderGame({ found: [cat, dog] });

    expect(boardState().hiddenCells).toEqual([]);
    expect(screen.queryByText(/The hidden word was/)).not.toBeInTheDocument();
  });

  it('does not reveal anything when the win arrives but a word is not found', async () => {
    await renderGame({ found: [cat, dog] });
    await act(async () => { mocks.dispatch('game-won'); });

    expect(boardState().hiddenCells).toEqual([]);
    expect(screen.queryByText(/The hidden word was/)).not.toBeInTheDocument();
  });

  it('reveals the hidden word, from the cells no word covers, when the last word is found', async () => {
    // EGG is marked on its first two cells only: the last cell of the row is covered by no word.
    const egg: WordSearchFound = { word: 'EGG', alias: 'me', from: { r: 2, c: 0 }, to: { r: 2, c: 1 } };
    await renderGame({ hiddenLength: 1, found: [cat, dog] });

    await act(async () => { mocks.dispatch('word-search:found', egg); });
    await act(async () => { mocks.dispatch('game-won'); });

    expect(boardState().hiddenCells).toEqual([{ r: 2, c: 2 }]);
    expect(screen.getByText(/together\. The hidden word was G$/)).toBeInTheDocument();
    expect(screen.getAllByTestId('hidden-letter')[0]).toHaveTextContent('G');
  });

  it('reveals the hidden word to somebody who joins when every word is already found', async () => {
    const egg: WordSearchFound = { word: 'EGG', alias: 'me', from: { r: 2, c: 0 }, to: { r: 2, c: 1 } };

    await renderGame({ hiddenLength: 1, found: [cat, dog, egg] });

    expect(boardState().hiddenCells).toEqual([{ r: 2, c: 2 }]);
    expect(screen.getByText(/together\. The hidden word was G$/)).toBeInTheDocument();
  });

  it('hides the word again when a new puzzle starts', async () => {
    const egg: WordSearchFound = { word: 'EGG', alias: 'me', from: { r: 2, c: 0 }, to: { r: 2, c: 1 } };
    await renderGame({ hiddenLength: 1, found: [cat, dog, egg] });

    await act(async () => { mocks.dispatch('game-started', started({ hiddenLength: 4 })); });

    expect(boardState().hiddenCells).toEqual([]);
    expect(screen.getAllByTestId('hidden-letter')).toHaveLength(4);
    expect(screen.queryByText(/The hidden word was/)).not.toBeInTheDocument();
  });

  it('puts the words to find right under the grid, above the emotes, and the rules last', async () => {
    await renderGame();

    const words = screen.getByText(en.wordSearch.words);
    const emotes = screen.getByRole('group', { name: en.emotes.title });
    expect(words.compareDocumentPosition(emotes) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(emotes.compareDocumentPosition(screen.getByText(en.wordSearch.rules)) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('ignores the start of another game', async () => {
    render(<WordSearchContainer roomId="room-1" />);

    await act(async () => { mocks.dispatch('game-started', { game: 'takuzu', size: 4, initial: [[0]], currentGrid: [[0]], difficulty: 'easy' }); });

    expect(screen.queryByTestId('board-ui')).not.toBeInTheDocument();
  });

  it('keeps the puzzle it has when the room starts another game', async () => {
    await renderGame();

    await act(async () => { mocks.dispatch('game-started', { game: 'takuzu', size: 4, initial: [[0]], currentGrid: [[0]], difficulty: 'easy' }); });

    expect(boardState().grid).toEqual(grid);
  });

  it('sends the line the player marks, and shows nothing until the server says it is a word', async () => {
    await renderGame();

    fireEvent.click(screen.getByTestId('select'));

    expect(sent('word-search:select')).toEqual([{ from: { r: 0, c: 0 }, to: { r: 0, c: 2 } }]);
    expect(boardState().found).toEqual([]);
    expect(wordItem('CAT').className).not.toContain('line-through');
  });

  it('shows the win when the server says so, and plays again at the same level', async () => {
    await renderGame({ difficulty: 'medium' });

    await act(async () => { mocks.dispatch('game-won'); });

    expect(screen.getByText(en.wordSearch.cleared)).toBeInTheDocument();
    expect(boardState().isOver).toBe(true);
    fireEvent.click(screen.getByText(en.sudoku.playAgain));
    expect(mocks.emitted).toContainEqual({ event: 'restart-game', args: ['medium'] });
  });

  it('starts a new puzzle of the level the player picks, and closes the settings', async () => {
    await renderGame();

    fireEvent.click(screen.getByText(en.sudoku.settings));
    fireEvent.click(screen.getByTestId('set-hard'));

    expect(sent('restart-game')).toEqual(['hard']);
    expect(screen.queryByTestId('settings-panel')).not.toBeInTheDocument();
  });

  it('asks for the language the player picks, and closes the settings', async () => {
    await renderGame();

    fireEvent.click(screen.getByText(en.sudoku.settings));
    fireEvent.click(screen.getByTestId('set-it'));

    expect(sent('word-search:set-language')).toEqual([{ language: 'it' }]);
    expect(screen.queryByTestId('settings-panel')).not.toBeInTheDocument();
  });

  it('gives the settings the level and the language the server says', async () => {
    await renderGame({ difficulty: 'hard', language: 'it' });

    fireEvent.click(screen.getByText(en.sudoku.settings));

    expect(JSON.parse(screen.getByTestId('settings-state').textContent ?? '{}')).toEqual({ currentDifficulty: 'hard', currentLanguage: 'it' });
  });

  it('starts over when the server sends a new puzzle: new words, nothing found, no win', async () => {
    await renderGame({ found: [cat] });
    await act(async () => { mocks.dispatch('game-won'); });

    await act(async () => { mocks.dispatch('game-started', started({ words: ['BEE', 'ANT'], grid: [['B']], language: 'it' })); });

    expect(screen.queryByText(en.wordSearch.cleared)).not.toBeInTheDocument();
    expect(boardState()).toMatchObject({ found: [], isOver: false, grid: [['B']] });
    expect(screen.getByText('BEE', { selector: 'li' })).toBeInTheDocument();
    expect(screen.queryByText('CAT', { selector: 'li' })).not.toBeInTheDocument();
  });

  it('stops listening when it leaves, and does not take away the listeners of the others', () => {
    const { unmount } = render(<WordSearchContainer roomId="room-1" />);
    const other = vi.fn();
    mocks.socket.on('game-started', other);

    unmount();

    expect(mocks.listeners['game-started']).toEqual([other]);
    for (const event of ['word-search:found', 'game-won']) expect(mocks.listeners[event] ?? []).toHaveLength(0);
  });
});
