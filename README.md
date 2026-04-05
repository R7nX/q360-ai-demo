# Q360 AI Demo

A Next.js prototype that demonstrates how AI workflows can be embedded into **Q360** (field service management ERP) for managers and frontline employees.

This repository is the shared codebase for a multi-team internship demo, with planning and API references included in-repo.

## Project Goal

Build a compelling end-of-April 2026 demo showing how AI can reduce manual work in Q360 through:

- Smart drafting (emails, summaries, status updates)
- Action recommendations based on Q360 records
- Role-specific workflows for manager and employee views

## Current Status

The app scaffold and local tooling are in place, including:

- Next.js 16 + React 19 project structure
- Local SQLite mock database (`mock.db`)
- Seeder script that pulls Q360 table schema and generates synthetic rows
- Core planning docs (`docs/plans/PROJECT_MASTER_PLAN.md`, `docs/reference/API_STRUCTURE.md`, `docs/plans/FEATURE_TAB_MAPPING.md`)

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- React 19
- Tailwind CSS 4
- SQLite (`better-sqlite3`) for local mock data
- Q360 REST API (Basic Auth via server-side env vars)

## Quick Start

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

```bash
cp .env.example .env.local
```

Fill in your Q360 and AI provider credentials in `.env.local`.

For sandbox authentication conventions:

- Web session endpoints (for example `/api/authenticate` and `/api/Toolbar`) use `userid=fshirley`.
- REST API endpoints (`/api/*` with Basic Auth) use `Q360API_UTAH` (or your assigned `Q360API` user).
- In this sandbox, the web user and API user currently share the same password.

### 3) Optional: seed mock data

```bash
npm run tables                 # list available Q360 tables
npm run seed -- dispatch 25    # seed a specific table into mock.db
```

### 4) Run development server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Defined in `.env.example`:

- `Q360_BASE_URL` — Q360 API base URL (sandbox)
- `Q360_API_USERNAME` — Q360 API user
- `Q360_API_PASSWORD` — Q360 API password
- `ANTHROPIC_API_KEY` — AI provider key
- `USE_MOCK_DATA` — `true` to use local SQLite data path
- `DATABASE_URL` — SQLite file path for local dev

`fshirley` is used for browser-session auth calls and uses the same sandbox password as `Q360_API_PASSWORD`.

## NPM Scripts

- `npm run dev` — start Next.js dev server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — run ESLint
- `npm run tables` — list Q360 tables from Data Dictionary API
- `npm run seed -- <table> [count]` — seed a local table in `mock.db`

## Project Docs

- `docs/plans/PROJECT_MASTER_PLAN.md` — full implementation plan and ownership model
- `docs/reference/API_STRUCTURE.md` — Q360 endpoint, schema, and auth reference
- `docs/plans/FEATURE_TAB_MAPPING.md` — Q360 tab-to-feature mapping
- `AGENT.md` — project context and assistant guardrails

## Notes

- This project is a **demo/prototype**, not production software.
- Keep secrets in `.env.local` only (never commit credentials).
