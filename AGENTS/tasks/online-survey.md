# Online Survey

## Status

DONE

## Priority

High

## Goal

Let public visitors submit the same 16-question survey online, while keeping the operator's existing paper-entry analytics and data workflows intact.

## Current understanding

- Customer asked for the same questions plus research territory, research period, and free text.
- Map/timeline wording is inspiration, not a hard requirement. V1 uses accessible text/year fields rather than a Yandex Maps dependency.
- Online rows are stored in the same `responses` table with `source=online`.
- Manual rows remain `source=paper`.
- Public submit endpoint does not require workspace auth, but server forces `source=online`.
- Free text should remain search context, not a request for contact data.

## Relevant files

- `packages/shared/src/index.ts`
- `packages/db/src/schema.ts`
- `packages/db/src/repository.ts`
- `packages/db/migrations/0004_online_responses.sql`
- `apps/api/src/app.ts`
- `apps/api/src/filters.ts`
- `apps/api/src/csv.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/components/OnlineSurveyPage.tsx`
- `apps/web/src/components/FilterPanel.tsx`
- `apps/web/src/components/ResponsesTable.tsx`
- `apps/web/src/components/ResponseForm.tsx`

## Next steps

- Watch real usage: if many online answers include contacts, add stronger copy or structured contact-consent handling.
- Consider a real map/timeline only after the customer confirms what they need from those controls.

## Exit criteria

- `/survey` exists and submits without login.
- `/data` can filter by source and shows online context.
- CSV export includes source and online context fields.
- Tests cover public submit, source filtering, and online fields.
