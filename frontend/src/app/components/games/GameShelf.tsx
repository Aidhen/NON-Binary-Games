'use client';
import { useState } from 'react';
import type { GameId } from '@nbg/shared';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { cn } from '@/lib/utils';
import { BODY, CARD, HEADING, PILL } from '../site/styles';
import { GameCoverThumb } from './GameCoverThumb';
import { GamePreview } from './GamePreview';
import { GAME_GUIDES } from './guides';
import { GAMES, findGame } from './registry';

const PLAYABLE_GAMES = GAMES.filter((game) => game.status === 'available');

const GUIDE_ID = 'game-guide';

/**
 * The games in a row, like boxes on a shelf, and under them the guide of the one that was picked: what it
 * looks like and how it is played. The row never wraps: when the games do not fit (on a phone, or when
 * there are more of them) it scrolls sideways, and the box cut by the edge says that there is more.
 */
export function GameShelf() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<GameId | null>(null);

  const game = selected && findGame(selected);
  const guide = selected && GAME_GUIDES[selected];

  return (
    <div className="flex flex-col gap-5">
      {/* The padding leaves room for the shadows, which the scrolling would cut; the negative margin gives it back. */}
      <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 pt-1 sm:-mx-2 sm:px-2">
        {PLAYABLE_GAMES.map((entry, index) => (
          <li key={entry.id} className="w-36 shrink-0 snap-start md:w-auto md:min-w-44 md:flex-1">
            <button
              type="button"
              aria-expanded={entry.id === selected}
              aria-controls={GUIDE_ID}
              onClick={() => setSelected(entry.id === selected ? null : entry.id)}
              className={cn(
                "flex h-full w-full cursor-pointer flex-col items-center gap-2 rounded-[var(--radius-paper)] p-3 text-center shadow-[var(--shadow-paper)] md:gap-3 md:p-4",
                entry.id === selected ? "bg-[var(--cutout-2)]" : "bg-[var(--paper)]"
              )}
            >
              <GameCoverThumb game={entry} index={index} size={72} className="md:hidden" />
              <GameCoverThumb game={entry} index={index} size={96} className="hidden md:block" />
              <span className={cn(HEADING, "text-lg md:text-xl")}>{t(entry.titleKey)}</span>
              <span className={cn(BODY, "text-xs")}>{t(GAME_GUIDES[entry.id].taglineKey)}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Always in the page, so that the buttons above have something to point at; empty until a game is picked. */}
      <div id={GUIDE_ID}>
        {game && guide && (
          <article aria-labelledby="game-guide-title" className={cn(CARD, "flex min-w-0 flex-col gap-5 p-4 sm:p-6")}>
            <div>
              <h3 id="game-guide-title" className={cn(HEADING, "text-3xl sm:text-4xl")}>{t(game.titleKey)}</h3>
              <p className={cn(BODY, "text-base")}>{t(guide.descriptionKey)}</p>
            </div>
            <ul className="flex flex-wrap gap-2">
              {guide.factKeys.map((key) => <li key={key} className={PILL}>{t(key)}</li>)}
            </ul>
            <div className="grid gap-6 md:grid-cols-2">
              <section className="flex min-w-0 flex-col gap-2">
                <h4 className={cn(HEADING, "text-xl")}>{t('gamesPage.preview')}</h4>
                <GamePreview game={game.id} />
                <p className={cn(BODY, "text-xs")}>{t('gamesPage.previewHint')}</p>
              </section>
              <section className="flex min-w-0 flex-col gap-2">
                <h4 className={cn(HEADING, "text-xl")}>{t('gamesPage.howToPlay')}</h4>
                <ul className="flex list-disc flex-col gap-2 pl-5 text-sm font-medium text-[var(--title-text)] sm:text-base">
                  {guide.ruleKeys.map((key) => <li key={key}>{t(key)}</li>)}
                </ul>
              </section>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
