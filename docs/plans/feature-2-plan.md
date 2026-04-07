# Feature 2 Plan - Automated Utility Suite

> **Owner:** Team 2  
> **Branch:** `feature/2-utility-suite`  
> **Deadline:** End of April 2026  
> **Last updated:** 2026-04-07  
> **Status:** Core Feature 2 scope complete; shared-contract review fixes applied; handoff validation in progress

---

## 1. Purpose

Feature 2 delivers reusable AI utilities plus a standalone demo experience:

- `/feature2` - AI email drafting from Q360 dispatch context
- `/feature2/overdue` - AI overdue dispatch analysis dashboard
- Shared abstractions for Teams 1 and 3 under `/api/ai/*` and `components/ai/*`

This file is the current source of truth for Feature 2 status and remaining handoff work.

---

## 2. Executive Status

### Completed

- `/feature2` page and core email drafting flow are working.
- `/feature2/overdue` page is built and wired to `/api/feature2/overdue`.
- Overdue UI components are built: `AlertCard`, `StatsSummaryBar`.
- Shared draft route exists: `/api/ai/draft-email`.
- `/api/feature2/generate` now uses shared draft logic (thin wrapper behavior).
- Shared resolver exists: `lib/entityResolver.ts` with live Q360 resolution for
  `dispatch`, `project`, `customer`, `servicecontract`, and `timebill`, plus
  mock/fallback support for local development.
- Optional JSON mode is supported on `/api/ai/draft-email?format=json`.
- Shared tool routes are implemented:
  - `/api/ai/summarize`
  - `/api/ai/recommend`
  - `/api/ai/status-report`
  - `/api/ai/smart-reply`
- Shared components are implemented:
  - `components/ai/EmailDrafter.tsx`
  - `components/ai/DataSummary.tsx`
  - `components/ai/ActionRecommender.tsx`
  - `components/ai/StatusReport.tsx`
  - `components/ai/SmartReply.tsx`
- Shared component gallery/harness is mounted on `/feature2`.
- Current branch verification on 2026-04-07:
  - `npm test` -> pass (`145` tests, `14` files)
  - `npm run lint` -> pass
  - `npm run build` -> blocked in this restricted environment by `next/font` Google Fonts fetch (`Geist`, `Geist Mono`)

### Remaining / Follow-up

- Validate each shared tool with at least 3 real sandbox entity IDs before final demo handoff.
- Continue adding deeper scenario coverage as Teams 1 and 3 integrate more entity-specific contexts.

### Known Drift From Older Plan Text

- Overdue API continues to cap analyzed records at `15` (older planning text mentioned `50`).

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
2. Handoff validation with real sandbox IDs
3. Deployment rehearsal

---

## 4. Implementation Matrix

### Layer A - Standalone Demo (`/feature2`)

| Item | Status |
|---|---|
| `/feature2` | Complete |
| `/feature2/overdue` | Complete |
| `app/feature2/components/RecordSelector.tsx` | Complete |
| `app/feature2/components/AutomationTypeCard.tsx` | Complete |
| `app/feature2/components/ToneSelector.tsx` | Complete |
| `app/feature2/components/EmailPreviewPanel.tsx` | Complete |
| `app/feature2/components/AlertCard.tsx` | Complete |
| `app/feature2/components/StatsSummaryBar.tsx` | Complete |

### Layer B - Shared Abstractions (`/api/ai/*`, `components/ai/*`)

| Tool | API | Component | Status |
|---|---|---|---|
| Email Drafter | `/api/ai/draft-email` | `EmailDrafter.tsx` | Complete |
| Data Summarizer | `/api/ai/summarize` | `DataSummary.tsx` | Complete |
| Action Recommender | `/api/ai/recommend` | `ActionRecommender.tsx` | Complete |
| Status Report | `/api/ai/status-report` | `StatusReport.tsx` | Complete |
| Smart Reply | `/api/ai/smart-reply` | `SmartReply.tsx` | Complete |

---

## 5. Current Architecture

### Feature-specific routes

- `POST /api/feature2/generate`  
  Legacy Feature 2 request shape; now delegates to shared draft service.
- `POST /api/feature2/overdue`  
  Non-streaming overdue batch analysis.
- `GET /api/feature2/records`  
  Dispatch list for selector UI.

### Shared routes

- `POST /api/ai/draft-email`
- `POST /api/ai/summarize`
- `POST /api/ai/recommend`
- `POST /api/ai/status-report`
- `POST /api/ai/smart-reply`

### Shared service layer

- `lib/entityResolver.ts` - entity fetch + prompt formatting for documented shared entity types
- `lib/draftEmailService.ts` - shared draft generation and normalization logic
- `lib/aiToolsService.ts` - summarize/recommend/status/smart-reply generation logic

### AI client and prompts

- `lib/agentClient.ts` uses `@google/genai` with model `gemini-2.5-flash`.
- `lib/emailPrompts.ts` contains prompt builders for:
  - `project-status`
  - `service-closure`
  - `overdue-alert`
  - `new-call-ack`
  - overdue batch JSON analysis

---

## 6. API Contract

### 6.1 `/api/ai/draft-email` (implemented behavior)

Request:

```ts
{
  entityType?: "dispatch" | "project" | "customer" | "servicecontract" | "timebill",
  entityId: string,
  intent: "project-status" | "service-closure" | "overdue-alert" | "new-call-ack",
  context?: Record<string, unknown>,
  audience?: "customer" | "internal" | "manager" | "technician",
  tone?: "professional" | "friendly" | "concise" | "formal" | "urgent"
}
```

Response modes:

- Default: streaming plain text (`SUBJECT: ...` + body)
- Optional: `?format=json` returns:

```ts
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
  } | null,
  message?: string
}
```

### 6.2 Shared tools contract (`/api/ai/summarize|recommend|status-report|smart-reply`)

```ts
{
  entityType: "dispatch" | "project" | "customer" | "servicecontract" | "timebill",
  entityId: string,
  intent?: string,
  context?: Record<string, unknown>,
  audience?: "manager" | "customer" | "technician" | "internal",
  tone?: "professional" | "friendly" | "concise"
}
```

`/api/ai/recommend` may include `result.actions[]`, and `/api/ai/smart-reply` requires an inbound message in either `inboundMessage` or `context.inboundMessage`.

---

## 7. Overdue Alert Rules

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

## 8. Verification Snapshot (2026-04-07)

- `npm test`  
  Result: pass (`14` test files, `145` tests).
- `npm run lint`  
  Result: pass.
- `npm run build`  
  Result: blocked in this restricted environment by `next/font` Google Fonts fetch (`Geist`, `Geist Mono`).

Coverage highlights:

- Prompt generation
- Streaming and JSON AI client behavior
- `computeDaysOverdue`
- Feature 2 page and selector behavior
- Draft-email and Feature 2 generation route behavior
- Shared AI component exports and interaction behavior (`__tests__/components/AiSharedComponents.test.tsx`)

Remaining validation gap:

- Real sandbox-ID validation is still pending for the shared tool routes/components.

---

## 9. Remaining Work Checklist

### 9.1 Plan parity

- [x] Implement `lib/entityResolver.ts` and remove route duplication.
- [x] Convert `/api/feature2/generate` into thin wrapper over shared logic.
- [x] Align intent/tone naming with abstract contract (documented aliases and supported values).
- [x] Implement optional JSON mode for `/api/ai/draft-email`.

### 9.2 Phase 2 shared tools

- [x] `app/api/ai/summarize/route.ts`
- [x] `app/api/ai/recommend/route.ts`
- [x] `app/api/ai/status-report/route.ts`
- [x] `app/api/ai/smart-reply/route.ts`
- [x] `components/ai/DataSummary.tsx`
- [x] `components/ai/ActionRecommender.tsx`
- [x] `components/ai/StatusReport.tsx`
- [x] `components/ai/SmartReply.tsx`

### 9.3 Handoff readiness

- [x] Mount shared components on `/feature2` as gallery/harness.
- [x] Props documented via TypeScript.
- [x] Loading/error/empty states in `EmailDrafter`.
- [ ] Verify with at least 3 real entity IDs per shared component.

---

## 10. Notes for Teams 1 and 3

Current integration guidance:

- `components/ai/EmailDrafter.tsx` is stable for draft-email flows.
- Shared tool components now exist for summarize/recommend/status-report/smart-reply.
- `/api/ai/draft-email` supports streaming by default and JSON mode via `?format=json`.
- Shared routes/components now accept the documented entity types:
  `dispatch`, `project`, `customer`, `servicecontract`, and `timebill`.
