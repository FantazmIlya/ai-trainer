# AI Trainer Backend (Step 22)

Backend with authentication, exercise CRUD, AI proxy, YooKassa subscriptions, Strava integration, and admin user management using Express + Prisma + JWT.

Production deployment guide for Beget VPS:

- `deploy/DEPLOY_BEGET.md`

CI/CD workflows for staging deploy and production promotion on Beget:

- `.github/workflows/deploy-beget.yml`
- `.github/workflows/deploy-beget-staging.yml`
- `.github/workflows/changelog-check.yml`
- `.github/workflows/conventional-commits-check.yml`
- `deploy/update.sh`
- `scripts/smoke-test.mjs`
- `deploy/backup-postgres.sh`

Manual promotion flow (staging -> production with approvals):

- GitHub Actions workflow `Promote to Production (Beget)`
- `production` protected environment in GitHub settings
- automatic validation that promoted commit exists in `develop` and has successful staging deployment
- release tag policy for production (`vX.Y.Z`) with required changelog entry in `CHANGELOG.md`
- changelog validation job that enforces Keep a Changelog structure with `Added`, `Changed`, `Fixed` sections
- promotion gate requires `release_tag` to match first release section in `CHANGELOG.md` and blocks future release dates
- promotion gate rejects placeholder changelog bullets like `None.` in `Added/Changed/Fixed`
- pull requests now get an automatic bot comment with changelog fix hints when validation fails
- changelog PR bot comment now includes a ready release-section template to speed up fixes
- promotion gate enforces semver bump policy by release content type (breaking -> major, Added/feat -> minor, fix-only -> patch)
- promotion gate validates release commit history using Conventional Commits and blocks semver mismatch against commit types
- go-live runbook and operational scripts are included for release-day checks and DB backups (`deploy/GO_LIVE_DAY1.md`)

Staging-specific deployment files:

- `deploy/ecosystem.staging.config.cjs`
- `deploy/nginx-ai-trainer-staging.conf`

## 1) Prepare environment

1. Copy env file:
   cp backend/.env.example backend/.env
2. Set your PostgreSQL credentials in `backend/.env`.

## 2) Run Prisma setup

1. Generate client:
   npx prisma generate --schema backend/prisma/schema.prisma
2. Apply first migration:
   npx prisma migrate dev --schema backend/prisma/schema.prisma --name init_auth

If you already applied Step 2 migration, create the next one:

3. Apply exercise schema changes:
   npx prisma migrate dev --schema backend/prisma/schema.prisma --name add_exercises

4. Apply billing schema changes:
   npx prisma migrate dev --schema backend/prisma/schema.prisma --name add_yookassa_billing

5. Apply Strava schema changes:
   npx prisma migrate dev --schema backend/prisma/schema.prisma --name add_strava_integration

## 3) Start API

node backend/src/server.js

API will start at `http://localhost:4000`.

## Auth endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Exercise endpoints

Public:

- `GET /api/exercises` - list published exercises (search/filter/pagination)
- `GET /api/exercises/:id` - get published exercise details

Admin (Bearer token with ADMIN role):

- `GET /api/exercises/admin/list` - list all exercises, including unpublished
- `GET /api/exercises/admin/:id` - get exercise by id
- `POST /api/exercises` - create exercise
- `PUT /api/exercises/:id` - update exercise
- `DELETE /api/exercises/:id` - delete exercise

## AI endpoints

- `POST /api/ai/chat` - chat with Grok through secure server-side proxy (Bearer token required)

Request body example:

```json
{
  "messages": [
    { "role": "system", "content": "You are a helpful fitness trainer." },
    { "role": "user", "content": "Как улучшить технику приседаний?" }
  ],
  "temperature": 0.7,
  "maxTokens": 600
}
```

### Grok environment variables

- `GROK_API_KEY` - your API key from xAI console
- `GROK_BASE_URL` - default `https://api.x.ai/v1`
- `GROK_MODEL` - default `grok-4.20-reasoning`
- `AI_RATE_LIMIT_WINDOW_SEC` - per-user limit window in seconds
- `AI_RATE_LIMIT_MAX_REQUESTS` - max requests per user in window

## Payments endpoints (Step 5)

Public:

- `GET /api/payments/plans` - list active subscription plans

User (Bearer token):

- `POST /api/payments/yookassa/create` - create YooKassa payment for selected plan
- `GET /api/payments/subscription/me` - current subscription and recent payments

YooKassa webhook:

- `POST /api/payments/yookassa/webhook` - updates payment status and activates subscription

Admin (Bearer token with ADMIN role):

- `POST /api/payments/admin/plans` - create plan
- `PUT /api/payments/admin/plans/:id` - update plan
- `GET /api/payments/admin/payments` - list latest payments

### YooKassa environment variables

- `YOOKASSA_SHOP_ID` - shop identifier
- `YOOKASSA_SECRET_KEY` - API secret key
- `YOOKASSA_API_BASE_URL` - default `https://api.yookassa.ru/v3`
- `YOOKASSA_RETURN_URL` - frontend URL for redirect after payment

### Webhook setup in YooKassa

Set webhook URL in YooKassa merchant cabinet:

- `https://your-domain.com/api/payments/yookassa/webhook`

The backend always verifies payment status from YooKassa API before writing final status to DB.

## Strava endpoints (Step 6)

User (Bearer token):

- `GET /api/strava/connect-url` - get OAuth URL for Strava connect flow
- `GET /api/strava/connection/me` - current Strava connection and latest imported activities
- `POST /api/strava/import` - import athlete activities from Strava API to local DB
- `DELETE /api/strava/connection` - disconnect Strava account

OAuth callback:

- `GET /api/strava/callback` - exchanges code to token and saves connection

Request body example for activity import:

```json
{
  "page": 1,
  "perPage": 30,
  "after": 1735689600
}
```

### Strava environment variables

- `STRAVA_CLIENT_ID` - app client id from Strava settings
- `STRAVA_CLIENT_SECRET` - app client secret
- `STRAVA_REDIRECT_URI` - callback URL, for example `https://your-domain.com/api/strava/callback`
- `STRAVA_OAUTH_BASE_URL` - default `https://www.strava.com/oauth`
- `STRAVA_API_BASE_URL` - default `https://www.strava.com/api/v3`
- `STRAVA_FRONTEND_SUCCESS_URL` - where user is redirected after successful connect
- `STRAVA_FRONTEND_ERROR_URL` - where user is redirected if connect fails
- `STRAVA_STATE_SECRET` - secret used to sign OAuth state parameter

## Admin user management endpoints (Step 8)

Admin (Bearer token with ADMIN role):

- `GET /api/admin/users` - list users with filters and status summary
- `PATCH /api/admin/users/:id/status` - block or unblock user
- `PATCH /api/admin/users/:id/role` - change user role (USER or ADMIN)

Available filters for `GET /api/admin/users`:

- `search` - by email substring or exact user id
- `role` - `USER` or `ADMIN`
- `status` - `ACTIVE` or `BLOCKED`
- `page`, `limit` - pagination