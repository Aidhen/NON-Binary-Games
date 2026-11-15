'use client';
import { useCallback, useEffect, useState } from 'react';
import type { DifficultyLevel, GameStartedPayload, WordLanguage, WordSearchCell, WordSearchFound } from '@nbg/shared';
import { WordSearchBoardUI } from './WordSearchBoardUI';
import { WordSearchSettingsPanel } from './WordSearchSettingsPanel';
import { hiddenWordOf } from './hiddenWord';
import { ServerLoader } from '../loader/ServerLoader';
import { EmoteBar } from '../emotes/EmoteBar';
import { EmoteOverlay } from '../emotes/EmoteOverlay';
import { PlayerBar } from '../players/PlayerBar';
import { GameOverCard } from '../play/GameOverCard';
import { GameToolbar } from '../play/GameToolbar';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { getSocket } from '@/lib/socket';
import { useConnectionStatus } from '@/lib/useConnectionStatus';
import { useEmotes } from '@/lib/useEmotes';
import { useHighlight } from '@/lib/useHighlight';
import { usePlayers } from '@/lib/usePlayers';
import { UNKNOWN_PLAYER_STYLE, styleOfColor } from '@/lib/playerPalette';

/** What the page knows of the puzzle. Where a word lies is only known for the words found: the server tells nothing else. */
interface Puzzle {
  size: number;
  grid: string[][];
  words: string[];
  hiddenLength: number;
  found: WordSearchFound[];
  difficulty: DifficultyLevel;
  language: WordLanguage;
  won: boolean;
}

export function WordSearchContainer({ roomId }: Readonly<{ roomId: string }>) {
  const [puzzle, setPuzzle] = useState<Puzzle>();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { t } = useTranslation();
  const { status, retry } = useConnectionStatus();
  const { emotes, sendEmote, isCoolingDown } = useEmotes();
  // Before the effect that joins the room: the server answers the join with who is in it.
  const { self, players, profiles, setColor } = usePlayers(roomId);
  const { highlighted, highlight } = useHighlight();

  const handleSelect = useCallback((from: WordSearchCell, to: WordSearchCell) => {
    getSocket().emit('word-search:select', { from, to });
  }, []);

  const handleDifficultyChange = (level: DifficultyLevel) => {
    setIsSettingsOpen(false);
    getSocket().emit('restart-game', level);
  };

  const handleLanguageChange = (language: WordLanguage) => {
    setIsSettingsOpen(false);
    getSocket().emit('word-search:set-language', { language });
  };

  useEffect(() => {
    const socket = getSocket();

    const join = () => { socket.emit('join-room', roomId); };
    const onGameStarted = (payload: GameStartedPayload) => {
      // The room can be playing another game: its start is not a puzzle for this page.
      if (payload.game !== 'word-search') return;
      setPuzzle({
        size: payload.size,
        grid: payload.grid,
        words: payload.words,
        hiddenLength: payload.hiddenLength,
        found: payload.found,
        difficulty: payload.difficulty,
        language: payload.language,
        // Somebody who joins when the last word is already found gets the whole puzzle and no `game-won`.
        won: payload.words.length > 0 && payload.found.length >= payload.words.length,
      });
    };
    // The server tells every word to everybody, the one who found it included: it can arrive twice after a reconnection.
    const onFound = (word: WordSearchFound) =>
      setPuzzle((current) => (current && !current.found.some((entry) => entry.word === word.word) ? { ...current, found: [...current.found, word] } : current));
    const onWon = () => setPuzzle((current) => (current ? { ...current, won: true } : current));

    socket.on('connect', join);
    socket.on('game-started', onGameStarted);
    socket.on('word-search:found', onFound);
    socket.on('game-won', onWon);

    // The room opened this game before this page was here: joining again is how the server tells it the puzzle.
    if (socket.connected) join();
    else socket.connect();

    return () => {
      socket.off('connect', join);
      socket.off('game-started', onGameStarted);
      socket.off('word-search:found', onFound);
      socket.off('game-won', onWon);
    };
  }, [roomId]);

  if (!puzzle) return <ServerLoader status={status} onRetry={retry} />;

  const finderOf = new Map(puzzle.found.map(({ word, alias }) => [word, alias]));
  const styleOf = (alias: string) => (Object.hasOwn(profiles, alias) ? styleOfColor(profiles[alias].color) : UNKNOWN_PLAYER_STYLE);
  const counter = { found: String(puzzle.found.length), total: String(puzzle.words.length) };
  // Worked out here from the words found, only once the game is won: the server never sends the word.
  const hidden = puzzle.won ? hiddenWordOf(puzzle.grid, puzzle.found, puzzle.words.length) : null;
  const fill = (text: string) => text.replace('{found}', counter.found).replace('{total}', counter.total);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[500px] mx-auto relative">
      <PlayerBar players={players} self={self} highlightedAlias={highlighted} onPickColor={setColor} onHighlight={highlight} />

      <GameToolbar difficulty={puzzle.difficulty} isSettingsOpen={isSettingsOpen} onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)} />

      {isSettingsOpen && (
        <WordSearchSettingsPanel
          currentDifficulty={puzzle.difficulty}
          onDifficultyChange={handleDifficultyChange}
          currentLanguage={puzzle.language}
          onLanguageChange={handleLanguageChange}
        />
      )}

      <div className="relative w-full">
        <WordSearchBoardUI
          size={puzzle.size}
          grid={puzzle.grid}
          found={puzzle.found}
          profiles={profiles}
          highlightedAlias={highlighted}
          hiddenCells={hidden?.cells}
          isOver={puzzle.won}
          onSelect={handleSelect}
        />
      </div>

      {puzzle.won && (
        <GameOverCard overlay={false} title={t('wordSearch.cleared')} message={hidden ? `${t('wordSearch.compliment')} ${t('wordSearch.revealed').replace('{word}', hidden.word)}` : t('wordSearch.compliment')} onPlayAgain={() => getSocket().emit('restart-game', puzzle.difficulty)} />
      )}

      <div className="w-full flex flex-col gap-3 mt-2">
        <EmoteBar onSend={sendEmote} disabled={isCoolingDown} />

        <div className="rounded-[var(--radius-paper)] bg-[var(--paper)] p-4 text-sm text-[var(--subtitle-text)] shadow-[var(--shadow-paper-sm)]">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-black uppercase tracking-wide text-[var(--title-text)]">{t('wordSearch.words')}</h2>
            <span className="font-black text-[var(--title-text)]" aria-label={fill(t('wordSearch.counterLabel'))}>{fill(t('wordSearch.counter'))}</span>
          </div>
          {/* One blank per letter. The letters take their place when the word is worked out. */}
          <p className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="sr-only">{hidden ? t('wordSearch.revealed').replace('{word}', hidden.word) : t('wordSearch.hidden').replace('{n}', String(puzzle.hiddenLength))}</span>
            <span aria-hidden="true">{t('wordSearch.hiddenTitle')}</span>
            <span aria-hidden="true" className="flex gap-1 font-display text-base font-black text-[var(--title-text)]">
              {Array.from({ length: puzzle.hiddenLength }, (_, i) => (
                <span key={i} data-testid="hidden-letter" className="inline-block w-4 border-b-2 border-[var(--title-text)] text-center leading-5">{hidden?.word[i] ?? ''}</span>
              ))}
            </span>
          </p>
          <ul className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs sm:text-sm" lang={puzzle.language}>
            {puzzle.words.map((word) => {
              const finder = finderOf.get(word);
              const isFound = finder !== undefined;
              return (
                <li
                  key={word}
                  className={cn(
                    "min-w-0 break-words font-display font-bold tracking-wide",
                    isFound ? cn('line-through decoration-2', styleOf(finder).text, finder === highlighted && 'motion-safe:animate-pulse') : 'text-[var(--title-text)]'
                  )}
                >
                  {word}
                  {/* The strike and the color are not the only sign. */}
                  {isFound && <span className="sr-only"> ({t('wordSearch.wordFound')})</span>}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-[var(--radius-paper)] bg-[var(--paper)] p-4 text-sm text-[var(--subtitle-text)] shadow-[var(--shadow-paper-sm)]">
          <p className="mb-2 font-black uppercase tracking-wide text-[var(--title-text)]">{t('wordSearch.rules')}</p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>{t('wordSearch.ruleFind')}</li>
            <li>{t('wordSearch.ruleDrag')}</li>
            <li>{t('wordSearch.ruleKeyboard')}</li>
          </ul>
        </div>
      </div>

      <EmoteOverlay emotes={emotes} />
    </div>
  );
}
