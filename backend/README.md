# AI Trainer Backend (Step 22)

Backend with authentication, exercise CRUD, AI proxy, YooKassa subscriptions, workout tracking/import, and admin user management using Express + Prisma + JWT.

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

5. Apply workout tracking schema changes:
   npx prisma migrate dev --schema backend/prisma/schema.prisma --name add_workout_tracking

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

- `POST /api/ai/chat` - chat with OpenRouter (free models) through secure server-side proxy (Bearer token required)

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

### AI environment variables (OpenRouter)

- `OPENROUTER_API_KEY` - your API key from OpenRouter
- `OPENROUTER_BASE_URL` - default `https://openrouter.ai/api/v1`
- `OPENROUTER_MODEL` - default `deepseek/deepseek-chat-v3-0324:free`
- `OPENROUTER_SITE_URL` - optional site URL for OpenRouter headers
- `OPENROUTER_SITE_NAME` - optional site name for OpenRouter headers
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

## Workout endpoints (Step 6 replacement)

User (Bearer token):

- `GET /api/workouts` - list latest workouts for current user
- `POST /api/workouts/manual` - create manual workout entry
- `POST /api/workouts/import` - import workouts from CSV/GPX/TCX file content
- `GET /api/workouts/integration/me` - get current API push integration info
- `POST /api/workouts/integration/regenerate-key` - rotate API key for external integrations

Public push endpoint for external apps:

- `POST /api/workouts/integration/push/:apiKey`

Request body example for manual workout:

```json
{
  "title": "Интервальный бег",
  "type": "Бег",
  "startedAt": "2026-04-16T09:00:00.000Z",
  "distanceKm": 6.4,
  "durationMin": 42,
  "calories": 520,
  "notes": "Пульс в зоне 3"
}
```

### Workout integration environment variables

- `WORKOUT_API_KEY_SALT` - salt for hashing personal API keys (defaults to JWT secret)

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