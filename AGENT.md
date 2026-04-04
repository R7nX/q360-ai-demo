# AGENT.md — Project Context for AI Assistants

> This file provides full context for any AI assistant (Claude Code, Copilot, etc.) working in this repository. Read this before doing anything in this project.

---

## What Is This Project?

We are building a **demo web application** that integrates **generative AI** directly into **Q360**, a field service management (FSM) platform developed by Solutions 360. The demo is being built by an unpaid internship team led by the user.

The goal is to show the Q360 sponsor company how AI can be embedded into their existing platform to reduce manual work, provide proactive insights, and automate repetitive workflows.

**This is a demo/prototype — not a production deployment.** The sandbox environment uses synthetic test data provided by the sponsor.

---

## Who Is Building This?

| Role | Details |
|------|---------|
| Team Leader | The user (communicates with team via Slack) |
| Team Split | 3 sub-teams, each owning one Core Feature |
| Stack | Next.js (strongly recommended, see below) + Claude API + Q360 REST API |
| API Testing | Postman / curl (collection artifact is optional and may not be committed) |
| Source Control | GitHub — one branch per feature team, merged for demo |

---

## What Is Q360?

Q360 is an ERP/FSM platform used by field service companies. It manages:
- **Service Calls / Dispatches** — the core entity; a service request assigned to a technician
- **Customers & Sites** — who the service is for and where
- **Projects** — larger multi-phase work engagements
- **Service Contracts** — agreements tied to customers
- **Technicians & Users** — CSRs, techs, salespersons
- **Time Bills** — labor time entries tied to dispatches
- **Machines / Equipment** — assets being serviced

The Q360 REST API allows CRUD operations on all of these entities. See `API_STRUCTURE.md` for full technical details.

---

## Sandbox Environment

| Item | Value |
|------|-------|
| Base URL | `https://rest.q360.online` |
| API Docs (live) | `https://rest.q360.online/APIDocumentation/` |
| Web Login User | `fshirley` / see `.env.local` |
| API User | `Q360API_UTAH` / see `.env.local` |
| Auth Type | HTTP Basic Auth (Base64 encoded) |
| Data | Synthetic test data only |

**Important:** Only `Q360API` type users can use Basic Auth for REST API calls. `fshirley` is a web/browser-session user (`/api/authenticate` + cookies), while `Q360API_UTAH` is for Basic Auth API calls. In the current sandbox, both users share the same password in `.env.local` (never commit credentials).

---

## Three Core Demo Features

The demo app is divided into three primary features, each owned by a separate team.

### Feature 1 — Intelligent Command Center (Home Page)
- Centralized dashboard summarizing all active modules
- AI analyzes project/dispatch health and suggests "Next Steps"
- NLP-weighted deadline prioritization for daily agenda

### Feature 2 — Automated Utility Suite (AI for Repetitive Tasks) ← THIS TEAM
- AI-powered Smart Drafting: auto-generate project status emails, client updates, service reports
- Scalable Automation: identify and automate other high-frequency manual Q360 tasks
- Target: embed AI into the actions users perform most often in Q360
- See `FEATURE_2_PLAN.md` for the full breakdown, research items, and demo plan

### Feature 3 — Dynamic Workflow Architect (AI Suggestion Engine)
- On app entry, AI generates structured workflow recommendations based on company data
- Produces diagrams + step-by-step task lists
- Suggests optimized team/resource assignments per project phase

---

## Backlog Features (Not In Demo Scope)
- Modular left-hand taskbar UI with collapsible menus
- Role-Based Access Control (RBAC) views
- AI-powered natural language search
- ERP data synthesis into reports/documents
- Automated meeting intelligence / report generation

---

## Recommended Tech Stack

> Framework is not finalized yet — Next.js is the strong recommendation. See research notes in `FEATURE_2_PLAN.md`.

| Layer | Recommendation | Rationale |
|-------|---------------|-----------|
| **Framework** | **Next.js (TypeScript)** | Handles frontend + backend in one repo; API Routes keep credentials server-side safely; natural Vercel deployment; largest ecosystem for React |
| **AI** | **Google Gemini — `gemini-2.0-flash`** (free tier) | Default for all AI tasks. Free API key at https://aistudio.google.com/apikey |
| **Containerization** | **Docker + docker-compose** | Consistent env across all 3 teams; no "works on my machine" issues; production-deployable from day one |
| **Deployment (target)** | **Vercel** | Free tier; zero-config Next.js deployment; instant preview URLs per branch |
| **Email — Phase 1** | **Draft only** (text in UI for user to copy) | Simplest path for demo; designed so Phase 2 slots in cleanly |
| **Email — Phase 2** | **Resend** | Modern, simple API; generous free tier; easy to add later |
| **Source control** | **GitHub** | Feature branches per team (`feature/1-dashboard`, `feature/2-utility-suite`, `feature/3-workflow`) |

---

## Architecture Overview

```
Browser (Next.js Frontend — React components)
         │
         │  (internal HTTP — same process)
         ▼
Next.js API Routes  ◄── ALL secrets live here (.env.local)
    │                        │
    ▼                        ▼
Q360 REST API          Gemini API (Google)
(sandbox)              (gemini-2.0-flash)
```

**Key rule:** Credentials and API keys never leave the server. The browser only talks to our own Next.js API routes.

---

## Project Timeline

| Milestone | Target Date |
|-----------|------------|
| Planning & documentation complete | Early April 2026 |
| Dev environment set up across all teams | Week of April 7 |
| Feature 2 core build (AI email drafting) | April 7–18 |
| Feature 2 polish + additional automations | April 18–25 |
| Full demo deployment + rehearsal | April 25–30 |
| **Live demo to sponsor** | **End of April 2026** |

---

## Repository File Index

| File | Purpose |
|------|---------|
| `Q360 v25.01.001.openapi.yaml` | Optional source artifact if exported into this repo |
| `Q360 v25.01.001.postman_collection.json` | Optional Postman artifact if exported into this repo |
| `Q360 API v25 - Getting-Started.pdf` | Optional reference artifact if checked into this repo |
| `AGENT.md` | **This file** — full project context for AI assistants |
| `API_STRUCTURE.md` | Human-readable Q360 API reference (endpoints, schemas, entities) |
| `FEATURE_TAB_MAPPING.md` | Maps Q360 tabs → teams, defines Next.js routes & file ownership |
| `PROJECT_MASTER_PLAN.md` | **Full project scaffolding** — file tree, gameplans, deliverables, n8n |
| `FEATURE_2_PLAN.md` | Full plan for Feature 2: Automated Utility Suite |
| `ENV_SETUP.md` | Local environment setup guide (updated as project evolves) |

---

## Shared Layer (Already Built — Use These, Don't Recreate)

The following shared files are already on `main`. **Import and use them directly.** Do not create duplicates or write raw `fetch()` calls to Q360/Gemini.

### `lib/q360.ts` — Q360 API Client

All Q360 data access goes through this module. Never put Q360 credentials in any other file.

```typescript
import { q360Query, getDispatches, getProjects, getCustomers, getContacts,
         getTimeBills, getServiceContracts, getSites, getUsers, getInvoices } from "@/lib/q360";

// Generic query (any table):
const { result, total, hasMore } = await q360Query<MyType>("TableName", {
  columns: ["COL1", "COL2"],
  filters: [{ field: "STATUS", op: "=", value: "OPEN" }],
  orderBy: [{ field: "DATE", dir: "DESC" }],
  limit: 50,
});

// Convenience functions (pre-configured columns, optional filters + limit):
const dispatches = await getDispatches([{ field: "STATUSCODE", op: "=", value: "OPEN" }]);
const projects   = await getProjects();
```

### `lib/ai.ts` — Gemini AI Client

All AI text generation goes through `generateText()`. Uses `gemini-2.0-flash` (free tier) by default.

```typescript
import { generateText } from "@/lib/ai";

const { text, model } = await generateText("Summarize this dispatch...", {
  systemInstruction: "You are a field service AI assistant.",
  temperature: 0.5,
  maxTokens: 1024,
});
```

### `lib/types.ts` — Shared TypeScript Types

All Q360 entity interfaces and the AI tool request/response contract:

```typescript
import type { Dispatch, Customer, Project, Site, TimeBill, ServiceContract,
              User, Invoice, Contact } from "@/lib/types";
import type { AiToolRequest, AiToolResponse, EntityType, Audience, Tone } from "@/lib/types";
```

### `lib/constants.ts` — Routes & API Endpoints

```typescript
import { ROUTES, API, DISPATCH_STATUSES, PROJECT_STATUSES } from "@/lib/constants";

// Page routes:  ROUTES.MANAGER_DASHBOARD, ROUTES.EMPLOYEE_HOME, etc.
// API routes:   API.Q360_DISPATCHES, API.AI_DRAFT_EMAIL, etc.
```

### Q360 Proxy API Routes (9 routes)

All available at `GET /api/q360/<entity>` with optional query params for filtering:

| Endpoint | Query Params |
|----------|-------------|
| `/api/q360/dispatches` | `?status=`, `?tech=`, `?priority=`, `?limit=` |
| `/api/q360/projects` | `?status=`, `?leader=`, `?limit=` |
| `/api/q360/customers` | `?status=`, `?salesrep=`, `?limit=` |
| `/api/q360/contacts` | `?customer=`, `?limit=` |
| `/api/q360/timebills` | `?user=`, `?dispatch=`, `?project=`, `?limit=` |
| `/api/q360/service-contracts` | `?status=`, `?customer=`, `?limit=` |
| `/api/q360/sites` | `?customer=`, `?zone=`, `?limit=` |
| `/api/q360/users` | `?type=`, `?branch=`, `?active=`, `?limit=` |
| `/api/q360/invoices` | `?customer=`, `?type=`, `?limit=` |

### UI Components (`components/ui/`)

Basic Tailwind-styled primitives — use these for consistent styling:

| Component | Import | Key Props |
|-----------|--------|-----------|
| `Button` | `@/components/ui/Button` | `variant`: primary/secondary/danger/ghost, `size`: sm/md/lg |
| `Card`, `CardHeader`, `CardTitle` | `@/components/ui/Card` | `padding`: sm/md/lg |
| `Badge` | `@/components/ui/Badge` | `variant`: default/success/warning/danger/info |
| `Spinner` | `@/components/ui/Spinner` | `size`: sm/md/lg |
| `Input` | `@/components/ui/Input` | `label`, `error` |

### File Ownership Rules

Each team works **only** in their designated directories. See `PROJECT_MASTER_PLAN.md` for full details.

| Team | Owns These Paths |
|------|-----------------|
| Team 1 | `app/(manager)/**`, `components/manager/**` |
| Team 2 | `app/api/ai/**`, `components/ai/**`, `lib/ai.ts`, `app/api/n8n/**` |
| Team 3 | `app/(employee)/**`, `components/employee/**` |
| Shared | `lib/q360.ts`, `lib/types.ts`, `lib/constants.ts`, `app/api/q360/**`, `components/ui/**` |

> If you need to modify a shared file, coordinate with the team lead first.

---

## Rules for AI Assistants

1. **Credentials stay server-side.** All Q360 and Claude API calls happen inside Next.js API Routes. Never put secrets in client components or `use client` files.
2. **No hardcoded secrets.** All credentials go in `.env.local`. Always provide a `.env.example` with placeholder values.
3. **Docker-first.** The app must be runnable via `docker-compose up`. Never assume a specific Node version on the host machine.
4. **TypeScript everywhere.** All new files use `.ts` or `.tsx`. No plain JavaScript.
5. **Email is draft-only for now.** Feature 2 shows generated email text in the UI. Actual sending (Resend/SendGrid) is a future add-on — but structure the code so it's easy to plug in.
6. **Demo scope.** Prioritize a working, impressive demonstration over perfect production architecture. Keep it pragmatic.
7. **Feature branches.** Each team works in isolation on their own branch. Don't assume other teams' code exists when building a feature.
8. **AI model defaults.** Use `gemini-2.0-flash` by default. This is the free tier model — no billing needed.
9. **Use the shared layer.** Import from `@/lib/q360`, `@/lib/ai`, `@/lib/types`, `@/lib/constants`. Never write raw `fetch()` calls to Q360 or Gemini directly — always use the shared clients.
10. **Read `PROJECT_MASTER_PLAN.md`** before starting any feature work — it defines exact file paths, naming conventions, and step-by-step gameplans for each team.
