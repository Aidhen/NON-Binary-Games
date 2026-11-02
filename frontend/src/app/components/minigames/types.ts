import type { ComponentType } from 'react';

export interface MiniGameProps {
  onPlay?: () => void;
}

export interface MiniGame {
  id: string;
  labelKey: string;
  Component: ComponentType<MiniGameProps>;
}
