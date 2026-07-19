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
  "consentToDataProcessing": true,
  "consentToEvents": true,
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

Возвращает только активные анкеты. Строки из корзины не участвуют в фильтрах и не попадают в ответ.

Поддерживает фильтры query string:

- `dateFrom=2026-04-01`
- `dateTo=2026-04-30`
- `source=paper,online`
- `gender=male,female`
- `ageGroup=18_40,over_40`
- `residence=snezhinsk`
- `contactStatus=new,in_progress`
- `contactNextFrom=2026-05-01`
- `contactNextTo=2026-05-31`
- `contactNextMissing=true`
- `contactOnly=true`
- `helpOnly=true`
- `query=Ивановы`
- `q7=yes`
- `q16=yes`

`POST /api/responses` создает анкету.

`PATCH /api/responses/:id` обновляет анкету. Рабочая зона также может обновлять внутренний статус обращения, дату следующего контакта и заметку оператора:

```json
{
  "contactStatus": "in_progress",
  "contactNextDate": "2026-05-22",
  "contactNote": "Связаться после мероприятия"
}
```

`consentToDataProcessing=true` обязательно для публичной онлайн-отправки. Имя и телефон обязательны только при `q16=yes`; телефон должен содержать от 10 до 15 цифр. `consentToEvents` необязательно и сохраняется независимо от ответа `q16`.

`DELETE /api/responses/:id` перемещает активную анкету в корзину. Повторное удаление той же строки возвращает `404`.

`GET /api/responses/trash` возвращает удалённые анкеты от недавно удалённых к старым.

`POST /api/responses/:id/restore` восстанавливает анкету из корзины. Если строка не удалена или не существует, endpoint возвращает `404`.

`POST /api/responses/fake` создает одну фейковую анкету для проверки интерфейса.

`DELETE /api/responses/fake` окончательно удаляет только анкеты с признаком `isFake=true`, включая демо-строки в корзине. Реальные анкеты, в том числе удалённые, этим endpoint не затрагиваются.

`GET /api/responses/export.csv` выгружает отфильтрованные анкеты в CSV для Excel.

- Использует те же query-фильтры, что `GET /api/responses`, включая фильтры обращений, даты следующего контакта и свободный поиск.
- Включает контактные поля, обе отметки согласия и рабочие поля обращения: `Имя`, `Номер телефона`, `Согласие на обработку данных`, `Согласие на приглашения`, `Статус обращения`, `Следующий контакт`, `Заметка по обращению`.
- Для nullable-отметок согласия CSV различает `Да`, `Нет` и `Не зафиксировано`.
- Возвращает `text/csv; charset=utf-8`.
- CSV начинается с UTF-8 BOM, чтобы Excel на Windows корректно открыл русский текст.
- Анкеты из корзины в CSV не попадают.

## Сохранённые срезы

Все endpoints требуют вход в рабочую зону.

`GET /api/filter-presets` возвращает сохранённые срезы от недавно обновлённых к старым.

`POST /api/filter-presets` создаёт срез или обновляет существующий с тем же нормализованным именем:

```json
{
  "name": "Онлайн-обращения",
  "filters": {
    "source": ["online"],
    "helpOnly": true
  }
}
```

`DELETE /api/filter-presets/:id` удаляет один сохранённый срез. Текущие URL-фильтры и анкеты не изменяются.

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

Анкеты из корзины в расчётах не участвуют.

Возвращает:

- общее количество;
- распределение по датам;
- распределение по полу, возрасту и месту проживания;
- yes/no/unknown по каждому вопросу;
- количество ответов «Да» по интересам;
- группировку поля `q11WarDetails`.
