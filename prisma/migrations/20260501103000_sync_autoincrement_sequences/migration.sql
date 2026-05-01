-- Some seed data uses stable IDs so demo task/project codes stay predictable.
-- Keep PostgreSQL sequences ahead of imported or explicitly inserted rows.

SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "users";
SELECT setval(pg_get_serial_sequence('workspaces', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "workspaces";
SELECT setval(pg_get_serial_sequence('workspace_members', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "workspace_members";
SELECT setval(pg_get_serial_sequence('project_members', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "project_members";
SELECT setval(pg_get_serial_sequence('auth_accounts', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "auth_accounts";
SELECT setval(pg_get_serial_sequence('projects', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "projects";
SELECT setval(pg_get_serial_sequence('tasks', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "tasks";
SELECT setval(pg_get_serial_sequence('task_repeat_rules', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "task_repeat_rules";
SELECT setval(pg_get_serial_sequence('cycles', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "cycles";
SELECT setval(pg_get_serial_sequence('labels', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "labels";
SELECT setval(pg_get_serial_sequence('label_task', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "label_task";
SELECT setval(pg_get_serial_sequence('audit_logs', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "audit_logs";
