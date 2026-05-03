import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { ValidationError } from "@/domain/common/errors";
import {
  assertTaskAttachmentFile,
  TaskAttachmentStorage,
} from "@/server/services/task-attachment-storage";

test("TaskAttachmentStorage writes files under generated storage keys", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "taskewr-attachments-"));
  const storage = new TaskAttachmentStorage({ storageDir: dir, maxBytes: 100 });

  try {
    const stored = await storage.store(10, {
      name: "../notes.txt",
      type: "text/plain",
      size: 4,
      arrayBuffer: async () => new TextEncoder().encode("test").buffer,
    });

    assert.equal(stored.originalFileName, "notes.txt");
    assert.equal(stored.mimeType, "text/plain");
    assert.equal(stored.sizeBytes, 4);
    assert.match(stored.storageKey, /^task-10\/.+\.txt$/);
    assert.equal((await readFile(path.join(dir, stored.storageKey))).toString("utf8"), "test");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("TaskAttachmentStorage clamps user-provided metadata to database limits", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "taskewr-attachments-"));
  const storage = new TaskAttachmentStorage({ storageDir: dir, maxBytes: 100 });

  try {
    const stored = await storage.store(10, {
      name: `${"a".repeat(300)}.txt`,
      type: `${"text/".padEnd(160, "x")}`,
      size: 4,
      arrayBuffer: async () => new TextEncoder().encode("test").buffer,
    });

    assert.equal(stored.originalFileName.length, 255);
    assert.equal(stored.originalFileName.endsWith(".txt"), true);
    assert.equal(stored.mimeType?.length, 120);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("TaskAttachmentStorage rejects oversized files", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "taskewr-attachments-"));
  const storage = new TaskAttachmentStorage({ storageDir: dir, maxBytes: 3 });

  try {
    await assert.rejects(
      () => storage.store(10, {
        name: "notes.txt",
        type: "text/plain",
        size: 4,
        arrayBuffer: async () => new TextEncoder().encode("test").buffer,
      }),
      (error) => error instanceof ValidationError && error.code === "task_attachment_too_large",
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("assertTaskAttachmentFile rejects missing files", () => {
  assert.throws(
    () => assertTaskAttachmentFile(null),
    (error) => error instanceof ValidationError && error.code === "task_attachment_file_required",
  );
});
