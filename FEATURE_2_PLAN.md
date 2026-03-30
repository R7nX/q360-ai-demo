# FEATURE_2_PLAN.md — Automated Utility Suite

> **Owner:** Team 2
> **Feature:** AI for Repetitive Tasks — Smart Drafting & Scalable Automation
> **Deadline:** End of April 2026
> **Status:** Planning phase

---

## 1. Feature Overview

The Automated Utility Suite embeds generative AI directly into the highest-friction manual tasks a Q360 user performs daily. Instead of a user reading through a dispatch record, opening their email client, and writing an update from scratch — they click one button and get a polished, professional draft in seconds, pre-filled with real data from Q360.

**Phase 1 Demo Goal (End of April):**
A working UI where a user selects a Q360 record, picks an automation type, and receives an AI-generated email draft they can review and copy.

**Phase 2 Goal (Post-demo):**
The same flow, but the email is actually sent via an email provider (Resend/SendGrid) directly from the app.

---

## 2. Automation Types

These are the specific AI-powered automations we are building, ordered by demo priority.

### Automation 1 — Project Status Email ⭐ PRIMARY DEMO
**What it does:** Pulls a dispatch or project record from Q360 and generates a professional client-facing status update email.

**Q360 data used:**
- Customer name, contact email
- Project/dispatch title, number
- Current status code
- Technician assigned
- Problem description, solution (if any)
- Estimated fix time, open date, close date

**Output:** A complete email: subject line, greeting, status summary, next steps, sign-off.

**Why this is the demo centerpiece:** It's immediately understandable to any audience, visually impressive, and shows direct value from real data.

---

### Automation 2 — Service Call Closure Report
**What it does:** When a dispatch is closed, generates a professional service completion summary to send to the client.

**Q360 data used:**
- Problem reported vs. solution applied
- Technician name, time on site (time bills)
- Parts/equipment involved
- Close date

**Output:** A formal service completion email confirming what was done, by who, and when.

---

### Automation 3 — Overdue Dispatch Alert
**What it does:** Scans all open dispatches past their estimated fix time and generates an internal escalation email or a prioritized alert list.

**Q360 data used:**
- All open dispatch records
- `estfixtime` vs. current date comparison
- Customer, site, assigned tech

**Output:** An internal escalation email or summary identifying which calls need immediate attention.

---

### Automation 4 — New Call Acknowledgement *(Stretch Goal)*
**What it does:** When a new service call is created, auto-drafts a confirmation email to the caller.

**Q360 data used:**
- New dispatch: callerno, calleremail, problem, sitename, estimated response

**Output:** A friendly, professional acknowledgement that the call has been received and is being processed.

---

### Future Automations (Research & Backlog)
These are additional repetitive touchpoints identified in Q360 that could be automated later:
- **Contract renewal outreach** — detect expiring service contracts, draft renewal email
- **Technician assignment notification** — when a tech is assigned, draft a notification
- **Weekly/monthly activity digest** — summarize dispatch volume, closed calls, open issues
- **Escalation chain email** — when a call reaches critical priority, draft an escalation to management

---

## 3. Technical Architecture

### Data Flow

```
User opens Automation Suite page
    │
    ▼
UI: Select record (dispatch or project) + Select automation type
    │
    ▼  POST /api/feature2/generate
Next.js API Route (server-side)
    │
    ├──► Q360 REST API
    │    GET /api/Record/{tablename}  (fetch dispatch/project + customer + site data)
    │    ◄── returns structured JSON
    │
    ├──► Data formatter (build clean context from raw Q360 response)
    │
    └──► Claude API (claude-sonnet-4-6)
         Prompt: system context + formatted Q360 data + user's tone/instructions
         ◄── streams generated email text
    │
    ▼
Frontend receives streamed text → displays in editable preview panel
    │
    ▼
User reviews → Copy to clipboard  (Phase 1)
               OR  Send via Resend (Phase 2)
```

### Why Streaming Matters for the Demo
Instead of waiting and getting the email all at once, streaming the Claude response makes it look like the AI is "typing" the email live in front of the sponsor. This is visually much more impressive and clearly demonstrates AI in action.

### File Structure (inside the Next.js project)

```
/app
  /feature2
    page.tsx                   ← Main Automation Suite UI page
    /components
      RecordSelector.tsx        ← Search/pick a dispatch or project
      AutomationTypeCard.tsx    ← Card buttons for each automation type
      EmailPreviewPanel.tsx     ← Editable draft output + copy button
      ToneControls.tsx          ← Tone/length adjustment sliders (optional)

/app/api/feature2
  /generate/route.ts            ← POST endpoint: fetches Q360 data, calls Claude, streams response
  /records/route.ts             ← GET endpoint: fetches dispatch/project list for the selector

/lib
  q360Client.ts                 ← Q360 REST API wrapper (all fetch logic)
  claudeClient.ts               ← Claude API wrapper (prompt builder + streaming)
  emailPrompts.ts               ← Prompt templates for each automation type

/types
  q360.ts                       ← TypeScript interfaces for Q360 data shapes
  feature2.ts                   ← Types for automation request/response
```

---

## 4. Research Items

Before building, the team needs to research and document decisions on each of these. Assign one item per person.

### R1 — Framework Comparison: Next.js vs Alternatives
**Question:** Is Next.js the right choice, or should we consider Remix, SvelteKit, or a separate React + Express setup?

**Evaluate on:**
- Ease of combined frontend + backend in one repo
- Built-in API routes (needed to keep Q360/Claude credentials server-side)
- Deployment simplicity (Vercel free tier)
- Learning curve for the team
- Docker compatibility

**Recommendation to validate:** Next.js App Router wins on all criteria for this use case. Verify by reviewing Remix and SvelteKit deployment docs.

**Deliverable:** 1-page comparison doc or a short Slack summary with recommendation.

---

### R2 — Claude API: Streaming Responses in Next.js
**Question:** How do we stream a Claude API response from a Next.js API Route to the browser?

**Key concepts to research:**
- Anthropic SDK (`@anthropic-ai/sdk`) — `stream()` method
- Next.js `Response` with `ReadableStream`
- Frontend: reading a streaming response with `fetch()` and updating React state incrementally

**Deliverable:** A working proof-of-concept snippet (even just in a test file) that streams Claude output to a browser text area.

**Starting point:** Anthropic docs → "Streaming" section.

---

### R3 — Q360 Sandbox Data Exploration
**Question:** What data is actually available in the sandbox? What dispatch/project records exist, and which fields are populated vs. null?

**Steps:**
1. Open Postman with `Q360API_UTAH` credentials
2. Call `GET /api/DataDict?_a=tableList` — list all tables
3. Call `GET /api/DataDict?_a=columnList&_t=dispatch` — see dispatch columns
4. Call `POST /api/Record/dispatch?_a=list` with a broad filter and `limit: 10` — see real records
5. Repeat for `projects`, `customer`, `site` tables
6. Note which fields are consistently populated — these are safe to use in AI prompts
7. Note which fields are usually null — don't rely on these in prompts

**Deliverable:** A short notes doc (even a Slack message) listing: "Here's what data we have in sandbox that's useful for email generation."

---

### R4 — Prompt Engineering: Email Generation Quality
**Question:** How do we write Claude prompts that produce consistently professional, accurate emails?

**Key techniques to research:**
- System prompt vs. user prompt — what belongs in each
- How to inject structured data (Q360 JSON) into a prompt cleanly
- Few-shot examples — providing 1 example of a good email in the prompt
- Tone control — how to let the user pick "formal", "friendly", "concise"
- Output format control — asking Claude to return subject line separately from body

**Deliverable:** 2-3 tested prompt templates (in `emailPrompts.ts`) that produce good results for Automation 1 (Project Status Email). Run them manually in Claude.ai first to validate before wiring into code.

---

### R5 — Docker + Next.js Setup
**Question:** How do we containerize a Next.js app cleanly for local dev and future deployment?

**Key things to figure out:**
- `Dockerfile` for Next.js (multi-stage build: deps → build → runtime)
- `docker-compose.yml` for local dev with hot reload
- Passing `.env.local` variables into the container safely
- Whether `docker-compose watch` or volume mounts work for dev hot-reload

**Deliverable:** A working `Dockerfile` + `docker-compose.yml` that lets any team member run `docker-compose up` and get the app running locally.

---

### R6 — Email Sending: Resend API (Phase 2 Prep)
**Question:** How would we wire in actual email sending later without a big refactor?

**Research:**
- Resend free tier limits and setup
- `resend` npm package — how to send an email from a Next.js API route
- How to structure the Phase 1 code (draft-only) so that swapping in real sending is a 10-line change, not a refactor

**Deliverable:** A short architecture note showing where the `resend.send()` call would slot in to the existing flow.

---

## 5. Step-by-Step Implementation Plan

### Phase 1 — Environment & Foundation (Target: April 7–10)

**Step 1: Initialize the Next.js project**
- `npx create-next-app@latest q360-ai-demo --typescript --tailwind --app`
- Set up folder structure as shown in section 3
- Commit to `feature/2-utility-suite` branch

**Step 2: Set up Docker**
- Write `Dockerfile` (multi-stage)
- Write `docker-compose.yml` for local dev
- Write `.env.example` with all required variable names (no values)
- Test: `docker-compose up` should start the app

**Step 3: Configure environment variables**
```
# .env.local (never committed)
Q360_BASE_URL=http://rest.q360.online
Q360_API_USERNAME=Q360API_UTAH
Q360_API_PASSWORD=Arguably7-Promoter-Smith
ANTHROPIC_API_KEY=your_claude_api_key_here
```

**Step 4: Verify Q360 connection**
- Write `lib/q360Client.ts` with a `fetchRecords()` function
- Create a test API route `GET /api/feature2/test-connection`
- Confirm it returns data from `dispatch` table in sandbox

**Step 5: Verify Claude connection**
- Write `lib/claudeClient.ts` with a basic `generateText()` function
- Create a test API route `GET /api/feature2/test-claude`
- Confirm it returns a response from `claude-sonnet-4-6`

---

### Phase 2 — Data Layer (Target: April 10–14)

**Step 6: Build Q360 record fetching**

In `lib/q360Client.ts`:
- `getDispatchList(filters?)` — fetch open/recent dispatches with customer + site joined
- `getDispatchById(dispatchno)` — fetch single dispatch with full detail
- `getProjectList(filters?)` — fetch active projects
- `getProjectById(projectno)` — fetch single project detail

In `/app/api/feature2/records/route.ts`:
- `GET /api/feature2/records?type=dispatch` — returns list for the UI selector
- `GET /api/feature2/records?type=dispatch&id=T223225520` — returns single record detail

**Step 7: Build data formatter**

In `lib/q360Client.ts`:
- `formatDispatchForPrompt(dispatch)` — takes raw Q360 dispatch JSON, returns a clean, readable string that can be injected into a Claude prompt
- Example output:
```
Service Call: T223225520
Customer: Anixter Inc. (ANI001)
Site: 4420 N. Harley Davidson Ave, Wauwatosa, WI
Status: OPEN
Problem: Equipment Issue (HARDWARE)
Assigned Tech: [none]
Opened: 2026-02-03
Priority: 2
```

---

### Phase 3 — AI Integration (Target: April 14–18)

**Step 8: Write prompt templates**

In `lib/emailPrompts.ts`, write and test prompt templates for each automation:

```typescript
export function projectStatusEmailPrompt(data: string, tone: string): string {
  return `You are a professional field service coordinator writing on behalf of the company.

Below is a service call record pulled from our system:

${data}

Write a professional ${tone} status update email to the customer.
Format your response as:
SUBJECT: [subject line]
---
[email body]

Keep it concise, factual, and reassuring. Do not invent information not present in the data.`
}
```

Test these prompts manually in Claude.ai with real sandbox data before wiring them in.

**Step 9: Build the generate endpoint**

In `/app/api/feature2/generate/route.ts`:
```
POST /api/feature2/generate
Body: { recordType: "dispatch", recordId: "T223225520", automationType: "project-status", tone: "professional" }

1. Fetch record from Q360 using q360Client
2. Format data with formatDispatchForPrompt()
3. Build prompt using emailPrompts.ts
4. Call Claude API with streaming enabled
5. Return streamed response to browser
```

**Step 10: End-to-end test (no UI yet)**
- Use Postman to hit `POST /api/feature2/generate` with a real dispatch ID
- Confirm you get a streamed email draft back
- Iterate on the prompt until quality is consistently good

---

### Phase 4 — UI Build (Target: April 14–21)

**Step 11: Build the main page layout**

`/app/feature2/page.tsx`:
- Page title: "Automated Utility Suite"
- Two-column layout: left = controls, right = email preview

**Step 12: Build the Record Selector**

`RecordSelector.tsx`:
- Dropdown or searchable list showing dispatch/project records from Q360
- Pulls from `GET /api/feature2/records`
- Shows: record number, customer name, status, date
- On selection: stores selected record ID in state

**Step 13: Build the Automation Type Cards**

`AutomationTypeCard.tsx`:
- 3-4 clickable cards: "Project Status Email", "Service Closure Report", "Overdue Alert"
- Each card has an icon, title, and 1-line description
- Selected card is highlighted

**Step 14: Build the Generate Button + Loading State**
- "Generate Email" button (disabled until both a record and automation type are selected)
- On click: POST to `/api/feature2/generate`, show a loading spinner or "AI is writing..." state
- Stream the response into the preview panel as it arrives

**Step 15: Build the Email Preview Panel**

`EmailPreviewPanel.tsx`:
- Editable textarea showing the generated email (pre-filled by AI, user can edit)
- Subject line shown separately above the body
- "Copy to Clipboard" button
- "Regenerate" button (re-runs the same request for a different draft)
- Word count / character count (small, bottom corner)

**Step 16: Add Tone Controls (Optional Enhancement)**

`ToneControls.tsx`:
- Simple toggle or dropdown: "Professional" / "Friendly" / "Concise"
- Passed as a parameter to the generate endpoint
- Changes the tone instruction in the Claude prompt

---

### Phase 5 — Polish & Deploy (Target: April 21–30)

**Step 17: Error handling**
- If Q360 API is unreachable → friendly error message in UI
- If Claude API fails → retry button, clear error state
- If record has too many null fields → graceful prompt degradation (Claude is instructed to note missing info rather than hallucinate)

**Step 18: Demo data prep**
- In Postman, explore the sandbox and identify 3-5 "good demo records" — dispatches and projects with enough populated fields to produce an impressive email
- Note their IDs so you can go straight to them during the demo

**Step 19: Deploy to Vercel**
- Push `feature/2-utility-suite` branch to GitHub
- Connect repo to Vercel
- Add environment variables in Vercel dashboard
- Get a public demo URL

**Step 20: Demo rehearsal**
- Run through the demo script below at least 3 times
- Ensure the AI output is consistently good for the chosen demo records
- Time it — the email should appear in under 10 seconds

---

## 6. Demo Script (Live Sponsor Presentation)

> Use this as the talking script when presenting Feature 2 in the meeting.

**[Navigate to the Automated Utility Suite page]**

> "One of the biggest time sinks in any field service operation is communication — writing status updates, service reports, follow-up emails. A coordinator might write dozens of these a day, all manually.

> "We've built a suite that does this in one click. Let me show you."

**[Select a dispatch record from the list]**

> "Here's a real open service call from your Q360 system — it has the customer, the site, the problem reported, the technician assigned."

**[Select "Project Status Email" card]**

> "I want to send this customer a professional status update."

**[Click "Generate Email" — watch AI stream the response]**

> "The AI reads the record, understands the context, and writes a professional email — subject line and body — in real time."

**[Wait for streaming to complete]**

> "It knows the customer's name, the site, the problem, the current status. It didn't make anything up — it's working entirely from your data."

**[Show the editable text area]**

> "The coordinator can edit anything before sending. And if they want a different tone—"

**[Switch to "Friendly" tone, click Regenerate]**

> "—one click rewrites it. This same system works for service closure reports, overdue dispatch alerts, and more."

**[Briefly show the Overdue Alert automation]**

> "This one scans all open dispatches past their estimated fix time and drafts an internal escalation. What used to take 20 minutes of manual review is instant."

---

## 7. Future-Proofing Notes

These decisions are made now so we don't have to redo them later:

| Decision | What We're Doing | Why |
|----------|-----------------|-----|
| **Email sending** | Draft-only now, Resend API later | The generate endpoint already returns email text + subject — plugging in `resend.send()` is a 10-line addition |
| **Prompt templates** | Stored in `lib/emailPrompts.ts` as functions | Easy to add new automation types without touching route logic |
| **Docker** | Containerized from day one | Works the same on any team member's machine; deploying to Railway/Render later requires zero changes |
| **Streaming** | Built in from day one | Already handles long AI outputs gracefully; future automations inherit it for free |
| **Q360 client** | Abstracted behind `lib/q360Client.ts` | If Q360 changes an endpoint or we add more data, we change one file |
| **TypeScript types** | All Q360 shapes typed in `/types/q360.ts` | Prevents runtime errors as we add more Q360 tables |

---

## 8. Open Questions

> Things that still need answers or decisions before/during build:

1. **Claude API Key** — Who on the team is getting the Anthropic API key? It needs to be in `.env.local` on every developer's machine. Team leader should own this and share securely (not via Slack plaintext — use a password manager or shared `.env` file via a secure channel).
2. **Sandbox data quality** — Once we do the R3 research (Step 6 data exploration), we'll know if the sandbox has enough populated fields to make the AI output look good. If not, we may need to ask the sponsor to add richer test records.
3. **GitHub repo** — The user will request repo creation separately. Once created, the branch name for this team is: `feature/2-utility-suite`.
4. **Team assignment** — Which team member is doing which research item (R1–R6)? Assign in Slack and track.
