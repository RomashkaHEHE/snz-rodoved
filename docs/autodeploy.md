# Автодеплой на сервер

Цель: при каждом push в `main` GitHub Actions собирает проект, прогоняет проверки и выкладывает релиз на сервер `46.16.36.87` в отдельную папку, не затрагивая другие проекты.

Основной домен проекта: `snz-rodoved.ru`.

## Что уже добавлено в репозиторий

- `.github/workflows/deploy.yml` — workflow для push в `main` и ручного запуска.
- `scripts/deploy/activate-release.sh` — серверный скрипт активации релиза.
- `scripts/deploy/bootstrap-user-service.sh` — первичная настройка user-level systemd сервиса.

## Схема на сервере

Рекомендуемый путь проекта:

```bash
/home/user1/apps/snz-rodoved
```

Внутри:

- `releases/*` — релизы из GitHub Actions;
- `current` — symlink на активный релиз;
- `shared/.env` — production env, не перезаписывается деплоем;
- `shared/data/rodoved.sqlite` — постоянная SQLite-база.

Текущее состояние сервера на 2026-04-27:

- deploy key для `user1` добавлен в `authorized_keys`;
- Node.js 20 установлен локально для пользователя в `/home/user1/.local/bin`;
- `snz-rodoved.service` включен и запущен как user-level systemd service;
- `loginctl enable-linger user1` включен для запуска после перезагрузки;
- приложение отвечает локально на `http://127.0.0.1:4000/api/health`.
- nginx настроен отдельным конфигом `snz-rodoved.conf` для `snz-rodoved.ru` и `www.snz-rodoved.ru`.
- Let's Encrypt сертификат выпущен для `snz-rodoved.ru` и `www.snz-rodoved.ru`; HTTP перенаправляется на HTTPS.

## 1. Проверить Node.js на сервере

```bash
ssh user1@46.16.36.87
export PATH="$HOME/.local/bin:$PATH"
node -v
npm -v
```

Нужен Node.js 20. На текущем сервере он установлен локально для `user1`, чтобы не менять окружение других проектов.

## 2. SSH-ключ для GitHub Actions

Текущий deploy key уже создан локально и добавлен на сервер. Если ключ нужно пересоздать, на локальной машине:

```powershell
ssh-keygen -t ed25519 -C "snz-rodoved deploy" -f "$env:USERPROFILE\.ssh\snz_rodoved_deploy"
```

Публичный ключ добавить на сервер:

```powershell
Get-Content "$env:USERPROFILE\.ssh\snz_rodoved_deploy.pub" | ssh user1@46.16.36.87 "umask 077; mkdir -p ~/.ssh; cat >> ~/.ssh/authorized_keys"
```

SSH попросит пароль пользователя `user1`. Пароль не нужно сохранять в репозитории или GitHub Secrets.

## 3. Первичная настройка сервиса

С локальной машины:

```powershell
scp scripts/deploy/bootstrap-user-service.sh user1@46.16.36.87:/tmp/bootstrap-snz-rodoved.sh
ssh user1@46.16.36.87 "bash /tmp/bootstrap-snz-rodoved.sh /home/user1/apps/snz-rodoved"
```

На сервере отредактировать env:

```bash
nano /home/user1/apps/snz-rodoved/shared/.env
```

Обязательно поменять:

```env
WORKSPACE_PASSWORD=...
ADMIN_USERNAME=admin
ADMIN_PASSWORD=...
```

Чтобы user-level systemd сервис запускался после перезагрузки сервера, нужен linger:

```bash
sudo loginctl enable-linger user1
```

Если у `user1` нет sudo, это должен выполнить администратор сервера.

## 4. GitHub Secrets

В GitHub: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`.

Добавить:

```text
DEPLOY_HOST=46.16.36.87
DEPLOY_USER=user1
DEPLOY_PORT=22
DEPLOY_PATH=/home/user1/apps/snz-rodoved
DEPLOY_SSH_KEY=<содержимое приватного ключа snz_rodoved_deploy>
```

Опционально:

```text
DEPLOY_RESTART_COMMAND=XDG_RUNTIME_DIR=/run/user/$(id -u) systemctl --user restart snz-rodoved
```

Если `DEPLOY_RESTART_COMMAND` не задан, workflow использует такую команду по умолчанию.

## 5. Первый деплой

После настройки secrets:

1. Сделать push в `main`, или запустить workflow `Deploy` вручную через `Actions`.
2. Проверить сервис:

```bash
ssh user1@46.16.36.87
XDG_RUNTIME_DIR=/run/user/$(id -u) systemctl --user status snz-rodoved --no-pager
curl http://127.0.0.1:4000/api/health
```

## 6. Подключение домена

У регистратора домена добавить DNS-записи:

```text
@    A    46.16.36.87
www  A    46.16.36.87
```

Текущий reverse proxy config уже добавлен на сервер. Если его нужно восстановить вручную:

```bash
sudo tee /etc/nginx/sites-available/snz-rodoved.conf >/dev/null <<'NGINX'
server {
    listen 80;
    server_name snz-rodoved.ru www.snz-rodoved.ru;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

sudo ln -s /etc/nginx/sites-available/snz-rodoved.conf /etc/nginx/sites-enabled/snz-rodoved.conf
sudo nginx -t
sudo systemctl reload nginx
```

HTTPS уже включен. Если сертификат нужно перевыпустить вручную:

```bash
sudo certbot --nginx -d snz-rodoved.ru -d www.snz-rodoved.ru
```

Чтобы не задеть другие проекты, не редактируй существующие nginx-конфиги вручную. Создавай только отдельный файл `snz-rodoved.conf`, проверяй `nginx -t`, затем делай `reload`.
