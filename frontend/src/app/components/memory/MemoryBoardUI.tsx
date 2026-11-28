'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, RefObject } from 'react';
import type { PlayerProfile } from '@nbg/shared';
import { cn } from '@/lib/utils';
import { BOARD_TRAY, fitMemoryGrid } from '../games/boardStyles';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { MemoryCard } from './MemoryCard';
import type { MemoryCardState } from './MemoryCard';

/** A card somebody holds face up, as the page knows it: who, and how long it had left when it was told. */
export interface MemoryHeld {
  alias: string;
  closesInMs: number;
}

interface MemoryBoardUIProps {
  /** How many cards lie on the table. */
  cards: number;
  /** The drawings the server has told, by place: the cards that are matched, held or locked. A card not in it is face down. */
  faces: Record<number, number>;
  matched: ReadonlySet<number>;
  /** The cards that did not match and are still face up, locked until they turn back. */
  locked: ReadonlySet<number>;
  held: Record<number, MemoryHeld>;
  /** The cards of a pair just found: they celebrate once. */
  celebrating?: ReadonlySet<number>;
  /** The card the player tapped and the server has not answered yet. */
  pending: number | null;
  /** Who the player is in the list of the room. */
  self: string | null;
  profiles?: Record<string, PlayerProfile>;
  /** Nothing can be flipped: the game is over, or the server is not reachable. */
  disabled?: boolean;
  onFlip: (index: number) => void;
}

const NOBODY: ReadonlySet<number> = new Set();

/** The size of an element, followed as it changes. Zero until it is measured (and in a test, where nothing has a size). */
const useElementSize = (ref: RefObject<HTMLElement | null>) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      // Whole pixels: a fraction would make the grid pick again for nothing.
      setSize((current) => (current.width === Math.floor(width) && current.height === Math.floor(height) ? current : { width: Math.floor(width), height: Math.floor(height) }));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
};

export function MemoryBoardUI({ cards, faces, matched, locked, held, celebrating = NOBODY, pending, self, profiles = {}, disabled = false, onFlip }: Readonly<MemoryBoardUIProps>) {
  const { t } = useTranslation();
  const boxRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focused, setFocused] = useState(0);
  const { width, height } = useElementSize(boxRef);
  const { columns, cardWidth, gap } = fitMemoryGrid(cards, width, height);

  const stateOf = (index: number): MemoryCardState => {
    if (matched.has(index)) return 'matched';
    if (locked.has(index)) return 'locked';
    return Object.hasOwn(held, index) ? 'held' : 'hidden';
  };

  const holderOf = (index: number) => {
    if (!Object.hasOwn(held, index)) return undefined;
    const { alias, closesInMs } = held[index];
    // The list of players comes from the server: an alias is a key of it only if it really is one.
    const profile = Object.hasOwn(profiles, alias) ? profiles[alias] : undefined;
    return { color: profile?.color ?? '', animal: profile?.animal ?? alias, mine: alias === self, closesInMs };
  };

  const handleKeyDown = (event: KeyboardEvent, index: number) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns }[event.key as 'ArrowLeft'];
    if (step === undefined) return;
    event.preventDefault();
    const next = index + step;
    if (next >= 0 && next < cards) cardRefs.current[next]?.focus();
  };

  return (
    <div className="relative size-full">
      {/* What is measured has no content of its own, so that the cards cannot change the size they are laid out in. It is
          the room left once the padding of the tray is taken off: the tray then wraps the cards, with no empty felt around them. */}
      <div ref={boxRef} className="absolute inset-2.5 sm:inset-4" />
      <div className="absolute inset-0 flex items-start justify-center">
        <div className={cn(BOARD_TRAY, 'h-auto w-auto bg-[var(--memory-felt)] p-2.5 sm:p-4')}>
          {/* A fieldset is a group by itself, with no role to add; its default border, padding and minimum width go. */}
          <fieldset
            aria-label={t('memory.board')}
            data-columns={columns}
            className="m-0 flex min-w-0 flex-wrap justify-center border-0 p-0"
            style={{ width: columns * cardWidth + (columns - 1) * gap, gap }}
          >
            {Array.from({ length: cards }, (_, index) => {
              const state = stateOf(index);
              return (
                <MemoryCard
                  key={index}
                  index={index}
                  face={state === 'hidden' ? undefined : faces[index]}
                  state={state}
                  width={cardWidth}
                  pending={pending === index}
                  celebrate={celebrating.has(index)}
                  disabled={disabled}
                  holder={holderOf(index)}
                  tabIndex={focused === index ? 0 : -1}
                  buttonRef={(element) => { cardRefs.current[index] = element; }}
                  onFlip={onFlip}
                  onFocus={setFocused}
                  onKeyDown={handleKeyDown}
                />
              );
            })}
          </fieldset>
        </div>
      </div>
    </div>
  );
}
