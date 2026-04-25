## Development Workflow

### Local app loop

In development, Postgres runs in Docker and the app runs locally with Node.

1. Create a local env file:

```bash
cp .env.dev.example .env.dev
```

2. Start Postgres:

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d
```

3. Install dependencies and prepare the database:

```bash
set -a; source .env.dev; set +a
npm ci
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
```

4. Start the app locally:

```bash
npm run dev
```

If you open a new terminal, run `set -a; source .env.dev; set +a` again before running local app, Prisma, test, lint, or build commands.

5. Open:

```text
http://localhost:3000
```

6. Log in with the seeded demo account:

```text
account@taskewr.com / taskewr
```

### Verification commands

Run the current baseline checks locally:

```bash
set -a; source .env.dev; set +a
npm run lint
npm test
npm run build:prod
```

If local data or login sessions get tangled while developing, reset the local database:

```bash
npm run dev:reset
```

After a reset, log out or clear cookies for `localhost` if the browser was already signed in.

### Deployment flow

The production image is published to:

```text
ghcr.io/digitalwowro/taskewr:latest
```

The remote Linux server updates with:

```bash
docker compose pull
docker compose up -d
```

### Current architecture expectations

- UI routes compose data from server services
- domain rules live outside React components
- project/task access is private by default
- task hierarchy is always project-scoped
- default filters are:
  - sort: `priority`
  - direction: `desc`
  - statuses: `todo`, `in_progress`
  - priorities: all priorities
