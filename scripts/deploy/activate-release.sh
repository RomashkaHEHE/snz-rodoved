#!/usr/bin/env bash
set -Eeuo pipefail

export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

ARCHIVE_PATH="${1:?Archive path is required}"
PROJECT_DIR="${2:?Project dir is required}"
RELEASE_ID="${3:?Release id is required}"
RESTART_COMMAND="${4:-}"

if [[ "$PROJECT_DIR" != /* ]]; then
  echo "PROJECT_DIR must be an absolute path" >&2
  exit 1
fi

if [[ ! -f "$ARCHIVE_PATH" ]]; then
  echo "Archive not found: $ARCHIVE_PATH" >&2
  exit 1
fi

if [[ -z "$RESTART_COMMAND" ]]; then
  RESTART_COMMAND='XDG_RUNTIME_DIR=/run/user/$(id -u) systemctl --user restart snz-rodoved'
fi

RELEASES_DIR="$PROJECT_DIR/releases"
SHARED_DIR="$PROJECT_DIR/shared"
RELEASE_DIR="$RELEASES_DIR/$RELEASE_ID"

mkdir -p "$RELEASES_DIR" "$SHARED_DIR"

if [[ -e "$RELEASE_DIR" ]]; then
  rm -rf "$RELEASE_DIR"
fi

mkdir -p "$RELEASE_DIR"
tar -xzf "$ARCHIVE_PATH" -C "$RELEASE_DIR"
rm -f "$ARCHIVE_PATH"

if [[ -f "$SHARED_DIR/.env" ]]; then
  ln -sfn "$SHARED_DIR/.env" "$RELEASE_DIR/.env"
fi

cd "$RELEASE_DIR"
npm ci --omit=dev

ln -sfn "$RELEASE_DIR" "$PROJECT_DIR/current"

bash -lc "$RESTART_COMMAND"

find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' \
  | sort -rn \
  | tail -n +6 \
  | cut -d' ' -f2- \
  | xargs -r rm -rf

echo "Activated release $RELEASE_ID in $PROJECT_DIR"
