# Production Deployment

Taskewr production runs fully in Docker with the application and Postgres managed by Compose.

## Image

The GitHub Actions publish workflow publishes:

- `ghcr.io/digitalwowro/taskewr:latest`
- `ghcr.io/digitalwowro/taskewr:sha-<commit>`

Images are built for:

- `linux/amd64`
- `linux/arm64`

Use the immutable `sha-<commit>` tag for rollback rehearsals and pinned production deployments. Use `latest` only when intentionally tracking the current main branch image.

## Required Environment

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

## Update Flow

```bash
docker compose pull
docker compose up -d
docker compose ps
```

The app container runs Prisma migrations on startup through `docker/entrypoint.sh`.

## Verification

Check the container status:

```bash
docker compose ps
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
