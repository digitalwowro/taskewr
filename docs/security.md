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

## Current Access Model

Current access checks are workspace-scoped. The authenticated actor's workspace role is preserved through the app context, but role-based authorization is not complete yet.

Before adding team roles or external sharing:

- add explicit role checks to the existing policy layer
- use the existing policy layer consistently
- add tests for allowed and denied access paths

Taskewr currently supports one workspace membership per login account. Login rejects accounts with multiple workspace memberships until workspace switching exists.

## Rate Limiting

Login attempts are rate limited by client IP and normalized email address.

Authenticated create/update/move/profile mutations are rate limited by user and workspace. If a mutation reaches the limiter without a valid session, it falls back to client IP. Current limits are intentionally simple fixed-window in-memory guards for single-process deployments.

Production can tune:

- `LOGIN_RATE_LIMIT_MAX_ATTEMPTS`
- `LOGIN_RATE_LIMIT_WINDOW_MS`
- `MUTATION_RATE_LIMIT_MAX_REQUESTS`
- `MUTATION_RATE_LIMIT_WINDOW_MS`

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
