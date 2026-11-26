import { describe, it, expect, afterEach, vi } from 'vitest';
import type { FeedbackArgs } from '@nbg/shared';
import { ALERT_TITLE, createGithubTracker, filingLimit, githubConfigFromEnv, MAX_QUEUED_REPORTS } from './githubTracker';
import { logger } from '../logger';

const TOKEN = 'ghp_secret_token_value';
const config = { token: TOKEN, repo: 'owner/private-feedback' };

const bug: FeedbackArgs = { kind: 'bug', where: 'sudoku', what: 'moves-not-shared', device: 'phone', frequency: 'sometimes' };
const opinion: FeedbackArgs = { kind: 'opinion', where: 'word-search', rating: 4, wishes: ['more-games', 'public-rooms'], emote: '💜' };

interface Call { method: string; path: string; body?: Record<string, unknown>; headers: Record<string, string> }

/** A small GitHub: it keeps the issues that are created, and answers the three calls the tracker makes. */
const fakeGithub = (options: { open?: { number: number; title: string; pull_request?: object }[]; gate?: Promise<void>; status?: number } = {}) => {
  const calls: Call[] = [];
  const issues = [...(options.open ?? [])];
  const states = new Map<number, string>();
  let next = 100;

  const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    await options.gate;
    const path = String(url).replace('https://api.github.com/repos/owner/private-feedback', '');
    const method = init?.method ?? 'GET';
    calls.push({ method, path, body: init?.body ? JSON.parse(init.body as string) : undefined, headers: init?.headers as Record<string, string> });
    if (options.status) return new Response('{}', { status: options.status });

    if (method === 'POST' && path === '/issues') {
      const issue = { number: next++, title: calls.at(-1)!.body!.title as string };
      issues.push(issue);
      return new Response(JSON.stringify({ number: issue.number }), { status: 201 });
    }
    if (method === 'POST') return new Response('{}', { status: 201 });
    const single = /^\/issues\/(\d+)$/.exec(path);
    if (single) {
      const issue = issues.find((candidate) => candidate.number === Number(single[1]));
      return issue ? new Response(JSON.stringify({ ...issue, state: states.get(issue.number) ?? 'open' }), { status: 200 }) : new Response('{}', { status: 404 });
    }
    return new Response(JSON.stringify(issues), { status: 200 });
  });
  return { calls, fetchImpl, issues, close: (number: number) => states.set(number, 'closed') };
};

const tracker = (github: ReturnType<typeof fakeGithub>) => createGithubTracker(config, github.fetchImpl as unknown as typeof fetch);

afterEach(() => { vi.restoreAllMocks(); filingLimit.deadlineMs = 20_000; });

describe('createGithubTracker', () => {
  it('opens an issue for a combination nobody reported yet, and adds the report as a comment', async () => {
    const github = fakeGithub();

    expect(await tracker(github).file(bug)).toBe('filed');

    const [list, create, comment] = github.calls;
    expect(list.path).toBe('/issues?state=open&per_page=100&page=1');
    expect(create).toMatchObject({ method: 'POST', path: '/issues', body: { title: 'Bug: Sudoku - Moves are not shared with the others - Phone', labels: ['bug'] } });
    expect(comment).toMatchObject({ method: 'POST', path: '/issues/100/comments', body: { body: 'It happens sometimes' } });
  });

  it('only sends the token to the API, with the usual headers', async () => {
    const github = fakeGithub();
    await tracker(github).file(bug);

    for (const [url] of github.fetchImpl.mock.calls) expect(String(url).startsWith('https://api.github.com/repos/owner/private-feedback/')).toBe(true);
    expect(github.calls[0].headers).toMatchObject({ 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' });
    expect(github.fetchImpl.mock.calls[0][1]).toMatchObject({ redirect: 'error' });
  });

  it('writes an opinion with its rating, wishes and emote, all from fixed texts', async () => {
    const github = fakeGithub();
    await tracker(github).file(opinion);

    expect(github.calls[1].body).toMatchObject({ title: 'Opinion: Word Search', labels: ['opinion'] });
    expect(github.calls[2].body).toEqual({ body: 'Rating: 4 of 4 (Loves it)\nWishes: More games, Public rooms\nEmote: 💜' });
  });

  it('leaves out the wishes and the emote of an opinion that has none', async () => {
    const github = fakeGithub();
    await tracker(github).file({ kind: 'opinion', where: 'whole-site', rating: 1 });

    expect(github.calls[2].body).toEqual({ body: 'Rating: 1 of 4 (Does not like it)' });
  });

  it('comments on the open issue that has exactly the same title, and opens nothing', async () => {
    const github = fakeGithub({ open: [
      { number: 5, title: 'Bug: Sudoku - Moves are not shared with the others - Computer' },
      { number: 6, title: 'Bug: Sudoku - Moves are not shared with the others - Phone', pull_request: {} },
      { number: 7, title: 'Bug: Sudoku - Moves are not shared with the others - Phone' },
    ] });

    expect(await tracker(github).file(bug)).toBe('filed');

    expect(github.calls.some((call) => call.path === '/issues' && call.method === 'POST')).toBe(false);
    expect(github.calls.at(-1)!.path).toBe('/issues/7/comments');
  });

  it('finds the issue by its title alone, even when it has no label', async () => {
    const github = fakeGithub({ open: [{ number: 7, title: 'Bug: Sudoku - Moves are not shared with the others - Phone' }] });

    await tracker(github).file(bug);

    expect(github.calls.some((call) => call.path.includes('labels='))).toBe(false);
    expect(github.calls.at(-1)).toMatchObject({ method: 'POST', path: '/issues/7/comments' });
    expect(github.issues).toHaveLength(1);
  });

  it('writes an alert as a comment on one fixed issue, the same issue each time', async () => {
    const github = fakeGithub();
    const filer = tracker(github);

    filer.alert('bugs');
    await filer.file(opinion);
    filer.alert('reports');
    await filer.file(opinion);

    const opened = github.calls.filter((call) => call.method === 'POST' && call.path === '/issues');
    expect(opened.map((call) => call.body!.title)).toEqual([ALERT_TITLE, 'Opinion: Word Search']);
    const alerts = github.calls.filter((call) => call.path === '/issues/100/comments');
    expect(alerts).toHaveLength(2);
    expect(String(alerts[0].body!.body)).toContain('bug reports');
  });

  it('drops a report whose time is over before it is filed, and calls nobody for it', async () => {
    const github = fakeGithub();
    filingLimit.deadlineMs = 0;
    vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

    expect(await tracker(github).file(bug)).toBe('failed');
    expect(github.fetchImpl).not.toHaveBeenCalled();
  });

  it('remembers the issue, and checks that it is still open before it comments', async () => {
    const github = fakeGithub();
    const filing = tracker(github);
    await filing.file(bug);
    github.calls.length = 0;

    await filing.file(bug);

    expect(github.calls.map((call) => `${call.method} ${call.path}`)).toEqual(['GET /issues/100', 'POST /issues/100/comments']);
  });

  it('opens a new issue when the owner closed the one it remembered', async () => {
    const github = fakeGithub();
    const filing = tracker(github);
    await filing.file(bug);
    github.close(100);
    github.issues.length = 0;
    github.calls.length = 0;

    expect(await filing.file(bug)).toBe('filed');

    expect(github.calls.some((call) => call.method === 'POST' && call.path === '/issues')).toBe(true);
    expect(github.calls.at(-1)!.path).toBe('/issues/101/comments');
  });

  it('opens one issue, not two, for two equal reports that arrive together', async () => {
    const github = fakeGithub();
    const filing = tracker(github);

    expect(await Promise.all([filing.file(bug), filing.file(bug)])).toEqual(['filed', 'filed']);

    expect(github.calls.filter((call) => call.method === 'POST' && call.path === '/issues')).toHaveLength(1);
    expect(github.calls.filter((call) => call.path.endsWith('/comments'))).toHaveLength(2);
  });

  it('turns away the reports past the bound of the queue, and takes them again once it has emptied', async () => {
    let release!: () => void;
    const github = fakeGithub({ gate: new Promise<void>((resolve) => { release = resolve; }) });
    const filing = tracker(github);

    const results = Array.from({ length: MAX_QUEUED_REPORTS + 1 }, () => filing.file(opinion));
    expect(await results[MAX_QUEUED_REPORTS]).toBe('busy');

    release();
    expect((await Promise.all(results.slice(0, MAX_QUEUED_REPORTS))).every((result) => result === 'filed')).toBe(true);
    expect(await filing.file(opinion)).toBe('filed');
  });

  it('says it failed when GitHub refuses, and logs the status and nothing else', async () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
    const github = fakeGithub({ status: 401 });

    expect(await tracker(github).file(bug)).toBe('failed');

    expect(warn).toHaveBeenCalledExactlyOnceWith('Feedback: a GitHub call failed (status 401).');
  });

  it('says it failed when GitHub does not answer, and the next report is still taken', async () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
    const github = fakeGithub();
    github.fetchImpl.mockRejectedValueOnce(new Error(`connect ECONNREFUSED with ${TOKEN}`));
    const filing = tracker(github);

    expect(await filing.file(bug)).toBe('failed');
    expect(await filing.file(bug)).toBe('filed');

    expect(warn).toHaveBeenCalledExactlyOnceWith('Feedback: a GitHub call failed (no answer).');
  });
});

describe('githubConfigFromEnv', () => {
  it('reads the token and the repository', () => {
    expect(githubConfigFromEnv({ FEEDBACK_GITHUB_TOKEN: ` ${TOKEN} `, FEEDBACK_GITHUB_REPO: 'owner/name' })).toEqual({ token: TOKEN, repo: 'owner/name' });
  });

  it.each([
    [{}],
    [{ FEEDBACK_GITHUB_TOKEN: TOKEN }],
    [{ FEEDBACK_GITHUB_REPO: 'owner/name' }],
    [{ FEEDBACK_GITHUB_TOKEN: TOKEN, FEEDBACK_GITHUB_REPO: 'name-only' }],
    [{ FEEDBACK_GITHUB_TOKEN: TOKEN, FEEDBACK_GITHUB_REPO: 'owner/name/extra' }],
    [{ FEEDBACK_GITHUB_TOKEN: TOKEN, FEEDBACK_GITHUB_REPO: '../other/name' }],
    [{ FEEDBACK_GITHUB_TOKEN: 'two words', FEEDBACK_GITHUB_REPO: 'owner/name' }],
    [{ FEEDBACK_GITHUB_TOKEN: 'line\r\nbreak', FEEDBACK_GITHUB_REPO: 'owner/name' }],
  ])('is off, with one warning that never shows the token, for %j', (env) => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

    expect(githubConfigFromEnv(env)).toBeUndefined();

    expect(warn).toHaveBeenCalledOnce();
    expect(JSON.stringify(warn.mock.calls)).not.toContain(TOKEN);
  });
});
