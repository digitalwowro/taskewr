# Implementation Checklist

## Milestone 1: Remove Remaining Fallback Weight From The Shell
- [x] Move the large fallback task/project/detail datasets out of [src/app/mock-app.tsx](D:/Code/taskewr/src/app/mock-app.tsx)
- [x] Move route-level static nav definitions out of [src/app/mock-app.tsx](D:/Code/taskewr/src/app/mock-app.tsx)
- [x] Keep realistic seed/demo data, but isolate it from route coordination code
- [x] Make [src/app/mock-app.tsx](D:/Code/taskewr/src/app/mock-app.tsx) primarily a coordinator, not a giant source file
- [x] Keep local Docker production build green after each extraction

## Milestone 2: Finish Shell Refactor
- [x] Extract remaining route/state helpers from [src/app/mock-app.tsx](D:/Code/taskewr/src/app/mock-app.tsx)
- [x] Move URL/filter state helpers into small hooks or utilities
- [x] Split dashboard/project/task route coordination into smaller containers
- [x] Remove duplicated open/close/share/URL plumbing from the main shell
- [x] Keep all current UI behavior unchanged while refactoring

## Milestone 3: Productionize Real App Flows
- [x] Finish DB-backed dashboard queries and counts
- [x] Finish DB-backed project list/detail flows
- [x] Finish DB-backed task create/edit flows
- [x] Finish board drag/drop persistence and refresh behavior
- [x] Verify project archive/unarchive/reorder end-to-end
- [x] Verify same-project subtask validation end-to-end
- [x] Verify label auto-create and color generation end-to-end
- [x] Verify `/tasks/[id]` share flow opens in owning project context

## Milestone 4: Search Backend
- [x] Finalize task title/description search against real DB data
- [x] Apply default filters consistently in search service
- [x] Exclude archived-project tasks by default
- [x] Return stable task/project metadata for future UI, API, and mobile clients
- [x] Add tests for search filtering and sorting

## Milestone 5: Auth And Ownership Foundation
- [x] Add real login/session foundation
- [x] Replace any bootstrap ownership assumptions with authenticated context
- [x] Centralize access policies for project/task visibility
- [x] Keep auth abstraction ready for OAuth/OIDC/SSO/LDAP/RADIUS later
- [x] Preserve private-by-default, explicitly-shared direction

## Milestone 6: API, Tests, And Hardening
- [x] Standardize API response/error shapes
- [x] Add domain/service tests for hierarchy, ordering, archive, timezone, and board moves
- [x] Add seed/demo strategy documentation and maintenance flow
- [x] Add security and observability baselines
- [x] Re-verify Docker/GHCR/Linux deployment flow after backend completion

## Milestone 7: Final UX/Accessibility Pass
- [x] Add missing loading, empty, disabled, and error states
- [x] Review interaction polish across dashboard, projects, project detail, and modals
- [x] Complete accessibility pass for keyboard/focus/modal behavior
- [x] Complete final production cleanup before broader testing
