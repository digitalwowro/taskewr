# Taskewr Architecture Plan

## Product Scope

Taskewr is being implemented as a single web application with a clear separation between:

- UI composition
- domain rules
- persistence
- service orchestration
- transport boundaries

The current implementation target is the existing designed product:

- dashboard
- projects list
- project detail
- task editing
- project editing
- task board

Search UI is intentionally deferred, but the backend must be prepared now.

## Product Defaults

- default sort: `priority`
- default direction: `desc`
- default statuses: `todo`, `in_progress`
- default priorities: all priorities

These defaults must live in shared domain code and be reused across:

- dashboard
- projects
- search
- reset actions

## Core Domain Rules

- a task belongs to exactly one project
- parent/subtask relationships are project-scoped
- no self-parenting
- no hierarchy cycles
- a parent cannot be marked done while descendants are still active
- archived projects are excluded from dashboard activity
- project ordering is explicit
- task lane ordering is explicit

## Architecture Layers

### `src/app`

Route composition only.

Responsibilities:

- layout composition
- route params
- rendering server/client components
- calling services

Must not contain business rules or Prisma queries.

### `src/components`

Reusable UI pieces.

Responsibilities:

- app shell
- dashboard sections
- project sections
- modals
- filter controls
- board/list presentation

### `src/domain`

Pure business logic and validation.

Responsibilities:

- enums and labels
- filter defaults
- hierarchy rules
- archive rules
- ordering rules
- search normalization
- future cycle constraints
- auth/permission policy rules

This layer should stay framework-light and reusable.

### `src/data`

Persistence and repository layer.

Responsibilities:

- Prisma-backed repositories
- persistence mapping
- transaction boundaries

### `src/server/services`

Use-case orchestration.

Responsibilities:

- dashboard payload assembly
- project mutations and queries
- task mutations and queries
- search execution
- auth/session orchestration

The web UI and future API routes should both call this layer.

### `src/app/api/v1`

Thin transport wrappers around services.

Prepared now for future:

- mobile apps
- external clients
- versioned API contracts

## Ownership and Sharing

Taskewr is private by default.

The current product supports multiple workspace memberships per login account. Workspace membership allows a user to create projects in that workspace, but it is not the visibility boundary for existing project data.

Project membership is the source of truth for project and task visibility:

- a user only sees projects where they have a `ProjectMember` row
- task reads and mutations inherit access from the task project
- dashboard, search, repeat sync, project detail, and task detail must filter through accessible project IDs
- workspace owners do not implicitly see every project in the workspace unless they are also project members

Sharing/invite UI is intentionally deferred. The data model supports future sharing, while v1 only auto-adds the project creator as project owner.

## Search Backend Readiness

Search UI is deferred.

The backend must support:

- searching task title
- searching task description
- status filters
- priority filters
- shared sort/direction behavior
- exclusion of archived-project tasks by default

Search contracts must be reusable for future:

- web UI
- API
- mobile clients

## Future Readiness

The codebase must remain ready for:

- multiple users
- login/session auth
- ACLs and sharing
- OAuth / OIDC / SSO
- LDAP / RADIUS integration paths
- mobile apps
- internal and external APIs
- cycles
- assignees
- audit logs
- attachments
- background jobs
- webhooks and integrations

The `Cycle` model is reserved schema for future cycle/sprint-style planning. It should not be treated as an active product surface until API and UI flows exist.

## Operational Readiness

The implementation must also account for:

- migrations
- backup / restore
- disaster recovery / rollback
- performance budget
- observability
- accessibility baseline
- internationalization readiness
- export readiness
- seeding / demo-data strategy
- input normalization standards

## Recommended Build Order

1. Prisma schema and migrations
2. shared domain constants and defaults
3. domain services and validators
4. dashboard backend
5. projects backend
6. tasks backend
7. search backend
8. UI wiring to real data
9. auth foundation
10. internal API boundary

## Current Phase

The implementation baseline is now in place:

- real DB-backed dashboard, projects, project detail, and task flows
- real task/project mutation APIs
- real login/session foundation
- multi-workspace app context and project-membership policy checks
- search backend implemented and tested
- Docker local development and production build flow verified

The next phase is broader real-world QA and iterative bug-fixing, not architectural bootstrap.
