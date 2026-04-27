# API

Все рабочие endpoints, кроме `/api/health` и auth, требуют сессионную cookie.

## Auth

`POST /api/auth/login`

```json
{ "username": "admin", "password": "..." }
```

`POST /api/auth/logout`

`GET /api/auth/me`

```json
{ "authenticated": true }
```

## Анкеты

`GET /api/responses`

Поддерживает фильтры query string:

- `dateFrom=2026-04-01`
- `dateTo=2026-04-30`
- `gender=male,female`
- `ageGroup=18_40,over_40`
- `residence=snezhinsk`
- `q7=yes`
- `q16=yes`

`POST /api/responses` создает анкету.

`PATCH /api/responses/:id` обновляет анкету.

`DELETE /api/responses/:id` удаляет анкету.

`GET /api/responses/export.csv` выгружает отфильтрованные анкеты в CSV для Excel.

- Использует те же query-фильтры, что `GET /api/responses`.
- Возвращает `text/csv; charset=utf-8`.
- CSV начинается с UTF-8 BOM, чтобы Excel на Windows корректно открыл русский текст.

## Аналитика

`GET /api/analytics/summary` принимает те же фильтры, что и список анкет.

Возвращает:

- общее количество;
- распределение по датам;
- распределение по полу, возрасту и месту проживания;
- yes/no/unknown по каждому вопросу;
- количество ответов «Да» по интересам;
- группировку поля `q11WarDetails`.
