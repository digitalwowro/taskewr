CREATE TABLE "project_members" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" VARCHAR(40) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_members_project_id_user_id_key" ON "project_members"("project_id", "user_id");
CREATE INDEX "project_members_user_id_idx" ON "project_members"("user_id");
CREATE INDEX "project_members_project_id_idx" ON "project_members"("project_id");

INSERT INTO "project_members" ("project_id", "user_id", "role", "created_at", "updated_at")
SELECT
    "projects"."id",
    COALESCE("projects"."owner_user_id", "workspaces"."owner_user_id"),
    'owner',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "projects"
LEFT JOIN "workspaces" ON "workspaces"."id" = "projects"."workspace_id"
WHERE COALESCE("projects"."owner_user_id", "workspaces"."owner_user_id") IS NOT NULL
ON CONFLICT ("project_id", "user_id") DO NOTHING;

ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
