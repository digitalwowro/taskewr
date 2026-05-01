import "dotenv/config";

import { getNotificationWorkerConfig } from "@/lib/env";
import { db } from "@/lib/db";
import { TaskNotificationService } from "@/server/services/task-notification-service";

const service = new TaskNotificationService();
const config = getNotificationWorkerConfig();
let stopping = false;

function log(message: string, data?: Record<string, unknown>) {
  const payload = data ? ` ${JSON.stringify(data)}` : "";
  console.log(`[notification-worker] ${message}${payload}`);
}

async function runOnce() {
  const result = await service.processDueReminderBatch({
    batchSize: config.batchSize,
    maxAttempts: config.maxAttempts,
    claimTimeoutMs: config.claimTimeoutMs,
  });

  if (result.claimed > 0) {
    log("processed due reminder batch", result);
  }
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function shutdown(signal: string) {
  if (stopping) {
    return;
  }

  stopping = true;
  log(`received ${signal}, stopping`);
  await db.$disconnect();
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

async function main() {
  log("started", config);

  while (!stopping) {
    try {
      await runOnce();
    } catch (error) {
      console.error("[notification-worker] batch failed", error);
    }

    if (!stopping) {
      await sleep(config.pollIntervalMs);
    }
  }

  log("stopped");
}

void main().catch(async (error) => {
  console.error("[notification-worker] fatal error", error);
  await db.$disconnect();
  process.exitCode = 1;
});
