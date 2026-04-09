# Seed Validation & Gemini Enrichment — Design Spec

> **Date:** 2026-04-05
> **Status:** Approved
> **Branch:** `chore/seed-data-refinement`
> **Scope:** Phase 4 (validation + QA) and Phase 5 (Gemini enrichment) of HIGH_VALUE_TABLE_SEED_PLAN.md

---

## Goal

1. Add validation checks that catch data integrity issues after seeding, available both inline (post-seed) and standalone (`npm run seed:validate`).
2. Add optional Gemini-powered text enrichment for profile-generated rows, gated behind `SEED_USE_GEMINI=true`.

---

## Phase 4: Validation (Medium Rigor)

### Behavior

After `npm run seed` completes, validation runs automatically and prints a summary. Also runnable standalone via `npm run seed:validate`.

### Validation Rules

#### FK Integrity
- Every `SITE.CUSTOMERNO` references a row in `CUSTOMER`.
- Every `DISPATCH.CUSTOMERNO` references a row in `CUSTOMER`.
- Every `DISPATCH.SITENO` references a row in `SITE`.
- Every `TIMEBILL.DISPATCHNO` references a row in `DISPATCH`.
- Every `TIMEBILL.CUSTOMERNO` references a row in `CUSTOMER`.
- Every `TASKS.USERID` references a known technician/user.

#### Lifecycle Rules
- CLOSED dispatches must have a non-null `CLOSEDATE`.
- OPEN/IN PROGRESS dispatches must not have a `CLOSEDATE`.
- Overdue dispatches (OPEN/IN PROGRESS) must have `ESTFIXTIME` in the past.
- `TIMEBILL.TIMEBILLED` must be > 0.

#### Required Fields
- Primary keys (`CUSTOMERNO`, `SITENO`, `DISPATCHNO`, `TIMEBILLNO`, `TASKID`) are non-null and unique within their table.
- `STATUSCODE` values are from known enums per table.

### Output Format

```
Validation Report
─────────────────
CUSTOMER     8 rows   ✓ all checks passed
SITE        20 rows   ✓ all checks passed
DISPATCH    50 rows   ✗ 1 error
  → D-0012: CLOSED but CLOSEDATE is null
TIMEBILL    21 rows   ✓ all checks passed
TASKS       15 rows   ✓ all checks passed

Total: 114 rows across 5 tables, 1 error
```

### File Changes

| File | Change |
|------|--------|
| `scripts/seed-validate.ts` | **New.** Validation logic + CLI entry point. Reads current DB state, runs all checks, prints report. |
| `scripts/seed.ts` | Call `validate()` after seeding completes. |
| `package.json` | Add `"seed:validate": "tsx scripts/seed-validate.ts"` |

---

## Phase 5: Gemini Enrichment (Broader)

### Behavior

When `SEED_USE_GEMINI=true` is set in the environment, profile-generated rows are passed through Gemini to enrich descriptive text fields. Story core data (the hand-written seed-data.ts content) is never modified by Gemini.

### Enriched Tables and Fields

| Table | Field(s) | What Gemini does |
|-------|----------|-----------------|
| DISPATCH (profile-generated only) | `PROBLEM`, `SOLUTION` | Rewrites templated problem/solution into realistic service descriptions |
| PROJECTTASKHISTORY | `NOTE` | Generates contextual change-log comments |
| MACHINE | `DESCRIPTION` | Expands "Air Handler at Site X" into detailed equipment descriptions |
| EMPSCHEDULE | `TITLE` | Replaces generic "On-site service block" with specific task descriptions |
| PROJECTSCHEDULE | `TITLE` | Enriches phase names with project-specific context |

### Guardrails

- **Flag:** `SEED_USE_GEMINI=true` (default: off, deterministic text used).
- **Hard cap:** 50 API calls per seed run. Once reached, remaining rows keep deterministic text.
- **SDK:** Uses existing `@google/genai` already in the project.
- **Model:** `gemini-2.5-flash` (matches project convention, free tier).
- **Batching:** Group rows by table and send batch prompts (e.g., "enrich these 10 machine descriptions") to minimize call count.
- **Fallback:** If Gemini API fails or is unavailable, log a warning and keep deterministic text. Never block seeding.
- **No caching across runs:** Each seed run is independent. Enrichment is fast enough with batching that cross-run caching adds complexity without value.

### Prompt Strategy

Each table gets a short system prompt establishing context (field service management, Q360 platform) and a user prompt with the rows to enrich. Response is JSON array of enriched strings, matched by index.

Example for MACHINE:
```
System: You generate realistic equipment descriptions for a field service management system.
User: Enrich these machine descriptions. Return a JSON array of strings, one per input.
Input: ["Air Handler at Pinnacle Medical Center", "Water Pump at Alpine Water Treatment"]
```

### File Changes

| File | Change |
|------|--------|
| `scripts/seed-enrich.ts` | **New.** Gemini enrichment logic: batch prompts, budget tracking, fallback handling. Exports `enrichRows(tableName, rows, fields)` function. |
| `scripts/seed.ts` | After profile generation and before DB insert, call enrichment if `SEED_USE_GEMINI=true`. |

---

## npm Scripts (Final State)

```json
{
  "seed": "tsx scripts/seed.ts",
  "tables": "tsx scripts/seed.ts list",
  "seed:profiles": "tsx scripts/seed.ts profiles",
  "seed:validate": "tsx scripts/seed-validate.ts"
}
```

---

## Success Criteria

1. `npm run seed` prints a validation summary after seeding with zero errors for story data.
2. `npm run seed:validate` runs standalone against the current DB and reports issues.
3. With `SEED_USE_GEMINI=true`, profile-generated descriptions read like real service records, not templates.
4. With `SEED_USE_GEMINI` unset or false, seeding works identically to current behavior (no API calls, deterministic text).
5. Gemini failures never block seeding.
