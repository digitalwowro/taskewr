import assert from "node:assert/strict";
import test from "node:test";

import { PasswordResetRepository } from "@/data/prisma/repositories/password-reset-repository";

test("consumeTokenAndUpdatePassword updates one unused token and bumps session version", async () => {
  const now = new Date("2026-05-01T10:00:00.000Z");
  let tokenUpdateWhere: unknown = null;
  let userUpdateData: unknown = null;
  let invalidateWhere: unknown = null;
  const repository = new PasswordResetRepository({
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        passwordResetToken: {
          findUnique: async () => ({
            id: 5,
            userId: 12,
            tokenHash: "hash",
            expiresAt: new Date("2026-05-01T11:00:00.000Z"),
            usedAt: null,
            user: {
              id: 12,
              deactivatedAt: null,
            },
          }),
          updateMany: async (args: { where: unknown }) => {
            if (!tokenUpdateWhere) {
              tokenUpdateWhere = args.where;
              return { count: 1 };
            }

            invalidateWhere = args.where;
            return { count: 1 };
          },
        },
        user: {
          update: async (args: { data: unknown }) => {
            userUpdateData = args.data;
          },
        },
      }),
  } as never);

  const result = await repository.consumeTokenAndUpdatePassword({
    tokenHash: "hash",
    passwordHash: "password-hash",
    now,
  });

  assert.deepEqual(result, { userId: 12 });
  assert.deepEqual(tokenUpdateWhere, { id: 5, usedAt: null });
  assert.deepEqual(userUpdateData, {
    passwordHash: "password-hash",
    sessionVersion: {
      increment: 1,
    },
  });
  assert.deepEqual(invalidateWhere, { userId: 12, usedAt: null });
});

test("consumeTokenAndUpdatePassword rejects used tokens without updating the user", async () => {
  let userUpdateCount = 0;
  const repository = new PasswordResetRepository({
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        passwordResetToken: {
          findUnique: async () => ({
            id: 5,
            userId: 12,
            expiresAt: new Date("2026-05-01T11:00:00.000Z"),
            usedAt: new Date("2026-05-01T09:00:00.000Z"),
            user: {
              id: 12,
              deactivatedAt: null,
            },
          }),
        },
        user: {
          update: async () => {
            userUpdateCount += 1;
          },
        },
      }),
  } as never);

  const result = await repository.consumeTokenAndUpdatePassword({
    tokenHash: "hash",
    passwordHash: "password-hash",
    now: new Date("2026-05-01T10:00:00.000Z"),
  });

  assert.equal(result, null);
  assert.equal(userUpdateCount, 0);
});
