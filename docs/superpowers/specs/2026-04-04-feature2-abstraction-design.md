# Feature 2 Abstraction — Design Spec

> **Date:** 2026-04-04
> **Scope:** Refactor Feature 2 email generation into shared abstract layer; build overdue alert
> **Branch:** `feature/2-utility-suite`
> **Owner:** Ryan (draft-email + overdue alert) / Partner (service-closure + new-call-ack)
> **Status:** Partially implemented as of 2026-04-05 — Sections 3-4 complete, Sections 1-2 partial

---

## Goal

Extract the core logic from `/api/feature2/generate` into shared functions so that:
1. The existing Feature 2 demo page keeps working as-is
2. A new abstract `/api/ai/draft-email` route serves Teams 1 & 3
3. Both routes share the same underlying code — no duplication
4. A self-contained `EmailDrafter.tsx` component lets other teams drop in email drafting with props

---

## Implementation Snapshot (2026-04-05)

- ✅ `components/ai/EmailDrafter.tsx` is implemented.
- ✅ Overdue alert stack is implemented (`/api/feature2/overdue`, `/feature2/overdue`, `AlertCard`, `StatsSummaryBar`).
- ✅ `/api/ai/draft-email` is implemented and streams output.
- ⚠️ `lib/entityResolver.ts` was planned but is not implemented.
- ⚠️ `/api/feature2/generate` is not yet a thin wrapper; core logic is still duplicated across routes.
- ⚠️ Planned JSON mode for `/api/ai/draft-email` (`?format=json`) is not implemented.

---

## Section 1: Shared Logic Extraction (APPROVED DESIGN, NOT YET IMPLEMENTED)

Pull data-fetching + formatting logic out of the generate route into a reusable module.

### Planned file: `lib/entityResolver.ts` (currently missing)

Responsible for: given an `(entityType, entityId)`, fetch the entity + related data (mock or live), return formatted prompt text.

```typescript
export async function resolveEntity(
  entityType: string,  // "dispatch" | "project" | etc.
  entityId: string
): Promise<{ formatted: string; raw: Record<string, unknown> }>
```

- Current state: both `/api/feature2/generate` and `/api/ai/draft-email` still fetch/resolve data independently.
- Impact: this section's no-duplication objective is not met yet.

### Existing files — unchanged

| File | Role | Changes |
|------|------|---------|
| `lib/q360Client.ts` | Q360 API calls + `formatDispatchForPrompt` | None |
| `lib/agentClient.ts` | Gemini streaming wrapper | None |
| `lib/emailPrompts.ts` | Prompt templates per automation type | None |
| `lib/mockDb.ts` | SQLite mock DB helpers | None |

---

## Section 2: Route Design (PARTIALLY IMPLEMENTED)

Two routes, same logic underneath. No duplication.

### Architecture

```
Browser (Feature 2 page)          Browser (Team 1/3 via EmailDrafter)
    |                                  |
    v                                  v
/api/feature2/generate          /api/ai/draft-email
    |                                  |
    +------------------+---------------+
                       v
         lib/entityResolver.ts  (fetch + format data)
         lib/emailPrompts.ts    (pick prompt template)
         lib/agentClient.ts     (call Gemini, stream)
```

### NEW: `POST /api/ai/draft-email` (abstract route)

Accepts the generic contract from `docs/plans/FEATURE_TAB_MAPPING.md` / `docs/plans/FEATURE_2_PLAN.md`:

```typescript
// Request body
{
  entityType: "dispatch" | "project" | "customer" | "servicecontract" | "timebill",
  entityId: string,
  intent: string,        // "status_update" | "overdue_alert" | "completion_notice" | "new_call_ack"
  audience?: "manager" | "customer" | "technician" | "internal",
  tone?: "formal" | "friendly" | "urgent",
  context?: Record<string, unknown>
}
```

- `intent` maps to the prompt template selection (replaces `automationType`)
- `audience` adjusts prompt framing (customer-facing vs internal)
- Returns **streaming text** by default (needed for live-typing visual effect)
- Supports `?format=json` query param for non-streaming JSON response (standard contract shape):

```typescript
// JSON response (when ?format=json)
{
  success: boolean,
  result: {
    content: string,
    subject?: string,
    metadata: {
      model: string,
      entityType: string,
      entityId: string
    }
  }
}
```

### EXISTING: `POST /api/feature2/generate` (thin wrapper)

- Keeps accepting `{ recordId, automationType, tone }` — Feature 2 page doesn't break
- Internally translates old params to new params:
  - `recordId` -> `entityId`, `recordType: "dispatch"` -> `entityType: "dispatch"`
  - `automationType: "project-status"` -> `intent: "status_update"`, etc.
  - `tone` maps: `"professional"` -> `"formal"`, `"concise"` -> `"urgent"`, `"friendly"` -> `"friendly"`
- Calls the same shared functions as `/api/ai/draft-email`
- No business logic of its own

### Open question (resolved)

`/api/ai/draft-email` currently supports all 4 existing intents (`project-status`, `service-closure`, `overdue-alert`, `new-call-ack`).

---

## Section 3: EmailDrafter Component

_Implemented (v1)._ Current behavior:

- `components/ai/EmailDrafter.tsx` — self-contained widget with props
- Props: `entityType`, `entityId`, `audience`, `defaultTone`
- Internal state: record selector (optional), tone picker, streaming preview panel
- Calls `/api/ai/draft-email` directly
- Teams 1 & 3 import and pass props — no need to build their own email UI

---

## Section 4: Overdue Alert

_Implemented (v1)._ Current behavior:

- `POST /api/feature2/overdue/route.ts` — batch scan, compute overdue, call Gemini (non-streaming JSON)
- `app/feature2/overdue/page.tsx` — scan button, stats bar, filter/sort, alert cards
- `app/feature2/components/AlertCard.tsx` — color-coded card (CRITICAL/HIGH/MEDIUM)
- `app/feature2/components/StatsSummaryBar.tsx` — summary bar
- Urgency tier logic from `docs/plans/FEATURE_2_PLAN.md`
- Mock data needs: dispatches with dates 3, 7, 10, 14+ days ago

---

## Parallel Work: Database Migration

Another agent is migrating from SQLite to PostgreSQL:
- Added `pg` + `@types/pg` to `package.json`
- Created `scripts/migrate-to-postgres.ts` (reads mock.db -> writes to Postgres at `DATABASE_URL`)
- No conflicts with our abstraction work — different files entirely
- Note: `lib/mockDb.ts` currently uses `better-sqlite3`. If the migration completes, `entityResolver.ts` may need to support both SQLite and Postgres read paths (or the mock data flag behavior may change).
