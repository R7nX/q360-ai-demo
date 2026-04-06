# API_STRUCTURE.md — Q360 Platform Reference

> Comprehensive reference for the Q360 v25.01.001 REST API and full platform navigation/data model.
> Based on: Live Data Dictionary API (1,633 tables), live Toolbar API (658 nav items via fshirley session), and JS bundle analysis.
> **Last verified: 2026-04-04**

---

## Table of Contents

1. [REST API Overview](#1-rest-api-overview)
2. [Authentication](#2-authentication)
3. [API Endpoints](#3-api-endpoints)
4. [Q360 Platform Navigation — All Tabs & Sub-Tabs](#4-q360-platform-navigation--all-tabs--sub-tabs)
5. [Complete Data Model](#5-complete-data-model)
6. [Key Table Schemas](#6-key-table-schemas)
7. [User Roles & Permissions](#7-user-roles--permissions)
8. [Response Structure](#8-response-structure)
9. [Important Constraints](#9-important-constraints)

---

## 1. REST API Overview

| Property | Value |
|----------|-------|
| Base URL | `https://rest.q360.online` |
| Auth (REST API) | HTTP Basic Auth (`Q360API` users only) |
| Auth (Web UI) | `POST /api/authenticate` → JWT cookies (`q360_at`, `q360_rt`) |
| Content-Type (writes) | `multipart/form-data` |
| Live Docs | `https://rest.q360.online/APIDocumentation/` (browser login required) |
| Total DB Tables | 1,633 (tables + views) |

---

## 2. Authentication

### REST API (for programmatic access)

```
Authorization: Basic <base64(username:password)>
```

- Only users with Q360 user type `Q360API` can use Basic Auth
- The user must have both `activeflag` and `loginflag` set to `Y`
- Regular web users (e.g. `fshirley`) cannot authenticate via Basic Auth
- Current sandbox convention: use `Q360API_UTAH` for Basic Auth API calls

### Web UI (for browser sessions)

```
POST /api/authenticate
Content-Type: application/x-www-form-urlencoded

userid=fshirley&password=<password>
```

- Returns JWT cookies: `q360_at` (access token, ~10min) and `q360_rt` (refresh token, ~15hr)
- Use these cookies for browser-session endpoints like `GET /api/Toolbar`
- **Note:** `POST /api/Application?_a=login` does NOT work — use `/api/authenticate`
- Current sandbox convention: use `userid=fshirley` for web-session calls
- In this sandbox, `fshirley` and `Q360API_UTAH` currently share the same password

**Sandbox credentials:** see `.env.local` (never commit)

---

## 3. API Endpoints

### 3.1 Data Dictionary — List All Tables

```
GET /api/DataDict?_a=tableList
```

Returns all 1,633 tables and views. Only **tables** support Create/Update/Delete. Views are read-only.

---

### 3.2 Data Dictionary — Column Definitions

```
GET /api/DataDict?_a=list&tablename=<TableName>
```

> `tablename` is currently case-insensitive in sandbox responses (`Dispatch`, `dispatch`, and `DISPATCH` all worked on 2026-04-04). Prefer canonical capitalization for readability.

**Response shape:**
```json
{
  "code": 200,
  "success": true,
  "payload": {
    "result": [
      {
        "field_name": "DISPATCHNO",
        "field_type": "C",
        "sqltype": "VARCHAR",
        "field_len": "20",
        "mandatoryflag": "Y",
        "p_key": "T",
        "field_desc": "Dispatch No.",
        "table_dbf": "DISPATCH"
      }
    ]
  }
}
```

| Field | Meaning |
|-------|---------|
| `field_name` | Column name (uppercase) |
| `sqltype` | `VARCHAR`, `INT`, `DECIMAL`, `DATETIME`, `MONEY`, `BIT`, etc. |
| `field_type` | Q360 type: `C` (char), `N` (numeric), `D` (date), `L` (logical) |
| `mandatoryflag` | `Y` = required on create |
| `p_key` | `T` = primary key |

---

### 3.3 Data Source — Access List

```
GET /api/UserID?_a=datasourceAccessList&userid=<api_username>
```

Check which data sources a specific API user can query. Call before Record List to confirm permissions.

> Observed behavior on 2026-04-04 for `Q360API_UTAH`: this endpoint returned `401` (unauthorized). Treat as permission-dependent and non-critical for baseline reads.

---

### 3.4 Record — List (Query)

```
POST /api/Record/<TableName>?_a=list
```

**Body** (form-data): `jsonRequest` containing columns, filters, sort, pagination.

```json
{
  "columns": ["DISPATCHNO", "CUSTOMERNO", "STATUSCODE", "PROBLEM"],
  "filters": [
    { "field": "STATUSCODE", "op": "=", "value": "OPEN" }
  ],
  "orderBy": [
    { "field": "CALLOPENDATE", "dir": "DESC" }
  ],
  "offset": 0,
  "limit": 100
}
```

**Filter operators:** `=`, `!=`, `<`, `>`, `<=`, `>=`, `like`, `isnull`, `isnotnull`

**LIKE syntax:** MSSQL wildcards — `%` (any chars), `_` (single char)

**Pagination:** increment `offset` by `limit` until rows < limit or `outvars.hasmore = "N"`.

---

### 3.5 Record — Create

```
PUT /api/Record
```

**Body** (form-data): `_tablename`, `jsonRequest`, optional `_outputdata=Y`, `_preview=Y`.

```json
{
  "griddata": {
    "record": [
      { "CUSTOMERNO": "CUST001", "PROBLEM": "Unit not powering on", "BRANCH": "MAIN" }
    ]
  }
}
```

Q360 runs server-side create logic (`[TableName]_Record_Create`) with defaults and business rules.

---

### 3.6 Record — Update

```
PATCH /api/Record
```

**Body** (form-data): `_tablename` + `jsonRequest` with primary key + changed columns only.

```json
{
  "griddata": {
    "record": [
      { "DISPATCHNO": "D-00123", "STATUSCODE": "CLOSED", "SOLUTION": "Replaced power supply" }
    ]
  }
}
```

---

### 3.7 Record — Delete

```
DELETE /api/Record
```

**Body** (form-data): `_tablename` + `jsonRequest` with primary keys only. Optional `ValidateOnly=Y`.

```json
{
  "griddata": {
    "record": [
      { "DISPATCHNO": "D-00123" }
    ]
  }
}
```

Q360 enforces referential integrity. No partial deletes — all-or-nothing per batch.

---

### 3.8 Toolbar — Navigation Menu

```
GET /api/Toolbar
```

> **Requires browser session** (JWT cookies from `/api/authenticate`). NOT accessible via Basic Auth.

Returns `{ payload: { navigation: [...], favorites: [...] } }` — the full hierarchical menu tree (658 items for fshirley as of 2026-04-04). Each item has: `menuitemno`, `parentmenuitemno`, `caption`, `itemtype` (HEADING/ITEM), `action`, `menuicon`, `componentid`, `hotkey`.

---

## 4. Q360 Platform Navigation — All Tabs & Sub-Tabs

> Verified against live Toolbar API response for user `fshirley` on 2026-04-04.
> The nav is a **top menu bar** with 12 root tabs. Each tab opens a dropdown/sidebar with nested sub-menus.
> Tab captions may vary per company — Q360 supports relabeling via "User Defined Captions" in Maintenance.

### 12 Top-Level Tabs

| # | Tab | Hotkey | Icon | Purpose |
|---|-----|--------|------|---------|
| 1 | **File** | Alt+F | description | Common entry points: Home, Customers, Contacts, Time, Search |
| 2 | **View** | Alt+V | — | Personal workspace: Tasks, To Do, Active Time Bills, Bookmarks |
| 3 | **Maintenance** | Alt+M | — | System administration: Users, Codes, Email, API Config, AI Config |
| 4 | **Sales** | Alt+S | — | CRM & sales pipeline: Opportunities, Quotes, Orders, Leads |
| 5 | **Accounting** | Alt+A | — | Finance: GL, AR, AP, Invoicing, Service Contracts, Budgets |
| 6 | **Projects** | Alt+P | — | Project management: Projects, Tasks, Resource Console |
| 7 | **Service** | Alt+E | — | Field service: Dispatches, Dispatch Q, Calendar, Products |
| 8 | **Inventory** | Alt+I | — | Parts & warehouse: Master, POs, Physical Inventory, Assets |
| 9 | **HR** | Alt+H | — | Human resources: Employees, Scheduling, Org Chart |
| 10 | **Live Data** | — | — | 115+ pre-built analytical reports by category |
| 11 | **Workflow** | — | — | Visual workflow definitions + pre-built workflows |
| 12 | **Dashboards** | — | — | Live Data dashboards for Sales & Service |

---

### Tab 1: File

Common entry points for day-to-day work.

| Item | Action | Who Uses It |
|------|--------|-------------|
| Home | `customhome` | All users (configurable landing page) |
| Customers | `customer` | CSRs, Sales, Managers |
| Contacts | `contact` | CSRs, Sales |
| Document Management | `documentmanagement` | All users |
| Business Documentation | `busdoc` | All users |
| Time Bill | `timebill` | Techs, CSRs |
| Time Log | `timebill#tab_timelog` | Techs |
| Expenses | `expense` | All staff |
| HR Time Request | `hrptorequest` | All staff |
| Record Locking | `dbrecordlock` | Admins |
| Quick Search | `quicksearch` | All users |
| Departmental Time Bill Summary | `sqlview?report=...` (x2) | Managers |

---

### Tab 2: View

Personal workspace — things relevant to the current user.

| Item | Action | Who Uses It |
|------|--------|-------------|
| My Tasks | `mytasklist` | All users (default home page) |
| To Do List | `todolist` | All users |
| My Active Time Bills | `viewactivetimebills` | Techs, CSRs |
| My Background Jobs | `viewMyBackgroundJobs` | Power users |
| Activity | `activity` | CSRs, Sales |
| My Contact Lists | `contactlistadmin` | Sales |
| Global Comments | `globalcomment` | All users |
| Bookmarks | `quicklaunch` | All users |
| Mobile Quick Launch | `mobilequicklaunch` | Mobile users |
| Notification History | `notificationhistory` | All users |

---

### Tab 3: Maintenance (System Administration)

> **Admins/IT only.** Configures the Q360 platform itself — not field service work.

| Sub-Tab | Action | Description |
|---------|--------|-------------|
| User Maintenance | `user_maintenance` | Create/manage user accounts, permissions |
| General Codes | `general_code` | Lookup table values (status codes, types, etc.) |
| Dispatch Zones | `dispatchzone` | Geographic zones for tech routing |
| Problem Codes | `problem_codes` | Standardized problem categories |
| Time Zones | `time_zone` | Timezone config per branch/site |
| View History | `view_history` | Audit: who viewed which records |
| User Defined Captions | `user_captions` | Rename field labels per company |
| Email Alert Admin | `email_alert_template` | Rules for auto-notification emails |
| Email Template Admin | `email_template` | Email body templates |
| Email Account Admin | `emailaccount` | SMTP / sending account config |
| Email Configuration | `webmailadmin` | Global email settings |
| AI Configuration | `aiconfig` | Q360's built-in AI features |
| Anchors | `helpanchor` | Knowledge base URL anchors |
| Articles | `helparticle` | Knowledge base articles |
| Import Map Builder | `importmapbuilder` | Data import field mappings |
| Report Maintenance | `reportmaintenance` | Custom report builder |
| Rebuild Procedure DataDict Entries | `buildproceduredatadictentries` | Rebuild Data Dictionary cache |
| Datasource Administration | `datasource` | Control API-accessible tables/views |
| Background Job Administration | `backgroundjob` | Scheduled/async job management |
| Active User Sessions | `sqlview?report=Q0315` | Who is logged in now |
| AI Chat Message Log | `sqlview?report=152872989` | Log of AI chat interactions |
| Q360 ErrorLog Table | `sqlview?report=Q0261` | Application error log |

**Maintenance > API Configuration** (third-party integrations):

| Integration | Action | Purpose |
|-------------|--------|---------|
| Director | `directorconfig` | Q360 Director executive dashboard (by Solutions 360) |
| Google Maps | `googlemapsconfig` | Map rendering on site/dispatch screens |
| Google Geocode | `googlegeocodeconfig` | Address → lat/lng conversion |
| Jetbuilt | `jetbuiltconfig` | AV/integration quoting tool sync |
| DTools | `dtoolsconfig` | Low-voltage/AV system design software sync |
| Cloud Storage | `cloudstorageconfig` | Document storage (S3 / Azure / Google Cloud) |
| HMRC VAT | `hmrcvatconfig` | UK VAT compliance API |
| Ramp | `rampconfig` | Corporate card / spend management |
| Inspect Point | `inspectpointconfig` | Fire inspection reporting |
| Avalara | `avalaraconfig` | Automated sales tax (US) |
| TaxCCH (SureTax) | `taxcchconfig` | Alternative tax calculation |
| Address Validation | `addressconfig` | Address standardization |
| USPS | `uspsconfig` | USPS address validation |
| Credit Cards | `creditcardconfig` | Payment processing |

**Maintenance > Admin:**

| Item | Action |
|------|--------|
| Data Dictionary | `data_dict` |
| Record Copy Configuration | `recordcopyconfig` |
| Error Message Manager | `errormessage` |
| Data Importer | `importer` |

**Maintenance > Admin Reports:**

| Item | Action |
|------|--------|
| Data Dictionary | `sqlview?report=Q0185` |
| Licensed User List | `sqlview?report=Q0333` |
| User List | `sqlview?report=Q0211` |
| Q360 Activity By UserID | `sqlview?report=Q0277` |
| User Permissions | `sqlview?report=Q0274` |

---

### Tab 4: Sales

CRM, pipeline, and sales operations.

| Item | Action | Who Uses It |
|------|--------|-------------|
| Dashboard | `lddashboard_view?lddashboardno=Q0268` | Sales Managers |
| Customers | `customer` | Sales Reps, Managers |
| Quick Data Entry | `quickdataentry` | Sales Reps |
| Contacts | `contact` | Sales Reps |
| Sites | `site` | Sales Reps |
| Opportunities | `opportunity` | Sales Reps |
| Activity | `activity` | Sales Reps |
| Quotes | `quote` | Sales Reps, Managers |
| Orders | `order` | Sales Reps, Managers |
| Find Product | `findproduct` | Sales Reps |
| Manage Contact Lists | `contactlistadmin` | Sales Reps |
| Sales Leads | `saleslead` | Sales Reps |

**Sales > Work Queues:**

| Queue | Action |
|-------|--------|
| Opportunities to Assign | `opportunities_assign_queue` |
| Sales Leads to Assign | `sales_leads_assign_queue` |
| Sales Queue | `sales_queue` |
| Quotes in Dataentry Queue | `quotes_dataentry_queue` |
| Quotes in Confirm Queue | `quote_confirm_queue` |
| Quotes in Authorized Queue | `quotes_authorized_queue` |
| Quotes in Approval Queue | `quote_approval_queue` |
| Orders in Approval Queue | `order_approval_queue` |
| Received Email Q Sales | `received_email_q_sales` |
| Received Email Q Activity | `received_email_q_activity` |

**Sales > Quick Views:**

| View | Action |
|------|--------|
| Sales Forecast | `sales_forecast` |
| Funnel Forecast | `funnelforecast` |
| View Funnel | `funnel` |
| Sales Opp Review | `sales_opp_review` |
| Sales Bookings | `sqlview?report=Q0318` |
| Sales Lead Source Report | `sqlview?report=Q0372` |
| Quote Review | `sqlview?report=119690859` |
| Sales Score Report | `sqlview?report=1681612` |

**Sales > Sales Admin:**

| Item | Action |
|------|--------|
| Funnel Administration | `funneldef` |
| Sales Score Setup | `sale_score_setup` |
| Extended Quote Authorization Rules | `quote_authorization_rules` |
| Sales Groups | `salesgroupadmin` |
| Sales Rep Global Change | `salesrepchange` |
| Opportunity Quote Stats | `sqlview?report=Q0349` |

**Sales > Reports:**
- Activity List (`sqlview?report=Q0204`)

---

### Tab 5: Accounting

Full financial management — GL, AR, AP, service contracts, commissions.

**Accounting > General Ledger:**

| Item | Action |
|------|--------|
| Enter Journal Transaction | `glentry` |
| View GL Journal | `view_gl_journal` |
| Recurring Journal Entry | `recurringjournalentry` |
| Post Recurring Entries | `postrecurringentries` |
| Journal Distribution | `journaldistribution` |
| Trial Balance | `sqlview?report=Q0158` |

**Accounting > Accounts Receivable:**

| Item | Action |
|------|--------|
| Invoices | `invoice` |
| Bill Recurring Orders | `bill_recurring_orders` |
| Print Invoices | `invoice_queue` |
| Create Service Dispatch Billing Invoices | `create_dispatch_billing_invoices` |
| Cash Receipts | `cash_receipts` |
| Find AR Journal Entry | `arentry` |
| View AR Journal | `view_ar_journal` |
| Write Off Invoices | `invoice_writeoff` |
| Finance Charges | `financecharges` |

AR Quick Views: Aged AR (`qviewagedar`), AR By Customer (`ar_bycustomer`), Total Invoicing

AR Work Queues: Orders To Invoice Q, Orders Approval Q, Credit Card Reservation Q, Credit Card Process Q, Collection Queue

AR Reports: Customer Statements, AR Journal Entries, Batch Receipts Detail, Cash Receipts Detail/Summary, Income Projection, Invoice Register

**Accounting > Accounts Payable:**

| Item | Action |
|------|--------|
| Vouchers | `vendinvoice` |
| Purchase Orders | `purchase` |
| Print Checks | `checkqueue` |
| Direct Payments | `directpaymentq` |
| Bill Recurring POs | `bill_recurring_pos` |
| Find AP Journal Entry | `apentry` |
| Import Expenses | `import_expense` |
| View AP Journal | `view_ap_journal` |

AP Quick Views: Aged AP (`aged_ap`), Check Register (`check_register`), Expense By Vendor

AP Work Queues: Un-Released Voucher Q, Voucher Verify Q, PO Confirm Q, PO Approve Q, PO Receive Q, PO Voucher Q

**Accounting > Other top-level items:**

| Item | Action | Description |
|------|--------|-------------|
| Bank Reconciliation | `manbankrec` | Reconcile bank statements |
| Service Contracts | `servicecontract` | + Fee Admin, Billing, Renewal Qs, Royalty, Global Price Update |
| Budgets > Define Budgets | `budget` | Budget planning |
| Commissions | — | Commission Rate, Plan, Export, Calc |

**Accounting > Quick Views (30+ reports):**

Aged AR/AP, Order Bookings, Income Comparison, Account Detail, Time Billing Summary/Detail, Check Register, 12 Period Income Statement, Revenue By (Branch/Customer/MasterNo/State), Block Time Revenue, Trial Balance, Financial Ratio, and more.

**Accounting > Reports (18+ reports):**

Taxes (1099-Misc, 1099-NEC, UK VAT, Tax Report), Balance Sheet, Income Statement (multiple formats), Aged Receivables/Payables, UnInvoiced Orders, Billing Projection, Service Deferred Revenue, AP/AR Journal, Cash Flow Projection, Income Versus Budget.

**Accounting > Month End:**

| Item | Action |
|------|--------|
| Month End Reconciliation | `month_end_rec` |
| Post Service Revenue | `postservicerevenue` |
| Post Pre-Paid Expense | `post_pre_paid_expense` |
| Run Asset Depreciation | `run_asset_depreciation` |
| Close A Fiscal Period | `fiscal_calendar` |
| Inventory/Sales Clearing Subledger | `sqlview` reports |
| Project WIP Reconciliation | `sqlview?report=Q0062` |

**Accounting > Admin:**

Company Setup, Branch & Dept Maintenance, GL Admin (Accounts, Segments, Sub-Segments, Opening Balances, Fiscal Calendar), Designer (Income Statement/Balance Sheet), Tax Admin (Zip Tax, Tax API Codes), Service Admin (Rates, Coverage, Fees), Misc (Prevailing Rate, Labor Rates, Currency, Auto Add Rules, Asset Depreciation, Collection Queue, Country/State Admin).

---

### Tab 6: Projects

Project management, tasks, resource scheduling.

| Item | Action | Who Uses It |
|------|--------|-------------|
| Project Console | `projectmasterconsole` | Project Managers |
| Task Console | `taskconsole` | Project Managers |
| Resource Console | `resource_console` | PMs, Dispatchers |
| Projects | `project` | Project Managers |
| My Active Projects | `active_projects` | PMs, Techs |
| Project Team Time Entry | `projectteamtimebilling` | PMs, Techs |
| Tasks | `task` | All staff |
| Review Project Expenses | `projectexpenseq` | PMs, Finance |
| Post Time Bill Records | `timebill_post_q` | Billing Staff |
| Post COGS For All Projects | `post_project_cogs` | Finance |
| Post Revenue For All Projects | `post_project_revenue` | Finance |
| Template List | `project_template_list` | PMs |
| Define Checklists | `checklistdef` | PMs |
| Project Labor Planning | `projectlaborplanning` | PMs |

**Projects > Quick Views:** Project Status, Time Billing Summary/Detail, Project Forecast Snapshot Analysis, Time Billing Inquiry, WBS

---

### Tab 7: Service

**The core operational area for field service.** Dispatches (service calls) live here.

| Item | Action | Who Uses It |
|------|--------|-------------|
| Calendar | `servicedashboard` | Dispatchers, Managers |
| Sites | `site` | CSRs, Techs |
| Resource Console | `resource_console` | Dispatchers |
| User Maintenance | `user_maintenance` | Service Managers |
| Customers | `customer` | CSRs |
| Contacts | `contact` | CSRs |
| Products | `product` | CSRs, Techs |
| Deficiencies | `deficiency` | Techs |
| **Help Desk** (= Dispatch) | `dispatch` | **CSRs, Techs, Managers** |
| Service Contracts | `servicecontract` | CSRs, Managers |
| Knowledge Base | `knowledge_base_search` | CSRs, Techs |
| **Dispatch Q** | `dispatch_q` | **Dispatchers, Managers** |
| Post Time Bill Records | `timebill_post_q` | Billing Staff |
| Tech GPS Location | `mapgps` | Dispatchers |
| Recurring Dispatch | `recurringdispatch` | CSRs, Managers |
| Generate Recurring Dispatches | `generaterecurringdispatches` | Managers |
| Define Checklists | `checklistdef` | Managers |

> **"Help Desk" is the dispatch/service call form.** This is the primary screen where CSRs create, view, and manage service calls. The form action is `dispatch`.

**Service > Work Queues:**

| Queue | Action | Description |
|-------|--------|-------------|
| Dispatch Q | `dispatch_q` | Open dispatches by zone/tech |
| Event Q | `eventq` | Dispatch events awaiting action |
| Priority Q | `priority_q` | High-priority calls |
| Down Time Q | `downtimequeue` | Equipment downtime tracking |
| Open Too Long Q | `suspect_queue` | Calls open past SLA |
| RMA Test Q | `rma_test_q` | Return merchandise testing |
| Received Email Q | `received_email_q_service` | Inbound service emails |
| Knowledge Base Q | `q_knowledge_base_approval` | KB articles awaiting approval |
| Service Contract Renewal Q | `q_service_contract_renewals` | Expiring contracts |
| Vendor Service Contract Renewal Q | `vendorservicecontractrenewals` | Vendor contracts |
| Deficiency Q | `deficiencyq` | Deficiency items awaiting action |

**Service > Reports:**

| Report | Action |
|--------|--------|
| Customer Call History | `customer_call_history` |
| Chronic Problem Product | `sqlview?report=Q0169` |
| Chronic Problem Sites | `sqlview?report=Q0170` |
| Products With No Calls | `sqlview?report=Q0181` |
| Service Contract List | `sqlview?report=Q0180` |
| Dispatcher Performance Detail/Summary | `sqlview` |
| Technician Performance Detail/Summary | `sqlview` |
| Technicians with Work Orders | `sqlview?report=Q0174` |

**Service > Quick Views:**

Call Profit (`qview_callprofit`), Call History (`call_history`), Block Amount Used, Revenue By Tech, Block Time Balances, Demo Call SLA, P1 Calls, Priority 1 Service Calls, Recurring Dispatch List.

**Service > Service Admin:** Vehicles (`vehicle`), Subcontractor Admin (`subcadmin`).

---

### Tab 8: Inventory

Parts, warehouse, purchasing.

| Item | Action | Who Uses It |
|------|--------|-------------|
| Master | `master` | Purchasing, Techs |
| Global Updates - Master Prices | `update_master_price` | Managers |
| Asset | `asset` | Finance |
| Find Product | `findproduct` | All staff |
| Master Profiles | `master_profile` | Purchasing |
| Import/Update Masters | `import_update_master` | Admins |
| Import/Update Master Profile | `import_masterprofile` | Admins |
| Import/Update Master Vendors | `import_update_master_vendor` | Admins |
| Tech Returns | `tech_return` | Techs, Warehouse |
| Return to Vendor | `rma_return_to_vendor` | Warehouse |
| Purchase Orders | `purchase` | Purchasing |
| Physical Inventory Count | `physicalinventory` | Warehouse |
| Purchasing Queue | `orderstopurchasefor` | Purchasing |
| View Vendor Inventory | `vendor_inventory` | Purchasing |
| Transfer Inventory | `transfer_inventory` | Warehouse |

**Inventory > Work Queues:** Inventory Re-Order Q, Ship Q, RMA Q, RMA Test Q, Vendor RMA Q, PO Receive Q, PO Voucher Q, Parts Pick Q, Order Location Q, PO Confirm Q.

**Inventory > Reports:** Master Valuation By Date, Physical Inventory.

**Inventory > Admin:** Unit Translation, Staging Locations, Import Vendor Inventory, Manufacturer Maintenance, Master Crosswalk, Master Import Log.

---

### Tab 9: HR

Human resources and employee management.

| Item | Action | Who Uses It |
|------|--------|-------------|
| Employee | `employee` | HR, Managers |
| Candidate | `candidate` | HR |
| Schedule | `hr_schedule` | HR, Managers |
| Create Company Employee Schedule | `employeeglobalschedule` | HR |
| Global HR eAcceptance | `globalhreaccept` | HR |
| Employee Org Chart | `employeeorg` | All staff |
| Post Time Bill Records | `timebill_post_q_hr` | HR |
| Employee Events | `employeeevents` | HR |
| Admin Projects | `admin_projects` | HR Managers |
| HR Time Request | `hrptorequest` | All staff |
| Prevailing Rate Admin | `prevailingwagerate` | HR, Finance |
| Import Time Off Allocations | `import_empdaysoff` | HR |
| Projects > Import Timesheet | `import_timesheet` | HR |

**HR > Quick Views:** Time Billing Summary, Time Billing Detail.

---

### Tab 10: Live Data

115+ pre-built analytical reports organized by category. All use `sqlview?reportno=` actions.

| Category | # Reports | Examples |
|----------|-----------|---------|
| **No Category** | 22 | Account Detail, Active User List, Data Dictionary, Dispatch Profit, ErrorLog |
| **Accounting** | 34 | AP/AR journals, Budget vs Actual, Cash Flow, Fixed Assets, Income Statement, Inventory Value, Revenue By (Customer/Branch/State/Tech), Trial Balance |
| **Commission** | 2 | Commission Report, Sales Commission Data |
| **Customer** | 6 | Customer Average Invoice/Orders, Customer Lists, Site Lists, Duplicate Contacts |
| **Data Integrity** | 1 | Month End Inventory Integrity |
| **HR** | 4 | ADP Pay Data, Drivers License, Employee Lists |
| **Inventory** | 4 | Master Valuation, Fixed Asset Subledger, Physical Inventory Variance |
| **Marketing** | 2 | Lead Source Report, Marketing Performance |
| **Month End** | 8 | Inventory/AR/Asset Integrity, Project Retention/Suspense, Sales Clearing, Trial Balance Check |
| **Projects** | 19 | Project Profit (Actual Hours/Invoices/Labor/Material/PO/Profit/Retention/WIP, Earned/Projected variants), Projected vs Actual Hours |
| **Sales** | 10 | Sales Activity (by Rep/Customer), Sales Bookings, Order Bookings, Opportunity Losses, Sales Goals |
| **Service** | 23 | Dispatch Profit (Actual/Earned/Projected across 18 dimensions), Block Time Balances, Calls Approaching Commit, Technician Workorder Status, Recurring Dispatches |
| **Survey** | 3 | Survey Answers/Lists/Questions Drilldown |

---

### Tab 11: Workflow

Visual workflow definitions and pre-built process flows.

| Item | Action |
|------|--------|
| Workflow Definitions | `workflowdesigner` |
| Accounts Receivable | `workflow?qflowno=360Q956933` |
| Inspection Overview | `workflow?qflowno=138568849` |
| Sales to Operations Workflow /w Links | `workflow?qflowno=119825875` |
| Service Overview | `workflow?qflowno=360Q723346` |
| Service Overview - Fortis | `workflow?qflowno=122793859` |
| Warehouse | `workflow?qflowno=360Q723347` |

---

### Tab 12: Dashboards

Live Data dashboards with widgets.

| Item | Action |
|------|--------|
| Live Data Dashboard Definitions | `lddashboard` |
| **Sales:** Sales Opportunity Funnel | `lddashboard_view?lddashboardno=Q0394` |
| **Service:** Service Call Closed | `lddashboard_view?lddashboardno=Q0243` |
| **Service:** Service Call Open | `lddashboard_view?lddashboardno=Q0226` |

---

## 5. Complete Data Model

> 1,633 total tables/views. Column counts verified against live Data Dictionary API.
> **Note:** Some tables (QUOTE, PURCHASE, EMPLOYEE, FUNNELOPPORITEM, SALESLEAD) are referenced in the UI but not accessible to the `Q360API_UTAH` API user — likely a data source permission restriction, not absence from the DB.

### Core Operational Tables

| Category | Key Tables |
|----------|-----------|
| **Service Calls** | `DISPATCH` (161 cols), `DISPATCHCHECKLISTITEM`, `DISPATCHINSPECTION`, `DISPATCHSCHEDULE`, `DISPATCHWORKTYPE`, `OPENCALLS`, `RECURRINGDISPATCH` |
| **Customers** | `CUSTOMER` (176 cols), `CUSTOMERGROUP`, `CUSTOMERPROFILE`, `CUSTOMERRELATION`, `CUSTOMERSITERELATION` |
| **Sites** | `SITE` (104 cols), `SITEVIEW` |
| **Contacts** | `CONTACT`, `CONTACTHISTORY`, `CONTACTRELATION` |
| **Projects** | `PROJECTS` (84 cols), `PROJECTSCHEDULE`, `PROJECTSCHEDULEMASTER`, `PROJECTTEAM`, `PROJECTCHECKLISTITEM`, `PROJECTFORECAST`, `PROJECTITEM` |
| **Time & Labor** | `TIMEBILL` (63 cols), `TIMEBILLRATE`, `GLOBALSCHEDULE`, `EMPSCHEDULE`, `ALLOCATION` |
| **Service Contracts** | `SERVICECONTRACT` (159 cols), `SERVICECONTRACTITEM`, `SERVICECOVERAGE`, `SERVICERATE`, `CONTRACT`, `CONTRACTITEM` |
| **Machines / Installed Base** | `MACHINE` (86 cols), `MACHINEDETAIL`, `EQUIPMENT`, `ASSET` |

### Financial Tables

| Category | Key Tables |
|----------|-----------|
| **Invoicing / AR** | `INVOICE` (139 cols), `INVOICEITEM`, `ARJOURNAL`, `COLLECTIONAGEGROUP` |
| **AP / Purchasing** | `PURCHASE`*, `PURCHASEITEM`*, `VENDINVOICE`, `VENDINVOICEITEM`, `APJOURNAL`, `CHECKREGISTER` |
| **GL / Accounting** | `GLACCOUNT`, `GLJOURNAL`, `GLBALANCE`, `FISCALENDAR`, `BUDGET`, `CURRENCY`, `FXRATE` |
| **Commissions** | `COMMISSIONPLAN`, `COMMISSIONRATE`, `COMMISSIONPAID` |
| **Expenses** | `EXPENSECLAIM`, `EXPENSECLAIMITEM` |

*Not accessible to Q360API_UTAH — may require expanded data source permissions.

### Sales Tables

| Category | Key Tables |
|----------|-----------|
| **Quotes / Orders** | `QUOTE`*, `QUOTEITEM`*, `QUOTEREVISION`*, `QUOTESECTION`* |
| **Opportunities** | `FUNNELOPPORITEM`*, `FUNNELDEF`*, `SALESLEAD`*, `SALESTEAM`* |
| **Inventory** | `MASTERBYBRANCH`, `MASTERBYCOMPANY`, `PHYSICALINVENTORY`, `VENDORINVENTORY` |

*Not accessible to Q360API_UTAH.

### HR Tables

| Category | Key Tables |
|----------|-----------|
| **Employees** | `EMPLOYEE`*, `EMPLOYEEDOCUMENT`*, `EMPLOYEESHIFT`*, `EMPLOYEEWAGETYPE`*, `EMPACTIVITY`* |
| **HR Events** | `HREVENT`*, `HREVENTATTENDEE`*, `JOBROLES`*, `LABORRATE`* |
| **Scheduling** | `EMPHRSCHEDULE`*, `EMPDAYSOFF`*, `EMPBENEFIT`* |

*Not accessible to Q360API_UTAH.

### System / Config Tables

| Category | Key Tables |
|----------|-----------|
| **Users / Auth** | `USERID` (108 cols), `USERGROUP`, `ACTIVELOGIN`, `ACCESSINFO`, `APICONFIG`, `APILOG` |
| **System Config** | `COMPANY`, `BRANCH`, `DEPARTMENT`, `CODE`, `CONFIGDATA`, `WORKTYPE`, `CALENDAR`, `TAXDIST` |
| **AI** | `AICONFIG`, `AICHATLOG`, `AICHATMESSAGE`, `AICHATSESSION` |
| **Integrations** | `INTEGRATIONLINK`, `EMAILACCOUNT`, `EMAILALERTEVENT`, `EMAILALERTTEMPLATE` |
| **Audit / Logs** | `AUDITLOG`, `APPLOG`, `ERRORLOG`, `BACKGROUNDJOB`, `BACKGROUNDJOBLOG` |

### Analytics / Reporting Views

| Type | Count | Examples |
|------|-------|---------|
| **BI Views** | ~14 | `BiView_Dispatch`, `BiView_DispatchMetrics`, `BiView_DispatchOpenCloseByDay` |
| **LD Views** | ~50 | Live dashboard widget views |
| **Grid Views** | ~200+ | `GRIDVIEW_*` pre-built query views |
| **Extend Views** | ~100 | `EXTENDVIEW_*` extended record views |

---

## 6. Key Table Schemas

> All column counts verified against live API on 2026-04-03.

### DISPATCH — Service Call (161 columns, PK: `DISPATCHNO`)

| Field | Type | Description | FK |
|-------|------|-------------|-----|
| `DISPATCHNO` | CHAR | Service Call No. (PK) | — |
| `CUSTOMERNO` | CHAR | Customer No. | → CUSTOMER |
| `SITENO` | CHAR | Site No. | → SITE |
| `MACHINENO` | CHAR | Equipment No. | → MACHINE |
| `SERVICECONTRACTNO` | CHAR | Service Contract No. | → SERVICECONTRACT |
| `PROJECTNO` | CHAR | Project No. | → PROJECTS |
| `TECHASSIGNED` | VARCHAR | Primary Technician | → USERID |
| `TECHASSIGNED2` | VARCHAR | Secondary Technician | → USERID |
| `STATUSCODE` | CHAR | Status (OPEN, IN PROGRESS, CLOSED, etc.) | |
| `CALLTYPE` | CHAR | Call Type | |
| `PROBLEMCODE` | CHAR | Problem Category [REQ] | |
| `PROBLEM` | VARCHAR | Problem description (free text) | |
| `SOLUTION` | VARCHAR | Solution description (free text) | |
| `SOLUTIONCODE` | CHAR | Solution Code | |
| `CALLOPENDATE` | DATETIME | When call was created | |
| `CALLSTARTDATE` | DATETIME | When work began | |
| `CLOSEDATE` | DATETIME | When call was closed | |
| `FIRSTDISPDATE` | DATETIME | First tech dispatch event | |
| `PRIORITY` | NUMERIC | Priority level | |
| `BRANCH` | VARCHAR | Branch [REQ] | |
| `CALLER` | VARCHAR | Who called in [REQ] | |
| `CALLEREMAIL` | VARCHAR | Caller's email | |
| `BILLAMOUNT` | MONEY | Total billed | |
| `BILLINGMETHOD` | VARCHAR | Billing method | |
| `ESTFIXTIME` | NUMERIC | Estimated fix time (hours) | |
| `HOURSBUDGET` | NUMERIC | Budgeted hours | |
| `REVENUEBUDGET` | MONEY | Revenue budget | |
| `CSR` | VARCHAR | Customer Service Rep | → USERID |
| `SALESPERSON` | VARCHAR | Sales Rep | → USERID |
| `QUEUE` | CHAR | Work queue | |
| `PONUM` | VARCHAR | Purchase Order No. | |

### CUSTOMER (176 columns, PK: `CUSTOMERNO`)

| Field | Type | Description |
|-------|------|-------------|
| `CUSTOMERNO` | CHAR | Customer No. (PK) |
| `COMPANY` | VARCHAR | Company name |
| `PHONE` | CHAR | Phone |
| `ADDRESS1`, `ADDRESS2` | VARCHAR | Address |
| `CITY`, `STATE`, `ZIP` | VARCHAR | Address |
| `SALESREP` | CHAR | Sales Rep → USERID |
| `STATUS` | CHAR | Active/Inactive |
| `TYPE`, `SUBTYPE` | CHAR | Classification |
| `CREDITLIMIT` | MONEY | Credit limit |
| `BALANCE` | MONEY | Current AR balance |
| `YTDSALES` | MONEY | Year-to-date sales |
| `PAYMENTTERMS` | CHAR | Net 30, etc. |
| `TAXDIST` | CHAR | Tax district |
| `MASTERCUSTOMERNO` | CHAR | Parent customer (hierarchy) |
| `LATITUDE`, `LONGITUDE` | NUMERIC | Geocoordinates |
| `TAGS` | VARCHAR | Searchable tags |

### SITE (104 columns, PK: `SITENO`)

| Field | Type | Description |
|-------|------|-------------|
| `SITENO` | CHAR | Site No. (PK) |
| `CUSTOMERNO` | CHAR | Customer → CUSTOMER |
| `SITENAME` | VARCHAR | Site name |
| `ADDRESS`, `CITY`, `STATE`, `ZIP` | VARCHAR | Address |
| `PHONE` | VARCHAR | Phone |
| `CONTACT` | VARCHAR | Primary contact |
| `TECHNICIAN` | VARCHAR | Default tech → USERID |
| `ZONE` | CHAR | Dispatch zone |
| `TAXDIST` | CHAR | Tax district |
| `STATUS` | CHAR | Active/Inactive |
| `SERVICEALERT` | VARCHAR | Warning shown to CSR on dispatch create |
| `LATITUDE`, `LONGITUDE` | NUMERIC | Geocoordinates |

### PROJECTS (84 columns, PK: `PROJECTNO`)

| Field | Type | Description |
|-------|------|-------------|
| `PROJECTNO` | CHAR | Project No. (PK) |
| `TITLE` | VARCHAR | Project title |
| `CUSTOMERNO` | CHAR | Customer → CUSTOMER |
| `SITENO` | CHAR | Site → SITE |
| `PROJECTLEADER` | CHAR | Project lead → USERID |
| `STATUSCODE` | CHAR | Status |
| `TYPE` | VARCHAR | Project type |
| `STARTDATE`, `ENDDATE` | DATETIME | Date range |
| `PERCENTCOMPLETE` | NUMERIC | 0–100 |
| `BILLINGMETHOD` | VARCHAR | Billing method |
| `HOURSBUDGET` | NUMERIC | Budgeted hours |
| `REVENUEBUDGET` | MONEY | Revenue budget |
| `EXPENSEBUDGET` | MONEY | Expense budget |
| `FIXEDAMOUNT` | MONEY | Fixed price amount |
| `PARENTPROJECTNO` | CHAR | Parent project (hierarchy) |
| `BRANCH` | VARCHAR | Branch |

### TIMEBILL (63 columns, PK: `TIMEBILLNO`)

| Field | Type | Description |
|-------|------|-------------|
| `TIMEBILLNO` | CHAR | Time Bill No. (PK) |
| `USERID` | CHAR | Technician/User → USERID |
| `DISPATCHNO` | CHAR | Dispatch → DISPATCH |
| `CUSTOMERNO` | CHAR | Customer → CUSTOMER |
| `PROJECTNO` | CHAR | Project → PROJECTS |
| `DATE` | DATETIME | Start time |
| `ENDTIME` | DATETIME | End time |
| `TIMEBILLED` | NUMERIC | Hours billed |
| `RATE` | MONEY | Billing rate |
| `WAGECOST` | MONEY | Labor cost |
| `WAGETYPE` | VARCHAR | Overtime type, etc. |
| `CATEGORY` | VARCHAR | Labor category [REQ] |
| `INVOICENO` | CHAR | Invoice → INVOICE |
| `PAYROLLAPPROVEFLAG` | CHAR | Payroll approved |

### SERVICECONTRACT (159 columns, PK: `CONTRACTNO`)

| Field | Type | Description |
|-------|------|-------------|
| `CONTRACTNO` | CHAR | Contract No. (PK) |
| `TITLE` | VARCHAR | Contract title [REQ] |
| `CUSTOMERNO` | CHAR | Customer → CUSTOMER |
| `SITENO` | VARCHAR | Site → SITE |
| `STARTDATE`, `ENDDATE` | DATETIME | Contract period |
| `RENEWALDATE` | DATETIME | Next renewal date |
| `STATUSCODE` | CHAR | Status |
| `CONTYPE` | CHAR | Contract type |
| `BILLINGMETHOD` | VARCHAR | Billing method |
| `MONTHLYTOTAL` | MONEY | Monthly billing amount |
| `TOTAL` | MONEY | Total contract value |
| `CALLLIMIT` | INT | Max service calls allowed |
| `CALLLIMITPERIOD` | CHAR | Period for call limit |
| `COVERAGENO` | CHAR | Coverage rules |
| `SALESPERSON` | VARCHAR | Sales Rep → USERID |
| `BRANCH` | VARCHAR | Branch |

### MACHINE (86 columns, PK: `MACHINENO`)

| Field | Type | Description |
|-------|------|-------------|
| `MACHINENO` | CHAR | Product/Machine No. (PK) |
| `CUSTOMERNO` | CHAR | Customer → CUSTOMER |
| `SITENO` | CHAR | Site → SITE |
| `MASTERNO` | CHAR | Inventory part → MASTER |
| `SERIALNO` | VARCHAR | Serial number |
| `MODEL` | VARCHAR | Model number |
| `DESCRIPTION` | VARCHAR | Description |
| `INSTALLDATE` | DATETIME | Install date |
| `STATUS` | VARCHAR | Active/Inactive |
| `WARRANTYDATE` | DATETIME | Warranty expiry |
| `LOCATION` | VARCHAR | Physical location at site |
| `IPADDRESS` | CHAR | Network IP |
| `MACADDRESS` | CHAR | MAC address |
| `ASSETNO` | CHAR | Asset record → ASSET |
| `PROJECTNO` | CHAR | Installed via project |
| `PARENTMACHINENO` | CHAR | Parent system (hierarchy) |

### USERID (108 columns, PK: `USERID`)

| Field | Type | Description |
|-------|------|-------------|
| `USERID` | CHAR | User ID (PK) |
| `FULLNAME` | VARCHAR | Full name |
| `EMAIL` | VARCHAR | Email |
| `PHONE` | VARCHAR | Phone |
| `TITLE` | CHAR | Job title |
| `TYPE` | CHAR | User type (`Q360API`, `TECH`, `CSR`, etc.) |
| `ACTIVEFLAG` | CHAR | Account active |
| `LOGINFLAG` | CHAR | Can log in |
| `BRANCH` | VARCHAR | Home branch |
| `DEPARTMENT` | VARCHAR | Department |
| `GROUPID` | CHAR | Permission group |
| `PERMLEVEL` | INT | Permission level |
| `ZONE1`, `ZONE2`, `ZONE3` | CHAR | Dispatch zones |
| `LASTLOGIN` | DATETIME | Last login timestamp |
| `REQUIRETWOFACTORAUTH` | CHAR | 2FA required |
| `WEBUSERFLAG` | CHAR | Can use web client |
| `REPORTSTO` | CHAR | Manager → USERID |

### INVOICE (139 columns, PK: `INVOICENO`)

| Field | Type | Description |
|-------|------|-------------|
| `INVOICENO` | CHAR | Invoice No. (PK) |
| `CUSTOMERNO` | CHAR | Customer → CUSTOMER |
| `INVOICESITENO` | CHAR | Site → SITE |
| `DISPATCHNO` | VARCHAR | Source dispatch → DISPATCH |
| `PROJECTNO` | CHAR | Source project → PROJECTS |
| `CONTRACTNO` | CHAR | Source contract → CONTRACT |
| `INVOICEDATE` | DATETIME | Invoice date |
| `DUEDATE` | DATETIME | Payment due date |
| `INVAMOUNT` | MONEY | Total |
| `TAXAMOUNT` | MONEY | Tax |
| `BALANCE` | MONEY | Outstanding balance |
| `PAIDAMOUNT` | MONEY | Amount paid |
| `PAIDDATE` | DATETIME | Date paid |
| `INVOICETYPE` | CHAR | Invoice type |
| `SALESPERSON` | CHAR | Sales Rep → USERID |
| `PRTID` | CHAR | Posted to GL flag |
| `PAYMENTTERMS` | VARCHAR | Net 30, etc. |

---

## 7. User Roles & Permissions

| Role | Typical Access | Q360 Tabs Used |
|------|---------------|----------------|
| **CSR** (Customer Service Rep) | Create/update dispatches, view customers/sites | Service, File |
| **Technician** | View assigned dispatches, log time/labor | Service, File (Time Bill), View (My Tasks) |
| **Dispatcher** | Manage dispatch queue, assign techs, view maps | Service (Dispatch Q, Calendar, GPS, Resource Console) |
| **Project Manager** | Project + task management, resource scheduling | Projects, Service, File (Time Bill) |
| **Sales Rep** | Quotes, orders, opportunities, customer records | Sales, File (Customers, Contacts) |
| **Finance / Billing** | Invoicing, AR/AP, GL, service contracts | Accounting (all sub-sections) |
| **HR** | Employee records, scheduling, org chart | HR |
| **Manager** | Broad read access + reports | Live Data, Dashboards, + module-specific |
| **IT Admin** | Platform configuration, user management | Maintenance (all sub-tabs) |

**Permission strings (from JS bundle):**
`account_view`, `activity_view`, `contact_view`, `creditcard_view`, `customer_view`, `document_view`, `helpdesk_view`, `hremployee_view`, `invoice_view`, `machine_view`, `master_view`, `oppfunnel_view`, `order_view`, `project_view`, `projtask_view`, `purchase_view`, `quote_view`, `salesopp_view`, `servcont_view`, `servalert_view`, `voucher_view`, `user_admin`, `helpadmin_view`

---

## 8. Response Structure

### Success:
```json
{
  "code": 200,
  "success": true,
  "message": "",
  "payload": { "result": [...], "total": 42 },
  "outvars": {
    "primarykey": "D-00123",
    "_editguid": "...",
    "reverttoken": "...",
    "hasmore": "N"
  }
}
```

### Error:
```json
{
  "code": 400,
  "success": false,
  "message": "Error description here"
}
```

| Outvar | Description |
|--------|-------------|
| `primarykey` | Generated PK of created record |
| `hasmore` | `"Y"` if more pages exist |
| `reverttoken` | Token to undo last write |
| `_editguid` | Optimistic lock for concurrent edit detection |

---

## 9. Important Constraints

| Constraint | Detail |
|-----------|--------|
| Write targets | Tables only — views are read-only |
| Auth (API) | Basic Auth for `Q360API` users only; web users get 401 |
| Auth (Web) | `POST /api/authenticate` → JWT cookies; NOT `/api/Application?_a=login` |
| Toolbar API | `GET /api/Toolbar` requires browser session (JWT cookies) |
| Data source access | API user may not have access to all tables (e.g. Q360API_UTAH cannot see QUOTE, PURCHASE, EMPLOYEE) — request expanded permissions if needed |
| Bulk operations | Supported for Create, Update, Delete (array in `record`) |
| Partial deletes | NOT supported — all-or-nothing per batch |
| Referential integrity | Q360 enforces FK constraints on delete |
| Table names | Case-sensitive in Data Dictionary — use capitalized form (`Dispatch`, not `dispatch`) |
| Column names | Returned uppercase by API — normalize with `lowerKeys()` for JS/SQLite |
| Credentials | Must be server-side only — never expose in frontend code |
| Custom endpoints | More exist — check `/APIDocumentation` (browser login required) |
