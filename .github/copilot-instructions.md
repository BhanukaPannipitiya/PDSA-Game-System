## Quick orientation

This repository currently contains a single `backend/` package (Node.js). Key facts discovered by scanning files:

- `backend/package.json` exists and lists `main: "index.js"`, but there is no other code in the repo yet.
- There are no README or agent instruction files to merge; this is a minimal starter repository.

Use this file to guide automated code edits so they remain safe, small, and consistent with the project's structure.

## What an AI agent should expect

- The repository is a small Node backend package. Most work will live under `backend/`.
- `backend/package.json` currently contains only a placeholder `test` script and references `index.js` as the entry point. If adding a server or CLI, place the main file at `backend/index.js` (or update `package.json` accordingly).

## Practical rules for edits

1. Start from `backend/` for any runtime changes. Open `backend/package.json` first to discover scripts and dependencies.
2. If you add runtime code, also add or update `package.json` scripts. Example minimal scripts we expect to see:

   - `"start": "node index.js"` — add when implementing a simple server entrypoint.
   - `"dev": "nodemon index.js"` — add if you add a dev dependency (nodemon) to speed iterative testing.

3. If you add dependencies, modify `backend/package.json` and provide a one-line justification in the commit message (why the package is required).

4. Tests: none exist yet. If you add tests, put them in `backend/test/` and add a `test` script that runs the chosen test runner (e.g. mocha, jest).

## Conventions and patterns found here

- Project root is a workspace containing a `backend/` package. Keep changes to that folder unless the change is explicitly cross-cutting.
- The `main` field currently points to `index.js` — prefer adding `backend/index.js` rather than changing the `main` field, unless you're restructuring to multiple packages.

## Developer workflows (discovered / recommended)

- Install dependencies inside the `backend/` directory using your Node toolchain (npm or pnpm). Example (local dev):

  - npm: `cd backend && npm install`

- Run the project after you add an entrypoint and scripts: `cd backend && npm run start` (or `npm run dev` if you add a dev script).

## Integration points and assumptions to verify

- There are no external integrations (databases, cloud services) discoverable in the repo. If you add integrations, declare connection strings and credentials as environment variables and document them in `backend/README.md`.

## Commit / PR guidance for automated changes

- Keep each automated commit focused and small: "Add backend/index.js: simple HTTP server" or "Add jest and basic test harness".
- If you add dependencies, include their purpose in the commit body and add or update scripts in `backend/package.json`.

## If you (the AI) are unsure

- Ask the user before large structural changes (adding multiple packages, converting to monorepo tooling, or introducing CI). Small additions (entrypoint, basic scripts, tests) are OK to create, but note them in the commit message.

---
If any of these sections are unclear or you'd like the agent to follow stricter conventions (e.g., preferred test runner, lint rules, CI), tell me what to add and I will update this file.
