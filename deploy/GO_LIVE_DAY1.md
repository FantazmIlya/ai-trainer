# Go-live checklist (1 day)

Use this checklist to move from "code-ready" to a verified production release.

## 0) Preconditions (before release window)

1. Staging deployment from `develop` is green.
2. Manual QA passed on staging:
   - auth (register/login/logout)
   - exercise browse and admin CRUD
   - AI chat response flow
   - YooKassa test payment
   - workout manual entry and file import
3. `CHANGELOG.md` updated for release version.
4. Release tag pushed (`vX.Y.Z`) for tested commit.

## 1) Production promotion

1. Run GitHub Action `Promote to Production (Beget)`.
2. Input:
   - `release_tag=vX.Y.Z`
   - `change_reason=short release note`
3. Wait for all release gates and approve `production` environment.
4. Confirm deploy job finishes successfully.

## 2) Immediate smoke tests (5-10 minutes)

1. API health:
   - `curl https://your-domain.com/api/health`
2. Automated smoke script:
   - `APP_BASE_URL=https://your-domain.com node scripts/smoke-test.mjs`
3. Authenticated smoke script:
   - `APP_BASE_URL=https://your-domain.com TEST_USER_EMAIL=... TEST_USER_PASSWORD=... node scripts/smoke-test.mjs`
4. Manual browser check:
   - home page loads
   - login works
   - chat page returns AI response

## 3) Payments and integrations checks

1. YooKassa test payment is created from UI.
2. YooKassa webhook updates payment status in app.
3. Workout API key generation works in profile.
4. Workout import creates records in DB.

## 4) Operational controls (same day)

1. Enable DB backup cron:
   - `chmod +x deploy/backup-postgres.sh`
   - `crontab -e`
   - `15 3 * * * BACKUP_DIR=/var/backups/ai-trainer DB_NAME=ai_trainer DB_USER=ai_trainer_user /var/www/ai-trainer/current/deploy/backup-postgres.sh >> /var/log/ai-trainer-backup.log 2>&1`
2. Verify PM2 autostart:
   - `pm2 save`
   - `pm2 startup`
3. Confirm TLS cert auto-renew:
   - `systemctl status certbot.timer`

## 5) Rollback plan

If smoke tests fail:

1. Roll back to previous stable tag:
   - `cd /var/www/ai-trainer/current`
   - `DEPLOY_REF=vPREVIOUS_TAG PM2_ECOSYSTEM=ecosystem.config.cjs bash deploy/update.sh`
2. Re-run smoke tests.
3. Open incident note with root cause and fix ETA.