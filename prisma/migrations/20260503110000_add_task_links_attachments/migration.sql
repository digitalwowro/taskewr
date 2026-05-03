CREATE TABLE "task_links" (
  "id" SERIAL NOT NULL,
  "task_id" INTEGER NOT NULL,
  "created_by_user_id" INTEGER,
  "title" VARCHAR(200) NOT NULL,
  "url" VARCHAR(2048) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "task_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "task_attachments" (
  "id" SERIAL NOT NULL,
  "task_id" INTEGER NOT NULL,
  "uploaded_by_user_id" INTEGER,
  "original_file_name" VARCHAR(255) NOT NULL,
  "storage_key" VARCHAR(160) NOT NULL,
  "mime_type" VARCHAR(120),
  "size_bytes" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "task_attachments_storage_key_key" ON "task_attachments"("storage_key");

CREATE INDEX "task_links_task_id_idx" ON "task_links"("task_id");
CREATE INDEX "task_links_created_by_user_id_idx" ON "task_links"("created_by_user_id");
CREATE INDEX "task_attachments_task_id_idx" ON "task_attachments"("task_id");
CREATE INDEX "task_attachments_uploaded_by_user_id_idx" ON "task_attachments"("uploaded_by_user_id");

ALTER TABLE "task_links"
  ADD CONSTRAINT "task_links_task_id_fkey"
  FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_links"
  ADD CONSTRAINT "task_links_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "task_attachments"
  ADD CONSTRAINT "task_attachments_task_id_fkey"
  FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_attachments"
  ADD CONSTRAINT "task_attachments_uploaded_by_user_id_fkey"
  FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
