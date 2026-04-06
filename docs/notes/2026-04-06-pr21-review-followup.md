# PR #21 Review Follow-Up (2026-04-06)

## Purpose

Capture the issues identified during review of PR `#21` before implementation work begins, and define the fix plan for bringing the branch in line with the documented Team 2 handoff contract.

This note is intentionally written before code changes. It is the working contract for the follow-up pass.

## Review Summary

The review identified three merge-blocking contract problems:

1. The new shared AI routes are still mock/fallback-first and do not reliably resolve real Q360 sandbox IDs.
2. The shared AI entity contract is still hard-coded to `dispatch`, even though the plan and handoff docs describe broader support.
3. The docs instruct other teams to import shared components in ways that do not match what this branch actually exports or includes.

## What The Problems Mean

### 1. Shared AI routes are not truly usable with real sandbox records yet

Current behavior:

- `lib/entityResolver.ts` resolves records from `mock.db` and bundled fallback arrays.
- The shared service layer (`lib/aiToolsService.ts`, `lib/draftEmailService.ts`) depends on that resolver.
- The resolver does not currently fetch live entities through the shared Q360 client.

Why this matters:

- A real sandbox record ID that is not present in `mock.db` or fallback demo data will fail resolution.
- That makes `/api/ai/*` unreliable for the "real sandbox ID" validation explicitly called out in the Feature 2 handoff docs.
- The branch is therefore not yet providing a genuinely reusable shared integration surface for Teams 1 and 3.

### 2. The documented shared entity contract does not match the actual code

Current behavior:

- `types/feature2.ts` defines `AiEntityType` as only `"dispatch"`.
- `lib/draftEmailService.ts` only normalizes and accepts `dispatch`.
- `lib/entityResolver.ts` throws for every non-dispatch entity type.

Why this matters:

- The docs describe support for `project`, `customer`, `servicecontract`, and `timebill`.
- Integration examples in the planning docs show Team 1 or Team 3 using shared tools with non-dispatch entities.
- In the current branch, those examples cannot compile cleanly or run successfully.

### 3. The handoff docs describe component imports that do not match the branch snapshot

Current behavior:

- The planning docs instruct consumers to import `EmailDrafter` and `ActionRecommender` as named exports.
- This branch does not currently include `components/ai/EmailDrafter.tsx`.
- `components/ai/ActionRecommender.tsx` currently exports a default component, not a named export.

Why this matters:

- Another team following the documented integration example can hit import or build failures immediately.
- Even if the underlying AI routes worked, the handoff would still be misleading.

## Scope Decision

This follow-up should make the branch match the documented Team 2 shared-tool contract.

This means the fix direction is:

- broaden the implementation to support the documented shared contract
- preserve mock/fallback support as a secondary path
- make component/docs exports consistent with the public integration story

This follow-up should not solve the review by merely narrowing docs to "dispatch-only mock demo" unless a deliberate scope reduction is requested by the team lead.

## Fix Plan

### Step 1. Expand the shared entity contract

Update the shared Feature 2 types so the code-level contract matches the documented one:

- `dispatch`
- `project`
- `customer`
- `servicecontract`
- `timebill`

Targets:

- `types/feature2.ts`
- any helper/service types that currently assume dispatch-only behavior

Expected outcome:

- shared routes and components can accept the documented entity types without type-level rejection

### Step 2. Introduce live Q360-backed entity resolution

Rework the shared resolver so it can resolve entities from live Q360 data through the existing shared client instead of depending only on SQLite and fallback arrays.

Targets:

- `lib/entityResolver.ts`
- `lib/q360Client.ts` if new single-record helpers are needed for project, customer, service contract, or time bill lookup

Expected outcome:

- when valid Q360 credentials are present, `/api/ai/*` can resolve real sandbox records that are not seeded in `mock.db`
- mock DB and bundled fallback records remain as development/demo fallback behavior

### Step 3. Support the documented entity types end-to-end in the shared service layer

Update the shared drafting and AI-tool services so they no longer assume all prompts are built from dispatch-only data.

Targets:

- `lib/draftEmailService.ts`
- `lib/aiToolsService.ts`
- prompt-shaping logic as needed

Expected outcome:

- shared routes can accept the broader entity contract and produce useful output for each supported entity type
- dispatch-specific enrichment stays available where relevant

### Step 4. Fix the shared component handoff surface

Make the public component contract match the docs, or update the docs to match the actual intended public API if a different export shape is preferred.

Targets:

- `components/ai/EmailDrafter.tsx`
- `components/ai/ActionRecommender.tsx`
- any related component index/export usage

Expected outcome:

- the documented consumer imports are real and stable
- Teams 1 and 3 can integrate the shared components without import mismatches

### Step 5. Align the documentation with the final implementation

Once the code contract is fixed, update the planning and handoff docs to remove stale or misleading statements.

Targets:

- `docs/plans/FEATURE_2_PLAN.md`
- `docs/notes/2026-04-05-feature2-handoff.md`
- `docs/plans/PROJECT_MASTER_PLAN.md` if integration examples or export assumptions need correction

Expected outcome:

- the written handoff accurately reflects what the branch now provides

### Step 6. Verify both contract and runtime behavior

Verification should cover both branch-local correctness and shared-team usability.

Required checks:

- type-safe usage for the documented entity types
- tests covering non-dispatch entity handling and resolver behavior
- route/service tests for real resolution flow vs fallback flow where practical
- import/export correctness for shared components
- manual validation with real sandbox IDs when credentials/network are available

Expected outcome:

- the branch can be merged as an actual reusable Team 2 handoff rather than a dispatch-only local demo

## Implementation Order

Use this order to minimize churn:

1. shared types
2. resolver and live Q360 lookup helpers
3. service-layer support
4. shared component surface
5. docs alignment
6. verification

## Non-Goals For This Pass

These items are not required unless they become necessary while fixing the review findings:

- implementing unrelated planned-only items such as `app/api/n8n/webhook/route.ts`
- broad UI redesign of Feature 2 pages
- production-hardening beyond what is needed for the demo and shared-team integration

## Success Criteria

This follow-up is complete when all of the following are true:

- `/api/ai/*` can resolve supported entities from live Q360 data instead of only local mock/fallback data
- the shared entity type contract matches the documented Team 2 contract
- the documented shared component imports compile and exist in the branch
- Feature 2 docs and handoff notes accurately describe the real state of the branch
- tests and validation provide confidence that Teams 1 and 3 can consume the shared surface as documented

## Implementation Outcome (2026-04-06)

Implemented in this follow-up:

- expanded `AiEntityType` to the documented shared entity set:
  - `dispatch`
  - `project`
  - `customer`
  - `servicecontract`
  - `timebill`
- updated `lib/entityResolver.ts` to resolve live Q360 records through the shared client, while retaining mock DB and bundled fallback support for local/demo flows
- added live Q360 lookup helpers and normalized entity shapes for project, service contract, and time bill resolution
- updated the shared draft-email flow so `context` is preserved end-to-end instead of being dropped by the route/service layer
- added the missing shared `components/ai/EmailDrafter.tsx`
- updated shared component exports so named imports now work for the documented handoff surface
- mounted `EmailDrafter` in the `/feature2` shared component gallery
- refreshed Feature 2 handoff docs to remove the stale dispatch-first limitation

Verification completed:

- `npm test`
- `npm run lint`
- `npm run build`
