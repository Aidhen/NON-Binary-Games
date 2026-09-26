# (non)BinaryGames 🎲

> A queer-owned online platform that turns classic casual games into shared experiences.

I had this idea while looking for ways to pass the time with my long-distance partner. We both don't always have the right amount of energy to engage in complex activities together, so we were looking for a low-pressure way to connect and found the answer in Sudokus and other simple games. :)

**(non)BinaryGames** will be a collection of simple games meant to be played side by side by you and your partner, focusing on connection over competition.

---

## Architecture & Tech Stack

This project is built with a focus on Developer Experience (DX), modularity, and clean code. It relies on a **Monorepo** architecture managed via `npm workspaces`, separating the client interface from the core game engines.

### Workspace Structure
* **`@nbg/shared`**: Agnostic, pure TypeScript core logic. Houses the custom Sudoku Engine (generator, validator), shared types, and Socket.io payload contracts.
* **`@nbg/backend`**: Node.js & Socket.io authoritative server. Handles room management, real-time state synchronization, payload bound validation, and hybrid win-state detection.
* **`@nbg/frontend`**: Next.js/React interface. Built with a native, headless approach using **Tailwind CSS**, favoring complete DOM control over heavy pre-styled component libraries.

### Infrastructure & Developer Experience (DX)
* **Testing:** Comprehensive unit testing with **Vitest** (configured for monorepo workspaces and parallel execution).
* **Containerization:** **Docker & Docker Compose** for reproducible development environments.
* **CI/CD:** Automated pipelines via **GitHub Actions** enforcing code quality on every push.
* **Git Hygiene:** Automated pre-commit linting (`lint-staged`) and pre-push testing via **Husky** to guarantee branch stability without aggressive commit message blocking.

---

## Current Status: v0.2.0-alpha

The project is currently finalizing its core gameplay loop. The backend real-time multiplayer architecture is fully operational, and the current focus is on polishing the frontend collaborative UI.

**Completed Milestones:**
- [x] Monorepo setup and Dockerization.
- [x] CI/CD pipeline and Git hooks configuration.
- [x] Core Sudoku engine (Generation, Validation, Hole-punching for difficulty).
- [x] UI Refactor & Custom Design System: Component-driven structure and themable primitives.
- [x] i18n Engine: Custom implementation for seamless multi-language support.
- [x] **Backend Multiplayer:** Socket.io room management, real-time state sync, and strict payload defense.
- [x] **Authoritative Validation:** Hybrid Broad/Narrow phase win-state detection to prevent desyncs.

**In Progress:**
- [ ] **Frontend Presence:** Multiplayer cursors, live visual error feedback, and game-over UI.

## Getting Started (Local Development)

The repository is fully containerized. You don't need Node.js installed locally.

```bash
# 1. Clone the repository
git clone https://https://github.com/Aidhen/NON-Binary-Games
cd non-binary-games

# 2. Install monorepo dependencies via the CLI container
docker compose run --rm node-cli npm install

# 3. Start the development servers
docker compose up --build