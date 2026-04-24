## Release Readiness

### Required verification

Run these checks before treating a change as release-ready:

```bash
set -a; source .env.dev; set +a
npm run lint
npm test
npm run build:prod
node scripts/smoke-authenticated.mjs
```

### Manual browser QA

- Log in with the seeded demo account.
- Verify dashboard filters and reset behavior.
- Verify project list reorder/edit/archive/unarchive.
- Verify project detail list and board views.
- Verify board drag/drop persists after refresh.
- Verify task edit/create/share behavior.
- Verify shell search opens matching tasks.
- Verify logout returns protected routes to login.

### Remote deployment QA

After the image is published:

```bash
docker compose pull
docker compose up -d
docker compose ps
curl -I http://127.0.0.1:9005/auth/login
curl -I http://127.0.0.1:9005/
```

Expected:

- `/auth/login` returns `200`
- `/` returns `307` to login when unauthenticated

### Clean bootstrap verification

Use an isolated compose project with fresh volumes:

1. Copy `deploy/docker-compose.yml` into a temporary directory and place a matching `.env` beside it.
2. Use a high, isolated host port such as `19010`.
3. Start the stack with a unique compose project name.
4. Run migrations implicitly on app boot.
5. Seed demo data explicitly with:

```bash
docker compose exec app npm run prisma:seed
```

6. Run the authenticated smoke test against that isolated stack.

Verified current bootstrap target:

- base URL: `http://127.0.0.1:19010`
- image: `ghcr.io/digitalwowro/taskewr:sha-b988b02`
- result: seed + authenticated smoke pass

### Rollback rehearsal

Keep one previous image tag available, for example:

```text
ghcr.io/digitalwowro/taskewr:sha-39037bc
```

Rehearse rollback by:

1. Seed a fresh isolated database with the current image first.
2. Swap only the app image to the previous tag while keeping the seeded database volume.
3. Verify `/auth/login` and an authenticated smoke pass.
4. Restore the current `latest` deployment.

### Current reference image

- current release image tag: `ghcr.io/digitalwowro/taskewr:sha-b988b02`
- previous rollback image tag: `ghcr.io/digitalwowro/taskewr:sha-39037bc`
