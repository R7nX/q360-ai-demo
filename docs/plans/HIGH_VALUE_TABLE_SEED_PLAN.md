# High-Value Table Seed Plan

**Date:** 2026-04-05  
**Status:** Proposed  
**Scope:** Extend `scripts/seed.ts` to generate meaningful data for high-value Q360 tables using a hybrid deterministic + profile-driven approach (Gemini optional, minimal).

## 1. Goal

Create reliable, meaningful, relationship-aware seed data for key feature tables while keeping token usage near zero by default.

## 2. Canonical Table Scope (ALL CAPS, Deduplicated)

1. `CUSTOMER`
2. `SITE`
3. `DISPATCH`
4. `TIMEBILL`
5. `TASKS`
6. `EMPSCHEDULE`
7. `GLOBALSCHEDULE`
8. `MACHINE`
9. `LDVIEW_TASK`
10. `TASKCONSOLEVIEW`
11. `PROJECTSCHEDULE`
12. `PROJECTTASKHISTORY`

Note: `TASKS` was provided twice and is intentionally deduplicated.

## 3. Strategy Summary

Use a 3-layer generator model:

1. `STORY CORE` for fully curated entities and narratives.
2. `TABLE PROFILES` for meaningful synthetic data on unsupported/high-value tables.
3. `GENERIC FALLBACK` for any table without a profile (existing schema-scrape behavior).

Simple version (12-year-old friendly):

Think of this seeding system like a 3-level robot builder.

1. `STORY CORE` = custom story mode  
   We hand-pick the data ourselves (companies, sites, dispatches, tasks, time).  
   This gives the best and most believable demo data.

2. `TABLE PROFILES` = smart recipe mode  
   For harder tables, we give the robot a recipe.  
   Example recipe: "pick a real customer from `CUSTOMER`, then pick a matching site from `SITE`, then create a machine that fits that business type."  
   Data is generated, but still makes sense.

3. `GENERIC FALLBACK` = emergency mode  
   If no recipe exists yet, the robot still fills the table using column names and data types.  
   This ensures the table is not empty, but the data can feel random and less useful.

Why this approach works:

1. High quality where it matters most.
2. Still works for every table, even unfinished ones.
3. Cheap to run because Gemini is optional, not required.

## 4. Data Quality Principles

1. **Relationship coherence:** FK-like fields always pull from seeded pools (for example `CUSTOMERNO` from `CUSTOMER`, `SITENO` from `SITE`, `DISPATCHNO` from `DISPATCH`).
2. **Lifecycle coherence:** status/date fields make temporal sense (`OPEN` rows are not given close dates unless intentionally modeled).
3. **Role coherence:** technician/user assignments match specialization and work type.
4. **Domain coherence:** site and customer vertical influence generated problems, tasks, schedules, and machine types.
5. **Determinism:** support seeded randomness so teammates can reproduce outputs.

## 5. Implementation Architecture

## 5.1 Script Modes

1. `npm run seed`  
   Seeds curated story set for `CUSTOMER`, `SITE`, `DISPATCH`, `TIMEBILL`, `TASKS` plus profile tables when enabled.

2. `npm run seed -- <TABLE> [COUNT]`  
   If `<TABLE>` has a profile, use profile generator.  
   Else use current generic schema-based fallback.

3. `npm run tables`  
   Keep current table discovery behavior.

## 5.2 Table Profile Contract

Add a profile registry in `scripts/seed.ts`:

```ts
type TableProfile = {
  tableName: string; // ALL CAPS canonical
  defaultCount: number;
  dependencies: string[]; // other tables that must exist first
  generateRows: (ctx: SeedContext, count: number) => Record<string, unknown>[];
  validateRow?: (row: Record<string, unknown>, ctx: SeedContext) => string[];
};
```

## 5.3 Shared Seed Context

`SeedContext` should expose:

1. Seed pools for `CUSTOMER`, `SITE`, `DISPATCH`, `TIMEBILL`, `TASKS`.
2. Lookup maps by keys (`CUSTOMERNO`, `SITENO`, `DISPATCHNO`, `USERID`).
3. Utility helpers for date windows, status transitions, and role assignments.

## 6. Per-Table Generation Plan

## 6.1 Core Story Tables

1. `CUSTOMER`  
   Keep curated narrative dataset as source of truth.

2. `SITE`  
   Keep curated sites linked to `CUSTOMER`.

3. `DISPATCH`  
   Keep narrative clusters (overdue, active, new, hold, closed) as source of truth.

4. `TIMEBILL`  
   Link entries to valid `DISPATCHNO`, `CUSTOMERNO`, and realistic `USERID` labor categories.

5. `TASKS`  
   Link tasks to realistic role ownership and due/completion lifecycle.

## 6.2 New High-Value Profile Tables

1. `MACHINE`  
   Generate equipment records linked to `CUSTOMERNO` and `SITENO`; model type by customer vertical (for example HVAC-heavy for healthcare/hotels, pumps for water authority, panels for manufacturing).

2. `EMPSCHEDULE`  
   Generate per-user weekly blocks with shift windows, route/travel blocks, and assignment references to `SITE` or `DISPATCH`.

3. `GLOBALSCHEDULE`  
   Generate organization-level schedule blocks (team coverage windows, after-hours rotations, on-call slots).

4. `LDVIEW_TASK`  
   Generate denormalized task-style view rows derived from `TASKS` + `DISPATCH` summary fields.

5. `TASKCONSOLEVIEW`  
   Generate operational task console rows with queue/status/priority cues tied back to `TASKS` and optionally `PROJECTSCHEDULE`.

6. `PROJECTSCHEDULE`  
   Generate project timeline rows using phases, planned vs actual dates, owner, and percent-complete coherence.

7. `PROJECTTASKHISTORY`  
   Generate event-style history rows showing state transitions, comments, and actor metadata over time.

## 7. Relationship Map

1. `SITE.CUSTOMERNO` -> `CUSTOMER.CUSTOMERNO`
2. `DISPATCH.CUSTOMERNO` -> `CUSTOMER.CUSTOMERNO`
3. `DISPATCH.SITENO` -> `SITE.SITENO`
4. `TIMEBILL.DISPATCHNO` -> `DISPATCH.DISPATCHNO`
5. `TIMEBILL.CUSTOMERNO` -> `CUSTOMER.CUSTOMERNO`
6. `TASKS` rows reference dispatch/work context where possible.
7. `MACHINE.CUSTOMERNO` and `MACHINE.SITENO` align with existing pools.
8. `EMPSCHEDULE` and `GLOBALSCHEDULE` reference realistic users/sites/shifts.
9. `LDVIEW_TASK` and `TASKCONSOLEVIEW` derive from `TASKS` plus operational context.
10. `PROJECTTASKHISTORY` derives from seeded project-task lifecycle states.

## 8. Gemini Usage Policy (Optional)

Default: **OFF**.

Use Gemini only for optional enrichment fields:

1. Long-form descriptions.
2. Change-log comments.
3. Humanized narrative summaries.

Guardrails:

1. Feature flag: `SEED_USE_GEMINI=true`.
2. Hard cap per run: max calls and token budget.
3. Cache prompt/response by deterministic key to avoid repeated spend.
4. Fallback to deterministic templates when budget is exceeded or API unavailable.

## 9. Phased Delivery Plan

## Phase 1: Profile Framework

1. Add profile registry and `SeedContext` scaffolding.
2. Keep generic fallback intact.
3. Add canonical table-name normalization to ALL CAPS for profile lookup.

## Phase 2: Operational Table Profiles

1. Implement `MACHINE`.
2. Implement `EMPSCHEDULE`.
3. Implement `GLOBALSCHEDULE`.
4. Add integrity checks for user/site/dispatch linkage.

## Phase 3: Task/Project View Profiles

1. Implement `LDVIEW_TASK`.
2. Implement `TASKCONSOLEVIEW`.
3. Implement `PROJECTSCHEDULE`.
4. Implement `PROJECTTASKHISTORY`.

## Phase 4: Validation + QA

1. Add per-table validators.
2. Add summary report with counts and failed rules.
3. Add smoke test command to seed and validate all high-value tables.

## Phase 5: Optional Gemini Enrichment

1. Add toggle + budget controls.
2. Restrict enrichment to non-key descriptive fields.
3. Keep deterministic fallback as default behavior.

## 10. Validation Checklist

1. No orphan references in key relationship fields.
2. Date/status combinations pass lifecycle rules.
3. Required columns are non-null where expected.
4. Profile output respects schema datatypes.
5. Re-running with same seed produces stable data shape.

## 11. File-Level Change Plan

1. Update `scripts/seed.ts`  
   Add profile registry, canonical name normalization, profile execution flow, validation output.

2. Update `scripts/seed-data.ts`  
   Expose reusable seed pools and optional helpers for profile generators.

3. Add optional helper module (if needed)  
   `scripts/seed-profiles.ts` for readability as profile count grows.

4. Update docs  
   Keep `docs/SEED_SCRIPT_REFINEMENT.md` and this plan aligned after each phase.

## 12. Success Criteria

1. Teammates can seed all scoped high-value tables with coherent data quickly.
2. `CUSTOMER`, `SITE`, `DISPATCH`, `TIMEBILL`, `TASKS` remain narrative-quality.
3. Unsupported tables gain meaningful, linked records instead of random-only values.
4. Gemini is optional and not required for normal seeded demo runs.

## 13. Immediate Next Steps

1. Implement profile framework in `scripts/seed.ts`.
2. Deliver first profile set: `MACHINE`, `EMPSCHEDULE`, `GLOBALSCHEDULE`.
3. Add validation summary output and run one full smoke seed.

## 14. Session Restart Notes

1. Current working branch for this effort: `chore/seed-data-refinement`.
2. Branch coordination rule: merge/rebase with `feature3` before targeting `main`.
3. Reason: required fixes exist in `feature3`, and its PR to `main` was still pending approval at handoff time.
4. Practical restart flow:
   - sync local `feature3`
   - merge/rebase `feature3` into `chore/seed-data-refinement`
   - resolve conflicts
   - rerun smoke checks (`npm run seed:profiles` and one profile-backed dynamic seed command)
5. Do not assume `main` contains the latest `feature3` fixes until that PR is merged.
