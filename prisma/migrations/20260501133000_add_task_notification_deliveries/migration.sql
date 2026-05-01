ALTER TABLE "tasks" ADD COLUMN "due_reminder_time" VARCHAR(5);

CREATE TABLE "task_notification_subscriptions" (
    "id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_notification_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "task_notification_deliveries" (
    "id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "kind" VARCHAR(40) NOT NULL,
    "dedupe_key" VARCHAR(160) NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "claimed_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_notification_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "task_notification_subscriptions_task_id_user_id_key" ON "task_notification_subscriptions"("task_id", "user_id");
CREATE INDEX "task_notification_subscriptions_user_id_idx" ON "task_notification_subscriptions"("user_id");

CREATE UNIQUE INDEX "task_notification_deliveries_dedupe_key_key" ON "task_notification_deliveries"("dedupe_key");
CREATE UNIQUE INDEX "task_notification_deliveries_task_id_user_id_kind_key" ON "task_notification_deliveries"("task_id", "user_id", "kind");
CREATE INDEX "task_notification_deliveries_user_id_idx" ON "task_notification_deliveries"("user_id");
CREATE INDEX "task_notification_deliveries_status_scheduled_at_idx" ON "task_notification_deliveries"("status", "scheduled_at");
CREATE INDEX "task_notification_deliveries_task_id_idx" ON "task_notification_deliveries"("task_id");

ALTER TABLE "task_notification_subscriptions" ADD CONSTRAINT "task_notification_subscriptions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_notification_subscriptions" ADD CONSTRAINT "task_notification_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_notification_deliveries" ADD CONSTRAINT "task_notification_deliveries_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_notification_deliveries" ADD CONSTRAINT "task_notification_deliveries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
