## Development Workflow

### Local app loop

1. Start the local stack:

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d --build
```

2. Open:

```text
http://localhost:3000
```

3. Log in with the seeded demo account:

```text
account@taskewr.com / taskewr
```

### Verification commands

Run the current baseline checks from inside Docker:

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec app npm run lint
docker compose --env-file .env.dev -f docker-compose.dev.yml exec app npm test
docker compose --env-file .env.dev -f docker-compose.dev.yml exec -e NODE_ENV=production app npm run build:prod
```

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
