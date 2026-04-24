import test from "node:test";
import assert from "node:assert/strict";

import {
  createSessionToken,
  hashPassword,
  parseSessionToken,
  verifyPassword,
} from "@/lib/auth";
import type { SessionPayload } from "@/types/auth";

test("session tokens round-trip valid payloads", () => {
  const payload: SessionPayload = {
    userId: 7,
    workspaceId: 3,
    workspaceRole: "owner",
    timezone: "Europe/Bucharest",
    issuedAt: 1_775_200_000_000,
  };

  const token = createSessionToken(payload);

  assert.deepEqual(parseSessionToken(token), payload);
});

test("session token parsing rejects tampered payloads", () => {
  const payload: SessionPayload = {
    userId: 7,
    workspaceId: 3,
    workspaceRole: "owner",
    timezone: "Europe/Bucharest",
    issuedAt: 1_775_200_000_000,
  };

  const token = createSessionToken(payload);
  const [encodedPayload, encodedSignature] = token.split(".");
  const tamperedPayload = Buffer.from(
    JSON.stringify({ ...payload, userId: 9 }),
    "utf8",
  )
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  assert.equal(parseSessionToken(`${tamperedPayload}.${encodedSignature}`), null);
  assert.equal(parseSessionToken(`${encodedPayload}.tampered`), null);
});

test("password hashing and verification work for matching credentials", () => {
  const hash = hashPassword("correct horse battery staple");

  assert.equal(verifyPassword("correct horse battery staple", hash), true);
  assert.equal(verifyPassword("wrong password", hash), false);
});

test("password verification rejects malformed hashes", () => {
  assert.equal(verifyPassword("anything", null), false);
  assert.equal(verifyPassword("anything", ""), false);
  assert.equal(verifyPassword("anything", "bad-format"), false);
});
