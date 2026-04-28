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
set -a; source .env.dev; set +a
npm ci
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
```

Start the local app:

```bash
npm run dev
```

Open `http://localhost:3000` and log in with:

```text
account@taskewr.com / taskewr
```

Reset local data when the database or browser session gets messy:

```bash
set -a; source .env.dev; set +a
npm run dev:reset
```

After a reset, clear cookies for `localhost` if the browser still has an old session.

## Local Verification

Run the baseline checks before treating changes as ready:

```bash
set -a; source .env.dev; set +a
npm run lint
npm test
npm run build:prod
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
```

Generate `SESSION_SECRET` with:

```bash
openssl rand -base64 48
```

Before exposing a deployment publicly, confirm:

- HTTPS terminates before traffic reaches the app.
- `SESSION_SECRET` is strong and private.
- `/api/v1/auth/login` rate limiting is enabled with appropriate production settings.
- `APP_URL` matches the public origin.

## Production Update

On the production server:

```bash
docker compose pull
docker compose up -d
docker compose ps
```

The app container runs Prisma migrations on startup through `docker/entrypoint.sh`.

## Production Verification

Check app logs:

```bash
docker compose logs --tail=100 app
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
