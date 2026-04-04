# PROJECT MASTER PLAN — Q360 AI Demo

> **The single source of truth for all three teams.**
> Every file name, every route, every component — defined here so nothing collides.
>
> **Status note:** This is a target-state implementation plan. Some routes/files below are planned and may not yet exist on `main`.
> **Last updated:** 2026-04-04
> **Demo deadline:** End of April 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack (Finalized)](#2-tech-stack-finalized)
3. [Environment Setup — Step by Step](#3-environment-setup--step-by-step)
4. [Repository Structure — Complete File Tree](#4-repository-structure--complete-file-tree)
5. [Shared Layer (All Teams)](#5-shared-layer-all-teams)
6. [Team 1 — Manager Command Center](#6-team-1--manager-command-center)
7. [Team 2 — AI Utility Suite (Shared Tools)](#7-team-2--ai-utility-suite-shared-tools)
8. [Team 3 — Employee Workflow Hub](#8-team-3--employee-workflow-hub)
9. [n8n Automation Workflows](#9-n8n-automation-workflows)
10. [Branch Strategy & Merge Rules](#10-branch-strategy--merge-rules)
11. [Deliverable Checklist Per Team](#11-deliverable-checklist-per-team)
12. [Timeline & Milestones](#12-timeline--milestones)

---

## 1. Project Overview

We are building a **demo web app** that embeds AI into **Q360** (a field service management ERP). The app has two dashboards (manager vs employee) powered by shared AI tools.

```
┌─────────────────────────────────────────────────────┐
│                    Landing Page                      │
│              "I am a..." role selector               │
│          [Manager/Dispatcher]  [Technician/CSR]      │
└──────────┬──────────────────────────┬────────────────┘
           │                          │
           ▼                          ▼
┌─────────────────────┐   ┌─────────────────────────┐
│  TEAM 1 — Manager   │   │  TEAM 3 — Employee      │
│  Command Center     │   │  Workflow Hub            │
│  /dashboard         │   │  /home                   │
│  /projects          │   │  /my-dispatches          │
│  /service           │   │  /my-tasks               │
│  /sales             │   │  /time                   │
│  /accounting        │   │  /schedule               │
│  /reports           │   │  /workflows              │
└────────┬────────────┘   └───────────┬───────────────┘
         │                            │
         └──────────┬─────────────────┘
                    ▼
         ┌─────────────────────┐
         │  TEAM 2 — AI Tools  │
         │  /api/ai/*           │
         │  components/ai/*     │
         │  (consumed by both)  │
         └──────────┬──────────┘
                    │
          ┌─────────┴──────────┐
          ▼                    ▼
   ┌────────────┐     ┌──────────────┐
   │ Gemini API │     │ Q360 REST API│
   │ (free tier)│     │ (sandbox)    │
   └────────────┘     └──────────────┘
```

**Key concept:** Team 2 builds **abstract, reusable AI tools**. Teams 1 and 3 **consume** those tools and can request refinements. Team 2 tools work standalone and can also be embedded into either dashboard.

---

## 2. Tech Stack (Finalized)

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | **Next.js 16 (TypeScript)** | Frontend + backend in one repo; API Routes keep secrets server-side |
| **Styling** | **Tailwind CSS 4** | Already installed; utility-first, fast prototyping |
| **AI Provider** | **Google Gemini (free tier)** | Free API access; `gemini-2.5-flash` for all tools |
| **AI SDK** | **`@google/genai`** | Official Google AI JS SDK (new v1.x API) |
| **Q360 API** | **REST (Basic Auth)** | Sandbox at `https://rest.q360.online` |
| **Automation** | **n8n (self-hosted, homelab)** | Visual workflow builder; connects Q360 events → AI → actions; accessible via Cloudflare tunnel |
| **Database (dev)** | **SQLite via `better-sqlite3`** | Already set up; mock data for offline dev |
| **Deployment** | **Vercel** (Next.js) + **n8n homelab** | Free tier for demo; n8n already running |

### Why Gemini Free Tier?

- `gemini-2.5-flash` — fast, free, generous rate limits (15 RPM / 1M TPM)
- No credit card required to get started
- Good enough for demo-quality text generation (emails, summaries, recommendations)
- If we hit rate limits during the demo, we can upgrade to the paid tier ($0 → minimal cost)

### Gemini API Quick Start

```bash
# Get your free API key at: https://aistudio.google.com/apikey
# Add to .env.local:
GEMINI_API_KEY=your_key_here
```

```typescript
// lib/agentClient.ts — usage example
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: [{ role: "user", parts: [{ text: "Summarize this dispatch..." }] }],
});
const text = response.text ?? "";
```

---

## 3. Environment Setup — Step by Step

Every teammate follows these steps **exactly**. If something doesn't work, ask in Slack before improvising.

### 3.1 Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20 LTS or 22 LTS | https://nodejs.org |
| Git | Latest | https://git-scm.com |
| VS Code | Latest | Recommended editor |

### 3.2 Clone & Install

```bash
git clone https://github.com/<org>/q360-ai-demo.git
cd q360-ai-demo
npm install
```

### 3.3 Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

```env
# .env.local — NEVER commit this file

# Q360 Sandbox API
Q360_BASE_URL=https://rest.q360.online
Q360_API_USERNAME=Q360API_UTAH
Q360_API_PASSWORD=<ask team lead>

# Web sandbox login (browser-session endpoints like /api/authenticate, /api/Toolbar)
# Use userid=fshirley and the same password as Q360_API_PASSWORD
# (current sandbox convention)

# Google Gemini (free tier)
GEMINI_API_KEY=<get yours at https://aistudio.google.com/apikey>

# Mock data flag — "true" for offline dev, "false" for live Q360 sandbox
USE_MOCK_DATA=true

# Database (SQLite for local dev)
DATABASE_URL=file:./mock.db

# n8n (hosted on homelab, accessible via Cloudflare tunnel)
N8N_BASE_URL=<ask team lead for Cloudflare tunnel URL>
```

### 3.4 Run the App

```bash
# Seed mock database (first time only)
npm run seed

# Start dev server
npm run dev
# → http://localhost:3000
```

### 3.5 Accessing n8n

n8n is already running on the team lead's homelab and is accessible to everyone via a Cloudflare tunnel. No local setup or Docker required.

Ask the team lead for the n8n URL and set it as `N8N_BASE_URL` in your `.env.local`.

To import workflows, open the n8n URL in your browser and import the JSON files from `n8n/workflows/`.

---

## 4. Repository Structure — Complete File Tree

> **This is the target contract.** Every team creates files ONLY in their designated paths once shared setup is complete.
> Files marked with `[SHARED]` are set up on `main` before branching — teams ADD to them, never replace.

```
q360-ai-demo/
│
├── .env.example                          # [SHARED] Env template (committed)
├── .env.local                            # [GITIGNORED] Actual secrets
├── .gitignore
├── package.json                          # [SHARED] Dependencies
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts                    # [SHARED] If needed
├── postcss.config.mjs
├── docker-compose.yml                    # [SHARED] Next.js + n8n
├── Dockerfile                            # [SHARED] Next.js container
├── mock.db                               # [GITIGNORED] Local SQLite
│
├── PROJECT_MASTER_PLAN.md                # This file
├── AGENT.md                              # AI assistant context
├── API_STRUCTURE.md                      # Q360 API reference
├── FEATURE_TAB_MAPPING.md                # Tab ownership map
│
├── scripts/
│   └── seed-mock-db.ts                   # [SHARED] Mock data seeder
│
├── public/
│   ├── logo.svg                          # [SHARED]
│   └── icons/                            # [SHARED]
│
├── app/
│   ├── layout.tsx                        # [SHARED] Root layout (html, body, fonts, global providers)
│   ├── page.tsx                          # [SHARED] Landing page — role selector
│   ├── globals.css                       # [SHARED] Global styles + Tailwind
│   │
│   ├── (manager)/                        # ═══ TEAM 1 ONLY ═══
│   │   ├── layout.tsx                    # Manager shell: sidebar nav, header, breadcrumbs
│   │   ├── dashboard/
│   │   │   └── page.tsx                  # Main manager homepage / command center
│   │   ├── projects/
│   │   │   ├── page.tsx                  # Project health overview (list + cards)
│   │   │   └── [projectNo]/
│   │   │       └── page.tsx              # Single project detail
│   │   ├── service/
│   │   │   ├── page.tsx                  # Dispatch overview, queue depths, SLA
│   │   │   └── [dispatchNo]/
│   │   │       └── page.tsx              # Single dispatch detail
│   │   ├── sales/
│   │   │   └── page.tsx                  # Pipeline, forecast, funnel
│   │   ├── accounting/
│   │   │   └── page.tsx                  # AR/AP aging, revenue summary
│   │   └── reports/
│   │       └── page.tsx                  # Live Data report viewer
│   │
│   ├── (employee)/                       # ═══ TEAM 3 ONLY ═══
│   │   ├── layout.tsx                    # Employee shell: simpler sidebar
│   │   ├── home/
│   │   │   └── page.tsx                  # Daily briefing / workflow hub
│   │   ├── my-dispatches/
│   │   │   ├── page.tsx                  # Assigned service calls
│   │   │   └── [dispatchNo]/
│   │   │       └── page.tsx              # Single dispatch (tech view)
│   │   ├── my-tasks/
│   │   │   └── page.tsx                  # Tasks + to-do list
│   │   ├── time/
│   │   │   └── page.tsx                  # Time bill entry + log
│   │   ├── schedule/
│   │   │   └── page.tsx                  # HR schedule, time-off requests
│   │   └── workflows/
│   │       └── page.tsx                  # AI-generated workflow guides
│   │
│   └── api/                              # ═══ BACKEND ROUTES ═══
│       │
│       ├── q360/                         # [SHARED] Q360 proxy routes
│       │   ├── dispatches/
│       │   │   └── route.ts              # GET (list), POST (create)
│       │   ├── dispatches/[dispatchNo]/
│       │   │   └── route.ts              # GET (single), PATCH (update)
│       │   ├── projects/
│       │   │   └── route.ts              # GET (list), POST (create)
│       │   ├── projects/[projectNo]/
│       │   │   └── route.ts              # GET (single), PATCH (update)
│       │   ├── customers/
│       │   │   └── route.ts              # GET (list)
│       │   ├── customers/[customerNo]/
│       │   │   └── route.ts              # GET (single)
│       │   ├── contacts/
│       │   │   └── route.ts              # GET (list)
│       │   ├── timebills/
│       │   │   └── route.ts              # GET (list), POST (create)
│       │   ├── service-contracts/
│       │   │   └── route.ts              # GET (list)
│       │   ├── sites/
│       │   │   └── route.ts              # GET (list)
│       │   ├── users/
│       │   │   └── route.ts              # GET (list)
│       │   ├── invoices/
│       │   │   └── route.ts              # GET (list)
│       │   └── machines/
│       │       └── route.ts              # GET (list)
│       │
│       ├── ai/                           # ═══ TEAM 2 ONLY ═══
│       │   ├── draft-email/
│       │   │   └── route.ts              # POST: generate email draft
│       │   ├── status-report/
│       │   │   └── route.ts              # POST: generate status report
│       │   ├── smart-reply/
│       │   │   └── route.ts              # POST: suggest reply to message
│       │   ├── summarize/
│       │   │   └── route.ts              # POST: summarize Q360 data
│       │   └── recommend/
│       │       └── route.ts              # POST: suggest next actions
│       │
│       └── n8n/                          # ═══ TEAM 2 ONLY ═══
│           └── webhook/
│               └── route.ts              # POST: receive n8n webhook callbacks
│
├── components/
│   ├── ui/                               # [SHARED] Generic UI primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Spinner.tsx
│   │   ├── Table.tsx
│   │   └── Sidebar.tsx
│   │
│   ├── ai/                              # ═══ TEAM 2 ONLY ═══
│   │   ├── EmailDrafter.tsx              # Email drafting UI (entity selector + generated output)
│   │   ├── StatusReport.tsx              # Status report generator UI
│   │   ├── SmartReply.tsx                # Reply suggestion UI
│   │   ├── DataSummary.tsx               # Data summarizer UI
│   │   ├── ActionRecommender.tsx         # Action recommendation UI
│   │   └── AiToolWrapper.tsx             # Shared wrapper: loading, error, copy-to-clipboard
│   │
│   ├── manager/                          # ═══ TEAM 1 ONLY ═══
│   │   ├── ManagerSidebar.tsx            # Left nav for manager layout
│   │   ├── ManagerHeader.tsx             # Top bar with user info
│   │   ├── ProjectCard.tsx               # Project health card
│   │   ├── DispatchQueue.tsx             # Dispatch queue widget
│   │   ├── SalesChart.tsx                # Sales pipeline chart
│   │   ├── AccountingSummary.tsx         # AR/AP summary widget
│   │   ├── KpiCard.tsx                   # Reusable KPI metric card
│   │   └── InsightPanel.tsx              # AI insights panel (uses Team 2 components)
│   │
│   └── employee/                         # ═══ TEAM 3 ONLY ═══
│       ├── EmployeeSidebar.tsx           # Left nav for employee layout
│       ├── EmployeeHeader.tsx            # Top bar with user info
│       ├── DispatchCard.tsx              # Assigned dispatch card
│       ├── TaskList.tsx                  # Task/to-do list
│       ├── TimeEntry.tsx                 # Time bill entry form
│       ├── ScheduleView.tsx             # Schedule calendar view
│       ├── WorkflowGuide.tsx            # AI workflow step-by-step
│       └── DailyBriefing.tsx            # AI daily summary (uses Team 2 components)
│
├── lib/
│   ├── q360.ts                          # [SHARED] Q360 API client
│   ├── ai.ts                            # [SHARED — owned by Team 2] Gemini API client
│   ├── types.ts                         # [SHARED] TypeScript types for Q360 entities
│   ├── constants.ts                     # [SHARED] App-wide constants (routes, labels, etc.)
│   └── utils.ts                         # [SHARED] Utility functions (date formatting, etc.)
│
└── n8n/                                 # ═══ TEAM 2 ONLY ═══
    ├── README.md                        # n8n setup instructions
    └── workflows/                       # Exported n8n workflow JSON files
        ├── dispatch-created-notify.json
        ├── project-overdue-alert.json
        └── daily-digest-email.json
```

---

## 5. Shared Layer (All Teams)

These files live on `main` and are set up **before** teams branch off. All teams can add to them (e.g., adding a new type to `types.ts`) but should coordinate via Slack to avoid merge conflicts.

### 5.1 `lib/q360.ts` — Q360 API Client

This is the **single** module for all Q360 API calls. Every team uses it — nobody writes raw `fetch()` calls to Q360.

```typescript
// lib/q360.ts

const BASE_URL = process.env.Q360_BASE_URL!;
const USERNAME = process.env.Q360_API_USERNAME!;
const PASSWORD = process.env.Q360_API_PASSWORD!;

const AUTH_HEADER = `Basic ${Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64")}`;

// --------------- Generic Query ---------------

export async function q360Query<T = Record<string, unknown>>(
  tableName: string,
  options: {
    columns?: string[];
    filters?: { field: string; op: string; value: string }[];
    orderBy?: { field: string; dir: "ASC" | "DESC" }[];
    offset?: number;
    limit?: number;
  } = {}
): Promise<{ result: T[]; total: number; hasMore: boolean }> {
  const body = new FormData();
  body.append("jsonRequest", JSON.stringify({
    columns: options.columns ?? [],
    filters: options.filters ?? [],
    orderBy: options.orderBy ?? [],
    offset: options.offset ?? 0,
    limit: options.limit ?? 100,
  }));

  const res = await fetch(`${BASE_URL}/api/Record/${tableName}?_a=list`, {
    method: "POST",
    headers: { Authorization: AUTH_HEADER },
    body,
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Q360 query failed");

  return {
    result: json.payload.result as T[],
    total: json.payload.total ?? 0,
    hasMore: json.outvars?.hasmore === "Y",
  };
}

// --------------- Convenience Functions ---------------

export async function getDispatches(filters?: { field: string; op: string; value: string }[]) {
  return q360Query("Dispatch", {
    columns: ["DISPATCHNO", "CUSTOMERNO", "SITENO", "STATUSCODE", "PROBLEM",
              "TECHASSIGNED", "CALLOPENDATE", "PRIORITY", "CALLTYPE"],
    filters,
    orderBy: [{ field: "CALLOPENDATE", dir: "DESC" }],
  });
}

export async function getProjects(filters?: { field: string; op: string; value: string }[]) {
  return q360Query("Projects", {
    columns: ["PROJECTNO", "TITLE", "CUSTOMERNO", "STATUSCODE",
              "PERCENTCOMPLETE", "STARTDATE", "ENDDATE", "PROJECTLEADER"],
    filters,
    orderBy: [{ field: "STARTDATE", dir: "DESC" }],
  });
}

export async function getCustomers(filters?: { field: string; op: string; value: string }[]) {
  return q360Query("Customer", {
    columns: ["CUSTOMERNO", "COMPANY", "PHONE", "CITY", "STATE", "STATUS",
              "SALESREP", "BALANCE", "YTDSALES"],
    filters,
  });
}

export async function getTimeBills(filters?: { field: string; op: string; value: string }[]) {
  return q360Query("Timebill", {
    columns: ["TIMEBILLNO", "USERID", "DISPATCHNO", "CUSTOMERNO",
              "PROJECTNO", "DATE", "ENDTIME", "TIMEBILLED", "CATEGORY"],
    filters,
  });
}

export async function getServiceContracts(filters?: { field: string; op: string; value: string }[]) {
  return q360Query("Servicecontract", {
    columns: ["CONTRACTNO", "TITLE", "CUSTOMERNO", "STARTDATE", "ENDDATE",
              "RENEWALDATE", "STATUSCODE", "MONTHLYTOTAL"],
    filters,
  });
}

export async function getSites(filters?: { field: string; op: string; value: string }[]) {
  return q360Query("Site", {
    columns: ["SITENO", "CUSTOMERNO", "SITENAME", "ADDRESS", "CITY",
              "STATE", "ZIP", "ZONE", "STATUS"],
    filters,
  });
}

export async function getUsers(filters?: { field: string; op: string; value: string }[]) {
  return q360Query("Userid", {
    columns: ["USERID", "FULLNAME", "EMAIL", "TYPE", "BRANCH",
              "DEPARTMENT", "ACTIVEFLAG"],
    filters,
  });
}

export async function getInvoices(filters?: { field: string; op: string; value: string }[]) {
  return q360Query("Invoice", {
    columns: ["INVOICENO", "CUSTOMERNO", "INVOICEDATE", "DUEDATE",
              "INVAMOUNT", "BALANCE", "INVOICETYPE"],
    filters,
  });
}
```

### 5.2 `lib/agentClient.ts` — Gemini AI Client

Owned by Team 2, used by all teams. Provides `generateJSON()` (non-streaming) and `generateStream()` (streaming).

> **Note:** Uses `@google/genai` (v1.x, new SDK) — NOT the old `@google/generative-ai`. The API shape is different; do not copy examples from the old SDK docs.

```typescript
// lib/agentClient.ts

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODEL = "gemini-2.5-flash";

// Non-streaming — returns full text (use for JSON responses, summaries)
export async function generateJSON(
  systemPrompt: string,
  userPrompt: string,
  maxOutputTokens = 3000
): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    config: { systemInstruction: systemPrompt, maxOutputTokens },
  });
  return response.text ?? "";
}

// Streaming — returns a ReadableStream<Uint8Array> (use for email drafts, long text)
export async function generateStream(
  systemPrompt: string,
  userPrompt: string
): Promise<ReadableStream<Uint8Array>> {
  const response = await ai.models.generateContentStream({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    config: { systemInstruction: systemPrompt },
  });

  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        const text = chunk.text ?? "";
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });
}
```

### 5.3 `lib/types.ts` — Shared TypeScript Types

```typescript
// lib/types.ts

// ──── Q360 Entities ────

export interface Dispatch {
  dispatchno: string;
  customerno: string;
  siteno: string;
  machineno?: string;
  servicecontractno?: string;
  projectno?: string;
  techassigned: string;
  techassigned2?: string;
  statuscode: string;
  calltype: string;
  problemcode: string;
  problem: string;
  solution?: string;
  callopendate: string;
  callstartdate?: string;
  closedate?: string;
  priority: number;
  branch: string;
  caller: string;
  calleremail?: string;
  csr?: string;
}

export interface Customer {
  customerno: string;
  company: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  zip?: string;
  salesrep?: string;
  status: string;
  balance?: number;
  ytdsales?: number;
}

export interface Site {
  siteno: string;
  customerno: string;
  sitename: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  zone?: string;
  status: string;
}

export interface Project {
  projectno: string;
  title: string;
  customerno: string;
  siteno?: string;
  projectleader?: string;
  statuscode: string;
  startdate?: string;
  enddate?: string;
  percentcomplete?: number;
  hoursbudget?: number;
  revenuebudget?: number;
}

export interface TimeBill {
  timebillno: string;
  userid: string;
  dispatchno?: string;
  customerno?: string;
  projectno?: string;
  date: string;
  endtime?: string;
  timebilled: number;
  rate?: number;
  category: string;
}

export interface ServiceContract {
  contractno: string;
  title: string;
  customerno: string;
  startdate: string;
  enddate: string;
  renewaldate?: string;
  statuscode: string;
  monthlytotal?: number;
  total?: number;
}

export interface User {
  userid: string;
  fullname: string;
  email?: string;
  type: string;
  branch?: string;
  department?: string;
  activeflag: string;
}

export interface Invoice {
  invoiceno: string;
  customerno: string;
  invoicedate: string;
  duedate?: string;
  invamount: number;
  balance: number;
  invoicetype?: string;
}

// ──── AI Tool API Contract (Team 2) ────

export type EntityType = "dispatch" | "project" | "customer" | "servicecontract" | "timebill";
export type Audience = "manager" | "customer" | "technician" | "internal";
export type Tone = "formal" | "friendly" | "urgent";

export interface AiToolRequest {
  entityType: EntityType;
  entityId: string;
  intent: string;
  context?: Record<string, unknown>;
  audience?: Audience;
  tone?: Tone;
}

export interface AiToolResponse {
  success: boolean;
  result: {
    content: string;
    subject?: string;
    actions?: string[];
    metadata: {
      model: string;
      entityType: string;
      entityId: string;
    };
  };
  error?: string;
}
```

### 5.4 `lib/constants.ts` — Shared Constants

```typescript
// lib/constants.ts

// Route paths — use these instead of hardcoded strings
export const ROUTES = {
  HOME: "/",
  // Manager (Team 1)
  MANAGER_DASHBOARD: "/dashboard",
  MANAGER_PROJECTS: "/projects",
  MANAGER_SERVICE: "/service",
  MANAGER_SALES: "/sales",
  MANAGER_ACCOUNTING: "/accounting",
  MANAGER_REPORTS: "/reports",
  // Employee (Team 3)
  EMPLOYEE_HOME: "/home",
  EMPLOYEE_DISPATCHES: "/my-dispatches",
  EMPLOYEE_TASKS: "/my-tasks",
  EMPLOYEE_TIME: "/time",
  EMPLOYEE_SCHEDULE: "/schedule",
  EMPLOYEE_WORKFLOWS: "/workflows",
} as const;

// API endpoints — internal Next.js routes
export const API = {
  // Q360 proxy
  Q360_DISPATCHES: "/api/q360/dispatches",
  Q360_PROJECTS: "/api/q360/projects",
  Q360_CUSTOMERS: "/api/q360/customers",
  Q360_CONTACTS: "/api/q360/contacts",
  Q360_TIMEBILLS: "/api/q360/timebills",
  Q360_SERVICE_CONTRACTS: "/api/q360/service-contracts",
  Q360_SITES: "/api/q360/sites",
  Q360_USERS: "/api/q360/users",
  Q360_INVOICES: "/api/q360/invoices",
  Q360_MACHINES: "/api/q360/machines",
  // AI tools (Team 2)
  AI_DRAFT_EMAIL: "/api/ai/draft-email",
  AI_STATUS_REPORT: "/api/ai/status-report",
  AI_SMART_REPLY: "/api/ai/smart-reply",
  AI_SUMMARIZE: "/api/ai/summarize",
  AI_RECOMMEND: "/api/ai/recommend",
  // n8n webhook
  N8N_WEBHOOK: "/api/n8n/webhook",
} as const;

// Status codes used across Q360
export const DISPATCH_STATUSES = ["OPEN", "IN PROGRESS", "SCHEDULED", "CLOSED", "CANCELLED"] as const;
export const PROJECT_STATUSES = ["ACTIVE", "ON HOLD", "COMPLETED", "CANCELLED"] as const;
```

---

## 6. Team 1 — Manager Command Center

### What You're Building

A dashboard for **managers, dispatchers, PMs, and finance staff** — people with high authority who need a bird's-eye view across projects, service calls, sales, and accounting.

### Your Q360 Data Sources

| Data | Q360 Table | What You Show |
|------|-----------|---------------|
| Project health | `PROJECTS` | % complete, overdue, budget vs actual |
| Dispatch overview | `DISPATCH` | Open calls, SLA breaches, queue depths |
| Sales pipeline | (mock — `QUOTE`/`FUNNELOPPORITEM` not accessible to API user) | Funnel, forecast |
| AR/AP | `INVOICE` | Aging, outstanding balances |
| Labor utilization | `TIMEBILL` | Hours vs budget across projects |
| Contract renewals | `SERVICECONTRACT` | Expiring contracts list |
| Customer health | `CUSTOMER` | YTD sales, balance |

### Step-by-Step Gameplan

#### Step 1: Set Up Manager Layout (Day 1)

Create `app/(manager)/layout.tsx` — the shell that wraps all manager pages.

```
┌─────────────────────────────────────────────┐
│  [Logo]  Q360 AI Command Center    [User]   │  ← ManagerHeader.tsx
├──────┬──────────────────────────────────────┤
│      │                                      │
│  📊  │                                      │
│ Dash │       (page content renders here)    │
│      │                                      │
│  📋  │                                      │
│ Proj │                                      │
│      │                                      │
│  🔧  │                                      │
│ Svc  │                                      │
│      │                                      │
│  💰  │                                      │
│ Sales│                                      │
│      │                                      │
│  📒  │                                      │
│ Acct │                                      │
│      │                                      │
│  📈  │                                      │
│ Rpts │                                      │
│      │                                      │
├──────┴──────────────────────────────────────┤
│           (footer / status bar)             │
└─────────────────────────────────────────────┘
```

**Files to create:**
- `app/(manager)/layout.tsx`
- `components/manager/ManagerSidebar.tsx`
- `components/manager/ManagerHeader.tsx`

#### Step 2: Build the Dashboard Page (Days 2-3)

`app/(manager)/dashboard/page.tsx` — the main command center.

**Widgets to build (each is a component):**

| Widget | Component | Data Source | AI Integration |
|--------|-----------|-------------|----------------|
| Open Dispatches | `DispatchQueue.tsx` | `GET /api/q360/dispatches` | Team 2's `summarize` tool |
| Project Health | `ProjectCard.tsx` | `GET /api/q360/projects` | Team 2's `status-report` tool |
| KPI Cards | `KpiCard.tsx` | Multiple endpoints | None (pure data) |
| AI Insights | `InsightPanel.tsx` | Team 2's `/api/ai/recommend` | Direct consumer |
| Sales Overview | `SalesChart.tsx` | Mock data or `/api/q360/invoices` | None |
| AR/AP Summary | `AccountingSummary.tsx` | `/api/q360/invoices` | None |

**How to fetch data** (server component example):

```typescript
// app/(manager)/dashboard/page.tsx
import { API } from "@/lib/constants";

export default async function ManagerDashboard() {
  const [dispatches, projects] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${API.Q360_DISPATCHES}`).then(r => r.json()),
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${API.Q360_PROJECTS}`).then(r => r.json()),
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
      {/* Widgets here */}
    </div>
  );
}
```

#### Step 3: Build Sub-Pages (Days 4-6)

| Page | Route | What It Shows |
|------|-------|---------------|
| Projects | `/projects` | Filterable project list with health indicators |
| Project Detail | `/projects/[projectNo]` | Single project: tasks, team, budget, AI status report |
| Service | `/service` | Dispatch queue with filters (status, priority, tech) |
| Dispatch Detail | `/service/[dispatchNo]` | Full dispatch: problem, solution, time bills, AI email drafter |
| Sales | `/sales` | Pipeline chart, quote list (mock if API restricted) |
| Accounting | `/accounting` | AR aging table, invoice list, revenue chart |
| Reports | `/reports` | Embed Live Data report viewer (stretch goal) |

#### Step 4: Integrate Team 2 AI Tools (Days 7-8)

Import Team 2's components and wire them into your pages:

```typescript
// In a dispatch detail page:
import { EmailDrafter } from "@/components/ai/EmailDrafter";
import { ActionRecommender } from "@/components/ai/ActionRecommender";

// Use with manager-specific defaults:
<EmailDrafter
  entityType="dispatch"
  entityId={dispatchNo}
  audience="customer"      // managers email clients
  tone="formal"
/>

<ActionRecommender
  entityType="project"
  entityId={projectNo}
/>
```

### Team 1 Files Checklist

```
[ ] app/(manager)/layout.tsx
[ ] app/(manager)/dashboard/page.tsx
[ ] app/(manager)/projects/page.tsx
[ ] app/(manager)/projects/[projectNo]/page.tsx
[ ] app/(manager)/service/page.tsx
[ ] app/(manager)/service/[dispatchNo]/page.tsx
[ ] app/(manager)/sales/page.tsx
[ ] app/(manager)/accounting/page.tsx
[ ] app/(manager)/reports/page.tsx
[ ] components/manager/ManagerSidebar.tsx
[ ] components/manager/ManagerHeader.tsx
[ ] components/manager/ProjectCard.tsx
[ ] components/manager/DispatchQueue.tsx
[ ] components/manager/SalesChart.tsx
[ ] components/manager/AccountingSummary.tsx
[ ] components/manager/KpiCard.tsx
[ ] components/manager/InsightPanel.tsx
```

---

## 7. Team 2 — AI Utility Suite (Shared Tools)

### What You're Building

**Abstract, reusable AI tools** that both Team 1 and Team 3 consume. Each tool:
1. Has a **Next.js API route** (`/api/ai/<tool>`) that talks to Gemini
2. Has a **React component** (`components/ai/<Tool>.tsx`) that provides the UI
3. Accepts parameters (`audience`, `tone`, `entityType`) so the same tool produces different output depending on who calls it

### Design Philosophy

```
                        ABSTRACT (Team 2 builds this)
                        ┌─────────────────────────┐
                        │  /api/ai/draft-email     │
                        │                          │
  Team 1 calls with:    │  Takes: entityType,      │    Team 3 calls with:
  audience="customer"   │  entityId, intent,       │    audience="internal"
  tone="formal"     ──▶ │  audience, tone          │ ◀── tone="friendly"
                        │                          │
                        │  Returns: generated text │
                        └─────────────────────────┘
                                    │
                 ┌──────────────────┴──────────────────┐
                 ▼                                     ▼
    "Dear Mr. Smith, I'm writing          "Hey team, dispatch D-0042
     to update you on project              is done — replaced the
     P-0042..."                            power supply unit."
```

### Step-by-Step Gameplan

#### Step 1: Install Gemini SDK & Set Up AI Client (Day 1)

```bash
npm install @google/genai
```

Create `lib/agentClient.ts` (see Section 5.2 above).

#### Step 2: Build the 5 AI API Routes (Days 2-4)

Each route follows the **same pattern**:

```typescript
// app/api/ai/draft-email/route.ts

import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai";
import { q360Query } from "@/lib/q360";
import type { AiToolRequest, AiToolResponse } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body: AiToolRequest = await req.json();
    const { entityType, entityId, intent, context, audience, tone } = body;

    // 1. Fetch entity data from Q360
    const tableMap: Record<string, string> = {
      dispatch: "Dispatch",
      project: "Projects",
      customer: "Customer",
      servicecontract: "Servicecontract",
      timebill: "Timebill",
    };

    const pkMap: Record<string, string> = {
      dispatch: "DISPATCHNO",
      project: "PROJECTNO",
      customer: "CUSTOMERNO",
      servicecontract: "CONTRACTNO",
      timebill: "TIMEBILLNO",
    };

    const { result } = await q360Query(tableMap[entityType], {
      filters: [{ field: pkMap[entityType], op: "=", value: entityId }],
      limit: 1,
    });

    const entityData = result[0];
    if (!entityData) {
      return NextResponse.json(
        { success: false, error: `${entityType} ${entityId} not found` },
        { status: 404 }
      );
    }

    // 2. Build prompt
    const prompt = `
You are an AI assistant for a field service management company using Q360.

Generate a professional email draft.

Entity type: ${entityType}
Entity ID: ${entityId}
Intent: ${intent}
Audience: ${audience ?? "internal"}
Tone: ${tone ?? "friendly"}
Entity data: ${JSON.stringify(entityData, null, 2)}
${context ? `Additional context: ${JSON.stringify(context)}` : ""}

Return ONLY a JSON object with these fields:
- "subject": the email subject line
- "body": the email body text
`;

    // 3. Call Gemini
    const { text, model } = await generateText(prompt, {
      systemInstruction: "You are a helpful field service AI assistant. Always return valid JSON.",
      temperature: 0.5,
    });

    // 4. Parse and return
    const parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, ""));

    const response: AiToolResponse = {
      success: true,
      result: {
        content: parsed.body,
        subject: parsed.subject,
        metadata: { model, entityType, entityId },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
```

**Build each route with this same skeleton:**

| Route | Prompt Focus | Extra Output Fields |
|-------|-------------|---------------------|
| `/api/ai/draft-email` | Email subject + body | `subject`, `content` |
| `/api/ai/status-report` | Summary of entity's current state | `content` |
| `/api/ai/smart-reply` | Reply to inbound message (passed in `context.inboundMessage`) | `content` |
| `/api/ai/summarize` | Human-readable summary of data | `content` |
| `/api/ai/recommend` | List of suggested next actions | `content`, `actions[]` |

#### Step 3: Build the 5 AI UI Components (Days 4-6)

Each component calls its corresponding API route and renders the result.

```typescript
// components/ai/EmailDrafter.tsx
"use client";

import { useState } from "react";
import { API } from "@/lib/constants";
import type { AiToolRequest, AiToolResponse, EntityType, Audience, Tone } from "@/lib/types";

interface EmailDrafterProps {
  entityType: EntityType;
  entityId: string;
  audience?: Audience;
  tone?: Tone;
}

export function EmailDrafter({ entityType, entityId, audience = "internal", tone = "friendly" }: EmailDrafterProps) {
  const [intent, setIntent] = useState("status_update");
  const [result, setResult] = useState<AiToolResponse["result"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API.AI_DRAFT_EMAIL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, intent, audience, tone } satisfies AiToolRequest),
      });
      const data: AiToolResponse = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data.result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="font-semibold text-lg">AI Email Drafter</h3>

      <select value={intent} onChange={e => setIntent(e.target.value)}
              className="border rounded px-3 py-2 w-full">
        <option value="status_update">Status Update</option>
        <option value="completion_notice">Completion Notice</option>
        <option value="escalation">Escalation</option>
        <option value="follow_up">Follow Up</option>
        <option value="introduction">Introduction</option>
      </select>

      <button onClick={handleGenerate} disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Generating..." : "Generate Draft"}
      </button>

      {error && <p className="text-red-600">{error}</p>}

      {result && (
        <div className="bg-gray-50 rounded p-4 space-y-2">
          <p className="font-medium">Subject: {result.subject}</p>
          <pre className="whitespace-pre-wrap text-sm">{result.content}</pre>
          <button onClick={() => navigator.clipboard.writeText(result.content)}
                  className="text-sm text-blue-600 hover:underline">
            Copy to clipboard
          </button>
        </div>
      )}
    </div>
  );
}
```

**Build the same pattern for all 5 components:**

| Component | File | Key UI Elements |
|-----------|------|----------------|
| `EmailDrafter` | `components/ai/EmailDrafter.tsx` | Intent selector, Generate button, Subject + Body output, Copy button |
| `StatusReport` | `components/ai/StatusReport.tsx` | Generate button, Formatted report output |
| `SmartReply` | `components/ai/SmartReply.tsx` | Inbound message textarea, Generate button, Suggested reply output |
| `DataSummary` | `components/ai/DataSummary.tsx` | Entity selector, Summary output |
| `ActionRecommender` | `components/ai/ActionRecommender.tsx` | Generate button, Numbered action list |

#### Step 4: Build the Shared Wrapper (Day 5)

```typescript
// components/ai/AiToolWrapper.tsx
"use client";

import { Spinner } from "@/components/ui/Spinner";

interface AiToolWrapperProps {
  title: string;
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
}

export function AiToolWrapper({ title, loading, error, children }: AiToolWrapperProps) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="font-semibold text-lg">{title}</h3>
      {loading && <Spinner />}
      {error && <p className="text-red-600 text-sm">Error: {error}</p>}
      {!loading && children}
    </div>
  );
}
```

#### Step 5: n8n Webhook Receiver (Day 6)

```typescript
// app/api/n8n/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // n8n sends webhook payloads here
  // Route to appropriate handler based on body.workflow or body.event
  console.log("[n8n webhook]", body);

  // Example: n8n detected an overdue project → trigger AI recommendation
  // and store result for the dashboard to pick up

  return NextResponse.json({ received: true });
}
```

#### Step 6: Refinement Phase (Days 7-10)

Once Team 1 and Team 3 start consuming your tools, they may request:
- Different prompt tuning for their audience
- Additional intents (e.g., "renewal_reminder" for service contracts)
- Bulk operations (summarize multiple dispatches at once)

Handle these as config/prompt changes — the API contract stays the same.

### Team 2 Files Checklist

```
[ ] lib/agentClient.ts                    (Gemini client)
[ ] app/api/ai/draft-email/route.ts
[ ] app/api/ai/status-report/route.ts
[ ] app/api/ai/smart-reply/route.ts
[ ] app/api/ai/summarize/route.ts
[ ] app/api/ai/recommend/route.ts
[ ] app/api/n8n/webhook/route.ts
[ ] components/ai/AiToolWrapper.tsx
[ ] components/ai/EmailDrafter.tsx
[ ] components/ai/StatusReport.tsx
[ ] components/ai/SmartReply.tsx
[ ] components/ai/DataSummary.tsx
[ ] components/ai/ActionRecommender.tsx
[ ] n8n/README.md
[ ] n8n/workflows/dispatch-created-notify.json
[ ] n8n/workflows/project-overdue-alert.json
[ ] n8n/workflows/daily-digest-email.json
```

---

## 8. Team 3 — Employee Workflow Hub

### What You're Building

A dashboard for **technicians, CSRs, and junior staff** — people with lower authority who need to see *their own* work: assigned dispatches, tasks, time entries, and schedule.

### Your Q360 Data Sources

| Data | Q360 Table | Filter | What You Show |
|------|-----------|--------|---------------|
| My dispatches | `DISPATCH` | `TECHASSIGNED = currentUser` | Assigned service calls |
| My tasks | (mock — `TASK` may not be accessible) | `USERID = currentUser` | To-do list |
| My time bills | `TIMEBILL` | `USERID = currentUser` | Hours logged today/this week |
| My schedule | (mock — `EMPSCHEDULE` not accessible) | `USERID = currentUser` | Work schedule |
| Equipment | `MACHINE` | Via dispatch's `MACHINENO` | Equipment I'm servicing |
| Sites | `SITE` | Via dispatch's `SITENO` | Where I'm going today |

### Step-by-Step Gameplan

#### Step 1: Set Up Employee Layout (Day 1)

Create `app/(employee)/layout.tsx` — simpler than the manager layout.

```
┌─────────────────────────────────────────────┐
│  [Logo]  Q360 My Workspace        [User]    │  ← EmployeeHeader.tsx
├──────┬──────────────────────────────────────┤
│      │                                      │
│  🏠  │                                      │
│ Home │       (page content renders here)    │
│      │                                      │
│  🔧  │                                      │
│ Disp │                                      │
│      │                                      │
│  ✅  │                                      │
│ Tasks│                                      │
│      │                                      │
│  ⏱️  │                                      │
│ Time │                                      │
│      │                                      │
│  📅  │                                      │
│ Sched│                                      │
│      │                                      │
│  📖  │                                      │
│ Work │                                      │
│ flows│                                      │
├──────┴──────────────────────────────────────┤
└─────────────────────────────────────────────┘
```

**Files to create:**
- `app/(employee)/layout.tsx`
- `components/employee/EmployeeSidebar.tsx`
- `components/employee/EmployeeHeader.tsx`

#### Step 2: Build the Home / Daily Briefing Page (Days 2-3)

`app/(employee)/home/page.tsx` — "Here's your day."

**Widgets:**

| Widget | Component | Data Source | AI Integration |
|--------|-----------|-------------|----------------|
| Daily Briefing | `DailyBriefing.tsx` | Multiple endpoints | Team 2's `summarize` tool |
| My Dispatches Today | `DispatchCard.tsx` | `/api/q360/dispatches?tech=me` | None |
| My Tasks | `TaskList.tsx` | Mock data | None |
| Quick Time Entry | `TimeEntry.tsx` | `/api/q360/timebills` | None |

#### Step 3: Build Sub-Pages (Days 4-6)

| Page | Route | What It Shows |
|------|-------|---------------|
| My Dispatches | `/my-dispatches` | List of assigned dispatches with status badges |
| Dispatch Detail | `/my-dispatches/[dispatchNo]` | Full dispatch: problem, notes, AI smart reply, email drafter |
| My Tasks | `/my-tasks` | To-do list with checkboxes, priority sorting |
| Time | `/time` | Time bill log + quick entry form |
| Schedule | `/schedule` | Calendar/week view of work schedule |
| Workflows | `/workflows` | AI-generated step-by-step guides for common tasks |

#### Step 4: Integrate Team 2 AI Tools (Days 7-8)

```typescript
// In a dispatch detail page:
import { EmailDrafter } from "@/components/ai/EmailDrafter";
import { SmartReply } from "@/components/ai/SmartReply";

// Use with employee-specific defaults:
<EmailDrafter
  entityType="dispatch"
  entityId={dispatchNo}
  audience="internal"       // techs email internally
  tone="friendly"
/>

<SmartReply
  entityType="dispatch"
  entityId={dispatchNo}
/>
```

#### Step 5: Workflows Page (Days 8-9)

This is the unique AI feature for Team 3 — the employee asks "How do I do X?" and AI generates a step-by-step workflow.

```typescript
// app/(employee)/workflows/page.tsx
// User types: "How do I close a dispatch?"
// AI returns numbered steps based on Q360 workflow data
```

### Team 3 Files Checklist

```
[ ] app/(employee)/layout.tsx
[ ] app/(employee)/home/page.tsx
[ ] app/(employee)/my-dispatches/page.tsx
[ ] app/(employee)/my-dispatches/[dispatchNo]/page.tsx
[ ] app/(employee)/my-tasks/page.tsx
[ ] app/(employee)/time/page.tsx
[ ] app/(employee)/schedule/page.tsx
[ ] app/(employee)/workflows/page.tsx
[ ] components/employee/EmployeeSidebar.tsx
[ ] components/employee/EmployeeHeader.tsx
[ ] components/employee/DispatchCard.tsx
[ ] components/employee/TaskList.tsx
[ ] components/employee/TimeEntry.tsx
[ ] components/employee/ScheduleView.tsx
[ ] components/employee/WorkflowGuide.tsx
[ ] components/employee/DailyBriefing.tsx
```

---

## 9. n8n Automation Workflows

### What Is n8n?

n8n is a **visual workflow automation tool** (like Zapier, but self-hosted and free). It connects triggers (e.g., "new dispatch created") to actions (e.g., "generate AI summary and send Slack notification").

### How n8n Fits Into This Project

```
┌─────────────┐     webhook/poll      ┌───────────────┐
│  Q360 API   │ ◀───────────────────  │     n8n       │
│  (sandbox)  │ ──────────────────▶  │  (Docker)     │
└─────────────┘    reads data         │               │
                                      │  Workflow:    │
┌─────────────┐     POST /api/ai/*    │  1. Trigger   │
│  Next.js    │ ◀───────────────────  │  2. Fetch     │
│  AI Routes  │ ──────────────────▶  │  3. AI call   │
└─────────────┘    returns AI text    │  4. Action    │
                                      └───────────────┘
                                             │
                                             ▼
                                      ┌───────────────┐
                                      │  Actions:     │
                                      │  - Slack msg  │
                                      │  - Email      │
                                      │  - Webhook    │
                                      │  - Log to DB  │
                                      └───────────────┘
```

### Three Demo Workflows to Build

#### Workflow 1: Dispatch Created → AI Summary → Notification

**Trigger:** n8n polls `POST /api/Record/Dispatch?_a=list` every 5 minutes for new dispatches (filter by `CALLOPENDATE > lastCheck`).

**Steps:**
1. **Schedule Trigger** — runs every 5 min
2. **HTTP Request** — `POST` to Q360 API to list recent dispatches
3. **IF** — new dispatches found?
4. **HTTP Request** — `POST` to `https://<your-app-url>/api/ai/summarize` with dispatch data
5. **Slack / Email** — send the AI summary to a channel or manager

**n8n nodes used:** Schedule Trigger → HTTP Request → IF → HTTP Request → Slack

#### Workflow 2: Project Overdue → AI Alert

**Trigger:** Daily at 8 AM.

**Steps:**
1. **Cron Trigger** — daily 8:00 AM
2. **HTTP Request** — fetch all projects from Q360 where `STATUSCODE = ACTIVE`
3. **Code Node** — filter projects where `ENDDATE < today` and `PERCENTCOMPLETE < 100`
4. **HTTP Request** — `POST` to `/api/ai/recommend` for each overdue project
5. **Slack / Email** — send actionable recommendations

#### Workflow 3: Daily Digest Email

**Trigger:** Daily at 7 AM.

**Steps:**
1. **Cron Trigger** — daily 7:00 AM
2. **HTTP Request** — fetch open dispatches, active projects, expiring contracts
3. **HTTP Request** — `POST` to `/api/ai/summarize` with all data
4. **HTTP Request** — `POST` to `/api/ai/recommend` for priorities
5. **Email (SMTP) / Slack** — send the combined digest

### n8n Setup Instructions

n8n is hosted on the team lead's homelab and exposed via a Cloudflare tunnel — no Docker or local install needed.

```
1. Get the n8n URL from the team lead
2. Open the URL in your browser
3. Import workflow JSON files from n8n/workflows/
```

### n8n Credentials (set in n8n UI → Credentials)

| Credential | Type | Values |
|-----------|------|--------|
| Q360 API | HTTP Header Auth | `Authorization: Basic <base64>` |
| Next.js App | None needed | n8n calls your Vercel URL or `http://<your-local-ip>:3000/api/ai/*` |
| Slack (optional) | OAuth2 | Slack app token |
| Email (optional) | SMTP | Any SMTP server |

---

## 10. Branch Strategy & Merge Rules

### Branches

| Branch | Owner | Creates From | Merges Into |
|--------|-------|-------------|-------------|
| `main` | Team Lead | — | — (protected) |
| `shared/setup` | Team Lead | `main` | `main` (first merge) |
| `feature/1-dashboard` | Team 1 | `main` (after shared setup) | `main` |
| `feature/2-utility-suite` | Team 2 | `main` (after shared setup) | `main` |
| `feature/3-workflow` | Team 3 | `main` (after shared setup) | `main` |

### Setup Order

```
1. Team Lead sets up shared layer on main:
   - lib/q360.ts, lib/agentClient.ts, lib/types.ts, lib/constants.ts
   - app/api/q360/* (all proxy routes)
   - components/ui/* (basic UI components)
   - docker-compose.yml, Dockerfile
   - .env.example updated with GEMINI_API_KEY

2. Each team branches off main:
   git checkout -b feature/X-name

3. Teams work in isolation in their designated paths

4. PRs merge back to main — Team Lead reviews for conflicts
```

### Conflict Prevention Rules

| Rule | Why |
|------|-----|
| Never edit files outside your designated paths | Prevents merge conflicts |
| If you need a change to a shared file, ask in Slack | Team Lead makes the change on `main`, you rebase |
| Rebase from `main` at least once midway | `git pull --rebase origin main` |
| Keep commits small and focused | Easier to review and resolve conflicts |

---

## 11. Deliverable Checklist Per Team

### Team 1 — Manager Command Center

| # | Deliverable | Definition of Done |
|---|------------|-------------------|
| 1 | Manager layout with sidebar navigation | All 6 nav links work, responsive on desktop |
| 2 | Dashboard page with 4+ widgets | Shows live data from Q360 (or mock), auto-refreshes |
| 3 | Projects list page | Filterable by status, shows % complete, links to detail |
| 4 | Project detail page with AI status report | Fetches project data, shows Team 2's StatusReport component |
| 5 | Service/dispatch list page | Filterable by status/priority, shows open count |
| 6 | Dispatch detail page with AI email drafter | Shows dispatch info + Team 2's EmailDrafter component |
| 7 | Sales page | Pipeline chart (mock data OK), shows key metrics |
| 8 | Accounting page | AR aging table from invoice data |

### Team 2 — AI Utility Suite

| # | Deliverable | Definition of Done |
|---|------------|-------------------|
| 1 | `lib/agentClient.ts` — Gemini client | `generateJSON()` and `generateStream()` work, handle errors |
| 2 | `/api/ai/draft-email` route | Accepts AiToolRequest, returns email subject + body |
| 3 | `/api/ai/status-report` route | Returns formatted status report for any entity |
| 4 | `/api/ai/smart-reply` route | Takes inbound message, returns suggested reply |
| 5 | `/api/ai/summarize` route | Returns human-readable summary of entity data |
| 6 | `/api/ai/recommend` route | Returns list of suggested next actions |
| 7 | 5 AI React components | Each calls its API route, shows loading/error/result |
| 8 | n8n docker-compose setup | n8n runs locally, can reach Next.js API routes |
| 9 | 1+ n8n workflow (demo-ready) | At least the dispatch notification workflow works end-to-end |
| 10 | Webhook receiver route | `/api/n8n/webhook` accepts and logs n8n callbacks |

### Team 3 — Employee Workflow Hub

| # | Deliverable | Definition of Done |
|---|------------|-------------------|
| 1 | Employee layout with sidebar navigation | All 6 nav links work, simpler than manager layout |
| 2 | Home page with daily briefing | Shows today's dispatches + tasks, AI-generated summary |
| 3 | My Dispatches list page | Filtered to current user's assigned dispatches |
| 4 | Dispatch detail page (tech view) | Shows problem, notes, Team 2's SmartReply + EmailDrafter |
| 5 | My Tasks page | To-do list with checkboxes (mock data OK) |
| 6 | Time entry page | Form to log time bills, shows recent entries |
| 7 | Schedule page | Calendar or week view (mock data OK) |
| 8 | Workflows page | User types question → AI generates step-by-step guide |

---

## 12. Timeline & Milestones

```
Week 1: April 7–11
├── Mon-Tue: Team Lead sets up shared layer on main (lib/*, api/q360/*, components/ui/*)
├── Tue: All teams branch off, set up layouts + first page
├── Wed-Thu: Core pages (Team 1: dashboard + projects, Team 2: 3 API routes, Team 3: home + dispatches)
└── Fri: Mid-week sync — demo what you have, flag blockers

Week 2: April 14–18
├── Mon-Wed: Remaining pages + components
├── Thu: Team 1 & 3 start integrating Team 2's AI components
└── Fri: Feature freeze candidate — all pages exist, data flows

Week 3: April 21–25
├── Mon-Tue: Bug fixes, polish, responsive design
├── Wed: n8n workflow demo setup
├── Thu: Full integration test — all 3 features work together
└── Fri: Deploy to Vercel, rehearse demo

Week 4: April 28–30
├── Mon: Final polish, fix demo-day bugs
├── Tue: Dress rehearsal
└── Wed-Thu: LIVE DEMO TO SPONSOR
```

---

## Quick Reference: "Where Do I Put This?"

| I need to... | File path | Owner |
|-------------|-----------|-------|
| Add a Q360 API helper | `lib/q360.ts` | Shared (ask Team Lead) |
| Add a TypeScript type | `lib/types.ts` | Shared (ask Team Lead) |
| Create a manager page | `app/(manager)/<name>/page.tsx` | Team 1 |
| Create a manager component | `components/manager/<Name>.tsx` | Team 1 |
| Create an AI API route | `app/api/ai/<name>/route.ts` | Team 2 |
| Create an AI component | `components/ai/<Name>.tsx` | Team 2 |
| Create an employee page | `app/(employee)/<name>/page.tsx` | Team 3 |
| Create an employee component | `components/employee/<Name>.tsx` | Team 3 |
| Add a Q360 proxy route | `app/api/q360/<name>/route.ts` | Shared (ask Team Lead) |
| Add a UI primitive | `components/ui/<Name>.tsx` | Shared (ask Team Lead) |
| Add an n8n workflow | `n8n/workflows/<name>.json` | Team 2 |
