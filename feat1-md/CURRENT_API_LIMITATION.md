# Current API Limitations

Last updated: 2026-04-04

This document is the current internal record of Q360 API access limits for the configured integration user.

It is intentionally kept out of the end-user product UI.

## Demo guidance

- Do not surface raw API access diagnostics in the product UI.
- Do not present blocked commercial, service, or accounting sources as live-validated.
- Keep demos focused on business workflow and manager decision support, not tenant permission gaps.

## Current live-tenant status

As of 2026-04-04, the configured Q360 API user can reliably access:

- the dedicated `Project` list endpoint
- the dedicated `Task` list endpoint
- core schema discovery endpoints such as `tableList` and `DataDict list` for many business sources

As of 2026-04-04, the same user still does **not** have generic record-list read access for many business sources needed for broader Team 1 live validation.

The documented datasource-permission lookup is also not a dependable live source of truth for this account, so validation must continue source by source.

## Sources that are currently accessible

### Dedicated reads

- `GET /api/Project?_a=list`
- `GET /api/Task?_a=list`

These are the reads the current Team 1 live-backed experience depends on.

### Schema visibility confirmed

The live tenant exposes schema metadata for many business-facing objects, including:

- `PROJECTS`
- `LDView_Project`
- `LDView_ProjectSnapshot`
- `PROJECTSCHEDULE`
- `PROJECTEVENTS`
- `LDView_Task`
- `TaskConsoleView`
- `TASKS`
- `PROJECTTASKHISTORY`
- `GLOBALSCHEDULE`
- `TIMEBILL`
- `LDView_TimeBillSummary`
- `LDView_ProjectHours`
- `LDView_ProjectProfit`
- `PROJECTFORECAST`
- `PROJECTITEM`
- `CUSTOMER`
- `QUOTE`
- `INVOICE`

Schema visibility does **not** mean the current user can read records from those sources.

## Sources currently blocked for generic record-list reads

Generic `POST /api/Record/{source}?_a=list` reads have been blocked for important Team 1 candidate sources, including:

- `PROJECTS`
- `LDView_Project`
- `LDView_ProjectSnapshot`
- `PROJECTSCHEDULE`
- `PROJECTEVENTS`
- `LDView_Task`
- `TaskConsoleView`
- `TASKS`
- `PROJECTTASKHISTORY`
- `GLOBALSCHEDULE`
- `TIMEBILL`
- `LDView_TimeBillSummary`
- `LDView_ProjectHours`
- `LDView_ProjectProfit`
- `PROJECTFORECAST`
- `PROJECTITEM`
- `CUSTOMER`
- `QUOTE`
- `INVOICE`

The denial pattern observed during validation is:

`Access denied. Q360API_UTAH must be granted permission to <source>.`

## Source still not confirmed

- `OPPORTUNITY`

`OPPORTUNITY` did not return a stable usable metadata path during earlier discovery, so it is not currently a reliable live source for deals/opportunities.

## Current implication for Team 1

### Safely live-backed now

- project progress
- follow-up/task pressure
- manager agenda signals derived from project/task data

### Present only as mock-backed or planned until validated

- dispatch/service queue widgets
- customer health widgets
- invoice/AR/AP widgets
- quote/opportunity widgets
- profitability and forecast widgets
- service contract renewal widgets

## Additional confirmation from the current master branch

The current Team 1 master-branch build still logs `DataSourceNotPermitted` errors for optional generic-record sources such as:

- `TIMEBILL`
- `PROJECTEVENTS`
- `LDView_TimeBillSummary`
- `GLOBALSCHEDULE`
- `LDView_ProjectHours`

This confirms the generic-record restriction is still active in the current implementation environment.

## Recommended positioning

- Present Team 1 as a read-only manager command center prototype.
- Emphasize project progress, follow-ups, and the broader business workflow.
- Treat service, sales, accounting, and profitability expansions as staged and source-dependent.
