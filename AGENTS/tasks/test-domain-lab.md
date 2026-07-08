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
- Current flows are browser-local prototypes:
  - online survey;
  - operator entry;
  - data filters, summary, rows, and CSV export;
  - PDF upload/list/download stored in browser storage.

## Product Direction

- Keep the first screen useful as a product surface.
- Avoid visible meta-copy explaining that this is an experiment.
- Prefer mobile-first controls and dense-but-readable work screens.
- Treat accepted ideas as product decisions to later implement robustly with backend persistence.

## Next Product Steps

1. Replace browser-local storage with isolated server persistence for the test domain.
2. Improve the online survey flow after mobile browser review.
3. Add row editing directly inside the data workspace.
4. Add real PDF upload to the isolated test backend.
5. Add more useful visualizations only after the row/PDF workflow feels good.
