import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { getSessionSecret } from "@/lib/env";
import type { SessionPayload } from "@/types/auth";

export const SESSION_COOKIE_NAME = "taskewr_session";

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4 || 4)) % 4;
  return Buffer.from(normalized + "=".repeat(padding), "base64");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) {
    return false;
  }

  const [salt, expectedHash] = storedHash.split(":");

  if (!salt || !expectedHash) {
    return false;
  }

  const actualHash = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (actualHash.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualHash, expectedBuffer);
}

export function createSessionToken(payload: SessionPayload) {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest();

  return `${encodedPayload}.${toBase64Url(signature)}`;
}

export function parseSessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, encodedSignature] = token.split(".");

  if (!encodedPayload || !encodedSignature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest();
  const actualSignature = fromBase64Url(encodedSignature);

  if (expectedSignature.length !== actualSignature.length) {
    return null;
  }

  if (!timingSafeEqual(expectedSignature, actualSignature)) {
    return null;
  }

  try {
    return JSON.parse(fromBase64Url(encodedPayload).toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
}
