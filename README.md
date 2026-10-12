# (non)BinaryGames 🎲

> A queer-owned online platform that turns classic casual games into shared experiences.

I had this idea while looking for ways to pass the time with my long-distance partner. We both don't always have the right amount of energy to engage in complex activities together, so we were looking for a low-pressure way to connect and found the answer in Sudokus and other simple games. :)

**(non)BinaryGames** will be a collection of simple games meant to be played side by side by you and your partner, focusing on connection over competition.

---

## Architecture & Tech Stack

This project is built with a focus on Developer Experience (DX), modularity, and clean code. It relies on a **Monorepo** architecture managed via `npm workspaces`, separating the client interface from the core game engines.

### Workspace Structure
- **`@nbg/shared`**: Agnostic, pure TypeScript core logic. Houses the custom Sudoku Engine (generator, validator), shared types (`NotesGrid` dictionary), and Socket.io payload contracts.
- **`@nbg/backend`**: Node.js & Socket.io authoritative server. Handles room management, real-time state synchronization, shared notes hydration/validation (`toggle-note`), payload bound validation, and hybrid win-state detection.
- **`@nbg/frontend`**: Next.js/React interface. Built with a native, headless approach using **Tailwind CSS** (featuring dynamic CSS Grid overlays and hardware-layer keyboard input fallbacks), favoring complete DOM control over heavy pre-styled component libraries.

### Infrastructure & Developer Experience (DX)
- **Testing:** Comprehensive unit, component, and integration testing with **Vitest** (configured for monorepo workspaces, module resolution, and parallel execution).
- **Coverage:** Coverage reporting with Vitest and V8 instrumentation, integrated with SonarQube Cloud.
- **Containerization:** **Docker & Docker Compose** for reproducible development environments.
- **CI/CD:** Automated pipelines via **GitHub Actions** enforcing linting, tests, and SonarQube analysis on every push.
- **Git Hygiene:** Automated pre-commit linting (`lint-staged`) and pre-push testing via **Husky** to guarantee branch stability.

---

## Current Status: v0.1.0-alpha

The core collaborative Sudoku gameplay is fully operational. Players can join multiplayer rooms, synchronize game state in real time, interact with shared notes, and see other players' selections and presence. The project is currently focused on the remaining work needed for a first public release.

### Completed Milestones
- [x] Monorepo setup and Dockerization.
- [x] CI/CD pipeline, SonarQube analysis, and Git hooks configuration.
- [x] Core Sudoku engine (generation, validation, difficulty handling).
- [x] Shared TypeScript types and Socket.io payload contracts.
- [x] Component-driven frontend architecture and reusable UI primitives.
- [x] Custom internationalization engine (English and Italian).
- [x] Socket.IO room management and real-time game-state synchronization.
- [x] Server-side validation of incoming game events and payloads.
- [x] Hybrid win-condition detection to prevent desyncs.
- [x] Shared notes with real-time synchronization and O(1) `NotesGrid` lookup.
- [x] Multiplayer player presence, live cell selection indicators, and deterministic player colors.
- [x] Win-condition detection and game-over UI.
- [x] Automated unit, component, and integration tests.

### Roadmap: First Public Release

#### Must Have
- [ ] **Room Deep Linking:** Implement dynamic routing (`/play/[roomId]`) and a shareable invitation link to reduce friction for multiplayer onboarding.
- [ ] **CORS Configuration:** Configure allowed origins through environment variables on the Node.js backend.
- [ ] **Production Configuration:** Configure frontend and backend URLs, environment variables, and HTTPS/WSS.
- [ ] **Deployment:** Deploy the frontend to Vercel and the backend to a suitable hosting provider.

#### Nice to Have
- [ ] **Rate Limiting:** Protect Socket.IO handlers against excessive event traffic.
- [ ] **Reconnect Experience:** Improve recovery and user feedback when a player disconnects or reconnects.
- [ ] **Error Feedback Modes:** Support immediate conflict detection and an optional omniscient mode comparing entries against the solution.
- [ ] **State Persistence & Horizontal Scaling:** Integrate `@socket.io/redis-adapter` and migrate in-memory room state to Redis to support stateless backend containers and prevent data loss on restart.

---

## Getting Started (Local Development)

The repository is fully containerized. You don't need Node.js installed locally.

```bash
# 1. Clone the repository
git clone https://github.com/Aidhen/NON-Binary-Games
cd non-binary-games

# 2. Install monorepo dependencies via the CLI container
docker compose run --rm node-cli npm install

# 3. Start the development servers
docker compose up --build
```