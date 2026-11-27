import { EMOTES } from '@nbg/shared';
import type { FeedbackArgs, FeedbackDevice, FeedbackFrequency, FeedbackWhat, FeedbackWhere, FeedbackWish } from '@nbg/shared';

/**
 * Everything that is written in the tracker comes from here. A report is a handful of values from closed lists
 * (see `shared/src/feedback.ts`): each one is turned into a fixed English text, and nothing of the request is
 * copied as it came. The records are complete on purpose: a value added to a list without its text does not compile.
 */
const WHERE: Record<FeedbackWhere, string> = {
  'sudoku': 'Sudoku',
  'takuzu': 'Takuzu',
  'flower-field': 'Flower Field',
  'word-search': 'Word Search',
  'memory': 'Memory',
  'table': 'The table (choosing a game)',
  'room-and-invite': 'Rooms and invitations',
  'rest-of-site': 'The rest of the site',
  'whole-site': 'The whole site',
};

const WHAT: Record<FeedbackWhat, string> = {
  'not-loading': 'Does not load',
  'moves-not-shared': 'Moves are not shared with the others',
  'connection-drops': 'The connection drops',
  'looks-wrong': 'Looks wrong',
  'controls-not-responding': 'Controls do not respond',
  'rules-or-win-wrong': 'The rules or the win are wrong',
  'text-or-translation': 'Text or translation',
  'other': 'Something else',
};

const DEVICE: Record<FeedbackDevice, string> = { phone: 'Phone', tablet: 'Tablet', computer: 'Computer' };

const FREQUENCY: Record<FeedbackFrequency, string> = { once: 'It happened once', sometimes: 'It happens sometimes', always: 'It happens every time' };

const WISH: Record<FeedbackWish, string> = {
  'more-games': 'More games',
  'more-levels': 'More levels',
  'more-languages': 'More languages',
  'themes-and-colors': 'Themes and colors',
  'public-rooms': 'Public rooms',
  'fine-as-is': 'Fine as it is',
};

const RATING = ['', 'Does not like it', 'Not convinced', 'Likes it', 'Loves it'];

export type FeedbackLabel = 'bug' | 'opinion';

/** One issue per combination: reports that answer the same way end up under the same title. */
export const issueOf = (report: FeedbackArgs): { title: string; label: FeedbackLabel; body: string } =>
  report.kind === 'bug'
    ? {
      title: `Bug: ${WHERE[report.where]} - ${WHAT[report.what]} - ${DEVICE[report.device]}`,
      label: 'bug',
      body: 'Reports of the same problem, on the same device, from the feedback form. Each report is a comment below.',
    }
    : {
      title: `Opinion: ${WHERE[report.where]}`,
      label: 'opinion',
      body: 'Opinions about the same part of the site, from the feedback form. Each report is a comment below.',
    };

export const commentOf = (report: FeedbackArgs): string => {
  if (report.kind === 'bug') return FREQUENCY[report.frequency];

  const lines = [`Rating: ${report.rating} of 4 (${RATING[report.rating]})`];
  if (report.wishes?.length) lines.push(`Wishes: ${report.wishes.map((wish) => WISH[wish]).join(', ')}`);
  // Looked up in the list of the game, so that what is written is the game's own value and not the request's.
  const emote = EMOTES.find((candidate) => candidate === report.emote);
  if (emote) lines.push(`Emote: ${emote}`);
  return lines.join('\n');
};
