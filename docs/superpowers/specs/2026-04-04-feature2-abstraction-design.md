# Feature 2 Abstraction - Design Spec

> **Date:** 2026-04-04  
> **Scope:** Refactor Feature 2 email generation into shared abstract layer, then expand shared tools  
> **Branch:** `feature/2-utility-suite`  
> **Status:** Implemented as of 2026-04-05

---

## Goal

Extract core logic from `/api/feature2/generate` into shared functions so that:

1. Existing Feature 2 demo pages continue to work without request shape changes.
2. `/api/ai/draft-email` is the shared entrypoint for Teams 1 and 3.
3. Both routes use one underlying implementation path (no duplicated business logic).
4. Shared UI components can be dropped into other team pages with minimal wiring.

---

## Implementation Snapshot (2026-04-05)

- `components/ai/EmailDrafter.tsx` is implemented.
- Overdue alert stack is implemented:
  - `/api/feature2/overdue`
  - `/feature2/overdue`
  - `AlertCard`
  - `StatsSummaryBar`
- Shared resolver is implemented: `lib/entityResolver.ts`.
- Shared draft service is implemented: `lib/draftEmailService.ts`.
- `/api/feature2/generate` now delegates to shared draft service (thin wrapper behavior).
- `/api/ai/draft-email` supports:
  - streaming text (default)
  - optional JSON mode via `?format=json`
- Shared Phase 2 tool routes are implemented:
  - `/api/ai/summarize`
  - `/api/ai/recommend`
  - `/api/ai/status-report`
  - `/api/ai/smart-reply`
- Shared Phase 2 components are implemented:
  - `DataSummary`
  - `ActionRecommender`
  - `StatusReport`
  - `SmartReply`
- Shared component gallery is mounted on `/feature2`.

---

## Section 1: Shared Logic Extraction (Implemented)

### `lib/entityResolver.ts`

`resolveEntity(entityType, entityId, options)` provides reusable fetch + format behavior.

Current support:

- Full request validation supports abstract entity types.
- Data resolution is dispatch-first in this revision.
- Resolver returns formatted prompt text and raw records for downstream services.

This removed route-level duplication previously present in both draft routes.

### `lib/draftEmailService.ts`

Shared draft logic now owns:

- input normalization (`entityType`, `intent`, `tone`, `audience`)
- prompt selection
- stream generation
- optional JSON output shaping

---

## Section 2: Route Design (Implemented)

### Architecture

```text
Browser (Feature 2 page)          Browser (Team 1/3 via shared components)
    |                                  |
    v                                  v
/api/feature2/generate          /api/ai/draft-email
    |                                  |
    +------------------+---------------+
                       v
         lib/entityResolver.ts
         lib/draftEmailService.ts
         lib/emailPrompts.ts
         lib/agentClient.ts
```

### `POST /api/ai/draft-email`

Behavior:

- accepts abstract request shape
- normalizes compatible aliases for intents and tones
- defaults to streaming response
- supports `?format=json` for non-streaming payloads

### `POST /api/feature2/generate`

Behavior:

- keeps existing request shape `{ recordId, automationType, tone }`
- translates to shared draft input internally
- delegates to shared service
- contains no duplicated prompt/data business logic

---

## Section 3: Shared Components

Implemented shared components:

- `EmailDrafter.tsx`
- `DataSummary.tsx`
- `ActionRecommender.tsx`
- `StatusReport.tsx`
- `SmartReply.tsx`

Feature 2 now includes a mounted gallery/harness section on `/feature2` for handoff demos.

---

## Section 4: Overdue Alert

Implemented and unchanged in this revision:

- `POST /api/feature2/overdue/route.ts` (batch scan + AI JSON analysis)
- `app/feature2/overdue/page.tsx` (scan, filter/sort, summary + cards)
- `AlertCard` and `StatsSummaryBar` components

Urgency tiering and days-overdue rules remain aligned with `docs/plans/FEATURE_2_PLAN.md`.

---

## Follow-up Notes

- The abstract request contract is in place, but resolver depth for non-dispatch entity types is still a future extension.
- Remaining polish work is now test depth and real sandbox-ID validation, not core implementation.
