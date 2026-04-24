# Deployment Verification

## Local Docker Verification
- Run tests:
  - `docker compose --env-file .env.dev -f docker-compose.dev.yml exec app npm test`
- Run production build:
  - `docker compose --env-file .env.dev -f docker-compose.dev.yml exec -e NODE_ENV=production app npm run build:prod`

## Authentication Verification
- Verify unauthenticated app pages redirect to `/auth/login`
- Verify login works with the seeded demo account
- Verify authenticated app pages return successfully
- Verify logout invalidates access to protected pages

## GHCR / Production Image Verification
- Ensure the production image still builds and publishes through GitHub Actions.
- Ensure the container starts with migration-on-boot behavior intact.

## Remote Linux Verification
- Pull latest image:
  - `docker compose pull`
- Restart stack:
  - `docker compose up -d`
- Verify application health and main pages after deploy.

## Recovery Verification
- Keep database backups external to the container lifecycle.
- Keep `.env` only on the server.
- Rehearse rollback by redeploying the previous image tag if a release fails.

