import type { ComponentType } from 'react';
import type { GameId } from '@nbg/shared';

/** What the room gives to the game it has open. */
export interface GameProps {
  roomId: string;
}

interface GameBase {
  /** Translation key of the name of the game. */
  titleKey: string;
  minPlayers: number;
  maxPlayers: number;
}

/** A game that can be voted and played: its id is one the server knows. */
export interface AvailableGame extends GameBase {
  id: GameId;
  status: 'available';
  Game: ComponentType<GameProps>;
}

/** A game that is only announced: a closed box on the table, with nothing to open yet. */
export interface SoonGame extends GameBase {
  id: string;
  status: 'soon';
}

export type GameEntry = AvailableGame | SoonGame;
