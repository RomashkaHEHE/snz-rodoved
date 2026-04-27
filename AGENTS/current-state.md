# Current State

Last updated: 2026-04-27

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
4. Keep docs and AGENTS updated whenever behavior changes.

## Stable Product Decisions

- Public `/` does not show survey analytics in v1.
- `/login` is password-only workspace login.
- `/admin` is a separate username/password admin login.
- `/admin` can update both the admin password and the workspace password.
- `/editor` is for entering new responses.
- `/data` is for filters, visualization, table work, editing/deleting, and CSV export. Data refreshes automatically on filter changes, focus, and a short interval.
- Public `/` only shows the work-zone button when the user is already authenticated.
- Missing or unreadable paper answers are stored as `unknown`.
- Fake/test questionnaires are stored as normal response rows with `isFake=true`; fake-only bulk deletion must never delete rows where `isFake=false`.
- Questions 7 and 8 remain separate because both exist in the paper survey.
- SQLite is the v1 persistence target for VPS deployment.
- Production deploy target is isolated under `/home/user1/apps/snz-rodoved` unless changed by `DEPLOY_PATH`.
- Server `46.16.36.87` has been bootstrapped with user-level service `snz-rodoved`; the app runs on `127.0.0.1:4000` behind nginx.
- Domain `snz-rodoved.ru` has an nginx reverse proxy and Let's Encrypt HTTPS certificate on the server. Some local resolvers may still cache the previous parking IP, but authoritative/public DNS points to `46.16.36.87`.
- API static serving must not rely only on `process.cwd()/apps/web/dist`: production starts through `npm -w @snz-rodoved/api`, so the runtime cwd is `apps/api`. `apps/api/src/app.ts` resolves the frontend dist from `INIT_CWD`, root cwd, or `../web/dist`.

## Active Tasks

No active implementation task after the initial v1 scaffold. See completed task:

- [v1-site-implementation.md](tasks/v1-site-implementation.md)
- [api-and-data-layer.md](tasks/api-and-data-layer.md)
- [admin-ui.md](tasks/admin-ui.md)
- [public-page-and-assets.md](tasks/public-page-and-assets.md)
- [docs-and-handoff.md](tasks/docs-and-handoff.md)
- [autodeploy.md](tasks/autodeploy.md)

## Handoff Expectations

Before ending substantial work:

- run or document verification;
- update task notes if the implementation changes;
- update canonical docs for stable behavior changes.
