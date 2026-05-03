import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { ValidationError } from "@/domain/common/errors";
import { getTaskAttachmentStorageConfig } from "@/lib/env";

export type TaskAttachmentFileInput = {
  name: string;
  type?: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export type StoredTaskAttachment = {
  originalFileName: string;
  storageKey: string;
  mimeType: string | null;
  sizeBytes: number;
};

export function assertTaskAttachmentFile(value: unknown): File {
  if (!(value instanceof File)) {
    throw new ValidationError("Attachment file is required.", "task_attachment_file_required");
  }

  return value;
}

export class TaskAttachmentStorage {
  constructor(
    private readonly config = getTaskAttachmentStorageConfig(),
  ) {}

  get maxBytes() {
    return this.config.maxBytes;
  }

  async store(taskId: number, file: TaskAttachmentFileInput): Promise<StoredTaskAttachment> {
    if (file.size > this.config.maxBytes) {
      throw new ValidationError(
        `Attachments must be ${formatBytes(this.config.maxBytes)} or smaller.`,
        "task_attachment_too_large",
      );
    }

    const originalFileName = sanitizeFileName(file.name);
    const storageKey = buildStorageKey(taskId, originalFileName);
    const targetPath = this.resolveStoragePath(storageKey);
    const bytes = Buffer.from(await file.arrayBuffer());

    if (bytes.byteLength !== file.size) {
      throw new ValidationError("Attachment upload was incomplete.", "task_attachment_invalid_size");
    }

    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, bytes);

    return {
      originalFileName,
      storageKey,
      mimeType: sanitizeMimeType(file.type),
      sizeBytes: bytes.byteLength,
    };
  }

  async read(storageKey: string) {
    return readFile(this.resolveStoragePath(storageKey));
  }

  async delete(storageKey: string) {
    await rm(this.resolveStoragePath(storageKey), { force: true });
  }

  private resolveStoragePath(storageKey: string) {
    const storageRoot = path.resolve(process.cwd(), this.config.storageDir);
    const targetPath = path.resolve(storageRoot, storageKey);

    if (targetPath !== storageRoot && !targetPath.startsWith(`${storageRoot}${path.sep}`)) {
      throw new ValidationError("Invalid attachment storage key.", "task_attachment_invalid_storage_key");
    }

    return targetPath;
  }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kib = bytes / 1024;

  if (kib < 1024) {
    return `${formatSizeNumber(kib)} KB`;
  }

  const mib = kib / 1024;
  return `${formatSizeNumber(mib)} MB`;
}

function formatSizeNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function sanitizeFileName(value: string) {
  const baseName = path.basename(value.trim()).replace(/[^\w .@()+,-]/g, "_");
  const collapsed = baseName.replace(/\s+/g, " ").trim();
  const safeName = collapsed || "attachment";

  if (safeName.length <= 255) {
    return safeName;
  }

  const extension = path.extname(safeName).slice(0, 16);
  const stem = safeName.slice(0, 255 - extension.length);
  return `${stem}${extension}`;
}

function sanitizeMimeType(value?: string) {
  const mimeType = value?.trim();
  return mimeType ? mimeType.slice(0, 120) : null;
}

function buildStorageKey(taskId: number, originalFileName: string) {
  const extension = path.extname(originalFileName).slice(0, 16);
  return `task-${taskId}/${randomUUID()}${extension}`;
}
