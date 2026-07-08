# Test Domain

`test.snz-rodoved.ru` is not a staging copy of production.

It is a separate product laboratory for trying a different interface, different workflows, and new feature ideas around the same Rodoved tasks: surveys, manual entry, PDF storage, and data analysis.

## Targets

- Branch: `test`
- Domain: `test.snz-rodoved.ru`
- Server path: `/home/user1/apps/snz-rodoved-test`
- Local server port on VPS: `127.0.0.1:4001`
- User service: `snz-rodoved-test.service`
- Database: `/home/user1/apps/snz-rodoved-test/shared/data/rodoved.sqlite`

Production stays separate:

- Branch: `main`
- Domain: `snz-rodoved.ru`
- Server path: `/home/user1/apps/snz-rodoved`
- Local server port on VPS: `127.0.0.1:4000`
- User service: `snz-rodoved.service`

## Product Role

The stable production site is the working system.

The test domain is for discovery:

- rethink the public online survey instead of copying the paper form;
- test phone-first manual entry flows;
- explore better data tables, filters, PDF access, and analytics grouping;
- validate ideas with the customer before porting accepted decisions into production.

Do not treat the `test` branch as something that should be merged wholesale into `main`. Accepted ideas should be reimplemented or carefully ported into `main` as stable production changes.

## Current Frontend

The test frontend entry is intentionally separate:

- `apps/web/src/App.tsx`
- `apps/web/src/experiment/ExperimentApp.tsx`
- `apps/web/src/experiment/experiment.css`

The current test UI is a clean product-lab shell. It does not expose the old production routes or production workspace UI.

## Deploy

`.github/workflows/deploy-test.yml` deploys every push to `test`.

The workflow intentionally ignores the production `DEPLOY_PATH` and always deploys to `/home/$DEPLOY_USER/apps/snz-rodoved-test`.

The web build receives:

```env
VITE_APP_ENV=test
```

The test server env currently uses:

```env
COOKIE_SECURE=true
```

Keep this enabled because `test.snz-rodoved.ru` has HTTPS.

## DNS

DNS record:

```text
test  A  46.16.36.87
```

Certificate command used:

```bash
sudo certbot --nginx -d test.snz-rodoved.ru --redirect --non-interactive
```

## Safety Rules

- Do not point the test service to the production SQLite file.
- Do not reuse `/home/user1/apps/snz-rodoved` for test releases.
- Do not edit unrelated nginx configs on the VPS.
- Do not collect important real data in unfinished test flows.
- Do not merge the `test` branch directly into `main`.
- Do not set `COOKIE_SECURE=false` on production.
