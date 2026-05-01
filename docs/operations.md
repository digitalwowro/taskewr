# Operations

This guide covers practical operation of Taskewr: local checks, production deployment, verification, and rollback.

## Local Development Operations

Start the local database:

```bash
cp .env.dev.example .env.dev
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d
```

Prepare the app:

```bash
npm ci
DOTENV_CONFIG_PATH=.env.dev npm run prisma:generate
DOTENV_CONFIG_PATH=.env.dev npm run prisma:migrate:dev
DOTENV_CONFIG_PATH=.env.dev npm run prisma:seed
```

Start the local app and notification worker:

```bash
DOTENV_CONFIG_PATH=.env.dev npm run dev:all
```

Run them separately only when you need isolated logs:

```bash
DOTENV_CONFIG_PATH=.env.dev npm run dev
DOTENV_CONFIG_PATH=.env.dev npm run worker:notifications
```

Open `http://localhost:3000` and log in with:

```text
admin@taskewr.com / admin
user@taskewr.com / user
```

Reset local data when the database or browser session gets messy:

```bash
DOTENV_CONFIG_PATH=.env.dev npm run dev:reset
```

After a reset, clear cookies for `localhost` if the browser still has an old session.

## Local Verification

Run the baseline checks before treating changes as ready:

```bash
npm run lint
DOTENV_CONFIG_PATH=.env.dev npm test
DOTENV_CONFIG_PATH=.env.dev npm run build:prod
```

When the local app is running, run:

```bash
npm run smoke:auth
npm run smoke:browser
```

Verify the production container starts:

```bash
docker build -t taskewr:container-smoke .
npm run smoke:container
```

The container smoke uses `.env.dev` by default and maps the app to `http://127.0.0.1:3010`.

## Production Image

GitHub Actions publishes:

```text
ghcr.io/digitalwowro/taskewr:latest
ghcr.io/digitalwowro/taskewr:sha-<commit>
```

Images are built for:

- `linux/amd64`
- `linux/arm64`

Use immutable `sha-<commit>` tags for pinned deployments and rollback rehearsals. Use `latest` only when intentionally tracking the current `main` branch image.

## Production Environment

Create a `.env` file beside `deploy/docker-compose.yml`:

```env
APP_URL="https://your-domain.com"
APP_PORT=3000

POSTGRES_DB="taskewr"
POSTGRES_USER="taskewr"
POSTGRES_PASSWORD="choose-a-strong-password"

DATABASE_URL="postgresql://taskewr:choose-a-strong-password@db:5432/taskewr?schema=public"
SESSION_SECRET="replace-with-a-long-random-secret"

SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
SMTP_USER="smtp-username"
SMTP_PASSWORD="smtp-password"
SMTP_FROM="Taskewr <no-reply@your-domain.com>"
SMTP_REPLY_TO="support@your-domain.com"

NOTIFICATION_WORKER_POLL_INTERVAL_MS=60000
NOTIFICATION_WORKER_BATCH_SIZE=50
NOTIFICATION_WORKER_MAX_ATTEMPTS=3
NOTIFICATION_WORKER_CLAIM_TIMEOUT_MS=300000
```

Generate `SESSION_SECRET` with:

```bash
openssl rand -base64 48
```

Before exposing a deployment publicly, confirm:

- HTTPS terminates before traffic reaches the app.
- `SESSION_SECRET` is strong and private.
- `/api/v1/auth/login` rate limiting is enabled with appropriate production settings.
- Mutation rate limiting is enabled with appropriate production settings.
- `APP_URL` matches the public origin.
- SMTP settings point at the intended mail server and `SMTP_FROM` is allowed by that server.
- The notification worker service is running if task due reminder emails are enabled.

Optional production rate-limit tuning:

```env
LOGIN_RATE_LIMIT_MAX_ATTEMPTS=5
LOGIN_RATE_LIMIT_WINDOW_MS=900000
MUTATION_RATE_LIMIT_MAX_REQUESTS=300
MUTATION_RATE_LIMIT_WINDOW_MS=300000
PASSWORD_RESET_RATE_LIMIT_MAX_REQUESTS=3
PASSWORD_RESET_RATE_LIMIT_WINDOW_MS=900000
```

## Production Update

On the production server:

```bash
docker compose pull
docker compose up -d
docker compose ps
```

The app container runs Prisma migrations on startup through `docker/entrypoint.sh`. The worker container waits for the app health check and then polls pending task due reminder deliveries.

## Production Verification

Check app logs:

```bash
docker compose logs --tail=100 app
docker compose logs --tail=100 worker
```

Check health:

```bash
curl -fsS http://127.0.0.1:${APP_PORT:-3000}/api/v1/health
```

Expected response:

```json
{"status":"ok","database":"ok"}
```

Verify unauthenticated routing:

```bash
curl -I http://127.0.0.1:${APP_PORT:-3000}/auth/login
curl -I http://127.0.0.1:${APP_PORT:-3000}/
```

Expected:

- `/auth/login` returns `200`
- `/` redirects unauthenticated users to `/auth/login`

## Release Checklist

Before calling a release good, confirm:

- GitHub Actions CI passed.
- GitHub Actions published the production image.
- Production ran `docker compose pull`.
- Production ran `docker compose up -d`.
- `docker compose ps` shows the app and database running.
- `/api/v1/health` returns a healthy database result.
- Login works with the expected account.
- The dashboard, a project page, and one task page load.

## Rollback

Set the app image to a previous immutable tag:

```yaml
image: ghcr.io/digitalwowro/taskewr:sha-previous
```

Then restart:

```bash
docker compose pull
docker compose up -d
```

Keep database backups outside the container lifecycle before rehearsing or performing rollback. Schema migrations may not always be safely reversible by downgrading the app image alone.

## Troubleshooting

- Login loop: clear cookies for the site, then log in again.
- Database connection error: make sure the Postgres Docker container is running.
- App works locally but not in production: check `APP_URL`, `DATABASE_URL`, and `SESSION_SECRET`.
- GitHub package publish issue: confirm the image package belongs to `digitalwowro/taskewr` and Actions has package write permission.
