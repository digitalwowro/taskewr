# Security And Observability Baseline

## Security Baseline
- Private by default, explicitly shared later.
- All task and project access must flow through centralized policy checks.
- Authenticated context is required for app data access.
- Session cookies must remain:
  - HTTP-only
  - same-site `lax`
  - `secure` in production
- Validation must happen in domain schemas before mutations reach repositories.
- Sensitive operations should be ready for audit logging:
  - task updates
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
- Rate limits for auth and mutation endpoints
- API token strategy for mobile and external clients
- explicit share/ACL audit events
- secret rotation guidance for session and external auth providers

