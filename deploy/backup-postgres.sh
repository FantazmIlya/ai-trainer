#!/usr/bin/env bash
set -euo pipefail

# Simple PostgreSQL backup script with retention.
# Use with cron, for example daily at 03:15.

BACKUP_DIR="${BACKUP_DIR:-/var/backups/ai-trainer}"
DB_NAME="${DB_NAME:-ai_trainer}"
DB_USER="${DB_USER:-ai_trainer_user}"
DB_HOST="${DB_HOST:-localhost}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

timestamp="$(date +%Y-%m-%d_%H-%M-%S)"
mkdir -p "$BACKUP_DIR"

backup_file="$BACKUP_DIR/${DB_NAME}_${timestamp}.sql.gz"

echo "Creating backup: $backup_file"
pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" | gzip > "$backup_file"

echo "Removing backups older than ${RETENTION_DAYS} days"
find "$BACKUP_DIR" -type f -name "${DB_NAME}_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "Backup completed"