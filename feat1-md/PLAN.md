# Team 1 Plan — Manager Command Center

Last updated: 2026-04-04

## Scope

This file is the current Team 1 implementation plan for the master repo.

Read it alongside:

- `PROJECT_MASTER_PLAN.md`
- `FEATURE_TAB_MAPPING.md`
- `API_STRUCTURE.md`
- `feat1-md/CURRENT_API_LIMITATION.md`
- `feat1-md/PORT_PROGRESS.md`
- `feat1-md/AGENTS.md`

The master plan remains the target-state source of truth.

This file explains how Team 1 should continue building from the **current implemented state** in the shared repo.

## Team 1 mission

Team 1 owns the manager-facing product surface for:

- managers
- project managers
- dispatchers
- sales managers
- finance and billing staff

The product should help leadership answer:

- What projects are slipping?
- What tasks or follow-ups need action today?
- What service work is aging or blocked?
- What sales, billing, and accounting items need attention?
- What should the manager do next?

This is a read-only business command center.

It is **not** an API monitoring product.

## Current implementation reality in master

Current implemented Team 1 surface in the master repo:

- page: `/feature1`
- APIs:
  - `/api/feature1/overview`
  - `/api/feature1/projects`
  - `/api/feature1/tasks`
- shared Q360 discovery routes:
  - `/api/q360/access`
  - `/api/q360/discovery`
  - `/api/q360/schema`
  - `/api/q360/tables`

Current Team 1 backend/domain foundation lives in:

- `lib/q360/**`
- `lib/domain/**`
- `lib/rules/business-rules.ts`
- `lib/sqlite.ts`
- `mock/q360/**`

Current Team 1 verification status:

- `npm run build` passes
- `npm test` passes
- Team 1 backend/domain tests are ported into the master repo

Important route implication:

- `/feature1` is the current Team 1 route contract
- `app/(manager)/*` is still a target-state structure, not the active implementation
- route migration should happen only after the current Team 1 surface is more mature

## Current live Q360 reality

Confirmed live-safe foundations today:

- `GET /api/Project?_a=list`
- `GET /api/Task?_a=list`
- Data Dictionary discovery endpoints

Important constraints:

- many generic `POST /api/Record/{source}?_a=list` reads are still blocked for the current API user
- the documented datasource access-list route is not dependable in this tenant
- project/task should remain the only confidently live-backed Team 1 story until more sources are validated source-by-source

Practical implication:

- projects and tasks are the Team 1 live foundation
- service, sales, accounting, customer, invoice, and profitability views should be explicitly labeled by implementation mode:
  - live-backed
  - mock-backed
  - planned

Current mock implication:

- in mock mode, Team 1 now prefers SQLite data from `mock.db`
- bundled fixture rows are fallback-only when `mock.db` does not contain compatible Team 1 tables
- minimum seed for the current manager page:
  - `projects`
  - `projectschedule`
- richer optional sections also use `projectevents` and `timebill` when present

## Unified schema direction

Team 1 now uses a unified manager-facing schema contract in the master repo.

Key files:

- shared Q360/entity types: `types/q360.ts`
- normalized Team 1 business models: `lib/domain/models.ts`
- Team 1 normalizers: `lib/domain/normalizers.ts`

Important design decision:

- the current Team 1 schema is a **superset** of the current live-safe project/task slice and the broader manager schema from the master plan
- this keeps the current port stable while aligning future PostgreSQL-backed work to one contract

That means the current schema already has room for:

- richer project budgets/progress
- customer health
- dispatch/service context
- invoices
- service contracts
- deals and quotes

Even where the current live reads are not yet validated.

## Team 1 source strategy

### Live-backed now

These are the current live-backed foundations Team 1 should actively build on:

- project list endpoint
- task list endpoint
- schema discovery endpoints

These support:

- project health cards and lists
- task/follow-up pressure
- manager agenda inputs
- project detail drill-in

### Mock-backed now

These are the current local mock foundations Team 1 uses when `USE_MOCK_DATA=true`:

- `mock.db` `projects`
- `mock.db` `projectschedule`
- optional: `mock.db` `projectevents`
- optional: `mock.db` `timebill`

### Mock-backed or gated for now

These are in Team 1 scope, but should not be treated as fully live-backed yet without additional source validation:

- dispatch/service queue sources
- customer health sources
- invoice and AR/AP sources
- quote and opportunity sources
- profitability and forecast sources
- service contract sources

## Recommended Team 1 page order

### 1. `/feature1`

Keep this as the current Team 1 landing page.

Short-term job:

- remain the manager entry point
- summarize project health, follow-ups, and next actions
- route users into dedicated Team 1 subpages as they are added

### 2. `/feature1/projects`

This should be the next Team 1 page.

Reason:

- projects are the strongest live-backed Team 1 story right now
- the data contract is already verified and tested
- it moves Team 1 toward the master-plan structure without a large route migration yet

First version should include:

- filterable project list or card grid
- due date pressure
- overdue task count
- owner
- customer
- quick status indicators

### 3. `/feature1/projects/[projectNo]`

Next after the projects list.

First version should include:

- project summary
- linked tasks
- recent activity when available
- effort or billing context when source access is safe
- Team 2 status-report or recommendation integration later

### 4. `/feature1/service`

Add only after the service read path is validated or explicitly mocked.

Goal:

- dispatch queue visibility
- queue aging / pressure
- clear link to project/customer progress

### 5. `/feature1/sales`

Likely mock-backed first.

Goal:

- pipeline chart
- quotes/opportunities list
- forecast indicators

### 6. `/feature1/accounting`

Likely mock-backed first.

Goal:

- invoice summaries
- AR/AP or outstanding balances
- revenue snapshots

### 7. `/feature1/reports`

Later stage.

Goal:

- Live Data-style analytical report entry point
- embedded or mirrored reports once the experience is worth integrating

## Recommended next implementation order

1. refine `/feature1` into a cleaner Team 1 manager landing page
2. extract reusable Team 1 components from the current page
3. add `/feature1/projects`
4. add `/feature1/projects/[projectNo]`
5. add `/feature1/service` only when the source strategy is explicit
6. add mock-backed `sales` and `accounting` pages with clear status labels
7. later decide whether to migrate the route structure to `app/(manager)/*`

## Review checkpoints

Before calling a Team 1 page complete, confirm:

- it answers a real manager question
- it uses the normalized Team 1 schema, not raw Q360 payloads
- its live/mock status is truthful
- it has loading, error, and empty states
- it does not expose credentials or raw Q360 envelopes to the client
