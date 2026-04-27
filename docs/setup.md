# Локальная разработка

## Установка

```bash
npm install
cp .env.example .env
npm run dev
```

`npm run dev` сначала собирает общие пакеты, затем запускает API и Vite.

Локальные страницы:

- `/` — публичная страница;
- `/login` — вход редактора;
- `/editor` — ввод анкет;
- `/data` — работа с данными и экспорт.

## Переменные окружения

- `PORT` — порт API, по умолчанию `4000`.
- `HOST` — host API, по умолчанию `127.0.0.1`.
- `DATABASE_URL` — путь к SQLite-файлу, по умолчанию `./data/rodoved.sqlite`.
- `SESSION_SECRET` — секрет подписи cookie.
- `ADMIN_USERNAME` — логин оператора.
- `ADMIN_PASSWORD` — пароль оператора.
- `VITE_API_BASE_URL` — базовый адрес API для фронтенда, обычно пустой при локальном Vite proxy.

## Команды

- `npm run typecheck` — проверка TypeScript.
- `npm run lint` — ESLint.
- `npm run test` — Vitest.
- `npm run build` — production build всех пакетов.

## Локальные учетные данные

В development, если переменные не заданы, используется `admin` / `admin`. В production нужно явно задать `ADMIN_PASSWORD` и `SESSION_SECRET`.
