# Test Domain

`test.snz-rodoved.ru` is a separate experimental version of the Rodoved product.

## Product Scope

The test domain is used to check from scratch how to organize:

1. public online survey completion;
2. manual entry of paper questionnaires by the operator;
3. work with data, filters, PDF archive, and visualizations;
4. the mobile work scenario;
5. safe handling of contact data and scanned paper questionnaires.

The test domain has its own interface and UX decisions.

## Current Frontend

- Entry: `apps/web/src/App.tsx`
- Product UI: `apps/web/src/experiment/ExperimentApp.tsx`
- Product CSS: `apps/web/src/experiment/experiment.css`

Current flows use the isolated test backend and test SQLite/PDF storage:

- public online survey submit;
- password-gated operator entry;
- data filters, summary, row list, editing/deletion, demo-row generation, fake-only deletion, CSV export;
- PDF upload/list/download/deletion.

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

## Deploy

`.github/workflows/deploy-test.yml` deploys every push to `test`.

The workflow intentionally deploys to `/home/$DEPLOY_USER/apps/snz-rodoved-test`.

The web build receives:

```env
VITE_APP_ENV=test
```

The test server env currently uses:

```env
COOKIE_SECURE=true
```

## DNS

DNS record:

```text
test  A  46.16.36.87
```

Certificate command used:

```bash
sudo certbot --nginx -d test.snz-rodoved.ru --redirect --non-interactive
```
