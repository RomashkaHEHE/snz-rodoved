# Модель данных

Таблица `responses` хранит одну строку на одну бумажную анкету.

## Поля

- `id` — UUID анкеты.
- `survey_date` — дата опроса в формате `YYYY-MM-DD`.
- `gender` — `male` или `female`.
- `age_group` — `under_18`, `18_40`, `over_40`.
- `residence` — `snezhinsk` или `other`.
- `q4`...`q16` — `yes`, `no`, `unknown`.
- `q11_war_details` — свободный текст по войне или `—`.
- `created_at`, `updated_at` — ISO-даты.

## Вопросы

Канонический список вопросов находится в `packages/shared/src/index.ts`. UI и API используют его как единый источник правды.

## Миграции

Первая миграция хранится в `packages/db/migrations/0001_initial.sql`. При старте API вызывается кодовая миграция из `packages/db/src/migrate.ts`, совпадающая с SQL-файлом.
