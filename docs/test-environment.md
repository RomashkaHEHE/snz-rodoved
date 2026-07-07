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

This adds a visible banner so the operator does not confuse the test site with production.

The test server env currently uses:

```env
COOKIE_SECURE=false
```

This allows password login over plain HTTP while DNS/HTTPS are not ready. After `test.snz-rodoved.ru` has a valid HTTPS certificate, this can be changed to `COOKIE_SECURE=true` or removed.

## DNS

Add this DNS record:

```text
test  A  46.16.36.87
```

When DNS resolves, issue a certificate:

```bash
sudo certbot --nginx -d test.snz-rodoved.ru
```

Before DNS is ready, the server can still be checked with a Host header:

```bash
curl -H 'Host: test.snz-rodoved.ru' http://46.16.36.87/api/health
```

## Safety Rules

- Do not point the test service to the production SQLite file.
- Do not reuse `/home/user1/apps/snz-rodoved` for test releases.
- Do not edit unrelated nginx configs on the VPS.
- Test data can be deleted freely only inside the test database.
- Do not set `COOKIE_SECURE=false` on production.
