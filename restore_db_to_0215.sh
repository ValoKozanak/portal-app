#!/usr/bin/env bash
set -euo pipefail

echo "=== restore: stop service ==="
systemctl stop client-portal-backend-staging || true

cd /var/www/html/portal-app/backend-staging

echo "=== restore: load .env and resolve DB_URL ==="
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
else
  echo ".env missing in $(pwd)"
  exit 1
fi

DB_URL="${POSTGRES_URL:-${DATABASE_URL:-}}"
if [ -z "$DB_URL" ]; then
  echo "DB_URL empty"
  exit 1
fi
echo "Using DB_URL=$DB_URL"

echo "=== restore: pre-backup current db ==="
mkdir -p /root/backups/pg
PRE=/root/backups/pg/portal-$(date +%Y%m%d-%H%M%S)-pre-restore.dump
pg_dump -Fc -d "$DB_URL" -f "$PRE"
echo "saved $PRE"

echo "=== restore: restore from 2025-09-26 02:15 dump ==="
SRC=/root/backups/pg/portal-20250926-021501.dump
if [ ! -f "$SRC" ]; then
  echo "missing dump: $SRC"
  exit 1
fi
pg_restore --clean --if-exists --no-owner --single-transaction -d "$DB_URL" "$SRC"

echo "=== restore: start service ==="
systemctl start client-portal-backend-staging
sleep 2

echo "=== restore: health ==="
curl -sS http://127.0.0.1:5001/api/health | cat



