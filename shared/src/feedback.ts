import { GAME_IDS } from './games';

/**
 * What the feedback form can say: closed lists, and nothing else. There is no free text on purpose (see CLAUDE.md):
 * the server builds what it files from these values, so what a person writes can never reach the tracker.
 * The ids are stable English words; the texts people read are in the translations of the frontend.
 */
export const FEEDBACK_WHERE = [...GAME_IDS, 'table', 'room-and-invite', 'rest-of-site', 'whole-site'] as const;

export const FEEDBACK_WHAT = ['not-loading', 'moves-not-shared', 'connection-drops', 'looks-wrong', 'controls-not-responding', 'rules-or-win-wrong', 'text-or-translation', 'other'] as const;

export const FEEDBACK_DEVICES = ['phone', 'tablet', 'computer'] as const;

export const FEEDBACK_FREQUENCIES = ['once', 'sometimes', 'always'] as const;

export const FEEDBACK_WISHES = ['more-games', 'more-levels', 'more-languages', 'themes-and-colors', 'public-rooms', 'fine-as-is'] as const;

/** From 1 (does not like it) to 4 (loves it). */
export const FEEDBACK_RATINGS = [1, 2, 3, 4] as const;

export type FeedbackWhere = (typeof FEEDBACK_WHERE)[number];
export type FeedbackWhat = (typeof FEEDBACK_WHAT)[number];
export type FeedbackDevice = (typeof FEEDBACK_DEVICES)[number];
export type FeedbackFrequency = (typeof FEEDBACK_FREQUENCIES)[number];
export type FeedbackWish = (typeof FEEDBACK_WISHES)[number];
