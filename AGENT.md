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
| API Testing | Postman (collection file included in this repo) |
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
| Base URL | `http://rest.q360.online` |
| API Docs (live) | `http://rest.q360.online/APIDocumentation` (Beta) |
| Web Login User | `fshirley` / see `.env.local` |
| API User | `Q360API_UTAH` / see `.env.local` |
| Auth Type | HTTP Basic Auth (Base64 encoded) |
| Data | Synthetic test data only |

**Important:** Only `Q360API` type users can use Basic Auth for REST API calls. `fshirley` is a web/browser-only user. `Q360API_UTAH` is confirmed working as of 2026-03-23. Credentials are in `.env.local` — never commit them.

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
| **AI** | **Claude API — `claude-sonnet-4-6`** | Default for all AI tasks. Use `claude-opus-4-6` only for complex reasoning |
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
Q360 REST API          Claude API (Anthropic)
(sandbox)              (claude-sonnet-4-6)
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
| `Q360 v25.01.001.openapi.yaml` | OpenAPI spec — source of truth for Q360 API |
| `Q360 v25.01.001.postman_collection.json` | Postman collection for manual API testing |
| `Q360 API v25 - Getting-Started.pdf` | Official Q360 getting-started guide |
| `AGENT.md` | **This file** — full project context for AI assistants |
| `API_STRUCTURE.md` | Human-readable Q360 API reference (endpoints, schemas, entities) |
| `FEATURE_2_PLAN.md` | Full plan for Feature 2: Automated Utility Suite |
| `ENV_SETUP.md` | Local environment setup guide (updated as project evolves) |

---

## Rules for AI Assistants

1. **Credentials stay server-side.** All Q360 and Claude API calls happen inside Next.js API Routes. Never put secrets in client components or `use client` files.
2. **No hardcoded secrets.** All credentials go in `.env.local`. Always provide a `.env.example` with placeholder values.
3. **Docker-first.** The app must be runnable via `docker-compose up`. Never assume a specific Node version on the host machine.
4. **TypeScript everywhere.** All new files use `.ts` or `.tsx`. No plain JavaScript.
5. **Email is draft-only for now.** Feature 2 shows generated email text in the UI. Actual sending (Resend/SendGrid) is a future add-on — but structure the code so it's easy to plug in.
6. **Demo scope.** Prioritize a working, impressive demonstration over perfect production architecture. Keep it pragmatic.
7. **Feature branches.** Each team works in isolation on their own branch. Don't assume other teams' code exists when building a feature.
8. **AI model defaults.** Use `claude-sonnet-4-6` by default. Only escalate to `claude-opus-4-6` when deep reasoning is clearly needed.
