import assert from "node:assert/strict";
import test from "node:test";

import { taskTimeEntryMutationSchema } from "@/domain/tasks/schemas";

test("taskTimeEntryMutationSchema accepts hours and minutes", () => {
  assert.deepEqual(taskTimeEntryMutationSchema.parse({
    hours: 2,
    minutes: 30,
    userId: 7,
  }), {
    hours: 2,
    minutes: 30,
    userId: 7,
  });

  assert.deepEqual(taskTimeEntryMutationSchema.parse({
    hours: 0,
    minutes: 45,
  }), {
    hours: 0,
    minutes: 45,
  });
});

test("taskTimeEntryMutationSchema rejects zero duration and invalid ranges", () => {
  assert.throws(() => taskTimeEntryMutationSchema.parse({
    hours: 0,
    minutes: 0,
  }));

  assert.throws(() => taskTimeEntryMutationSchema.parse({
    hours: -1,
    minutes: 15,
  }));

  assert.throws(() => taskTimeEntryMutationSchema.parse({
    hours: 1,
    minutes: 60,
  }));
});
