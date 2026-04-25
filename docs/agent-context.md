# Taskewr Agent Context

## Project Summary

Taskewr is a self-hosted task and project management system built with Next.js, React, Prisma, and Postgres.

The repository is hosted at `digitalwowro/taskewr`.

## Current Product State

The implementation baseline is already in place:

- DB-backed dashboard, projects, project detail, task list, task board, and task editing flows.
- Built-in login/session authentication with a seeded demo account.
- Project archive/unarchive and manual ordering.
- Task parent/subtask rules, labels, priorities, dates, statuses, and board lane ordering.
- Backend search foundations and versioned API routes.
- Production Docker image and compose deployment path.

The next likely work is iterative QA, bug fixing, UX polish, security hardening, and production readiness rather than architectural bootstrap.

## Runtime Model

- Production runs fully in Docker.
- Development runs Postgres in Docker and runs the app, Prisma, lint, tests, and builds locally with Node.js.
- Do not reintroduce a development app container unless explicitly requested.
- Keep `docker-compose.dev.yml` focused on local development dependencies, currently Postgres only.
- Keep `deploy/docker-compose.yml` focused on production deployment with app and database containers.

## Local Development

- Copy `.env.dev.example` to `.env.dev`.
- Start Postgres with `docker compose --env-file .env.dev -f docker-compose.dev.yml up -d`.
- Export local env before app, Prisma, lint, test, or build commands:

```bash
set -a; source .env.dev; set +a
```

- Generate Prisma client with `npm run prisma:generate`.
- Run local migrations with `npm run prisma:migrate:dev`.
- Seed demo data with `npm run prisma:seed`.
- Start the app with `npm run dev`.
- Open `http://localhost:3000`.
- Seeded login is `account@taskewr.com` / `taskewr`.

## Setup Gotchas

- `src/generated/prisma` is required before TypeScript, tests, or Next.js can resolve generated Prisma imports.
- Run `npm run prisma:generate` after `npm ci` and after schema/client changes.
- Local app commands need `.env.dev` exported into the shell; Prisma does not automatically read `.env.dev`.
- Development Postgres is reachable from the host at `localhost:5433`.
- Production/container-to-container Postgres is reachable at `db:5432`.
- `SESSION_SECRET` must be set in production; development can use the value from `.env.dev.example`.
- `.DS_Store` files are ignored and may appear on macOS; do not treat them as meaningful project changes.

## Production

- Production uses the image `ghcr.io/digitalwowro/taskewr:latest`.
- Production images are published for `linux/amd64` and `linux/arm64`.
- Production database URLs should use Docker service DNS, for example `db:5432`.
- `SESSION_SECRET` is required in production.
- The production app container runs Prisma migrations on startup through `docker/entrypoint.sh`.

## Architecture

- `src/app`: Next.js routes and route composition.
- `src/components`: reusable UI components.
- `src/domain`: pure business rules, validation, constants, and schemas.
- `src/data`: Prisma repositories and persistence mapping.
- `src/server/services`: use-case orchestration.
- `src/app/api/v1`: thin API transport wrappers around services.
- `prisma/schema.prisma`: database schema.
- `prisma/seed.ts`: deterministic demo data seed.

## Code Boundaries

- Keep business rules and validation in `src/domain`.
- Keep Prisma queries and persistence mapping in `src/data/prisma/repositories`.
- Keep use-case orchestration in `src/server/services`.
- Keep `src/app/api/v1` route handlers thin and service-backed.
- Keep page routes focused on composition, route params, auth redirects, and service calls.
- Do not put Prisma queries directly in React components or page route components.
- Prefer existing schemas and domain helpers over ad hoc validation.
- Keep UI behavior consistent with existing `src/components/app` patterns unless intentionally redesigning.

## Domain Expectations

- Taskewr is private by default.
- Task hierarchy is project-scoped.
- A task cannot parent itself.
- Task hierarchy cycles are invalid.
- A parent task cannot be marked done while descendants are still active.
- Archived projects are excluded from dashboard activity.
- Project and task lane ordering are explicit.
- Default task filters are sort `priority`, direction `desc`, statuses `todo` and `in_progress`, and all priorities.

## Auth And Access

- Pages should require authentication unless explicitly public, such as `/auth/login`.
- `/api/v1/health` is intentionally public and checks database connectivity.
- API routes should report domain/auth errors through `toErrorResponse`.
- Current access checks are workspace-scoped and owner-oriented, but the schema is prepared for broader memberships and future sharing.
- Be careful when adding project/task queries: preserve workspace filtering and private-by-default behavior.

## Generated And Local Files

- `src/generated/prisma` is generated and not committed.
- `node_modules`, `.next`, local env files, and macOS `.DS_Store` files are not committed.
- The main `README.md` is human-facing and may include normal contributor setup instructions.
- Keep deploy examples free of real secrets.
- Keep demo seed data deterministic enough for manual QA and screenshots.

## Verification

Prefer these local checks before treating code changes as ready:

```bash
set -a; source .env.dev; set +a
npm run lint
npm test
npm run build:prod
```

Use `docker compose --env-file .env.dev -f docker-compose.dev.yml config` to validate the development Postgres compose file.

When the app is running locally, use `npm run smoke:auth` for the authenticated smoke path. Set `TASKEWR_BASE_URL`, `TASKEWR_SMOKE_EMAIL`, or `TASKEWR_SMOKE_PASSWORD` only when testing non-default environments.

Use `npm run smoke:browser` for a browser-level login, dashboard, project, task create/edit, and board status smoke path.

CI runs install, Prisma generation, migrations against Postgres, lint, tests, production build, seed, and both smoke scripts.

Use `npm run clean:macos` to remove local `.DS_Store` files outside ignored dependency/build/git folders.

## Operational Notes

- Production startup runs migrations through `docker/entrypoint.sh`.
- `/api/v1/health` can be used by deployment smoke checks and reverse-proxy monitoring.
- `postcss` is pinned through npm `overrides` to avoid GHSA-qx2v-qp2m-jg93 while keeping Next on the current major. Do not run `npm audit fix --force` if npm suggests a Next downgrade.
- Repeat settings are metadata on normal tasks, not a parallel recurring-task model. See `docs/recurrence.md`. Future notification work should add a worker that calls `RepeatTaskService.syncDueTasks` rather than duplicating repeat logic.
- Demo seeding is intentional for local and explicit QA environments only; production must not depend on seed data.
- The production compose file should continue to persist both Postgres data and app uploads.
- If adding upload or file-storage behavior, keep `/app/storage/uploads` compatible with the existing production volume.
