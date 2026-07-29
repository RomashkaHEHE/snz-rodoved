# Test To Production Port

## Status

DONE

## Priority

High

## Goal

Move unambiguous reliability, privacy, data-safety, performance, and accessibility
improvements from the experimental `test` product into the stable production
application without silently adopting experimental product workflows.

Document every remaining product difference so it can be reviewed separately.

## Current understanding

- `main` is the stable production product at `snz-rodoved.ru`.
- `test` is an isolated product experiment, not a staging copy of production.
- Technical safeguards may be ported when they preserve the existing production
  workflow and meaning.
- Focused survey navigation, workspace task modes, contact queues, mobile wizards,
  and other workflow redesigns require an explicit product decision.
- Work was performed in a separate `main` worktree; experimental frontend files
  and test-domain data were not included.

## Relevant files

- `docs/test-production-differences.md`
- `packages/shared/src/index.ts`
- `packages/db/src/migrate.ts`
- `packages/db/src/repository.ts`
- `packages/db/src/schema.ts`
- `apps/api/src/app.ts`
- `apps/api/src/csv.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/api/client.ts`
- `apps/web/src/components/OnlineSurveyPage.tsx`
- `apps/web/src/components/ResponsesTable.tsx`
- `apps/web/src/components/SegmentedControl.tsx`

## Next steps

- Review `docs/test-production-differences.md` with the product owner and move
  approved workflow changes as separate tasks.
- After production deploy, confirm migrations `0008_response_consents` and
  `0010_response_trash` are recorded and `/api/health` remains healthy.

## Exit criteria

- Ordinary questionnaire deletion is recoverable and deleted rows are excluded
  from active lists, analytics, filters, and CSV.
- Fake-only cleanup cannot permanently remove real rows, including trashed rows.
- CSV omits name and phone by default; contact export is a separate confirmed action.
- Contacts are masked in the production table by default.
- Public contact phones are validated and online processing consent is required
  and stored.
- Large response slices mount in bounded batches without changing totals or export.
- Segmented controls support roving keyboard navigation.
- Non-ported differences are documented with rationale and review questions.
- Required verification commands pass.

## Completed work

- Added recoverable questionnaire deletion and protected fake-only cleanup.
- Added server-enforced contact-safe CSV export and a confirmed contact export.
- Masked table contacts by default.
- Added public phone validation and stored processing consent.
- Added bounded response rendering and roving segmented-control keyboard input.
- Updated vulnerable Fastify dependencies.
- Fixed mobile online-demographic overflow at 375 px.
- Documented all deferred product differences in
  `docs/test-production-differences.md`.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run test` (`29` tests)
- `npm run build`
- `npm audit --omit=dev` (`0` known vulnerabilities)
- `git diff --check`
- Browser QA at `1280x720` and `375x812` for `/survey` and `/data`
- Browser console: no warnings or errors
