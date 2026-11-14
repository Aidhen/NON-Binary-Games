# (non)BinaryGames

Casual games to play together in real time (today: collaborative Sudoku). People open a room, share the link and play. No accounts, no scores, no timers. The audience includes queer couples and friend groups who are here for a calm, safe space, so player safety and privacy weigh more than features.

This is a personal project with a single owner, who also uses it to learn Node.js. It is not a portfolio piece: keep the README and docs about the game, not about the engineering.

## Layout

npm workspaces monorepo, TypeScript everywhere.

- `shared/` (`@nbg/shared`): game engines, the Socket.IO event contracts and the zod schemas for every client payload. Types are inferred from the schemas.
- `backend/`: Node.js and Socket.IO server. Rooms live in memory behind `RoomStore`. Hosted on Render (free plan, sleeps when idle).
- `frontend/`: Next.js (App Router), React, Tailwind with themes as CSS variables, no UI library. Hosted on Vercel.

Where things are, so nobody has to explore the repo to find them (tests sit next to their file as `*.test.ts(x)`):

- Contract: `shared/src/schemas.ts` (zod schemas, event types), `shared/src/emotes.ts`, `shared/src/players.ts`.
- Sudoku engine: `shared/src/games/sudoku/` (`generator.ts`, `validator.ts`, `types.ts`).
- Server: `backend/src/server.ts` (HTTP, CORS, health check, shutdown), `backend/src/sockets/event.ts` (every socket handler), `safeHandler.ts`, `rateLimiter.ts`, `connectionLimits.ts` in the same folder, `backend/src/rooms/roomStore.ts`, `backend/src/logger.ts`.
- Pages: `frontend/src/app/page.tsx` (home), `frontend/src/app/play/[roomId]/page.tsx` (room).
- Components, under `frontend/src/app/components/`: `sudoku/`, `players/`, `emotes/`, `loader/`, `minigames/`, `ui/`.
- Client plumbing, under `frontend/src/lib/`: `socket.ts`, `storage.ts`, `playerId.ts`, `securityHeaders.ts`, the `use*.ts` hooks, `i18n/`.
- Strings: `frontend/src/locales/en.ts` and `it.ts`.

## Commands

Everything runs in Docker. Never ask the owner to install Node or anything else on their machine.

```bash
docker compose run --rm node-cli npm install
docker compose up --build
docker compose run --rm node-cli npm run coverage
docker compose run --rm node-cli npm run lint --workspace=frontend
docker compose run --rm node-cli npm run typecheck
```

In a cloud session where the Docker daemon is not available, run the same npm commands directly (`npm ci --ignore-scripts`, `npm run typecheck`). CI runs lint, typecheck, tests with coverage and SonarQube on every PR to `main`.

**Agents and Claude sessions do not run tests, coverage or lint.** The owner runs them locally and CI runs them on every PR. Write or update the tests that belong to the change, run `npm run typecheck` once when the change is complete, and say in the report that the tests were written but not executed, with the command the owner can use for the touched files (`npx vitest run <path>`). Run a test only when the owner asks for it in the request.

## Rules that hold for every change

1. **The server is the only authority.** Anything a client sends is `unknown` until a zod schema in `shared/src/schemas.ts` has parsed it. Every socket handler is registered through `safeHandler` with a schema and the rate limiter. Bounds that depend on game state (board size, fixed cells) are checked in the handler.
2. **The contract lives in `shared`.** A new or changed event means: schema, inferred type, entry in `ClientToServerEvents` / `ServerToClientEvents`, server handler, client code, tests. All in the same change, so the two sides cannot drift.
3. **A client never names the room it acts on**, except in `join-room`. Every other event uses the room stored in `socket.data`.
4. **No free text between players without a design review.** Today players can only exchange values from fixed enums (emotes, digits). Chat, nicknames, avatars or any user-written string change the threat model (XSS, harassment, moderation) and need the owner's decision first.
5. **No accounts, personal data, analytics or third-party scripts without the owner's decision.** If login is ever added, it is designed with the `secops` agent before any code is written.
6. **Every resource has a bound**: rooms, players per room, payload sizes, event rates, timers. New state that can grow needs a limit and a cleanup path.
7. **Tests come with the change.** Server behaviour is tested with real Socket.IO sockets (see `backend/src/sockets/event.test.ts`). A fix comes with a test written to fail without it. Who runs the tests is in Commands.
8. **Secrets never enter the repo.** Only `.env.example` files with names and local defaults. If a secret is found in the code or in git history, stop and tell the owner: it must be rotated, not just removed.

## Code style

- English for identifiers, comments, commit messages and PRs.
- 2 spaces. Compact code: imports from one module stay on one line.
- Keep the existing style of a file. Do not rename existing variables, functions or files without asking first.
- Comments explain why, in the tone already used in the code. No comments that restate the code.
- No new dependency without a reason stated to the owner: each one is attack surface and maintenance.
- Redis code stays commented out until the owner decides otherwise.

## Working with the owner

- Explain before changing: for anything beyond a small fix, say what you intend to do and why, then wait for a go-ahead.
- The owner is learning Node.js. Explain the reasoning behind non-obvious backend choices. When they say they want to write a part themselves, describe the approach and review their code instead of writing it.
- Be direct and critical, like a senior colleague in a code review. Say when an idea is weak and what you would do instead.
- Use gender-neutral language when referring to the owner or to players.

## Git

- The owner decides when work is committed, pushed or opened as a PR. Do not do any of these unless the request asks for it.
- Never commit to `main`, never force-push, never merge a PR.
- One branch per feature or fix, from `main`: `feat/...`, `fix/...`, `chore/...`, `sec/...`.
- Conventional commit subjects (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).
- PR descriptions use these sections: Summary, Problem, Changes, Breaking change, Testing. Short for small changes. Plain professional wording.
- A PR that resolves an issue says so in its Summary with `Fixes #N`, so the issue closes on merge. One PR per issue when possible.
- No attribution lines: no `Co-Authored-By` trailer, no session link, no "generated with" footer in commits or PRs.

## Versions

Before 1.0 the version is `0.MINOR.PATCH-alpha`. A PR that adds a feature for the players raises MINOR; one that fixes something they can see raises PATCH. Chores, docs, tests and CI do not change it.

- **The bump is part of the PR that earns it:** the same number in `shared/package.json`, `backend/package.json` and `frontend/package.json`, the three matching entries in `package-lock.json`, and "Current Status" in the README. A PR with more than one feature raises MINOR once.
- **Tag and release come after the merge,** on the merge commit: `vX.Y.Z-alpha`. The owner decides when (see Git); a tag is made by Claude only when asked. The release notes list the PRs since the previous tag, one line each, as the GitHub "What's Changed" does.
- **Say it in the report:** when a PR does not bump the version although it adds a feature, the report says why.

## Issues

GitHub Issues are the backlog. Nothing that needs doing lives only in a chat or in an agent file.

- **One issue per problem.** Title that says what is wrong or what is wanted. Body: where (file, event, screen), why it matters, and what "done" means as a short checklist.
- **Labels:** one type (`bug`, `enhancement`, `security`, `infra`, `documentation`) and one priority (`priority: high`, `priority: medium`, `priority: low`).
- **Work starts from an issue.** When the owner says "work on #N", read the issue first. If the work has no issue yet and is more than a small fix, propose one.
- **Things noticed along the way** that are outside the current change are not fixed on the spot: they are listed at the end of the report as proposed issues (title, labels, two lines of body).
- **Issues are created only after the owner agrees** to the proposed list. Check for an existing issue on the same problem first.
- **Exploitable vulnerabilities never go in a public issue**, PR, commit message or file of this public repository until they are fixed. `secops` writes them up privately for the owner (see its instructions).
- In cloud sessions the `gh issue` and `gh pr` subcommands do not work: use the REST API through `gh api repos/Aidhen/NON-Binary-Games/...`.

## Agents

- `fullstack` builds features and fixes across the three workspaces.
- `secops` reviews the changes that can affect safety and owns Docker, CI, dependencies and hosting configuration.

The main session organizes the work. There is no separate planning agent.

- **Small changes stay in the main session**: a fix in one or two files, copy, styling, a test. No agent is started for these.
- **Larger changes go to `fullstack`**, with a brief that lets it start without exploring: the issue number and its checklist, the files involved (see Layout), the plan agreed with the owner, and what is out of scope.
- **`secops` reviews only when the diff touches** socket events or their schemas, state kept by the server, anything stored in the browser, what is broadcast to other players, dependencies, or Docker, CI and hosting configuration. Pure UI, copy and test changes skip the review. Give it the list of changed files and the hand-off notes from `fullstack`, not the whole story of the work.
- One review round. `fullstack` addresses the blocking findings, the rest become proposed issues, and `secops` is not called again unless a blocking fix changed the contract.

Default flow: the owner picks an issue, short plan agreed with the owner, implementation with tests written, review when the list above requires it, then the owner runs the tests and decides about commit and PR.
