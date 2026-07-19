# Current State

Last updated: 2026-07-19

## Baseline

V1 implementation has been scaffolded as a maintainable full-stack app:

- React/Vite web app;
- Fastify API;
- SQLite + Drizzle data layer;
- shared question catalog and validation;
- docs and AGENTS handoff layer.
- GitHub Actions deploy workflow and server bootstrap scripts.

## Current Priorities

1. Keep survey data safe and easy to back up.
2. Keep manual data entry fast and readable for the operator.
3. Keep the public page simple until final public copy is approved.
4. Keep public online survey data useful without turning the product into a personal-data intake form.
5. Keep docs and AGENTS updated whenever behavior changes.

## Stable Product Decisions

- Public `/` does not show survey analytics in v1.
- Public `/` uses burgundy accents, a safe guest-entry jump to public info, and active contact icons for VK, Telegram, email, and vCard.
- Public `/survey` lets visitors submit the same 16-question survey without a workspace login.
- Online survey rows are stored in `responses` with `source=online`; manual paper rows use `source=paper`.
- Online survey rows may include `researchTerritory`, `researchPeriodStart`, `researchPeriodEnd`, and `freeText`.
- If q16 is `yes` in the online survey, the UI shows `contactName` and `contactPhone`; these fields are stored on the response row and remain workspace-only.
- Public online submission requires an explicit processing-answer consent. Invitation consent is a separate optional answer from the original paper form and does not depend on Q16; both values are nullable on stored rows so historical absence remains `Не зафиксировано`.
- Contact phone validation accepts common formatting and requires 10-15 digits in shared/API validation and the test-domain UI.
- `/login` is password-only workspace login.
- `/admin` is a separate username/password admin login.
- `/admin` can update both the admin password and the workspace password.
- `/editor` is for entering new responses.
- `/data` is for filters, PDF files for the selected date period, collapsible visualization, table work, editing/deleting, and CSV export. Data refreshes automatically on filter changes, focus, and a short interval.
- `/pdf` is the protected PDF archive for uploading, listing, downloading, and deleting scanned paper questionnaires.
- Workspace pages support a phone-first control mode below tablet widths: fixed bottom navigation, larger stable answer grids, sticky form save action, and mobile card rows for the response table.
- PDF archive files are one PDF per survey day. The operator manually names files as `YYYYMMDD_анкеты.pdf`; the app derives `surveyDate` from that name.
- PDF files may contain personal contact data written on paper, so they are never public and are served only through workspace-authenticated API routes.
- Public `/` only shows the work-zone button when the user is already authenticated.
- Public `/` links to `/survey` for visitors.
- Missing or unreadable paper answers are stored as `unknown`.
- Fake/test questionnaires are stored as normal response rows with `isFake=true`; fake-only bulk deletion must never delete rows where `isFake=false`.
- Test-domain questionnaire deletion is recoverable: individual delete sets `deletedAt`, active lists/filters/charts/CSV exclude the row, and `Ещё` opens a trash screen with restore. There is no permanent-delete action for real rows. Fake-only cleanup may permanently remove active or trashed rows only when `isFake=true`.
- Questions 7 and 8 remain separate because both exist in the paper survey.
- SQLite is the v1 persistence target for VPS deployment.
- Production deploy target is isolated under `/home/user1/apps/snz-rodoved` unless changed by `DEPLOY_PATH`.
- Server `46.16.36.87` has been bootstrapped with user-level service `snz-rodoved`; the app runs on `127.0.0.1:4000` behind nginx.
- Test branch `test` deploys through `.github/workflows/deploy-test.yml` to `/home/user1/apps/snz-rodoved-test`, user service `snz-rodoved-test`, and `127.0.0.1:4001`. It uses a separate SQLite database.
- `test.snz-rodoved.ru` is a separate experimental Rodoved product for checking new organization of online surveys, manual entry, data work, PDF archive, mobile workflow, and safe contact/scan handling.
- Test-domain UI code lives under `apps/web/src/experiment`.
- `test.snz-rodoved.ru` resolves to `46.16.36.87`, has a separate nginx config `snz-rodoved-test.conf`, and has Let's Encrypt HTTPS enabled. HTTP redirects to HTTPS. Test runtime uses `COOKIE_SECURE=true`.
- Test-domain public survey and private workspace are separate interface shells with no cross-links. `/` contains only the respondent flow; `/entry`, `/data`, and `/pdf` contain only the workspace. Authenticated workspace navigation lists `Ввод`, `Данные`, and `PDF`.
- Test-domain public survey starts with demographics, then presents one Q4-Q16 question per screen in paper-form order. The experimental UI consumes the canonical `answerQuestions` catalog from `packages/shared`, so online and paper flows cannot silently diverge in order or wording. `yes`/`no` answers auto-advance except when Q11 opens its war selector; unanswered questions use an explicit `Пропустить` action. Q16 `no` goes to review, while Q16 `yes` opens a required contact step followed by an optional territory/period/free-text step. The final check uses four collapsed factual summaries, visibly separates required answer processing from optional event invitations, and keeps the confirmed `Начать заново` action below the primary navigation.
- Test-domain online draft state has flow version 3. Existing five-step and version-2 focused drafts migrate to the equivalent question or review step instead of being discarded.
- Test-domain online and new-paper demographics have no visual defaults: gender, age group, and residence must each be selected explicitly before leaving the first step or saving. This confirmation state is client-side and does not change the shared response schema; editing an existing row treats its stored demographics as confirmed.
- Test-domain single-choice segmented controls use one keyboard tab stop per question or field. Arrow keys move and select adjacent options with wrapping; `Home`/`End` select the first/last option. Pointer and touch behavior is unchanged.
- Test-domain online drafts expire after 24 hours and redact `contactName`/`contactPhone` before localStorage writes. Restoring a q16 help request routes to the dedicated contact step with empty contact fields while retaining non-contact search context; resetting a non-empty survey requires confirmation.
- Test-domain operator entry is device-specific: desktop keeps the continuous paper-form flow with progress and section jumps, while widths up to 720px use a 14-step guided flow with explicit demographics followed by one paper question at a time. Ordinary answers advance automatically; Q11/Q16 stay open when follow-up fields are needed. Missing demographics use restrained field markers and focus the first omission.
- Test-domain paper entry has a tab-scoped series state. A successful create retains the selected survey date, clears answers and demographic confirmation for the next respondent, focuses the first field, increments a server-confirmed counter, and records only the confirmed response ID. The mutation response updates local workspace rows directly; the UI does not depend on a second list request to decide whether a write succeeded. `Проверить последнюю` reopens that exact row in the existing editor after save or tab reload. Changing the series date or pressing `Завершить` clears the reference; in-flight submit is disabled to prevent double-tap duplicates. Empty series hide the finish action; mobile active-series labels are shortened without becoming icon-only.
- Test-domain paper entry also keeps a tab-scoped 24-hour recovery draft for explicit demographic confirmation, date, Q4-Q16, Q11 war detail, consent marks, and the mobile step. Legacy drafts without confirmation markers return to the demographic step. Contact, search, free-text, and workflow fields are excluded; successful creation or series completion clears the draft.
- Test-domain data screen includes URL-backed filters with removable active-filter chips, collapsed-by-default controls, workspace-wide saved filter presets stored in SQLite, server CSV export for the current slice, desktop mode tabs, and one phone mode select for `Обращения`, `Анкеты`, `PDF`, and `Графики`. Presets refresh on screen entry and focus so laptop and phone use the same set; legacy browser presets are imported once after authentication. The selected mode is URL-backed through `view`, so direct links and browser history preserve the operator's current task.
- Test-domain `Графики` combines current-slice totals with a date series split into paper and online rows. It starts with the eight most recent active dates, can reveal all dates, and turns a selected date into URL-backed date filters before opening `Анкеты`. Demographic and Q4-Q16 breakdowns are collapsed by default.
- Test-domain contact and questionnaire lists render in batches of 20 with an explicit continuation action. This only limits mounted list rows; filters, counts, charts, PDF coverage, and CSV still use the complete matching response slice.
- The test-domain `Обращения` mode is a contact-work queue for q16 help requests. Compact status and next-contact selects replace the former button grids; sorting and persisted status/date/notes behavior is unchanged. Queue cards keep identity, questionnaire date, status, next-contact urgency, and territory visible while moving long free text to the inspector. Opening an обращение prioritizes contact reveal/call and the workflow; search context and full questionnaire detail are disclosures. A desktop queue auto-selects the first row only for a new slice and never overrides an explicit close. On phones, one filter icon beside the mode select opens the full filters and reports the active-filter count.
- Test-domain data rows show one `Открыть` action. Editing and deletion remain available in the selected-row inspector; privacy and demo-data actions live in a secondary action menu.
- Test-domain row inspector on `/data` shows the selected row's demographics, recorded consent state, contact/search fields, contact workflow, and a compact full Q4-Q16 answer review. It should not collapse the row down to only `Да` answers because operators need to audit missing and negative answers too.
- On phone widths, selecting a `/data` row opens an opaque focused full-viewport detail screen instead of appending the inspector below the list. It has an independent sticky header and icon close action, traps keyboard focus, restores focus to the originating row after close, masks contacts by default, keeps Q4-Q16 collapsed until requested, and edits in the same screen. Desktop keeps the sticky two-column inspector.
- Mobile `/data` editing shows demographics or one Q4-Q16 question at a time, with one jump select and an always-available save action. Online Q16 help rows require name/phone and expose search details inside Q16; paper rows keep contact fields optional. Closing a changed editor requires confirmation, while explicit cancel restores the stored row.
- The test-domain `PDF` mode cross-checks paper response dates in the current slice against matching PDF scans, showing missing PDFs and PDFs whose dates do not currently have entered paper rows.
- Test-domain `/pdf` uses staged upload: file selection does not transmit data, the operator reviews the source name/size and derived archive name, then presses `Добавить в архив`. Duplicate survey dates block upload and expose the existing download. PDF deletion uses an inline confirmation and does not delete structured response rows.
- Test-domain `/data` has a local contact privacy mode, enabled by default, that masks contact names and phone numbers in lists and read-only inspectors until the operator explicitly shows them. Editing still shows real values because the operator is intentionally modifying the row.
- Test-domain CSV is privacy-aware at the API boundary: the primary export omits name/phone columns, while the secondary confirmed export passes `includeContacts=true`. Both filenames state whether name/phone are absent or contacts are included. Filters and non-contact workflow fields remain identical in both files.
- Domain `snz-rodoved.ru` has an nginx reverse proxy and Let's Encrypt HTTPS certificate on the server. Some local resolvers may still cache the previous parking IP, but authoritative/public DNS points to `46.16.36.87`.
- API static serving must not rely only on `process.cwd()/apps/web/dist`: production starts through `npm -w @snz-rodoved/api`, so the runtime cwd is `apps/api`. `apps/api/src/app.ts` resolves the frontend dist from `INIT_CWD`, root cwd, or `../web/dist`.

## Active Tasks

- [test-domain-lab.md](tasks/test-domain-lab.md) remains active while the experimental product is being refined.

Completed baseline tasks:

- [v1-site-implementation.md](tasks/v1-site-implementation.md)
- [api-and-data-layer.md](tasks/api-and-data-layer.md)
- [admin-ui.md](tasks/admin-ui.md)
- [public-page-and-assets.md](tasks/public-page-and-assets.md)
- [pdf-archive.md](tasks/pdf-archive.md)
- [responsive-workspace.md](tasks/responsive-workspace.md)
- [online-survey.md](tasks/online-survey.md)
- [test-domain-lab.md](tasks/test-domain-lab.md)
- [docs-and-handoff.md](tasks/docs-and-handoff.md)
- [autodeploy.md](tasks/autodeploy.md)

## Handoff Expectations

Before ending substantial work:

- run or document verification;
- update task notes if the implementation changes;
- update canonical docs for stable behavior changes.
