ALTER TABLE "users" ADD COLUMN "app_role" VARCHAR(40) NOT NULL DEFAULT 'user';
ALTER TABLE "users" ADD COLUMN "deactivated_at" TIMESTAMP(3);

CREATE INDEX "users_app_role_idx" ON "users"("app_role");
CREATE INDEX "users_deactivated_at_idx" ON "users"("deactivated_at");

UPDATE "users"
SET "app_role" = 'admin'
WHERE "id" IN (
  SELECT "owner_user_id"
  FROM "workspaces"
  WHERE "owner_user_id" IS NOT NULL
  UNION
  SELECT "user_id"
  FROM "workspace_members"
  WHERE "role" = 'owner'
  UNION
  SELECT MIN("id")
  FROM "users"
);
