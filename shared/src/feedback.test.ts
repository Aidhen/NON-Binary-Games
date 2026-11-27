import { describe, it, expect } from 'vitest';
import { feedbackArgsSchema } from './schemas';
import { FEEDBACK_DEVICES, FEEDBACK_FREQUENCIES, FEEDBACK_WHAT, FEEDBACK_WHERE, FEEDBACK_WISHES } from './feedback';
import { GAME_IDS } from './games';
import { EMOTES } from './emotes';

const bug = { kind: 'bug', where: 'sudoku', what: 'not-loading', device: 'phone', frequency: 'once' };
const opinion = { kind: 'opinion', where: 'whole-site', rating: 3 };

describe('feedbackArgsSchema', () => {
  it('names every game of the site as a place, next to the parts of the site that are not games', () => {
    for (const id of GAME_IDS) expect(FEEDBACK_WHERE).toContain(id);
    expect(FEEDBACK_WHERE).toEqual(expect.arrayContaining(['table', 'room-and-invite', 'rest-of-site', 'whole-site']));
  });

  it('accepts a bug with every value of every list', () => {
    for (const where of FEEDBACK_WHERE) expect(feedbackArgsSchema.safeParse({ ...bug, where }).success).toBe(true);
    for (const what of FEEDBACK_WHAT) expect(feedbackArgsSchema.safeParse({ ...bug, what }).success).toBe(true);
    for (const device of FEEDBACK_DEVICES) expect(feedbackArgsSchema.safeParse({ ...bug, device }).success).toBe(true);
    for (const frequency of FEEDBACK_FREQUENCIES) expect(feedbackArgsSchema.safeParse({ ...bug, frequency }).success).toBe(true);
  });

  it('accepts an opinion with only the required fields, and with every optional one', () => {
    expect(feedbackArgsSchema.safeParse(opinion).success).toBe(true);
    expect(feedbackArgsSchema.safeParse({ ...opinion, wishes: [...FEEDBACK_WISHES], emote: EMOTES[0] }).success).toBe(true);
    expect(feedbackArgsSchema.safeParse({ ...opinion, wishes: [] }).success).toBe(true);
  });

  it.each(['what', 'device', 'frequency', 'where'])('refuses a bug without "%s"', (field) => {
    expect(feedbackArgsSchema.safeParse(Object.fromEntries(Object.entries(bug).filter(([key]) => key !== field))).success).toBe(false);
  });

  it.each([
    ['an unknown place', { ...bug, where: 'moon' }],
    ['an unknown problem', { ...bug, what: 'it is on fire' }],
    ['an unknown device', { ...bug, device: 'fridge' }],
    ['an unknown frequency', { ...bug, frequency: 'often' }],
    ['a place written with other letters', { ...bug, where: 'Sudoku' }],
    ['a rating of 0', { ...opinion, rating: 0 }],
    ['a rating of 5', { ...opinion, rating: 5 }],
    ['a rating with decimals', { ...opinion, rating: 2.5 }],
    ['a rating as text', { ...opinion, rating: '3' }],
    ['no rating', { kind: 'opinion', where: 'sudoku' }],
    ['an unknown wish', { ...opinion, wishes: ['free pizza'] }],
    ['a wish twice', { ...opinion, wishes: ['more-games', 'more-games'] }],
    ['more wishes than there are', { ...opinion, wishes: [...FEEDBACK_WISHES, 'more-games'] }],
    ['wishes that are not a list', { ...opinion, wishes: 'more-games' }],
    ['an emote that is not one of the game', { ...opinion, emote: '🍕' }],
    ['text instead of an emote', { ...opinion, emote: 'hello' }],
    ['an unknown kind', { ...bug, kind: 'other' }],
    ['no kind', { where: 'sudoku' }],
  ])('refuses %s', (_name, body) => {
    expect(feedbackArgsSchema.safeParse(body).success).toBe(false);
  });

  it.each([
    ['a bug', bug],
    ['an opinion', opinion],
  ])('refuses a field that is not in the list, even with a valid value, in %s', (_name, body) => {
    expect(feedbackArgsSchema.safeParse({ ...body, contact: 'a@b.c' }).success).toBe(false);
    expect(feedbackArgsSchema.safeParse({ ...body, details: 'text' }).success).toBe(false);
  });

  it('refuses the fields of one kind in the other', () => {
    expect(feedbackArgsSchema.safeParse({ ...bug, rating: 3 }).success).toBe(false);
    expect(feedbackArgsSchema.safeParse({ ...opinion, frequency: 'once' }).success).toBe(false);
  });

  it.each([undefined, null, 0, 'text', true, [], [bug], () => 1])('refuses %j', (value) => {
    expect(feedbackArgsSchema.safeParse(value).success).toBe(false);
  });
});
