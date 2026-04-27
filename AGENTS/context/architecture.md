# Architecture Rationale

## Stack

Use TypeScript across the repo so shared survey types stay consistent.

## Frontend/backend boundary

The frontend imports only shared DTOs/catalogs, not API internals. The backend owns persistence and auth. This keeps visual redesigns easier later.

## Persistence

SQLite is chosen for VPS simplicity and easy backups. Drizzle provides typed schema and query construction without hiding the database shape.

## Monorepo

`apps/*` and `packages/*` keep product areas separate while allowing one command set from the root.
