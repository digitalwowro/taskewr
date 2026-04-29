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
    appRole: "admin",
    timezone: "Europe/Bucharest",
    issuedAt: Date.now(),
  };

  const token = createSessionToken(payload);

  assert.deepEqual(parseSessionToken(token), payload);
});

test("session token parsing rejects tampered payloads", () => {
  const payload: SessionPayload = {
    userId: 7,
    workspaceId: 3,
    workspaceRole: "owner",
    appRole: "admin",
    timezone: "Europe/Bucharest",
    issuedAt: Date.now(),
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

test("session token parsing rejects expired and far-future tokens", () => {
  const basePayload: SessionPayload = {
    userId: 7,
    workspaceId: 3,
    workspaceRole: "owner",
    appRole: "admin",
    timezone: "Europe/Bucharest",
    issuedAt: Date.now(),
  };

  const expiredToken = createSessionToken({
    ...basePayload,
    issuedAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
  });
  const futureToken = createSessionToken({
    ...basePayload,
    issuedAt: Date.now() + 1000 * 60 * 10,
  });

  assert.equal(parseSessionToken(expiredToken), null);
  assert.equal(parseSessionToken(futureToken), null);
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
