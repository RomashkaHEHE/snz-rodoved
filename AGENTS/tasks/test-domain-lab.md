# Test Domain

## Status

ACTIVE

## Priority

High

## Goal

`test.snz-rodoved.ru` is a separate experimental version of the Rodoved product.

The main task of the test domain is to check from scratch how to best organize:

1. public online survey completion;
2. manual entry of paper questionnaires by the operator;
3. work with data, filters, PDF archive, and visualizations;
4. the mobile work scenario;
5. safe handling of contact data and scanned paper questionnaires.

The test domain must have its own interface, its own UX decisions, and may use new approaches that differ from the main site.

`test.snz-rodoved.ru` is used to search for better solutions.

## Current Implementation

- `apps/web/src/App.tsx` renders the experimental product app.
- Experimental UI lives under `apps/web/src/experiment`.
- The visible test site opens as a product UI with working task screens.
- Current flows use the isolated test backend:
  - public online survey submits to the server;
  - operator entry is behind workspace password login;
  - data filters, summary, rows, editing/deletion, demo-row generation, fake-only deletion, and CSV export use server rows;
  - PDF upload/list/download/deletion use server PDF storage.

## Product Direction

- Keep the first screen useful as a product surface.
- Avoid visible meta-copy explaining that this is an experiment.
- Prefer mobile-first controls and dense-but-readable work screens.
- Keep contact data and scanned questionnaires behind the workspace flow.
- Keep fake/demo rows visibly marked and removable only through fake-only API deletion.

## Next Product Steps

1. Improve the online survey flow after mobile browser review.
2. Add row editing directly inside the data workspace.
3. Improve PDF upload naming and duplicate handling.
4. Add more useful visualizations only after the row/PDF workflow feels good.
5. Explore a better contact-follow-up workflow for q16.
