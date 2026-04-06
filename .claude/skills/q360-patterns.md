---
name: q360-patterns
description: Q360 field service management platform patterns. Use when building features that integrate with Q360 API, handling dispatches, customers, projects, or any domain-specific logic.
origin: q360-ai-demo
---

# Q360 Platform Patterns

This skill ensures consistent, correct integration with Q360 API across the demo application.

## When to Activate

- Building features that fetch or manipulate Q360 data
- Creating API routes that interact with Q360
- Working with dispatches, customers, projects, or service contracts
- Implementing demo features (Command Center, Utility Suite, Workflow Architect)

## Q360 Domain Model

The following entities are core to Q360 field service operations:

| Entity | Purpose | Key Fields |
|--------|---------|-----------|
| **Dispatch** | Service request assigned to technician | ID, customer, status, priority, due date, assigned tech |
| **Customer** | Client receiving service | ID, name, sites, active contracts |
| **Project** | Multi-phase engagement | ID, customer, status, phases, timeline |
| **Service Contract** | Service agreement with terms | ID, customer, terms, renewal |
| **Site** | Physical location for service | ID, customer, address, zone |
| **Time Bill** | Labor time entry | ID, dispatch, user, hours, date |
| **User** | Team member (CSR, tech, manager) | ID, type, name, branch, active status |

## Rules for Data Access

### 1. Use the Shared Layer
Never write raw `fetch()` calls. Always import from shared clients:

```typescript
import { q360Query, getDispatches, getProjects, getCustomers } from "@/lib/q360";
import { generateText } from "@/lib/ai";
```

### 2. Credentials Never in Client
All Q360 API credentials live in `.env.local` on the server. Never put them in:
- React components (`use client` files)
- Client-side utilities
- Exposed to the browser

### 3. API Route Pattern
Q360 queries must run inside Next.js API routes (`app/api/q360/**`):

```typescript
// app/api/q360/dispatches/route.ts
export async function GET(request: Request) {
  const dispatches = await getDispatches([
    { field: "STATUSCODE", op: "=", value: "OPEN" }
  ]);
  return Response.json(dispatches);
}
```

### 4. Q360 Proxy Routes Available
These 9 endpoints are pre-built. Use them instead of calling Q360 directly from the browser:

- `GET /api/q360/dispatches?status=&tech=&priority=`
- `GET /api/q360/projects?status=&leader=`
- `GET /api/q360/customers?status=&salesrep=`
- `GET /api/q360/contacts?customer=`
- `GET /api/q360/timebills?user=&dispatch=&project=`
- `GET /api/q360/service-contracts?status=&customer=`
- `GET /api/q360/sites?customer=&zone=`
- `GET /api/q360/users?type=&branch=&active=`
- `GET /api/q360/invoices?customer=&type=`

### 5. Filtering Best Practices
Use the `filters` parameter with standard operators:

```typescript
const dispatches = await getDispatches([
  { field: "STATUSCODE", op: "=", value: "OPEN" },
  { field: "PRIORITY", op: ">", value: "5" },
  { field: "DUE_DATE", op: "<=", value: "2026-04-30" }
]);
```

## Feature-Specific Patterns

### Feature 1: Command Center (Manager Dashboard)
- Query open/high-priority dispatches
- Aggregate project health metrics
- Use AI to suggest next actions and prioritize workload

### Feature 2: Utility Suite (AI Automation)
- Fetch dispatch/project context from Q360
- Use Claude Gemini API to generate content (emails, reports)
- Store drafts locally; send logic comes later

### Feature 3: Workflow Architect (Suggestion Engine)
- Query all active projects and dispatches
- Use AI to generate workflow steps and resource assignments
- Return structured recommendations with diagrams

## Common Patterns

### Fetching with Error Handling
```typescript
try {
  const data = await getDispatches([filter]);
  if (!data.result || data.result.length === 0) {
    return { empty: true, message: "No open dispatches" };
  }
  return { success: true, data: data.result };
} catch (error) {
  console.error("Q360 API error:", error);
  return { error: "Failed to fetch data" };
}
```

### Batch Operations
```typescript
const [dispatches, projects, customers] = await Promise.all([
  getDispatches(),
  getProjects(),
  getCustomers()
]);
```

### Type Safety
Always import types from `@/lib/types`:

```typescript
import type { Dispatch, Project, Customer } from "@/lib/types";

const processDispatches = (dispatches: Dispatch[]) => {
  // Full type checking
};
```

## Testing Q360 Integration

Use the mock database during local development:
```bash
npm run seed  # Populate local test data
npm run dev   # Run locally with test data
```

For E2E tests, use the sandbox Q360 environment with test credentials in `.env.local`.

## Team Ownership

- **Shared layer (lib/q360.ts, lib/ai.ts)** — Team Lead maintains
- **API routes (app/api/q360/**)** — Shared, read-only after setup
- **Feature-specific usage** — Each team in their own directories

**Important**: If you need to modify shared Q360 client code, coordinate with the team lead first.
