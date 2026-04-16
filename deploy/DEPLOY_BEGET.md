# AI Trainer deployment on Beget VPS

This guide prepares a production setup for:

- React frontend (Vite build) served by Nginx
- Node.js API (Express + Prisma) managed by PM2
- PostgreSQL database
- HTTPS with Certbot

## 1. Prepare VPS on Beget

1. Create a VPS (Ubuntu 22.04 LTS is recommended).
2. Attach your domain to the VPS IP in DNS:
   - `A` record: `your-domain.com -> <VPS_IP>`
   - `A` record: `www.your-domain.com -> <VPS_IP>`
3. Connect by SSH:
   - `ssh root@<VPS_IP>`

## 2. Install base software

```bash
apt update && apt upgrade -y
apt install -y curl git nginx postgresql postgresql-contrib certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm i -g pm2
```

## 3. Create PostgreSQL database

```bash
sudo -u postgres psql
CREATE DATABASE ai_trainer;
CREATE USER ai_trainer_user WITH ENCRYPTED PASSWORD 'replace_strong_password';
GRANT ALL PRIVILEGES ON DATABASE ai_trainer TO ai_trainer_user;
\q
```

## 4. Upload and build project

```bash
mkdir -p /var/www/ai-trainer
cd /var/www/ai-trainer
git clone <your-repository-url> current
cd current
npm install
npm run build
```

## 5. Configure environment variables

Create backend env file:

```bash
cp backend/.env.example backend/.env
```

Set production values in `backend/.env`:

```env
PORT=4000
NODE_ENV=production
DATABASE_URL=postgresql://ai_trainer_user:replace_strong_password@localhost:5432/ai_trainer
JWT_ACCESS_SECRET=replace_long_random_access_secret
JWT_REFRESH_SECRET=replace_long_random_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES_DAYS=30
CORS_ORIGIN=https://your-domain.com

OPENROUTER_API_KEY=replace_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=deepseek/deepseek-chat-v3-0324:free
OPENROUTER_SITE_URL=https://your-domain.com
OPENROUTER_SITE_NAME=AI Trainer
AI_RATE_LIMIT_WINDOW_SEC=60
AI_RATE_LIMIT_MAX_REQUESTS=20

YOOKASSA_SHOP_ID=replace_shop_id
YOOKASSA_SECRET_KEY=replace_secret_key
YOOKASSA_API_BASE_URL=https://api.yookassa.ru/v3
YOOKASSA_RETURN_URL=https://your-domain.com/billing/success

WORKOUT_API_KEY_SALT=replace_long_random_workout_salt
```

Create frontend env file:

```bash
cp .env.production.example .env.production
```

Set API URL:

```env
VITE_API_BASE_URL=https://your-domain.com
```

Rebuild frontend after `.env.production` update:

```bash
npm run build
```

## 6. Run Prisma migrations

```bash
npx prisma generate --schema backend/prisma/schema.prisma
npx prisma migrate deploy --schema backend/prisma/schema.prisma
```

## 7. Start backend with PM2

```bash
cp deploy/ecosystem.config.cjs /var/www/ai-trainer/current/ecosystem.config.cjs
cd /var/www/ai-trainer/current
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Check:

```bash
pm2 status
pm2 logs ai-trainer-api --lines 100
```

## 8. Configure Nginx

1. Copy config:

```bash
cp /var/www/ai-trainer/current/deploy/nginx-ai-trainer.conf /etc/nginx/sites-available/ai-trainer.conf
ln -s /etc/nginx/sites-available/ai-trainer.conf /etc/nginx/sites-enabled/ai-trainer.conf
nginx -t
systemctl reload nginx
```

2. Enable HTTPS:

```bash
certbot --nginx -d your-domain.com -d www.your-domain.com
systemctl reload nginx
```

## 9. Configure external webhooks and workout integrations

YooKassa webhook URL:

- `https://your-domain.com/api/payments/yookassa/webhook`

Workout push endpoint template:

- `https://your-domain.com/api/workouts/integration/push/{API_KEY}`

## 10. Smoke tests

1. Health:
   - `curl https://your-domain.com/api/health`
2. Frontend opens:
   - `https://your-domain.com`
3. Auth works:
   - register and login from UI
4. Payment:
   - create test payment in YooKassa test mode
5. Workouts:
   - add manual workout and test CSV/GPX/TCX import

## 11. Quick update workflow

```bash
cd /var/www/ai-trainer/current
git pull
npm install
npm run build
npx prisma migrate deploy --schema backend/prisma/schema.prisma
pm2 restart ai-trainer-api
systemctl reload nginx
```

## 12. CI/CD with GitHub Actions

Project includes workflow:

- `.github/workflows/deploy-beget.yml`
- `.github/workflows/changelog-check.yml`
- `.github/workflows/conventional-commits-check.yml`

And server deploy script:

- `deploy/update.sh`

### 12.1 Server-side preparation

1. Ensure project is already cloned to:
   - `/var/www/ai-trainer/current`
2. Ensure PM2 ecosystem config is in project root:
   - `cp deploy/ecosystem.config.cjs /var/www/ai-trainer/current/ecosystem.config.cjs`
3. Allow deploy user to reload Nginx without password:

```bash
sudo visudo
```

Add line (replace username):

```text
deployuser ALL=(ALL) NOPASSWD:/bin/systemctl reload nginx
```

4. Make deploy script executable:

```bash
cd /var/www/ai-trainer/current
chmod +x deploy/update.sh
```

### 12.2 GitHub repository secrets

Open GitHub repository -> Settings -> Secrets and variables -> Actions -> New repository secret.

Create these secrets:

- `BEGET_HOST` - VPS IP or hostname
- `BEGET_PORT` - usually `22`
- `BEGET_USERNAME` - SSH user on server
- `BEGET_SSH_KEY` - private SSH key (full content)

### 12.3 How deployment works

1. Manual run of `Promote to Production (Beget)` workflow starts production promotion.
2. CI checks out selected `release_tag`, installs dependencies, and runs `npm run build`.
3. Deploy job waits for approval from GitHub `production` environment reviewers.
4. CD connects to VPS over SSH and runs:
   - `bash deploy/update.sh`
5. Script deploys the exact Git ref, rebuilds frontend, applies Prisma migrations, reloads PM2 and Nginx.

When changelog validation fails in a pull request, the bot comment now includes a ready-to-copy release section template (`## [X.Y.Z] - YYYY-MM-DD` with `Added/Changed/Fixed`) so the author can fix the file faster.

## 13. Staging environment (develop branch)

Staging setup gives a safe preview before production release.

Use separate resources:

- directory: `/var/www/ai-trainer-staging/current`
- domain: `staging.your-domain.com`
- PostgreSQL DB/user: for example `ai_trainer_staging` and `ai_trainer_staging_user`
- PM2 app name: `ai-trainer-api-staging`

### 13.1 Prepare staging on VPS

```bash
mkdir -p /var/www/ai-trainer-staging
cd /var/www/ai-trainer-staging
git clone <your-repository-url> current
cd current
npm install
cp deploy/ecosystem.staging.config.cjs /var/www/ai-trainer-staging/current/ecosystem.staging.config.cjs
cp deploy/nginx-ai-trainer-staging.conf /etc/nginx/sites-available/ai-trainer-staging.conf
ln -s /etc/nginx/sites-available/ai-trainer-staging.conf /etc/nginx/sites-enabled/ai-trainer-staging.conf
nginx -t
systemctl reload nginx
```

### 13.2 Staging environment variables

Fill `/var/www/ai-trainer-staging/current/backend/.env` with staging secrets and DB URL.

Important values:

- `PORT=4100`
- `DATABASE_URL=postgresql://ai_trainer_staging_user:...@localhost:5432/ai_trainer_staging`
- `CORS_ORIGIN=https://staging.your-domain.com`
- `YOOKASSA_RETURN_URL=https://staging.your-domain.com/billing/success`
- `WORKOUT_API_KEY_SALT=replace_long_random_workout_salt`

Fill `/var/www/ai-trainer-staging/current/.env.production`:

- `VITE_API_BASE_URL=https://staging.your-domain.com`

### 13.3 Staging GitHub Actions secrets

Add repository secrets for staging workflow:

- `BEGET_STAGING_HOST`
- `BEGET_STAGING_PORT`
- `BEGET_STAGING_USERNAME`
- `BEGET_STAGING_SSH_KEY`

### 13.4 Staging workflow behavior

Workflow file:

- `.github/workflows/deploy-beget-staging.yml`

On push to `develop`, CI/CD runs:

1. `npm install` and `npm run build`
2. SSH deploy to `/var/www/ai-trainer-staging/current`
3. `deploy/update.sh` with variables:
   - `DEPLOY_BRANCH=develop`
   - `PM2_ECOSYSTEM=ecosystem.staging.config.cjs`

## 14. Promotion flow: staging -> production

Use this release process to avoid direct auto-deploy to production.

1. Push to `develop` and wait for successful staging deployment.
2. Ensure `CHANGELOG.md` has a heading for the release version.
   - Example: `## [1.2.3] - 2026-04-15`
3. Create and push release tag in `vX.Y.Z` format from tested commit:

```bash
git checkout develop
git pull
git tag v1.2.3 <tested_commit_sha>
git push origin v1.2.3
```

4. Open GitHub Actions -> `Promote to Production (Beget)` -> `Run workflow`.
5. Fill inputs:
   - `release_tag`: for example `v1.2.3`
   - `change_reason`: short release note
6. Workflow automatically validates before build/deploy:
   - tag matches release policy (`vX.Y.Z` with optional pre-release suffix)
   - tag exists and resolves to commit
   - commit is contained in `develop` history
   - commit has a successful run of `.github/workflows/deploy-beget-staging.yml`
   - `CHANGELOG.md` first release section matches the selected `release_tag`
   - release date is not in the future
   - release section must not contain placeholder bullets like `None.` in `Added/Changed/Fixed`
   - release section follows Keep a Changelog structure (`### Added`, `### Changed`, `### Fixed`)
    - release version bump must match changelog change type (breaking -> major, Added/feat -> minor, fix-only -> patch)
    - all commits in release range must follow Conventional Commits
    - release tag semver bump must match commit types (breaking `!`/`BREAKING CHANGE` -> major, `feat` -> minor, other conventional types -> patch)
7. Approve deployment in protected `production` environment.
8. Verify production smoke tests.

Recommended GitHub environment settings:

- `staging` environment: optional reviewers.
- `production` environment: required reviewers and wait timer.
- Restrict production deploy secrets only to `production` environment.

If validation fails, production deployment is blocked automatically.

## 15. Changelog quality gate

Workflow file:

- `.github/workflows/changelog-check.yml`

Checks on `push` and `pull_request` to `main`/`develop`:

1. `CHANGELOG.md` exists and has `## [Unreleased]`.
2. Release headings follow semantic version format.
3. Every section includes Keep a Changelog subsections.
4. At least one core subsection is present (`Added`, `Changed`, or `Fixed`) with bullet items.
5. Release dates cannot be in the future.
6. On pull requests, failed validation posts or updates an automatic bot comment with fix hints and validator output.

Conventional commit checks run in a separate workflow:

- `.github/workflows/conventional-commits-check.yml`
- validates commit subjects in push/PR range using `type(scope?): description`

During production promotion, checks are stricter for the selected release tag:

- all three core subsections are required (`Added`, `Changed`, `Fixed`)
- placeholder bullets like `None.` are rejected in core subsections
- semantic version bump must match the release content classification (major/minor/patch)

## 16. Recommended hardening

1. Create non-root deploy user and disable direct root login.
2. Allow only required ports in firewall (22, 80, 443).
3. Store backups of PostgreSQL and `.env` secrets.
4. Rotate JWT and provider secrets periodically.

## 17. Final go-live runbook

For a production launch day checklist, use:

- `deploy/GO_LIVE_DAY1.md`

Helpful operational scripts:

- `scripts/smoke-test.mjs` - endpoint and auth smoke checks
- `deploy/backup-postgres.sh` - PostgreSQL backup with retention