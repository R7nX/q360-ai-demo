# Port Progress — Team 1 Prototype into Master Repo

Last updated: 2026-04-04

## Purpose

This document tracks the real Team 1 port status from the donor prototype repo into the canonical shared repo:

- canonical repo: `/Users/nolanmai/Desktop/Q360 Solutions/q360-ai-demo`
- working branch: `codex/team1-port-command-center`

This is not a branch conversion.

It is a hybrid integration:

1. port the Team 1 backend/domain logic that already solved real Q360 integration problems
2. adapt routes, shared types, and UI entry points to the master repo structure
3. defer broader structural migration until the first Team 1 slice is stable in master

## Current confirmed state

Current verified status on the master feature branch:

- rebased onto latest `origin/main`
- pushed to remote
- `npm run build` passes
- `npm test` passes
- `/feature1` exists
- `/api/feature1/overview` exists
- `/api/feature1/projects` exists
- `/api/feature1/tasks` exists
- `/api/feature1/snapshots` exists
- `/api/feature1/details` exists
- Team 1 Q360 adapter accepts the master repo's `Q360_API_USERNAME` env style
- Team 1 schema is unified as a manager-facing superset in the master repo
- Team 1 now prefers PostgreSQL rows from `DATABASE_URL` whenever it is a PostgreSQL connection string

Important limitation:

- automated localhost runtime checks from this sandbox are still unreliable
- the dev server starts successfully, but sibling shell sessions cannot consistently connect back to it
- browser-level verification still needs to be done manually

## Completed stages

### Stage 0 — Donor checkpoint

Completed.

- donor repo checkpointed before the port
- donor checkpoint commit: `51d31dc`

### Stage 1 — Master feature branch creation

Completed.

- created and pushed `codex/team1-port-command-center`

### Stage 2 — Backend foundation port

Completed.

Ported into the master repo:

- `app/api/q360/access/route.ts`
- `app/api/q360/discovery/route.ts`
- `app/api/q360/schema/route.ts`
- `app/api/q360/tables/route.ts`
- `lib/domain/dates.ts`
- `lib/domain/models.ts`
- `lib/domain/normalizers.ts`
- `lib/q360/adapter.ts`
- `lib/q360/business-read.ts`
- `lib/q360/candidate-sources.ts`
- `lib/q360/client.ts`
- `lib/q360/list-actions.ts`
- `lib/q360/record-list.ts`
- `lib/q360/schema-discovery.ts`
- `lib/rules/business-rules.ts`

### Stage 3 — Team 1 API shape in master

Completed.

Added feature-scoped Team 1 routes instead of copying the old `/api/business/*` shape:

- `app/api/feature1/overview/route.ts`
- `app/api/feature1/projects/route.ts`
- `app/api/feature1/tasks/route.ts`
- `app/api/feature1/snapshots/route.ts`
- `app/api/feature1/details/route.ts`

Decision:

- keep Team 1 aligned with the current `/feature1` convention in master
- do not force `app/(manager)/*` yet

### Stage 4 — Team 1 UI entry point

Completed for the first pass.

Added:

- `app/feature1/page.tsx`

Current role:

- server-rendered Team 1 landing page
- backed by the Team 1 business aggregation layer
- intentionally transitional

### Stage 5 — Shared type consolidation

Completed.

Result:

- shared Q360 metadata/discovery types live in `types/q360.ts`
- Team 1 imports use the shared master type surface
- temporary Team 1 type fork removed

Checkpoint:

- `2851d3d align team1 q360 types with shared master types`

### Stage 6 — Master env compatibility

Completed.

Result:

- Team 1 adapter accepts `Q360_API_USER ?? Q360_API_USERNAME`

Checkpoint:

- `b111d91 support master q360 username env in team1 adapter`

### Stage 7 — Test/tooling hardening

Completed.

Added to master repo:

- `vitest.config.ts`
- `test` and `test:coverage` scripts
- `zod`, `vitest`, `@vitest/coverage-v8`, and `msw` dependencies
- Team 1 backend/domain test files

Result:

- Team 1 backend/domain tests now run in the master repo

### Stage 8 — Team 1 schema unification

Completed.

Result:

- Team 1 schema is now a superset of the current live-safe project/task slice and the broader manager schema from the master plan
- shared Q360/entity types expanded in `types/q360.ts`
- normalized Team 1 models expanded in `lib/domain/models.ts`
- normalizers and Team 1 mock fixtures updated accordingly

Checkpoint:

- `10ad933 harden team1 schema and backend tests`

### Stage 9 — Current-state docs in master

Completed.

Result:

- current Team 1 implementation docs now live in the master repo
- active Team 1 development no longer depends on donor-only markdown files

### Stage 10 — PostgreSQL-backed Team 1 data path

Completed.

Result:

- Team 1 now reads compatible manager data from PostgreSQL when `DATABASE_URL` points to Postgres
- Team 1 runtime no longer depends on `USE_MOCK_DATA`
- Team 1 now requires actual compatible PostgreSQL tables and no longer falls back to bundled row fixtures
- current Feature 1 project rendering is built around `PROJECTS`, `LDVIEW_PROJECT`, `LDVIEW_PROJECTSNAPSHOT`, and `LDVIEW_PROJECTDETAIL`

## Current implementation decisions

### Decision 1 — `/feature1` is the active Team 1 route

For now, Team 1 lives at:

- `/feature1`

Not at:

- `/dashboard`
- `app/(manager)/dashboard`

Reason:

- that matches the current master landing-page contract
- it avoids route churn while Team 1 is still integrating

### Decision 2 — shared types are the long-term direction

The master shared type file is now the source of truth for the Q360 metadata/discovery and broader entity contracts needed by Team 1.

### Decision 3 — Team 2 code remains untouched unless required for compatibility

The Team 1 port did not overwrite:

- `app/feature2/**`
- `app/api/feature2/**`
- `lib/agentClient.ts`
- `lib/emailPrompts.ts`
- `lib/mockDb.ts`
- `types/feature2.ts`

### Decision 4 — projects and tasks remain the live-backed foundation

The first Team 1 slice in master is still centered on:

- projects
- tasks
- follow-up pressure

Service, sales, accounting, invoices, profitability, and broader commercial views remain staged.

### Decision 5 — PostgreSQL is the primary Team 1 mock backend

When `DATABASE_URL` points to PostgreSQL, Team 1 now prefers:

- `PROJECTS`
- `LDVIEW_PROJECT`
- `LDVIEW_PROJECTSNAPSHOT`
- `LDVIEW_PROJECTDETAIL`
- optional `PROJECTSCHEDULE`
- optional `PROJECTEVENTS`
- optional `TIMEBILL`

from `DATABASE_URL`.

## What is verified vs not yet verified

### Verified

- Team 1 branch rebased onto current `origin/main`
- Team 1 branch pushed to remote
- `npm run build` passes
- `npm test` passes
- Team 1 routes are in the build output
- Team 1 env loading is compatible with the master repo `.env.local`
- Team 1 schema and mock data are aligned to the broader manager direction
- Team 1 mock-mode reads work against SQLite-backed local data

### Partially verified

- `npm run dev` starts successfully in the master repo
- manual browser verification is still needed for route-by-route runtime behavior

### Not yet verified

- full Team 1 runtime behavior in browser against live Q360 data
- whether the current `/feature1` page is acceptable as the long-term Team 1 manager UX
- whether the old shared `lib/mockDb.ts` path should be reconciled or retired
- when to migrate from `/feature1` to the target manager route group

## Remaining gaps

1. Manual runtime verification of `/feature1` should still be completed explicitly.
2. The current `app/feature1/page.tsx` is still a transitional Team 1 page, not the final manager shell.
3. Team 1 is not yet split into the broader route/page set for projects, service, sales, accounting, and reports.
4. Shared helper overlap between `lib/q360Client.ts` and `lib/q360/**` is still unresolved.
5. Shared helper overlap between `lib/q360Client.ts` and `lib/q360/**` is still unresolved outside the Team 1 path.

## Recommended next stage

The next stage should focus on Team 1 UI/page structure, not more backend surface.

### Stage 10 — Team 1 page split

Recommended order:

1. keep `/feature1` as the Team 1 landing page
2. extract reusable Team 1 components from the current page
3. add `/feature1/projects` as the first dedicated Team 1 subpage
4. add project detail after that

### Stage 11 — Manager route evolution

Only after the Team 1 page split is working:

1. decide whether `/feature1` remains permanent or becomes an alias/redirect
2. decide whether to introduce `app/(manager)/*`
3. expand into service, sales, accounting, and reports

## Progress checklist

### Completed

- [x] checkpoint donor repo
- [x] create Team 1 branch in master
- [x] push Team 1 branch to remote
- [x] port Team 1 backend foundation
- [x] add `app/api/q360/**`
- [x] choose Team 1 route shape in master
- [x] add `app/api/feature1/overview`
- [x] add `app/api/feature1/projects`
- [x] add `app/api/feature1/tasks`
- [x] add `app/feature1/page.tsx`
- [x] preserve Team 2 code
- [x] consolidate Team 1 types into shared master types
- [x] make Team 1 compatible with master `Q360_API_USERNAME`
- [x] rebase Team 1 branch onto latest `origin/main`
- [x] verify `npm run build` passes
- [x] port Team 1 backend/domain tests
- [x] verify `npm test` passes
- [x] unify Team 1 schema with the master-plan manager shape
- [x] port current-state Team 1 docs into master

### Still open

- [ ] complete manual browser/runtime verification of `/feature1`
- [ ] split Team 1 into reusable manager components
- [ ] add `/feature1/projects`
- [ ] decide when to introduce broader Team 1 route structure
- [ ] expand beyond project/task only when live source access is confirmed
