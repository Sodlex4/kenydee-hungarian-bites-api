#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/home/sodlex/backups}"
DB_NAME="${DB_NAME:-hungarian_bites}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASSWORD:-}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

DATE=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz"

MYSQL_PWD="$DB_PASS" mysqldump \
  --user="$DB_USER" \
  --single-transaction \
  --routines \
  --triggers \
  "$DB_NAME" | gzip > "$FILE"

echo "[backup] Created: $FILE ($(du -h "$FILE" | cut -f1))"

find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "[backup] Rotated backups older than $RETENTION_DAYS days"
