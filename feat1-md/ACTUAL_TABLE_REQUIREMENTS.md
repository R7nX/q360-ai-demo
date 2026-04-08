# Feature 1 Actual Table Requirements

Last updated: 2026-04-08

This file only lists tables that successfully returned columns from Q360 during the seed run.

Rules for this file:

- table lists are based on successful `scripts/seed.ts <TABLE> <COUNT>` schema fetches
- table meaning is inferred from the actual returned column names
- tables with `Failed to fetch schema` are not included

## 1. Confirmed Tables For Feature 1

These are the confirmed project-focused tables we were able to seed for the current PostgreSQL-backed Feature 1 pass:

- `PROJECTS`
- `LDVIEW_PROJECT`
- `LDVIEW_PROJECTSNAPSHOT`
- `LDVIEW_PROJECTDETAIL`

`PROJECT` is intentionally not listed because the schema fetch returned no columns.

## 2. Tables By Feature 1 Section

### Projects

- `PROJECTS`
  Project master table for the main project list and project health view.
  The returned columns show identity, ownership, status, scheduling, customer/site linkage, and budgeting:
  `PROJECTNO`, `TITLE`, `STATUSCODE`, `PROJECTSTARTDATE`, `STARTDATE`, `ENDDATE`, `CUSTOMERNO`, `SITENO`, `PROJECTLEADER`, `PERCENTCOMPLETE`, `HOURSBUDGET`, `REVENUEBUDGET`, `SALESREP`.

### Project Directory / Enrichment

- `LDVIEW_PROJECT`
  Project directory-style view for customer names, site names, ownership labels, and project-level rollups that complement `PROJECTS`.
  The returned columns show customer/site naming, ownership, commercial rollups, and scheduling context:
  `PROJECTNO`, `TITLE`, `COMPANY`, `CUSTOMERNO`, `SITENAME`, `PROJECTLEADER`, `PROJECTLEADERNAME`, `SALESREP`, `SALESREPNAME`, `STATUSCODE`, `STARTDATE`, `ENDDATE`, `REVENUEBUDGET`, `PERCENTCOMPLETE`.

### Snapshot / Financial Rollup

- `LDVIEW_PROJECTSNAPSHOT`
  Snapshot rollup view for as-of project revenue, cost, hours, and margin tracking.
  The returned columns show project linkage, snapshot dates, owner, revenue, cost buckets, and customer naming:
  `PROJECTNO`, `TITLE`, `CUSTOMERNAME`, `PROJECTLEADER`, `ASOFDATE`, `SNAPSHOTHOURS`, `SNAPSHOTREVENUE`, `SNAPSHOTLABCOST`, `SNAPSHOTMATCOST`, `SNAPSHOTMISCCOST`, `SNAPSHOTSUBCOST`, `STATUSCODE`.

### Detail / Scope Lines

- `LDVIEW_PROJECTDETAIL`
  Project scope/detail view for itemized cost and value lines tied back to a project and WBS bucket.
  The returned columns show project linkage, description, detail categorization, quantity, cost/value rollups, and WBS context:
  `PROJECTNO`, `DESCRIPTION`, `DETAILTYPE`, `ITEMTYPE`, `STATUSCODE`, `QTY`, `COST`, `EXTENDEDCOST`, `EXTENDEDPRICE`, `WBS`, `CONITEMNO`, `STAGINGLOCATION`.

## 3. Minimum Confirmed Tables To Run Current Feature 1

These are the confirmed tables needed for the current PostgreSQL-backed Team 1 page:

- `PROJECTS`
- `LDVIEW_PROJECT`
- `LDVIEW_PROJECTSNAPSHOT`
- `LDVIEW_PROJECTDETAIL`

## 4. Recommended Confirmed Tables To Test Current Feature 1 Well

These give the current command-center view much better coverage:

- `PROJECTS`
- `LDVIEW_PROJECT`
- `LDVIEW_PROJECTSNAPSHOT`
- `LDVIEW_PROJECTDETAIL`
- optional: `PROJECTSCHEDULE`
- optional: `PROJECTEVENTS`
- optional: `TIMEBILL`

## 5. Recommended Confirmed Full Set To Complete Feature 1

If we want the broader manager command center backed by confirmed tables only, start with:

- `PROJECTS`
- `LDVIEW_PROJECT`
- `LDVIEW_PROJECTSNAPSHOT`
- `LDVIEW_PROJECTDETAIL`
- `PROJECTSCHEDULE`
- `PROJECTEVENTS`
- `TIMEBILL`

## 6. Excluded For Now

These names are intentionally excluded from the required table list:

- `PROJECT`
  Excluded because the schema fetch returned no columns during the seed run.

Use this file together with:

- `feat1-md/PLAN.md`
- `feat1-md/PORT_PROGRESS.md`
- `FEATURE_TAB_MAPPING.md`
