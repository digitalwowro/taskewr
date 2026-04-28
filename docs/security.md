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

Current access checks are workspace-scoped and owner-oriented. The schema is prepared for broader memberships and future sharing, but role-based authorization is not complete yet.

Before adding team roles or external sharing:

- replace owner-oriented assumptions with real role checks
- use the existing policy layer consistently
- add tests for allowed and denied access paths

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

- Login rate limiting before public internet exposure.
- Rate limits for mutation endpoints.
- API token strategy for mobile and external clients.
- Explicit share and ACL audit events.
- Secret rotation guidance for session and external auth providers.
