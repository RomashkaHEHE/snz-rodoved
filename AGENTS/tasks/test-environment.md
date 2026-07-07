# Test Environment

## Status

IN_PROGRESS

## Priority

High

## Goal

Maintain a separate test deployment for UX experiments, mobile workflow checks, and customer review without touching the production site or production data.

## Current understanding

- Production is deployed from `main` to `/home/user1/apps/snz-rodoved`, service `snz-rodoved`, port `4000`, domain `snz-rodoved.ru`.
- Test should be deployed from `test` to `/home/user1/apps/snz-rodoved-test`, service `snz-rodoved-test`, port `4001`, domain `test.snz-rodoved.ru`.
- Test must use its own SQLite database and PDF storage.
- Test builds use `VITE_APP_ENV=test`; the frontend shows a visible test banner in that build.
- Test runtime may use `COOKIE_SECURE=false` until DNS/HTTPS are ready; never apply that env value to production.
- DNS for `test.snz-rodoved.ru` may need to be added by the domain owner before HTTPS can be issued.

## Relevant files

- `.github/workflows/deploy-test.yml`
- `docs/test-environment.md`
- `apps/web/src/App.tsx`
- `apps/web/src/styles.css`
- `scripts/deploy/bootstrap-user-service.sh`
- `scripts/deploy/activate-release.sh`

## Next steps

1. Bootstrap `/home/user1/apps/snz-rodoved-test` on the VPS.
2. Add a separate nginx config for `test.snz-rodoved.ru` proxying to `127.0.0.1:4001`.
3. Push branch `test` and verify the `Deploy Test` workflow.
4. Verify `curl -H 'Host: test.snz-rodoved.ru' http://46.16.36.87/api/health`.
5. After DNS resolves, issue Let's Encrypt for `test.snz-rodoved.ru`.

## Exit criteria

- `test` branch deploys automatically through GitHub Actions.
- `snz-rodoved-test.service` is healthy on the server.
- Test reverse proxy reaches the app without affecting `snz-rodoved.service`.
- Test site has a separate database from production.
- Mobile and desktop smoke checks have been run on `/`, `/survey`, `/editor`, and `/data`.
