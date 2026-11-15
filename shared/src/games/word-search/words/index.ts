import type { WordLanguage } from '../types';
import { EN_WORDS } from './en';
import { IT_WORDS } from './it';

export const WORDS: Record<WordLanguage, readonly string[]> = { en: EN_WORDS, it: IT_WORDS };
