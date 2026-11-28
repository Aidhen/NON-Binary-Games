'use client';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, Ref } from 'react';
import { PLAYER_COLORS } from '@nbg/shared';
import { MEMORY_FACES, MemoryCardArt } from '@nbg/art';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { AnimalHead } from '../players/AnimalHead';

export type MemoryCardState = 'hidden' | 'held' | 'locked' | 'matched';

/** Who holds a card face up: the ring and the badge on it are theirs. */
export interface MemoryHolder {
  color: string;
  animal: string;
  mine: boolean;
  /** How long the card has left in the hand when it was told, in ms (see MEMORY_HAND_MS). */
  closesInMs: number;
}

interface MemoryCardProps {
  index: number;
  /** The drawing, once the server has told it. A card is never turned on a guess. */
  face?: number;
  state: MemoryCardState;
  /** In pixels. */
  width: number;
  /** The player tapped it and the server has not answered yet. */
  pending?: boolean;
  /** The card is one of a pair that has just been found. */
  celebrate?: boolean;
  disabled?: boolean;
  holder?: MemoryHolder;
  tabIndex: number;
  buttonRef?: Ref<HTMLButtonElement>;
  onFlip: (index: number) => void;
  onFocus: (index: number) => void;
  onKeyDown: (event: KeyboardEvent, index: number) => void;
}

/** Below this the badge of the holder would hide the drawing. */
const BADGE_MIN_WIDTH = 50;
const FADE_MS = 3000;

// Four small stars that fly up from a pair that was found. The offset sideways is what makes them a handful and not a column.
const STARS = [
  { left: '12%', top: '28%', dx: '-4px', color: '#F2B544', size: 10, delay: 0 },
  { left: '82%', top: '20%', dx: '4px', color: '#FFF7E8', size: 8, delay: 60 },
  { left: '30%', top: '78%', dx: '-3px', color: '#FFF7E8', size: 9, delay: 120 },
  { left: '76%', top: '72%', dx: '5px', color: '#F2B544', size: 10, delay: 40 },
];

const ringColorOf = (color: string): string => ((PLAYER_COLORS as readonly string[]).includes(color) ? `var(--player-${color})` : 'var(--number-player)');

export function MemoryCard({ index, face, state, width, pending = false, celebrate = false, disabled = false, holder, tabIndex, buttonRef, onFlip, onFocus, onKeyDown }: Readonly<MemoryCardProps>) {
  const { t } = useTranslation();
  const isUp = face !== undefined;

  // The drawing stays for the time the card takes to turn back, then goes: a card face down holds nothing.
  const [kept, setKept] = useState(face);
  if (face !== undefined && kept !== face) setKept(face);
  useEffect(() => {
    if (face !== undefined) return;
    const timer = setTimeout(() => setKept(undefined), 450);
    return () => clearTimeout(timer);
  }, [face]);
  const drawn = face ?? kept;

  // The lift of a card in the middle of its turn: only when it turns, not when it is drawn already face up.
  const [lift, setLift] = useState<'open' | 'close' | null>(null);
  const wasUp = useRef(isUp);
  useEffect(() => {
    if (wasUp.current === isUp) return;
    wasUp.current = isUp;
    setLift(isUp ? 'open' : 'close');
  }, [isUp]);

  const faceId = isUp && Number.isInteger(face) ? MEMORY_FACES[face]?.id : undefined;
  const label = faceId ? t(`memory.cards.${faceId}.name`) : t('memory.card').replace('{n}', String(index + 1));
  const height = Math.round((width * 4) / 3);
  const ring = holder && state === 'held' ? holder : undefined;

  return (
    <button
      ref={buttonRef}
      type="button"
      tabIndex={tabIndex}
      disabled={disabled}
      aria-label={label}
      data-state={state}
      data-up={isUp}
      data-pending={pending}
      data-celebrate={celebrate}
      onClick={() => onFlip(index)}
      onFocus={() => onFocus(index)}
      onKeyDown={(event) => onKeyDown(event, index)}
      style={{ width, height }}
      className={cn(
        'memory-card relative block shrink-0 cursor-pointer select-none touch-manipulation rounded-[8%/6%] p-0 transition-transform duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-[5px] focus-visible:outline-[var(--title-text)]',
        'data-[pending=true]:rotate-2 data-[pending=true]:outline data-[pending=true]:outline-1 data-[pending=true]:outline-offset-2 data-[pending=true]:outline-[var(--subtitle-text)]',
        (state === 'matched' || state === 'locked') && 'cursor-default',
        disabled && 'cursor-default'
      )}
    >
      <span className="memory-flip block size-full" data-lift={lift ?? undefined}>
        <span className="memory-inner block">
          <span className="memory-face memory-back">
            <MemoryCardArt face="back" size={width} className="size-full" />
          </span>
          <span className="memory-face memory-front">
            {drawn !== undefined && <MemoryCardArt face={drawn} size={width} className="size-full" />}
          </span>
        </span>
      </span>

      {ring && (
        <>
          <span
            // Restarted for each hand, from what the server said was left: on a reconnect the fade starts already in its course.
            key={`${ring.closesInMs}-${index}`}
            aria-hidden="true"
            data-testid="memory-ring"
            data-mine={ring.mine}
            className="memory-ring pointer-events-none absolute inset-0 rounded-[8%/6%]"
            style={
              {
                outlineWidth: ring.mine ? 4 : 3,
                outlineStyle: ring.mine ? 'solid' : 'dashed',
                outlineColor: ringColorOf(ring.color),
                outlineOffset: 3,
                animationDelay: `${ring.closesInMs - FADE_MS}ms`,
              } satisfies CSSProperties
            }
          />
          {/* Not only a color: the animal says who holds it, when the card is big enough to carry it. */}
          {width >= BADGE_MIN_WIDTH && (
            <span data-testid="memory-badge" aria-hidden="true" className="pointer-events-none absolute -bottom-[5px] -right-[5px] rounded-full bg-[var(--paper)] p-px shadow-[var(--shadow-paper-sm)]">
              <AnimalHead animal={ring.animal} color={ring.color} className="size-[18px]" />
            </span>
          )}
        </>
      )}

      {celebrate && (
        <span aria-hidden="true" data-testid="memory-stars" className="pointer-events-none absolute inset-0">
          {STARS.map(({ left, top, dx, color, size, delay }) => (
            <svg
              key={left}
              viewBox="0 0 10 10"
              width={size}
              height={size}
              className="memory-star absolute opacity-0"
              style={{ left, top, animationDelay: `${380 + delay}ms`, '--dx': dx } as CSSProperties}
            >
              <path d="M5 0 L6.4 3.6 L10 5 L6.4 6.4 L5 10 L3.6 6.4 L0 5 L3.6 3.6 Z" fill={color} />
            </svg>
          ))}
        </span>
      )}
    </button>
  );
}
