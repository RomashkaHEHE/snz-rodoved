# Test Environment

The test environment is isolated from production and is intended for UX experiments before merging to `main`.

## Targets

- Branch: `test`
- Domain: `test.snz-rodoved.ru`
- Server path: `/home/user1/apps/snz-rodoved-test`
- Local server port on VPS: `127.0.0.1:4001`
- User service: `snz-rodoved-test.service`
- Database: `/home/user1/apps/snz-rodoved-test/shared/data/rodoved.sqlite`

Production stays on:

- Branch: `main`
- Domain: `snz-rodoved.ru`
- Server path: `/home/user1/apps/snz-rodoved`
- Local server port on VPS: `127.0.0.1:4000`
- User service: `snz-rodoved.service`

## Deploy

`.github/workflows/deploy-test.yml` deploys every push to `test`.

The workflow intentionally ignores the production `DEPLOY_PATH` and always deploys to `/home/$DEPLOY_USER/apps/snz-rodoved-test`.

The web build receives:

```env
VITE_APP_ENV=test
```

This marks the build as test-only for environment-specific logic. The public UI does not show a visible test banner.

The test server env currently uses:

```env
COOKIE_SECURE=true
```

Keep this enabled because `test.snz-rodoved.ru` has HTTPS. Do not set `COOKIE_SECURE=false` unless HTTPS is temporarily broken and the test environment must be debugged over plain HTTP.

## DNS

DNS record:

```text
test  A  46.16.36.87
```

Certificate command used:

```bash
sudo certbot --nginx -d test.snz-rodoved.ru --redirect --non-interactive
```

## Current Server State

As of 2026-07-08:

- `snz-rodoved-test.service` is active.
- `http://127.0.0.1:4001/api/health` returns `{"ok":true}` on the VPS.
- nginx has `snz-rodoved-test.conf` and proxies Host `test.snz-rodoved.ru` to `127.0.0.1:4001`.
- DNS for `test.snz-rodoved.ru` resolves to `46.16.36.87`.
- Let's Encrypt HTTPS is enabled for `test.snz-rodoved.ru`; HTTP redirects to HTTPS.
- `https://test.snz-rodoved.ru/api/health` returns `{"ok":true}`.
- Browser checks passed on real HTTPS URL:
  - desktop `/` shows contact links, no visible test banner, and no horizontal overflow;
  - mobile `/survey` shows the section navigation, no horizontal overflow, and q16 opens required `Имя`/`Номер телефона` fields.
- Workspace API login over HTTPS sets a `Secure` session cookie and can access protected responses.

## Safety Rules

- Do not point the test service to the production SQLite file.
- Do not reuse `/home/user1/apps/snz-rodoved` for test releases.
- Do not edit unrelated nginx configs on the VPS.
- Test data can be deleted freely only inside the test database.
- Do not set `COOKIE_SECURE=false` on production.
