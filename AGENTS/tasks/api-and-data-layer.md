# Task: API And Data Layer

Status: DONE
Priority: High

## Goal

Provide persistent survey storage, auth-protected CRUD, filters, and analytics for the admin UI.

## Current Understanding

- SQLite is the v1 production database.
- Drizzle owns typed schema/query construction.
- Zod schemas in `packages/shared` are the input contract.
- Single-admin cookie auth is enough for v1 but should not block future multi-user auth.
- Workspace auth uses password-only access for `/editor` and `/data`.
- CSV export uses the same filters as response listing.
- Fake responses are first-class rows with `is_fake='true'`; bulk fake deletion must only delete rows with that flag.

## Relevant Files

- `packages/shared/src/index.ts`
- `packages/db/src/schema.ts`
- `packages/db/src/repository.ts`
- `apps/api/src/app.ts`
- `apps/api/src/analytics.ts`

## Next Steps

1. Add pagination only if real datasets become too large for the current all-filtered-results flow.
2. Add XLSX only if CSV is not enough for real use.
3. Keep fake-data tooling visibly marked and impossible to confuse with real rows.

## Exit Criteria

- Auth protects responses and analytics.
- CRUD works against SQLite.
- Filters apply consistently to table and analytics.
- Fake response generation and fake-only deletion are tested.
- Tests cover auth, CRUD, filters, summary aggregation, and CSV export.

## Handoff Notes

Completed in v1. Verified by `npm run test`, `npm run typecheck`, and `npm run build`.
