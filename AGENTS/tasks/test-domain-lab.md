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
  - public online survey submits to the server and stores a browser-local draft until successful submit;
  - public navigation shows only the online survey and workspace login until the operator signs in;
  - operator entry, data, and PDF archive are behind workspace password login;
  - data filters, summary, row inspector, inline row editing/deletion, demo-row generation, fake-only deletion, and CSV export use server rows;
  - the protected data screen has a contact/help queue for rows where q16 is `yes`;
  - collapsible question breakdown shows yes/no/unknown counts and can focus on all questions, experience, interests, or help;
  - PDF upload/list/download/deletion use server PDF storage;
  - PDF upload warns before sending when a file with the derived `YYYYMMDD_анкеты.pdf` name already exists.

## Product Direction

- Keep the first screen useful as a product surface.
- Avoid visible meta-copy explaining that this is an experiment.
- Prefer mobile-first controls and dense-but-readable work screens.
- Keep contact data and scanned questionnaires behind the workspace flow.
- Keep fake/demo rows visibly marked and removable only through fake-only API deletion.

## Next Product Steps

1. Extend the q16 queue into a lightweight contact workflow if the operator needs status tracking.
2. Add CSV export controls that make client-side text/contact filters explicit.
3. Review whether the online survey needs a final confirmation screen before submit.
4. Keep reviewing the mobile data workspace on real iPhone/Safari.
5. Consider a safer operator workflow for merging duplicated paper/online rows.

## Last Verification

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `VITE_APP_ENV=test npm run build`
- Local browser smoke:
  - unauthenticated public nav on `/` shows only `Опрос` and `Вход`;
  - after workspace login, nav shows `Опрос`, `Ввод`, `Данные`, `PDF`;
  - protected data screen shows q16 help rows in `Обращения` with a `tel:` link;
  - iPhone-width checks had no horizontal overflow.
