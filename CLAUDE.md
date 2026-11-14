# (non)BinaryGames

Casual games to play together in real time (today: collaborative Sudoku). People open a room, share the link and play. No accounts, no scores, no timers. The audience includes queer couples and friend groups who are here for a calm, safe space, so player safety and privacy weigh more than features.

This is a personal project with a single owner, who also uses it to learn Node.js. It is not a portfolio piece: keep the README and docs about the game, not about the engineering.

## Layout

npm workspaces monorepo, TypeScript everywhere.

- `shared/` (`@nbg/shared`): game engines, the Socket.IO event contracts and the zod schemas for every client payload. Types are inferred from the schemas.
- `backend/`: Node.js and Socket.IO server. Rooms live in memory behind `RoomStore`. Hosted on Render (free plan, sleeps when idle).
- `frontend/`: Next.js (App Router), React, Tailwind with themes as CSS variables, no UI library. Hosted on Vercel.

## Commands

Everything runs in Docker. Never ask the owner to install Node or anything else on their machine.

```bash
docker compose run --rm node-cli npm install
docker compose up --build
docker compose run --rm node-cli npm run coverage
docker compose run --rm node-cli npm run lint --workspace=frontend
docker compose run --rm node-cli npm run typecheck
```

In a cloud session where the Docker daemon is not available, run the same npm commands directly (`npm ci --ignore-scripts`, `npx vitest run --coverage`, `npm run lint --workspace=frontend`, `npm run typecheck`). CI runs lint, typecheck, tests with coverage and SonarQube on every PR to `main`.

## Rules that hold for every change

1. **The server is the only authority.** Anything a client sends is `unknown` until a zod schema in `shared/src/schemas.ts` has parsed it. Every socket handler is registered through `safeHandler` with a schema and the rate limiter. Bounds that depend on game state (board size, fixed cells) are checked in the handler.
2. **The contract lives in `shared`.** A new or changed event means: schema, inferred type, entry in `ClientToServerEvents` / `ServerToClientEvents`, server handler, client code, tests. All in the same change, so the two sides cannot drift.
3. **A client never names the room it acts on**, except in `join-room`. Every other event uses the room stored in `socket.data`.
4. **No free text between players without a design review.** Today players can only exchange values from fixed enums (emotes, digits). Chat, nicknames, avatars or any user-written string change the threat model (XSS, harassment, moderation) and need the owner's decision first.
5. **No accounts, personal data, analytics or third-party scripts without the owner's decision.** If login is ever added, it is designed with the `secops` agent before any code is written.
6. **Every resource has a bound**: rooms, players per room, payload sizes, event rates, timers. New state that can grow needs a limit and a cleanup path.
7. **Tests come with the change.** Server behaviour is tested with real Socket.IO sockets (see `backend/src/sockets/event.test.ts`). A fix starts from a test that fails without it.
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
- `secops` reviews every change before it becomes a PR and owns Docker, CI, dependencies and hosting configuration.

Default flow: the owner picks an issue, short plan agreed with the owner, `fullstack` implements with tests, `secops` reviews the diff, `fullstack` addresses blocking findings, remaining findings become proposed issues, then the owner decides about commit and PR.
