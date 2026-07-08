# Test Environment

## Status

DONE

## Priority

High

## Goal

Maintain the isolated deployment target for `test.snz-rodoved.ru` without confusing it with production staging.

The product purpose is documented in `test-domain-lab.md`. This file documents the environment mechanics.

## Current Understanding

- Production deploys from `main` to `/home/user1/apps/snz-rodoved`, service `snz-rodoved`, port `4000`, domain `snz-rodoved.ru`.
- Test deploys from `test` to `/home/user1/apps/snz-rodoved-test`, service `snz-rodoved-test`, port `4001`, domain `test.snz-rodoved.ru`.
- Test uses its own SQLite database and PDF storage.
- Test runtime uses `COOKIE_SECURE=true` because HTTPS is enabled.
- GitHub Actions workflow `Deploy Test` deploys pushes to `test`.
- Test should not be merged wholesale into `main`.

## Relevant Files

- `.github/workflows/deploy-test.yml`
- `docs/test-environment.md`
- `AGENTS/tasks/test-domain-lab.md`
- `apps/web/src/App.tsx`
- `apps/web/src/experiment/ExperimentApp.tsx`
- `apps/web/src/experiment/experiment.css`
- `scripts/deploy/bootstrap-user-service.sh`
- `scripts/deploy/activate-release.sh`

## Safety Rules

- Keep the test database separate from production.
- Keep the test service path separate from production.
- Do not edit unrelated nginx configs on the VPS.
- Do not use test as the only place for urgent production fixes.
- Port accepted ideas into `main` intentionally.

## Exit Criteria

- `test` branch deploys automatically through GitHub Actions. Done.
- `snz-rodoved-test.service` is healthy on the server. Done.
- Test reverse proxy reaches the app without affecting `snz-rodoved.service`. Done.
- Test site has a separate database from production. Done.
- Public DNS and HTTPS for `test.snz-rodoved.ru` are working. Done.
- Test frontend no longer renders the stable production interface. Done in this reset.
