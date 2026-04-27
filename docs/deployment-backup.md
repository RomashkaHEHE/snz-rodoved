# Деплой и резервные копии

Целевая схема v1 — VPS + Node.js + SQLite.

## Production build

```bash
npm install
npm run build
NODE_ENV=production npm run start -w @snz-rodoved/api
```

API по умолчанию ищет собранный фронтенд в `apps/web/dist` и отдает его как статические файлы.

## Production env

Минимум:

```env
NODE_ENV=production
PORT=4000
HOST=0.0.0.0
DATABASE_URL=/var/lib/snz-rodoved/rodoved.sqlite
SESSION_SECRET=long-random-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=strong-password
WORKSPACE_PASSWORD=strong-workspace-password
```

## Backup

Для копии SQLite-файла:

```bash
node scripts/backup-db.mjs
```

Скрипт берет путь из `DATABASE_URL` или использует `./data/rodoved.sqlite`, а копии кладет в `./backups`.

Рекомендуемый режим для VPS: ежедневный cron/systemd timer и отдельное хранение копий вне сервера.
