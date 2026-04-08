# Feature 1 Actual Table Requirements

Last updated: 2026-04-04

This file only lists tables that successfully returned columns from Q360 during the seed run.

Rules for this file:

- table lists are based on successful `scripts/seed-mock-db.ts` schema fetches
- table meaning is inferred from the actual returned column names
- tables with `Failed to fetch schema` are not included

## 1. Confirmed Tables For Feature 1

These are the confirmed tables we were able to seed:

- `PROJECTS`
- `PROJECTSCHEDULE`
- `PROJECTEVENTS`
- `TIMEBILL`
- `CUSTOMER`
- `SITE`
- `DISPATCH`
- `SERVICECONTRACT`
- `QUOTE`
- `FUNNELOPPORITEM`
- `INVOICE`
- `PROJECTITEM`
- `PROJECTFORECAST`
- `LDVIEW_PROJECTPROFIT`

`OPPORTUNITY` is intentionally not listed because the schema fetch returned no columns.

## 2. Tables By Feature 1 Section

### Projects

- `PROJECTS`
  Project master table for the main project list and project health view.
  The returned columns show identity, ownership, status, scheduling, customer/site linkage, and budgeting:
  `PROJECTNO`, `TITLE`, `STATUSCODE`, `PROJECTSTARTDATE`, `STARTDATE`, `ENDDATE`, `CUSTOMERNO`, `SITENO`, `PROJECTLEADER`, `PERCENTCOMPLETE`, `HOURSBUDGET`, `REVENUEBUDGET`, `SALESREP`.

### Tasks / Follow-ups

- `PROJECTSCHEDULE`
  Task and work-plan table for follow-ups, due dates, assignment, effort tracking, and WBS-style project execution.
  The returned columns show task identity, assignment, scheduling, effort, priority, and progress:
  `PROJECTSCHEDULENO`, `PROJECTNO`, `TITLE`, `ASSIGNEE`, `SCHEDDATE`, `ENDDATE`, `STATUSCODE`, `EFFORT`, `PRIORITY`, `WBS`, `TASKPERCENTCOMPLETE`, `PROJECTPERCENTCOMPLETE`.

### Activity / Timeline

- `PROJECTEVENTS`
  Project activity log for timeline/history, notes, reviews, and user-entered events.
  The returned columns show event identity, project linkage, timestamps, notes, review state, and author:
  `PROJEVENTNO`, `PROJECTNO`, `PROJECTSCHEDULENO`, `DATE`, `TYPE`, `COMMENT`, `USERID`, `REVIEWFLAG`, `REVIEWDATE`.

### Billing / Hours

- `TIMEBILL`
  Time-entry table for labor billing, hours tracking, and linking time to projects, tasks, dispatches, customers, and contracts.
  The returned columns show billing identity, project/task/service linkage, billed time, billing category, rates, and worker:
  `TIMEBILLNO`, `PROJECTNO`, `PROJECTSCHEDULENO`, `CUSTOMERNO`, `DISPATCHNO`, `SERVICECONITEMNO`, `DATE`, `TIMEBILLED`, `CATEGORY`, `DESCRIPTION`, `RATE`, `USERID`, `WAGECOST`, `WAGERATE`, `WAGETYPE`.

### Customer / Account Context

- `CUSTOMER`
  Customer master table for account identity, billing relationship, address/contact context, ownership, status, and commercial/accounting rollups.
  The returned columns show customer identity, company/contact data, geography, status, sales ownership, and budget/accounting flags:
  `CUSTOMERNO`, `COMPANY`, `CONTACTNO`, `ADDRESS1`, `CITY`, `STATE`, `ZIP`, `PHONE`, `STATUS`, `TYPE`, `SALESREP`, `INVOICESITENO`, `HOURSBUDGET`, `REVENUEBUDGET`, `SERVCONTEXPIRYDATE`.

- `SITE`
  Site/location table for customer locations, dispatch destinations, service territories, and technician/site routing context.
  The returned columns show site identity, customer linkage, address, operational territory, service ownership, and timezone/routing data:
  `SITENO`, `SITENAME`, `CUSTOMERNO`, `ADDRESS`, `CITY`, `STATE`, `ZIP`, `PHONE`, `TECHNICIAN`, `TERRITORY`, `STATUS`, `TIMEZONE`, `ROUTEINSTRUCTIONS`.

### Service / Field Operations

- `DISPATCH`
  Service-call table for active field work, issue tracking, assignment, response timing, and linkage back to project, task, site, customer, and service contract.
  The returned columns show dispatch identity, call metadata, project/service linkage, problem/solution state, dates, and technician assignment:
  `DISPATCHNO`, `CALLNO`, `CUSTOMERNO`, `SITENO`, `PROJECTNO`, `PROJECTSCHEDULENO`, `SERVICECONTRACTNO`, `STATUSCODE`, `PROBLEM`, `SOLUTION`, `TECHASSIGNED`, `DATE`, `CLOSEDATE`, `PRIORITY`, `ESTFIXTIME`.

- `SERVICECONTRACT`
  Service-contract table for recurring coverage, contract dates, billing method, renewals, and linking customer/site/service obligations.
  The returned columns show contract identity, customer/site linkage, billing and renewal data, value tracking, and status:
  `CONTRACTNO`, `CUSTOMERNO`, `SITENO`, `STARTDATE`, `ENDDATE`, `STATUSCODE`, `TITLE`, `BILLINGMETHOD`, `RENEWALDATE`, `RENEWALAMOUNT`, `MONTHLYTOTAL`, `SALESPERSON`, `SALESREP`.

### Sales / Commercial

- `QUOTE`
  Quote/proposal table for sales pipeline execution, quoted work, pricing, gross profit, due dates, and conversion into project or contract work.
  The returned columns show quote identity, customer/project/opportunity linkage, schedule, pricing totals, margin metrics, and ownership:
  `PROJECTNO`, `OPPORNO`, `CUSTOMERNO`, `SHIPSITENO`, `STATUSCODE`, `TITLE`, `DUEDATE`, `TOTAL`, `TOTALGM`, `TOTALGP`, `SALESPERSON`, `SALESREP`, `SERVICECONTRACTNO`.

- `FUNNELOPPORITEM`
  Funnel-opportunity activity/work-item table for sales follow-ups, assigned actions, schedule dates, completion tracking, and sales workflow tasks.
  The returned columns show opportunity linkage, assigned work, category/status, schedule/completion, and notes:
  `FUNNELOPPORNO`, `OPPORNO`, `TITLE`, `CATEGORY`, `STATUSCODE`, `ASSIGNEE`, `SCHEDDATE`, `SCHEDULEDATE`, `COMPLETIONDATE`, `COMPLETEFLAG`, `COMMENT`.

### Accounting

- `INVOICE`
  Invoice table for billed revenue, balances, due dates, payment tracking, and linkage back to project, dispatch, customer, and shipping/billing context.
  The returned columns show invoice identity, financial totals, due/payment state, and operational linkage:
  `INVOICENO`, `CUSTOMERNO`, `PROJECTNO`, `DISPATCHNO`, `DUEDATE`, `INVOICEDATE`, `INVAMOUNT`, `BALANCE`, `PAIDAMOUNT`, `PAYMENTMETHOD`, `TRACKINGNO`.

### Profitability / Forecasting

- `PROJECTITEM`
  Project line-item/detail table for project components, materials/items, quantities, and item-level descriptions tied to a project.
  The returned columns show project linkage and item detail:
  `PROJECTNO`, `ITEMNO`, `CONITEMNO`, `BOMNO`, `QTY`, `DESCRIPTION`, `COMMENT`, `LINE_NO`.

- `PROJECTFORECAST`
  Project forecast table for dated forecast snapshots and structured forecast values across many titled/value slots.
  The returned columns show forecast identity, project linkage, forecast date, ordering, and repeated metric buckets:
  `PROJECTFORECASTNO`, `PROJECTNO`, `PROJECTFORECASTDATE`, `SEQUENCE`, `LEFTCOL`, `TITLE01`-`TITLE38`, `VALUE01`-`VALUE38`.

- `LDVIEW_PROJECTPROFIT`
  Profitability view for earned vs projected revenue, cost, gross profit, margin, and project-level financial performance.
  The returned columns show project financial rollups and management dimensions:
  `PROJECTNO`, `COMPANY`, `CUSTOMERNO`, `BRANCH`, `DEPARTMENT`, `STATUSCODE`, `TYPE`, `CATEGORY`, `PM`, `EARNEDREVENUE`, `EARNEDTOTALCOST`, `EARNEDGP`, `PROJECTEDREVENUE`, `PROJECTEDTOTALCOST`, `PROJECTEDGP`, `PROJECTEDMARGIN`.

## 3. Minimum Confirmed Tables To Run Current Feature 1

These are the two confirmed tables needed for the current Team 1 page:

- `PROJECTS`
- `PROJECTSCHEDULE`

## 4. Recommended Confirmed Tables To Test Current Feature 1 Well

These give the current command-center view much better coverage:

- `PROJECTS`
- `PROJECTSCHEDULE`
- `PROJECTEVENTS`
- `TIMEBILL`

## 5. Recommended Confirmed Full Set To Complete Feature 1

If we want the broader manager command center backed by confirmed tables only, use:

- `PROJECTS`
- `PROJECTSCHEDULE`
- `PROJECTEVENTS`
- `TIMEBILL`
- `CUSTOMER`
- `SITE`
- `DISPATCH`
- `SERVICECONTRACT`
- `QUOTE`
- `FUNNELOPPORITEM`
- `INVOICE`
- `PROJECTITEM`
- `PROJECTFORECAST`
- `LDVIEW_PROJECTPROFIT`

## 6. Excluded For Now

These names are intentionally excluded from the required table list:

- `OPPORTUNITY`
  Excluded because the schema fetch returned no columns during the seed run.

Use this file together with:

- `feat1-md/PLAN.md`
- `feat1-md/PORT_PROGRESS.md`
- `FEATURE_TAB_MAPPING.md`
