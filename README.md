# (non)BinaryGames 🎲

> A queer-owned online platform that turns classic casual games into shared experiences.

I had this idea while looking for ways to pass the time with my long-distance partner. We both don't always have the right amount of energy to engage in complex activities together, so we were looking for a low-pressure way to connect and found the answer in Sudokus and other simple games. :)

**(non)BinaryGames** will be a collection of simple games meant to be played side by side by you and your partner, focusing on connection over competition.

---

## Play together

Open the site and you are already in a room: send the link to your partner or your friends and they sit at the same table. No accounts, no timers, no scores.

- **A table with boxes.** Every game is a box. Each of you picks one, and the box opens when more than half of the room wants it. Whoever arrives later joins the game that is open.

- **Sudoku, together.** Five difficulty levels, every one solvable by deduction alone, and the whole room can start a new game when you are ready for another.
- **Shared notes.** Each note is colored after the person who wrote it, so you can see who had which idea.
- **Seeing each other.** You see where the other players are looking, in their own color.
- **Emotes.** Ten quick reactions (💜 🌹 🔥 ...) float over the board, for when you want to say something without typing.
- **Themes and languages.** Several themes, including a Non-Binary one, and two languages (English and Italian).

### A gentle wait

The game runs on a free hosting plan that goes to sleep when nobody is around, so the first visit can take about a minute. Instead of a blank page, it tells you what is happening and why.

---

## Current Status: v0.2.0-alpha

The game is playable online. You can create a room, share the link, solve a Sudoku together, share notes and react with emotes. From here the focus is on polishing the game, making rooms smooth and reliable, and adding more games.

### What is done
- [x] Collaborative Sudoku with real-time rooms and shareable links (`/play/[roomId]`).
- [x] A room that starts at the table, where the players vote for the game to open.
- [x] Shared notes and live cell selections.
- [x] A name for each player, like Red Panda, and a color of your own to pick; the list of players shows who is who, and a tap on a player points them out on the board.
- [x] Win detection and a "play again" screen.
- [x] Five difficulty levels, from beginner to expert. Every puzzle has exactly one solution and can be solved by pure deduction: you never have to guess.
- [x] Emotes between players.
- [x] A friendly wait while the server wakes up.
- [x] English and Italian translations, several themes.
- [x] Online deployment (Vercel and Render).

### What is next
- [x] **Polish the game:** keep your own selection always visible, fix the overlap with the victory banner, and hide a number (on the number pad and in the notes) once all of its places are filled.
- [x] **Themes:** consistent colors across every theme, notes mode included.
- [x] **Room privacy:** hide the room code in the interface.
- [ ] **A proper introduction:** a short description of the game on the home page.
- [x] **Gentler feedback:** optional modes to show mistakes right away, or to see which number is wrong ("god mode").
- [ ] **Smoother reconnections:** coming back to a room after a connection drop should feel seamless.
- [ ] **Keeping rooms in sync and safe:** consistent moves between players, limits against flooding.
- [ ] **Keyboard play:** moving around the grid with the arrow keys, and better support for screen readers.
- [ ] **More games:** the games live in a registry, so a new game is its engine, a cover and one entry.
- [ ] **Rooms that survive restarts**, and a backend that can scale (Redis).
- [ ] **Hosting details:** a health check, graceful shutdown and proper logs.

---

## Under the hood

<details>
<summary>Tech stack and project structure</summary>

&nbsp;

It is a **monorepo** managed with `npm workspaces`, separating the client from the game logic:

- **`@nbg/shared`**: pure TypeScript core logic. The custom Sudoku engine (generator, validator), the Socket.IO event contracts, the [zod](https://zod.dev) schemas that validate every client payload (the TypeScript types are inferred from them) and the shared list of emotes.
- **`@nbg/backend`**: Node.js and Socket.IO server. Rooms, real-time synchronization, shared notes, win detection and emote relaying (validated, with a cooldown).
- **`@nbg/frontend`**: Next.js and React, styled with Tailwind CSS (themes are CSS variables) and no UI component library.

Tooling: **Vitest** for unit, component and integration tests (the server tests use real Socket.IO sockets), coverage with V8 and SonarQube Cloud, **Docker Compose** for development, **GitHub Actions** for linting and tests, **Husky** with `lint-staged` for pre-commit and pre-push checks.

</details>

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

### Environment variables

| Variable | Where | Default | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SOCKET_URL` | frontend | `http://localhost:4000` | URL of the Socket.IO backend |
| `PORT` | backend | `4000` | Port the backend listens on (Render sets it) |
| `FRONTEND_URL` | backend | `http://localhost:3000` | Origin allowed by CORS. Required in production (`NODE_ENV=production`, or on Render): without it, or if it is not an http(s) URL, the server does not start. Only its origin is used, so a final slash does no harm |
| `CLIENT_IP_HEADER` | backend | not set | Header where the hosting platform puts the address of the player; needed for the limits per address. On Render use `cf-connecting-ip` |
| `LIMIT_BY_PEER_ADDRESS` | backend | not set | `true` to limit by the address of the connection itself: only for local development or a server with no proxy, never behind one |

---

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).
