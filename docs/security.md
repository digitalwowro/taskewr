# Security And Observability

## Security Baseline

- Taskewr is private by default.
- Pages should require authentication unless explicitly public, such as `/auth/login`.
- `/api/v1/health` is intentionally public and checks database connectivity.
- All task and project access should flow through centralized policy checks.
- Authenticated context is required for app data access.
- API routes should report domain and auth errors through shared responders.
- Validation should happen in domain schemas before mutations reach repositories.

Session cookies must remain:

- HTTP-only
- SameSite `lax`
- `secure` in production

Password reset links are email-based and use one-time tokens:

- only token hashes are stored
- reset tokens expire after 60 minutes
- public reset requests return the same response whether or not an account exists
- password changes increment the user's session version so older sessions stop authenticating

## Current Access Model

Taskewr supports multiple workspace memberships per login account. Login no longer assumes a single workspace.

Project membership is the source of truth for project and task visibility:

- a user only sees projects where they have a `ProjectMember` row
- task reads and mutations inherit access from the task's project
- dashboard, search, repeat sync, project detail, and task detail must filter through accessible project IDs
- workspace membership does not reveal every project in that workspace

Workspace membership controls workspace administration and project creation scope:

- workspace `owner` and `admin` members can manage that workspace
- plain workspace `member` users cannot manage workspace settings or access
- global app admins can administratively manage all users and workspaces
- app-admin workspace management does not automatically grant project/task visibility

Deactivation is the v1 user-delete mechanism. Deactivated users cannot log in, while historical ownership and membership records remain intact.

## Rate Limiting

Login attempts are rate limited by client IP and normalized email address.

Password reset requests are rate limited by client IP and normalized email address.

## Task Email Notifications

Task due-time notification email is opt-in per task. A task only schedules due reminder email when it has both a due date and reminder time.

Task creators are subscribed automatically, and users with task access can subscribe or unsubscribe themselves. Notification delivery rows are stored in the database so sends can be deduplicated, retried, inspected, and canceled when a task is completed, archived, unscheduled, or unsubscribed.

Authenticated create/update/move/profile mutations are rate limited by user and workspace. If a mutation reaches the limiter without a valid session, it falls back to client IP. Current limits are intentionally simple fixed-window in-memory guards for single-process deployments.

Production can tune:

- `LOGIN_RATE_LIMIT_MAX_ATTEMPTS`
- `LOGIN_RATE_LIMIT_WINDOW_MS`
- `MUTATION_RATE_LIMIT_MAX_REQUESTS`
- `MUTATION_RATE_LIMIT_WINDOW_MS`
- `PASSWORD_RESET_RATE_LIMIT_MAX_REQUESTS`
- `PASSWORD_RESET_RATE_LIMIT_WINDOW_MS`

Before running multiple app instances, move rate-limit state to a shared store such as Redis or another production cache.

The `AuditLog` schema is reserved for future audit logging. Sensitive operations that should eventually write audit records include:

- task create/update/delete
- board moves
- project archive/unarchive
- future sharing and ACL changes

## Input Normalization

- Trim user-entered text fields.
- Normalize label names before create/sync.
- Keep null vs empty-string behavior consistent at service boundaries.
- Reject invalid enum/date combinations centrally.

## Observability Baseline

- Use structured service-level logging for unexpected failures.
- Keep API error responses consistent through shared responders.
- Preserve stable error codes for clients.
- Add request correlation IDs when the API surface grows further.
- Keep room for future audit logs and external error reporting integration.

## Future Security Work

- Shared-store rate limiting for multi-instance deployments.
- API token strategy for mobile and external clients.
- Explicit share and ACL audit events.
- Secret rotation guidance for session and external auth providers.
