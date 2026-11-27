# (non)BinaryGames 🎲

> A queer-owned online platform that turns classic casual games into shared experiences.

I had this idea while looking for ways to pass the time with my long-distance partner. We both don't always have the right amount of energy to engage in complex activities together, so we were looking for a low-pressure way to connect and found the answer in Sudokus and other simple games. :)

**(non)BinaryGames** is a web platform for small puzzle games played together in real time, from wherever each player is. One person opens a room and shares its link, and everyone in the room plays on the same board. The idea is to play without pressure: cooperation instead of competition, puzzles that can always be solved by reasoning, and nothing that pushes you to hurry.

---

## How it works

- **Rooms.** A room lives in the memory of a single Node.js server and is reached through its link. Players talk to it over Socket.IO: after joining, every event acts on the room stored on the socket, never on one named by the client. A player whose connection drops keeps their place, and their votes, for thirty seconds; an empty room is kept for ten minutes, so that a page that lost its connection can join again.
- **The server is the authority.** Every client payload is parsed by a [zod](https://zod.dev) schema before it is used, and the bounds that depend on the game (board size, fixed cells) are checked in the handler. Events are rate limited, connections are limited per address, the number of rooms is capped, and the boards a client can have generated are limited on their own, behind a limit for the whole server.
- **Game engines.** Generators and validators are pure TypeScript in a shared package, used by both server and client. Every puzzle has exactly one solution and can be solved by deduction alone, and the solution never leaves the server: the Sudoku mode that compares with it asks the server which cells are wrong.
- **Pluggable games.** The server accepts a closed list of game ids, and the frontend has a registry of games. A room starts at a table where the players vote, and the game opens when more than half of the room wants it. Going back to the table to pick another game is voted the same way.
- **No accounts.** A browser is identified by an anonymous id kept in `localStorage`, which lets players keep their name and color when they reconnect. Players can only exchange values from fixed sets (digits, emotes): there is no free text between them.
- **Interface.** Next.js and React, Tailwind with the themes as CSS variables, translations in plain TypeScript dictionaries (English and Italian), drawings as inline SVG components.

### Hosting

Both sides run on free plans: the frontend on Vercel, the backend on Render. The Render service sleeps when idle and takes about a minute to wake up, so the frontend pings `/healthz` as soon as a page opens, and the site stays usable while the server starts: only the vote at the table waits for it. The backend shuts down gracefully and writes timestamped logs. Since rooms live in memory, a restart drops them: keeping them across restarts would need an external store (Redis), which the free plan does not offer.

<details>
<summary>Workspaces and tooling</summary>

&nbsp;

It is a **monorepo** managed with `npm workspaces`, separating the client from the game logic:

- **`@nbg/shared`**: pure TypeScript core logic. The engines of the four games (generators and validators), the Socket.IO event contracts, the [zod](https://zod.dev) schemas that validate every client payload (the TypeScript types are inferred from them) and the shared list of emotes.
- **`@nbg/art`**: the drawings of the project as React components: the logo and the emotes.
- **`@nbg/backend`**: Node.js and Socket.IO server. Rooms, real-time synchronization, shared notes, win detection and emote relaying (validated, with a cooldown).
- **`@nbg/frontend`**: Next.js and React, styled with Tailwind CSS (themes are CSS variables) and no UI component library.

Tooling: **Vitest** for unit, component and integration tests (the server tests use real Socket.IO sockets), coverage with V8 and SonarQube Cloud, **Docker Compose** for development, **GitHub Actions** for linting and tests, **Husky** with `lint-staged` for pre-commit and pre-push checks.

</details>

---

## Current status: v0.9.0-alpha

Four games are playable online. What changed in each version is in the [releases](https://github.com/Aidhen/NON-Binary-Games/releases); news for the players is in the Diary on the site.

### Next

**Rooms**
- [ ] Ask the room before a new game or a language change discards a Word Search in progress ([#86](https://github.com/Aidhen/NON-Binary-Games/issues/86)).

**Games**
- [ ] A Memory game with tarot cards.
- [ ] Harder Sudoku levels that still never need a guess ([#62](https://github.com/Aidhen/NON-Binary-Games/issues/62)).
- [ ] A third language for the interface and the word lists ([#76](https://github.com/Aidhen/NON-Binary-Games/issues/76)).

**Later**
- [ ] Rooms that survive restarts (Redis), when the hosting allows it.

---

## Getting Started (Local Development)

The repository is fully containerized. You don't need Node.js installed locally.

```bash
# 1. Clone the repository
git clone https://github.com/Aidhen/NON-Binary-Games
cd NON-Binary-Games

# 2. Install monorepo dependencies via the CLI container
docker compose run --rm node-cli npm install

# 3. Start the development servers
docker compose up --build
```

Then open <http://localhost:3000>. To try multiplayer, open the invitation link of a room in a second browser window.

### Useful commands

```bash
# Run the whole test suite once, with coverage
docker compose run --rm node-cli npm run coverage

# Lint the frontend
docker compose run --rm node-cli npm run lint --workspace=frontend
```

### Configuration

Local development works with the defaults. The variables needed in production are documented in [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example), and the Render service is described in [`render.yaml`](render.yaml).

---

## License

The code is released under the [PolyForm Noncommercial License 1.0.0](LICENSE). You can read it, run it, change it and share it for any noncommercial purpose, as long as you keep the license and the copyright notice. Making money from it is not allowed.

Versions published before this change were released under GPL-3.0-or-later, and that license still applies to those versions.

The name (non)BinaryGames and its logo are not covered by the license: please do not use them for your own version of the project.
