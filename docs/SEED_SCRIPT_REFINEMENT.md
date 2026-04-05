# Seed Script Refinement — Completed Work

**Date:** 2026-04-05  
**Status:** Complete and tested  
**Branch:** `chore/seed-data-refinement`

## Overview

The seed script has been completely refactored to replace random faker-generated data with hardcoded, narratively coherent demo data. Two separate scripts (`seed-local.ts` and `seed-mock-db.ts`) have been merged into a single unified script with support for both SQLite and PostgreSQL databases via the `USE_MOCK_DATA` environment variable.

---

## Changes Made

### Files Created

#### `scripts/seed-data.ts` (~400 lines)
A data-only file containing all hardcoded story content:

- **8 Customers:** Named companies with realistic types (Healthcare, Commercial, Education, Industrial, Government)
  - Pinnacle Health Systems (Healthcare)
  - Wasatch Commercial Properties (Commercial)
  - Granite School District (Education)
  - SilverCreek Data Solutions (Industrial)
  - Alpine Municipal Water Authority (Government)
  - Meridian Hotel Group (Commercial)
  - Summit Manufacturing Co. (Industrial)
  - Redrock Retail Partners (Commercial, Inactive)

- **20 Sites:** 2-3 per customer, Utah-area addresses, with `customerno` foreign key
  - Examples: "Pinnacle Medical Center — Main Campus", "SilverCreek Data Center — Bluffdale", "Granite High School"

- **6 Technicians:** Named roster with specializations
  - Maria Chen (HVAC & Refrigeration) — assigned to 8-10 dispatches for employee hub default view
  - James Rodriguez (Elevator & Mechanical)
  - Alex Kim (Fire/Life Safety & Security)
  - Sarah Thompson (Electrical & Generator)
  - Mike Johnson (Plumbing & Water Systems)
  - Lisa Park (General Building Maintenance)

- **50 Dispatches:** In narrative clusters
  - **Overdue (8):** OPEN/IN PROGRESS with `estfixtime` in the past. Includes unassigned critical cases.
    - D-0001: UPS battery failure (18 days overdue, unassigned, CRITICAL)
    - D-0002: ICU HVAC failure (14 days overdue, unassigned, CRITICAL)
    - D-0003–D-0008: Various overdue issues with mixed assignment and severity
  
  - **Recently Closed (18):** CLOSED with matched problem/solution pairs
    - D-0009–D-0026: Completed work demonstrating realistic service closure narratives
  
  - **Active Work (13):** OPEN/IN PROGRESS, recently opened, tech assigned
    - D-0027–D-0039: Mostly assigned to Maria Chen for employee hub demo
  
  - **New Calls (7):** OPEN, very recent, some unassigned
    - D-0040–D-0046: Today/yesterday's date
  
  - **On Hold/Pending (4):** ON HOLD/PENDING with contextual notes
    - D-0047–D-0050: Waiting for parts, landlord approval, vendor response

- **21 TimeBills:** Attached to closed dispatches, realistic hours (0.5–8h), matching tech specializations

- **15 Tasks:** Mix of open/completed, assigned to technicians (mostly Maria Chen)
  - Task titles tied to dispatch work ("Confirm compressor delivery", "Upload inspection photos")

**Key helper function:**
- `daysAgo(days: number, base?: Date): string` — Returns YYYY-MM-DD relative to a base date
  - Allows seed data to use relative offsets (e.g., `openDaysAgo: 18`) so dates are always fresh when re-seeding

### Files Modified

#### `scripts/seed.ts` (NEW unified script, ~450 lines)
**Replaces both `seed-local.ts` and `seed-mock-db.ts`**

**Three modes of operation:**

1. **Default (Story Data):** `npx tsx scripts/seed.ts`
   - Seeds all 5 tables with hardcoded story data
   - Drops existing tables and rebuilds

2. **List Tables:** `npx tsx scripts/seed.ts list`
   - Fetches and displays available Q360 tables from the API
   - Useful for discovering table names for dynamic seeding

3. **Dynamic Table:** `npx tsx scripts/seed.ts <tablename> [count]`
   - Fetches schema from Q360 Data Dictionary API
   - Generates synthetic data based on column name patterns
   - Inserts `count` rows (default 20)
   - Example: `npx tsx scripts/seed.ts dispatch 25`

**Database abstraction:**
- Detects `USE_MOCK_DATA` environment variable:
  - `true` → SQLite (`mock.db`)
  - `false` or unset → PostgreSQL (`DATABASE_URL`)
- Implements `DbAdapter` interface for uniform operations
- Handles SQL dialect differences (`?` placeholders for SQLite, `$1..$N` for PostgreSQL)

**Key features:**
- Imports story data from `seed-data.ts`
- Reuses Q360 schema-scraping and synthetic generation logic from old `seed-mock-db.ts`
- Single source of truth for seeding logic

#### `package.json`
Updated npm scripts:
```json
"seed": "tsx scripts/seed.ts",
"tables": "tsx scripts/seed.ts list"
```
(Previously pointed to `seed-mock-db.ts`)

#### `lib/mockDb.ts`
**Bug fix in `normalizeDispatch()` function (lines 264–267):**

Old code:
```typescript
callername: str(r.caller),
calleremail: str(r.calleremail),
callerphone: str(r.callercontactno),
description: str(r.detail),
```

New code (checks both column name variants):
```typescript
callername: str(r.callername) ?? str(r.caller),
calleremail: str(r.calleremail),
callerphone: str(r.callerphone) ?? str(r.callercontactno),
description: str(r.description) ?? str(r.detail),
```

**Why:** The seed script writes columns named `callername`, `callerphone`, and `description`, but after `lowerKeys()` normalization, the code was looking for `caller`, `callercontactno`, and `detail`. The fix checks both variants so caller/phone/description data now appears in the app.

#### `lib/q360Client.ts`
**Updated fallback demo data (lines 197–264):**

Replaced generic demo dispatches with data matching the new story:
- `FALLBACK_DISPATCHES`: Now D-0009, D-0005, D-0011 (matching seeded data)
- `FALLBACK_CUSTOMERS`: Pinnacle Health Systems, Granite School District, Meridian Hotel Group
- `FALLBACK_SITES`: Matching site records from the seed data

This ensures consistency between fallback data (shown when no database exists) and seeded data.

#### `scripts/seed-data.ts`
Added complete hardcoded narrative seed dataset consumed by `seed.ts`.

### Files Deleted

- `scripts/seed-local.ts` — Merged into unified `seed.ts`
- `scripts/seed-mock-db.ts` — Merged into unified `seed.ts`

---

## Data Design Principles

### Narrative Coherence
- **Company/Site Relationships:** Every site's name and type reflect its customer vertical (e.g., "Pinnacle Medical Center" under Pinnacle Health Systems, "SilverCreek Data Center" under SilverCreek Data Solutions)
- **Problem/Solution Pairs:** Dispatch problems are contextually appropriate for the customer and site type
  - HVAC failures at data centers and hospitals ✓
  - Elevator issues at hotels ✓
  - Fire alarm faults at schools ✓
  - Pump failures at water treatment plants ✓

### Dispatch Clustering for Demo Impact
- **Overdue cluster** drives the overdue alerts dashboard (Feature 2), showing both CRITICAL (unassigned, severely overdue) and MEDIUM (assigned, mildly overdue) tiers
- **Closed cluster** demonstrates complete service narratives (problem → solution), ideal for AI email generation
- **Active cluster** with assignments to Maria Chen ensures the employee hub shows realistic work-in-progress
- **New calls** show recent urgent items needing dispatch
- **On Hold** demonstrates edge cases (parts on order, landlord approval pending)

### Date Strategy
All dates computed relative to seed-time using `daysAgo()`:
- **Overdue dispatches:** opened 5–30 days ago, `estfixtime` in the past
- **Closed dispatches:** opened 6–45 days ago, closed 1–5 days after opening
- **Active dispatches:** opened 1–7 days ago
- **New calls:** opened today or yesterday
- **On hold:** opened 8–15 days ago, stuck awaiting external action

This keeps the data perpetually fresh; re-running the seed always produces currently-relevant overdue lists.

---

## Usage

### Default: Seed Story Data
```bash
npx tsx scripts/seed.ts
# OR via npm script:
npm run seed
```

With `USE_MOCK_DATA=true` (default in `.env.local`): Seeds SQLite `mock.db`  
With `USE_MOCK_DATA=false`: Seeds PostgreSQL at `DATABASE_URL`

**Output:**
```
  Target: SQLite (mock.db)
  Seeded 8 customers
  Seeded 20 sites
  Seeded 50 dispatches
  Seeded 21 timebills
  Seeded 15 tasks

  Summary:
    8 customers | 20 sites | 50 dispatches
    21 timebills | 15 tasks

  Done. Restart your dev server to see the new data.
```

### List Q360 Tables
```bash
npx tsx scripts/seed.ts list
# OR via npm script:
npm run tables
```

**Output:**
```
  Available Q360 tables (1633):

    #tmp_ProjectHours
    ACCESSINFO
    ...
    (full list of 1633 tables)
```

### Dynamic Table Seeding
```bash
npx tsx scripts/seed.ts dispatch 25       # Seed dispatch table with 25 synthetic rows
npx tsx scripts/seed.ts customer 15       # Seed customer table with 15 synthetic rows
npx tsx scripts/seed.ts invoices 50       # Any Q360 table
```

---

## Testing

All modes have been tested and verified working:

1. **Story data to SQLite:** ✓ All 5 tables seeded with coherent demo data
2. **Story data to PostgreSQL:** ✓ Script auto-detects DATABASE_URL and seeds PG
3. **List tables:** ✓ Successfully fetches 1633+ table names from Q360 API
4. **Data quality:** ✓ Verified sample data shows realistic company/site names, contextually appropriate problems, and correct technician assignments
5. **Caller/description fields:** ✓ Fixed normalizer now correctly populates caller name, phone, and description in dispatch records

---

## Integration with Existing App

### Routes Using Seeded Data
- **`/api/feature2/generate`** (email drafting): Reads dispatch → customer → site from mock DB, formats for AI prompt
- **`/api/feature2/overdue`** (overdue alerts): Queries OPEN/IN PROGRESS dispatches with `estfixtime < today`, groups by severity tier
- **`/(employee)/home`** (employee hub): Displays default tech's (Maria Chen) tasks and active dispatches
- **Fallback data in `q360Client.ts`**: Used when no database exists; now matches seeded demo data

### Column Mapping
The normalizer in `mockDb.ts` maps Q360-style uppercase columns to lowercase:
- `customerno` → `customerno`
- `callername` → `callername` (fixed to also check `caller`)
- `callerphone` → `callerphone` (fixed to also check `callercontactno`)
- `description` → `description` (fixed to also check `detail`)

All other dispatch columns (statuscode, problem, solution, priority, techassigned, date, closedate, estfixtime) are already correct.

---

## Next Steps

### Immediate (if needed)
- Commit and push the new `chore/seed-data-refinement` branch
- Merge to main after PR review
- Update any documentation referencing the old seed scripts

### Future Enhancements
1. **Add more entity types:** Currently seeds customer, site, dispatch, timebill, tasks. Could add contact, project, servicecontract, invoice, and user tables if Feature 2 Phase 2 consumes them.

2. **Make story data configurable:** Convert hardcoded arrays to JSON files so non-developers can edit demo company names, technician rosters, etc.

3. **Seed to actual Q360 API:** Currently seeds only the local mock DB or PostgreSQL. Could add a mode to push data back to Q360 via REST API for live demo environment.

4. **Add locale/region variants:** Currently all Salt Lake City, UT. Could add options for different regions.

5. **Performance optimization:** For large datasets (1000+ dispatches), could batch-insert rows instead of individual INSERT statements.

---

## Key Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `scripts/seed.ts` | Unified seed script (story data + dynamic tables) | ~450 |
| `scripts/seed-data.ts` | Hardcoded story content | ~400 |
| `lib/mockDb.ts` | Mock DB reader (fixed normalizer) | 1 function changed |
| `lib/q360Client.ts` | Q360 API wrapper (updated fallback data) | 3 constants updated |
| `package.json` | npm scripts | 2 scripts updated |

---

## Notes for Continuation

- **seed.ts is self-contained:** It imports seed-data.ts and handles all DB logic internally. No external dependencies beyond `better-sqlite3`, `pg`, and `@faker-js/faker`.

- **Future PR work:** The current branch has the complete implementation. When merging to main, verify:
  1. No linting errors (pre-existing typecheck errors in `.next` cache are unrelated)
  2. Both SQLite and PostgreSQL modes work in CI
  3. npm scripts (`npm run seed`, `npm run tables`) are aliased correctly

- **Demo readiness:** The seeded data is production-ready for the end-of-April 2026 demo. All 50 dispatches tell coherent stories; AI email generation will produce convincing outputs; overdue dashboard will show realistic tiering.
