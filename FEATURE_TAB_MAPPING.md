# Feature-to-Tab Mapping & API Routing Plan

> Maps each feature team to Q360 tabs, data tables, and Next.js routes.
> Use this to: (1) know which Q360 screens to compare your work against, (2) avoid route/file collisions between teams, (3) understand which data each team owns.
>
> **Updated: 2026-04-03** — Reflects role change: F1 = Manager homepage, F3 = Employee homepage, F2 = shared AI tools.

---

## Team Structure (Updated)

| Team | Feature | What They Build | Authority Level |
|------|---------|----------------|-----------------|
| **Team 1** | Intelligent Command Center | Homepage for **Managers / Dispatchers / PMs / Finance** | High authority |
| **Team 2** | Automated Utility Suite | **Shared AI tools** consumed by both Team 1 and Team 3 | Cross-cutting (no dedicated page) |
| **Team 3** | Dynamic Workflow Architect | Homepage for **Technicians / CSRs / Employees** | Lower authority |

---

## Feature 1 — Manager Command Center

**Who sees this:** Managers, Project Managers, Dispatchers, Sales Managers, Finance/Billing staff

### Q360 Tabs This Feature Maps To

| Q360 Tab | Why | What to Compare Against |
|----------|-----|------------------------|
| **Projects** (Tab 6) | Project health, overdue tasks, % complete, budget vs actual | Project Console, Task Console, My Active Projects |
| **Service** (Tab 7) | Dispatch overview, SLA breaches, queue depths | Dispatch Q, Calendar, Priority Q, Open Too Long Q |
| **Sales** (Tab 4) | Pipeline health, quote/order status, funnel | Dashboard, Opportunities, Quotes, Sales Forecast |
| **Accounting** (Tab 5) | AR/AP aging, invoice status, revenue | Aged AR/AP Quick Views, Income Comparison |
| **Live Data** (Tab 10) | Pre-built analytical reports — the "source" for dashboard widgets | Project Profit reports, Dispatch Profit reports, Revenue By reports |
| **Dashboards** (Tab 12) | Existing dashboard widgets to replicate/improve | Sales Opportunity Funnel, Service Call Open/Closed |
| **File > Home** (Tab 1) | The current landing page — your replacement target | `customhome` action |

### Key Data Tables

| Table | Use Case |
|-------|----------|
| `DISPATCH` | Open calls, SLA status, tech assignments |
| `PROJECTS` | Project health, % complete, budgets |
| `TIMEBILL` | Labor utilization, hours vs budget |
| `INVOICE` | Revenue, outstanding balances |
| `SERVICECONTRACT` | Expiring contracts, renewal alerts |
| `CUSTOMER` | Customer health scores, YTD sales |
| `SITE` | Site-level service patterns |

### AI Integration Points (Consumed from Team 2)

- **Proactive Insights:** AI analyzes project/dispatch data → "Next Steps" suggestions (e.g., "Project P-0042 is 3 weeks overdue — schedule a status review")
- **NLP Prioritization:** AI weights deadlines across modules into a daily priority agenda
- **Smart Summaries:** AI-generated executive summaries of module health

---

## Feature 2 — AI Utility Suite (Shared Tools)

**Who builds this:** Team 2 (your team)
**Who consumes this:** Team 1 and Team 3 (and potentially refined by Team 2 as well)

### Design Principle

All tools are built as **abstracted, reusable API routes + UI components**. Each tool:
1. Has a generic version that works standalone
2. Can be imported/configured by Team 1 or Team 3 for their specific context
3. May be refined by Team 2 directly if other teams are overloaded

### Q360 Tabs This Feature Maps To

| Q360 Tab | Why | What to Compare Against |
|----------|-----|------------------------|
| **Maintenance > Email** (Tab 3) | Email template system, alert rules — your AI drafting replaces/enhances this | Email Template Admin, Email Alert Admin, Email Configuration |
| **Maintenance > AI Config** (Tab 3) | Q360's built-in AI features — understand what exists before building on top | AI Configuration, AI Chat Message Log |
| **Service** (Tab 7) | Dispatches are the primary context for auto-generated emails/reports | Help Desk (dispatch form), Dispatch Q |
| **Projects** (Tab 6) | Project status emails, progress reports | Project Console, Task Console |
| **Sales** (Tab 4) | Client update emails, quote follow-ups | Opportunities, Quotes, Activity |
| **View** (Tab 2) | Activity records, tasks — things that trigger automations | Activity, My Tasks, To Do List |
| **File > Document Mgmt** (Tab 1) | Generated documents/reports storage | Document Management, Business Documentation |

### AI Tools to Build (Abstract → Refine)

| Tool | Abstract Version | Refinement Examples |
|------|-----------------|-------------------|
| **Smart Email Drafter** | Given entity type + ID + intent → generates email draft | F1: Executive status report email. F3: Dispatch completion notification to customer |
| **Status Report Generator** | Given project/dispatch data → generates summary report text | F1: Portfolio-level project health report. F3: Individual tech's daily work summary |
| **Smart Reply Suggester** | Given inbound email/comment → suggests response | F1: Client escalation response. F3: Quick reply to dispatch update |
| **Data Summarizer** | Given table query results → generates human-readable summary | F1: "Your top 5 at-risk projects." F3: "Your assigned dispatches today" |
| **Action Recommender** | Given entity state → suggests next actions | F1: "3 contracts expiring this week — send renewals." F3: "Dispatch D-0042 needs parts — create PO" |

### Key Data Tables (Read-Only — Tools Pull Context From These)

| Table | Used By Which Tool |
|-------|-------------------|
| `DISPATCH` | Email Drafter, Status Report, Action Recommender |
| `PROJECTS` | Email Drafter, Status Report, Data Summarizer |
| `CUSTOMER` | Email Drafter (recipient info), Smart Reply |
| `CONTACT` | Email Drafter (recipient details) |
| `TIMEBILL` | Status Report, Data Summarizer |
| `SERVICECONTRACT` | Action Recommender |
| `SITE` | Email Drafter (site context) |
| `USERID` | All tools (current user context) |

---

## Feature 3 — Employee Workflow Hub

**Who sees this:** Technicians, CSRs, Junior Staff, Field Workers

### Q360 Tabs This Feature Maps To

| Q360 Tab | Why | What to Compare Against |
|----------|-----|------------------------|
| **View** (Tab 2) | My Tasks, To Do, Active Time Bills — the employee's personal workspace | My Tasks, To Do List, My Active Time Bills, Activity |
| **File** (Tab 1) | Time Bill entry, Expenses, Quick Search | Time Bill, Time Log, Expenses, HR Time Request |
| **Service** (Tab 7) | Assigned dispatches, knowledge base for troubleshooting | Help Desk (dispatch), Knowledge Base, Dispatch Q (filtered to self) |
| **HR** (Tab 9) | Schedule, time-off requests, org chart | Schedule, HR Time Request, Employee Org Chart |
| **Projects** (Tab 6) | Assigned project tasks, time entry | My Active Projects, Tasks, Project Team Time Entry |
| **Workflow** (Tab 11) | Pre-built workflow guides — the "how do I do X?" reference | Workflow Definitions, Service Overview, Warehouse workflows |

### Key Data Tables

| Table | Use Case |
|-------|----------|
| `DISPATCH` | My assigned service calls (filtered by `TECHASSIGNED = currentUser`) |
| `TIMEBILL` | My time entries, clock in/out |
| `PROJECTS` | My assigned projects (via `PROJECTTEAM`) |
| `MACHINE` | Equipment I'm servicing |
| `USERID` | My profile, permissions, zone assignments |
| `EMPSCHEDULE` / `GLOBALSCHEDULE` | My work schedule |
| `SITE` | Sites I'm visiting today |

### AI Integration Points (Consumed from Team 2)

- **Workflow Recommendations:** AI suggests step-by-step task lists based on assigned work
- **Smart Drafting:** Auto-generate dispatch completion notes, time entry descriptions
- **Knowledge Base Search:** AI-enhanced search for troubleshooting (leveraging `knowledge_base_search`)
- **Daily Briefing:** AI summarizes "here's your day" from dispatches + tasks + schedule

---

## Tab Ownership Summary

Shows which team(s) reference each Q360 tab. **Bold = primary owner.**

| Q360 Tab | Team 1 (Mgr) | Team 2 (AI Tools) | Team 3 (Emp) |
|----------|:---:|:---:|:---:|
| File (Tab 1) | Home | Doc Mgmt | Time Bill, Expenses |
| View (Tab 2) | — | Activity | **My Tasks, To Do** |
| Maintenance (Tab 3) | — | **Email, AI Config** | — |
| Sales (Tab 4) | **Pipeline, Forecast** | Context for emails | — |
| Accounting (Tab 5) | **AR/AP, Revenue** | — | — |
| Projects (Tab 6) | **Project Health** | Context for reports | My Tasks |
| Service (Tab 7) | **Dispatch Overview** | Context for emails | **My Dispatches** |
| Inventory (Tab 8) | — | — | Parts (if needed) |
| HR (Tab 9) | — | — | **Schedule, Time Off** |
| Live Data (Tab 10) | **Reports Source** | — | — |
| Workflow (Tab 11) | — | — | **Guides** |
| Dashboards (Tab 12) | **Widgets** | — | — |

---

## Next.js Route & File Structure

### Routing Convention

```
/app
├── (manager)/              ← Team 1 layout group (Feature 1)
│   ├── layout.tsx          ← Manager shell: sidebar with Projects, Service, Sales, etc.
│   ├── dashboard/
│   │   └── page.tsx        ← Main manager homepage / command center
│   ├── projects/
│   │   └── page.tsx        ← Project health overview
│   ├── service/
│   │   └── page.tsx        ← Dispatch overview, queues
│   ├── sales/
│   │   └── page.tsx        ← Pipeline, forecast
│   ├── accounting/
│   │   └── page.tsx        ← AR/AP, revenue summary
│   └── reports/
│       └── page.tsx        ← Live Data reports
│
├── (employee)/             ← Team 3 layout group (Feature 3)
│   ├── layout.tsx          ← Employee shell: simpler sidebar
│   ├── home/
│   │   └── page.tsx        ← Employee daily briefing / workflow hub
│   ├── my-dispatches/
│   │   └── page.tsx        ← Assigned service calls
│   ├── my-tasks/
│   │   └── page.tsx        ← Tasks + to-do
│   ├── time/
│   │   └── page.tsx        ← Time bill entry + log
│   ├── schedule/
│   │   └── page.tsx        ← HR schedule, time-off
│   └── workflows/
│       └── page.tsx        ← AI-generated workflow guides
│
├── api/                    ← All backend API routes
│   ├── q360/               ← Q360 proxy routes (shared)
│   │   ├── dispatches/
│   │   │   └── route.ts    ← GET/POST dispatches
│   │   ├── projects/
│   │   │   └── route.ts    ← GET/POST projects
│   │   ├── customers/
│   │   │   └── route.ts    ← GET customers
│   │   ├── contacts/
│   │   │   └── route.ts    ← GET contacts
│   │   ├── timebills/
│   │   │   └── route.ts    ← GET/POST time bills
│   │   ├── service-contracts/
│   │   │   └── route.ts    ← GET service contracts
│   │   ├── sites/
│   │   │   └── route.ts    ← GET sites
│   │   ├── users/
│   │   │   └── route.ts    ← GET users
│   │   └── invoices/
│   │       └── route.ts    ← GET invoices
│   │
│   └── ai/                 ← Team 2's AI tool routes (shared by both frontends)
│       ├── draft-email/
│       │   └── route.ts    ← POST: generate email draft
│       ├── status-report/
│       │   └── route.ts    ← POST: generate status report
│       ├── smart-reply/
│       │   └── route.ts    ← POST: suggest reply to message
│       ├── summarize/
│       │   └── route.ts    ← POST: summarize query results
│       └── recommend/
│           └── route.ts    ← POST: suggest next actions
│
├── components/
│   ├── ai/                 ← Team 2's shared UI components
│   │   ├── EmailDrafter.tsx
│   │   ├── StatusReport.tsx
│   │   ├── SmartReply.tsx
│   │   ├── DataSummary.tsx
│   │   └── ActionRecommender.tsx
│   ├── manager/            ← Team 1's components
│   │   └── ...
│   └── employee/           ← Team 3's components
│       └── ...
│
├── lib/
│   ├── q360.ts             ← Q360 API client (shared — handles auth, requests)
│   ├── ai.ts               ← Claude API client (shared — handles prompts, responses)
│   └── types.ts            ← Shared TypeScript types for Q360 entities
│
└── page.tsx                ← Landing / role selector → redirects to (manager) or (employee)
```

### Naming Rules

| Rule | Convention | Example |
|------|-----------|---------|
| Route groups | `(role)` parentheses = no URL segment | `(manager)/dashboard` → `/dashboard` |
| API routes | kebab-case, noun-based | `/api/ai/draft-email` |
| Components | PascalCase | `EmailDrafter.tsx` |
| Lib files | camelCase | `q360.ts`, `ai.ts` |
| Q360 proxy routes | Plural nouns matching Q360 table names | `/api/q360/dispatches` (maps to `DISPATCH` table) |
| AI tool routes | Verb-noun describing the action | `/api/ai/draft-email`, `/api/ai/summarize` |

### Branch Strategy

| Branch | Team | Owns These Paths |
|--------|------|-----------------|
| `feature/1-dashboard` | Team 1 | `app/(manager)/**`, `components/manager/**` |
| `feature/2-utility-suite` | Team 2 | `app/api/ai/**`, `components/ai/**`, `lib/ai.ts` |
| `feature/3-workflow` | Team 3 | `app/(employee)/**`, `components/employee/**` |
| **Shared (all teams)** | — | `app/api/q360/**`, `lib/q360.ts`, `lib/types.ts` |

> **Conflict prevention:** Each team works in their own directories. Shared files (`lib/q360.ts`, `lib/types.ts`, `app/api/q360/`) should be set up early on `main` before branching, so teams add to them rather than creating competing versions.

---

## API Contract: Team 2's AI Tools

Each AI tool follows the same abstract pattern so Team 1 and Team 3 can consume them identically.

### Request Shape (All Tools)

```typescript
// POST /api/ai/<tool-name>
{
  entityType: "dispatch" | "project" | "customer" | "servicecontract" | "timebill",
  entityId: string,           // e.g. "D-00123" or "P-0042"
  intent: string,             // e.g. "status_update", "completion_notice", "escalation"
  context?: Record<string, unknown>, // additional data the caller wants included
  audience?: "manager" | "customer" | "technician" | "internal",
  tone?: "formal" | "friendly" | "urgent"
}
```

### Response Shape (All Tools)

```typescript
{
  success: boolean,
  result: {
    content: string,          // the generated text (email body, report, summary, etc.)
    subject?: string,         // for emails: suggested subject line
    actions?: string[],       // for recommender: list of suggested actions
    metadata: {
      model: string,          // which Claude model was used
      tokensUsed: number,
      entityType: string,
      entityId: string
    }
  }
}
```

This contract means Team 1 can call `POST /api/ai/draft-email` with `audience: "customer"` and get a formal client email, while Team 3 calls the same endpoint with `audience: "internal"` and gets a tech-friendly dispatch note — same tool, different context.
