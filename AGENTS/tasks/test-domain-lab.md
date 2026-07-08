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
  - public online survey has a five-step flow: basic/search fields, experience, interests, help, full-answer review;
  - public online survey submits to the server after the review step, shows a completion screen, and stores a browser-local draft until successful submit;
  - public navigation shows only the online survey and workspace login until the operator signs in;
  - operator entry, data, and PDF archive are behind workspace password login;
  - operator entry remains one continuous form, with section navigation, answer counts, and grouped paper-form sections for phone work;
  - data filters include date range, source, gender, age group, residence, help-only, contact-only, contact workflow status, and free text search;
  - data summary, demographic/source bars, row inspector, inline row editing/deletion, demo-row generation, fake-only deletion, and CSV export use server rows;
  - the protected data screen has a contact/help queue for rows where q16 is `yes`, with persisted status and operator notes;
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

1. Review whether contact workflow needs due dates, assignee-like markers, or a separate compact call screen.
2. Consider moving CSV export from client-side rows to the backend if the test dataset grows beyond current all-rows loading.
3. Keep reviewing the mobile data workspace on real iPhone/Safari.
4. Consider a safer operator workflow for merging duplicated paper/online rows.
5. Consider whether the online survey needs a shorter mode for people who only want help with one narrow topic.

## Last Verification

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `VITE_APP_ENV=test npm run build`
- HTTP/asset smoke against a temporary local server confirmed:
  - `/api/health` responds;
  - `/data` serves the built test app;
  - the built JS contains `Есть контакт`, `Сбросить`, `Проживание`, `Источник`, and `Контакты`;
  - the built CSS contains `filter-choice-grid` and `filter-title-row`.
- HTTP/asset smoke for the public survey confirmed:
  - the built JS contains `Проверка`, `Поиск`, `Опыт`, `Интересы`, `Нет ответа`, `Отправить`, `Анкета отправлена`, and `Новая анкета`;
  - the built CSS contains `survey-review`, `review-question-row`, `answer-chip`, and `survey-success`.
- HTTP/API smoke for the contact workflow confirmed:
  - a response can be created;
  - workspace PATCH can save `contactStatus` and `contactNote`;
  - the built UI bundle contains contact workflow controls and labels.
- HTTP/asset smoke for operator entry confirmed:
  - the built JS contains `Навигация по анкете`, `Сводка ответов`, `Данные анкеты`, and `Быстрый ввод`;
  - the built CSS contains `entry-toolbar`, `entry-jump-row`, and `entry-section-title`.
- Local browser smoke:
  - unauthenticated public nav on `/` shows only `Опрос` and `Вход`;
  - after workspace login, nav shows `Опрос`, `Ввод`, `Данные`, `PDF`;
  - protected data screen shows q16 help rows in `Обращения` with a `tel:` link;
  - iPhone-width checks had no horizontal overflow.

Note: the browser tool timed out while opening the temporary local server during the filter iteration, so the newest filter work was verified by TypeScript/lint/tests/build and HTTP/asset smoke. Re-run browser checks for filter clicks when the browser automation session is stable.
