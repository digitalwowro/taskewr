-- Labels are now app-wide vocabulary entries. Normalize existing names,
-- merge duplicates, and keep task associations pointing at the canonical row.

DELETE FROM "label_task"
WHERE "label_id" IN (
  SELECT "id"
  FROM "labels"
  WHERE btrim("name") = ''
);

DELETE FROM "labels"
WHERE btrim("name") = '';

CREATE TEMP TABLE "label_canonical" AS
SELECT
  MIN("id") AS "canonical_id",
  lower(regexp_replace(btrim("name"), '[[:space:]]+', ' ', 'g')) AS "normalized_name"
FROM "labels"
GROUP BY lower(regexp_replace(btrim("name"), '[[:space:]]+', ' ', 'g'));

CREATE TEMP TABLE "label_task_canonical" AS
SELECT DISTINCT
  "label_canonical"."canonical_id" AS "label_id",
  "label_task"."task_id" AS "task_id"
FROM "label_task"
JOIN "labels" ON "labels"."id" = "label_task"."label_id"
JOIN "label_canonical"
  ON "label_canonical"."normalized_name" = lower(regexp_replace(btrim("labels"."name"), '[[:space:]]+', ' ', 'g'));

DELETE FROM "label_task";

INSERT INTO "label_task" ("label_id", "task_id", "created_at", "updated_at")
SELECT "label_id", "task_id", now(), now()
FROM "label_task_canonical";

DELETE FROM "labels"
WHERE "id" NOT IN (
  SELECT "canonical_id"
  FROM "label_canonical"
);

UPDATE "labels"
SET
  "name" = lower(regexp_replace(btrim("name"), '[[:space:]]+', ' ', 'g')),
  "workspace_id" = NULL,
  "owner_user_id" = NULL;

DROP INDEX "labels_owner_user_id_name_key";

CREATE UNIQUE INDEX "labels_name_key" ON "labels"("name");
