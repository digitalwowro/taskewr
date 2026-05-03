CREATE TABLE "task_time_entries" (
  "id" SERIAL NOT NULL,
  "task_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "created_by_user_id" INTEGER,
  "minutes" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "task_time_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "task_time_entries_task_id_idx" ON "task_time_entries"("task_id");
CREATE INDEX "task_time_entries_user_id_idx" ON "task_time_entries"("user_id");
CREATE INDEX "task_time_entries_created_by_user_id_idx" ON "task_time_entries"("created_by_user_id");

ALTER TABLE "task_time_entries"
  ADD CONSTRAINT "task_time_entries_task_id_fkey"
  FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_time_entries"
  ADD CONSTRAINT "task_time_entries_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_time_entries"
  ADD CONSTRAINT "task_time_entries_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
