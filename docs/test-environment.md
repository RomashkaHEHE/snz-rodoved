# Test Domain

`test.snz-rodoved.ru` is a separate experimental version of the Rodoved product.

## Product Scope

The test domain is used to check from scratch how to organize:

1. public online survey completion;
2. manual entry of paper questionnaires by the operator;
3. work with data, filters, PDF archive, and visualizations;
4. the mobile work scenario;
5. safe handling of contact data and scanned paper questionnaires.

The test domain has its own interface and UX decisions.

## Current Frontend

- Entry: `apps/web/src/App.tsx`
- Product UI: `apps/web/src/experiment/ExperimentApp.tsx`
- Product CSS: `apps/web/src/experiment/experiment.css`

Current flows use the isolated test backend and test SQLite/PDF storage:

- public online survey with browser-local draft restore, demographics followed by one Q4-Q16 question per screen in paper order, a Q16-dependent contact/search continuation, a compact expandable review with consent controls before submit, and a completion screen after successful submit;
- deliberate `yes`/`no` answers advance immediately unless Q11 or Q16 opens follow-up fields; unanswered questions move forward through an explicit `Пропустить` action. Legacy five-step drafts migrate to the corresponding question in the current versioned flow;
- Q16 `yes` reveals required name/phone and optional territory/period/free-text fields; changing Q16 to another answer clears those dependent values and invitation consent. Public phone input accepts familiar formatting but requires 10-15 digits;
- public submission requires explicit consent to processing answers. Invitation consent is optional and is shown for a help request; historical rows keep `Не зафиксировано` rather than being interpreted as refusal;
- the Q11 war selector is shown only for a `yes` answer and resets to `—` otherwise;
- online demographic controls start without a selected value and require an explicit gender, age-group, and residence choice before later steps can open; paper entry keeps its operator-oriented defaults;
- online drafts expire after 24 hours and never store `contactName` or `contactPhone`; a restored help request returns to the help step so contacts can be entered again;
- clearing a non-empty online survey requires confirmation;
- the public survey and workspace use separate shells without cross-links: `/` has no workspace login/navigation, while `/entry`, `/data`, and `/pdf` have no survey link;
- authenticated workspace navigation contains only `Ввод`, `Данные`, and `PDF`;
- password-gated operator entry, data, and PDF archive;
- desktop operator entry keeps one continuous paper-form flow, with one answered/remaining progress indicator, a next-missing-answer action, one section selector, temporary question highlighting, and visual groups;
- phone-width operator entry uses a 14-step guided flow: demographics, then one Q4-Q16 question per screen. Ordinary answers auto-advance, conditional Q11/Q16 details stay on the current step, and back/next controls preserve answers;
- repeated paper entry uses a tab-scoped series: the survey date stays after a successful save, the confirmed-row counter increases only after the API responds, the next form starts empty at the first field, and `Завершить` clears the series;
- unfinished paper entry is restored for up to 24 hours in the same tab. Only the date, demographics, Q4-Q16, Q11 war detail, consent marks, and current mobile step are stored; contacts, search context, free text, and workflow fields are omitted. Saving a row or completing the series clears the draft;
- the entry submit button is disabled while a response is being saved, preventing duplicate rows from a repeated phone tap;
- data filters for date range, source, gender, age group, residence, help requests, contacts, contact workflow status, and free text; controls start collapsed, active filters are shown as removable chips, mirrored in `/data` URL query, restored on reload/back-forward, and can be saved as local browser presets;
- data workspace with one shared filter slice and task modes for contacts, questionnaire rows, PDF files, and charts; desktop uses low-chrome tabs, while phone layouts use one mode select. The selected mode is stored in the `/data` URL as `view` and is restored on reload/back-forward;
- PDF data mode compares paper questionnaire dates in the current slice with matching PDF files and shows missing scans or scans without entered paper rows;
- data summary, demographic/source bars, q16 help/contact queue with compact status/plan selects, persisted status and operator notes, row list, row inspector with consent state and full Q4-Q16 answer review, inline editing/deletion, demo-row generation, fake-only deletion, server CSV export for the current filter slice. Contact and questionnaire lists initially render 20 rows and expose `Показать ещё`; filtering, counters, charts, and export continue to use the full matching slice;
- on phone widths, an opened data row becomes a full-viewport detail screen with the background list locked, masked contacts, a collapsed Q4-Q16 review, a compact status select, and inline editing; desktop keeps the side-by-side list and sticky inspector;
- phone row editing shows demographics or one Q4-Q16 question at a time, supports direct question jumps and save from any step, and confirms before discarding changes. Online help rows require contact fields and show search details inside Q16; paper contacts remain optional;
- CSV remains a visible data-page action; contact visibility and demo-data actions live in the secondary action menu. Rows expose only `Открыть`; editing and deletion stay in the selected-row inspector;
- local contact privacy mode on `/data` hides names and phone numbers in lists and inspectors by default until the operator explicitly shows them;
- collapsible yes/no/unknown question breakdown with group focus;
- staged PDF upload: choosing a file does not send it immediately; the operator reviews the file, size, date, and derived archive name before confirming;
- PDF list/download and two-step deletion; a duplicate survey date is blocked and the existing file remains downloadable.

## Targets

- Branch: `test`
- Domain: `test.snz-rodoved.ru`
- Server path: `/home/user1/apps/snz-rodoved-test`
- Local server port on VPS: `127.0.0.1:4001`
- User service: `snz-rodoved-test.service`
- Database: `/home/user1/apps/snz-rodoved-test/shared/data/rodoved.sqlite`

Production stays separate:

- Branch: `main`
- Domain: `snz-rodoved.ru`
- Server path: `/home/user1/apps/snz-rodoved`
- Local server port on VPS: `127.0.0.1:4000`
- User service: `snz-rodoved.service`

## Deploy

`.github/workflows/deploy-test.yml` deploys every push to `test`.

The workflow intentionally deploys to `/home/$DEPLOY_USER/apps/snz-rodoved-test`.

The web build receives:

```env
VITE_APP_ENV=test
```

The test server env currently uses:

```env
COOKIE_SECURE=true
```

## DNS

DNS record:

```text
test  A  46.16.36.87
```

Certificate command used:

```bash
sudo certbot --nginx -d test.snz-rodoved.ru --redirect --non-interactive
```
