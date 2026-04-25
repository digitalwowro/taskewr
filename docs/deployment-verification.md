# Deployment Verification

## Local Verification
- Run tests:
  - `set -a; source .env.dev; set +a`
  - `npm test`
- Run production build:
  - `set -a; source .env.dev; set +a`
  - `npm run build:prod`
- Run browser smoke while the local app is running:
  - `npm run smoke:browser`
- Run container smoke after building the image:
  - `docker build -t taskewr:container-smoke .`
  - `npm run smoke:container`

## Authentication Verification
- Verify `/api/v1/health` returns `200` when the app can reach the database.
- Verify unauthenticated app pages redirect to `/auth/login`
- Verify login works with the seeded demo account
- Verify authenticated app pages return successfully
- Verify logout invalidates access to protected pages

## GHCR / Production Image Verification
- Ensure the production image still builds and publishes through GitHub Actions.
- Ensure the container starts with migration-on-boot behavior intact.
- Ensure `/api/v1/health` succeeds from inside a freshly started production container.

## Remote Linux Verification
- Generate a strong `SESSION_SECRET` with `openssl rand -base64 48`.
- Pull latest image:
  - `docker compose pull`
- Restart stack:
  - `docker compose up -d`
- Verify application health and main pages after deploy.

## Recovery Verification
- Keep database backups external to the container lifecycle.
- Keep `.env` only on the server.
- Rehearse rollback by redeploying the previous image tag if a release fails.
