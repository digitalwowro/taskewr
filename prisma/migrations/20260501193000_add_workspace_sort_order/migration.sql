ALTER TABLE "workspaces" ADD COLUMN "sort_order" INTEGER;

UPDATE "workspaces"
SET "sort_order" = ranked."sort_order"
FROM (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "name" ASC, "id" ASC)::integer AS "sort_order"
  FROM "workspaces"
) AS ranked
WHERE "workspaces"."id" = ranked."id";

ALTER TABLE "workspaces" ALTER COLUMN "sort_order" SET NOT NULL;
ALTER TABLE "workspaces" ALTER COLUMN "sort_order" SET DEFAULT 1;

CREATE INDEX "workspaces_sort_order_idx" ON "workspaces"("sort_order");
