# Operator Checklist

This is the short, practical checklist for running Taskewr when you are not editing code by hand.

## Start Local Development

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d
set -a; source .env.dev; set +a
npm run dev
```

Open `http://localhost:3000` and log in with `account@taskewr.com / taskewr`.

## Reset Local Data

Use this when local data is messy, login behaves strangely, or you want to return to the seeded demo state:

```bash
npm run dev:reset
```

After a reset, old browser sessions may point to users that no longer exist. If login acts weird, log out or clear cookies for `localhost`.

## Run The Safety Checks

Before asking Codex to push or publish, run:

```bash
npm run lint
npm test
npm run build:prod
```

If the dev server is running, also run:

```bash
npm run smoke:auth
npm run smoke:browser
```

To verify that the Docker image starts like production, build an image and run the container smoke:

```bash
docker build -t taskewr:container-smoke .
npm run smoke:container
```

The container smoke uses `.env.dev` by default and maps the app to `http://127.0.0.1:3010`.

## Known Good Release

Before calling a release good, confirm:

- GitHub Actions CI passed.
- GitHub Actions published `ghcr.io/digitalwowro/taskewr:latest`.
- Production ran `docker compose pull`.
- Production ran `docker compose up -d`.
- `docker compose ps` shows the app and database running.
- `/api/v1/health` returns a healthy database result.
- Login works with the expected account.
- The dashboard, a project page, and one task page load.

## Production Update

On the production server:

```bash
docker compose pull
docker compose up -d
```

Then check:

```bash
docker compose ps
curl -fsS https://YOUR_DOMAIN/api/v1/health
```

The health endpoint should return a healthy status and database result.

## When Something Feels Wrong

- Login loop: reset cookies for the site, then log in again.
- Database connection error: make sure the Postgres Docker container is running.
- App works locally but not in production: check `APP_URL`, `DATABASE_URL`, and `SESSION_SECRET`.
- GitHub package publish issue: confirm the image package belongs to `digitalwowro/taskewr` and Actions has package write permission.
