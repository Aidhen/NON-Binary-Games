# (non)BinaryGames 🎲

> A queer-owned online platform that turns classic casual games into shared experiences.

I had this idea while looking for ways to pass the time with my long-distance partner. We both don't always have the right amount of energy to engage in complex activities together, so we were looking for a low-pressure way to connect and found the answer in Sudokus and other simple games. :)

**(non)BinaryGames** will be a collection of simple games meant to be played side by side by you and your partner, focusing on connection over competition.

---

## Architecture & Tech Stack

This project is built with a focus on Developer Experience (DX), modularity, and clean code. It relies on a **Monorepo** architecture managed via `npm workspaces`, separating the client interface from the core game engines.

### Workspace Structure
* **`@nbg/shared`**: Agnostic, pure TypeScript core logic. Currently houses the custom Sudoku Engine (backtracking generator, validator, difficulty scaler).
* **`@nbg/frontend`**: Next.js/React interface. Built with a native, headless approach using **Tailwind CSS**, favoring complete DOM control over heavy pre-styled component libraries.

### Infrastructure & Developer Experience (DX)
* **Testing:** Comprehensive unit testing with **Vitest** (configured for monorepo workspaces and parallel execution).
* **Containerization:** **Docker & Docker Compose** for reproducible development environments.
* **CI/CD:** Automated pipelines via **GitHub Actions** enforcing code quality on every push.
* **Git Hygiene:** Automated pre-commit linting (`lint-staged`) and pre-push testing via **Husky** to guarantee branch stability without aggressive commit message blocking.

---

## Current Status: Active Development

The project is in its foundational stage. The current focus is on building a robust, mathematically sound Sudoku engine before wiring up the multiplayer layer.

**Completed Milestones:**
- [x] Monorepo setup and Dockerization
- [x] CI/CD pipeline and Git hooks configuration
- [x] Core Sudoku engine (Generation, Validation, Hole-punching for difficulty) 

---

## Roadmap & Upcoming Architecture

The next major milestone is implementing the multiplayer connectivity layer to allow real-time co-op gameplay.

- **Real-Time Backend:** Node.js server utilizing WebSockets for low-latency, bidirectional state synchronization between clients.
- **In-Memory Datastore:** Redis integration to handle active session states and temporary match data efficiently without overloading a traditional SQL database.
- **Container Orchestration:** Expanding the `docker-compose` setup to link the frontend client, Node.js server, and Redis instance seamlessly for local development.

## Getting Started (Local Development)

The repository is fully containerized. You don't need Node.js installed locally.

```bash
# 1. Clone the repository
git clone [https://github.com/Aidhen/non-binary-games.git](https://github.com/Aidhen/non-binary-games.git)
cd non-binary-games

# 2. Install monorepo dependencies via the CLI container
docker compose run --rm node-cli npm install

# 3. Start the development servers
docker compose up --build
