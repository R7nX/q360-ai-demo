# Part 3 Build Plan

This document is the execution guide for Part 3 of the Q360 AI Demo: the Employee Workflow Hub.

Use it as the working contract while building. Do not treat this as a loose outline. Each stage below defines what should exist, what should work, what can be mocked, what depends on Team 2, and how to decide that the stage is complete.

After starting, changing, blocking, or finishing any stage, update `docs/reports/report.md` immediately.

## Source of Truth

When there is any conflict, use these documents in this order:

1. `docs/plans/PROJECT_MASTER_PLAN.md`
2. `docs/plans/FEATURE_TAB_MAPPING.md`
3. `docs/reference/API_STRUCTURE.md`
4. `AGENT.md`

How to interpret them:

- `docs/plans/PROJECT_MASTER_PLAN.md` is the main contract for Team 3 routes, files, stage order, and deliverables.
- `docs/plans/FEATURE_TAB_MAPPING.md` defines the employee-facing use cases, Q360 tabs to mirror, main data tables, and Team 2 integration points.
- `docs/reference/API_STRUCTURE.md` defines the real Q360 auth and request rules.
- `AGENT.md` is general project context only. It is useful for constraints like keeping secrets server-side, but some ownership and stack references are older than the master plan.

## Part 3 Goal

Build the employee-facing workflow hub for technicians, CSRs, and junior staff.

The hub should feel like a personal workspace, not a manager dashboard. It should help employees understand:

- what work is assigned to them
- what they should do today
- how to log time
- where they are scheduled
- how to complete common workflows

For demo purposes, the app should still look coherent and useful even when some live data or Team 2 AI integrations are not ready.

## Intended Tech Stack

This is the intended shared project stack for integration across all teams.

Frontend and app framework:

- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS 4

Server and API pattern:

- Next.js route handlers for server-side data access and feature endpoints
- shared server-side utilities under `lib/`
- client UI should consume server-managed data, not direct external services

AI stack:

- Team-wide intended AI provider in the master plan: Google Gemini
- use Gemini as the intended shared AI direction for final cross-team integration
- if older Anthropic-based files still exist in the repo, treat them as implementation leftovers or feature-specific history unless the team explicitly confirms they remain active
- for Part 3 integration purposes, do not couple UI code to any provider SDK directly
- integrate with Team 2 through shared app routes/components, not by assuming provider-specific behavior in page code

Q360 integration:

- Q360 REST API
- HTTP Basic Auth using a `Q360API` user such as `Q360API_UTAH`
- Q360 credentials must stay server-side only
- shared Q360 access logic should live in `lib/` and be reused across features

Application and fallback data layer:

- Prisma for the main application database connection to the homelab-hosted database
- shared Prisma-backed server-side access should be the primary application data path where that database is the source of truth
- SQLite via `better-sqlite3` is currently present for mock and offline fallback through `lib/mockDb.ts`
- `mock.db` and SQLite helpers are fallback/demo support, not automatically the primary source

Automation and deployment:

- n8n hosted on the team lead's homelab and exposed through a Cloudflare tunnel
- Vercel is the intended deployment target for the Next.js app

Environment assumptions:

- `.env.local` holds secrets and connection values
- `Q360_BASE_URL`, `Q360_API_USERNAME`, `Q360_API_PASSWORD` are used for Q360 server access
- `DATABASE_URL` should match the actual Prisma database connection when Prisma is the active primary data path
- `USE_MOCK_DATA` can be used to allow mock/fallback behavior when needed

Alignment rule for Part 3:

- if there is a conflict between what exists in the repo today and what the team intends to integrate at the end, favor the shared project contract and keep Part 3 modular enough to plug into the final team-wide stack
- do not hardcode assumptions that only fit one teammate's temporary local setup

## Current Repo Reality

At the time this plan was last updated, the tracked repo has moved beyond pure scaffold state:

- `app/` now includes Feature 2 routes and Feature 2 UI files
- `lib/` now exists and is already being used as a shared backend utility layer
- `types/` now exists and contains shared TypeScript shapes
- Team 3 Stage 1 shell files now exist under `app/(employee)/` and `components/ai/employee/`
- Team 3 Stage 2 and beyond are still not implemented yet
- Part 3 is partially implemented, not untouched

This matters because the docs show the intended final structure, but the actual repo does not yet match that structure. Build decisions should be made against the documented target, while progress tracking should be honest about what is actually implemented.

Current shared backend files already present:

- `lib/q360Client.ts`
- `lib/mockDb.ts`
- `lib/agentClient.ts`
- `lib/emailPrompts.ts`

How Part 3 should interpret that:

- `lib/q360Client.ts` is the current shared place for Q360 REST access and authorization header construction
- `lib/mockDb.ts` is the current shared place for SQLite mock database reads and offline fallback
- `lib/agentClient.ts` is a current AI wrapper in the repo, but it should not override the master-plan Gemini direction for final team integration
- Part 3 should reuse and extend shared `lib` utilities where appropriate instead of duplicating auth or database access logic inside page code or route handlers

Important environment clarification:

- the main application database connection for your current feature work is Prisma connected to a database hosted in a homelab
- the existing SQLite mock database utilities should be treated as fallback/demo/offline support, not automatically assumed to be the primary Part 3 data path

## Non-Negotiable Rules

These rules apply to every Part 3 stage.

- never call Q360 directly from client-side React components
- all Q360 data access must go through internal Next.js routes
- all secrets stay server-side in `.env.local`
- do not hardcode credentials or tokens anywhere in app code
- use TypeScript for all new code
- build demo-first, not production-perfect
- do not let Part 2 become a blocker unless a page is impossible to render without it
- whenever live data is uncertain, build a graceful fallback state instead of leaving the page broken
- keep authorization logic and database access helpers in shared `lib` files, not repeated across multiple routes

## Data Rules

Preferred Part 3 data sources:

- `DISPATCH` filtered by `TECHASSIGNED = currentUser`
- `TIMEBILL` filtered by `USERID = currentUser`
- `SITE` through dispatch context
- `MACHINE` through dispatch context
- `USERID` for current employee context
- `PROJECTS` if assigned-project context is useful
- `EMPSCHEDULE` or `GLOBALSCHEDULE` if available
- mock task data if a usable task source is unavailable

Current shared implementation pattern in this repo:

- use `lib/q360Client.ts` for Q360 REST access
- use Prisma-backed server-side data access for the primary homelab database path where that is the real source of truth
- use `lib/mockDb.ts` for SQLite-backed fallback reads
- use route handlers under `app/api/*` as the server boundary between frontend pages and backend data access

Primary-vs-fallback data policy for Part 3:

- if the employee-facing data is meant to come from the homelab database, Prisma is the primary access path
- if Q360 REST data is required for a specific flow, use shared Q360 helpers in `lib/`
- if live or homelab-backed data is unavailable during development or demo prep, use `lib/mockDb.ts` as the fallback path
- do not assume SQLite is the canonical source just because mock helpers already exist

Authorization rule for Part 3:

- if Part 3 needs Q360 data, route handlers should call shared `lib` helpers that own the Basic Auth behavior
- do not rebuild Q360 auth header logic separately in every new Team 3 route
- if auth behavior needs to evolve, extend the shared client in `lib/` rather than scattering authorization code

Prisma rule for Part 3:

- if Part 3 needs application data from the homelab-hosted database, access it through Prisma on the server side
- keep Prisma access in shared server-safe utilities, not in client components
- if a reusable Prisma helper layer is added under `lib/`, Part 3 should consume that shared layer rather than writing page-specific database logic
- do not mix direct client-side data access with Prisma-backed server logic

Mock DB rule for Part 3:

- if Part 3 needs seeded or offline-safe dispatch/time/customer/site data, prefer extending `lib/mockDb.ts`
- keep SQLite table checks, normalization, and fallback reads centralized in `lib/mockDb.ts`
- avoid embedding SQL access directly inside Team 3 page files

Data-mode policy:

- `live`: use real Q360-backed internal routes
- `internal api`: use app-owned proxy routes even if they return mock or transformed data
- `mock`: use hardcoded or local seeded data when the live source is missing
- `mixed`: page combines live and mock data

Default fallback rules:

- if `TASK` access is unavailable, use mock tasks
- if employee schedule tables are unavailable, use mock schedule data
- if Team 2 AI routes are unavailable, render placeholder or non-AI content instead of failing
- if a route has no real user context yet, use a clearly documented temporary current-user assumption in `docs/reports/report.md`

## Team 2 Dependency Rules

Part 3 is partially dependent on Part 2, but only through stable boundaries.

Expected Team 2 integration areas:

- `DailyBriefing` using summarization behavior
- dispatch detail using smart reply and email drafting
- workflows page using shared AI route or component patterns
- later drafting helpers such as completion notes or time entry descriptions

Only integrate through:

- shared routes under `app/api/ai/*`
- shared components under `components/ai/*`
- documented request fields such as `entityType`, `entityId`, `intent`, `context`, `audience`, `tone`
- documented response fields such as `success`, `result.content`, `subject`, `actions`, and `metadata`

Do not depend on:

- Team 2 internal implementation details
- unfinished component props that are not documented
- undocumented response shapes
- direct AI provider calls from Part 3 UI code

If Team 2 is unfinished:

- keep the page usable
- leave clean insertion points
- document the missing dependency in `docs/reports/report.md`
- do not postpone the rest of the stage unless the dependency is truly blocking the core page

## Target Part 3 File Contract

These are the target files for Team 3.

Routes:

- `app/(employee)/layout.tsx`
- `app/(employee)/home/page.tsx`
- `app/(employee)/my-dispatches/page.tsx`
- `app/(employee)/my-dispatches/[dispatchNo]/page.tsx`
- `app/(employee)/my-tasks/page.tsx`
- `app/(employee)/time/page.tsx`
- `app/(employee)/schedule/page.tsx`
- `app/(employee)/workflows/page.tsx`

Components:

- `components/ai/employee/EmployeeSidebar.tsx`
- `components/ai/employee/EmployeeHeader.tsx`
- `components/ai/employee/DispatchCard.tsx`
- `components/ai/employee/TaskList.tsx`
- `components/ai/employee/TimeEntry.tsx`
- `components/ai/employee/ScheduleView.tsx`
- `components/ai/employee/WorkflowGuide.tsx`
- `components/ai/employee/DailyBriefing.tsx`

Shared backend/utilities Part 3 should expect to use or extend:

- Prisma-based server utilities for the homelab database when present
- `lib/q360Client.ts` for Q360 fetch and authorization helpers
- `lib/mockDb.ts` for mock DB reads and offline fallback
- `types/q360.ts` for shared Q360 entity typing
- additional Team 3-specific helpers may be added under `lib/` if they are reusable and server-safe

Minimum route outcomes:

- `/home`: employee daily workspace
- `/my-dispatches`: assigned dispatch list
- `/my-dispatches/[dispatchNo]`: technician-facing dispatch detail
- `/my-tasks`: personal tasks and to-do items
- `/time`: time bill logging and recent entries
- `/schedule`: work schedule view
- `/workflows`: guided “how do I do X?” workflow helper

## Stage Plan

### Stage 0: Project Audit and Alignment

Objective:

Establish the real baseline before implementation starts.

Why this stage exists:

- the planning docs describe a more complete target structure than the current repo
- Part 3 depends on both shared routes and Team 2 integration points
- building without a baseline creates avoidable rework

Required work:

- compare the current repo to the target Team 3 route and component list
- list what exists, what is missing, and what is planned-only
- confirm which docs are authoritative for Part 3
- identify all known Part 2 dependencies
- identify what data can be live versus mocked
- record the current `lib` structure and what can already be reused for auth and mock DB access
- record where Prisma-backed homelab data is the primary source versus where SQLite mock data is only fallback

Required output:

- a completed Stage 0 report entry in `docs/reports/report.md`
- a confirmed build order for Stages 1 through 8
- an explicit note on whether the repo matches the target folder contract
- an explicit note on how Part 3 will use existing shared `lib` utilities
- an explicit note on when Part 3 should use Prisma, Q360 REST helpers, or SQLite fallback

Completion standard:

- anyone reading `docs/reports/report.md` can understand the repo baseline without reopening all the docs
- all major dependencies and missing folders are documented

How to test Stage 0:

- confirm the target Team 3 files are listed in this plan
- confirm the actual repo structure has been audited
- confirm Team 2 dependency areas are named explicitly
- confirm `docs/reports/report.md` includes blockers, next step, and current data mode

When to mark complete:

- only after the audit is written down, not just mentally noted

### Stage 1: Employee Shell and Navigation

Objective:

Create the employee shell that all Part 3 pages will live inside.

Files expected:

- `app/(employee)/layout.tsx`
- `components/ai/employee/EmployeeSidebar.tsx`
- `components/ai/employee/EmployeeHeader.tsx`

Supporting structure likely needed before or during this stage:

- `components/ai/employee/`
- employee route group under `app/(employee)/`

What this stage must deliver:

- the employee route group exists
- a reusable layout wraps all employee pages
- sidebar navigation includes:
  - `home`
  - `my-dispatches`
  - `my-tasks`
  - `time`
  - `schedule`
  - `workflows`
- the header feels employee-focused, not executive-focused
- the shell works on desktop and remains usable on smaller screens

Implementation notes:

- build the shell before the inner pages so navigation stays stable
- keep the design simpler than the manager experience
- use copy like “My Workspace”, “My Dispatches”, and “My Tasks”
- do not build manager-style KPI framing into this shell

Allowed fallback:

- routes can temporarily render placeholder page content as long as navigation works

Completion standard:

- every employee route is reachable through the sidebar
- the layout and header are reusable without rewriting them per page
- mobile or narrow-screen layout does not collapse into unusable navigation

How to test Stage 1:

- run the app locally
- click each sidebar link
- verify the correct route loads
- shrink the viewport and verify the shell still works
- verify the shell styling feels employee-oriented, not analytics-heavy

Do not mark complete if:

- links are present but routes are missing
- layout only works on one page
- mobile or narrow-width behavior is broken

### Stage 2: Home and Daily Briefing

Objective:

Build the employee home page as the “here is your day” workspace.

Files expected:

- `app/(employee)/home/page.tsx`
- `components/ai/employee/DailyBriefing.tsx`
- `components/ai/employee/DispatchCard.tsx`
- `components/ai/employee/TaskList.tsx`
- `components/ai/employee/TimeEntry.tsx`

What this stage must deliver:

- the home page opens with an employee-focused daily view
- today’s dispatches are visible
- tasks are visible
- a quick time-entry area exists
- the page still feels complete if AI is not active yet

Required content blocks:

- daily briefing summary
- today’s dispatch list or cards
- tasks or to-do section
- quick time entry section

Data expectations:

- dispatches should prefer the real server-side source for the feature, whether that is Prisma-backed homelab data or Q360-backed internal routes
- tasks may be mocked
- time entry can begin with internal-api or mock-safe behavior
- briefing should be designed to summarize dispatches, tasks, and schedule
- any server-side data access should route through shared `lib` helpers first

Part 2 dependency handling:

- if Team 2 summarization is available, integrate through the shared contract
- if it is not available, render a deterministic placeholder summary or locally assembled plain-language summary

Completion standard:

- the page communicates a believable workday snapshot
- every widget has a stable loading, empty, or fallback state
- the page is demoable even without final AI integration

How to test Stage 2:

- open `/home`
- verify all four content blocks render
- test empty or mock states
- verify the page still reads coherently if briefing AI is unavailable
- verify quick time-entry UI does not visually break

Do not mark complete if:

- the page depends on missing Team 2 work to render
- tasks or dispatches leave blank space without fallback states
- the page does not clearly answer “what is my day today?”

### Stage 3: Dispatch Experience

Objective:

Build the employee dispatch list and dispatch detail flow.

Files expected:

- `app/(employee)/my-dispatches/page.tsx`
- `app/(employee)/my-dispatches/[dispatchNo]/page.tsx`

Supporting backend expectation:

- Part 3 will likely need employee-focused internal routes that build on `lib/q360Client.ts` and `lib/mockDb.ts`

What this stage must deliver:

- a list of dispatches assigned to the current employee
- filtering based on `TECHASSIGNED = currentUser`
- visible dispatch status and priority context
- a detail page that helps a technician act on a single dispatch

Required dispatch list content:

- dispatch number
- customer or site context if available
- problem summary
- priority
- status
- link to detail view

Required dispatch detail content:

- dispatch number
- problem description
- notes or summary area
- site context if available
- machine context if available
- clear placeholder or insertion point for Team 2 tools

Data implementation rule:

- if existing shared `lib` functions do not yet expose the employee-specific dispatch queries needed here, extend the shared `lib` layer first, then consume it from Part 3 routes
- if the canonical dispatch source for the employee experience lives in the homelab database, prefer Prisma-backed server access and only fall back to Q360 or SQLite when needed

Part 2 dependency handling:

- Smart Reply should be additive, not required for the page to function
- Email Drafter should be additive, not required for the page to function
- troubleshooting helper behavior can remain placeholder-based if the integration is not ready

Completion standard:

- a user can go from list to detail without dead ends
- the detail page is useful even before full AI integration
- dispatch context is clear enough to support a demo walkthrough

How to test Stage 3:

- open `/my-dispatches`
- verify assigned dispatches appear
- open at least one detail page
- verify detail data is structured and readable
- verify missing AI integrations do not break the page

Do not mark complete if:

- list items do not link to detail pages
- detail pages rely on missing Team 2 components to render
- dispatch detail lacks the core service context

### Stage 4: Tasks and Time

Objective:

Build the core employee productivity pages outside dispatch management.

Files expected:

- `app/(employee)/my-tasks/page.tsx`
- `app/(employee)/time/page.tsx`

What this stage must deliver:

- a task page that feels like a usable to-do workspace
- a time page that feels like a usable time-entry workflow

Required tasks page behavior:

- render a list of tasks
- support checkboxes or completion affordances
- show visible priority or urgency
- remain useful with mock data if necessary

Data implementation rule:

- if tasks are mocked, document where that mock source lives
- if the mock source becomes shared or reused, move it into `lib/` rather than burying it inside a page component
- if tasks are stored in the homelab database, define a Prisma-backed server access path before building page-level UI assumptions

Required time page behavior:

- show a time-entry form
- show recent time entries or a recent log section
- support a demo-ready entry flow even if persistence is still mocked

Data implementation rule:

- prefer shared helper functions for timebill retrieval or normalization instead of page-local fetch logic
- if time-related data is sourced from the homelab database, standardize that access through Prisma-backed server utilities

Part 2 dependency handling:

- later AI-assisted drafting for time descriptions is optional at this stage
- the page should not assume Team 2 support exists yet

Completion standard:

- tasks page is coherent with real or mock data
- time page demonstrates a believable work logging flow

How to test Stage 4:

- open `/my-tasks`
- verify the list renders and completion UI is understandable
- open `/time`
- verify the form and log section render correctly
- test both filled and empty states if possible

Do not mark complete if:

- tasks page is just placeholder text with no usable structure
- time page lacks either entry or history context

### Stage 5: Schedule View

Objective:

Build the employee schedule experience.

Files expected:

- `app/(employee)/schedule/page.tsx`
- `components/ai/employee/ScheduleView.tsx`

What this stage must deliver:

- a readable schedule page
- a week-style or calendar-style visualization
- a layout that makes immediate sense to an employee

Data rules:

- prefer `EMPSCHEDULE` or `GLOBALSCHEDULE` if available
- use mock schedule data if those sources are not practically accessible yet

Implementation rule:

- if schedule data requires reusable normalization or mock transformations, place that logic in `lib/` instead of inside the visual schedule component
- if schedule data is available through the homelab database, prefer Prisma-backed server access before introducing mock schedule fallbacks

Design rule:

- choose readability over feature depth
- for this demo, “clear and believable” is better than “fully interactive”

Completion standard:

- a user can understand where they are supposed to be and when
- the schedule page fits naturally with the rest of the employee shell

How to test Stage 5:

- open `/schedule`
- verify the schedule is understandable at a glance
- verify the page handles empty or mock data gracefully
- verify spacing and labels remain readable on smaller screens

Do not mark complete if:

- the page needs explanation to understand
- the schedule layout is visually confusing

### Stage 6: Workflow Guide Experience

Objective:

Build the unique Part 3 AI feature: employee workflow guidance.

Files expected:

- `app/(employee)/workflows/page.tsx`
- `components/ai/employee/WorkflowGuide.tsx`

What this stage must deliver:

- an input where the employee can ask “How do I do X?”
- a structured step-by-step response area
- a believable employee-help experience tied to workflow or service tasks

Expected workflow examples:

- “How do I close a dispatch?”
- “How do I log time after a service call?”
- “How do I update a customer before leaving a site?”

Part 2 dependency handling:

- if Team 2 AI support exists, integrate through the shared route or component contract
- if it does not, return structured placeholder guidance so the feature still demos well

Completion standard:

- the workflows page clearly demonstrates the Part 3 AI concept
- responses are structured, readable, and demo-friendly

How to test Stage 6:

- open `/workflows`
- enter at least one realistic employee workflow prompt
- verify the page returns readable steps
- verify missing AI does not create a broken state

Do not mark complete if:

- the page has no real input-to-output flow
- the result is unstructured or too vague to demo

### Stage 7: Part 2 Integration Pass

Objective:

Wire Team 3 pages to Team 2 functionality without making Part 3 fragile.

What this stage must deliver:

- `DailyBriefing` connected to summarization behavior if available
- dispatch detail connected to Smart Reply and Email Drafter if available
- workflows page connected to a shared AI route or component if available
- fallbacks remain intact when Team 2 is unavailable

Required integration rules:

- use only the documented request and response contract
- do not reach into Team 2 component internals
- do not make page rendering depend on Team 2 success
- show loading, empty, error, and unavailable states clearly
- keep any shared auth, DB, or data formatting logic inside `lib/`, not re-implemented in integration components

Completion standard:

- Part 3 gets better when Part 2 exists
- Part 3 still works when Part 2 is incomplete
- dependency points are obvious and contained

How to test Stage 7:

- verify each Team 2 integration path in the UI
- verify loading states
- verify error or unavailable states
- verify the page still functions when the AI integration is absent or disabled

Do not mark complete if:

- any employee page hard-crashes when Team 2 is missing
- the app assumes undocumented response fields

### Stage 8: Polish, QA, and Demo Readiness

Objective:

Make Part 3 reliable and presentation-ready.

What this stage must deliver:

- consistent route flow
- stable responsive behavior
- polished loading and empty states
- clear copy and clear visual hierarchy
- a clean demo path across the main employee flows

Required QA sweep:

- route-to-route navigation
- responsive layout checks
- empty state checks
- mock data state checks
- Team 2 missing-state checks
- lint or static checks where available

Completion standard:

- Part 3 is coherent enough to present in a demo
- remaining issues are known and documented, not surprises

How to test Stage 8:

- click through all employee pages
- test the primary demo path end to end
- test narrow-screen behavior
- run available quality checks such as `npm run lint`
- confirm there are no obvious broken states in the main journey

Do not mark complete if:

- the demo path still contains obvious dead ends
- known issues are undocumented

## Reporting Rules

Whenever a stage changes, update `docs/reports/report.md` immediately.

Each stage entry in `docs/reports/report.md` must include:

- date
- stage number and stage name
- status: `not started`, `in progress`, `blocked`, or `complete`
- work completed
- files touched
- data mode used: `live`, `internal api`, `mock`, or `mixed`
- blockers or dependencies
- next step
- short testing note describing what was actually verified

Use this template:

```md
## Stage X: Stage Name

- Date: YYYY-MM-DD
- Status: in progress
- Work completed:
  - item
  - item
- Files touched:
  - path
  - path
- Data mode:
  - mixed
- Blockers / dependencies:
  - item
- Next step:
  - item
- Tested:
  - item
```

## Build Order

Use this order unless a documented dependency forces a temporary deviation:

1. Stage 0
2. Stage 1
3. Stage 2
4. Stage 3
5. Stage 4
6. Stage 5
7. Stage 6
8. Stage 7
9. Stage 8

## Final Reminder

If a stage is not truly demoable yet, do not call it complete. Mark it `in progress` or `blocked`, explain why in `docs/reports/report.md`, and keep moving with the parts that are not blocked.
