# Repeat Settings

Repeat settings are scheduling metadata on normal tasks. Taskewr does not have a separate recurring-task system.

## Product Model

A task may have repeat settings enabled. When repeat settings are enabled, Taskewr creates or updates ordinary tasks on the same dashboard, project list, board, search, and task detail views.

The schedule answers when the task repeats:

- every N days
- every N weeks on selected weekdays
- every N months on a selected day
- specific dates

The incomplete behavior answers what happens when a repeat is due and the previous generated task is still open:

- Reuse the open task
- Create a separate task

These options are independent. Daily is simply every 1 day and does not get hidden special behavior.

## Current Sync Strategy

Repeat sync runs opportunistically when app data is loaded. The app calls `RepeatTaskService.syncDueTasksForProjects(accessibleProjectIds, now)` before loading dashboard, project, or task page data, so request-time sync only touches projects the actor can access.

This is enough for task creation because the user sees updated repeated tasks when the app or API is opened.

## Notification Worker

Notifications use background work because a user may not open the app before a reminder time.

Task due reminder email is scheduled through database-backed delivery rows and sent by the notification worker. In local development, `DOTENV_CONFIG_PATH=.env.dev npm run dev:all` starts the app and worker together. Production runs `app` and `worker` as separate containers from the same Docker image.

The worker should not introduce a parallel repeat implementation. Repeat calculation remains inside `RepeatTaskService`; any future recurring-task notification behavior should reuse that service and then sync notification delivery rows.
