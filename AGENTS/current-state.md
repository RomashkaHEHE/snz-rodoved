# Current State

Last updated: 2026-04-27

## Baseline

V1 implementation has been scaffolded as a maintainable full-stack app:

- React/Vite web app;
- Fastify API;
- SQLite + Drizzle data layer;
- shared question catalog and validation;
- docs and AGENTS handoff layer.

## Current Priorities

1. Keep survey data safe and easy to back up.
2. Keep manual data entry fast and readable for the operator.
3. Keep the public page simple until final public copy is approved.
4. Keep docs and AGENTS updated whenever behavior changes.

## Stable Product Decisions

- Public `/` does not show survey analytics in v1.
- `/login` is password-only workspace login.
- `/admin` is a separate username/password admin login.
- `/editor` is for entering new responses.
- `/data` is for filters, visualization, table work, editing/deleting, and CSV export.
- Public `/` only shows the work-zone button when the user is already authenticated.
- Missing or unreadable paper answers are stored as `unknown`.
- Questions 7 and 8 remain separate because both exist in the paper survey.
- SQLite is the v1 persistence target for VPS deployment.

## Active Tasks

No active implementation task after the initial v1 scaffold. See completed task:

- [v1-site-implementation.md](tasks/v1-site-implementation.md)
- [api-and-data-layer.md](tasks/api-and-data-layer.md)
- [admin-ui.md](tasks/admin-ui.md)
- [public-page-and-assets.md](tasks/public-page-and-assets.md)
- [docs-and-handoff.md](tasks/docs-and-handoff.md)

## Handoff Expectations

Before ending substantial work:

- run or document verification;
- update task notes if the implementation changes;
- update canonical docs for stable behavior changes.
