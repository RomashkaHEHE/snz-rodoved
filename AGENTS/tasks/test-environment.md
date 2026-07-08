# Test Environment

## Status

WATCH

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
- Server bootstrap is complete: `snz-rodoved-test.service` is active on port `4001`, nginx proxies Host `test.snz-rodoved.ru`, and GitHub Actions `Deploy Test` passed on branch `test`.
- DNS for `test.snz-rodoved.ru` is not ready yet; the domain owner needs to add the A record before HTTPS can be issued.

## Relevant files

- `.github/workflows/deploy-test.yml`
- `docs/test-environment.md`
- `apps/web/src/App.tsx`
- `apps/web/src/styles.css`
- `scripts/deploy/bootstrap-user-service.sh`
- `scripts/deploy/activate-release.sh`

## Next steps

1. Add DNS record: `test A 46.16.36.87`.
2. After DNS resolves, issue Let's Encrypt for `test.snz-rodoved.ru`.
3. Re-check mobile and desktop pages on the real HTTPS URL.

## Exit criteria

- `test` branch deploys automatically through GitHub Actions. Done; latest verified deploy commit is `f22ef1f`.
- `snz-rodoved-test.service` is healthy on the server. Done.
- Test reverse proxy reaches the app without affecting `snz-rodoved.service`. Done.
- Test site has a separate database from production. Done: `/home/user1/apps/snz-rodoved-test/shared/data/rodoved.sqlite`.
- Mobile and desktop smoke checks have been run locally on `/`, `/survey`, `/editor`, and `/data`. Done.
- Public DNS and HTTPS for `test.snz-rodoved.ru` remain pending.
