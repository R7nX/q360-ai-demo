# AGENTS.md — Team 1 Manager Command Center Guide

Read the project-wide `AGENT.md` first.

This file is the Team 1-specific working guide for continuing development in the shared master repo.

## Team 1 scope

You are building for Team 1 in:

- `FEATURE_TAB_MAPPING.md`
- `PROJECT_MASTER_PLAN.md`

Current Team 1 implementation route surface:

- `/feature1`
- `/api/feature1/overview`
- `/api/feature1/projects`
- `/api/feature1/tasks`

Target-state Team 1 ownership remains broader than the current route set:

- manager dashboard
- projects
- service
- sales
- accounting
- reports

## Product overview

This app is for understanding the progress of the business.

The Team 1 product should help users track:

- deals and opportunities
- quotes and proposals
- active projects
- task and follow-up execution
- billing, job costing, and profitability
- service work where it materially affects project or customer progress

The Q360 endpoints are only the integration layer used to read this data.

The product direction should match Solutions360's public positioning of Q360 as a platform connecting sales, quoting, project management, invoicing, and accounting.

## Product priorities

Always prefer work that improves visibility into:

- project and deal status
- missing follow-up
- stalled work
- billing lag
- profitability or forecast risk
- clear next actions

Do not prioritize:

- endpoint health dashboards as a product feature
- infrastructure-style monitoring panels
- service-only workflows unless they directly affect project or customer progress

## Current Team 1 docs

Use these Team 1 current-state docs together:

- `feat1-md/PLAN.md`
- `feat1-md/PORT_PROGRESS.md`
- `feat1-md/CURRENT_API_LIMITATION.md`

Important distinction:

- `PROJECT_MASTER_PLAN.md` and `FEATURE_TAB_MAPPING.md` are the target-state docs
- the `feat1-md/*` docs describe the current implemented Team 1 state in the master repo

## Tech stack

Use this stack unless there is a strong reason to change it:

- Next.js App Router with TypeScript
- Tailwind CSS 4
- Zod for validation
- Vitest + MSW for backend/domain tests
- SQLite acceptable for local-only development
- PostgreSQL is the intended longer-term app-owned database target
- Team 2 / Gemini APIs for shared AI behavior

## Current Team 1 repository structure

Current Team 1 work in the master repo primarily lives in:

```text
/app
  /feature1
  /api/feature1
  /api/q360
/lib
  /q360
  /domain
  /rules
/types
  q360.ts
/feat1-md
```

Current important Team 1 files:

- `app/feature1/page.tsx`
- `app/api/feature1/overview/route.ts`
- `app/api/feature1/projects/route.ts`
- `app/api/feature1/tasks/route.ts`
- `lib/q360/**`
- `lib/domain/**`
- `lib/rules/business-rules.ts`
- `lib/sqlite.ts`
- `types/q360.ts`

## Current schema direction

Shared Q360/entity types live in:

- `types/q360.ts`

Normalized Team 1 business models live in:

- `lib/domain/models.ts`

Rules:

- the UI must not consume raw Q360 payloads
- every field must be explicitly mapped
- missing fields should degrade to `null`, never crash
- use the unified Team 1 manager-schema superset already established in the master repo
- future PostgreSQL-backed Team 1 work should align to this shared contract, not invent a parallel schema

## Architecture layers

## Layer 1 — Q360 adapter

Location:

- `lib/q360`

Responsibilities:

- all Q360 HTTP calls
- Basic Auth handling
- `DataDict` access
- schema discovery
- dedicated list-action reads
- generic `Record list` calls where source access allows
- pagination
- response normalization
- error handling

Rules:

- Q360 credentials must never leave the server
- never hardcode primary keys
- treat HTTP success and Q360 `success` as separate checks
- log `referencecode` and `procname`
- keep request-casing quirks hidden inside this layer

## Layer 2 — Domain normalization

Location:

- `lib/domain`

Normalize Q360 data into business objects such as:

- `Deal`
- `Quote`
- `Project`
- `Task`
- `Activity`
- `ScheduleItem`
- `BillingSnapshot`
- `ProfitabilitySnapshot`
- `Customer`
- `Dispatch`
- `Invoice`
- `ServiceContract`
- `Recommendation`

## Layer 3 — Rules and scoring

Location:

- `lib/rules`

Purpose:

- compute deterministic business progress and risk signals
- produce agenda ranking
- generate traceable recommendation inputs

Preferred rule families:

- `overdue_task`
- `stalled_project`
- `billing_gap`
- later: `quote_follow_up_needed`, `profitability_risk`, `forecast_drift`, `handoff_risk`

Rules:

- all scoring is deterministic
- every signal must carry source record IDs
- thresholds must be named constants
- AI must not rank or score records

## Layer 4 — Frontend surface

Current location:

- `app/feature1`

Current reality:

- `/feature1` is the active Team 1 landing page
- the target `app/(manager)/*` route group does not exist yet in the active implementation
- route migration should happen incrementally, not by replacing the current working surface all at once

## Source strategy

## Live-backed now

These are the safest current Team 1 foundations:

- dedicated `Project` list endpoint
- dedicated `Task` list endpoint
- schema discovery endpoints

Use these first for:

- project health
- task follow-up
- manager agenda
- project drill-in

## Mock-backed now

When `USE_MOCK_DATA=true`, Team 1 now prefers SQLite rows from `mock.db`.

Minimum tables for the current Team 1 page:

- `projects`
- `projectschedule`

Optional richer mock sections:

- `projectevents`
- `timebill`

Team 1 no longer ships bundled row fixtures as a runtime fallback. Mock mode now requires actual compatible SQLite tables.

## Schema-visible or partially validated, but not yet fully live-safe

- `PROJECTEVENTS`
- `GLOBALSCHEDULE`
- `TIMEBILL`
- `LDView_TimeBillSummary`
- `LDView_ProjectHours`
- `CUSTOMER`
- `QUOTE`
- `INVOICE`
- `SERVICECONTRACT`
- profitability / forecast sources

These can still appear in Team 1 design and mock data, but do not claim they are fully live-backed without source-by-source validation.

## Supporting sources, not core sources

- `SITE`
- `DISPATCH`
- `RECURRINGDISPATCH`
- `SURVEY`
- `DISPATCHINSPECTION`

Only use them if they materially improve project, customer, or billing visibility.

## Implementation priorities

When coding Team 1 next, prefer this order:

1. refine `/feature1` into a cleaner manager landing page
2. extract reusable Team 1 components
3. add `/feature1/projects`
4. add `/feature1/projects/[projectNo]`
5. expand into service, sales, accounting, and reports only with truthful live/mock labeling
6. integrate Team 2 AI outputs on top of validated or explicitly mock-backed records

## Testing expectations

## Q360 adapter tests

Use Vitest and mock network responses.

Must cover:

- valid envelope parsing
- `success: false` on HTTP 200
- logging of `referencecode` and `procname`
- schema caching
- pagination
- no credential leakage

## Domain normalizer tests

Must cover:

- `Project`
- `Task`
- `Activity`
- `ScheduleItem`
- `BillingSnapshot`
- `ProfitabilitySnapshot`
- `Deal`
- `Quote`
- the added manager-facing entities when normalizers exist for them

## Rules tests

Every rule needs trigger and non-trigger cases.

At minimum:

- overdue task
- stalled project
- billing gap

## Definition of done

A Team 1 feature is complete when:

- it answers a real manager/business question
- it pulls from normalized domain data
- its Q360 source status is documented
- it has loading, error, and empty states
- it works in mock mode or has an explicit mock fallback story
- it does not expose credentials or raw Q360 envelopes to the client

## Success criteria

The Team 1 prototype is successful when a user can:

- understand deal and project progress quickly
- spot stalled work and missing follow-up
- see billing or profitability risk early
- trust that next steps are tied to real or explicitly mock-backed records

## Current known limitations

- many generic `POST /api/Record/{source}?_a=list` reads are still blocked for the current API user
- the datasource access-list route is not dependable in the live tenant
- `Q360_MOCK_MODE` still exists as a legacy fallback, but `USE_MOCK_DATA` is now the primary Team 1 mock switch

Treat these as integration constraints, not product features.

Continue validation source by source until broader business record reads are locked.

Run the relevant tests and the build after meaningful Team 1 changes. If they fail, keep debugging until the branch is back in a clean state.
