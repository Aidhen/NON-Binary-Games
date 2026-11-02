import { lazy } from 'react';
import type { MiniGame } from './types';

export const MINI_GAMES: MiniGame[] = [
  {
    id: 'garden',
    labelKey: 'minigames.garden.name',
    Component: lazy(() => import('./Garden').then((module) => ({ default: module.Garden }))),
  },
];
