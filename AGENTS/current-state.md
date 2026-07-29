# Current State

Last updated: 2026-07-29

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
- Online Q16 help requests may include name and phone. Public phone validation
  requires 10-15 digits, and public submission requires a stored processing
  consent mark.
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
- Ordinary questionnaire deletion is recoverable through `deletedAt`; active
  lists, filters, analytics, and CSV exclude trashed rows until restoration.
- Contact names and phones are masked in the table by default. The primary CSV
  omits both fields at the API boundary; contact export is separately named and
  confirmed.
- The production response table mounts rows in batches of 30 without changing
  totals, filters, analytics, or export.
- Segmented answer controls use a single keyboard tab stop and support arrow,
  `Home`, and `End` navigation.
- Known production dependency vulnerabilities were cleared by updating Fastify
  and `@fastify/static`; validate with `npm audit --omit=dev`.
- Questions 7 and 8 remain separate because both exist in the paper survey.
- SQLite is the v1 persistence target for VPS deployment.
- Production deploy target is isolated under `/home/user1/apps/snz-rodoved` unless changed by `DEPLOY_PATH`.
- Server `46.16.36.87` has been bootstrapped with user-level service `snz-rodoved`; the app runs on `127.0.0.1:4000` behind nginx.
- Domain `snz-rodoved.ru` has an nginx reverse proxy and Let's Encrypt HTTPS certificate on the server. Some local resolvers may still cache the previous parking IP, but authoritative/public DNS points to `46.16.36.87`.
- API static serving must not rely only on `process.cwd()/apps/web/dist`: production starts through `npm -w @snz-rodoved/api`, so the runtime cwd is `apps/api`. `apps/api/src/app.ts` resolves the frontend dist from `INIT_CWD`, root cwd, or `../web/dist`.

## Active Tasks

No active implementation task.

Completed baseline tasks:

- [test-to-production-port.md](tasks/test-to-production-port.md)
- [v1-site-implementation.md](tasks/v1-site-implementation.md)
- [api-and-data-layer.md](tasks/api-and-data-layer.md)
- [admin-ui.md](tasks/admin-ui.md)
- [public-page-and-assets.md](tasks/public-page-and-assets.md)
- [pdf-archive.md](tasks/pdf-archive.md)
- [responsive-workspace.md](tasks/responsive-workspace.md)
- [online-survey.md](tasks/online-survey.md)
- [docs-and-handoff.md](tasks/docs-and-handoff.md)
- [autodeploy.md](tasks/autodeploy.md)

## Handoff Expectations

Before ending substantial work:

- run or document verification;
- update task notes if the implementation changes;
- update canonical docs for stable behavior changes.
