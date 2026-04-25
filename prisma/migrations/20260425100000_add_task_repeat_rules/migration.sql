CREATE TABLE "task_repeat_rules" (
    "id" SERIAL NOT NULL,
    "workspace_id" INTEGER,
    "project_id" INTEGER NOT NULL,
    "source_task_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "schedule_type" VARCHAR(40) NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "weekdays" JSONB,
    "month_day" INTEGER,
    "specific_dates" JSONB,
    "incomplete_behavior" VARCHAR(40) NOT NULL,
    "next_due_date" DATE,
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_repeat_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "task_repeat_rules_source_task_id_key" ON "task_repeat_rules"("source_task_id");
CREATE INDEX "task_repeat_rules_workspace_id_idx" ON "task_repeat_rules"("workspace_id");
CREATE INDEX "task_repeat_rules_project_id_idx" ON "task_repeat_rules"("project_id");
CREATE INDEX "task_repeat_rules_is_active_idx" ON "task_repeat_rules"("is_active");
CREATE INDEX "task_repeat_rules_next_due_date_idx" ON "task_repeat_rules"("next_due_date");

ALTER TABLE "tasks" ADD COLUMN "repeat_rule_id" INTEGER;
ALTER TABLE "tasks" ADD COLUMN "repeat_scheduled_for" DATE;
ALTER TABLE "tasks" ADD COLUMN "repeat_period_start" DATE;
ALTER TABLE "tasks" ADD COLUMN "repeat_period_end" DATE;
ALTER TABLE "tasks" ADD COLUMN "repeat_sequence" INTEGER;
ALTER TABLE "tasks" ADD COLUMN "repeat_carry_count" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "tasks_repeat_rule_id_idx" ON "tasks"("repeat_rule_id");
CREATE INDEX "tasks_repeat_scheduled_for_idx" ON "tasks"("repeat_scheduled_for");
CREATE UNIQUE INDEX "tasks_repeat_rule_id_repeat_scheduled_for_key" ON "tasks"("repeat_rule_id", "repeat_scheduled_for");

ALTER TABLE "task_repeat_rules" ADD CONSTRAINT "task_repeat_rules_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "task_repeat_rules" ADD CONSTRAINT "task_repeat_rules_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_repeat_rules" ADD CONSTRAINT "task_repeat_rules_source_task_id_fkey" FOREIGN KEY ("source_task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_repeat_rule_id_fkey" FOREIGN KEY ("repeat_rule_id") REFERENCES "task_repeat_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
