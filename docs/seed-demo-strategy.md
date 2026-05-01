# Seed And Demo Data Strategy

## Goals
- Keep local development reproducible.
- Keep screenshots and design review data realistic.
- Keep automated tests isolated from demo data concerns.

## Seed Layers
- **Runtime demo seed**: populated by [prisma/seed.ts](../prisma/seed.ts)
  - Work and Personal workspaces
  - admin and regular demo users
  - explicit project memberships for every seeded project
  - realistic active and archived projects
  - realistic tasks across statuses and priorities
  - labels, parent tasks, overdue tasks, and board ordering examples
- **Test data**: created inside tests as inline fixtures
  - never depend on the runtime seed
  - stay minimal and focused on one rule at a time

## Seed Invariants
- Stable IDs should be preserved for the main demo records where possible.
- The seeded login accounts should stay documented and intentional.
- User creation outside the seed should always create a personal workspace and owner membership for the new user.
- The seed should always include:
  - overdue tasks
  - active tasks
  - archived projects
  - projects split across more than one workspace
  - project membership rows that match seeded project owners
  - a non-admin project member account for role/access checks
  - parent/subtask relationships
  - labels that exercise auto-create and existing-label behavior

## Maintenance Rules
- When changing product defaults, update seed data to reflect them.
- When adding a new domain rule, add at least one seeded example that exercises it.
- When changing URLs or navigation assumptions, keep seeded IDs deterministic for design review and QA.
- Do not put test-only edge cases into the main seed unless they improve real demo coverage.

## Local Workflow
- Rebuild schema changes with:
  - `DOTENV_CONFIG_PATH=.env.dev npm run prisma:migrate:dev`
- Reseed demo data with:
  - `DOTENV_CONFIG_PATH=.env.dev npm run prisma:seed`

## Production Safety
- Production must never depend on seed data.
- Seed commands should only run in explicitly intended environments.
