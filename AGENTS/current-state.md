# Current State

Last updated: 2026-07-13

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
- Questions 7 and 8 remain separate because both exist in the paper survey.
- SQLite is the v1 persistence target for VPS deployment.
- Production deploy target is isolated under `/home/user1/apps/snz-rodoved` unless changed by `DEPLOY_PATH`.
- Server `46.16.36.87` has been bootstrapped with user-level service `snz-rodoved`; the app runs on `127.0.0.1:4000` behind nginx.
- Test branch `test` deploys through `.github/workflows/deploy-test.yml` to `/home/user1/apps/snz-rodoved-test`, user service `snz-rodoved-test`, and `127.0.0.1:4001`. It uses a separate SQLite database.
- `test.snz-rodoved.ru` is a separate experimental Rodoved product for checking new organization of online surveys, manual entry, data work, PDF archive, mobile workflow, and safe contact/scan handling.
- Test-domain UI code lives under `apps/web/src/experiment`.
- `test.snz-rodoved.ru` resolves to `46.16.36.87`, has a separate nginx config `snz-rodoved-test.conf`, and has Let's Encrypt HTTPS enabled. HTTP redirects to HTTPS. Test runtime uses `COOKIE_SECURE=true`.
- Test-domain public survey and private workspace are separate interface shells with no cross-links. `/` contains only the respondent flow; `/entry`, `/data`, and `/pdf` contain only the workspace. Authenticated workspace navigation lists `Ввод`, `Данные`, and `PDF`.
- Test-domain public survey uses a narrow five-step flow with only the current title and progress visible. It follows the paper questionnaire in order: demographics, Q4-Q6, Q7-Q15, and Q16. Name, phone, territory, period, and free text appear only after a `yes` answer to Q16. Full-answer review and completion screens remain.
- Test-domain online demographics have no visual defaults: gender, age group, and residence must each be selected explicitly before leaving the first step. This rule is client-side and does not change the shared response schema or paper-entry defaults.
- Test-domain online drafts expire after 24 hours and redact `contactName`/`contactPhone` before localStorage writes. Restoring a q16 help request routes to the help step with empty contact fields; resetting a non-empty survey requires confirmation.
- Test-domain operator entry is device-specific: desktop keeps the continuous paper-form flow with progress and section jumps, while widths up to 720px use a 14-step guided flow with demographics followed by one paper question at a time. Ordinary answers advance automatically; Q11/Q16 stay open when follow-up fields are needed.
- Test-domain paper entry has a tab-scoped series state. A successful create retains the selected survey date, clears respondent answers, focuses the first field, and increments a server-confirmed counter. `Завершить` resets the date and counter; in-flight submit is disabled to prevent double-tap duplicates.
- Test-domain data screen includes URL-backed filters with removable active-filter chips, collapsed-by-default controls, local saved filter presets, server CSV export for the current slice, desktop mode tabs, and one phone mode select for `Обращения`, `Анкеты`, `PDF`, and `Графики`.
- The test-domain `Обращения` mode is a contact-work queue for q16 help requests. Compact status and next-contact selects replace the former button grids; sorting and persisted status/date/notes behavior is unchanged.
- Test-domain data rows show one `Открыть` action. Editing and deletion remain available in the selected-row inspector; privacy and demo-data actions live in a secondary action menu.
- Test-domain row inspector on `/data` shows the selected row's demographics, contact/search fields, contact workflow, and a compact full Q4-Q16 answer review. It should not collapse the row down to only `Да` answers because operators need to audit missing and negative answers too.
- The test-domain `PDF` mode cross-checks paper response dates in the current slice against matching PDF scans, showing missing PDFs and PDFs whose dates do not currently have entered paper rows.
- Test-domain `/data` has a local contact privacy mode, enabled by default, that masks contact names and phone numbers in lists and read-only inspectors until the operator explicitly shows them. Editing still shows real values because the operator is intentionally modifying the row.
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
