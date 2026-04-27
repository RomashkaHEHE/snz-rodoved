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
- `/login` — вход в рабочую зону по паролю;
- `/editor` — ввод анкет;
- `/data` — работа с данными и экспорт.
- `/admin` — вход администратора по логину и паролю.

## Переменные окружения

- `PORT` — порт API, по умолчанию `4000`.
- `HOST` — host API, по умолчанию `127.0.0.1`.
- `DATABASE_URL` — путь к SQLite-файлу, по умолчанию `./data/rodoved.sqlite`.
- `SESSION_SECRET` — секрет подписи cookie.
- `ADMIN_USERNAME` — логин администратора.
- `ADMIN_PASSWORD` — пароль администратора.
- `WORKSPACE_PASSWORD` — пароль для основной рабочей зоны.
- `VITE_API_BASE_URL` — базовый адрес API для фронтенда, обычно пустой при локальном Vite proxy.

## Команды

- `npm run typecheck` — проверка TypeScript.
- `npm run lint` — ESLint.
- `npm run test` — Vitest.
- `npm run build` — production build всех пакетов.

## Локальные учетные данные

В development, если переменные не заданы, используется пароль `admin` для рабочей зоны и `admin` / `admin` для админки. В production нужно явно задать `WORKSPACE_PASSWORD`, `ADMIN_PASSWORD` и `SESSION_SECRET`.
