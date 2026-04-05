# Feature 2 — Automated Utility Suite

> **Owner:** Team 2
> **Deadline:** End of April 2026
> **Branch:** `feature/2-utility-suite`
> **Status:** In development

---

## 1. Overview

The Automated Utility Suite embeds generative AI into the highest-friction manual tasks a Q360 user performs daily. Instead of reading through a dispatch record, opening an email client, and writing an update from scratch — the user clicks one button and gets a polished, professional draft in seconds, pre-filled with real Q360 data.

**Phase 1 (Demo goal — end of April):** Working UI where a user selects a Q360 record, picks an automation type, and receives an AI-generated email draft they can review and copy.

**Phase 2 (Post-demo):** Same flow, but the email is actually sent via Resend/SendGrid directly from the app.

**Primary demo features:**
- Automation 1 — Project Status Email ⭐ (main demo centerpiece)
- Automation 3 — Overdue Dispatch Alert (shows scale and AI reasoning)

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js App Router (TypeScript) | API routes keep Q360 and AI credentials server-side |
| Styling | Tailwind CSS | Fast, consistent UI with no extra setup |
| AI SDK | `@anthropic-ai/sdk` | Official SDK with built-in streaming support |
| AI Model | `claude-sonnet-4-6` | Quality output for live demo. Sonnet over Haiku — cost per call is ~$0.01–0.03, irrelevant at demo scale |
| Deployment | Vercel (free tier) | Zero config for Next.js |
| Phase 2 email | Resend API | Drop-in 10-line addition post-demo |

**Environment variables** (all in `.env.local`, never committed):
```
Q360_BASE_URL=http://rest.q360.online
Q360_API_USERNAME=<see team lead>
Q360_API_PASSWORD=<see team lead>
ANTHROPIC_API_KEY=<see team lead>
USE_MOCK_DATA=true|false
DATABASE_URL=file:./mock.db
```

---

## 3. Architecture & Data Flow

```
User opens Automation Suite page
    │
    ▼
UI: Select record + Select automation type + Select tone
    │
    ▼  POST /api/feature2/generate
Next.js API Route (server-side)
    │
    ├──► Q360 REST API  →  fetch dispatch + customer + site data
    │
    ├──► Data formatter  →  build clean labeled text from raw Q360 JSON
    │
    └──► AI API (claude-sonnet-4-6)
         system prompt + formatted Q360 data + tone selection
         ◄── streams generated email text
    │
    ▼
Frontend reads stream → updates subject + body state incrementally
    │
    ▼
User reviews → Copy to clipboard (Phase 1)
            OR  Send via Resend (Phase 2)
```

### Why Streaming

Streaming the AI response makes it look like the AI is typing the email live. This is visually much more impressive than a spinner followed by a wall of text. For a live sponsor demo, this is the key visual moment.

---

## 4. File Structure

```
/app
  /feature2
    page.tsx                    Main Automation Suite hub page
    /overdue
      page.tsx                  Overdue Dispatch Alert page
    /components
      RecordSelector.tsx        Dropdown to pick a dispatch record
      AutomationTypeCard.tsx    Clickable cards for each automation type
      EmailPreviewPanel.tsx     Editable email draft output panel
      ToneSelector.tsx          Professional / Friendly / Concise toggle
      AlertCard.tsx             Individual overdue dispatch alert card
      StatsSummaryBar.tsx       "X scanned / Y overdue / Z critical" bar

/app/api/feature2
  /generate/route.ts            POST - Automation 1: stream email draft
  /overdue/route.ts             POST - Automation 3: batch scan + JSON
  /records/route.ts             GET  - Dispatch list for RecordSelector

/lib
  q360Client.ts                 All Q360 fetch logic
  agentClient.ts                AI API wrapper (streaming + JSON modes)
  emailPrompts.ts               Prompt templates for each automation type

/types
  q360.ts                       TypeScript interfaces for Q360 data shapes
  feature2.ts                   Types for automation request/response
```

---

## 5. Automation Types

### Automation 1 — Project Status Email ⭐ PRIMARY DEMO

**What it does:** User selects a dispatch record, clicks Generate. The AI reads the dispatch data and writes a complete professional client-facing status update email — subject line and full body — streamed live to the screen.

**Q360 data used:** customer name/email, dispatch number, status code, technician assigned, problem description, solution notes, estimated fix time, open/close dates.

**Output:** Complete email — subject line, greeting, status summary, next steps, sign-off.

**Why this is the demo centerpiece:** Immediately understandable to any audience, visually impressive (live streaming), and shows direct value from real data.

#### AI Configuration
- **Model:** `claude-sonnet-4-6`
- **Streaming:** YES — token-by-token to browser
- **max_tokens:** 600 (a well-structured email runs 200–400 tokens; 600 gives headroom)

#### Prompt Strategy

Split between system prompt and user prompt:
- **System prompt:** Persona, output format rules, tone guide. Stable across every call.
- **User prompt:** Formatted Q360 data + tone selection. Changes every call.

**Never inject raw Q360 JSON into the prompt.** Field names like `disp_status_cd` are machine-readable noise. Pre-format all data into labeled plain text:

```
Service Call: D-2041
Customer: Acme Corporation (john@acme.com)
Status: IN PROGRESS
Technician Assigned: Maria Chen
Problem: Unit 3 compressor cycling irregularly
Solution Notes: Replaced capacitor on Unit 3
Estimated Completion: March 30, 2026
Opened: March 25, 2026
Closed: [Not provided]
```

Null or empty fields always become the literal text `[Not provided]`. This tells the AI to omit gracefully, never fabricate.

**Required output format:**
```
SUBJECT: [subject line]

[email body starting with greeting]
```

The frontend parses the `SUBJECT:` line separately and displays it above the body textarea.

**Tone options:**
- `Professional` — Formal business language, no contractions
- `Friendly` — Warm, light contractions, empathetic
- `Concise` — Short sentences, bullets, under 150 words

#### API Route — `POST /api/feature2/generate`

Request body: `{ recordType, recordId, automationType, tone }`

Steps:
1. Validate `recordId` and `tone` are present
2. Fetch dispatch from Q360 or `mock.db`
3. Call `formatDispatchForPrompt()` to build clean text block
4. Build prompt with system + user parts
5. Call AI with streaming, return `ReadableStream` to browser
   - Headers: `Content-Type: text/plain`, `Transfer-Encoding: chunked`

Error handling:
- Q360 down → HTTP 502, "Q360 API unavailable"
- AI fails → stream pushes error sentinel text at end
- Bad request → HTTP 400, "recordId and tone are required"
- Unknown → HTTP 500, logged to console

#### How the Frontend Reads the Stream

1. POST to `/api/feature2/generate`
2. Get `response.body` as a `ReadableStream`
3. Read chunks with `response.body.getReader()`
4. Decode each chunk with `TextDecoder`
5. Once a blank line follows the `SUBJECT:` line: parse subject into the subject bar state, append remaining text to body state
6. Each state update triggers a React re-render — textarea appears to fill in live
7. When `reader.done === true`: set `isStreaming = false`, make textarea editable, show Copy and Regenerate buttons

#### The Three Demo Moments to Nail

1. **The dropdown populates with real Q360 records.** Sponsor sees their own customer names and dispatch numbers. Sets credibility — this is not a mockup.
2. **The subject line appears first, then the body streams in.** The two-beat reveal shows the AI understood the task structure. If both appear simultaneously as one blob, the effect is flat.
3. **Switching tone and clicking Regenerate gives a noticeably different email.** Proves the system is not cached and the AI is reasoning. Sponsors often ask "can it be less formal?" — answer it live.

---

### Automation 2 — Service Call Closure Report

**What it does:** When a dispatch is closed, generates a professional service completion summary to send to the client.

**Q360 data used:** problem reported vs. solution applied, technician name, time on site (time bills), parts/equipment, close date.

**Output:** Formal service completion email confirming what was done, by whom, and when.

---

### Automation 3 — Overdue Dispatch Alert

**What it does:** User clicks one button. The app fetches ALL open dispatches from Q360, computes which ones are past their estimated fix time, sends the batch to the AI for analysis, and displays a color-coded dashboard of alert cards showing which calls need immediate attention — ranked by urgency with an AI-written summary and recommended action per call.

**Q360 data used:** all open dispatches (bulk/paginated), `estfixtime` vs. current date, dispatch creation date (fallback), customer/site, assigned tech, problem description, priority level, computed days overdue.

#### AI Configuration
- **Model:** `claude-sonnet-4-6`
- **Streaming:** NO — JSON must be complete before any cards can render. Use a two-phase loading animation instead.
- **max_tokens:** 3000 (JSON output for up to 50 alerts with summaries)

Two-phase loading UX:
- Phase 1: "Fetching open dispatches from Q360..."
- Phase 2: "AI is analyzing X overdue dispatches..."

#### Output Format

The AI returns a JSON object:

```json
{
  "summary": {
    "totalScanned": 45,
    "totalOverdue": 8,
    "critical": 2,
    "high": 4,
    "medium": 2
  },
  "alerts": [
    {
      "dispatchno": "T223225520",
      "urgencyTier": "CRITICAL",
      "daysOverdue": 14,
      "customer": "Anixter Inc.",
      "site": "Wauwatosa, WI",
      "problem": "Hardware equipment failure",
      "techAssigned": null,
      "aiSummary": "Machine-down call with no tech assigned — client waiting 2 weeks.",
      "recommendedAction": "Assign technician and contact customer within 1 hour."
    }
  ]
}
```

Sorted: CRITICAL first → HIGH → MEDIUM. Within each tier: most overdue first.

#### Urgency Tiers

| Tier | Condition |
|---|---|
| CRITICAL | 14+ days overdue, OR no tech assigned AND 7+ days overdue, OR priority = 1 |
| HIGH | 7–13 days overdue |
| MEDIUM | 1–6 days overdue |

#### Q360 Data Fetching

```
POST /api/Record/dispatch?_a=list
Filters: statuscode = OPEN
Columns: dispatchno, callno, customerno, statuscode, date, estfixtime,
         priority, problem, techassigned, customer, site info
Limit: 100 per page — paginate until hasmore != "Y"
```

#### Computing Overdue (Server-Side)

Always use `new Date()` server-side. Never use the client's date.

1. **Try `estfixtime`** — if not null, not `.00`, and parses as a valid date: compute `(today - estfixtime)` in days.
2. **Fallback** — sandbox shows `estfixtime: ".00"` on all records. Fallback: `(today - (dispatch.date + 7 days))`. Any call open more than 7 days counts as overdue under SLA rules.

A dispatch is overdue if computed days > 0.

#### API Route — `POST /api/feature2/overdue`

Steps:
1. `today = new Date()`
2. `fetchAllOpenDispatches()` — paginated Q360 fetch (or `mock.db` rows in mock mode)
3. If 0 dispatches: return empty state payload
4. For each dispatch: `computeDaysOverdue(dispatch, today)`
5. Filter to overdue only (`daysOverdue > 0`)
6. If 0 overdue: return "all within SLA" payload
7. Sort by `daysOverdue` descending
8. Cap at 50 dispatches (prevents prompt overflow)
9. Build prompt with `formatDispatchBlock()` for each record
10. Call AI — non-streaming — `claude-sonnet-4-6`
11. Strip any accidental markdown fences from response
12. `JSON.parse()` the response — if parse fails: return `{ data: null, rawText }`
13. Return `{ success: true, data: parsedJSON }`

#### The Wow Moment

The wow is not the loading animation. It is the specificity of the AI summaries on the red cards. When the sponsor reads:

> *"Machine-down call — client waiting 14 days with no technician assigned. Escalate to dispatch manager immediately."*

They realize the AI is not just sorting numbers. It is reasoning about urgency the way an experienced dispatcher would. That is the moment someone in the audience leans forward.

---

### Automation 4 — New Call Acknowledgement *(Stretch Goal)*

**What it does:** When a new service call is created, auto-drafts a confirmation email to the caller.

**Q360 data used:** caller info, calleremail, problem description, site name, estimated response time.

**Output:** Friendly, professional acknowledgement that the call has been received and is being processed.

---

### Future Automations (Backlog)

- Contract renewal outreach — detect expiring service contracts, draft renewal email
- Technician assignment notification — when a tech is assigned, draft a notification
- Weekly/monthly activity digest — summarize dispatch volume, closed calls, open issues
- Escalation chain email — when a call reaches critical priority, draft escalation to management

---

## 6. UI Components

### Main Page Layout (`/app/feature2/page.tsx`)

Two-column layout on desktop, single column on mobile.

**Left panel:** RecordSelector → AutomationTypeCard grid → ToneSelector → Generate button

**Right panel:** Subject line bar + Email body textarea (streaming/editable) + Copy/Regenerate buttons

### RecordSelector

Styled dropdown. Each option: `[D-2041] Acme Corporation — HVAC Maintenance (IN PROGRESS)`

Detail card below dropdown shows: technician, opened date, status badge.

Status badge colors: `OPEN` → amber, `IN PROGRESS` → blue, `CLOSED` → green

### AutomationTypeCard

2×2 grid of clickable cards. Each has icon, title, one-line description.

Selected: blue ring + light blue background. Unselected: white + gray border.

### ToneSelector

Three pill buttons: `Professional | Friendly | Concise`. Selected: blue background, white text.

### EmailPreviewPanel

- **Subject line bar:** label `SUBJECT` + parsed subject value. Shows "Generating..." while streaming.
- **Email body textarea:** editable after streaming, read-only during. Height ~320px.
- **Streaming indicator:** pulsing dot + "Writing..." text (visible while streaming)
- **Action buttons** (appear after streaming): Copy to Clipboard, Regenerate

### Generate Button

Disabled until a record AND automation type are both selected. While streaming: spinner + "Generating...".

### Overdue Alert Page (`/app/feature2/overdue`)

**Top section:** Scan button (large, red — "Scan for Overdue Dispatches")

**Stats bar** (after scan): Dispatches Scanned | Overdue | Critical

**Filter/sort controls** (client-side, no re-fetch): filter by urgency tier, sort by urgency / days overdue / customer

**Alert cards** — color-coded by tier:
- CRITICAL → red border + red-tinted background
- HIGH → amber border + amber-tinted background
- MEDIUM → yellow border + yellow-tinted background

Each card: urgency badge + dispatch number + days overdue, customer name, site + problem, tech (or "UNASSIGNED" in red), AI summary (italic), recommended action box

**Footer:** Copy Alert List, Export as Email Draft

---

## 7. Implementation Timeline

| Phase | Dates | Work |
|---|---|---|
| Phase 1 — Foundation | April 7–10 | Next.js scaffold, Docker, `.env.local`, verify Q360 + AI connection |
| Phase 2 — Data Layer | April 10–14 | `q360Client.ts` (fetch, compute, format), `/records` and `/overdue` routes |
| Phase 3 — AI Integration | April 14–18 | Prompt templates, `/generate` route, end-to-end Postman tests |
| Phase 4 — UI Build | April 14–21 | All components, stream reader, overdue card renderer |
| Phase 5 — Polish & Deploy | April 21–30 | Error handling, demo data prep, Vercel deploy, 3× rehearsal |

**Targets:** Email generation under 10 seconds. Overdue scan under 6 seconds.

---

## 8. Edge Cases

### Automation 1

| Case | Handling |
|---|---|
| Null Q360 field | `formatDispatchForPrompt()` converts null/empty to `[Not provided]`; AI omits gracefully |
| No `SUBJECT:` line from AI | Fall back to `"Service Update — Dispatch #ID"`; log `console.warn` |
| Q360 down | Return HTTP 502 in live mode; in mock mode require actual `mock.db` rows |
| AI stream interrupted | Push error sentinel to stream; frontend shows inline error, not broken text |

### Automation 3

| Case | Handling |
|---|---|
| `estfixtime` is `.00` or null | Fallback: `dispatch.date + 7-day SLA` — handled in `computeDaysOverdue()` |
| Zero overdue dispatches | Return "all within SLA" payload; show green checkmark in UI |
| 50+ overdue dispatches | Cap at 50 in API route; show truncation notice in UI |
| Q360 returns no dispatches | Check status code filter; return empty state payload |
| AI returns invalid JSON | Strip markdown fences, retry parse; if still fails, return `rawText` to frontend |
| Q360 down during demo | Use mock mode with seeded `mock.db` dispatch rows or show the live error state |

---

## 9. Demo Scripts

### Automation 1 — Project Status Email (2–3 min)

> "One of the biggest time sinks in field service is communication — writing status updates, service reports, follow-ups. A coordinator might write dozens of these a day, all manually. We built a suite that does this in one click."

**[Select a dispatch from the dropdown]**

> "Here's a real open service call from Q360 — customer, site, problem, technician assigned."

**[Select "Project Status Email", click Generate]**

> "The AI reads the record and writes a professional email — subject and body — in real time. It knows the customer's name, the site, the current status. It didn't make anything up — it's working entirely from your data."

**[Switch tone to Friendly, click Regenerate]**

> "One click rewrites it in a different tone. This same system works for service closure reports, overdue alerts, and more."

---

### Automation 3 — Overdue Dispatch Alert (2 min)

> "Right now, coordinators manually check the dispatch queue every morning to find calls that are running late — open Q360, filter by status, check dates, write a report. 20–30 minutes per coordinator, every day."

**[Click Scan — show loading phases]**

> "Watch what happens when I click one button."

**[Results appear]**

> "In 4 seconds: 45 dispatches scanned, 8 overdue, 2 critical. This one: Anixter Inc., 14 days overdue, no technician assigned. The AI says: *Machine-down call — client has been waiting 2 weeks. Escalate to dispatch manager immediately.* That is not a lookup. That is a judgment call that normally takes a human to make."

**[Filter to critical-only]**

> "The same AI that wrote that client email just audited your entire open dispatch queue and told your manager exactly what needs attention today. Proactively. Automatically."

---

## 10. Demo Data Prep *(Critical — complete before April 25)*

### For Automation 1

In Postman, find 3–5 dispatches in the sandbox with: real customer name, populated problem description, assigned technician, clear status (OPEN or IN PROGRESS). Write down their dispatch numbers — go straight to these during the demo.

### For Automation 3

Create 8–10 dispatches via `POST /api/Record/dispatch` with:
- At least 3 different customer names
- Mix of problem types: HARDWARE, SOFTWARE, NETWORK
- Some with tech assigned, some without (UNASSIGNED is more dramatic)
- `date` values set 3, 7, 10, and 14+ days before the demo date
- Some with `priority: 1`

Run a full test scan the morning of the demo. Backup plan: have a screen recording of a previous successful scan ready — never demo with no fallback.

---

## 11. How the Two Primary Automations Differ

| | Automation 1 (Status Email) | Automation 3 (Overdue Alert) |
|---|---|---|
| Input | One dispatch record | Entire open queue |
| AI role | Writer / communicator | Analyst / prioritizer |
| Output | Streaming email text | Dashboard of cards |
| Interactivity | Edit text, switch tone | Filter / sort cards |
| Emotional register | "That is convenient" | "That is powerful" |
| Demo order | Goes first — establishes the concept | Goes second — shows scale |

---

## 12. Research Items

Assign one item per team member, track in Slack.

### R1 — Framework Comparison: Next.js vs Alternatives
Confirm Next.js App Router is the right call over Remix or SvelteKit. Evaluate on: combined frontend+backend, built-in API routes (credentials stay server-side), Vercel deployment, Docker compatibility.
**Deliverable:** Short Slack summary with recommendation.

### R2 — AI API: Streaming Responses in Next.js
Research: `@anthropic-ai/sdk` stream method, Next.js `Response` with `ReadableStream`, frontend reading a streaming response with `fetch()` and updating React state incrementally.
**Deliverable:** Working proof-of-concept snippet streaming output to a browser textarea.

### R3 — Q360 Sandbox Data Exploration
1. `GET /api/DataDict?_a=tableList` — list all tables
2. `GET /api/DataDict?_a=columnList&_t=dispatch` — see dispatch columns
3. `POST /api/Record/dispatch?_a=list` with `limit: 10` — see real records
4. Repeat for `customer`, `site`, `timebill`
5. Note which fields are consistently populated vs. usually null

**Deliverable:** Short notes listing which fields are safe to use in AI prompts.

### R4 — Prompt Engineering: Email Quality
Research: system vs. user prompt structure, injecting Q360 data cleanly, tone control, output format control (`SUBJECT:` line parsing).
**Deliverable:** 2–3 tested prompt templates in `lib/emailPrompts.ts`. Test manually in the AI playground first before wiring into code.

### R5 — Docker + Next.js Setup
`Dockerfile` (multi-stage: deps → build → runtime), `docker-compose.yml` for local dev with hot reload, passing `.env.local` into the container safely.
**Deliverable:** Working `Dockerfile` + `docker-compose.yml` — any team member runs `docker-compose up` and gets the app running.

### R6 — Email Sending: Resend API (Phase 2 Prep)
Research Resend free tier, `resend` npm package, how to structure Phase 1 code so that adding `resend.send()` is a 10-line change.
**Deliverable:** Short architecture note showing where the `resend.send()` call slots into the existing flow.

---

## 13. Future-Proofing Decisions

| Decision | What We're Doing | Why |
|---|---|---|
| Email sending | Draft-only now, Resend API later | Generate endpoint already returns subject + body — adding `resend.send()` is a 10-line addition |
| Prompt templates | Functions in `lib/emailPrompts.ts` | Add new automation types without touching route logic |
| Docker | Containerized from day one | Works identically on every team machine; Railway/Render deploy later requires zero changes |
| Streaming | Built in from day one | Handles long AI outputs gracefully; future automations inherit it for free |
| Q360 client | Abstracted behind `lib/q360Client.ts` | If Q360 changes an endpoint or we add tables, change one file |
| TypeScript types | All Q360 shapes in `/types/q360.ts` | Prevents runtime errors as we expand to more Q360 tables |

---

## 14. Open Questions

1. **AI API Key** — Who on the team is getting the Anthropic API key? Every developer needs it in `.env.local`. Team leader should own this and share via a password manager, not Slack plaintext.
2. **`estfixtime` field format** — Sandbox shows `.00` for this field. Before the demo, confirm the actual format via `GET /api/DataDict?_a=columnList&_t=dispatch` and try creating a dispatch with a known value.
3. **Sandbox status codes** — Confirm `OPEN` is the correct `statuscode` value for active dispatches. There may also be `PENDING` or other in-progress codes. Verify in Postman before hardcoding the filter.
4. **Sandbox data quality** — Once R3 is done, confirm the sandbox has enough populated fields to make AI output look good. If not, ask the sponsor to add richer test records.
5. **Team assignments** — Which team member is doing which research item (R1–R6)? Assign in Slack and track.
