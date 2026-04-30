# Agentic Revamp Plan

**Status:** proposal — pending sign-off
**Created:** 2026-04-30
**Target demo:** end of May 2026

---

## 1. Context

Sponsors reviewed the current state of `q360-ai-demo` on 2026-04-30 and were not impressed. The existing surface — one-shot AI utilities (email drafting, record summaries, smart replies, recommendation cards across Feature 1 / Feature 2 / Employee Hub) — covers use cases they had already considered internally and dismissed. The feedback was direct: they want a **true agentic system**, where the user states intent and the AI carries out the actual workflow inside Q360, not just produces text the user pastes somewhere.

The mental model is Claude Code, but for Q360: the user describes what needs to happen ("Acme called, AC is down, get a tech out tomorrow"), and the agent reads procedure knowledge, calls the Q360 API in the right order, asks clarifying questions when stuck, and reports back when done.

This document is the architecture and execution plan for that pivot. The original April 2026 demo deadline has been pushed to **end of May 2026** to absorb the rebuild.

---

## 2. Goals and non-goals

### Goals
- The agent can complete 2–3 full Q360 workflows end-to-end on the sandbox using only the user's intent prompt as input.
- Procedure knowledge from the Q360 help docs (`helpv24.q360.com/docs-inline/`) is captured in a form the agent can consume reliably.
- The user-facing surface is **not a chatbox as the primary entry point**. Sponsor feedback: users often don't know what to ask. Discovery has to be visible, not hidden behind a blank prompt.
- All write operations against the sandbox are auditable (who, what, when) and observable in real time.
- The agent is "as autonomous as possible" — minimal interruption for approvals on routine work, hard confirms only on destructive operations.

### Non-goals
- Replacing 100% of Q360 procedures. We are picking 2–3 demonstrably useful workflows. Everything else stays a human job for the demo.
- Production-grade multi-tenant deployment. This is a sandbox-bound demo.
- Browser automation as the default action mechanism. API-first; browser fallback only if a critical demo workflow has zero API coverage.
- Migration of the original Feature 1 / Feature 2 / Employee Hub UIs. Those are deprecated.

---

## 3. Architecture overview

Three layers plus the existing data layer we keep:

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI surface                              │
│  Dashboard cards · Workflow gallery · Live execution panel ·    │
│                  Cmd-K palette · fallback chat                  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                       Agent runtime                             │
│           Claude Agent SDK · tool registry · approval gates     │
│           memory · skill loader · execution event stream        │
└─────────────────────────────────────────────────────────────────┘
        │                      │                     │
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│  Knowledge layer │  │   Action layer   │  │   Data layer (kept)  │
│  Skills (curated │  │   Q360 API tools │  │   Q360 client        │
│  procedure runb. │  │   (typed wrappers│  │   types/q360.ts      │
│  RAG over scraped│  │   per endpoint)  │  │   mock DB / seeds    │
│  help docs       │  │   read/write/    │  │   PostgreSQL adapter │
│                  │  │   search         │  │                      │
└──────────────────┘  └──────────────────┘  └──────────────────────┘
```

### What we keep from the current codebase
- `lib/q360.ts`, `lib/q360Client.ts`, `lib/q360/client.ts` — Q360 HTTP client and envelope validation
- `types/q360.ts` — entity contracts
- `lib/domain/models.ts`, `lib/domain/normalizers.ts` — domain types and field-alias resolution
- `lib/mockDb.ts`, `lib/sqlite.ts`, `scripts/seed.ts` — sandbox / mock data layer
- `lib/q360/mock-postgres.ts` — Postgres adapter for Feature 1 (re-purposed as the agent's bulk read backend)
- CI/CD workflows in `.github/workflows/`

### What gets removed
- `lib/draftEmailService.ts`, `lib/aiToolsService.ts`, `lib/emailPrompts.ts`, `lib/agentClient.ts` (Gemini one-shot client)
- All routes under `app/api/ai/*`
- `app/feature1/`, `app/feature2/`, `app/(employee)/` page trees
- `components/ai/*` (replaced by new agent UI primitives)
- Tests covering the above

The deletion is a single PR after the new system runs the first workflow end-to-end. Until then the old code stays so the existing demo URL still works as a fallback.

---

## 4. Knowledge layer

### Problem
Q360's help docs at `helpv24.q360.com/docs-inline/` contain ~150+ procedures grouped by module (Sales, Projects, Service, Service Contract, Accounting, Purchasing, Warehouse, Time Billing, etc.). They are written for humans, frequently say things like *"click the gear icon → choose Edit"*, and don't always map cleanly to API endpoints. We need a representation the agent can act on.

### Approach: hybrid (RAG + curated skills)
Two complementary stores:

**A. Skills (curated, ~10 files for the demo)**
Hand-authored markdown files, one per workflow we plan to demo. Format:

```markdown
---
name: create-service-call
description: Create and dispatch a service call for an existing customer
when_to_use: User reports an equipment problem at a known customer site
required_inputs:
  - customer (name or id)
  - site (if customer has multiple)
  - problem description
  - desired_priority (or infer from description)
optional_inputs:
  - preferred_tech
  - desired_date
---

# Steps

1. Resolve customer
   - Tool: q360.searchCustomers({ query })
   - If multiple matches, ask user to disambiguate.
2. Resolve site
   - Tool: q360.listSitesForCustomer({ customerno })
   - If only one, auto-pick. If multiple, ask user.
3. ... (every step lists the exact tool, expected inputs, branch logic)

# Validation
- After create, confirm dispatchno is returned and statuscode === "OPEN".

# Common pitfalls
- estfixtime defaults to 2 hours; for emergencies, set explicitly.
- techassigned must be a userid, not a display name.
```

These skills are loaded into the agent's system prompt context when relevant (selected via vector search on the user's intent + skill descriptions). The agent treats them as authoritative runbooks.

**B. RAG over scraped procedure docs**
The remaining ~140 procedures we don't curate are scraped from `helpv24.q360.com`, chunked, embedded with Gemini's embedding model (cheap, already integrated), and stored in a local vector index (e.g. `@lancedb/lancedb` or just a JSON+brute-force search since the corpus is small). At runtime, the agent can retrieve relevant doc chunks for context when no curated skill matches. This is the discovery / fallback layer — useful for "how would I do X?" type questions even if the agent can't fully execute X.

### Authoring workflow
1. Crawl all procedure URLs under `/docs-inline/{module}/` to produce an index (one-time script in `scripts/scrape-procedures.ts`).
2. Fetch each procedure page → markdown via Turndown or similar → save under `docs/procedures-raw/{module}/{slug}.md`.
3. Build the embedding index (`scripts/build-procedure-index.ts`).
4. For each demo workflow, hand-write the curated skill in `skills/{slug}.md` using the raw doc + Postman testing as source.

---

## 5. Action layer

### Approach: API-first
We wrap each Q360 REST endpoint we need as a typed tool the agent can call. Every tool:
- Has a JSON schema for inputs (so the agent's tool-calling stays well-formed).
- Validates inputs and outputs with Zod (we already use Zod elsewhere).
- Logs every call (request, response, duration) into an execution trail surfaced in the UI.
- Is tagged `read` or `write` for the approval gate logic.

### Tool inventory (initial)
Driven by the three picked workflows (§7). Approximate count: 25–35 tools.

**Customer / site / contact**
- `q360.searchCustomers`, `q360.getCustomer`, `q360.createProspect`, `q360.convertProspectToCustomer`
- `q360.listSitesForCustomer`, `q360.createSite`
- `q360.listContacts`, `q360.createContact`

**Service**
- `q360.createDispatch`, `q360.updateDispatch`, `q360.assignTech`, `q360.scheduleDispatch`, `q360.closeDispatch`, `q360.searchDispatches`
- `q360.listTechs`, `q360.getTechAvailability`

**Sales**
- `q360.createOpportunity`, `q360.createQuote`, `q360.addQuoteLineItem`, `q360.printQuote`, `q360.approveQuote`

**Service contract**
- `q360.listExpiringContracts`, `q360.getServiceContract`, `q360.renewServiceContract`, `q360.draftRenewalQuote`

**Time / billing**
- `q360.createTimeBill`, `q360.searchTimeBills`

**Misc**
- `q360.searchProjects`, `q360.getProject`, `q360.listProjectTasks`

### Browser fallback (deferred)
Not building this for v1. If during workflow validation we find an action with no API path, two options: (a) cut that step from the demo, (b) add a Playwright-based tool. Decision per workflow during the API-coverage audit (§9, week 1).

### Approval / safety model
- **Read tools:** never prompt. Run freely.
- **Write tools (default):** run automatically, but the UI shows the agent's plan ("about to create dispatch DSP-XXX for Acme") with a 5-second cancel window before each batch. User can hit stop at any time.
- **Destructive tools** (delete, cancel, void): hard confirm. Modal blocks until user clicks proceed.
- All tool calls land in an audit log accessible from the UI.

---

## 6. Agent runtime

### Choice: Claude Agent SDK
After comparing with Gemini function calling and n8n:

**Why Claude Agent SDK won:**
- Out-of-the-box agent loop, tool registry, hooks, permissions/approval gates, skills format, MCP support, and conversation compaction. Building these from scratch on Gemini costs ~1 week of the 5-week budget.
- Stronger track record on multi-step tool use without going off-rails.
- Better at recognizing ambiguity and asking the user instead of guessing — important when "as autonomous as possible" still has to handle missing inputs gracefully.
- The skill format above (`skills/*.md`) is a first-class concept in the SDK.

**Why not Gemini-only:**
- Tool calling works but we'd own the agent loop, tool dispatch, retry logic, memory, and approval gating ourselves. Time we don't have.
- Gemini still earns its keep for embeddings (cheap) and any non-agentic bulk work, so we keep `@google/genai` in the dependency graph.

**Why not n8n:**
- n8n is workflow automation, not an agent framework. Workflows in n8n are pre-designed by humans; the system executes them deterministically. That is the opposite of what sponsors asked for ("AI figures out the workflow"). n8n could serve as a backend execution layer for deterministic sub-routines, but introducing it adds infra overhead with no payoff for this demo.

### Runtime shape
- Server-side Next.js route (`app/api/agent/run/route.ts`) creates an SDK session per request, streams events back via SSE.
- Tools registered from `lib/agent/tools/*.ts` (one file per tool group).
- Skills loaded from `skills/*.md` at boot, indexed by description for relevance ranking.
- System prompt: role (Q360 operations assistant), guardrails (always confirm destructive ops, never invent IDs, prefer asking over guessing), tool inventory summary.
- Conversation state persisted per session (in-memory for v1; Postgres if we get there).

### Observability
- Every tool call logged: tool name, inputs (redacted secrets), outputs, duration, status.
- The execution event stream feeds the UI's live panel.
- A dev-only "transcript" view shows the raw assistant turns for debugging.

---

## 7. Demo workflows (the three picks)

Picked for ease of API coverage, breadth of demo coverage (read / write / batch), and storytelling.

### Workflow 1 — Inbound service call lifecycle
**Trigger:** *"Acme just called, their AC unit is down, send a tech out tomorrow morning."*
**Agent does:**
1. Resolve customer "Acme" (search, disambiguate if needed).
2. Resolve site (auto-pick if one, ask if multiple).
3. Pick priority based on language ("down" → high).
4. Look up tech availability for tomorrow morning, propose Tech Smith.
5. Create dispatch, assign tech, schedule.
6. Draft customer ack email (existing email-drafting code can be repurposed here as a tool).
7. Report: "Created DSP-1043, assigned to Smith, scheduled tomorrow 9am, ack sent."

**Demonstrates:** single-record write, multi-entity coordination, scheduling logic, agent picking a sensible default and stating it back.

### Workflow 2 — Service contract renewal sweep
**Trigger:** *"Handle this month's renewals."*
**Agent does:**
1. List service contracts expiring in the next 30 days.
2. For each: pull last invoice, current coverage, customer history.
3. Draft a renewal quote per contract with same terms unless customer flagged for review.
4. Queue all draft quotes for human approval in one batch.
5. Report: "Drafted 12 renewal quotes totaling $X. 2 flagged for review (customer past due)."

**Demonstrates:** proactive batch work, the kind of multi-record drudgery humans hate. High sponsor-impact.

### Workflow 3 — Quote-to-order onboarding flow
**Trigger:** *"New customer Wilson Industries wants a quote for 5 HVAC units installed at their Burlington site."*
**Agent does:**
1. Create prospect.
2. Create site.
3. Create primary contact (asks for contact info if not given).
4. Create sales opportunity.
5. Create quote, add line items (5x HVAC unit + install labor).
6. Print/render quote PDF.
7. Report with the quote ID and a link to review.

**Demonstrates:** orchestration across Sales module, longest happy path, multi-entity write chain.

---

## 8. UI / UX

Sponsor said: **not a chatbox.** Users often don't know what to ask. Discovery has to be visible.

Four surfaces, in priority order:

### A. Dashboard (primary entry point)
Home page = a feed of agent-generated cards. Each card is a one-click trigger to run a workflow. Examples:

```
┌─────────────────────────────────────────────────────┐
│  3 service contracts expire in the next 30 days     │
│  Acme HVAC ($24K), BrightTech ($8K), …              │
│                              [ Draft renewals ]     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Tech Smith has 4 unscheduled dispatches            │
│  Earliest opens Tuesday                             │
│                              [ Auto-schedule ]      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  New customer signed up: Wilson Industries          │
│  Onboarding flow is ready to run                    │
│                              [ Onboard ]            │
└─────────────────────────────────────────────────────┘
```

Cards are generated by a server-side rules + LLM pass over current sandbox state, refreshed every N minutes. This kills "blank prompt anxiety" — the system shows what it can do for you right now.

### B. Workflow gallery / Cmd-K palette (secondary)
A grid view of every skill the agent has, in plain English. *"Create service call," "Renew contracts," "Onboard customer," "Bill open dispatches."* Click → guided form with smart defaults filled in by the agent → execute.

Cmd-K opens a quick palette for power users.

### C. Live execution panel (always visible during runs)
When a workflow runs, a panel streams the agent's plan and tool calls in real time, like Claude Code's terminal output:

```
🔍 Searching customers matching "Acme"… ✓ 1 match (Acme HVAC, CUST-1042)
🏢 Looking up sites… ✓ 1 site (101 Main St)
🚦 Inferring priority from "AC is down"… → HIGH
👷 Checking tech availability for 2026-05-01 morning… ✓ Smith is open 9–11am
📝 Creating dispatch…
   ↳ q360.createDispatch({ customerno: "CUST-1042", … })
   ↳ ✓ Created DSP-1043
…
```

User can pause, stop, or step in at any time. Everything is also captured to the audit log.

### D. Fallback chat (tertiary)
A small "ask anything" input pinned to the bottom of the UI. Used for edge cases the gallery doesn't cover, or when a power user wants to drive directly. Not the centerpiece.

### Mental model
Linear or Notion, not ChatGPT. The agent's capabilities are visible as actionable cards, not gated behind a blank prompt.

---

## 9. Migration / sequencing

### Branch strategy
- Work happens on `pivot/agentic-revamp` and feature branches off it.
- The current `main` keeps shipping; old demo URL stays live as a fallback in case sponsors want to compare.
- Big-bang merge to `main` only once all three demo workflows pass an end-to-end test.

### Folder layout (new)
```
app/
  agent/                    # new dashboard + execution UI
    page.tsx                # dashboard
    gallery/page.tsx        # workflow gallery
    runs/[id]/page.tsx      # live + historical run view
  api/
    agent/
      run/route.ts          # streaming agent run endpoint
      tools/route.ts        # tool registry inspection (dev)
      cards/route.ts        # dashboard card generator
lib/
  agent/
    runtime.ts              # SDK setup, system prompt
    tools/                  # one file per tool group
      customers.ts
      dispatches.ts
      quotes.ts
      contracts.ts
      …
    skills.ts               # skill loader + ranker
    audit.ts                # tool-call logger
skills/                     # curated procedure runbooks (markdown)
  create-service-call.md
  renew-contracts.md
  onboard-customer.md
  …
docs/
  procedures-raw/           # scraped help-doc markdown
  procedure-index.json      # vector index manifest
scripts/
  scrape-procedures.ts
  build-procedure-index.ts
```

---

## 10. Timeline

5 weeks (2026-04-30 → end of May 2026). One milestone per week; demo readiness at end of week 5.

### Week 1 — Research and scaffolding (May 1–7)
- [ ] Crawl `helpv24.q360.com/docs-inline/` → inventory of every procedure (`scripts/scrape-procedures.ts`).
- [ ] Audit the Postman collection / live sandbox API: confirm coverage for the three picked workflows. Cut workflows that don't have API coverage; pick replacements if needed.
- [ ] Stand up Claude Agent SDK in the repo, behind `app/api/agent/run/route.ts` — minimal "hello" run with one read-only tool.
- [ ] Hand-author skill #1 (`create-service-call.md`).

### Week 2 — Workflow 1 end-to-end (May 8–14)
- [ ] Build all tools needed for the service-call workflow.
- [ ] Skill executes end-to-end on the sandbox.
- [ ] Build the live execution panel UI.
- [ ] Write integration tests against the sandbox for the happy path.

### Week 3 — Workflow 2 + dashboard (May 15–21)
- [ ] Hand-author skill #2 (`renew-contracts.md`) + tools.
- [ ] Build the dashboard cards generator.
- [ ] First card type: "expiring contracts" → triggers workflow 2.

### Week 4 — Workflow 3 + gallery + RAG (May 22–28)
- [ ] Hand-author skill #3 (`onboard-customer.md`) + tools.
- [ ] Build the workflow gallery / Cmd-K palette.
- [ ] Build RAG index over the scraped procedures (fallback knowledge).
- [ ] Wire fallback chat input.

### Week 5 — Polish, deletion, demo prep (May 29 – end of May)
- [ ] Delete deprecated code (Feature 1/2/Employee Hub) in a single sweep PR.
- [ ] Add audit log viewer.
- [ ] End-to-end demo dry-run with a sponsor stand-in.
- [ ] Record a backup screen-capture of all three workflows in case the live demo gods are unkind.

### Slack
We have ~3 days of slack baked into week 5. If something slips, the first thing to cut is RAG (workflow gallery + curated skills are enough for the demo); the second thing to cut is workflow 3 (we keep two, which is still a strong story).

---

## 11. Risks and open questions

### Risks
- **API coverage gap.** Some demo steps may have no API equivalent. Mitigation: audit in week 1 before committing; cut/swap workflows. Browser automation is a last resort.
- **Sandbox instability.** If the sponsor sandbox is flaky, end-to-end tests block. Mitigation: keep mock-DB fallback paths in tools so the agent can still demo offline.
- **Agent goes off-rails on stage.** Multi-step LLM execution is non-deterministic. Mitigation: rehearse with the same prompts we'll use; pre-record a backup video; have a "force run skill" mode that bypasses LLM planning for the demo.
- **Scope creep on UI polish.** The dashboard is a rabbit hole. Mitigation: shipping-ugly is fine for a sponsor demo; spend polish budget on the execution panel where the wow factor lives.

### Open questions (need user input before week 1 starts)
1. **Where do the Postman collection and sandbox credentials live?** I won't touch credentials without a pointer to the canonical source.
2. **Sandbox URL and auth model:** is it shared one-account-per-team, or per-user? Affects whether the agent runs as a "service account" or impersonates the user.
3. **Card refresh cadence on the dashboard:** every page load, every 5 min, every hour? Cheaper = staler.
4. **What's the demo audience?** Sponsor execs (story matters more) vs. sponsor engineers (depth matters more)? Affects polish-vs-coverage tradeoffs in week 5.
5. **Acceptable to delete the existing Feature 1/2/Employee pages?** They get cut in week 5, but if any of them stay live for political reasons we need to know now.

---

## 12. Immediate next steps

Before any code lands beyond this doc:

1. User confirms the three picked workflows (§7) and answers the open questions in §11.
2. User points to the Postman collection / sandbox credentials.
3. Branch `pivot/agentic-revamp` is open with this plan; PR opens for review.
4. Once approved, week 1 starts on the procedure crawl and API-coverage audit.

That's the plan. Push back wherever it's wrong.
