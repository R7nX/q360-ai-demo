# Feature 2 Plan — Automated Utility Suite

> **Owner:** Team 2  
> **Branch:** `feature/2-utility-suite`  
> **Deadline:** End of April 2026  
> **Last updated:** 2026-04-05  
> **Status:** Phase 1 mostly complete; Phase 2 shared-tool expansion pending

---

## 1. Purpose

Feature 2 delivers reusable AI utilities plus a standalone demo experience:

- `/feature2` — AI email drafting from Q360 dispatch context
- `/feature2/overdue` — AI overdue dispatch analysis dashboard
- Shared abstractions for Teams 1 and 3 under `/api/ai/*` and `components/ai/*`

This file is the single source of truth for Feature 2 planning and status,
based on the prior split docs and a full repository implementation audit
(2026-04-05).

---

## 2. Executive Status

### Completed

- `/feature2` page and core email drafting flow are working.
- `/feature2/overdue` page is built and wired to `/api/feature2/overdue`.
- Overdue UI components are built: `AlertCard`, `StatsSummaryBar`.
- Shared draft route exists: `/api/ai/draft-email`.
- Shared draft component exists: `components/ai/EmailDrafter.tsx`.
- Test suite passes (`npm test`: 87/87).
- Production build passes (`npm run build`).

### Pending

- `/api/ai/summarize`
- `/api/ai/recommend`
- `/api/ai/status-report`
- `/api/ai/smart-reply`
- `components/ai/DataSummary.tsx`
- `components/ai/ActionRecommender.tsx`
- `components/ai/StatusReport.tsx`
- `components/ai/SmartReply.tsx`

### Partial / Drift From Original Plan

- Planned shared resolver `lib/entityResolver.ts` is not implemented.
- `/api/feature2/generate` is not a thin wrapper yet; route logic is duplicated with `/api/ai/draft-email`.
- `/api/ai/draft-email` currently supports `entityType: "dispatch"` only.
- Planned `?format=json` mode on `/api/ai/draft-email` is not implemented.
- Overdue API currently caps analyzed records at `15` (plan text said `50`).

---

## 3. Scope and Demo Goals

### Phase 1 (demo-critical)

1. Project Status Email (streaming output)
2. Overdue Dispatch Alert (non-streaming JSON to cards)

### Phase 2 (shared expansion)

1. Summarizer
2. Recommender
3. Status report
4. Smart reply

### Phase 3 (polish)

1. Stronger loading/error/empty states across all shared tools
2. Feature 2 page component gallery for handoff demos
3. Deployment + rehearsal

---

## 4. Implementation Matrix

### Layer A — Standalone Demo (`/feature2`)

| Item | Status |
|---|---|
| `/feature2` | ✅ Built |
| `/feature2/overdue` | ✅ Built |
| `app/feature2/components/RecordSelector.tsx` | ✅ Built |
| `app/feature2/components/AutomationTypeCard.tsx` | ✅ Built |
| `app/feature2/components/ToneSelector.tsx` | ✅ Built |
| `app/feature2/components/EmailPreviewPanel.tsx` | ✅ Built |
| `app/feature2/components/AlertCard.tsx` | ✅ Built |
| `app/feature2/components/StatsSummaryBar.tsx` | ✅ Built |

### Layer B — Shared Abstractions (`/api/ai/*`, `components/ai/*`)

| Tool | API | Component | Status |
|---|---|---|---|
| Email Drafter | `/api/ai/draft-email` | `EmailDrafter.tsx` | ✅ Built (v1) |
| Data Summarizer | `/api/ai/summarize` | `DataSummary.tsx` | ❌ Pending |
| Action Recommender | `/api/ai/recommend` | `ActionRecommender.tsx` | ❌ Pending |
| Status Report | `/api/ai/status-report` | `StatusReport.tsx` | ❌ Pending |
| Smart Reply | `/api/ai/smart-reply` | `SmartReply.tsx` | ❌ Pending |

---

## 5. Current Architecture (Implemented)

### Feature-specific routes

- `POST /api/feature2/generate`  
  Streaming email generation for Feature 2 page.
- `POST /api/feature2/overdue`  
  Non-streaming overdue batch analysis.
- `GET /api/feature2/records`  
  Dispatch list for selector UI.

### Shared route

- `POST /api/ai/draft-email`  
  Shared draft route for teams; currently dispatch-only.

### AI client and prompts

- `lib/agentClient.ts` uses `@google/genai` with model `gemini-2.5-flash`.
- `lib/emailPrompts.ts` contains prompt builders for:
  - `project-status`
  - `service-closure`
  - `overdue-alert`
  - `new-call-ack`
  - overdue batch JSON analysis

### Data sources

- Mock data path: SQLite/Postgres via `lib/mockDb.ts` (based on `USE_MOCK_DATA` + `DATABASE_URL`)
- Hard fallback constants in `lib/q360Client.ts`

---

## 6. API Contract

### 6.1 Current v1 contract (`/api/ai/draft-email`)

Request (implemented):

```ts
{
  entityType?: "dispatch", // only dispatch currently accepted
  entityId: string,
  intent: "project-status" | "service-closure" | "overdue-alert" | "new-call-ack",
  audience?: "customer" | "internal" | "manager" | "technician",
  tone?: "professional" | "friendly" | "concise"
}
```

Response (implemented):

- Streaming plain text (`SUBJECT: ...` + body), not JSON envelope.

### 6.2 Target contract (planned for full shared layer)

```ts
{
  entityType: "dispatch" | "project" | "customer" | "servicecontract" | "timebill",
  entityId: string,
  intent: string,
  context?: Record<string, unknown>,
  audience?: "manager" | "customer" | "technician" | "internal",
  tone?: "formal" | "friendly" | "urgent"
}
```

Planned JSON response:

```ts
{
  success: boolean,
  result: {
    content: string,
    subject?: string,
    actions?: string[],
    metadata: {
      model: string,
      entityType: string,
      entityId: string
    }
  }
}
```

---

## 7. Overdue Alert Rules (Canonical)

### Urgency tiers

| Tier | Condition |
|---|---|
| CRITICAL | `daysOverdue >= 14` OR `(unassigned && daysOverdue >= 7)` OR `priority = 1` |
| HIGH | `daysOverdue 7..13` (non-critical) |
| MEDIUM | `daysOverdue 1..6` (non-critical) |

### Days-overdue calculation

1. Use `estfixtime` when parseable and not `.00`.
2. Else fallback to `date + 7 days`.
3. Overdue when computed result `> 0`.

---

## 8. Verification Snapshot (2026-04-05)

- `npm test`  
  Result: pass (`5` test files, `87` tests).
- `npm run build`  
  Result: pass.
- Existing coverage includes:
  - prompt generation
  - streaming/JSON AI client behavior
  - `computeDaysOverdue`
  - Feature 2 page/selector behavior

Gap:

- No dedicated tests yet for `components/ai/EmailDrafter.tsx`.

---

## 9. Remaining Work Checklist

## 9.1 Must finish for complete plan parity

- [ ] Implement `lib/entityResolver.ts` and remove route duplication.
- [ ] Convert `/api/feature2/generate` into thin wrapper over shared logic.
- [ ] Align intent/tone naming with final abstract contract or document final decision.
- [ ] Implement optional JSON mode for `/api/ai/draft-email` if required by integrations.

## 9.2 Phase 2 shared tools

- [ ] `app/api/ai/summarize/route.ts`
- [ ] `app/api/ai/recommend/route.ts`
- [ ] `app/api/ai/status-report/route.ts`
- [ ] `app/api/ai/smart-reply/route.ts`
- [ ] `components/ai/DataSummary.tsx`
- [ ] `components/ai/ActionRecommender.tsx`
- [ ] `components/ai/StatusReport.tsx`
- [ ] `components/ai/SmartReply.tsx`

## 9.3 Handoff readiness

- [ ] Mount shared components on `/feature2` as gallery/harness.
- [x] Props documented via TypeScript.
- [x] Loading/error/empty states in `EmailDrafter`.
- [ ] Verify with at least 3 real entity IDs per shared component.

---

## 10. Notes for Teams 1 and 3

Current safe integration path:

- Use `components/ai/EmailDrafter.tsx` for draft-email use cases.
- Assume streaming response behavior from `/api/ai/draft-email`.
- Coordinate before depending on unbuilt endpoints (`summarize`, `recommend`, `status-report`, `smart-reply`).
