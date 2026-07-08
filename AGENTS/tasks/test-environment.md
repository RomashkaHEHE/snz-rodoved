# Test Environment

## Status

DONE

## Priority

High

## Goal

Maintain a separate test deployment for UX experiments, mobile workflow checks, and customer review without touching the production site or production data.

## Current understanding

- Production is deployed from `main` to `/home/user1/apps/snz-rodoved`, service `snz-rodoved`, port `4000`, domain `snz-rodoved.ru`.
- Test should be deployed from `test` to `/home/user1/apps/snz-rodoved-test`, service `snz-rodoved-test`, port `4001`, domain `test.snz-rodoved.ru`.
- Test must use its own SQLite database and PDF storage.
- Test builds use `VITE_APP_ENV=test`; the frontend intentionally does not show a public test-version banner.
- Test runtime uses `COOKIE_SECURE=true` because HTTPS is enabled.
- Server bootstrap is complete: `snz-rodoved-test.service` is active on port `4001`, nginx proxies Host `test.snz-rodoved.ru`, and GitHub Actions `Deploy Test` passed on branch `test`.
- DNS for `test.snz-rodoved.ru` resolves to `46.16.36.87`.
- Let's Encrypt HTTPS is enabled for `test.snz-rodoved.ru`; HTTP redirects to HTTPS.

## Relevant files

- `.github/workflows/deploy-test.yml`
- `docs/test-environment.md`
- `apps/web/src/App.tsx`
- `apps/web/src/styles.css`
- `scripts/deploy/bootstrap-user-service.sh`
- `scripts/deploy/activate-release.sh`

## Next steps

- Keep using branch `test` for experiments before merging into `main`.
- Watch customer feedback from the test URL and move accepted changes deliberately into production.

## Exit criteria

- `test` branch deploys automatically through GitHub Actions. Done; latest verified deploy commit before this docs update was `8b68cea`.
- `snz-rodoved-test.service` is healthy on the server. Done.
- Test reverse proxy reaches the app without affecting `snz-rodoved.service`. Done.
- Test site has a separate database from production. Done: `/home/user1/apps/snz-rodoved-test/shared/data/rodoved.sqlite`.
- Mobile and desktop smoke checks have been run locally on `/`, `/survey`, `/editor`, and `/data`. Done.
- Public DNS and HTTPS for `test.snz-rodoved.ru` are working. Done.
- Real HTTPS browser checks passed for desktop `/` and mobile `/survey`. Done.
- Protected API smoke over HTTPS passed with a `Secure` session cookie. Done.
