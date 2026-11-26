import type { FeedbackArgs } from '@nbg/shared';
import { logger } from '../logger';
import { commentOf, issueOf } from './feedbackText';

export type FilingResult = 'filed' | 'busy' | 'failed';

/** Where the reports end up. The endpoint only knows this, so that the tracker can change without touching it. */
export interface FeedbackTracker {
  file: (report: FeedbackArgs) => Promise<FilingResult>;
  /** Tells the owner that a total of the day was reached: without it, a form that stopped would only be a 429 nobody sees. */
  alert: (limit: DailyLimit) => void;
}

export type DailyLimit = 'bugs' | 'reports';

/** The issue the alerts are written to: one for all of them, so that they are easy to find and to mute. */
export const ALERT_TITLE = 'Feedback form: a daily limit was reached';
const ALERT_TEXT: Record<DailyLimit, string> = {
  bugs: 'The daily limit of bug reports was reached: more bug reports are refused until the day is over.',
  reports: 'The daily limit of reports of any kind was reached: the form refuses everything until the day is over.',
};

export interface GithubConfig {
  token: string;
  /** `owner/name` of the private repository. */
  repo: string;
}

const GITHUB_API = 'https://api.github.com';
const REQUEST_TIMEOUT_MS = 5000;
/** Reports in the queue, the one being filed included. Past it the caller is told to try later: waiting has a bound too. */
export const MAX_QUEUED_REPORTS = 10;
/**
 * How long a report can wait in the queue and be filed, from the moment it arrived. Past it the report is dropped and
 * the caller is told it failed: the browser has given up long before a queue of slow calls would end, and filing it
 * anyway would only add a second comment when the person tries again.
 */
export const filingLimit = { deadlineMs: 20_000 };
/** Pages of 100 open issues read to find one by its title. A repository with more open issues than this is not one this form feeds. */
const MAX_PAGES = 3;
/** Titles remembered with their issue number: there are as many as the combinations that were answered, and the oldest is forgotten first. */
const MAX_CACHED_TITLES = 200;

const REPO_PATTERN = /^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/;
// Visible ASCII only: a token goes into a header, and a line break in it would add another one.
const TOKEN_PATTERN = /^[\x21-\x7e]{1,255}$/;

/**
 * The token and the repository from the environment. Nothing usable means the form answers "unavailable":
 * the game itself does not depend on it. The token is never printed, and neither is a wrong value of it.
 */
export const githubConfigFromEnv = (env: NodeJS.ProcessEnv = process.env): GithubConfig | undefined => {
  const token = env.FEEDBACK_GITHUB_TOKEN?.trim();
  const repo = env.FEEDBACK_GITHUB_REPO?.trim();

  if (!token || !repo) {
    logger.warn('The feedback form is off: set FEEDBACK_GITHUB_TOKEN and FEEDBACK_GITHUB_REPO (owner/name of a private repository).');
    return undefined;
  }
  if (!TOKEN_PATTERN.test(token) || !REPO_PATTERN.test(repo)) {
    logger.warn('The feedback form is off: FEEDBACK_GITHUB_TOKEN or FEEDBACK_GITHUB_REPO has not the expected format (the repository is owner/name).');
    return undefined;
  }
  return { token, repo };
};

/** A call that did not give the answer it was made for. Carries the status and nothing else, so that it is safe to log. */
class GithubError extends Error {
  constructor(readonly status: number | undefined) {
    super('GitHub call failed');
  }
}

/**
 * Files each report in a private GitHub repository: one issue for every combination of answers, and one comment
 * for every report. Two things keep it from opening the same issue twice or flooding the repository:
 * - Reports go through one queue, one at a time: two equal reports that arrive together cannot both find "no issue" and open one each.
 * - The queue has a bound, and `file` answers 'busy' past it.
 * Only the texts of `feedbackText.ts` are sent, and only the status of a failed call is logged.
 */
export const createGithubTracker = ({ token, repo }: GithubConfig, fetchImpl: typeof fetch = (...args) => fetch(...args)): FeedbackTracker => {
  const numbers = new Map<string, number>();
  let tail: Promise<unknown> = Promise.resolve();
  let queued = 0;

  const call = async <T>(deadline: number, method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> => {
    const left = deadline - Date.now();
    if (left <= 0) throw new GithubError(undefined);
    let response: Response;
    try {
      response = await fetchImpl(`${GITHUB_API}/repos/${repo}${path}`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'nbg-feedback',
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(Math.min(REQUEST_TIMEOUT_MS, left)),
        // A redirect would carry the token to wherever it points.
        redirect: 'error',
      });
    } catch {
      throw new GithubError(undefined);
    }
    if (!response.ok) throw new GithubError(response.status);
    return (await response.json()) as T;
  };

  const remember = (title: string, number: number) => {
    numbers.delete(title);
    numbers.set(title, number);
    if (numbers.size > MAX_CACHED_TITLES) numbers.delete(numbers.keys().next().value as string);
  };

  type IssueSummary = { number: number; title: string; state?: string; pull_request?: unknown };

  // Looked up by title only, not by label: if the labels are missing and GitHub drops them, the issue is still found.
  // The repository only holds what this form files, so the pages below are enough.
  const findOpen = async (deadline: number, title: string): Promise<number | undefined> => {
    const known = numbers.get(title);
    if (known !== undefined) {
      try {
        // The owner may have closed or renamed it since: a comment on a closed issue would never be seen.
        const issue = await call<IssueSummary>(deadline, 'GET', `/issues/${known}`);
        if (issue.state === 'open' && issue.title === title) return known;
      } catch (error) {
        if (!(error instanceof GithubError) || (error.status !== 404 && error.status !== 410)) throw error;
      }
      numbers.delete(title);
    }

    for (let page = 1; page <= MAX_PAGES; page++) {
      const issues = await call<IssueSummary[]>(deadline, 'GET', `/issues?state=open&per_page=100&page=${page}`);
      const found = issues.find((issue) => issue.pull_request === undefined && issue.title === title);
      if (found) return found.number;
      if (issues.length < 100) break;
    }
    return undefined;
  };

  /** Adds a comment to the issue with this title, and opens it first if there is none. */
  const post = async (deadline: number, title: string, label: string, body: string, comment: string) => {
    let number = await findOpen(deadline, title);
    if (number === undefined) number = (await call<{ number: number }>(deadline, 'POST', '/issues', { title, body, labels: [label] })).number;
    remember(title, number);
    await call(deadline, 'POST', `/issues/${number}/comments`, { body: comment });
  };

  const send = (report: FeedbackArgs, deadline: number) => {
    const { title, label, body } = issueOf(report);
    return post(deadline, title, label, body, commentOf(report));
  };

  /** Goes through the same queue and the same bound as the reports, so that the two never race for one issue. */
  const enqueue = (work: (deadline: number) => Promise<void>): Promise<FilingResult> => {
    if (queued >= MAX_QUEUED_REPORTS) return Promise.resolve('busy');
    queued++;
    const deadline = Date.now() + filingLimit.deadlineMs;

    const run = tail
      .then(() => work(deadline))
      .then((): FilingResult => 'filed', (error: unknown): FilingResult => {
        logger.warn(`Feedback: a GitHub call failed (${error instanceof GithubError && error.status ? `status ${error.status}` : 'no answer'}).`);
        return 'failed';
      })
      .finally(() => { queued--; });
    tail = run;
    return run;
  };

  const file = (report: FeedbackArgs) => enqueue((deadline) => send(report, deadline));

  const alert = (limit: DailyLimit) => {
    void enqueue((deadline) => post(deadline, ALERT_TITLE, 'alert', 'The form keeps working: this only says when one of its daily limits was reached.', ALERT_TEXT[limit]));
  };

  return { file, alert };
};
