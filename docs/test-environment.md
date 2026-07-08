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

- public online survey with browser-local draft restore, a full-answer review step before submit, and a completion screen after successful submit;
- public navigation shows only the online survey and a workspace login until the operator signs in;
- password-gated operator entry, data, and PDF archive;
- operator entry keeps one continuous paper-form flow, but adds section navigation, answer counts, and visual groups for phone work;
- data filters for date range, source, gender, age group, residence, help requests, contacts, contact workflow status, and free text;
- data summary, demographic/source bars, q16 help/contact queue with persisted status and operator notes, row list, row inspector, inline editing/deletion, demo-row generation, fake-only deletion, CSV export;
- collapsible yes/no/unknown question breakdown with group focus;
- PDF upload/list/download/deletion with duplicate-name warning.

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
