#!/usr/bin/env bash
set -Eeuo pipefail

export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

PROJECT_DIR="${1:-$HOME/apps/snz-rodoved}"
APP_PORT="${APP_PORT:-4000}"
SERVICE_NAME="${SERVICE_NAME:-snz-rodoved}"
ENV_FILE="$PROJECT_DIR/shared/.env"
SERVICE_DIR="$HOME/.config/systemd/user"
SERVICE_FILE="$SERVICE_DIR/$SERVICE_NAME.service"

mkdir -p "$PROJECT_DIR/releases" "$PROJECT_DIR/shared/data" "$SERVICE_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  SESSION_SECRET="$(openssl rand -hex 32 2>/dev/null || date +%s | sha256sum | cut -d' ' -f1)"
  cat > "$ENV_FILE" <<EOF
NODE_ENV=production
HOST=127.0.0.1
PORT=$APP_PORT
DATABASE_URL=$PROJECT_DIR/shared/data/rodoved.sqlite
SESSION_SECRET=$SESSION_SECRET
WORKSPACE_PASSWORD=change-me
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me-too
EOF
  chmod 600 "$ENV_FILE"
  echo "Created $ENV_FILE. Edit passwords before first real use."
else
  echo "$ENV_FILE already exists; leaving it unchanged."
fi

NPM_BIN="$(command -v npm)"

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=SNZ Rodoved survey app
After=network.target

[Service]
Type=simple
WorkingDirectory=$PROJECT_DIR/current
EnvironmentFile=$ENV_FILE
Environment=PATH=$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=$NPM_BIN run start -w @snz-rodoved/api
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable "$SERVICE_NAME.service"

cat <<EOF
User service created: $SERVICE_FILE

Before first deploy:
1. Edit $ENV_FILE and set WORKSPACE_PASSWORD and ADMIN_PASSWORD.
2. Ask an administrator/root user to run:
   sudo loginctl enable-linger $(whoami)

After the first GitHub deploy:
   XDG_RUNTIME_DIR=/run/user/$(id -u) systemctl --user status $SERVICE_NAME
EOF
