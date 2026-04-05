# Q360 AI Demo

A shared Next.js demo app showing how AI workflows can be embedded into **Q360** for managers and frontline employees.

This repository now contains both:

- the shared multi-team master plan
- the actively ported Team 1 implementation work

## Project goal

Build a compelling end-of-April 2026 demo showing how AI can reduce manual work in Q360 through:

- manager-facing business visibility
- smart drafting and summaries
- action recommendations tied to Q360 records
- role-specific workflows for manager and employee views

## Current status

Current implemented routes:

- `/` — landing page
- `/feature1` — Team 1 manager command center (current implementation route)
- `/feature2` — Team 2 shared AI tools surface

Current Team 1 backend routes:

- `/api/feature1/overview`
- `/api/feature1/projects`
- `/api/feature1/tasks`
- `/api/q360/access`
- `/api/q360/discovery`
- `/api/q360/schema`
- `/api/q360/tables`

Current verification status:

- `npm run build` passes
- `npm test` passes
- Team 1 backend/domain tests are enabled in the master repo

## Tech stack

- Next.js 16 (App Router, TypeScript)
- React 19
- Tailwind CSS 4
- Google Gemini via `@google/genai`
- SQLite (`better-sqlite3`) for local mock data and seed workflows
- Q360 REST API (Basic Auth via server-side env vars)
- Vitest + MSW for Team 1 backend/domain tests

## Quick start

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

```bash
cp .env.example .env.local
```

Fill in your Q360 and Gemini credentials in `.env.local`.

Important current notes:

- `Q360_API_USERNAME` is the preferred API user env var in this repo.
- Team 1 also accepts `Q360_API_USER` as a fallback.
- Web session endpoints use `fshirley`.
- REST API calls use the configured Q360 API user.

### 3) Optional: seed mock data

```bash
npm run tables
npm run seed -- dispatch 25
```

Feature 1 now prefers `mock.db` in mock mode. To populate the current Team 1 manager view, seed at least:

```bash
npx tsx scripts/seed-mock-db.ts projects 25
npx tsx scripts/seed-mock-db.ts projectschedule 60
```

Optional richer Team 1 sections:

```bash
npx tsx scripts/seed-mock-db.ts projectevents 40
npx tsx scripts/seed-mock-db.ts timebill 40
```

For a quick local-only Feature 2 dataset with no Q360 dependency:

```bash
npx tsx scripts/seed-local.ts
```

### 4) Run the development server

```bash
npm run dev
```

Open `http://localhost:3000` or the next available local port printed by Next.js.

### 5) Run tests

```bash
npm test
```

## Environment variables

Defined in `.env.example` / expected in `.env.local`:

- `Q360_BASE_URL` — Q360 API base URL
- `Q360_API_USERNAME` — preferred Q360 API user env var
- `Q360_API_PASSWORD` — Q360 API password
- `GEMINI_API_KEY` — Google Gemini API key
- `USE_MOCK_DATA` — shared mock-data flag for Feature 1 and Feature 2
- `DATABASE_URL` — SQLite file path used by runtime readers and seed scripts

Current Team 1 note:

- Feature 1 now reads from `mock.db` first in mock mode
- `Q360_MOCK_MODE` is still accepted as a legacy fallback, but `USE_MOCK_DATA` is the primary switch
- bundled Team 1 fixture files are now fallback-only when `mock.db` does not contain compatible tables

## NPM scripts

- `npm run dev` — start Next.js dev server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — run ESLint
- `npm run test` — run Vitest
- `npm run test:coverage` — run Vitest with coverage
- `npm run tables` — list Q360 tables from Data Dictionary API
- `npm run seed -- <table> [count]` — seed a local table in `mock.db`

## Project docs

### Target-state planning docs

- `PROJECT_MASTER_PLAN.md` — full implementation plan and ownership model
- `FEATURE_TAB_MAPPING.md` — Q360 tab-to-feature mapping
- `API_STRUCTURE.md` — Q360 endpoint, schema, and auth reference

### Current-state Team 1 docs

- `feat1-md/PLAN.md` — current Team 1 execution plan in the master repo
- `feat1-md/PORT_PROGRESS.md` — Team 1 port status and next-stage tracker
- `feat1-md/CURRENT_API_LIMITATION.md` — current live tenant access constraints
- `AGENT.md` — whole-project assistant and implementation guardrails
- `feat1-md/AGENTS.md` — Team 1-specific development guide

## Notes

- This project is a demo/prototype, not production software.
- Keep secrets in `.env.local` only.
- Team 1 should treat projects/tasks as the current live-backed foundation and stage broader business modules carefully.
