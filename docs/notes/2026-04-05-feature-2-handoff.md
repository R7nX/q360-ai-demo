# Feature 2 Handoff Notes (2026-04-05)

## Branch / PR

- Branch: `feature/2-utility-suite`
- PR: `#21` (`R7nX/q360-ai-demo`)

## Commits Added

- `2579083` - core shared Feature 2 implementation
- `1f6dc24` - Feature 2 docs refresh
- `5b26546` - tests for shared tools/routes/components

## Current Verified State

- Tests pass: `npm test` -> `145` tests, `14` files
- Lint pass: `npm run lint`
- Build in this restricted environment is currently blocked by `next/font` Google Fonts fetch (`Geist`, `Geist Mono`); earlier branch-local build verification had passed before this environment constraint surfaced

## 2026-04-06 Review Follow-Up Applied

- expanded the shared entity contract to the documented Team 2 set:
  - `dispatch`
  - `project`
  - `customer`
  - `servicecontract`
  - `timebill`
- updated shared entity resolution so `/api/ai/*` can resolve live Q360 records instead of relying only on mock DB and bundled demo fallbacks
- added the missing shared `EmailDrafter` component and aligned shared component exports with the documented named-import handoff surface
- preserved mock/fallback behavior for local/demo use rather than removing it

## Key Implementation Notes

- Shared resolver/service now exist:
  - `lib/entityResolver.ts`
  - `lib/draftEmailService.ts`
  - `lib/aiToolsService.ts`
- Shared resolver now supports live Q360 resolution for:
  - `dispatch`
  - `project`
  - `customer`
  - `servicecontract`
  - `timebill`
- `/api/feature2/generate` is now a thin wrapper over shared draft logic.
- `/api/ai/draft-email` supports `?format=json` and streaming default.
- Shared routes now implemented:
  - `/api/ai/summarize`
  - `/api/ai/recommend`
  - `/api/ai/status-report`
  - `/api/ai/smart-reply`
- Shared components now implemented and mounted on `/feature2` as a harness:
  - `EmailDrafter`
  - `DataSummary`
  - `ActionRecommender`
  - `StatusReport`
  - `SmartReply`

## Remaining Known Gaps

- Need real sandbox validation with at least 3 real IDs per shared tool for final handoff confidence.
- `docs/plans/project-master-plan.md` still includes unrelated pending items (`app/api/n8n/webhook/route.ts`, `components/ai/AiToolWrapper.tsx`) not completed in this pass.

## Environment / Execution Notes

- In this environment, `npm test` / `npm run build` can require elevated execution due Windows `spawn EPERM`.
- `git push` can fail in normal sandbox with Schannel credentials error and may require elevated execution in this setup.
