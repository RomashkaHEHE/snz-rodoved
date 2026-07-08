# Карта репозитория

- `apps/api` — Fastify API, auth, CRUD, PDF-архив и аналитика.
- `apps/web` — React/Vite фронтенд: стабильные production-маршруты и отдельный experimental entry для `test`.
- `apps/web/src/experiment` — экспериментальный frontend test-домена; не считать staging-копией production.
- `packages/shared` — общие типы, Zod-схемы, каталог вопросов.
- `packages/db` — Drizzle schema, SQLite connection, migrations, repository.
- `docs` — стабильная документация о том, как проект работает.
- `AGENTS` — контекст для будущих агентов: цели решений, активные задачи, идеи.
- `scripts` — эксплуатационные скрипты.
- `.github/workflows/deploy.yml` — автодеплой на production при push в `main`.
- `.github/workflows/deploy-test.yml` — автодеплой тестового контура при push в `test`.
- `data` — локальная SQLite-база; сами `.sqlite` файлы не коммитятся.
