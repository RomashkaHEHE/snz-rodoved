# API

Все рабочие endpoints, кроме `/api/health`, auth и публичной отправки онлайн-анкеты, требуют сессионную cookie.

## Auth

`POST /api/auth/login`

```json
{ "username": "admin", "password": "..." }
```

Админ-вход. Возвращает роль `admin`.

`POST /api/auth/workspace-login`

```json
{ "password": "..." }
```

Вход в рабочую зону. Возвращает роль `workspace`.

`POST /api/auth/logout`

`GET /api/auth/me`

```json
{ "authenticated": true, "role": "workspace" }
```

## Админка

`PATCH /api/admin/passwords`

Требует роль `admin`.

```json
{
  "adminPassword": "new-admin-password",
  "workspacePassword": "new-workspace-password"
}
```

Можно передать одно или оба поля. В production изменения сохраняются в `.env` и сразу применяются в текущем процессе.

## Анкеты

`POST /api/public/survey-responses`

Публичная отправка онлайн-анкеты без входа в рабочую зону. Сервер всегда сохраняет такую строку с `source=online`.

```json
{
  "gender": "female",
  "ageGroup": "over_40",
  "residence": "snezhinsk",
  "researchTerritory": "Челябинская область",
  "researchPeriodStart": 1850,
  "researchPeriodEnd": 1945,
  "freeText": "Дополнительный комментарий",
  "contactName": "Алёна",
  "contactPhone": "+7 900 000-00-00",
  "q4": "unknown",
  "q5": "yes",
  "q6": "no",
  "q7": "yes",
  "q8": "unknown",
  "q9": "unknown",
  "q10": "unknown",
  "q11": "no",
  "q12": "yes",
  "q13": "unknown",
  "q14": "unknown",
  "q15": "yes",
  "q16": "yes"
}
```

`GET /api/responses`

Поддерживает фильтры query string:

- `dateFrom=2026-04-01`
- `dateTo=2026-04-30`
- `source=paper,online`
- `gender=male,female`
- `ageGroup=18_40,over_40`
- `residence=snezhinsk`
- `contactStatus=new,in_progress`
- `contactOnly=true`
- `helpOnly=true`
- `query=Ивановы`
- `q7=yes`
- `q16=yes`

`POST /api/responses` создает анкету.

`PATCH /api/responses/:id` обновляет анкету. Рабочая зона также может обновлять внутренний статус обращения и заметку оператора:

```json
{ "contactStatus": "in_progress", "contactNote": "Связаться после мероприятия" }
```

`DELETE /api/responses/:id` удаляет анкету.

`POST /api/responses/fake` создает одну фейковую анкету для проверки интерфейса.

`DELETE /api/responses/fake` удаляет только анкеты с признаком `isFake=true`. Реальные анкеты этим endpoint не затрагиваются.

`GET /api/responses/export.csv` выгружает отфильтрованные анкеты в CSV для Excel.

- Использует те же query-фильтры, что `GET /api/responses`, включая фильтры обращений и свободный поиск.
- Включает контактные поля онлайн-анкет и рабочие поля обращения: `Имя`, `Номер телефона`, `Статус обращения`, `Заметка по обращению`.
- Возвращает `text/csv; charset=utf-8`.
- CSV начинается с UTF-8 BOM, чтобы Excel на Windows корректно открыл русский текст.

## PDF-архив

Все endpoints требуют вход в рабочую зону.

`GET /api/pdf-files`

Возвращает PDF-файлы со сканами бумажных анкет. Учитывает только date-фильтры из query string:

- `dateFrom=2026-05-01`
- `dateTo=2026-05-31`

Ответ:

```json
{
  "files": [
    {
      "id": "...",
      "surveyDate": "2026-05-17",
      "displayName": "20260517_анкеты.pdf",
      "originalFileName": "scan.pdf",
      "sizeBytes": 123456,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

`POST /api/pdf-files`

Принимает `multipart/form-data`:

- `displayName` — имя в формате `ггггммдд_анкеты.pdf`;
- `file` — PDF-файл.

Один PDF соответствует одному дню опроса. Дата для фильтрации вычисляется из имени файла.

`GET /api/pdf-files/:id/download` скачивает PDF.

`DELETE /api/pdf-files/:id` удаляет запись и физический PDF-файл. Строки анкет в `responses` не затрагиваются.

## Аналитика

`GET /api/analytics/summary` принимает те же фильтры, что и список анкет.

Возвращает:

- общее количество;
- распределение по датам;
- распределение по полу, возрасту и месту проживания;
- yes/no/unknown по каждому вопросу;
- количество ответов «Да» по интересам;
- группировку поля `q11WarDetails`.
