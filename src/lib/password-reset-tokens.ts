import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const PASSWORD_RESET_TOKEN_BYTES = 32;
export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export function createPasswordResetToken() {
  return randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString("base64url");
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function passwordResetTokenHashesEqual(a: string, b: string) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function getPasswordResetExpiry(now = new Date()) {
  return new Date(now.getTime() + PASSWORD_RESET_TOKEN_TTL_MS);
}
