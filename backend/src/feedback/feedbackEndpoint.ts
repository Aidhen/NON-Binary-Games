import type { IncomingMessage, ServerResponse } from 'node:http';
import { feedbackArgsSchema } from '@nbg/shared';
import type { FeedbackArgs } from '@nbg/shared';
import { createRateLimiter, createKeyedRateLimiter } from '../sockets/rateLimiter';
import type { AddressOf } from '../sockets/connectionLimits';
import type { DailyLimit, FeedbackTracker } from './githubTracker';
import { logger } from '../logger';

export const FEEDBACK_PATH = '/feedback';
/** The biggest valid report is about 250 bytes: this is room for the framing and nothing else. */
export const MAX_FEEDBACK_BYTES = 2048;

/**
 * Limits of the form. Exported and mutable like the ones of the game, so that the tests can change them; they are
 * read when the handler is created.
 *
 * Everything is kept in memory and that is enough: the free Render instance only restarts after it has been idle,
 * and a client that keeps sending keeps it awake, so it keeps being counted. A restart forgets the counts only
 * when nobody was sending.
 * Per address, three reports in ten minutes: a person sends one, and a family behind one address has room for a few.
 * The totals of the day are what stops a crowd of addresses, and what keeps the private repository readable.
 * Addresses are only counted here: they are never written to the log or to the tracker.
 */
export const feedbackLimit = {
  perAddress: { max: 3, windowMs: 10 * 60 * 1000 },
  /** Bug reports in a day, on the whole server. */
  bugsPerDay: 20,
  /** Reports of any kind in a day, on the whole server. */
  reportsPerDay: 200,
  dayMs: 24 * 60 * 60 * 1000,
  /** A report is a few hundred bytes: a client that has not sent them in this time is only holding a connection. */
  bodyTimeoutMs: 5000,
};

/** `too-many` is the limit of the address, `day-full` the total of the day: the page tells the two apart. */
type Reason = 'forbidden' | 'invalid' | 'too-large' | 'too-many' | 'day-full' | 'unavailable';

const readBody = (req: IncomingMessage): Promise<Buffer | 'too-large' | 'too-slow'> =>
  new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const timer = setTimeout(() => done('too-slow'), feedbackLimit.bodyTimeoutMs);

    const done = (result: Buffer | 'too-large' | 'too-slow') => {
      clearTimeout(timer);
      req.off('data', onData);
      req.off('end', onEnd);
      req.off('error', onError);
      resolve(result);
    };
    // Past the bound it stops reading: the rest of the body is never held in memory.
    const onData = (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_FEEDBACK_BYTES) return done('too-large');
      chunks.push(chunk);
    };
    const onEnd = () => done(Buffer.concat(chunks));
    const onError = () => done('too-slow');

    req.on('data', onData);
    req.on('end', onEnd);
    req.on('error', onError);
  });

/**
 * `POST /feedback` on the plain HTTP server, with the CORS preflight it needs (the body is JSON, so the browser asks first).
 * Only the origin of the frontend is served, with no credentials: a request from anywhere else, or without an Origin
 * (a script), is refused. The answers are a status and a few fixed words: nothing of the request comes back.
 * A `tracker` that is missing means the form is not configured: it answers 503 and the rest of the server is not affected.
 */
export const createFeedbackHandler = (allowedOrigin: string, addressOf: AddressOf | undefined, tracker: FeedbackTracker | undefined, now: () => number = Date.now) => {
  const allowPerAddress = createKeyedRateLimiter(feedbackLimit.perAddress.max, feedbackLimit.perAddress.windowMs, now);
  const allowBug = createRateLimiter(feedbackLimit.bugsPerDay, feedbackLimit.dayMs, now);
  const allowReport = createRateLimiter(feedbackLimit.reportsPerDay, feedbackLimit.dayMs, now);

  const cors = { 'Access-Control-Allow-Origin': allowedOrigin, 'Vary': 'Origin' };

  // One alert per limit and per day at most: a flood of refused reports must not become a flood of alerts.
  const alertedAt: Partial<Record<DailyLimit, number>> = {};
  const dayFull = (limit: DailyLimit) => {
    const last = alertedAt[limit];
    if (last === undefined || now() - last >= feedbackLimit.dayMs) {
      alertedAt[limit] = now();
      logger.warn(`Feedback: the daily limit of ${limit} was reached.`);
      tracker?.alert(limit);
    }
  };

  const reply = (res: ServerResponse, status: number, reason?: Reason, extra: Record<string, string> = {}) => {
    // The answers are tiny JSON: the browser is told not to guess another type for them.
    const headers = { 'X-Content-Type-Options': 'nosniff', ...extra };
    if (reason === undefined) {
      res.writeHead(status, headers);
      res.end();
      return;
    }
    res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
    res.end(JSON.stringify({ error: reason }));
  };

  /** The report in the body, or the answer to give when there is none: the request is read only up to its bound. */
  const readReport = async (req: IncomingMessage): Promise<FeedbackArgs | { status: number; reason: Reason; close?: boolean }> => {
    if (Number(req.headers['content-length']) > MAX_FEEDBACK_BYTES) return { status: 413, reason: 'too-large', close: true };
    const body = await readBody(req);
    if (body === 'too-large') return { status: 413, reason: 'too-large', close: true };
    if (body === 'too-slow') return { status: 400, reason: 'invalid', close: true };

    try {
      const parsed = feedbackArgsSchema.safeParse(JSON.parse(body.toString('utf8')));
      return parsed.success ? parsed.data : { status: 400, reason: 'invalid' };
    } catch {
      return { status: 400, reason: 'invalid' };
    }
  };

  /**
   * Counted once the report is valid: a broken request does not spend the allowance of everybody behind the same
   * address (a family, a café), nor the budget of the day. The body is small and bounded, so reading it first is cheap.
   * Returns the reason of the refusal, or undefined when the report can be filed (and is counted).
   */
  const refusal = (req: IncomingMessage, report: FeedbackArgs): Reason | undefined => {
    const address = addressOf?.(req);
    if (address !== undefined && !allowPerAddress(address)) return 'too-many';
    if (report.kind === 'bug' && !allowBug()) {
      dayFull('bugs');
      return 'day-full';
    }
    if (!allowReport()) {
      if (report.kind === 'bug') allowBug.refund();
      dayFull('reports');
      return 'day-full';
    }
    return undefined;
  };

  const handlePost = async (req: IncomingMessage, res: ServerResponse) => {
    if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') return reply(res, 400, 'invalid', cors);
    if (!tracker) return reply(res, 503, 'unavailable', cors);

    const report = await readReport(req);
    if ('reason' in report) {
      if (report.close) res.once('finish', () => req.destroy());
      return reply(res, report.status, report.reason, report.close ? { ...cors, 'Connection': 'close' } : cors);
    }

    const refused = refusal(req, report);
    if (refused) return reply(res, 429, refused, cors);

    const result = await tracker.file(report);
    if (result !== 'filed') {
      // Nothing was filed, so it does not use up the day (the address keeps its count: it did ask).
      allowReport.refund();
      if (report.kind === 'bug') allowBug.refund();
      return reply(res, 503, 'unavailable', cors);
    }
    reply(res, 204, undefined, cors);
  };

  return (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'POST' && req.method !== 'OPTIONS') return reply(res, 404);
    if (req.headers.origin !== allowedOrigin) return reply(res, 403, 'forbidden');

    if (req.method === 'OPTIONS') {
      return reply(res, 204, undefined, { ...cors, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600' });
    }

    // An exception that escapes an async function is an unhandled rejection, and that stops the process and every room with it.
    handlePost(req, res).catch(() => {
      if (!res.headersSent) reply(res, 503, 'unavailable', cors);
      else res.end();
    });
  };
};

export type FeedbackHandler = ReturnType<typeof createFeedbackHandler>;
