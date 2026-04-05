# Feature 2 — Build Plan

> **Owner:** Team 2
> **Branch:** `feature/2-utility-suite`
> **Demo deadline:** End of April 2026
> **Last updated:** 2026-04-04

---

## What We're Building

Feature 2 has two distinct layers:

### Layer A — Standalone Demo (`/feature2`)
Our own pages that showcase the AI tools in action. This is what we present at the live demo. Teams 1 and 3 do not touch this.

| Page | Status |
|------|--------|
| `/feature2` — Email Drafting | ✅ Done |
| `/feature2/overdue` — Overdue Dispatch Alert | ❌ Not built |

### Layer B — Abstract Shared Tools (`/api/ai/*` + `components/ai/*`)
Generic API routes and React components that Teams 1 and 3 embed into their dashboards. We build them, they consume them.

| Tool | API Route | Component | Status |
|------|-----------|-----------|--------|
| Email Drafter | `/api/ai/draft-email` | `components/ai/EmailDrafter.tsx` | ❌ Not built |
| Data Summarizer | `/api/ai/summarize` | `components/ai/DataSummary.tsx` | ❌ Not built |
| Action Recommender | `/api/ai/recommend` | `components/ai/ActionRecommender.tsx` | ❌ Not built |
| Status Report | `/api/ai/status-report` | `components/ai/StatusReport.tsx` | ❌ Not built |
| Smart Reply | `/api/ai/smart-reply` | `components/ai/SmartReply.tsx` | ❌ Not built |

---

## The Abstraction Strategy

### The Problem
Our current routes (`/api/feature2/*`) are tightly coupled to our own UI — they assume a dispatch record and a specific tone selector. Teams 1 and 3 can't reuse them cleanly.

### The Solution
Build a second set of routes at `/api/ai/*` with a **generic interface** that accepts `entityType`, `entityId`, `intent`, and `audience`. The same Gemini call underneath — just a flexible wrapper.

### How Teams 1 & 3 Will Use Our Components

```tsx
// Team 1 (manager dashboard) — formal client-facing email
<EmailDrafter
  entityType="dispatch"
  entityId="D-0042"
  audience="customer"
  defaultTone="professional"
/>

// Team 3 (employee dashboard) — internal note
<EmailDrafter
  entityType="dispatch"
  entityId={assignedDispatch.id}
  audience="internal"
  defaultTone="friendly"
/>
```

Same component. Different props. The API route handles the logic.

### The "No UI" Problem — Solved
We don't need Teams 1 or 3's dashboards to test our components. **Our own `/feature2` page is the test harness.** Build each shared component in `components/ai/`, drop it on our Feature 2 page to verify it works, then hand it off. When Team 1 or 3 is ready, they just import the same component.

---

## API Contract

Every shared tool follows the same request/response shape so Teams 1 and 3 can call them identically.

### Request (all tools)
```typescript
// POST /api/ai/<tool-name>
{
  entityType: "dispatch" | "project" | "customer" | "servicecontract" | "timebill",
  entityId: string,           // e.g. "D-00123" or "P-0042"
  intent: string,             // e.g. "status_update", "completion_notice", "escalation"
  context?: Record<string, unknown>, // optional extra data
  audience?: "manager" | "customer" | "technician" | "internal",
  tone?: "formal" | "friendly" | "urgent"
}
```

### Response (all tools)
```typescript
{
  success: boolean,
  result: {
    content: string,       // generated text (email body, summary, etc.)
    subject?: string,      // for emails: subject line
    actions?: string[],    // for recommender: list of suggested actions
    metadata: {
      model: string,
      entityType: string,
      entityId: string
    }
  }
}
```

---

## Build Order

### Phase 1 — Core Demo (April 7–14) ← Start here

#### 1. `/feature2/overdue` — Overdue Dispatch Alert Page
The second demo moment. Scan all open dispatches, AI identifies which are overdue and ranks them by urgency.

**Files to build:**
```
app/api/feature2/overdue/route.ts     POST — fetch open dispatches, compute overdue, call Gemini
app/feature2/overdue/page.tsx         Scan button, stats bar, filter/sort, alert cards
app/feature2/components/AlertCard.tsx         Color-coded card (CRITICAL/HIGH/MEDIUM)
app/feature2/components/StatsSummaryBar.tsx   "X scanned / Y overdue / Z critical" bar
```

**AI output:** Non-streaming JSON (alert cards must all render at once)
```json
{
  "summary": { "totalScanned": 45, "totalOverdue": 8, "critical": 2, "high": 4, "medium": 2 },
  "alerts": [
    {
      "dispatchno": "D-0042",
      "urgencyTier": "CRITICAL",
      "daysOverdue": 14,
      "customer": "Acme Corp",
      "site": "Salt Lake City, UT",
      "problem": "HVAC failure in server room",
      "techAssigned": null,
      "aiSummary": "Machine-down call with no tech assigned — client waiting 2 weeks.",
      "recommendedAction": "Assign technician and contact customer within 1 hour."
    }
  ]
}
```

**Urgency tiers:**
| Tier | Condition |
|------|-----------|
| CRITICAL | 14+ days overdue, OR no tech AND 7+ days overdue, OR priority = 1 |
| HIGH | 7–13 days overdue |
| MEDIUM | 1–6 days overdue |

---

#### 2. `/api/ai/draft-email` — Abstract Email Route
Generic version of our existing `/api/feature2/generate`. Accepts any entity type and audience.

**File:** `app/api/ai/draft-email/route.ts`

**Key difference from `/api/feature2/generate`:**
- Accepts `entityType` (not just dispatch)
- Accepts `audience` (customer / internal / manager / technician)
- Fetches entity data based on `entityType` + `entityId`
- Adjusts prompt based on `audience`

---

#### 3. `components/ai/EmailDrafter.tsx` — Shared Email Drafter Widget
Self-contained React component. Includes its own record selector, tone picker, and preview panel. Calls `/api/ai/draft-email`.

Teams 1 and 3 import this and pass props — they don't build their own email UI.

---

### Phase 2 — Expand Tools (April 14–21)

#### 4. `/api/ai/summarize` + `components/ai/DataSummary.tsx`
Given a Q360 entity, generate a human-readable summary.
- Team 1 uses it for: "Your top 5 at-risk projects"
- Team 3 uses it for: "Your assigned dispatches today"

#### 5. `/api/ai/recommend` + `components/ai/ActionRecommender.tsx`
Given an entity state, suggest next actions.
- Team 1 uses it for: "3 contracts expiring this week — send renewals"
- Team 3 uses it for: "Dispatch D-0042 needs parts — create PO"

#### 6. `/api/ai/status-report` + `components/ai/StatusReport.tsx`
Generate a structured status report for a project or dispatch portfolio.

---

### Phase 3 — Polish & Deploy (April 21–30)

- Error handling + loading states on all components
- Fallback data if Q360 API is down (never break the demo)
- Add shared components to Feature 2 page as a "component gallery" for demo
- Vercel deployment
- 3× full demo rehearsal before April 30

---

## File Structure (Target State)

```
app/
├── feature2/
│   ├── page.tsx                          ✅ Done — email drafting demo
│   ├── overdue/
│   │   └── page.tsx                      ❌ Build in Phase 1
│   └── components/
│       ├── RecordSelector.tsx            ✅ Done
│       ├── AutomationTypeCard.tsx        ✅ Done
│       ├── ToneSelector.tsx              ✅ Done
│       ├── EmailPreviewPanel.tsx         ✅ Done
│       ├── AlertCard.tsx                 ❌ Build in Phase 1
│       └── StatsSummaryBar.tsx           ❌ Build in Phase 1
│
├── api/
│   ├── feature2/
│   │   ├── generate/route.ts             ✅ Done — Feature 2 specific
│   │   ├── records/route.ts              ✅ Done — dispatch list
│   │   └── overdue/route.ts              ❌ Build in Phase 1
│   │
│   └── ai/                              ← Abstract shared layer (Phase 1–2)
│       ├── draft-email/route.ts          ❌ Build in Phase 1
│       ├── summarize/route.ts            ❌ Build in Phase 2
│       ├── recommend/route.ts            ❌ Build in Phase 2
│       └── status-report/route.ts       ❌ Build in Phase 2
│
components/
└── ai/                                  ← Shared components for Teams 1 & 3
    ├── EmailDrafter.tsx                  ❌ Build in Phase 1
    ├── DataSummary.tsx                   ❌ Build in Phase 2
    ├── ActionRecommender.tsx             ❌ Build in Phase 2
    └── StatusReport.tsx                 ❌ Build in Phase 2

lib/
├── agentClient.ts                        ✅ Done — Gemini client
├── emailPrompts.ts                       ✅ Done — prompt templates
├── q360Client.ts                         ✅ Done — Q360 API client
└── mockDb.ts                            ✅ Done — SQLite mock DB
```

---

## What to Tell Teams 1 & 3

Once a shared component is ready, Teams 1 and 3 use it like this:

```tsx
// Import the component
import EmailDrafter from "@/components/ai/EmailDrafter";

// Drop it anywhere in their page
<EmailDrafter
  entityType="dispatch"
  entityId={dispatch.dispatchno}
  audience="customer"
  defaultTone="professional"
/>
```

They do not touch `/api/ai/*` routes directly — the component handles everything. If they need different behavior (different prompt, different output format), they tell us and we add an option to the component.

**Handoff checklist per component:**
- [ ] Component works standalone on `/feature2` page
- [ ] Props are documented with TypeScript types
- [ ] Loading, error, and empty states are handled
- [ ] Tested with at least 3 different entity IDs

---

## Demo Talking Points

### Email Drafting (2–3 min)
> "One of the biggest time sinks in field service is writing status updates and client emails. A coordinator might write dozens a day. We built a suite that does this in one click."

1. Select a dispatch from the dropdown — sponsor sees real customer names
2. Click Generate — AI streams a professional email live
3. Switch tone, click Regenerate — proves it's not cached

### Overdue Dispatch Alert (2 min)
> "Coordinators manually check the queue every morning to find overdue calls. 20–30 minutes per coordinator, every day."

1. Click Scan — show two-phase loading
2. Results appear — X scanned, Y overdue, Z critical
3. Point to a red card: AI wrote a specific summary and recommended action
> "That's not a lookup. That's a judgment call that normally takes a human to make."

---

## Open Questions

1. **Team assignments** — who on Team 2 is building which phase? Assign before April 7.
2. **Mock data for overdue demo** — need dispatches with `date` values 3, 7, 10, 14+ days ago in the mock DB. Run `npx tsx scripts/seed-local.ts` or create a custom seed.
3. **Teams 1 & 3 readiness** — when will they be ready to consume shared components? Coordinate on Slack so we don't build components they'll never integrate.
4. **Gemini model** — currently using `gemini-2.5-flash`. Confirm this stays stable through the demo date.
