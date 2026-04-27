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
- `is_fake` — `true` только для тестовых строк, сгенерированных через интерфейс. Реальные анкеты имеют `false`.
- `created_at`, `updated_at` — ISO-даты.

## Вопросы

Канонический список вопросов находится в `packages/shared/src/index.ts`. UI и API используют его как единый источник правды.

## Миграции

Миграции хранятся в `packages/db/migrations`. При старте API вызывается кодовая миграция из `packages/db/src/migrate.ts`.

- `0001_initial` — базовая таблица анкет и индексы.
- `0002_fake_responses` — признак `is_fake` и индекс для безопасного удаления фейковых строк.
